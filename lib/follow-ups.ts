import type { TopicId } from "@/lib/topics";

/**
 * 主题深入问题与结尾常规问题。
 *
 * 设计原则：
 * - 由用户的选择（最想先做的主题）决定后续追问，而不是一次性铺开所有问题。
 * - 「深度而不冒昧」：每个主题先给一个轻量的「角度」选择题（快速、低压力、用于内容方向），
 *   再给一个可不填的开放题（更深，但永远不预设你正在经历什么，也不要求暴露隐私）。
 * - 题干尽量用「如果」「愿意的话」「有没有」这类邀请式说法，把要不要回答的主动权交还给填写者；
 *   敏感主题（恋爱边界、分手、家庭、身体、性、钱、导学关系等）措辞更克制。
 */

export type FollowUpQuestion = {
  /** 唯一键，作为 followUpAnswers 的 key 存储，形如 `topicId.angle` / `general.loop`。 */
  id: string;
  kind: "single" | "multi" | "text";
  title: string;
  hint?: string;
  /** single / multi 用 */
  options?: string[];
  /** multi 最多可选 */
  max?: number;
  /** text 用 */
  placeholder?: string;
  maxLength?: number;
};

function angle(topicId: TopicId, title: string, options: string[]): FollowUpQuestion {
  return {
    id: `${topicId}.angle`,
    kind: "multi",
    title,
    hint: "可多选（最多 2 个），不选也完全可以——只是想知道你更在意哪一面。",
    options,
    max: 2
  };
}

function reflect(
  topicId: TopicId,
  title: string,
  placeholder: string,
  maxLength = 800
): FollowUpQuestion {
  return {
    id: `${topicId}.reflect`,
    kind: "text",
    title,
    hint: "可以跳过。愿意的话写一点点就好，不用完整、也不用工整。",
    placeholder,
    maxLength
  };
}

