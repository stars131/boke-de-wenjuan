import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildTopicAnalytics } from "@/lib/analytics";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalResponses,
    todayResponses,
    storyCount,
    contactableCount,
    highValueStoryCount,
    guestResponseCount,
    responses
  ] = await Promise.all([
    prisma.surveyResponse.count(),
    prisma.surveyResponse.count({
      where: {
        createdAt: {
          gte: startOfToday
        }
      }
    }),
    prisma.surveyResponse.count({
      where: {
        personalStory: {
          not: null
        }
      }
    }),
    prisma.surveyResponse.count({
      where: {
        OR: [
          {
            contactInfoEncrypted: {
              not: null
            }
          },
          {
            participationWillingness: {
              hasSome: ["接受文字访谈", "接受语音访谈", "接受视频连线", "线下参与录制"]
            }
          }
        ]
      }
    }),
    prisma.storyReview.count({
      where: {
        isHighValue: true
      }
    }),
    prisma.guestSurveyResponse.count(),
    prisma.surveyResponse.findMany({
      include: {
        topicRatings: true
      }
    })
  ]);

  const analytics = buildTopicAnalytics(responses);
  const averageSelectedTopics =
    totalResponses === 0
      ? 0
      : responses.reduce((sum, response) => sum + response.selectedTopics.length, 0) / totalResponses;
  const topTopic = analytics[0]?.heatScore
    ? {
        topicId: analytics[0].topicId,
        title: analytics[0].title,
        heatScore: analytics[0].heatScore
      }
    : null;

  return NextResponse.json({
    totalResponses,
    todayResponses,
    completionRate: totalResponses > 0 ? 1 : 0,
    averageSelectedTopics,
    storyCount,
    contactableCount,
    highValueStoryCount,
    guestResponseCount,
    topTopic
  });
}
