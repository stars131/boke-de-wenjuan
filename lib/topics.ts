export const TOPIC_GROUPS = [
  "心理与身份",
  "关系与家庭",
  "工作与钱",
  "社群与网络",
  "生活方式与未来"
] as const;

export type TopicGroup = (typeof TOPIC_GROUPS)[number];

export type TopicId =
  | "identity-unloading"
  | "job-search-self-worth"
  | "advisor-thesis-anxiety"
  | "delayed-graduation-gap"
  | "sleep-phone-time-collapse"
  | "social-anxiety"
  | "relationship-boundaries"
  | "breakup-recovery"
  | "long-distance-divergence"
  | "family-expectations"
  | "internship-anxiety"
  | "internship-rights"
  | "part-time-side-income"
  | "living-expense-consumption"
  | "renting-first-city"
  | "clubs-student-work"
  | "hobbies-non-utilitarian-growth"
  | "social-media-persona-fatigue"
  | "appearance-body-anxiety"
  | "networking-referrals"
  | "sex-education-consent-safety"
  | "public-good-small-actions"
  | "startup-one-person-company"
  | "graduation-travel-ritual"
  | "lifestyle-design";

export type Topic = {
  id: TopicId;
  group: TopicGroup;
  title: string;
  description: string;
  recommendedEpisode: string;
  successMessage: string;
  riskLevel: "low" | "medium" | "high";
};

