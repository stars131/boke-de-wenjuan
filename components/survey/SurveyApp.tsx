"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Send,
  ShieldCheck
} from "lucide-react";
import { TOPIC_GROUPS, TOPICS, getTopicById, type Topic } from "@/lib/topics";
import {
  SCORE_LABELS,
  STORY_USAGE_OPTIONS
} from "@/lib/options";
import {
  getDefaultQuestionnaireConfig,
  type AudienceQuestionnaireSettings,
  type QuestionnaireConfig
} from "@/lib/questionnaire-config";
import { cn } from "@/lib/utils";

type TopicRatingDraft = {
  topicId: string;
  interestScore: number;
  resonanceScore: number;
  discussionScore: number;
};

type SurveyDraft = {
  anonymousSessionId: string;
  identityStatus: string;
  currentStates: string[];
  contentPlatforms: string[];
  preferredFormats: string[];
  selectedTopics: string[];
  topicRatings: TopicRatingDraft[];
  topPriorityTopic: string;
  privateButWantToHearTopic: string;
  privateButWantToHearReason: string;
  personalStory: string;
  storyRelatedTopic: string;
  storyUsagePreference: string;
  storyEmotionIntensity: number;
  participationWillingness: string[];
  contactInfo: string;
  nickname: string;
  additionalSuggestions: string;
  source: string;
  referrer: string;
};

type SubmitResult = {
  responseId: string;
  recommendedTopic: {
    id: string;
    title: string;
    message: string;
  } | null;
};

type AudienceQuestionnaireConfig = QuestionnaireConfig & {
  settings: AudienceQuestionnaireSettings;
};

const STORAGE_KEY = "university-podcast-survey-draft-v1";
const SESSION_KEY = "university-podcast-survey-session-id";
const steps = ["开场", "身份", "主题", "评分", "故事", "联系"] as const;
const DEFAULT_CONFIG = getDefaultQuestionnaireConfig("audience") as AudienceQuestionnaireConfig;

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function scrollToPageTop(behavior: ScrollBehavior = "smooth") {
  window.requestAnimationFrame(() => {
    const scrollingElement = document.scrollingElement || document.documentElement;
    scrollingElement.scrollTo({ top: 0, left: 0, behavior });
    window.scrollTo({ top: 0, left: 0, behavior });
  });
}

function getInitialDraft(): SurveyDraft {
  return {
    anonymousSessionId: "",
    identityStatus: "",
    currentStates: [],
    contentPlatforms: [],
    preferredFormats: [],
    selectedTopics: [],
    topicRatings: [],
    topPriorityTopic: "",
    privateButWantToHearTopic: "没有",
    privateButWantToHearReason: "",
    personalStory: "",
    storyRelatedTopic: "",
    storyUsagePreference: "",
    storyEmotionIntensity: 3,
    participationWillingness: ["只填写问卷"],
    contactInfo: "",
    nickname: "",
    additionalSuggestions: "",
    source: "",
    referrer: ""
  };
}

function toggleOption(values: string[], option: string, max?: number) {
  if (values.includes(option)) {
    return values.filter((value) => value !== option);
  }

  if (max && values.length >= max) {
    return values;
  }

  return [...values, option];
}

function FieldLabel({
  title,
  hint,
  required
}: {
  title: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="text-base font-semibold text-ink">
        {title}
        {required ? <span className="ml-1 text-coral">*</span> : null}
      </label>
      {hint ? <p className="mt-1 text-sm leading-6 text-stone-600">{hint}</p> : null}
    </div>
  );
}

function OptionButton({
  selected,
  children,
  onClick
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-md border px-4 py-2 text-left text-sm transition",
        selected
          ? "border-teal bg-teal text-white shadow-sm"
          : "border-line bg-white text-stone-800 hover:border-teal hover:bg-teal/5"
      )}
    >
      {children}
    </button>
  );
}

function SingleChoice({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <OptionButton key={option} selected={value === option} onClick={() => onChange(option)}>
          {option}
        </OptionButton>
      ))}
    </div>
  );
}

