import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTopicById } from "@/lib/topics";

const lookupSchema = z.object({
  nickname: z.string().trim().min(2).max(80)
});

function topicTitle(topicId: string | null | undefined) {
  return getTopicById(topicId)?.title || topicId || "";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = lookupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "请输入至少 2 个字符的昵称。"
      },
      { status: 400 }
    );
  }

  const nickname = parsed.data.nickname;
  const [audience, guests] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: {
        nickname: {
          equals: nickname,
          mode: "insensitive"
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    }),
    prisma.guestSurveyResponse.findMany({
      where: {
        guestName: {
          equals: nickname,
          mode: "insensitive"
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    })
  ]);

  return NextResponse.json({
    ok: true,
    nickname,
    audience: audience.map((item) => ({
      responseId: item.id,
      createdAt: item.createdAt.toISOString(),
      nickname: item.nickname,
      identityStatus: item.identityStatus,
      selectedTopics: item.selectedTopics.map((topicId) => ({
        id: topicId,
        title: topicTitle(topicId)
      })),
      topPriorityTopic: {
        id: item.topPriorityTopic,
        title: topicTitle(item.topPriorityTopic)
      },
      hasStory: Boolean(item.personalStory),
      participationWillingness: item.participationWillingness,
      additionalSuggestions: item.additionalSuggestions
    })),
    guests: guests.map((item) => ({
      responseId: item.id,
      createdAt: item.createdAt.toISOString(),
      guestName: item.guestName,
      guestIdentity: item.guestIdentity,
      organization: item.organization,
      selectedTopics: item.selectedTopics.map((topicId) => ({
        id: topicId,
        title: topicTitle(topicId)
      })),
      strongestTopic: {
        id: item.strongestTopic,
        title: topicTitle(item.strongestTopic)
      },
      talkAngles: item.talkAngles,
      consentToFollowUp: item.consentToFollowUp
    }))
  });
}
