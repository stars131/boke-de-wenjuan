import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isQuestionnaireKind,
  normalizeQuestionnaireConfig,
  type QuestionnaireKind
} from "@/lib/questionnaire-config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("type");

  if (!isQuestionnaireKind(key)) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_QUESTIONNAIRE_TYPE"
      },
      { status: 400 }
    );
  }

  const stored = await prisma.questionnaireConfig.findUnique({
    where: {
      key
    }
  });

  return NextResponse.json(normalizeQuestionnaireConfig(key as QuestionnaireKind, stored));
}
