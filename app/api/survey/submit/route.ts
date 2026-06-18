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
import { FOLLOW_UP_QUESTION_IDS } from "@/lib/follow-ups";
import {
  normalizeQuestionnaireConfig,
  type AudienceQuestionnaireSettings
} from "@/lib/questionnaire-config";

const FOLLOW_UP_ID_SET = new Set<string>(FOLLOW_UP_QUESTION_IDS);

/** 只保留已知问题的回答，并丢弃空值，避免存入任意键或空白内容。 */
function sanitizeFollowUpAnswers(
  answers: Record<string, string | string[]> | undefined
): Record<string, string | string[]> | undefined {
  if (!answers) {
    return undefined;
  }

  const cleaned: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!FOLLOW_UP_ID_SET.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      const items = value.map((item) => item.trim()).filter(Boolean);
      if (items.length) {
        cleaned[key] = items;
      }
    } else if (typeof value === "string" && value.trim()) {
      cleaned[key] = value.trim();
    }
  }

  return Object.keys(cleaned).length ? cleaned : undefined;
}

function zodErrorToFields(error: { issues: { path: (string | number)[]; message: string }[] }) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join(".") || "form", issue.message]));
}

function normalizedNickname(nickname: string) {
  return nickname.trim().replace(/\s+/g, " ").toLowerCase();
}

function validationError(message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message
      }
    },
    { status: 400 }
  );
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
  const questionnaireConfig = normalizeQuestionnaireConfig(
    "audience",
    await prisma.questionnaireConfig.findUnique({
      where: {
        key: "audience"
      }
    })
  );
  const settings = questionnaireConfig.settings as AudienceQuestionnaireSettings;
  const enabledTopicIds = new Set(questionnaireConfig.enabledTopicIds);

  if (
    data.selectedTopics.length < settings.minTopicSelections ||
    data.selectedTopics.length > settings.maxTopicSelections
  ) {
    return validationError(
      `请选择 ${settings.minTopicSelections}-${settings.maxTopicSelections} 个主题。`
    );
  }

  if (
    data.selectedTopics.some((topicId) => !enabledTopicIds.has(topicId)) ||
    data.topicRatings.some((rating) => !enabledTopicIds.has(rating.topicId)) ||
    !enabledTopicIds.has(data.topPriorityTopic) ||
    (data.privateButWantToHearTopic &&
      data.privateButWantToHearTopic !== "没有" &&
      !enabledTopicIds.has(data.privateButWantToHearTopic)) ||
    (data.storyRelatedTopic && !enabledTopicIds.has(data.storyRelatedTopic))
  ) {
    return validationError("提交内容里包含当前问卷未启用的主题。");
  }

  const userAgentHash = hashValue(getRequestUserAgent(request));
  const contactInfoEncrypted = data.contactInfo ? encryptContactInfo(data.contactInfo) : null;
  const contactInfoHash = data.contactInfo ? hashContactInfo(data.contactInfo) : null;
  const participantNickname = data.nickname.trim().replace(/\s+/g, " ");
  const participantNormalizedNickname = normalizedNickname(participantNickname);
  const followUpAnswers = sanitizeFollowUpAnswers(data.followUpAnswers);

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

      const participant = await tx.participant.upsert({
        where: {
          normalizedNickname: participantNormalizedNickname
        },
        update: {
          nickname: participantNickname
        },
        create: {
          nickname: participantNickname,
          normalizedNickname: participantNormalizedNickname
        },
        select: {
          id: true
        }
      });

      const created = await tx.surveyResponse.create({
        data: {
          participantId: participant.id,
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
          followUpAnswers: followUpAnswers ?? Prisma.JsonNull,
          contactInfoEncrypted,
          contactInfoHash,
          nickname: participantNickname,
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
