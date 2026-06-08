import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildTopicAnalytics } from "@/lib/analytics";
import { requireAdminSession } from "@/lib/admin-auth";
import { decryptContactInfo } from "@/lib/security";
import { toCsv } from "@/lib/csv";
import { getTopicById } from "@/lib/topics";

function csvResponse(filename: string, csv: string) {
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

export async function GET(request: Request) {
  const session = requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "responses";
  const includeContact = url.searchParams.get("includeContact") === "true";

  if (includeContact && session.role !== "superadmin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const responses = await prisma.surveyResponse.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      topicRatings: true,
      review: true
    }
  });

  if (type === "topics") {
    const analytics = buildTopicAnalytics(responses);
    const csv = toCsv(
      [
        "主题ID",
        "主题名称",
        "分组",
        "选择次数",
        "第一优先次数",
        "故事数",
        "平均想看",
        "平均共鸣",
        "平均讨论欲",
        "热度分",
        "优先级"
      ],
      analytics.map((item) => [
        item.topicId,
        item.title,
        item.group,
        item.selectedCount,
        item.topPriorityCount,
        item.storyCount,
        item.averageInterestScore.toFixed(2),
        item.averageResonanceScore.toFixed(2),
        item.averageDiscussionScore.toFixed(2),
        item.heatScore.toFixed(2),
        item.priority
      ])
    );

    return csvResponse("topic-analytics.csv", csv);
  }

  if (type === "guest-responses") {
    const guests = await prisma.guestSurveyResponse.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    const headers = [
      "提交时间",
      "称呼",
      "嘉宾身份",
      "背景",
      "关联方式",
      "想聊主题",
      "最想展开主题",
      "自定义主题",
      "展开角度",
      "关键故事",
      "想被问到的问题",
      "边界说明",
      "敏感内容",
      "偏好形式",
      "可沟通时间",
      "偏好联系方式",
      "愿意后续联系",
      "有联系方式"
    ];
    const contactHeader = includeContact ? ["联系方式"] : [];
    const csv = toCsv(
      [...headers, ...contactHeader],
      guests.map((guest) => [
        guest.createdAt.toISOString(),
        guest.guestName,
        guest.guestIdentity,
        guest.organization,
        guest.relationshipToTopics,
        guest.selectedTopics.map((topicId) => getTopicById(topicId)?.title || topicId),
        getTopicById(guest.strongestTopic)?.title || guest.strongestTopic,
        guest.customTopics,
        guest.talkAngles,
        guest.keyStory,
        guest.questionsWantToDiscuss,
        guest.boundaries,
        guest.sensitiveTopics,
        guest.preferredFormats,
        guest.availability,
        guest.preferredContactMethod,
        guest.consentToFollowUp,
        Boolean(guest.contactInfoEncrypted),
        ...(includeContact
          ? [
              guest.contactInfoEncrypted
                ? decryptContactInfo(guest.contactInfoEncrypted)
                : ""
            ]
          : [])
      ])
    );

    return csvResponse("guest-responses.csv", csv);
  }

  const storyRows = responses.filter((response) => response.personalStory);

  if (type === "stories" || type === "guest-leads") {
    const rows =
      type === "guest-leads"
        ? storyRows.filter(
            (response) => response.review?.isPotentialGuest || response.contactInfoEncrypted
          )
        : storyRows;
    const headers = [
      "提交时间",
      "昵称",
      "身份",
      "故事主题",
      "情绪强度",
      "使用偏好",
      "愿意参与",
      "有联系方式",
      "故事",
      "审核状态",
      "标签",
      "高价值",
      "可采访"
    ];
    const contactHeader = includeContact ? ["联系方式"] : [];
    const csv = toCsv(
      [...headers, ...contactHeader],
      rows.map((response) => [
        response.createdAt.toISOString(),
        response.nickname,
        response.identityStatus,
        getTopicById(response.storyRelatedTopic)?.title || response.storyRelatedTopic,
        response.storyEmotionIntensity,
        response.storyUsagePreference,
        response.participationWillingness,
        Boolean(response.contactInfoEncrypted),
        response.personalStory,
        response.review?.status,
        response.review?.tags || [],
        response.review?.isHighValue,
        response.review?.isPotentialGuest,
        ...(includeContact
          ? [
              response.contactInfoEncrypted
                ? decryptContactInfo(response.contactInfoEncrypted)
                : ""
            ]
          : [])
      ])
    );

    return csvResponse(`${type}.csv`, csv);
  }

  const responseHeaders = [
    "提交时间",
    "昵称",
    "身份",
    "当前状态",
    "平台",
    "偏好形式",
    "选择主题",
    "第一优先主题",
    "私下想听主题",
    "故事主题",
    "有故事",
    "愿意参与",
    "有联系方式",
    "补充建议"
  ];
  const contactHeader = includeContact ? ["联系方式"] : [];
  const csv = toCsv(
    [...responseHeaders, ...contactHeader],
    responses.map((response) => [
      response.createdAt.toISOString(),
      response.nickname,
      response.identityStatus,
      response.currentStates,
      response.contentPlatforms,
      response.preferredFormats,
      response.selectedTopics.map((topicId) => getTopicById(topicId)?.title || topicId),
      getTopicById(response.topPriorityTopic)?.title || response.topPriorityTopic,
      getTopicById(response.privateButWantToHearTopic)?.title ||
        response.privateButWantToHearTopic,
      getTopicById(response.storyRelatedTopic)?.title || response.storyRelatedTopic,
      Boolean(response.personalStory),
      response.participationWillingness,
      Boolean(response.contactInfoEncrypted),
      response.additionalSuggestions,
      ...(includeContact
        ? [
            response.contactInfoEncrypted
              ? decryptContactInfo(response.contactInfoEncrypted)
              : ""
          ]
        : [])
    ])
  );

  return csvResponse("responses.csv", csv);
}
