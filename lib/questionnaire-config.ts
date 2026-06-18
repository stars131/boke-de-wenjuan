import {
  CONTENT_PLATFORM_OPTIONS,
  CURRENT_STATE_OPTIONS,
  IDENTITY_STATUS_OPTIONS,
  PARTICIPATION_OPTIONS,
  PREFERRED_FORMAT_OPTIONS
} from "@/lib/options";
import {
  GUEST_CONTACT_METHOD_OPTIONS,
  GUEST_FORMAT_OPTIONS,
  GUEST_IDENTITY_OPTIONS,
  GUEST_RELATIONSHIP_OPTIONS,
  GUEST_SENSITIVE_TOPIC_OPTIONS,
  GUEST_TALK_ANGLE_OPTIONS
} from "@/lib/guest-options";
import { TOPIC_IDS } from "@/lib/topics";

export type QuestionnaireKind = "audience" | "guest";

export type AudienceQuestionnaireSettings = {
  minTopicSelections: number;
  maxTopicSelections: number;
  identityOptions: string[];
  currentStateOptions: string[];
  contentPlatformOptions: string[];
  preferredFormatOptions: string[];
  participationOptions: string[];
};

export type GuestQuestionnaireSettings = {
  minTopicSelections: number;
  maxTopicSelections: number;
  identityOptions: string[];
  relationshipOptions: string[];
  talkAngleOptions: string[];
  sensitiveTopicOptions: string[];
  preferredFormatOptions: string[];
  contactMethodOptions: string[];
};

export type QuestionnaireConfig = {
  key: QuestionnaireKind;
  title: string;
  description: string;
  introBadge: string;
  introText: string;
  ctaLabel: string;
  enabledTopicIds: string[];
  settings: AudienceQuestionnaireSettings | GuestQuestionnaireSettings;
  updatedAt?: string;
};

type StoredQuestionnaireConfig = {
  key: string;
  title?: string | null;
  description?: string | null;
  introBadge?: string | null;
  introText?: string | null;
  ctaLabel?: string | null;
  enabledTopicIds?: string[] | null;
  settings?: unknown;
  updatedAt?: Date | string | null;
};

export const DEFAULT_AUDIENCE_CONFIG: QuestionnaireConfig = {
  key: "audience",
  title: "《大学生不必看》观众问卷",
  description: "告诉我们你最想看哪些选题，也可以留下真实故事或后续参与意愿。",
  introBadge: "观众问卷 · 3-8 分钟 · 昵称用于查询",
  introText:
    "这份问卷用于决定第一季重点选题、寻找真实故事和潜在嘉宾。你可以使用唯一昵称，不需要填写真实姓名。",
  ctaLabel: "进入观众问卷",
  enabledTopicIds: [...TOPIC_IDS],
  settings: {
    minTopicSelections: 3,
    maxTopicSelections: 8,
    identityOptions: [...IDENTITY_STATUS_OPTIONS],
    currentStateOptions: [...CURRENT_STATE_OPTIONS],
    contentPlatformOptions: [...CONTENT_PLATFORM_OPTIONS],
    preferredFormatOptions: [...PREFERRED_FORMAT_OPTIONS],
    participationOptions: [...PARTICIPATION_OPTIONS]
  }
};

export const DEFAULT_GUEST_CONFIG: QuestionnaireConfig = {
  key: "guest",
  title: "《大学生不必看》嘉宾沟通问卷",
  description: "适合潜在嘉宾填写，用来确认想聊主题、故事边界和录制偏好。",
  introBadge: "嘉宾问卷 · 录制前沟通 · 昵称用于查询",
  introText:
    "这份问卷不是让你立刻承诺上节目，而是先让节目组知道你想聊什么、能聊到什么程度、哪些内容必须被保护。",
  ctaLabel: "进入嘉宾问卷",
  enabledTopicIds: [...TOPIC_IDS],
  settings: {
    minTopicSelections: 1,
    maxTopicSelections: 8,
    identityOptions: [...GUEST_IDENTITY_OPTIONS],
    relationshipOptions: [...GUEST_RELATIONSHIP_OPTIONS],
    talkAngleOptions: [...GUEST_TALK_ANGLE_OPTIONS],
    sensitiveTopicOptions: [...GUEST_SENSITIVE_TOPIC_OPTIONS],
    preferredFormatOptions: [...GUEST_FORMAT_OPTIONS],
    contactMethodOptions: [...GUEST_CONTACT_METHOD_OPTIONS]
  }
};

