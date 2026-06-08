import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  encryptContactInfo,
  getRequestIp,
  getRequestUserAgent,
  hashContactInfo,
  hashValue
} from "@/lib/security";
import { getTopicById } from "@/lib/topics";
import { submitGuestSurveySchema } from "@/lib/validation";

function zodErrorToFields(error: { issues: { path: (string | number)[]; message: string }[] }) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join(".") || "form", issue.message]));
}

export async function POST(request: Request) {
  const ipHash = hashValue(getRequestIp(request));
  const rate = checkRateLimit(`guest-submit:${ipHash || "unknown"}`, {
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

  const payload = await request.json().catch(() => null);
  const parsed = submitGuestSurveySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "请检查嘉宾问卷里还没填完整的地方。",
          fields: zodErrorToFields(parsed.error)
        }
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const contactInfoEncrypted = data.contactInfo ? encryptContactInfo(data.contactInfo) : null;
  const contactInfoHash = data.contactInfo ? hashContactInfo(data.contactInfo) : null;

  try {
    const existing = data.anonymousSessionId
      ? await prisma.guestSurveyResponse.findFirst({
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
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DUPLICATE_SUBMISSION",
            message: "这个浏览器刚刚已经提交过一次嘉宾问卷。"
          }
        },
        { status: 409 }
      );
    }

    const created = await prisma.guestSurveyResponse.create({
      data: {
        anonymousSessionId: data.anonymousSessionId,
        guestName: data.guestName,
        guestIdentity: data.guestIdentity,
        organization: data.organization,
        relationshipToTopics: data.relationshipToTopics,
        selectedTopics: data.selectedTopics,
        customTopics: data.customTopics,
        strongestTopic: data.strongestTopic,
        talkAngles: data.talkAngles,
        keyStory: data.keyStory,
        questionsWantToDiscuss: data.questionsWantToDiscuss,
        boundaries: data.boundaries,
        sensitiveTopics: data.sensitiveTopics,
        preferredFormats: data.preferredFormats,
        availability: data.availability,
        preferredContactMethod: data.preferredContactMethod,
        contactInfoEncrypted,
        contactInfoHash,
        consentToFollowUp: data.consentToFollowUp,
        source: data.source,
        referrer: data.referrer,
        ipHash,
        userAgentHash: hashValue(getRequestUserAgent(request))
      }
    });

    const topic = getTopicById(data.strongestTopic);

    return NextResponse.json({
      ok: true,
      responseId: created.id,
      strongestTopic: topic
        ? {
            id: topic.id,
            title: topic.title,
            message: `你最想展开的是：${topic.title}。后续沟通时，我们会优先围绕这个方向确认故事边界、可公开程度和适合的录制形式。`
          }
        : null
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DATABASE_ERROR",
            message: "嘉宾问卷暂时提交失败，请稍后再试。"
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SERVER_ERROR",
          message: "嘉宾问卷暂时提交失败，请稍后再试。"
        }
      },
      { status: 500 }
    );
  }
}