function MultiChoice({
  options,
  values,
  onChange,
  max
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
}) {
  const reachedMax = Boolean(max && values.length >= max);

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const selected = values.includes(option);
          const disabled = reachedMax && !selected;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(toggleOption(values, option, max))}
              disabled={disabled}
              className={cn(
                "min-h-11 rounded-md border px-4 py-2 text-left text-sm transition",
                selected
                  ? "border-teal bg-teal text-white shadow-sm"
                  : "border-line bg-white text-stone-800 hover:border-teal hover:bg-teal/5",
                disabled && "cursor-not-allowed opacity-45"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {max ? <p className="text-xs text-stone-500">已选 {values.length}/{max}</p> : null}
    </div>
  );
}

function TextAreaField({
  value,
  onChange,
  placeholder,
  maxLength,
  minHint
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  minHint?: number;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={7}
        className="min-h-40 w-full resize-y rounded-md border border-line bg-white px-4 py-3 text-sm leading-6 text-ink shadow-sm placeholder:text-stone-400"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        <span>
          {minHint && value.trim().length > 0 && value.trim().length < minHint
            ? `写到 ${minHint} 字左右会更有帮助，但不强制。`
            : "支持换行，提交前会做长度校验。"}
        </span>
        <span>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

function ScorePicker({
  value,
  onChange,
  label
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <span className="text-xs text-stone-500">
          {value} 分 · {SCORE_LABELS[value as keyof typeof SCORE_LABELS]}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            aria-label={`${label} ${score} 分 ${SCORE_LABELS[score as keyof typeof SCORE_LABELS]}`}
            className={cn(
              "min-h-11 rounded-md border text-sm font-semibold transition",
              value === score
                ? "border-teal bg-teal text-white"
                : "border-line bg-white text-stone-700 hover:border-teal"
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

function IntroScreen({
  config,
  onStart
}: {
  config: AudienceQuestionnaireConfig;
  onStart: () => void;
}) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-paper">
      <div className="absolute inset-x-0 top-0 h-[62vh] bg-[url('/survey-hero.png')] bg-cover bg-center" />
      <div className="absolute inset-x-0 top-0 h-[62vh] bg-gradient-to-b from-black/20 via-black/15 to-paper" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl pb-[min(8vh,72px)] text-white drop-shadow">
          <p className="mb-4 inline-flex items-center rounded-md bg-black/35 px-3 py-1 text-sm backdrop-blur">
            {config.introBadge}
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">{config.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white">
            {config.description}
          </p>
        </div>

        <div className="grid gap-5 rounded-md border border-line bg-paper/95 p-5 shadow-panel backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-7">
          <div className="space-y-4 text-sm leading-7 text-stone-700">
            <p>
              {config.introText}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-line bg-white p-4">
                <h2 className="font-semibold text-ink">你的回答会用于</h2>
                <p className="mt-2">决定第一季重点选题，寻找真实故事和嘉宾，判断内容形态。</p>
              </div>
              <div className="rounded-md border border-line bg-white p-4">
                <h2 className="font-semibold text-ink">不会用于</h2>
                <p className="mt-2">公开个人身份、展示联系方式，或对你做任何评价和标签化判断。</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-5 rounded-md bg-ink p-5 text-white">
            <div>
              <MessageSquareText className="h-8 w-8 text-amber" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold">像一个同龄人认真问你：</p>
              <p className="mt-2 leading-7 text-stone-200">
                下面这些事，如果真的找人坐下来聊一小时，你最想听哪几个？
              </p>
            </div>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
            >
              {config.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopicCard({
  topic,
  selectedIndex,
  onToggle,
  disabled
}: {
  topic: Topic;
  selectedIndex: number;
  onToggle: () => void;
  disabled: boolean;
}) {
  const selected = selectedIndex >= 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex min-h-[172px] flex-col rounded-md border p-4 text-left transition",
        selected
          ? "border-teal bg-teal text-white shadow-sm"
          : "border-line bg-white text-ink hover:border-teal hover:bg-teal/5",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      <span className="mb-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-md px-2 py-1 text-xs",
            selected ? "bg-white/15 text-white" : "bg-stone-100 text-stone-600"
          )}
        >
          {topic.group}
        </span>
        {selected ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-teal">
            {selectedIndex + 1}
          </span>
        ) : null}
      </span>
      <span className="text-base font-semibold leading-6">{topic.title}</span>
      <span className={cn("mt-2 text-sm leading-6", selected ? "text-white/85" : "text-stone-600")}>
        {topic.description}
      </span>
      <span className={cn("mt-auto pt-4 text-xs", selected ? "text-white/75" : "text-stone-500")}>
        风险等级：{topic.riskLevel === "high" ? "需谨慎处理" : topic.riskLevel === "medium" ? "中等" : "低"}
      </span>
    </button>
  );
}

export function SurveyApp() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<AudienceQuestionnaireConfig>(DEFAULT_CONFIG);
  const [draft, setDraft] = useState<SurveyDraft>(getInitialDraft);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(TOPIC_GROUPS.map((group) => [group, true]))
  );
  const settings = config.settings;
  const enabledTopics = useMemo(
    () => TOPICS.filter((topic) => config.enabledTopicIds.includes(topic.id)),
    [config.enabledTopicIds]
  );
  const enabledTopicGroups = useMemo(
    () => TOPIC_GROUPS.filter((group) => enabledTopics.some((topic) => topic.group === group)),
    [enabledTopics]
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/questionnaire-config?type=audience", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((nextConfig) => {
        if (!cancelled && nextConfig?.key === "audience") {
          setConfig(nextConfig as AudienceQuestionnaireConfig);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(DEFAULT_CONFIG);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOpenGroups((current) => ({
      ...Object.fromEntries(enabledTopicGroups.map((group) => [group, true])),
      ...current
    }));
  }, [enabledTopicGroups]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const sessionId = localStorage.getItem(SESSION_KEY) || createSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<SurveyDraft> & { step?: number };
        setDraft({
          ...getInitialDraft(),
          ...parsed,
          anonymousSessionId: sessionId,
          referrer: document.referrer || parsed.referrer || "",
          source: new URLSearchParams(window.location.search).get("source") || parsed.source || ""
        });
        setStep(typeof parsed.step === "number" ? Math.min(parsed.step, steps.length - 1) : 0);
      } catch {
        setDraft({
          ...getInitialDraft(),
          anonymousSessionId: sessionId,
          referrer: document.referrer,
          source: new URLSearchParams(window.location.search).get("source") || ""
        });
      }
    } else {
      setDraft({
        ...getInitialDraft(),
        anonymousSessionId: sessionId,
        referrer: document.referrer,
        source: new URLSearchParams(window.location.search).get("source") || ""
      });
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || submitResult) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, step }));
  }, [draft, hydrated, step, submitResult]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    scrollToPageTop();
  }, [hydrated, step, submitResult]);

  const selectedTopics = useMemo(
    () => draft.selectedTopics.map((id) => getTopicById(id)).filter(Boolean) as Topic[],
    [draft.selectedTopics]
  );

  const updateDraft = (patch: Partial<SurveyDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError("");
  };

  const updateSelectedTopics = (topicId: string) => {
    const selected = draft.selectedTopics.includes(topicId);

    if (!selected && draft.selectedTopics.length >= settings.maxTopicSelections) {
      setError(`最多只能选择 ${settings.maxTopicSelections} 个主题。先取消一个，再选择新的。`);
      return;
    }

    const nextTopics = selected
      ? draft.selectedTopics.filter((id) => id !== topicId)
      : [...draft.selectedTopics, topicId];
    const nextRatings = draft.topicRatings.filter((rating) => nextTopics.includes(rating.topicId));
    const nextTopPriority = nextTopics.includes(draft.topPriorityTopic)
      ? draft.topPriorityTopic
      : nextTopics[0] || "";

    updateDraft({
      selectedTopics: nextTopics,
      topicRatings: nextRatings,
      topPriorityTopic: nextTopPriority
    });
  };

  const setRating = (
    topicId: string,
    field: "interestScore" | "resonanceScore" | "discussionScore",
    value: number
  ) => {
    setDraft((current) => {
      const existing = current.topicRatings.find((rating) => rating.topicId === topicId);
      const base = existing || {
        topicId,
        interestScore: 3,
        resonanceScore: 3,
        discussionScore: 3
      };
      const nextRating = {
        ...base,
        [field]: value
      };

      return {
        ...current,
        topicRatings: [
          ...current.topicRatings.filter((rating) => rating.topicId !== topicId),
          nextRating
        ]
      };
    });
    setError("");
  };

  const getRating = (topicId: string) =>
    draft.topicRatings.find((rating) => rating.topicId === topicId) || {
      topicId,
      interestScore: 3,
      resonanceScore: 3,
      discussionScore: 3
    };

  const validateStep = () => {
    if (step === 1 && !draft.identityStatus) {
      setError("请选择你的身份。");
      return false;
    }

    if (step === 1 && !draft.nickname.trim()) {
      setError("请设置一个唯一昵称，用于之后查询自己的提交记录。");
      return false;
    }

    if (step === 2 && draft.selectedTopics.length < settings.minTopicSelections) {
      setError(`请至少选择 ${settings.minTopicSelections} 个主题，再进入评分页。`);
      return false;
    }

    if (step === 3) {
      const ratedIds = new Set(draft.topicRatings.map((rating) => rating.topicId));
      const allRated = draft.selectedTopics.every((topicId) => ratedIds.has(topicId));
      if (!allRated) {
        const defaultRatings = draft.selectedTopics
          .filter((topicId) => !ratedIds.has(topicId))
          .map((topicId) => ({
            topicId,
            interestScore: 3,
            resonanceScore: 3,
            discussionScore: 3
          }));
        updateDraft({
          topicRatings: [...draft.topicRatings, ...defaultRatings]
        });
      }

      if (!draft.topPriorityTopic) {
        setError("请选择一个最希望第一季先做的主题。");
        return false;
      }
    }

    if (step === 4 && draft.personalStory.trim()) {
      if (!draft.storyRelatedTopic) {
        setError("写了故事后，请选择这个经历更接近哪个主题。");
        return false;
      }

      if (!draft.storyUsagePreference) {
        setError("写了故事后，请选择故事的使用方式。");
        return false;
      }
    }

    setError("");
    return true;
  };

  const goNext = () => {
    if (!validateStep()) {
      scrollToPageTop();
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goPrevious = () => {
    setStep((current) => Math.max(current - 1, 0));
    setError("");
  };

  const submit = async () => {
    if (!validateStep()) {
      return;
    }

    setSubmitting(true);
    setError("");

    const selectedSet = new Set(draft.selectedTopics);
    const normalizedRatings = draft.selectedTopics.map((topicId) => getRating(topicId));
    const payload = {
      ...draft,
      topicRatings: normalizedRatings,
      privateButWantToHearTopic:
        draft.privateButWantToHearTopic === "没有" ? "没有" : draft.privateButWantToHearTopic,
      storyEmotionIntensity: draft.personalStory.trim() ? draft.storyEmotionIntensity : undefined
    };

    payload.selectedTopics = payload.selectedTopics.filter((topicId) => selectedSet.has(topicId));

    try {
      const response = await fetch("/api/survey/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        const fieldMessage = result?.error?.fields
          ? Object.values(result.error.fields).filter(Boolean).join(" ")
          : "";
        throw new Error(fieldMessage || result?.error?.message || "提交失败。");
      }

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
      setSubmitResult({
        responseId: result.responseId,
        recommendedTopic: result.recommendedTopic
      });
      setStep(steps.length);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  };

  const shareSurvey = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: config.title,
        text: "一份关于毕业、关系、工作、钱、家庭和未来的匿名选题问卷",
        url
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setError("问卷链接已复制。");
  };

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4 text-stone-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        正在恢复草稿
      </main>
    );
  }

  if (submitResult) {
    return (
      <main className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-md border border-line bg-white p-6 shadow-panel sm:p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal text-white">
            <Check className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-ink">
            收到。这些“不必看”的事，我们会认真看。
          </h1>
          <p className="mt-4 leading-7 text-stone-700">
            谢谢你填完这份问卷。你的回答会帮助我们决定《大学生不必看》第一季先聊什么，也会帮助我们找到真正值得坐下来慢慢聊的人和故事。
          </p>
          {submitResult.recommendedTopic ? (
            <div className="mt-6 rounded-md border border-teal/25 bg-teal/5 p-5">
              <p className="text-sm font-semibold text-teal">你可能最适合看的方向</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {submitResult.recommendedTopic.title}
              </p>
              <p className="mt-2 leading-7 text-stone-700">{submitResult.recommendedTopic.message}</p>
            </div>
          ) : null}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-teal"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              返回首页
            </button>
            <button
              type="button"
              onClick={shareSurvey}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-teal"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              分享问卷
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmitResult(null);
                setStep(4);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-semibold text-white hover:bg-coral/90"
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              继续补充故事
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (step === 0) {
    return <IntroScreen config={config} onStart={() => setStep(1)} />;
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 rounded-md border border-line bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">{config.title}</p>
              <h1 className="mt-1 text-2xl font-semibold text-ink">{steps[step]}</h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md bg-teal/10 px-3 py-2 text-sm text-teal">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              可匿名填写，联系方式非必填
            </div>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-2" aria-label="问卷进度">
            {steps.map((label, index) => (
              <div key={label} className="space-y-1">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    index <= step ? "bg-teal" : "bg-stone-200"
                  )}
                />
                <span className="hidden text-xs text-stone-500 sm:block">{label}</span>
              </div>
            ))}
          </div>
        </header>

        <section className="rounded-md border border-line bg-white p-5 shadow-panel sm:p-7">
          {error ? (
            <div
              role="alert"
              className="mb-5 rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm leading-6 text-coral"
            >
              {error}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-8">
              <div>
                <FieldLabel
                  title="Q1. 设置一个唯一昵称"
                  hint="用于之后在首页查询自己的提交记录，不需要填写真实姓名。"
                  required
                />
                <input
                  value={draft.nickname}
                  onChange={(event) => updateDraft({ nickname: event.target.value.slice(0, 50) })}
                  placeholder="例如：阿北 / test001 / 某位研三"
                  className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm text-ink placeholder:text-stone-400"
                />
              </div>
              <div>
                <FieldLabel title="Q2. 你现在的身份是？" required />
                <SingleChoice
                  options={settings.identityOptions}
                  value={draft.identityStatus}
                  onChange={(identityStatus) => updateDraft({ identityStatus })}
                />
              </div>
              <div>
                <FieldLabel title="Q3. 你现在最接近哪种状态？" hint="最多选 5 个，也可以不选。" />
                <MultiChoice
                  options={settings.currentStateOptions}
                  values={draft.currentStates}
                  max={5}
                  onChange={(currentStates) => updateDraft({ currentStates })}
                />
              </div>
              <div>
                <FieldLabel title="Q4. 你更常在哪些平台看这类内容？" />
                <MultiChoice
                  options={settings.contentPlatformOptions}
                  values={draft.contentPlatforms}
                  onChange={(contentPlatforms) => updateDraft({ contentPlatforms })}
                />
              </div>
              <div>
                <FieldLabel title="Q5. 你更喜欢哪种内容形式？" hint="最多选 4 个。" />
                <MultiChoice
                  options={settings.preferredFormatOptions}
                  values={draft.preferredFormats}
                  max={4}
                  onChange={(preferredFormats) => updateDraft({ preferredFormats })}
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <FieldLabel
                title="Q5. 你最想看哪些主题？"
                hint={`请选择你最想看的主题；至少 ${settings.minTopicSelections} 个，最多 ${settings.maxTopicSelections} 个。不需要选正确的，只选你真的会点进去看的。`}
                required
              />
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-md bg-stone-100 px-3 py-1 text-stone-700">
                  已选 {draft.selectedTopics.length}/{settings.maxTopicSelections}
                </span>
                {draft.selectedTopics.length < settings.minTopicSelections ? (
                  <span className="text-coral">
                    还需要至少选择 {settings.minTopicSelections - draft.selectedTopics.length} 个
                  </span>
                ) : null}
              </div>
              <div className="space-y-4">
                {enabledTopicGroups.map((group) => {
                  const groupTopics = enabledTopics.filter((topic) => topic.group === group);
                  const open = openGroups[group];

                  return (
                    <div key={group} className="rounded-md border border-line">
                      <button
                        type="button"
                        onClick={() => setOpenGroups((current) => ({ ...current, [group]: !open }))}
                        className="flex min-h-12 w-full items-center justify-between px-4 text-left font-semibold text-ink"
                      >
                        <span>{group}</span>
                        {open ? (
                          <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                      {open ? (
                        <div className="grid gap-3 border-t border-line p-3 md:grid-cols-2 xl:grid-cols-3">
                          {groupTopics.map((topic) => {
                            const selectedIndex = draft.selectedTopics.indexOf(topic.id);
                            const disabled =
                              selectedIndex < 0 &&
                              draft.selectedTopics.length >= settings.maxTopicSelections;
                            return (
                              <TopicCard
                                key={topic.id}
                                topic={topic}
                                selectedIndex={selectedIndex}
                                disabled={disabled}
                                onToggle={() => updateSelectedTopics(topic.id)}
                              />
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-7">
              <div>
                <FieldLabel
                  title="Q6. 对你选中的每个主题，请打三个分"
                  hint="1 分是很低，5 分是非常强。默认值是 3，你可以快速调整。"
                  required
                />
                <div className="space-y-4">
                  {selectedTopics.map((topic) => {
                    const rating = getRating(topic.id);

                    return (
                      <div key={topic.id} className="rounded-md border border-line bg-stone-50 p-4">
                        <div className="mb-4">
                          <h2 className="font-semibold text-ink">{topic.title}</h2>
                          <p className="mt-1 text-sm leading-6 text-stone-600">{topic.description}</p>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
                          <ScorePicker
                            label="想看程度"
                            value={rating.interestScore}
                            onChange={(value) => setRating(topic.id, "interestScore", value)}
                          />
                          <ScorePicker
                            label="共鸣程度"
                            value={rating.resonanceScore}
                            onChange={(value) => setRating(topic.id, "resonanceScore", value)}
                          />
                          <ScorePicker
                            label="讨论欲"
                            value={rating.discussionScore}
                            onChange={(value) => setRating(topic.id, "discussionScore", value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel
                  title="Q7. 如果只能选 1 个你最希望第一季先做的主题，你会选哪个？"
                  required
                />
                <SingleChoice
                  options={selectedTopics.map((topic) => topic.title)}
                  value={getTopicById(draft.topPriorityTopic)?.title || ""}
                  onChange={(title) => {
                    const topic = selectedTopics.find((item) => item.title === title);
                    updateDraft({ topPriorityTopic: topic?.id || "" });
                  }}
                />
              </div>

              <div>
                <FieldLabel
                  title="Q8. 哪个主题你觉得“不一定想公开说，但很想听别人聊”？"
                  hint="可以选“没有”，也可以补充原因。"
                />
                <select
                  value={draft.privateButWantToHearTopic}
                  onChange={(event) => updateDraft({ privateButWantToHearTopic: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm text-ink"
                >
                  <option value="没有">没有</option>
                  {enabledTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
                <textarea
                  value={draft.privateButWantToHearReason}
                  onChange={(event) =>
                    updateDraft({ privateButWantToHearReason: event.target.value.slice(0, 1000) })
                  }
                  placeholder="可以简单说说为什么。比如：太私人、不知道怎么表达、怕被评价、身边没人聊……"
                  rows={3}
                  className="mt-3 w-full rounded-md border border-line bg-white px-4 py-3 text-sm leading-6 text-ink placeholder:text-stone-400"
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-7">
              <div className="rounded-md border border-amber/30 bg-amber/10 p-4 text-sm leading-6 text-stone-700">
                这一页可以不填。但如果你愿意写一点真实经历，它会非常帮助我们判断：这个主题到底应该怎么聊，应该找什么样的人来聊。
              </div>
              <div className="rounded-md border border-coral/25 bg-coral/10 p-4 text-sm leading-6 text-stone-700">
                如果你正在经历强烈痛苦、伤害风险或现实危险，请优先联系身边可信任的人、学校心理中心、当地紧急电话或专业机构。这个问卷不能替代现实帮助。
              </div>
              <div>
                <FieldLabel title="Q9. 你有没有一个和这些主题有关的真实经历？" />
                <TextAreaField
                  value={draft.personalStory}
                  onChange={(personalStory) => updateDraft({ personalStory })}
                  maxLength={3000}
                  minHint={50}
                  placeholder="可以写一件具体的小事：某次搬寝室、某次面试失败、某段关系里的争吵、某次和父母通电话、某个熬夜到天亮的晚上……不需要写得完整，也不需要写得漂亮。"
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel
                    title="Q10. 这个经历更接近哪个主题？"
                    required={Boolean(draft.personalStory.trim())}
                  />
                  <select
                    value={draft.storyRelatedTopic}
                    onChange={(event) => updateDraft({ storyRelatedTopic: event.target.value })}
                    className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm text-ink"
                  >
                    <option value="">请选择</option>
                    {enabledTopics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel
                    title="Q11. 如果这个故事被节目参考，你希望如何处理？"
                    required={Boolean(draft.personalStory.trim())}
                  />
                  <select
                    value={draft.storyUsagePreference}
                    onChange={(event) => updateDraft({ storyUsagePreference: event.target.value })}
                    className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm text-ink"
                  >
                    <option value="">请选择</option>
                    {STORY_USAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <FieldLabel title="Q12. 这个故事的情绪强度大概是多少？" />
                <div className="grid gap-2 sm:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <OptionButton
                      key={score}
                      selected={draft.storyEmotionIntensity === score}
                      onClick={() => updateDraft({ storyEmotionIntensity: score })}
                    >
                      {score} ·{" "}
                      {score === 1
                        ? "普通经历"
                        : score === 2
                          ? "有一点触动"
                          : score === 3
                            ? "比较重要"
                            : score === 4
                              ? "当时很难受"
                              : "仍然影响很大"}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-7">
              <div>
                <FieldLabel title="Q13. 你愿意以哪种方式参与《大学生不必看》？" />
                <MultiChoice
                  options={settings.participationOptions}
                  values={draft.participationWillingness}
                  onChange={(participationWillingness) => updateDraft({ participationWillingness })}
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel title="Q14. 如果愿意被联系，请留下一个联系方式" />
                  <input
                    value={draft.contactInfo}
                    onChange={(event) => updateDraft({ contactInfo: event.target.value.slice(0, 300) })}
                    placeholder="微信 / 邮箱 / 小红书号 / B站号 / 其他方式均可。非必填。"
                    className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm text-ink placeholder:text-stone-400"
                  />
                </div>
                <div className="rounded-md border border-teal/20 bg-teal/5 p-4">
                  <p className="text-sm font-semibold text-teal">当前唯一昵称</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{draft.nickname || "未设置"}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    这个昵称会用于首页查询提交记录。如需修改，请回到“身份”步骤。
                  </p>
                </div>
              </div>
              <div>
                <FieldLabel title="Q16. 还有什么你希望这个节目一定要聊的吗？" />
                <TextAreaField
                  value={draft.additionalSuggestions}
                  onChange={(additionalSuggestions) => updateDraft({ additionalSuggestions })}
                  maxLength={2000}
                  placeholder="可以是一个主题、一句话、一个问题，或者你觉得“网上总是讲错了”的某件事。"
                />
              </div>
            </div>
          ) : null}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={goPrevious}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-teal"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              上一步
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal px-5 text-sm font-semibold text-white hover:bg-teal/90"
              >
                下一步
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-5 text-sm font-semibold text-white hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                提交问卷
              </button>
            )}
          </footer>
        </section>
      </div>
    </main>
  );
}
