import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildTopicAnalytics } from "@/lib/analytics";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const responses = await prisma.surveyResponse.findMany({
    include: {
      topicRatings: true
    }
  });

  return NextResponse.json(buildTopicAnalytics(responses));
}
