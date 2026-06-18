"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileSearch, Loader2, Mic, Shield, UserRound } from "lucide-react";

type LookupTopic = {
  id: string;
  title: string;
};

type LookupResult = {
  nickname: string;
  audience: {
    responseId: string;
    createdAt: string;
    identityStatus: string;
    selectedTopics: LookupTopic[];
    topPriorityTopic: LookupTopic;
    hasStory: boolean;
    participationWillingness: string[];
  }[];
  guests: {
    responseId: string;
    createdAt: string;
    guestIdentity: string;
    organization?: string;
    selectedTopics: LookupTopic[];
    strongestTopic: LookupTopic;
    talkAngles: string[];
    consentToFollowUp: boolean;
  }[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function EntryCard({
  href,
  icon,
  title,
  description,
  cta
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[220px] flex-col justify-between rounded-md border border-line bg-white p-5 shadow-sm transition hover:border-teal hover:shadow-panel"
    >
      <div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-teal/10 text-teal">
          {icon}
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal">
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function HomePortal() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/submissions/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nickname })
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "查询失败。");
      }

      setResult(data);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "查询失败。");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = Boolean(result && (result.audience.length || result.guests.length));

  return (
    <main className="min-h-screen bg-paper">
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-[url('/survey-hero.png')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/80 to-ink" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="inline-flex rounded-md bg-white/10 px-3 py-1 text-sm backdrop-blur">
            《大学生不必看》问卷中心
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            选择你的身份，再进入对应问卷
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-stone-200">
            观众和嘉宾问卷已经分开保存。填写时设置一个唯一昵称，后续可以在这里查询自己的提交记录。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <EntryCard
            href="/survey"
            icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
            title="我是观众"
            description="选择你想看的主题，给选题评分，也可以留下故事、建议或后续参与意愿。"
            cta="进入观众问卷"
          />
          <EntryCard
            href="/guest"
            icon={<Mic className="h-5 w-5" aria-hidden="true" />}
            title="我是嘉宾"
            description="填写可聊主题、故事角度、公开边界和录制偏好，帮助节目组提前判断适配度。"
            cta="进入嘉宾问卷"
          />
          <EntryCard
            href="/admin"
            icon={<Shield className="h-5 w-5" aria-hidden="true" />}
            title="管理员入口"
            description="查看提交数据、管理故事线索、导出 CSV，并配置观众和嘉宾两套问卷内容。"
            cta="进入后台"
          />
        </div>

        <section className="mt-8 rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-teal/10 text-teal">
                <FileSearch className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-ink">查询我的提交记录</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                输入填写时使用的唯一昵称，可以看到该昵称下的观众问卷和嘉宾问卷摘要。联系方式不会在查询结果中展示。
              </p>
              <form onSubmit={lookup} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value.slice(0, 80))}
                  placeholder="输入你的唯一昵称"
                  className="min-h-11 flex-1 rounded-md border border-line px-4 text-sm text-ink"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal px-5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  查询
                </button>
              </form>
              {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
            </div>

            <div className="rounded-md border border-line bg-stone-50 p-4">
              {!result ? (
                <p className="text-sm leading-6 text-stone-600">查询结果会显示在这里。</p>
              ) : hasResults ? (
                <div className="space-y-4">
                  {result.audience.map((item) => (
                    <article key={item.responseId} className="rounded-md border border-line bg-white p-4">
                      <p className="text-xs font-semibold text-teal">观众问卷</p>
                      <h3 className="mt-2 font-semibold text-ink">
                        {item.identityStatus} · {formatDate(item.createdAt)}
                      </h3>
                      <p className="mt-2 text-sm text-stone-600">
                        第一优先：{item.topPriorityTopic.title || "未记录"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        已选主题：{item.selectedTopics.map((topic) => topic.title).join("、")}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.hasStory ? "已提交故事" : "未提交故事"} ·{" "}
                        {item.participationWillingness.join("、") || "未填写参与意愿"}
                      </p>
                    </article>
                  ))}
                  {result.guests.map((item) => (
                    <article key={item.responseId} className="rounded-md border border-line bg-white p-4">
                      <p className="text-xs font-semibold text-teal">嘉宾问卷</p>
                      <h3 className="mt-2 font-semibold text-ink">
                        {item.guestIdentity} · {formatDate(item.createdAt)}
                      </h3>
                      <p className="mt-2 text-sm text-stone-600">
                        最想聊：{item.strongestTopic.title || "未记录"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        已选主题：{item.selectedTopics.map((topic) => topic.title).join("、")}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.consentToFollowUp ? "愿意后续联系" : "暂不后续联系"}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-stone-600">
                  没有查到昵称“{result.nickname}”的提交记录。请确认填写时使用的昵称。
                </p>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
