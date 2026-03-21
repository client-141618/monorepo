import { request } from "../request"

interface PageRequest<TQuery> {
  pageNum: number
  pageSize: number
  queryDTO?: TQuery
}

interface PageResult<TRecord> {
  records?: TRecord[]
  total?: number
  size?: number
  current?: number
}

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

export interface NotificationPageQuery {
  adminId?: number
  userId?: number
  type?: MiniNotificationType
}

export function getNotificationListApi() {
  return request<MiniNotificationItem[]>({
    url: "/api/notification/list",
    method: "GET",
  })
}

export function getNotificationPageApi(data: PageRequest<NotificationPageQuery>) {
  return request<PageResult<MiniNotificationItem>>({
    url: "/api/notification/page",
    method: "POST",
    data,
  })
}

export function getNotificationByIdApi(id: number) {
  return request<MiniNotificationDetail>({
    url: `/api/notification/${id}`,
    method: "GET",
  })
}
