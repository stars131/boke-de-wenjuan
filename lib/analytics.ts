import { TOPICS } from "@/lib/topics";

export type TopicAnalyticsInput = {
  selectedCount: number;
  averageInterestScore: number;
  averageResonanceScore: number;
  averageDiscussionScore: number;
  topPriorityCount: number;
  storyCount: number;
};

export function calculateTopicHeatScore(input: TopicAnalyticsInput) {
  return (
    input.selectedCount * 1 +
    input.averageInterestScore * 20 +
    input.averageResonanceScore * 15 +
    input.averageDiscussionScore * 15 +
    input.topPriorityCount * 5 +
    input.storyCount * 3
  );
}

export function getTopicPriority(input: {
  selectedCount: number;
  averageInterestScore: number;
  averageResonanceScore: number;
  averageDiscussionScore: number;
  storyCount: number;
  totalResponses: number;
}) {
  const selectedRate = input.totalResponses === 0 ? 0 : input.selectedCount / input.totalResponses;
  const avgScore =
    (input.averageInterestScore + input.averageResonanceScore + input.averageDiscussionScore) / 3;

  if (selectedRate >= 0.35 && avgScore >= 4.2 && input.storyCount >= 10) {
    return "S";
  }

  if (selectedRate >= 0.25 && avgScore >= 4.0) {
    return "A";
  }

  if (selectedRate >= 0.15 || input.storyCount >= 5) {
    return "B";
  }

  if (avgScore >= 4.0 && selectedRate < 0.15) {
    return "C";
  }

  return "Deferred";
}

export function isPotentialGuestLead(input: {
  participationWillingness: string[];
  contactInfo?: string | null;
  personalStory?: string | null;
  storyEmotionIntensity?: number | null;
}) {
  const willing =
    input.participationWillingness.includes("接受文字访谈") ||
    input.participationWillingness.includes("接受语音访谈") ||
    input.participationWillingness.includes("接受视频连线") ||
    input.participationWillingness.includes("线下参与录制");

  const hasContact = Boolean(input.contactInfo);
  const hasStory = Boolean(input.personalStory && input.personalStory.trim().length >= 80);
  const strongEmotion = (input.storyEmotionIntensity ?? 0) >= 3;

  return willing && hasContact && hasStory && strongEmotion;
}

export type ResponseForAnalytics = {
  selectedTopics: string[];
  topPriorityTopic: string;
  storyRelatedTopic: string | null;
  topicRatings: {
    topicId: string;
    interestScore: number;
    resonanceScore: number;
    discussionScore: number;
  }[];
};

export function buildTopicAnalytics(responses: ResponseForAnalytics[]) {
  const totalResponses = responses.length;

  return TOPICS.map((topic) => {
    const selectedCount = responses.filter((response) => response.selectedTopics.includes(topic.id)).length;
    const topPriorityCount = responses.filter((response) => response.topPriorityTopic === topic.id).length;
    const storyCount = responses.filter((response) => response.storyRelatedTopic === topic.id).length;
    const ratings = responses.flatMap((response) =>
      response.topicRatings.filter((rating) => rating.topicId === topic.id)
    );

    const average = (field: "interestScore" | "resonanceScore" | "discussionScore") =>
      ratings.length
        ? ratings.reduce((sum, rating) => sum + rating[field], 0) / ratings.length
        : 0;

    const averageInterestScore = average("interestScore");
    const averageResonanceScore = average("resonanceScore");
    const averageDiscussionScore = average("discussionScore");
    const heatScore = calculateTopicHeatScore({
      selectedCount,
      averageInterestScore,
      averageResonanceScore,
      averageDiscussionScore,
      topPriorityCount,
      storyCount
    });

    return {
      topicId: topic.id,
      title: topic.title,
      group: topic.group,
      selectedCount,
      topPriorityCount,
      storyCount,
      averageInterestScore,
      averageResonanceScore,
      averageDiscussionScore,
      heatScore,
      priority: getTopicPriority({
        selectedCount,
        averageInterestScore,
        averageResonanceScore,
        averageDiscussionScore,
        storyCount,
        totalResponses
      })
    };
  }).sort((a, b) => b.heatScore - a.heatScore);
}