export const TOPIC_FOLLOW_UPS: Record<TopicId, FollowUpQuestion[]> = {
  "identity-unloading": [
    angle("identity-unloading", "如果聊到「毕业身份卸载期」，你更想听哪一面？", [
      "突然没人给标准答案的空白",
      "从被安排到要自己负责的落差",
      "“毕业了却好像没长大”的感觉",
      "身边人都在往前，自己慢半拍",
      "重新想清楚“我到底是谁”"
    ]),
    reflect(
      "identity-unloading",
      "有没有某个不经意的瞬间，让你感觉“学生”这个身份正在慢慢离开？",
      "比如某次填表、被叫错称呼、回学校发现好像不太属于这里……愿意的话说说看。"
    )
  ],
  "job-search-self-worth": [
    angle("job-search-self-worth", "如果聊到「求职失序与自我价值」，你更想听哪一面？", [
      "拒信和已读不回怎么消化",
      "怎么把自我价值和 offer 分开",
      "和同辈比较带来的内耗",
      "海投到麻木后的空心感",
      "“差不多得了”和“不甘心”之间"
    ]),
    reflect(
      "job-search-self-worth",
      "找工作这段时间，如果有过不太好受的时刻，大概是什么样的？",
      "可以只写一个场景，写不写结果都没关系。"
    )
  ],
  "advisor-thesis-anxiety": [
    angle("advisor-thesis-anxiety", "如果聊到「导学关系与论文焦虑」，你更想听哪一面？", [
      "导师边界不清时怎么自处",
      "论文卡住时的自我怀疑",
      "想求助却不知道找谁",
      "对延期的担心",
      "学术里那些说不清的委屈"
    ]),
    reflect(
      "advisor-thesis-anxiety",
      "如果最近有让你为难的状态，它更像是具体某件事，还是说不清的一团？",
      "可以跳过，也可以只写一句。不需要点名任何人。"
    )
  ],
  "delayed-graduation-gap": [
    angle("delayed-graduation-gap", "如果聊到「延毕、gap 与失败叙事」，你更想听哪一面？", [
      "怎么跟家里 / 朋友解释",
      "履历空窗带来的现实顾虑",
      "“掉队”的感觉从哪来",
      "重新理解“慢一点也行”",
      "空窗期里怎么稳住自己"
    ]),
    reflect(
      "delayed-graduation-gap",
      "如果不用向任何人解释，你其实想怎么过这段时间？",
      "随便写，哪怕听起来不太“上进”也没关系。"
    )
  ],
  "sleep-phone-time-collapse": [
    angle("sleep-phone-time-collapse", "如果聊到「睡眠拖延、手机依赖与时间感崩坏」，你更想听哪一面？", [
      "报复性熬夜背后的情绪",
      "手机停不下来的那种空",
      "白天黑夜都不太属于自己",
      "试过哪些没怎么管用的“自律”",
      "怎么温和地夺回一点日常"
    ]),
    reflect(
      "sleep-phone-time-collapse",
      "熬夜的时候，你心里通常在想些什么？",
      "愿意的话说说看，比如：不想面对明天、舍不得这一天结束、在等一条消息……"
    )
  ],
  "social-anxiety": [
    angle("social-anxiety", "如果聊到「社交焦虑与不会开口」，你更想听哪一面？", [
      "不知道怎么开口的卡点",
      "担心被拒绝 / 冷场",
      "“看起来合群”的疲惫",
      "线上能聊、线下就僵",
      "怎么低压力地和人连接"
    ]),
    reflect(
      "social-anxiety",
      "有没有过“本来想说话，最后还是没开口”的时候？",
      "愿意的话说说当时的场合。写了我们会很小心地聊。"
    )
  ],
  "relationship-boundaries": [
    angle("relationship-boundaries", "如果聊到「恋爱中的边界与危险信号」，你更想听哪一面？", [
      "被包装成“在乎”的控制",
      "什么样算越界",
      "冷暴力怎么识别",
      "“同意”到底意味着什么",
      "想离开却不容易走"
    ]),
    reflect(
      "relationship-boundaries",
      "有没有一种“说不上为什么，但不太舒服”的感觉，你一直没找到词形容？",
      "可以跳过。不用写出具体的人或事，写感受就好。"
    )
  ],
  "breakup-recovery": [
    angle("breakup-recovery", "如果聊到「分手、和解与情绪恢复」，你更想听哪一面？", [
      "分手后怎么过日常",
      "反复想起 / 忍不住联系",
      "那些没说完的告别",
      "重新一个人生活",
      "不急着“走出来”"
    ]),
    reflect(
      "breakup-recovery",
      "如果你有过这样的经历，现在回头看，它给你留下了什么？",
      "不想说也完全没关系；哪个先想到就写哪个。"
    )
  ],
  "long-distance-divergence": [
    angle("long-distance-divergence", "如果聊到「异地关系与人生分岔」，你更想听哪一面？", [
      "城市选择怎么谈",
      "两个人节奏不同步",
      "为对方妥协的边界",
      "承诺和现实成本",
      "怎么聊“未来”不变成吵架"
    ]),
    reflect(
      "long-distance-divergence",
      "关于异地，或者“两个人慢慢走向不同方向”，最让你在意的是什么？",
      "愿意的话说说看。"
    )
  ],
  "family-expectations": [
    angle("family-expectations", "如果聊到「家庭期待：考编、留城与婚育」，你更想听哪一面？", [
      "“稳定一点”背后到底是什么",
      "考编 / 考公的拉扯",
      "婚育的催促",
      "留在这座城还是回家",
      "怎么和父母谈边界"
    ]),
    reflect(
      "family-expectations",
      "家里的期待里，最让你在意的是哪一点？",
      "愿意的话说说看，你心里其实更想怎么回应。"
    )
  ],
  "internship-anxiety": [
    angle("internship-anxiety", "如果聊到「暑期实习前移与履历焦虑」，你更想听哪一面？", [
      "“是不是已经晚了”的不安",
      "信息差带来的吃亏",
      "大二大三就开始卷",
      "普通学生怎么补上",
      "怎么不被履历绑架"
    ]),
    reflect(
      "internship-anxiety",
      "关于实习、关于“是不是太晚了”，最近有没有让你在意的时刻？",
      "愿意的话说说看。"
    )
  ],
  "internship-rights": [
    angle("internship-rights", "如果聊到「实习权益、合同与试用期」，你更想听哪一面？", [
      "实习协议要看什么",
      "试用期的坑",
      "加班 / 薪资怎么谈",
      "被坑了之后怎么办",
      "离职 / 转正的门道"
    ]),
    reflect(
      "internship-rights",
      "你或身边人在实习里，有没有遇到过最该被提前说破的坑？",
      "愿意的话说说看，具体一点会更有用。"
    )
  ],
  "part-time-side-income": [
    angle("part-time-side-income", "如果聊到「兼职、副业与第一桶金」，你更想听哪一面？", [
      "第一笔自己赚的钱",
      "副业怎么起步",
      "踩过哪些坑",
      "赚钱带来的独立感",
      "时间 / 精力的代价"
    ]),
    reflect(
      "part-time-side-income",
      "关于“靠自己赚钱”，有没有一个让你印象比较深的瞬间？",
      "愿意的话说说看。"
    )
  ],
  "living-expense-consumption": [
    angle("living-expense-consumption", "如果聊到「生活费、消费、储蓄与网贷边界」，你更想听哪一面？", [
      "钱不够又想自由",
      "消费欲和事后的后悔",
      "要不要分期 / 网贷",
      "向家里要钱时的别扭",
      "怎么聊钱不带评判"
    ]),
    reflect(
      "living-expense-consumption",
      "关于钱，有没有一件你一直没怎么跟人说过的小事？",
      "可以跳过。不写金额也没关系。"
    )
  ],
  "renting-first-city": [
    angle("renting-first-city", "如果聊到「租房、搬家与落脚第一城」，你更想听哪一面？", [
      "第一次租房手忙脚乱",
      "和室友 / 中介打交道",
      "通勤和预算的取舍",
      "一个人住的孤独 / 自由",
      "一座城怎么慢慢变成“家”"
    ]),
    reflect(
      "renting-first-city",
      "你现在住的地方，有没有让你觉得“这才像我的生活”的瞬间？",
      "愿意的话说说看。"
    )
  ],
  "clubs-student-work": [
    angle("clubs-student-work", "如果聊到「社团、学生工作与校园文化」，你更想听哪一面？", [
      "到底是成长还是消耗",
      "权力感和人情",
      "付出没被看见",
      "退出算不算一种成长",
      "真正学到的是什么"
    ]),
    reflect(
      "clubs-student-work",
      "如果重来一次，你还会加入吗？",
      "愿意的话说说为什么。"
    )
  ],
  "hobbies-non-utilitarian-growth": [
    angle("hobbies-non-utilitarian-growth", "如果聊到「爱好、手作、运动与不功利成长」，你更想听哪一面？", [
      "不赚钱的爱好还要不要",
      "把爱好做成作品集的累",
      "纯粹开心的那种状态",
      "坚持不下去的拉扯",
      "允许自己“低绩效”地活"
    ]),
    reflect(
      "hobbies-non-utilitarian-growth",
      "有没有一件事，你做的时候完全忘了“有没有用”？",
      "愿意的话说说看。"
    )
  ],
  "social-media-persona-fatigue": [
    angle("social-media-persona-fatigue", "如果聊到「社交媒体分身与人设疲劳」，你更想听哪一面？", [
      "几个账号、几个“我”",
      "朋友圈要不要发",
      "被观看的累",
      "真实的自己藏在哪",
      "表达需要的安全距离"
    ]),
    reflect(
      "social-media-persona-fatigue",
      "不同平台上的你，会不太一样吗？如果会，差别在哪？",
      "愿意的话说说看。"
    )
  ],
  "appearance-body-anxiety": [
    angle("appearance-body-anxiety", "如果聊到「容貌、身材焦虑与被看见的压力」，你更想听哪一面？", [
      "被比较 / 被打分",
      "镜头和滤镜的压力",
      "身材管理的内耗",
      "“不自信”这个词太轻了",
      "怎么少一点自我审判"
    ]),
    reflect(
      "appearance-body-anxiety",
      "关于“被看见”和“被比较”，有没有一种感觉，你一直默默放在心里？",
      "可以跳过。写感受就好，不用写细节。"
    )
  ],
  "networking-referrals": [
    angle("networking-referrals", "如果聊到「人脉、内推与弱连接经营」，你更想听哪一面？", [
      "求助为什么让人别扭",
      "怎么体面地开口",
      "资源不平等的现实",
      "弱连接怎么经营",
      "被拒绝之后怎么办"
    ]),
    reflect(
      "networking-referrals",
      "有没有一次你想求助、最后还是没开口？当时在顾虑什么？",
      "愿意的话说说看。"
    )
  ],
  "sex-education-consent-safety": [
    angle("sex-education-consent-safety", "如果聊到「性教育、同意与安全」，你更想听哪一面？", [
      "“同意”到底意味着什么",
      "安全知识的缺口",
      "边界怎么表达",
      "羞耻感从哪来",
      "怎么严肃但不尴尬地聊"
    ]),
    reflect(
      "sex-education-consent-safety",
      "有没有一个你一直想问、却不知道该问谁的问题？",
      "可以跳过。我们会严肃、尊重地对待。"
    )
  ],
  "public-good-small-actions": [
    angle("public-good-small-actions", "如果聊到「环保、公益与小型行动主义」，你更想听哪一面？", [
      "小行动到底有没有用",
      "怎么持续下去不疲惫",
      "身边能做的具体事",
      "“改变世界”的压力",
      "普通学生的参与方式"
    ]),
    reflect(
      "public-good-small-actions",
      "有没有一件很小的事，你一直在默默坚持？",
      "愿意的话说说看。"
    )
  ],
  "startup-one-person-company": [
    angle("startup-one-person-company", "如果聊到「创业、一人公司与试错成本」，你更想听哪一面？", [
      "创业冲动该不该跟",
      "试错成本怎么算",
      "现金流的现实",
      "一个人能做多大",
      "什么时候该停下来"
    ]),
    reflect(
      "startup-one-person-company",
      "如果只能先验证一件事再决定要不要做，你最想先验证什么？",
      "愿意的话说说看。"
    )
  ],
  "graduation-travel-ritual": [
    angle("graduation-travel-ritual", "如果聊到「旅行、毕业仪式与告别 ritual」，你更想听哪一面？", [
      "“最后一次”为什么那么上头",
      "毕业旅行的意义",
      "怎么好好告别",
      "拍照 / 纪念的执念",
      "给一段生活体面收尾"
    ]),
    reflect(
      "graduation-travel-ritual",
      "你最想用什么方式，给大学这段时间画一个句号？",
      "愿意的话说说看。"
    )
  ],
  "lifestyle-design": [
    angle("lifestyle-design", "如果聊到「生活方式设计」，你更想听哪一面？", [
      "想过怎样的一天",
      "城市 / 工作 / 关系怎么排序",
      "身体状态的优先级",
      "把宏大未来落回日常",
      "不一定要有标准答案"
    ]),
    reflect(
      "lifestyle-design",
      "抛开“该做什么”，你理想中普通的一天，大概是从几点、做什么开始的？",
      "愿意的话说说看，具体一点会很动人。"
    )
  ]
};

