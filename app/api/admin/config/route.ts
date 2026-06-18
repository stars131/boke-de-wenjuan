import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_QUESTIONNAIRE_CONFIGS,
  isQuestionnaireKind,
  normalizeQuestionnaireConfig,
  type QuestionnaireKind
} from "@/lib/questionnaire-config";

const settingsSchema = z.record(z.unknown()).default({});

const updateConfigSchema = z.object({
  key: z.enum(["audience", "guest"]),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  introBadge: z.string().trim().min(1).max(120),
  introText: z.string().trim().min(1).max(2000),
  ctaLabel: z.string().trim().min(1).max(80),
  enabledTopicIds: z.array(z.string()).min(1).max(50),
  settings: settingsSchema
});

export async function GET() {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rows = await prisma.questionnaireConfig.findMany();
  const configs = (["audience", "guest"] as const).map((key) => {
    const stored = rows.find((row) => row.key === key);
    return normalizeQuestionnaireConfig(key, stored);
  });

  return NextResponse.json({ ok: true, configs });
}

export async function PATCH(request: Request) {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateConfigSchema.safeParse(payload);

  if (!parsed.success || !isQuestionnaireKind(parsed.data.key)) {
    return NextResponse.json(
      {
        ok: false,
        error: "VALIDATION_ERROR"
      },
      { status: 400 }
    );
  }

  const normalized = normalizeQuestionnaireConfig(parsed.data.key as QuestionnaireKind, parsed.data);
  const defaults = DEFAULT_QUESTIONNAIRE_CONFIGS[normalized.key];
  const saved = await prisma.questionnaireConfig.upsert({
    where: {
      key: normalized.key
    },
    update: {
      title: normalized.title,
      description: normalized.description,
      introBadge: normalized.introBadge,
      introText: normalized.introText,
      ctaLabel: normalized.ctaLabel,
      enabledTopicIds: normalized.enabledTopicIds,
      settings: normalized.settings as Prisma.InputJsonValue
    },
    create: {
      key: normalized.key,
      title: normalized.title || defaults.title,
      description: normalized.description || defaults.description,
      introBadge: normalized.introBadge || defaults.introBadge,
      introText: normalized.introText || defaults.introText,
      ctaLabel: normalized.ctaLabel || defaults.ctaLabel,
      enabledTopicIds: normalized.enabledTopicIds.length
        ? normalized.enabledTopicIds
        : defaults.enabledTopicIds,
      settings: normalized.settings as Prisma.InputJsonValue
    }
  });

  return NextResponse.json({
    ok: true,
    config: normalizeQuestionnaireConfig(normalized.key, saved)
  });
}
