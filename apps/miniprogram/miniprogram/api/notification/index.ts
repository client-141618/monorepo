import { request } from "../request"

export type MiniNotificationType = 1 | 2 | 3 | 4

export interface MiniNotificationItem {
  id: number
  title: string
  summary: string
  type: MiniNotificationType
  targetUserId: number | null
  readCount: number
  publishStatus: 0 | 1
  createTime?: string
  publishTime?: string
}

export interface MiniNotificationDetail extends MiniNotificationItem {
  content: string
}

export function getNotificationListApi() {
  return request<MiniNotificationItem[]>({
    url: "/api/notification/list",
    method: "GET",
  })
}

export function getNotificationByIdApi(id: number) {
  return request<MiniNotificationDetail>({
    url: `/api/notification/${id}`,
    method: "GET",
  })
}
