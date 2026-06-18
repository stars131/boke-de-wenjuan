"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Eye,
  FileText,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Star,
  Users,
  Mic
} from "lucide-react";
import { TOPIC_GROUPS, TOPICS, getTopicById } from "@/lib/topics";
import { RISK_LEVEL_OPTIONS, STORY_STATUS_OPTIONS } from "@/lib/options";
import type {
  AudienceQuestionnaireSettings,
  GuestQuestionnaireSettings,
  QuestionnaireConfig,
  QuestionnaireKind
} from "@/lib/questionnaire-config";
import { cn, formatDateTime, truncateText } from "@/lib/utils";

type SessionPayload = {
  authenticated: boolean;
  session?: {
    username: string;
    role: "admin" | "superadmin";
  };
};

type AdminStats = {
  totalResponses: number;
  todayResponses: number;
  completionRate: number;
  averageSelectedTopics: number;
  storyCount: number;
  contactableCount: number;
  highValueStoryCount: number;
  guestResponseCount: number;
  topTopic: {
    topicId: string;
    title: string;
    heatScore: number;
  } | null;
};

type TopicAnalyticsItem = {
  topicId: string;
  title: string;
  group: string;
  selectedCount: number;
  topPriorityCount: number;
  storyCount: number;
  averageInterestScore: number;
  averageResonanceScore: number;
  averageDiscussionScore: number;
  heatScore: number;
  priority: "S" | "A" | "B" | "C" | "Deferred";
};

type ResponseItem = {
  responseId: string;
  createdAt: string;
  nickname?: string;
  identityStatus: string;
  currentStates: string[];
  selectedTopics: string[];
  topPriorityTopic: string;
  personalStory?: string;
  storyRelatedTopic?: string;
  storyEmotionIntensity?: number;
  participationWillingness: string[];
  hasContactInfo: boolean;
  additionalSuggestions?: string;
};

type StoryItem = {
  responseId: string;
  createdAt: string;
  nickname?: string;
  identityStatus: string;
  storyRelatedTopic?: string;
  personalStory: string;
  storyEmotionIntensity?: number;
  storyUsagePreference?: string;
  participationWillingness: string[];
  hasContactInfo: boolean;
  review?: {
    status: string;
    tags: string[];
    isHighValue: boolean;
    isPotentialGuest: boolean;
    riskLevel: string;
    note?: string;
  } | null;
};

type GuestItem = {
  responseId: string;
  createdAt: string;
  guestName?: string;
  guestIdentity: string;
  organization?: string;
  relationshipToTopics: string[];
  selectedTopics: string[];
  customTopics?: string;
  strongestTopic: string;
  talkAngles: string[];
  keyStory?: string;
  questionsWantToDiscuss?: string;
  boundaries?: string;
  sensitiveTopics: string[];
  preferredFormats: string[];
  availability?: string;
  preferredContactMethod?: string;
  hasContactInfo: boolean;
  consentToFollowUp: boolean;
};

type AdminTab = "dashboard" | "topics" | "responses" | "stories" | "guests" | "config" | "export";

function MetricCard({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-stone-500">{label}</span>
        <span className="text-teal">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-stone-500">{hint}</p> : null}
    </div>
  );
}

function LoginPanel({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !result.ok) {
      setError(result.error || "登录失败。");
      return;
    }

    onLogin();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-panel"
      >
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-teal text-white">
          <Shield className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-ink">管理员登录</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          本地预览默认账号为 admin / admin123。生产环境请改用 bcrypt 哈希密码。
        </p>
        {error ? (
          <div role="alert" className="mt-4 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </div>
        ) : null}
        <label className="mt-5 block text-sm font-medium text-stone-700" htmlFor="username">
          账号
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-md border border-line px-3 text-sm"
        />
        <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-md border border-line px-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          登录
        </button>
      </form>
    </main>
  );
}

