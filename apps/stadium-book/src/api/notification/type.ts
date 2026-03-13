import type { NotificationType } from "@/constants/notification"

export interface NotificationOverview {
  id: number
  title: string
  summary: string
  type: NotificationType
  targetUserIds: number[]
  readCount: number
  creatorUserId: number
  creatorName: string
  publishStatus: 0 | 1
  createTime?: string
  updateTime?: string
  publishTime?: string | null
}

export interface NotificationDetail extends NotificationOverview {
  content: string
}

export interface NotificationUpsertPayload {
  id?: number
  title: string
  summary: string
  content: string
  type: NotificationType
  targetUserIds: number[]
  publishStatus: 0 | 1
}

export interface NotificationQueryPayload {
  adminId: number | null
  userId: number | null
  type: NotificationType | null
}
