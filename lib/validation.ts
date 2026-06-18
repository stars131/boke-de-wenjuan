import { z } from "zod";
import { TOPIC_IDS } from "@/lib/topics";

const topicIdSet = new Set<string>(TOPIC_IDS);

const optionalLimitedString = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    });

const requiredLimitedString = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max);

export const topicRatingSchema = z.object({
  topicId: z.string(),
  interestScore: z.coerce.number().int().min(1).max(5),
  resonanceScore: z.coerce.number().int().min(1).max(5),
  discussionScore: z.coerce.number().int().min(1).max(5)
});

export const submitSurveySchema = z
  .object({
    anonymousSessionId: optionalLimitedString(128),
    identityStatus: z.string().trim().min(1, "请选择你的身份。"),
    currentStates: z.array(z.string()).max(5, "当前状态最多选择 5 个。").default([]),
    contentPlatforms: z.array(z.string()).default([]),
    preferredFormats: z.array(z.string()).max(4, "内容形式最多选择 4 个。").default([]),
    selectedTopics: z
      .array(z.string())
      .min(1, "请至少选择主题。")
      .max(12, "主题选择数量超出限制。"),
    topicRatings: z.array(topicRatingSchema).min(1),
    topPriorityTopic: z.string().trim().min(1, "请选择第一季最想先看的主题。"),
    privateButWantToHearTopic: optionalLimitedString(100),
    privateButWantToHearReason: optionalLimitedString(1000),
    personalStory: optionalLimitedString(3000),
    storyRelatedTopic: optionalLimitedString(100),
    storyUsagePreference: optionalLimitedString(100),
    storyEmotionIntensity: z.coerce.number().int().min(1).max(5).optional(),
    participationWillingness: z.array(z.string()).default([]),
    contactInfo: optionalLimitedString(300),
    nickname: requiredLimitedString(50, "请设置一个唯一昵称。"),
    additionalSuggestions: optionalLimitedString(2000),
    source: optionalLimitedString(100),
    referrer: optionalLimitedString(500)
  })
  .superRefine((data, ctx) => {
    const selectedSet = new Set(data.selectedTopics);

    for (const topicId of data.selectedTopics) {
      if (!topicIdSet.has(topicId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["selectedTopics"],
          message: "主题选项无效。"
        });
      }
    }

    if (!selectedSet.has(data.topPriorityTopic)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["topPriorityTopic"],
        message: "最想看的主题必须来自你已选择的主题。"
      });
    }

    const ratingTopicIds = new Set(data.topicRatings.map((rating) => rating.topicId));
    for (const rating of data.topicRatings) {
      if (!selectedSet.has(rating.topicId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["topicRatings"],
          message: "评分主题必须来自你已选择的主题。"
        });
      }
    }

    for (const topicId of selectedSet) {
      if (!ratingTopicIds.has(topicId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["topicRatings"],
          message: "请给每个已选主题完成三个维度评分。"
        });
      }
    }

    if (
      data.privateButWantToHearTopic &&
      data.privateButWantToHearTopic !== "没有" &&
      !topicIdSet.has(data.privateButWantToHearTopic)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["privateButWantToHearTopic"],
        message: "私下想听的主题无效。"
      });
    }

    if (data.storyRelatedTopic && !topicIdSet.has(data.storyRelatedTopic)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["storyRelatedTopic"],
        message: "故事相关主题无效。"
      });
    }

    if (data.personalStory && data.personalStory.trim().length > 0) {
      if (!data.storyRelatedTopic) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["storyRelatedTopic"],
          message: "写了故事后，请选择故事相关主题。"
        });
      }

      if (!data.storyUsagePreference) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["storyUsagePreference"],
          message: "写了故事后，请选择故事使用方式。"
        });
      }
    }
  });

export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>;

export const submitGuestSurveySchema = z
  .object({
    anonymousSessionId: optionalLimitedString(128),
    guestName: requiredLimitedString(80, "请设置一个唯一昵称。"),
    guestIdentity: z.string().trim().min(1, "请选择你的嘉宾身份。"),
    organization: optionalLimitedString(120),
    relationshipToTopics: z.array(z.string()).max(6, "关联方式最多选择 6 个。").default([]),
    selectedTopics: z
      .array(z.string())
      .min(1, "请至少选择 1 个想聊的主题。")
      .max(12, "主题选择数量超出限制。"),
    customTopics: optionalLimitedString(1000),
    strongestTopic: z.string().trim().min(1, "请选择最想展开聊的主题。"),
    talkAngles: z.array(z.string()).max(8, "展开角度最多选择 8 个。").default([]),
    keyStory: optionalLimitedString(3000),
    questionsWantToDiscuss: optionalLimitedString(2000),
    boundaries: optionalLimitedString(2000),
    sensitiveTopics: z.array(z.string()).max(8).default([]),
    preferredFormats: z.array(z.string()).max(8).default([]),
    availability: optionalLimitedString(500),
    preferredContactMethod: optionalLimitedString(100),
    contactInfo: optionalLimitedString(300),
    consentToFollowUp: z.coerce.boolean().default(false),
    source: optionalLimitedString(100),
    referrer: optionalLimitedString(500)
  })
  .superRefine((data, ctx) => {
    const selectedSet = new Set(data.selectedTopics);

    for (const topicId of data.selectedTopics) {
      if (!topicIdSet.has(topicId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["selectedTopics"],
          message: "主题选项无效。"
        });
      }
    }

    if (!selectedSet.has(data.strongestTopic)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["strongestTopic"],
        message: "最想展开聊的主题必须来自你已选择的主题。"
      });
    }

    if (data.consentToFollowUp && !data.contactInfo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactInfo"],
        message: "愿意后续沟通时，请留下一个联系方式。"
      });
    }
  });

export type SubmitGuestSurveyInput = z.infer<typeof submitGuestSurveySchema>;
