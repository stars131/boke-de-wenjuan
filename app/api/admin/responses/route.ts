import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Math.min(Number(url.searchParams.get("pageSize") || "20"), 100);
  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.surveyResponse.count(),
    prisma.surveyResponse.findMany({
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: pageSize,
      include: {
        topicRatings: true,
        review: true
      }
    })
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      responseId: item.id,
      createdAt: item.createdAt.toISOString(),
      nickname: item.nickname,
      identityStatus: item.identityStatus,
      currentStates: item.currentStates,
      selectedTopics: item.selectedTopics,
      topPriorityTopic: item.topPriorityTopic,
      privateButWantToHearTopic: item.privateButWantToHearTopic,
      personalStory: item.personalStory,
      storyRelatedTopic: item.storyRelatedTopic,
      storyEmotionIntensity: item.storyEmotionIntensity,
      storyUsagePreference: item.storyUsagePreference,
      participationWillingness: item.participationWillingness,
      followUpAnswers: item.followUpAnswers,
      hasContactInfo: Boolean(item.contactInfoEncrypted),
      additionalSuggestions: item.additionalSuggestions,
      review: item.review
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