function linesToOptions(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function OptionsTextarea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        value={value.join("\n")}
        onChange={(event) => onChange(linesToOptions(event.target.value))}
        rows={7}
        className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 text-sm leading-6"
      />
      <span className="mt-1 block text-xs text-stone-500">每行一个选项。</span>
    </label>
  );
}

export function AdminApp() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topics, setTopics] = useState<TopicAnalyticsItem[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [configs, setConfigs] = useState<QuestionnaireConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState<QuestionnaireKind | "">("");
  const [message, setMessage] = useState("");
  const [storyQuery, setStoryQuery] = useState("");
  const [storyStatus, setStoryStatus] = useState("");

  const authenticated = Boolean(session?.authenticated);

  const loadSession = async () => {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    const result = (await response.json()) as SessionPayload;
    setSession(result);
  };

  const loadData = async () => {
    if (!authenticated) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const query = new URLSearchParams();
      if (storyQuery) {
        query.set("q", storyQuery);
      }
      if (storyStatus) {
        query.set("status", storyStatus);
      }

      const [
        statsResponse,
        topicsResponse,
        responsesResponse,
        storiesResponse,
        guestsResponse,
        configResponse
      ] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/admin/topics", { cache: "no-store" }),
        fetch("/api/admin/responses?pageSize=30", { cache: "no-store" }),
        fetch(`/api/admin/stories?pageSize=30&${query.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/guests?pageSize=30", { cache: "no-store" }),
        fetch("/api/admin/config", { cache: "no-store" })
      ]);

      if (
        [statsResponse, topicsResponse, responsesResponse, storiesResponse, guestsResponse, configResponse].some(
          (response) => response.status === 401
        )
      ) {
        setSession({ authenticated: false });
        return;
      }

      const [statsJson, topicsJson, responsesJson, storiesJson, guestsJson, configJson] = await Promise.all([
        statsResponse.json(),
        topicsResponse.json(),
        responsesResponse.json(),
        storiesResponse.json(),
        guestsResponse.json(),
        configResponse.json()
      ]);

      setStats(statsJson);
      setTopics(topicsJson);
      setResponses(responsesJson.items || []);
      setStories(storiesJson.items || []);
      setGuests(guestsJson.items || []);
      setConfigs(configJson.configs || []);
    } catch {
      setMessage("加载后台数据失败。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const topFiveTopics = useMemo(() => topics.slice(0, 5), [topics]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession({ authenticated: false });
  };

  const updateReview = async (
    responseId: string,
    patch: {
      status?: string;
      riskLevel?: string;
      isHighValue?: boolean;
      isPotentialGuest?: boolean;
      tags?: string[];
      note?: string;
    }
  ) => {
    const response = await fetch(`/api/admin/stories/${responseId}/review`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patch)
    });

    if (!response.ok) {
      setMessage("更新审核状态失败。");
      return;
    }

    await loadData();
  };

  const download = (type: string, includeContact = false) => {
    window.location.href = `/api/admin/export?type=${type}&includeContact=${includeContact}`;
  };

  const updateConfig = (key: QuestionnaireKind, patch: Partial<QuestionnaireConfig>) => {
    setConfigs((current) =>
      current.map((config) => (config.key === key ? { ...config, ...patch } : config))
    );
  };

  const updateConfigSettings = (
    key: QuestionnaireKind,
    patch: Partial<AudienceQuestionnaireSettings & GuestQuestionnaireSettings>
  ) => {
    setConfigs((current) =>
      current.map((config) =>
        config.key === key
          ? {
              ...config,
              settings: {
                ...config.settings,
                ...patch
              }
            }
          : config
      )
    );
  };

  const saveConfig = async (config: QuestionnaireConfig) => {
    setSavingConfig(config.key);
    setMessage("");

    const response = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });
    const result = await response.json().catch(() => ({}));
    setSavingConfig("");

    if (!response.ok || !result.ok) {
      setMessage("保存问卷配置失败，请检查至少启用一个主题，且标题、说明不为空。");
      return;
    }

    setConfigs((current) =>
      current.map((item) => (item.key === config.key ? result.config : item))
    );
    setMessage("问卷配置已保存。");
  };

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        正在检查登录状态
      </main>
    );
  }

  if (!authenticated) {
    return <LoginPanel onLogin={loadSession} />;
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm text-stone-500">《大学生不必看》问卷后台</p>
            <h1 className="text-2xl font-semibold text-ink">选题与故事数据</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-teal/10 px-3 py-2 text-sm text-teal">
              {session.session?.username} · {session.session?.role}
            </span>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-teal"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
              刷新
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-coral"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {message ? (
          <div
            role="alert"
            className={cn(
              "mb-4 rounded-md px-4 py-3 text-sm",
              message.includes("已") ? "bg-teal/10 text-teal" : "bg-coral/10 text-coral"
            )}
          >
            {message}
          </div>
        ) : null}

        <nav className="mb-5 flex gap-2 overflow-x-auto survey-scrollbar" aria-label="后台标签页">
          {[
            ["dashboard", "概览", BarChart3],
            ["topics", "主题热度", Star],
            ["responses", "问卷列表", FileText],
            ["stories", "故事管理", MessageIcon],
            ["guests", "嘉宾问卷", Mic],
            ["config", "问卷配置", Settings2],
            ["export", "导出", Download]
          ].map(([key, label, Icon]) => (
            <button
              key={key as string}
              type="button"
              onClick={() => setTab(key as AdminTab)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold",
                tab === key
                  ? "border-teal bg-teal text-white"
                  : "border-line bg-white text-ink hover:border-teal"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label as string}
            </button>
          ))}
        </nav>

        {tab === "dashboard" ? (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Users className="h-5 w-5" aria-hidden="true" />}
                label="总提交数"
                value={stats?.totalResponses ?? 0}
                hint="所有有效问卷数量"
              />
              <MetricCard
                icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
                label="今日提交数"
                value={stats?.todayResponses ?? 0}
              />
              <MetricCard
                icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                label="有故事提交数"
                value={stats?.storyCount ?? 0}
              />
              <MetricCard
                icon={<Eye className="h-5 w-5" aria-hidden="true" />}
                label="愿意被联系人数"
                value={stats?.contactableCount ?? 0}
              />
              <MetricCard
                icon={<Star className="h-5 w-5" aria-hidden="true" />}
                label="高价值故事数"
                value={stats?.highValueStoryCount ?? 0}
              />
              <MetricCard
                icon={<Mic className="h-5 w-5" aria-hidden="true" />}
                label="嘉宾问卷数"
                value={stats?.guestResponseCount ?? 0}
                hint="潜在嘉宾提交的沟通表"
              />
              <MetricCard
                icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
                label="平均选择主题数"
                value={(stats?.averageSelectedTopics ?? 0).toFixed(1)}
              />
              <MetricCard
                icon={<Shield className="h-5 w-5" aria-hidden="true" />}
                label="完整填写率"
                value={`${Math.round((stats?.completionRate ?? 0) * 100)}%`}
              />
              <MetricCard
                icon={<Star className="h-5 w-5" aria-hidden="true" />}
                label="最热门主题"
                value={stats?.topTopic?.title || "暂无"}
                hint={
                  stats?.topTopic ? `热度分 ${stats.topTopic.heatScore.toFixed(1)}` : "提交后自动计算"
                }
              />
            </div>

            <div className="rounded-md border border-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink">当前 Top 5 主题</h2>
              <div className="mt-4 space-y-3">
                {topFiveTopics.length ? (
                  topFiveTopics.map((topic, index) => (
                    <div key={topic.topicId} className="grid gap-3 md:grid-cols-[44px_1fr_120px]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal/10 text-sm font-bold text-teal">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{topic.title}</p>
                        <p className="text-sm text-stone-500">
                          {topic.group} · 选择 {topic.selectedCount} · 故事 {topic.storyCount}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="font-semibold text-ink">{topic.heatScore.toFixed(1)}</p>
                        <p className="text-sm text-stone-500">优先级 {topic.priority}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">暂无提交数据。</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "topics" ? (
          <section className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
            <div className="overflow-x-auto survey-scrollbar">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead className="bg-stone-100 text-left text-stone-600">
                  <tr>
                    {[
                      "主题",
                      "分组",
                      "选择",
                      "第一优先",
                      "平均想看",
                      "平均共鸣",
                      "平均讨论欲",
                      "故事",
                      "热度分",
                      "优先级"
                    ].map((header) => (
                      <th key={header} className="px-4 py-3 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => (
                    <tr key={topic.topicId} className="border-t border-line">
                      <td className="px-4 py-3 font-semibold text-ink">{topic.title}</td>
                      <td className="px-4 py-3 text-stone-600">{topic.group}</td>
                      <td className="px-4 py-3">{topic.selectedCount}</td>
                      <td className="px-4 py-3">{topic.topPriorityCount}</td>
                      <td className="px-4 py-3">{topic.averageInterestScore.toFixed(2)}</td>
                      <td className="px-4 py-3">{topic.averageResonanceScore.toFixed(2)}</td>
                      <td className="px-4 py-3">{topic.averageDiscussionScore.toFixed(2)}</td>
                      <td className="px-4 py-3">{topic.storyCount}</td>
                      <td className="px-4 py-3 font-semibold">{topic.heatScore.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-amber/15 px-2 py-1 text-xs font-semibold text-amber">
                          {topic.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "responses" ? (
          <section className="space-y-3">
            {responses.length ? (
              responses.map((response) => (
                <article
                  key={response.responseId}
                  className="rounded-md border border-line bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-ink">
                        {response.nickname || "匿名"} · {response.identityStatus}
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">{formatDateTime(response.createdAt)}</p>
                    </div>
                    <span className="rounded-md bg-stone-100 px-3 py-1 text-xs text-stone-600">
                      {response.hasContactInfo ? "有联系方式" : "无联系方式"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    <p>
                      <span className="text-stone-500">第一优先：</span>
                      {getTopicById(response.topPriorityTopic)?.title || response.topPriorityTopic}
                    </p>
                    <p>
                      <span className="text-stone-500">选择主题数：</span>
                      {response.selectedTopics.length}
                    </p>
                    <p>
                      <span className="text-stone-500">参与意愿：</span>
                      {response.participationWillingness.join("、") || "未填写"}
                    </p>
                  </div>
                  {response.personalStory ? (
                    <p className="mt-3 rounded-md bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                      {truncateText(response.personalStory, 220)}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-md border border-line bg-white p-5 text-sm text-stone-500">
                暂无问卷提交。
              </div>
            )}
          </section>
        ) : null}

        {tab === "stories" ? (
          <section className="space-y-4">
            <div className="rounded-md border border-line bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <input
                    value={storyQuery}
                    onChange={(event) => setStoryQuery(event.target.value)}
                    placeholder="搜索故事或昵称"
                    className="min-h-10 w-full rounded-md border border-line pl-9 pr-3 text-sm"
                  />
                </label>
                <select
                  value={storyStatus}
                  onChange={(event) => setStoryStatus(event.target.value)}
                  className="min-h-10 rounded-md border border-line px-3 text-sm"
                >
                  <option value="">全部状态</option>
                  {STORY_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={loadData}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  筛选
                </button>
              </div>
            </div>

            {stories.length ? (
              stories.map((story) => (
                <article key={story.responseId} className="rounded-md border border-line bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-ink">
                        {story.nickname || "匿名"} · {story.identityStatus}
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        {formatDateTime(story.createdAt)} ·{" "}
                        {getTopicById(story.storyRelatedTopic)?.title || "未选主题"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">
                        情绪 {story.storyEmotionIntensity || "-"}
                      </span>
                      {story.hasContactInfo ? (
                        <span className="rounded-md bg-teal/10 px-2 py-1 text-xs text-teal">
                          有联系
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                    {story.personalStory}
                  </p>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[160px_160px_1fr_auto_auto]">
                    <select
                      value={story.review?.status || "new"}
                      onChange={(event) => updateReview(story.responseId, { status: event.target.value })}
                      className="min-h-10 rounded-md border border-line px-3 text-sm"
                    >
                      {STORY_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <select
                      value={story.review?.riskLevel || "normal"}
                      onChange={(event) => updateReview(story.responseId, { riskLevel: event.target.value })}
                      className="min-h-10 rounded-md border border-line px-3 text-sm"
                    >
                      {RISK_LEVEL_OPTIONS.map((risk) => (
                        <option key={risk} value={risk}>
                          {risk}
                        </option>
                      ))}
                    </select>
                    <input
                      defaultValue={story.review?.tags?.join(", ") || ""}
                      onBlur={(event) =>
                        updateReview(story.responseId, {
                          tags: event.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                        })
                      }
                      placeholder="标签，用英文逗号分隔"
                      className="min-h-10 rounded-md border border-line px-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateReview(story.responseId, {
                          isHighValue: !story.review?.isHighValue
                        })
                      }
                      className={cn(
                        "min-h-10 rounded-md border px-3 text-sm font-semibold",
                        story.review?.isHighValue
                          ? "border-amber bg-amber text-white"
                          : "border-line bg-white text-ink"
                      )}
                    >
                      高价值
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateReview(story.responseId, {
                          isPotentialGuest: !story.review?.isPotentialGuest
                        })
                      }
                      className={cn(
                        "min-h-10 rounded-md border px-3 text-sm font-semibold",
                        story.review?.isPotentialGuest
                          ? "border-teal bg-teal text-white"
                          : "border-line bg-white text-ink"
                      )}
                    >
                      可采访
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-line bg-white p-5 text-sm text-stone-500">
                暂无故事投稿。
              </div>
            )}
          </section>
        ) : null}

        {tab === "guests" ? (
          <section className="space-y-3">
            {guests.length ? (
              guests.map((guest) => (
                <article
                  key={guest.responseId}
                  className="rounded-md border border-line bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-ink">
                        {guest.guestName || "匿名嘉宾"} · {guest.guestIdentity}
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        {formatDateTime(guest.createdAt)}
                        {guest.organization ? ` · ${guest.organization}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-teal/10 px-2 py-1 text-xs text-teal">
                        {guest.consentToFollowUp ? "愿意联系" : "暂不联系"}
                      </span>
                      <span className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">
                        {guest.hasContactInfo ? "有联系方式" : "无联系方式"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    <p>
                      <span className="text-stone-500">最想聊：</span>
                      {getTopicById(guest.strongestTopic)?.title || guest.strongestTopic}
                    </p>
                    <p>
                      <span className="text-stone-500">可聊主题数：</span>
                      {guest.selectedTopics.length}
                    </p>
                    <p>
                      <span className="text-stone-500">偏好形式：</span>
                      {guest.preferredFormats.join("、") || "未填写"}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {guest.relationshipToTopics.map((item) => (
                      <span key={item} className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">
                        {item}
                      </span>
                    ))}
                  </div>

                  {guest.keyStory ? (
                    <p className="mt-3 whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                      {truncateText(guest.keyStory, 260)}
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    {guest.questionsWantToDiscuss ? (
                      <div className="rounded-md border border-line p-3">
                        <p className="font-semibold text-ink">想被问到</p>
                        <p className="mt-1 leading-6 text-stone-700">
                          {truncateText(guest.questionsWantToDiscuss, 180)}
                        </p>
                      </div>
                    ) : null}
                    {guest.boundaries ? (
                      <div className="rounded-md border border-line p-3">
                        <p className="font-semibold text-ink">边界说明</p>
                        <p className="mt-1 leading-6 text-stone-700">
                          {truncateText(guest.boundaries, 180)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-line bg-white p-5 text-sm text-stone-500">
                暂无嘉宾问卷提交。
              </div>
            )}
          </section>
        ) : null}

        {tab === "config" ? (
          <section className="space-y-5">
            {configs.map((config) => {
              const isAudience = config.key === "audience";
              const audienceSettings = config.settings as AudienceQuestionnaireSettings;
              const guestSettings = config.settings as GuestQuestionnaireSettings;

              return (
                <article key={config.key} className="rounded-md border border-line bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-teal">
                        {isAudience ? "观众问卷" : "嘉宾问卷"}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-ink">{config.title}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveConfig(config)}
                      disabled={savingConfig === config.key}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-60"
                    >
                      {savingConfig === config.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : null}
                      保存配置
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-ink">问卷标题</span>
                      <input
                        value={config.title}
                        onChange={(event) => updateConfig(config.key, { title: event.target.value })}
                        className="mt-2 min-h-10 w-full rounded-md border border-line px-3 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-ink">入口按钮文案</span>
                      <input
                        value={config.ctaLabel}
                        onChange={(event) => updateConfig(config.key, { ctaLabel: event.target.value })}
                        className="mt-2 min-h-10 w-full rounded-md border border-line px-3 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-ink">顶部标签</span>
                      <input
                        value={config.introBadge}
                        onChange={(event) => updateConfig(config.key, { introBadge: event.target.value })}
                        className="mt-2 min-h-10 w-full rounded-md border border-line px-3 text-sm"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-ink">最少主题数</span>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={config.settings.minTopicSelections}
                          onChange={(event) =>
                            updateConfigSettings(config.key, {
                              minTopicSelections: Number(event.target.value)
                            })
                          }
                          className="mt-2 min-h-10 w-full rounded-md border border-line px-3 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-ink">最多主题数</span>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={config.settings.maxTopicSelections}
                          onChange={(event) =>
                            updateConfigSettings(config.key, {
                              maxTopicSelections: Number(event.target.value)
                            })
                          }
                          className="mt-2 min-h-10 w-full rounded-md border border-line px-3 text-sm"
                        />
                      </label>
                    </div>
                    <label className="block md:col-span-2">
                      <span className="text-sm font-semibold text-ink">问卷简介</span>
                      <textarea
                        value={config.description}
                        onChange={(event) => updateConfig(config.key, { description: event.target.value })}
                        rows={3}
                        className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 text-sm leading-6"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-sm font-semibold text-ink">进入页说明</span>
                      <textarea
                        value={config.introText}
                        onChange={(event) => updateConfig(config.key, { introText: event.target.value })}
                        rows={4}
                        className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 text-sm leading-6"
                      />
                    </label>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold text-ink">启用主题</h3>
                    <div className="mt-3 space-y-3">
                      {TOPIC_GROUPS.map((group) => (
                        <div key={group} className="rounded-md border border-line p-3">
                          <p className="text-sm font-semibold text-stone-700">{group}</p>
                          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {TOPICS.filter((topic) => topic.group === group).map((topic) => {
                              const checked = config.enabledTopicIds.includes(topic.id);
                              const cannotRemove = checked && config.enabledTopicIds.length <= 1;

                              return (
                                <label
                                  key={topic.id}
                                  className="flex cursor-pointer items-start gap-2 rounded-md bg-stone-50 p-3 text-sm leading-5"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={cannotRemove}
                                    onChange={() => {
                                      updateConfig(config.key, {
                                        enabledTopicIds: checked
                                          ? config.enabledTopicIds.filter((topicId) => topicId !== topic.id)
                                          : [...config.enabledTopicIds, topic.id]
                                      });
                                    }}
                                    className="mt-1 h-4 w-4 accent-teal"
                                  />
                                  <span>
                                    <span className="font-semibold text-ink">{topic.title}</span>
                                    <span className="mt-1 block text-xs text-stone-500">{topic.description}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {isAudience ? (
                      <>
                        <OptionsTextarea
                          label="身份选项"
                          value={audienceSettings.identityOptions}
                          onChange={(value) => updateConfigSettings(config.key, { identityOptions: value })}
                        />
                        <OptionsTextarea
                          label="当前状态选项"
                          value={audienceSettings.currentStateOptions}
                          onChange={(value) => updateConfigSettings(config.key, { currentStateOptions: value })}
                        />
                        <OptionsTextarea
                          label="内容平台选项"
                          value={audienceSettings.contentPlatformOptions}
                          onChange={(value) => updateConfigSettings(config.key, { contentPlatformOptions: value })}
                        />
                        <OptionsTextarea
                          label="内容形式选项"
                          value={audienceSettings.preferredFormatOptions}
                          onChange={(value) => updateConfigSettings(config.key, { preferredFormatOptions: value })}
                        />
                        <OptionsTextarea
                          label="参与方式选项"
                          value={audienceSettings.participationOptions}
                          onChange={(value) => updateConfigSettings(config.key, { participationOptions: value })}
                        />
                      </>
                    ) : (
                      <>
                        <OptionsTextarea
                          label="嘉宾身份选项"
                          value={guestSettings.identityOptions}
                          onChange={(value) => updateConfigSettings(config.key, { identityOptions: value })}
                        />
                        <OptionsTextarea
                          label="话题关系选项"
                          value={guestSettings.relationshipOptions}
                          onChange={(value) => updateConfigSettings(config.key, { relationshipOptions: value })}
                        />
                        <OptionsTextarea
                          label="展开角度选项"
                          value={guestSettings.talkAngleOptions}
                          onChange={(value) => updateConfigSettings(config.key, { talkAngleOptions: value })}
                        />
                        <OptionsTextarea
                          label="敏感边界选项"
                          value={guestSettings.sensitiveTopicOptions}
                          onChange={(value) => updateConfigSettings(config.key, { sensitiveTopicOptions: value })}
                        />
                        <OptionsTextarea
                          label="录制形式选项"
                          value={guestSettings.preferredFormatOptions}
                          onChange={(value) => updateConfigSettings(config.key, { preferredFormatOptions: value })}
                        />
                        <OptionsTextarea
                          label="联系方式选项"
                          value={guestSettings.contactMethodOptions}
                          onChange={(value) => updateConfigSettings(config.key, { contactMethodOptions: value })}
                        />
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        {tab === "export" ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["responses", "导出问卷", "完整问卷记录，默认不包含联系方式。"],
              ["topics", "导出主题统计", "主题热度、评分和节目优先级。"],
              ["stories", "导出故事", "投稿故事、使用偏好和审核状态。"],
              ["guest-leads", "导出嘉宾线索", "有联系意愿或被标记可采访的故事。"],
              ["guest-responses", "导出嘉宾问卷", "潜在嘉宾想聊内容、边界和沟通偏好。"]
            ].map(([type, title, description]) => (
              <div key={type} className="rounded-md border border-line bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-ink">{title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-stone-600">{description}</p>
                <button
                  type="button"
                  onClick={() => download(type)}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-teal px-3 text-sm font-semibold text-white"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  CSV
                </button>
                {session.session?.role === "superadmin" && type !== "topics" ? (
                  <button
                    type="button"
                    onClick={() => download(type, true)}
                    className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-coral"
                  >
                    含联系方式
                  </button>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function MessageIcon(props: React.ComponentProps<typeof FileText>) {
  return <FileText {...props} />;
}
