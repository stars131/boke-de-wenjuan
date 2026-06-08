-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "anonymousSessionId" TEXT,
    "identityStatus" TEXT NOT NULL,
    "currentStates" TEXT[],
    "contentPlatforms" TEXT[],
    "preferredFormats" TEXT[],
    "selectedTopics" TEXT[],
    "topPriorityTopic" TEXT NOT NULL,
    "privateButWantToHearTopic" TEXT,
    "privateButWantToHearReason" TEXT,
    "personalStory" TEXT,
    "storyRelatedTopic" TEXT,
    "storyUsagePreference" TEXT,
    "storyEmotionIntensity" INTEGER,
    "participationWillingness" TEXT[],
    "contactInfoEncrypted" TEXT,
    "contactInfoHash" TEXT,
    "nickname" TEXT,
    "additionalSuggestions" TEXT,
    "source" TEXT,
    "referrer" TEXT,
    "ipHash" TEXT,
    "userAgentHash" TEXT,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicRating" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "interestScore" INTEGER NOT NULL,
    "resonanceScore" INTEGER NOT NULL,
    "discussionScore" INTEGER NOT NULL,

    CONSTRAINT "TopicRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryReview" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "tags" TEXT[],
    "isHighValue" BOOLEAN NOT NULL DEFAULT false,
    "isPotentialGuest" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT NOT NULL DEFAULT 'normal',
    "note" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurveyResponse_createdAt_idx" ON "SurveyResponse"("createdAt");

-- CreateIndex
CREATE INDEX "SurveyResponse_anonymousSessionId_idx" ON "SurveyResponse"("anonymousSessionId");

-- CreateIndex
CREATE INDEX "SurveyResponse_topPriorityTopic_idx" ON "SurveyResponse"("topPriorityTopic");

-- CreateIndex
CREATE INDEX "SurveyResponse_storyRelatedTopic_idx" ON "SurveyResponse"("storyRelatedTopic");

-- CreateIndex
CREATE INDEX "SurveyResponse_contactInfoHash_idx" ON "SurveyResponse"("contactInfoHash");

-- CreateIndex
CREATE INDEX "TopicRating_topicId_idx" ON "TopicRating"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicRating_responseId_topicId_key" ON "TopicRating"("responseId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryReview_responseId_key" ON "StoryReview"("responseId");

-- CreateIndex
CREATE INDEX "StoryReview_status_idx" ON "StoryReview"("status");

-- CreateIndex
CREATE INDEX "StoryReview_isHighValue_idx" ON "StoryReview"("isHighValue");

-- CreateIndex
CREATE INDEX "StoryReview_isPotentialGuest_idx" ON "StoryReview"("isPotentialGuest");

-- AddForeignKey
ALTER TABLE "TopicRating" ADD CONSTRAINT "TopicRating_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReview" ADD CONSTRAINT "StoryReview_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
