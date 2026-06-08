"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  MessageCircle,
  Mic,
  Send,
  ShieldCheck
} from "lucide-react";
import {
  GUEST_CONTACT_METHOD_OPTIONS,
  GUEST_FORMAT_OPTIONS,
  GUEST_IDENTITY_OPTIONS,
  GUEST_RELATIONSHIP_OPTIONS,
  GUEST_SENSITIVE_TOPIC_OPTIONS,
  GUEST_TALK_ANGLE_OPTIONS
} from "@/lib/guest-options";
import { TOPICS, getTopicById } from "@/lib/topics";
import { cn } from "@/lib/utils";

type GuestDraft = {
  anonymousSessionId: string;
  guestName: string;
  guestIdentity: string;
  organization: string;
  relationshipToTopics: string[];
  selectedTopics: string[];
  customTopics: string;
  strongestTopic: string;
  talkAngles: string[];
  keyStory: string;
  questionsWantToDiscuss: string;
  boundaries: string;
  sensitiveTopics: string[];
  preferredFormats: string[];
  availability: string;
  preferredContactMethod: string;
  contactInfo: string;
  consentToFollowUp: boolean;
  source: string;
  referrer: string;
};

type SubmitResult = {
  responseId: string;
  strongestTopic: {
    id: string;
    title: string;
    message: string;
  } | null;
};

const STORAGE_KEY = "university-podcast-guest-survey-draft-v1";
const SESSION_KEY = "university-podcast-guest-survey-session-id";

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getInitialDraft(): GuestDraft {
  return {
    anonymousSessionId: "",
    guestName: "",
    guestIdentity: "",
    organization: "",
    relationshipToTopics: [],
    selectedTopics: [],
    customTopics: "",
    strongestTopic: "",
    talkAngles: [],
    keyStory: "",
    questionsWantToDiscuss: "",
    boundaries: "",
    sensitiveTopics: ["暂时没有明显边界"],
    preferredFormats: [],
    availability: "",
    preferredContactMethod: "",
    contactInfo: "",
    consentToFollowUp: true,
    source: "",
    referrer: ""
  };
}

function toggle(values: string[], option: string, max?: number) {
  if (values.includes(option)) {
    return values.filter((value) => value !== option);
  }

  if (max && values.length >= max) {
    return values;
  }

  return [...values, option];
}

function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-teal">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
    </div>
  );
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
    <div className="mb-2">
      <label className="text-sm font-semibold text-ink">
        {title}
        {required ? <span className="ml-1 text-coral">*</span> : null}
      </label>
      {hint ? <p className="mt-1 text-xs leading-5 text-stone-500">{hint}</p> : null}
    </div>
  );
}

function Chip({
  selected,
  children,
  onClick,
  disabled
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-h-11 rounded-md border px-3 py-2 text-left text-sm transition",
        selected
          ? "border-teal bg-teal text-white"
          : "border-line bg-white text-stone-800 hover:border-teal hover:bg-teal/5",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      {children}
    </button>
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
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const selected = values.includes(option);
          const disabled = Boolean(max && values.length >= max && !selected);

          return (
            <Chip
              key={option}
              selected={selected}
              disabled={disabled}
              onClick={() => onChange(toggle(values, option, max))}
            >
              {option}
            </Chip>
          );
        })}
      </div>
      {max ? <p className="text-xs text-stone-500">已选 {values.length}/{max}</p> : null}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  maxLength
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-y rounded-md border border-line bg-white px-4 py-3 text-sm leading-6 text-ink placeholder:text-stone-400"
      />
      <p className="mt-1 text-right text-xs text-stone-500">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}

