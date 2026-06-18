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
import {
  normalizeQuestionnaireConfig,
  type GuestQuestionnaireSettings
} from "@/lib/questionnaire-config";

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
  const questionnaireConfig = normalizeQuestionnaireConfig(
    "guest",
    await prisma.questionnaireConfig.findUnique({
      where: {
        key: "guest"
      }
    })
  );
  const settings = questionnaireConfig.settings as GuestQuestionnaireSettings;
  const enabledTopicIds = new Set(questionnaireConfig.enabledTopicIds);

  if (
    data.selectedTopics.length < settings.minTopicSelections ||
    data.selectedTopics.length > settings.maxTopicSelections
  ) {
    return validationError(
      `请选择 ${settings.minTopicSelections}-${settings.maxTopicSelections} 个想聊的主题。`
    );
  }

  if (
    data.selectedTopics.some((topicId) => !enabledTopicIds.has(topicId)) ||
    !enabledTopicIds.has(data.strongestTopic)
  ) {
    return validationError("提交内容里包含当前嘉宾问卷未启用的主题。");
  }

  const contactInfoEncrypted = data.contactInfo ? encryptContactInfo(data.contactInfo) : null;
  const contactInfoHash = data.contactInfo ? hashContactInfo(data.contactInfo) : null;
  const participantNickname = data.guestName.trim().replace(/\s+/g, " ");
  const participantNormalizedNickname = normalizedNickname(participantNickname);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const existing = data.anonymousSessionId
        ? await tx.guestSurveyResponse.findFirst({
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

      return tx.guestSurveyResponse.create({
        data: {
          participantId: participant.id,
          anonymousSessionId: data.anonymousSessionId,
          guestName: participantNickname,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
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
