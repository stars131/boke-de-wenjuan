import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { RISK_LEVEL_OPTIONS, STORY_STATUS_OPTIONS } from "@/lib/options";

const updateStoryReviewSchema = z.object({
  status: z.enum(STORY_STATUS_OPTIONS).optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
  isHighValue: z.boolean().optional(),
  isPotentialGuest: z.boolean().optional(),
  riskLevel: z.enum(RISK_LEVEL_OPTIONS).optional(),
  note: z.string().max(2000).optional()
});

export async function PATCH(
  request: Request,
  {
    params
  }: {
    params: {
      responseId: string;
    };
  }
) {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateStoryReviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "VALIDATION_ERROR",
        fields: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const review = await prisma.storyReview.upsert({
    where: {
      responseId: params.responseId
    },
    create: {
      responseId: params.responseId,
      status: parsed.data.status || "new",
      tags: parsed.data.tags || [],
      isHighValue: parsed.data.isHighValue || false,
      isPotentialGuest: parsed.data.isPotentialGuest || false,
      riskLevel: parsed.data.riskLevel || "normal",
      note: parsed.data.note,
      reviewedAt: new Date()
    },
    update: {
      ...parsed.data,
      reviewedAt: new Date()
    }
  });

  return NextResponse.json({
    ok: true,
    review
  });
}