export const DEFAULT_QUESTIONNAIRE_CONFIGS: Record<QuestionnaireKind, QuestionnaireConfig> = {
  audience: DEFAULT_AUDIENCE_CONFIG,
  guest: DEFAULT_GUEST_CONFIG
};

export function getDefaultQuestionnaireConfig(kind: QuestionnaireKind) {
  return DEFAULT_QUESTIONNAIRE_CONFIGS[kind];
}

function toStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return normalized.length ? normalized : fallback;
}

function toBoundedNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(numberValue), min), max);
}

function normalizeAudienceSettings(settings: unknown): AudienceQuestionnaireSettings {
  const defaults = DEFAULT_AUDIENCE_CONFIG.settings as AudienceQuestionnaireSettings;
  const value = typeof settings === "object" && settings ? (settings as Record<string, unknown>) : {};
  const maxTopicSelections = toBoundedNumber(
    value.maxTopicSelections,
    defaults.maxTopicSelections,
    1,
    12
  );

  return {
    minTopicSelections: Math.min(
      toBoundedNumber(value.minTopicSelections, defaults.minTopicSelections, 1, 12),
      maxTopicSelections
    ),
    maxTopicSelections,
    identityOptions: toStringArray(value.identityOptions, defaults.identityOptions),
    currentStateOptions: toStringArray(value.currentStateOptions, defaults.currentStateOptions),
    contentPlatformOptions: toStringArray(value.contentPlatformOptions, defaults.contentPlatformOptions),
    preferredFormatOptions: toStringArray(value.preferredFormatOptions, defaults.preferredFormatOptions),
    participationOptions: toStringArray(value.participationOptions, defaults.participationOptions)
  };
}

function normalizeGuestSettings(settings: unknown): GuestQuestionnaireSettings {
  const defaults = DEFAULT_GUEST_CONFIG.settings as GuestQuestionnaireSettings;
  const value = typeof settings === "object" && settings ? (settings as Record<string, unknown>) : {};
  const maxTopicSelections = toBoundedNumber(
    value.maxTopicSelections,
    defaults.maxTopicSelections,
    1,
    12
  );

  return {
    minTopicSelections: Math.min(
      toBoundedNumber(value.minTopicSelections, defaults.minTopicSelections, 1, 12),
      maxTopicSelections
    ),
    maxTopicSelections,
    identityOptions: toStringArray(value.identityOptions, defaults.identityOptions),
    relationshipOptions: toStringArray(value.relationshipOptions, defaults.relationshipOptions),
    talkAngleOptions: toStringArray(value.talkAngleOptions, defaults.talkAngleOptions),
    sensitiveTopicOptions: toStringArray(value.sensitiveTopicOptions, defaults.sensitiveTopicOptions),
    preferredFormatOptions: toStringArray(value.preferredFormatOptions, defaults.preferredFormatOptions),
    contactMethodOptions: toStringArray(value.contactMethodOptions, defaults.contactMethodOptions)
  };
}

function normalizeEnabledTopics(value: unknown, fallback: string[]) {
  const ids = toStringArray(value, fallback).filter((topicId) =>
    (TOPIC_IDS as readonly string[]).includes(topicId)
  );
  return ids.length ? ids : fallback;
}

export function normalizeQuestionnaireConfig(
  kind: QuestionnaireKind,
  stored?: StoredQuestionnaireConfig | null
): QuestionnaireConfig {
  const defaults = getDefaultQuestionnaireConfig(kind);
  const settings =
    kind === "audience"
      ? normalizeAudienceSettings(stored?.settings)
      : normalizeGuestSettings(stored?.settings);
  const updatedAt = stored?.updatedAt
    ? stored.updatedAt instanceof Date
      ? stored.updatedAt.toISOString()
      : stored.updatedAt
    : undefined;

  return {
    key: kind,
    title: stored?.title?.trim() || defaults.title,
    description: stored?.description?.trim() || defaults.description,
    introBadge: stored?.introBadge?.trim() || defaults.introBadge,
    introText: stored?.introText?.trim() || defaults.introText,
    ctaLabel: stored?.ctaLabel?.trim() || defaults.ctaLabel,
    enabledTopicIds: normalizeEnabledTopics(stored?.enabledTopicIds, defaults.enabledTopicIds),
    settings,
    updatedAt
  };
}

export function isQuestionnaireKind(value: string | null): value is QuestionnaireKind {
  return value === "audience" || value === "guest";
}
