export type NotificationType = 1 | 2 | 3 | 4

export const NOTIFICATION_TYPE_MAP: Record<NotificationType, string> = {
  1: "系统通知",
  2: "场地通知",
  3: "账号通知",
  4: "其它",
}

export const NOTIFICATION_TYPE_OPTIONS = [
  { label: "系统通知", value: 1 },
  { label: "场地通知", value: 2 },
  { label: "账号通知", value: 3 },
  { label: "其它", value: 4 },
] as const

export const NOTIFICATION_PUBLISH_STATUS_OPTIONS = [
  { label: "草稿", value: 0 },
  { label: "已发布", value: 1 },
] as const

export const getNotificationTypeLabel = (type: number) => {
  if (type in NOTIFICATION_TYPE_MAP) {
    return NOTIFICATION_TYPE_MAP[type as NotificationType]
  }

  return "未知类型"
}
