import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const topicId = url.searchParams.get("topicId") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const minEmotionIntensity = Number(url.searchParams.get("minEmotionIntensity") || "0");
  const q = url.searchParams.get("q")?.trim();
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Math.min(Number(url.searchParams.get("pageSize") || "20"), 100);
  const skip = (page - 1) * pageSize;

  const where: Prisma.SurveyResponseWhereInput = {
    personalStory: {
      not: null
    },
    ...(topicId
      ? {
          storyRelatedTopic: topicId
        }
      : {}),
    ...(minEmotionIntensity
      ? {
          storyEmotionIntensity: {
            gte: minEmotionIntensity
          }
        }
      : {}),
    ...(q
      ? {
          OR: [
            {
              personalStory: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              nickname: {
                contains: q,
                mode: "insensitive"
              }
            }
          ]
        }
      : {}),
    ...(status
      ? {
          review: {
            status
          }
        }
      : {})
  };

  const [total, items] = await Promise.all([
    prisma.surveyResponse.count({ where }),
    prisma.surveyResponse.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: pageSize,
      include: {
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
      storyRelatedTopic: item.storyRelatedTopic,
      personalStory: item.personalStory,
      storyEmotionIntensity: item.storyEmotionIntensity,
      storyUsagePreference: item.storyUsagePreference,
      participationWillingness: item.participationWillingness,
      hasContactInfo: Boolean(item.contactInfoEncrypted),
      review: item.review
        ? {
            status: item.review.status,
            tags: item.review.tags,
            isHighValue: item.review.isHighValue,
            isPotentialGuest: item.review.isPotentialGuest,
            riskLevel: item.review.riskLevel,
            note: item.review.note
          }
        : null
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
