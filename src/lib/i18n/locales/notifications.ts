export const notificationsTranslations = {
  "notifications.tab.all": {
    ja: "すべて",
    en: "All",
    "zh-TW": "全部",
    ko: "전체",
  },
  "notifications.tab.follow": {
    ja: "フォロー",
    en: "Follows",
    "zh-TW": "追蹤",
    ko: "팔로우",
  },
  "notifications.tab.overtaken": {
    ja: "更新",
    en: "Updates",
    "zh-TW": "更新",
    ko: "업데이트",
  },
  "notifications.empty": {
    ja: "通知はありません",
    en: "No notifications.",
    "zh-TW": "沒有通知",
    ko: "알림이 없습니다",
  },
  // Overtaken message: "{name}{pre}{song}{post}"
  // ja: "田中 さんが Song[A] であなたを上回りました"
  // en: "John beat your score on Song[A]"
  "notifications.overtaken.pre": {
    ja: " さんが ",
    en: " beat your score on ",
    "zh-TW": " 在 ",
    ko: "님이 ",
  },
  "notifications.overtaken.post": {
    ja: " であなたを上回りました",
    en: "",
    "zh-TW": " 超越了你的分數",
    ko: "에서 당신을 앞질렀습니다",
  },
  "notifications.myScore": {
    ja: "あなた:",
    en: "You:",
    "zh-TW": "你：",
    ko: "당신：",
  },
  "notifications.rivalScore": {
    ja: "ライバル:",
    en: "Rival:",
    "zh-TW": "對手：",
    ko: "라이벌：",
  },
  // Follow message: "{name}{msg}"
  "notifications.follow.msg": {
    ja: " さんにフォローされました",
    en: " followed you.",
    "zh-TW": " 追蹤了你",
    ko: "님이 팔로우했습니다",
  },
} as const;
