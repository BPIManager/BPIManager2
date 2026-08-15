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
  // Follow approved message: "{name}{msg}"
  "notifications.followApproved.msg": {
    ja: " さんがフォローリクエストを承認しました",
    en: " approved your follow request.",
    "zh-TW": " 已核准你的追蹤請求",
    ko: "님이 팔로우 요청을 승인했습니다",
  },
  "notifications.tab.requests": {
    ja: "承認待ち",
    en: "Requests",
    "zh-TW": "待審核",
    ko: "승인 대기",
  },
  "notifications.requests.empty": {
    ja: "保留中のリクエストはありません",
    en: "No pending requests.",
    "zh-TW": "沒有待處理的請求",
    ko: "대기 중인 요청이 없습니다",
  },
  "notifications.requests.approve": {
    ja: "承認",
    en: "Approve",
    "zh-TW": "核准",
    ko: "승인",
  },
  "notifications.requests.reject": {
    ja: "却下",
    en: "Reject",
    "zh-TW": "拒絕",
    ko: "거절",
  },
  // Follow request message: "{name}{msg}"
  "notifications.requests.msg": {
    ja: " さんがフォローをリクエストしています",
    en: " requested to follow you.",
    "zh-TW": " 請求追蹤你",
    ko: "님이 팔로우를 요청했습니다",
  },
  // Legacy follower message: "{name}{msg}"
  "notifications.requests.legacyMsg": {
    ja: " さんは以前からのフォロワーです(未承認)",
    en: " has been following you (not yet approved).",
    "zh-TW": " 一直以來都在追蹤你(尚未核准)",
    ko: "님은 이전부터 팔로우하고 있습니다 (미승인)",
  },
  "notifications.requests.legacyBadge": {
    ja: "既存フォロワー",
    en: "Existing follower",
    "zh-TW": "既有追蹤者",
    ko: "기존 팔로워",
  },
} as const;
