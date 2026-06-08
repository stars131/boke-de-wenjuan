-- CreateTable
CREATE TABLE "GuestSurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "anonymousSessionId" TEXT,
    "guestName" TEXT,
    "guestIdentity" TEXT NOT NULL,
    "organization" TEXT,
    "relationshipToTopics" TEXT[],
    "selectedTopics" TEXT[],
    "customTopics" TEXT,
    "strongestTopic" TEXT NOT NULL,
    "talkAngles" TEXT[],
    "keyStory" TEXT,
    "questionsWantToDiscuss" TEXT,
    "boundaries" TEXT,
    "sensitiveTopics" TEXT[],
    "preferredFormats" TEXT[],
    "availability" TEXT,
    "preferredContactMethod" TEXT,
    "contactInfoEncrypted" TEXT,
    "contactInfoHash" TEXT,
    "consentToFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "referrer" TEXT,
    "ipHash" TEXT,
    "userAgentHash" TEXT,

    CONSTRAINT "GuestSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestSurveyResponse_createdAt_idx" ON "GuestSurveyResponse"("createdAt");

-- CreateIndex
CREATE INDEX "GuestSurveyResponse_anonymousSessionId_idx" ON "GuestSurveyResponse"("anonymousSessionId");

-- CreateIndex
CREATE INDEX "GuestSurveyResponse_strongestTopic_idx" ON "GuestSurveyResponse"("strongestTopic");

-- CreateIndex
CREATE INDEX "GuestSurveyResponse_contactInfoHash_idx" ON "GuestSurveyResponse"("contactInfoHash");