export const TOPICS: Topic[] = [
  {
    id: "identity-unloading",
    group: "心理与身份",
    title: "毕业身份卸载期",
    description: "从“学生”变成“要自己负责的大人”，最难受的到底是什么？",
    recommendedEpisode: "离校、失控、未来、身份变化，以及如何不急着给自己下结论。",
    successMessage: "你可能更关心从学生变成大人的过渡感，以及那种突然没人给答案的空白。",
    riskLevel: "medium"
  },
  {
    id: "job-search-self-worth",
    group: "心理与身份",
    title: "求职失序与自我价值",
    description: "没有 offer 的时候，为什么那么容易怀疑自己？",
    recommendedEpisode: "求职节奏、比较、拒信、等待，以及怎样把自己从结果里暂时拆出来。",
    successMessage: "你在意的不只是工作结果，也包括找工作时自我价值被反复摇晃的过程。",
    riskLevel: "medium"
  },
  {
    id: "advisor-thesis-anxiety",
    group: "心理与身份",
    title: "导学关系与论文焦虑",
    description: "研究生真正难熬的，可能不是忙，而是边界不清。",
    recommendedEpisode: "导师边界、论文推进、延期恐惧、学术劳动与求助方式。",
    successMessage: "你可能想听一些把导学关系和论文压力讲清楚、但不简单归因的讨论。",
    riskLevel: "high"
  },
  {
    id: "delayed-graduation-gap",
    group: "心理与身份",
    title: "延毕、gap 与失败叙事",
    description: "晚一点毕业、空窗一年，是不是就等于掉队？",
    recommendedEpisode: "延迟、空窗、履历解释、同辈比较，以及失败叙事如何被重新理解。",
    successMessage: "你可能在寻找一种不把人生节奏简单排成名次的讲法。",
    riskLevel: "medium"
  },
  {
    id: "sleep-phone-time-collapse",
    group: "心理与身份",
    title: "睡眠拖延、手机依赖与时间感崩坏",
    description: "熬夜到底是在玩手机，还是在偷回一点属于自己的时间？",
    recommendedEpisode: "报复性熬夜、手机、焦虑、时间感，以及怎样温和地夺回一点日常。",
    successMessage: "你可能对那些看起来很小、但每天消耗人的生活习惯特别有共鸣。",
    riskLevel: "medium"
  },
  {
    id: "social-anxiety",
    group: "关系与家庭",
    title: "社交焦虑与不会开口",
    description: "不是没有朋友，而是不知道如何开始关系。",
    recommendedEpisode: "关系开场、拒绝、尴尬、孤独，以及大学里的低压力连接。",
    successMessage: "你可能想听一场不催人外向、也不把孤独浪漫化的对话。",
    riskLevel: "low"
  },
  {
    id: "relationship-boundaries",
    group: "关系与家庭",
    title: "恋爱中的边界与危险信号",
    description: "很多控制，最开始都被包装成了“在乎”。",
    recommendedEpisode: "控制、边界、同意、冷暴力、求助，以及如何识别不舒服的信号。",
    successMessage: "你可能更关心亲密关系里那些不容易被一句“爱不爱”解释的问题。",
    riskLevel: "high"
  },
  {
    id: "breakup-recovery",
    group: "关系与家庭",
    title: "分手、和解与情绪恢复",
    description: "一段关系结束后，怎样慢慢恢复日常？",
    recommendedEpisode: "失恋后的生活重建、反复、告别、复盘，以及不急着恢复正常。",
    successMessage: "你可能想听关系结束之后，人怎样一点点回到自己的生活里。",
    riskLevel: "high"
  },
  {
    id: "long-distance-divergence",
    group: "关系与家庭",
    title: "异地关系与人生分岔",
    description: "毕业后，感情最怕的是距离，还是不同步？",
    recommendedEpisode: "城市选择、毕业分岔、承诺、现实成本，以及两个人怎样谈未来。",
    successMessage: "你可能在意的是两个人的人生节奏能不能继续同频。",
    riskLevel: "medium"
  },
  {
    id: "family-expectations",
    group: "关系与家庭",
    title: "家庭期待：考编、留城与婚育",
    description: "当家里说“稳定一点”，他们到底在说什么？",
    recommendedEpisode: "代际安全感、稳定叙事、婚育催促、留城选择，以及怎样谈判边界。",
    successMessage: "你可能想把家庭期待背后的爱、控制、担心和现实压力拆开讲。",
    riskLevel: "high"
  },
  {
    id: "internship-anxiety",
    group: "工作与钱",
    title: "暑期实习前移与履历焦虑",
    description: "没拿到实习，是不是已经晚了？",
    recommendedEpisode: "实习前移、履历焦虑、错过感、信息差，以及普通学生如何补课。",
    successMessage: "你可能更关心从大二大三就开始被催着竞争的那种失序感。",
    riskLevel: "medium"
  },
  {
    id: "internship-rights",
    group: "工作与钱",
    title: "实习权益、合同与试用期",
    description: "第一份工作前，哪些坑必须提前知道？",
    recommendedEpisode: "实习协议、试用期、加班、薪资、离职，以及基础劳动权益。",
    successMessage: "你可能希望节目能讲一些现实有用、但不把人吓退的职场入口知识。",
    riskLevel: "medium"
  },
  {
    id: "part-time-side-income",
    group: "工作与钱",
    title: "兼职、副业与第一桶金",
    description: "大学里靠自己赚钱，会改变什么？",
    recommendedEpisode: "兼职、副业、自媒体、第一笔收入、踩坑，以及自由和代价。",
    successMessage: "你可能对“自己赚钱”带来的独立感和风险都很感兴趣。",
    riskLevel: "low"
  },
  {
    id: "living-expense-consumption",
    group: "工作与钱",
    title: "生活费、消费、储蓄与网贷边界",
    description: "钱不够、想自由、又不想一直依赖家里。",
    recommendedEpisode: "生活费、消费欲、储蓄、分期、网贷边界，以及钱背后的羞耻感。",
    successMessage: "你可能希望钱的话题能讲得具体一点，也更少一点道德评判。",
    riskLevel: "high"
  },
  {
    id: "renting-first-city",
    group: "工作与钱",
    title: "租房、搬家与落脚第一城",
    description: "毕业后第一件现实大事，可能是“住哪里”。",
    recommendedEpisode: "找房、搬家、通勤、室友、押金，以及一座城市怎样慢慢变成落脚点。",
    successMessage: "你可能对毕业后真正落地的现实细节很敏感：住哪、怎么住、和谁住。",
    riskLevel: "low"
  },
  {
    id: "clubs-student-work",
    group: "社群与网络",
    title: "社团、学生工作与校园文化",
    description: "学生工作到底带来了成长，还是消耗？",
    recommendedEpisode: "社团、学生组织、责任、权力感、消耗，以及退出是否也是成长。",
    successMessage: "你可能想重新看待那些被包装成锻炼、但也可能很消耗的校园经历。",
    riskLevel: "low"
  },
  {
    id: "hobbies-non-utilitarian-growth",
    group: "社群与网络",
    title: "爱好、手作、运动与不功利成长",
    description: "一个“不赚钱但开心”的爱好，还有没有必要？",
    recommendedEpisode: "爱好、运动、手作、低绩效生活，以及不把每件事变成作品集。",
    successMessage: "你可能在寻找一种允许“不产出也有意义”的生活方式。",
    riskLevel: "low"
  },
  {
    id: "social-media-persona-fatigue",
    group: "社群与网络",
    title: "社交媒体分身与人设疲劳",
    description: "朋友圈、小红书、微博里的你，哪个才是真的你？",
    recommendedEpisode: "账号分身、朋友圈管理、人设疲劳、被观看，以及表达的安全距离。",
    successMessage: "你可能对线上自我和真实自我之间的拉扯很有体感。",
    riskLevel: "medium"
  },
  {
    id: "appearance-body-anxiety",
    group: "社群与网络",
    title: "容貌、身材焦虑与被看见的压力",
    description: "被看见、被比较、被评价，如何影响我们？",
    recommendedEpisode: "容貌比较、身材管理、镜头压力、凝视，以及如何少一点自我审判。",
    successMessage: "你可能想听一个不把焦虑归结成“不自信”的身体经验讨论。",
    riskLevel: "high"
  },
  {
    id: "networking-referrals",
    group: "社群与网络",
    title: "人脉、内推与弱连接经营",
    description: "向别人求助，为什么总让人觉得羞耻？",
    recommendedEpisode: "内推、弱连接、请求帮助、资源不平等，以及怎样体面地开口。",
    successMessage: "你可能关心关系网络里那些不明说、但确实影响机会的规则。",
    riskLevel: "medium"
  },
  {
    id: "sex-education-consent-safety",
    group: "生活方式与未来",
    title: "性教育、同意与安全",
    description: "大学里最该认真讨论、却总被含糊带过的话题。",
    recommendedEpisode: "同意、安全、边界、知识缺口，以及怎样严肃但不羞耻地讨论。",
    successMessage: "你可能希望这些重要的话题被清楚、尊重、负责任地讲出来。",
    riskLevel: "high"
  },
  {
    id: "public-good-small-actions",
    group: "生活方式与未来",
    title: "环保、公益与小型行动主义",
    description: "不是每个人都要改变世界，但可以从身边开始。",
    recommendedEpisode: "公益、环保、小行动、无力感，以及普通学生能持续做什么。",
    successMessage: "你可能相信一些很小的行动也值得被认真看见。",
    riskLevel: "low"
  },
  {
    id: "startup-one-person-company",
    group: "生活方式与未来",
    title: "创业、一人公司与试错成本",
    description: "大学生创业最该先想清楚什么？",
    recommendedEpisode: "创业冲动、一人公司、试错成本、现金流，以及什么时候该停下来。",
    successMessage: "你可能对更自由的工作方式感兴趣，也想知道它背后真实的成本。",
    riskLevel: "medium"
  },
  {
    id: "graduation-travel-ritual",
    group: "生活方式与未来",
    title: "旅行、毕业仪式与告别 ritual",
    description: "为什么“最后一次”总让人那么上头？",
    recommendedEpisode: "毕业旅行、仪式感、告别、拍照、纪念，以及如何给一段生活收尾。",
    successMessage: "你可能对告别这件事很敏感，也在意如何认真结束一段时间。",
    riskLevel: "low"
  },
  {
    id: "lifestyle-design",
    group: "生活方式与未来",
    title: "生活方式设计",
    description: "比起选哪份工作，你可能更想知道自己想过怎样的一天。",
    recommendedEpisode: "日程、城市、工作、关系、身体状态，以及如何想象具体的一天。",
    successMessage: "你可能想把未来从宏大的职业选择，落回到一天怎么过。",
    riskLevel: "low"
  }
];

export const TOPIC_IDS = TOPICS.map((topic) => topic.id) as TopicId[];

export const TOPIC_BY_ID = Object.fromEntries(
  TOPICS.map((topic) => [topic.id, topic])
) as Record<TopicId, Topic>;

export function getTopicById(id: string | null | undefined) {
  return TOPICS.find((topic) => topic.id === id);
}
