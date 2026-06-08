import { describe, expect, it } from "vitest";
import {
  calculateTopicHeatScore,
  getTopicPriority,
  isPotentialGuestLead
} from "@/lib/analytics";
import { decryptContactInfo, encryptContactInfo, hashContactInfo } from "@/lib/security";
import { submitGuestSurveySchema, submitSurveySchema } from "@/lib/validation";

const basePayload = {
  anonymousSessionId: "test-session",
  identityStatus: "大四 / 即将毕业",
  currentStates: ["正在找工作"],
  contentPlatforms: ["B站"],
  preferredFormats: ["45-65 分钟完整视频播客"],
  selectedTopics: [
    "identity-unloading",
    "job-search-self-worth",
    "advisor-thesis-anxiety"
  ],
  topicRatings: [
    {
      topicId: "identity-unloading",
      interestScore: 5,
      resonanceScore: 4,
      discussionScore: 5
    },
    {
      topicId: "job-search-self-worth",
      interestScore: 5,
      resonanceScore: 5,
      discussionScore: 4
    },
    {
      topicId: "advisor-thesis-anxiety",
      interestScore: 4,
      resonanceScore: 4,
      discussionScore: 4
    }
  ],
  topPriorityTopic: "identity-unloading",
  privateButWantToHearTopic: "没有",
  participationWillingness: []
};

describe("submitSurveySchema", () => {
  it("accepts a valid survey payload", () => {
    expect(submitSurveySchema.safeParse(basePayload).success).toBe(true);
  });

  it("rejects fewer than three topics", () => {
    const result = submitSurveySchema.safeParse({
      ...basePayload,
      selectedTopics: ["identity-unloading"],
      topicRatings: [
        {
          topicId: "identity-unloading",
          interestScore: 5,
          resonanceScore: 4,
          discussionScore: 5
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("requires story topic and usage when a story is provided", () => {
    const result = submitSurveySchema.safeParse({
      ...basePayload,
      personalStory: "这是一段具体经历。".repeat(10)
    });

    expect(result.success).toBe(false);
  });
});

describe("submitGuestSurveySchema", () => {
  it("accepts a valid guest survey payload", () => {
    expect(
      submitGuestSurveySchema.safeParse({
        anonymousSessionId: "guest-test-session",
        guestName: "测试嘉宾",
        guestIdentity: "刚毕业 1-3 年",
        organization: "互联网运营",
        relationshipToTopics: ["我亲身经历过"],
        selectedTopics: ["job-search-self-worth", "renting-first-city"],
        strongestTopic: "job-search-self-worth",
        talkAngles: ["一段具体经历"],
        keyStory: "找工作时有一段很具体的经历。",
        questionsWantToDiscuss: "为什么找工作会让人怀疑自己？",
        boundaries: "不公开公司名。",
        sensitiveTopics: ["具体导师 / 同事 / 公司"],
        preferredFormats: ["远程视频连线"],
        preferredContactMethod: "邮箱",
        contactInfo: "guest@example.com",
        consentToFollowUp: true
      }).success
    ).toBe(true);
  });

  it("requires contact info when follow-up consent is enabled", () => {
    const result = submitGuestSurveySchema.safeParse({
      guestIdentity: "刚毕业 1-3 年",
      relationshipToTopics: [],
      selectedTopics: ["job-search-self-worth"],
      strongestTopic: "job-search-self-worth",
      talkAngles: [],
      sensitiveTopics: [],
      preferredFormats: [],
      consentToFollowUp: true
    });

    expect(result.success).toBe(false);
  });
});

describe("analytics", () => {
  it("calculates topic heat score from weighted inputs", () => {
    expect(
      calculateTopicHeatScore({
        selectedCount: 10,
        averageInterestScore: 4,
        averageResonanceScore: 3,
        averageDiscussionScore: 5,
        topPriorityCount: 2,
        storyCount: 4
      })
    ).toBe(232);
  });

  it("assigns S priority to broad, high-scoring topics with stories", () => {
    expect(
      getTopicPriority({
        selectedCount: 40,
        averageInterestScore: 4.5,
        averageResonanceScore: 4.4,
        averageDiscussionScore: 4.3,
        storyCount: 12,
        totalResponses: 100
      })
    ).toBe("S");
  });

  it("detects potential guest leads", () => {
    expect(
      isPotentialGuestLead({
        participationWillingness: ["接受语音访谈"],
        contactInfo: "wechat-id",
        personalStory: "很具体的一段经历".repeat(12),
        storyEmotionIntensity: 4
      })
    ).toBe(true);
  });
});

describe("privacy helpers", () => {
  it("encrypts and decrypts contact info", () => {
    const encrypted = encryptContactInfo("wechat-id");
    expect(encrypted).not.toBe("wechat-id");
    expect(decryptContactInfo(encrypted)).toBe("wechat-id");
  });

  it("hashes contact info stably", () => {
    expect(hashContactInfo("User@Example.com")).toBe(hashContactInfo("user@example.com"));
  });
});
