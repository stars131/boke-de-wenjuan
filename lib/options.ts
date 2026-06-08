export const IDENTITY_STATUS_OPTIONS = [
  "大一",
  "大二",
  "大三",
  "大四 / 即将毕业",
  "研一",
  "研二",
  "研三 / 即将毕业",
  "已毕业 1 年内",
  "已毕业 1-3 年",
  "已毕业 3 年以上",
  "其他"
];

export const CURRENT_STATE_OPTIONS = [
  "正在找工作",
  "正在实习",
  "准备考研 / 已考研",
  "准备考公 / 考编",
  "准备出国 / 留学",
  "正在写论文 / 做课题",
  "正在处理毕业相关事务",
  "正在租房 / 搬家 / 换城市",
  "正在经历感情问题",
  "正在经历家庭压力",
  "正在做副业 / 创业 / 自媒体",
  "只是有点迷茫",
  "暂时还挺稳定",
  "其他"
];

export const CONTENT_PLATFORM_OPTIONS = [
  "B站",
  "小红书",
  "抖音",
  "微信公众号",
  "视频号",
  "微博",
  "小宇宙 / 播客平台",
  "即刻",
  "豆瓣",
  "知乎",
  "YouTube",
  "其他"
];

export const PREFERRED_FORMAT_OPTIONS = [
  "45-65 分钟完整视频播客",
  "10 分钟左右精华切片",
  "1 分钟以内短视频",
  "图文总结",
  "真实故事投稿",
  "主持人单人表达",
  "多人圆桌讨论",
  "专业嘉宾答疑",
  "直播连麦",
  "匿名来信回应"
];

export const STORY_USAGE_OPTIONS = [
  "可以匿名引用大意",
  "可以匿名改编为来信",
  "只供节目组选题参考，不要公开",
  "希望先联系我确认",
  "不确定"
];

export const PARTICIPATION_OPTIONS = [
  "只填写问卷",
  "匿名提供故事",
  "接受文字访谈",
  "接受语音访谈",
  "接受视频连线",
  "线下参与录制",
  "推荐身边适合的人",
  "暂时不确定"
];

export const STORY_STATUS_OPTIONS = [
  "new",
  "reviewed",
  "potential-guest",
  "selected-for-episode",
  "do-not-use"
] as const;

export const RISK_LEVEL_OPTIONS = ["normal", "sensitive", "high"] as const;

export const SCORE_LABELS = {
  1: "很低",
  2: "有一点",
  3: "中等",
  4: "很强",
  5: "非常强"
} as const;
