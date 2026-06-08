import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getTopicById } from "@/lib/topics";
import { submitSurveySchema } from "@/lib/validation";
import {
  encryptContactInfo,
  getRequestIp,
  getRequestUserAgent,
  hashContactInfo,
  hashValue
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { isPotentialGuestLead } from "@/lib/analytics";

function zodErrorToFields(error: { issues: { path: (string | number)[]; message: string }[] }) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join(".") || "form", issue.message]));
}

export async function POST(request: Request) {
  const ipHash = hashValue(getRequestIp(request));
  const rate = checkRateLimit(`submit:${ipHash || "unknown"}`, {
    limit: 8,
    windowMs: 10 * 60 * 1000
  });

  if (!rate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "提交有点频繁，请稍后再试。"
        }
      },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "请求格式不正确。"
        }
      },
      { status: 400 }
    );
  }

  const parsed = submitSurveySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "请检查问卷里还没填完整的地方。",
          fields: zodErrorToFields(parsed.error)
        }
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const userAgentHash = hashValue(getRequestUserAgent(request));
  const contactInfoEncrypted = data.contactInfo ? encryptContactInfo(data.contactInfo) : null;
  const contactInfoHash = data.contactInfo ? hashContactInfo(data.contactInfo) : null;

  try {
    const response = await prisma.$transaction(async (tx) => {
      const existing = data.anonymousSessionId
        ? await tx.surveyResponse.findFirst({
            where: {
              anonymousSessionId: data.anonymousSessionId,
              createdAt: {
                gte: new Date(Date.now() - 60 * 60 * 1000)
              }
            },
            select: {
              id: true
            }
          })
        : null;

      if (existing) {
        throw new Prisma.PrismaClientKnownRequestError("Duplicate submission", {
          code: "P2002",
          clientVersion: Prisma.prismaVersion.client
        });
      }

      const created = await tx.surveyResponse.create({
        data: {
          anonymousSessionId: data.anonymousSessionId,
          identityStatus: data.identityStatus,
          currentStates: data.currentStates,
          contentPlatforms: data.contentPlatforms,
          preferredFormats: data.preferredFormats,
          selectedTopics: data.selectedTopics,
          topPriorityTopic: data.topPriorityTopic,
          privateButWantToHearTopic: data.privateButWantToHearTopic,
          privateButWantToHearReason: data.privateButWantToHearReason,
          personalStory: data.personalStory,
          storyRelatedTopic: data.storyRelatedTopic,
          storyUsagePreference: data.storyUsagePreference,
          storyEmotionIntensity: data.storyEmotionIntensity,
          participationWillingness: data.participationWillingness,
          contactInfoEncrypted,
          contactInfoHash,
          nickname: data.nickname,
          additionalSuggestions: data.additionalSuggestions,
          source: data.source,
          referrer: data.referrer,
          ipHash,
          userAgentHash,
          topicRatings: {
            create: data.topicRatings.map((rating) => ({
              topicId: rating.topicId,
              interestScore: rating.interestScore,
              resonanceScore: rating.resonanceScore,
              discussionScore: rating.discussionScore
            }))
          }
        }
      });

      const potentialGuest = isPotentialGuestLead({
        participationWillingness: data.participationWillingness,
        contactInfo: data.contactInfo,
        personalStory: data.personalStory,
        storyEmotionIntensity: data.storyEmotionIntensity
      });

      if (data.personalStory || potentialGuest) {
        await tx.storyReview.create({
          data: {
            responseId: created.id,
            isPotentialGuest: potentialGuest,
            riskLevel: potentialGuest ? "sensitive" : "normal",
            tags: []
          }
        });
      }

      return created;
    });

    const recommendedTopic = getTopicById(data.topPriorityTopic);

    return NextResponse.json({
      ok: true,
      responseId: response.id,
      recommendedTopic: recommendedTopic
        ? {
            id: recommendedTopic.id,
            title: recommendedTopic.title,
            message: `你最想看的方向是：${recommendedTopic.title}。${recommendedTopic.successMessage} 如果这一期上线，我们会重点聊：${recommendedTopic.recommendedEpisode}`
          }
        : null
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DUPLICATE_SUBMISSION",
            message: "这个浏览器刚刚已经提交过一次。你可以稍后再补充故事。"
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SERVER_ERROR",
          message: "提交暂时失败，请稍后再试。"
        }
      },
      { status: 500 }
    );
  }
}