export function GuestSurveyApp() {
  const [draft, setDraft] = useState<GuestDraft>(getInitialDraft);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const sessionId = localStorage.getItem(SESSION_KEY) || createSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<GuestDraft>;
        setDraft({
          ...getInitialDraft(),
          ...parsed,
          anonymousSessionId: sessionId,
          source: new URLSearchParams(window.location.search).get("source") || parsed.source || "",
          referrer: document.referrer || parsed.referrer || ""
        });
      } catch {
        setDraft({
          ...getInitialDraft(),
          anonymousSessionId: sessionId,
          source: new URLSearchParams(window.location.search).get("source") || "",
          referrer: document.referrer
        });
      }
    } else {
      setDraft({
        ...getInitialDraft(),
        anonymousSessionId: sessionId,
        source: new URLSearchParams(window.location.search).get("source") || "",
        referrer: document.referrer
      });
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !submitResult) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [draft, hydrated, submitResult]);

  const selectedTopicObjects = useMemo(
    () => draft.selectedTopics.map((topicId) => getTopicById(topicId)).filter(Boolean),
    [draft.selectedTopics]
  );

  const updateDraft = (patch: Partial<GuestDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError("");
  };

  const toggleTopic = (topicId: string) => {
    const selected = draft.selectedTopics.includes(topicId);

    if (!selected && draft.selectedTopics.length >= 8) {
      setError("最多选择 8 个主题。");
      return;
    }

    const selectedTopics = selected
      ? draft.selectedTopics.filter((id) => id !== topicId)
      : [...draft.selectedTopics, topicId];
    const strongestTopic = selectedTopics.includes(draft.strongestTopic)
      ? draft.strongestTopic
      : selectedTopics[0] || "";

    updateDraft({ selectedTopics, strongestTopic });
  };

  const validate = () => {
    if (!draft.guestIdentity) {
      setError("请选择你的嘉宾身份。");
      return false;
    }

    if (draft.selectedTopics.length < 1) {
      setError("请至少选择 1 个想聊的主题。");
      return false;
    }

    if (!draft.strongestTopic) {
      setError("请选择最想展开聊的主题。");
      return false;
    }

    if (draft.consentToFollowUp && !draft.contactInfo.trim()) {
      setError("愿意后续沟通时，请留下一个联系方式。");
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/guest/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draft)
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
        strongestTopic: result.strongestTopic
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    const sessionId = createSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
    localStorage.removeItem(STORAGE_KEY);
    setDraft({
      ...getInitialDraft(),
      anonymousSessionId: sessionId,
      source: new URLSearchParams(window.location.search).get("source") || "",
      referrer: document.referrer
    });
    setSubmitResult(null);
    setError("");
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: "《大学生不必看》嘉宾沟通问卷",
        text: "一份给潜在嘉宾填写的录制前沟通表",
        url
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setError("链接已复制。");
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
          <h1 className="mt-6 text-3xl font-semibold text-ink">收到。我们会先看你想聊的方向。</h1>
          <p className="mt-4 leading-7 text-stone-700">
            谢谢你填写嘉宾沟通问卷。后续如果进入某个选题，我们会先确认你愿意公开到什么程度，再决定访谈形式和提纲。
          </p>
          {submitResult.strongestTopic ? (
            <div className="mt-6 rounded-md border border-teal/25 bg-teal/5 p-5">
              <p className="text-sm font-semibold text-teal">你最想展开的方向</p>
              <p className="mt-2 text-lg font-semibold text-ink">{submitResult.strongestTopic.title}</p>
              <p className="mt-2 leading-7 text-stone-700">{submitResult.strongestTopic.message}</p>
            </div>
          ) : null}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-teal"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              观众问卷
            </a>
            <button
              type="button"
              onClick={share}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-teal"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              分享链接
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-semibold text-white hover:bg-coral/90"
            >
              再填一份
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="border-b border-line bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="inline-flex items-center rounded-md bg-white/10 px-3 py-1 text-sm">
              给潜在嘉宾 · 录制前沟通 · 可匿名
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              《大学生不必看》嘉宾沟通问卷
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-stone-200">
              这份问卷不是让你立刻承诺上节目，而是先让我们知道：你想聊什么，能聊到什么程度，哪些内容必须被保护。
            </p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-5">
            <Mic className="h-9 w-9 text-amber" aria-hidden="true" />
            <p className="mt-4 font-semibold">适合填写的人</p>
            <p className="mt-2 text-sm leading-7 text-stone-200">
              亲身经历者、观察者、专业人士、校友、内容创作者，或者只是有一个很想被认真聊聊的问题。
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div role="alert" className="mb-5 rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
          <section className="rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              eyebrow="01"
              title="你以什么身份参与这场对话"
              description="这里不需要写真实姓名。我们只需要判断你更适合作为亲历者、观察者还是专业视角出现。"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel title="你希望我们如何称呼你？" hint="可以是假名、昵称，也可以不填。" />
                <input
                  value={draft.guestName}
                  onChange={(event) => updateDraft({ guestName: event.target.value.slice(0, 80) })}
                  className="min-h-11 w-full rounded-md border border-line px-4 text-sm"
                  placeholder="例如：阿北 / 某位研三 / 一位校友"
                />
              </div>
              <div>
                <FieldLabel title="你现在更接近哪种身份？" required />
                <select
                  value={draft.guestIdentity}
                  onChange={(event) => updateDraft({ guestIdentity: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm"
                >
                  <option value="">请选择</option>
                  {GUEST_IDENTITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel title="学校 / 城市 / 行业 / 机构背景" hint="非必填。可以模糊填写，例如“华东某高校”“互联网运营”。" />
                <input
                  value={draft.organization}
                  onChange={(event) => updateDraft({ organization: event.target.value.slice(0, 120) })}
                  className="min-h-11 w-full rounded-md border border-line px-4 text-sm"
                  placeholder="不需要写到会暴露身份的程度"
                />
              </div>
            </div>
            <div className="mt-5">
              <FieldLabel title="你和这些话题的关系更接近什么？" />
              <MultiChoice
                options={GUEST_RELATIONSHIP_OPTIONS}
                values={draft.relationshipToTopics}
                onChange={(relationshipToTopics) => updateDraft({ relationshipToTopics })}
                max={6}
              />
            </div>
          </section>

          <section className="rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              eyebrow="02"
              title="你最想聊哪些内容"
              description="请选择你愿意作为嘉宾展开的主题。可以选亲身经历，也可以选你观察到很多人的共同处境。"
            />
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-md bg-stone-100 px-3 py-1 text-stone-700">
                已选 {draft.selectedTopics.length}/8
              </span>
              {draft.selectedTopics.length === 0 ? <span className="text-coral">至少选择 1 个</span> : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {TOPICS.map((topic) => {
                const selected = draft.selectedTopics.includes(topic.id);
                const disabled = !selected && draft.selectedTopics.length >= 8;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleTopic(topic.id)}
                    className={cn(
                      "min-h-[136px] rounded-md border p-4 text-left transition",
                      selected
                        ? "border-teal bg-teal text-white"
                        : "border-line bg-white text-ink hover:border-teal hover:bg-teal/5",
                      disabled && "cursor-not-allowed opacity-45"
                    )}
                  >
                    <span className={cn("text-xs", selected ? "text-white/70" : "text-stone-500")}>
                      {topic.group}
                    </span>
                    <span className="mt-2 block font-semibold">{topic.title}</span>
                    <span className={cn("mt-2 block text-sm leading-6", selected ? "text-white/85" : "text-stone-600")}>
                      {topic.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel title="其中你最想展开聊哪一个？" required />
                <select
                  value={draft.strongestTopic}
                  onChange={(event) => updateDraft({ strongestTopic: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm"
                >
                  <option value="">请选择</option>
                  {selectedTopicObjects.map((topic) =>
                    topic ? (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ) : null
                  )}
                </select>
              </div>
              <div>
                <FieldLabel title="还有文档里没有列到、但你很想聊的主题吗？" />
                <input
                  value={draft.customTopics}
                  onChange={(event) => updateDraft({ customTopics: event.target.value.slice(0, 1000) })}
                  className="min-h-11 w-full rounded-md border border-line px-4 text-sm"
                  placeholder="例如：学院里的性别偏见、第一份工作的羞耻感……"
                />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              eyebrow="03"
              title="这期具体可以怎么聊"
              description="这里帮助节目组判断提纲：是讲一个完整故事，还是聊观点、经验、反驳和提醒。"
            />
            <div>
              <FieldLabel title="你比较愿意从哪些角度展开？" />
              <MultiChoice
                options={GUEST_TALK_ANGLE_OPTIONS}
                values={draft.talkAngles}
                onChange={(talkAngles) => updateDraft({ talkAngles })}
                max={8}
              />
            </div>
            <div className="mt-5">
              <FieldLabel title="有没有一段你觉得可以成为节目开头的经历？" />
              <TextArea
                value={draft.keyStory}
                onChange={(keyStory) => updateDraft({ keyStory })}
                maxLength={3000}
                placeholder="可以写一个场景、一次争吵、一次面试、一次搬家、一次和导师/父母/伴侣的对话。写得不完整也没关系。"
              />
            </div>
            <div className="mt-5">
              <FieldLabel title="如果真的录一期，你最想被问到什么？" />
              <TextArea
                value={draft.questionsWantToDiscuss}
                onChange={(questionsWantToDiscuss) => updateDraft({ questionsWantToDiscuss })}
                maxLength={2000}
                placeholder="可以写几个问题，也可以写你觉得网上总是讲错的一句话。"
              />
            </div>
          </section>

          <section className="rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              eyebrow="04"
              title="边界、公开程度和联系方式"
              description="嘉宾问卷默认只用于节目组内部沟通。真正公开前，会再次确认边界。"
            />
            <div className="rounded-md border border-coral/25 bg-coral/10 p-4 text-sm leading-6 text-stone-700">
              如果内容涉及伤害风险、现实危险、侵害经历或强烈心理痛苦，请优先联系现实中可信任的人、学校心理中心、当地紧急电话或专业机构。节目沟通不能替代现实帮助。
            </div>
            <div className="mt-5">
              <FieldLabel title="哪些内容需要特别保护或避免公开？" />
              <MultiChoice
                options={GUEST_SENSITIVE_TOPIC_OPTIONS}
                values={draft.sensitiveTopics}
                onChange={(sensitiveTopics) => updateDraft({ sensitiveTopics })}
                max={8}
              />
            </div>
            <div className="mt-5">
              <FieldLabel title="还有哪些边界需要提前说明？" />
              <TextArea
                value={draft.boundaries}
                onChange={(boundaries) => updateDraft({ boundaries })}
                maxLength={2000}
                placeholder="例如：不能提学校名；某段关系只能讲大意；可以聊经历但不想被问细节。"
              />
            </div>
            <div className="mt-5">
              <FieldLabel title="你更能接受哪些沟通或录制形式？" />
              <MultiChoice
                options={GUEST_FORMAT_OPTIONS}
                values={draft.preferredFormats}
                onChange={(preferredFormats) => updateDraft({ preferredFormats })}
                max={8}
              />
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <div>
                <FieldLabel title="大概什么时候方便沟通？" />
                <input
                  value={draft.availability}
                  onChange={(event) => updateDraft({ availability: event.target.value.slice(0, 500) })}
                  className="min-h-11 w-full rounded-md border border-line px-4 text-sm"
                  placeholder="例如：工作日晚上 / 周末下午"
                />
              </div>
              <div>
                <FieldLabel title="偏好的联系方式" />
                <select
                  value={draft.preferredContactMethod}
                  onChange={(event) => updateDraft({ preferredContactMethod: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-line bg-white px-4 text-sm"
                >
                  <option value="">请选择</option>
                  {GUEST_CONTACT_METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel title="联系方式" required={draft.consentToFollowUp} />
                <input
                  value={draft.contactInfo}
                  onChange={(event) => updateDraft({ contactInfo: event.target.value.slice(0, 300) })}
                  className="min-h-11 w-full rounded-md border border-line px-4 text-sm"
                  placeholder="微信 / 邮箱 / 小红书号等"
                />
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-line bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <input
                type="checkbox"
                checked={draft.consentToFollowUp}
                onChange={(event) => updateDraft({ consentToFollowUp: event.target.checked })}
                className="mt-1 h-4 w-4 accent-teal"
              />
              <span>
                我愿意节目组基于这份问卷后续联系我。联系方式只用于沟通，不会未经同意公开。
              </span>
            </label>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-white p-4 shadow-sm">
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-teal"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              返回观众问卷
            </a>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal/10 px-3 text-sm text-teal">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                联系方式加密保存
              </span>
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
                提交嘉宾问卷
              </button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
