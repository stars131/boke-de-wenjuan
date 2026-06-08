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
    prisma.guestSurveyResponse.count(),
    prisma.guestSurveyResponse.findMany({
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: pageSize
    })
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      responseId: item.id,
      createdAt: item.createdAt.toISOString(),
      guestName: item.guestName,
      guestIdentity: item.guestIdentity,
      organization: item.organization,
      relationshipToTopics: item.relationshipToTopics,
      selectedTopics: item.selectedTopics,
      customTopics: item.customTopics,
      strongestTopic: item.strongestTopic,
      talkAngles: item.talkAngles,
      keyStory: item.keyStory,
      questionsWantToDiscuss: item.questionsWantToDiscuss,
      boundaries: item.boundaries,
      sensitiveTopics: item.sensitiveTopics,
      preferredFormats: item.preferredFormats,
      availability: item.availability,
      preferredContactMethod: item.preferredContactMethod,
      hasContactInfo: Boolean(item.contactInfoEncrypted),
      consentToFollowUp: item.consentToFollowUp
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
