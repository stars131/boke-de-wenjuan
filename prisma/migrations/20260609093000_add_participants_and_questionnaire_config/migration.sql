-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nickname" TEXT NOT NULL,
    "normalizedNickname" TEXT NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireConfig" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "introBadge" TEXT,
    "introText" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "enabledTopicIds" TEXT[],
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireConfig_pkey" PRIMARY KEY ("key")
);

-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN "participantId" TEXT;

-- AlterTable
ALTER TABLE "GuestSurveyResponse" ADD COLUMN "participantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_nickname_key" ON "Participant"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_normalizedNickname_key" ON "Participant"("normalizedNickname");

-- CreateIndex
CREATE INDEX "Participant_createdAt_idx" ON "Participant"("createdAt");

-- CreateIndex
CREATE INDEX "SurveyResponse_participantId_idx" ON "SurveyResponse"("participantId");

-- CreateIndex
CREATE INDEX "SurveyResponse_nickname_idx" ON "SurveyResponse"("nickname");

-- CreateIndex
CREATE INDEX "GuestSurveyResponse_participantId_idx" ON "GuestSurveyResponse"("participantId");

-- CreateIndex
CREATE INDEX "GuestSurveyResponse_guestName_idx" ON "GuestSurveyResponse"("guestName");

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSurveyResponse" ADD CONSTRAINT "GuestSurveyResponse_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