/**
 * 结尾的常规、有话题度的问题。对所有人一样，轻松、可分享，但仍留一点余地。
 */
export const GENERAL_FOLLOW_UPS: FollowUpQuestion[] = [
  {
    id: "general.why",
    kind: "single",
    title: "你点开这类节目，通常更想要哪一种？",
    hint: "凭感觉选就好，没有标准答案。",
    options: [
      "被陪伴：知道不是只有我这样",
      "被讲明白：理清楚到底怎么回事",
      "被戳一下：听点不一样的真话",
      "纯粹放松：下饭、有人说话就行",
      "看具体的人，是怎么走过来的"
    ]
  },
  {
    id: "general.segment",
    kind: "multi",
    title: "你希望《大学生不必看》最后固定有一个什么环节？",
    hint: "可多选（最多 2 个），也可以都不选。",
    max: 2,
    options: [
      "匿名树洞来信",
      "一句话毒舌总结",
      "嘉宾的“如果能重来”",
      "听众的真实故事",
      "本期没说完的题外话",
      "用一首歌收尾"
    ]
  },
  {
    id: "general.loop",
    kind: "text",
    title: "最近一直在循环、或反复想起的一句话 / 一首歌 / 一句台词？",
    hint: "可以跳过。",
    placeholder: "随便写，哪怕只是半句。",
    maxLength: 300
  },
  {
    id: "general.ask",
    kind: "text",
    title: "如果能匿名问正在听这档节目的同龄人一个问题，你想问什么？",
    hint: "可以跳过。我们可能会把它读出来。",
    placeholder: "你最想知道别人会怎么回答的那个问题。",
    maxLength: 300
  }
];

const FOLLOW_UP_BY_ID = new Map<string, FollowUpQuestion>();
for (const questions of Object.values(TOPIC_FOLLOW_UPS)) {
  for (const question of questions) {
    FOLLOW_UP_BY_ID.set(question.id, question);
  }
}
for (const question of GENERAL_FOLLOW_UPS) {
  FOLLOW_UP_BY_ID.set(question.id, question);
}

export function getFollowUpsForTopic(topicId: string | null | undefined): FollowUpQuestion[] {
  if (!topicId) {
    return [];
  }
  return TOPIC_FOLLOW_UPS[topicId as TopicId] ?? [];
}

export function getFollowUpQuestionById(id: string): FollowUpQuestion | undefined {
  return FOLLOW_UP_BY_ID.get(id);
}

/** 所有合法的 followUpAnswers 键，用于服务端清洗未知键。 */
export const FOLLOW_UP_QUESTION_IDS = Array.from(FOLLOW_UP_BY_ID.keys());
