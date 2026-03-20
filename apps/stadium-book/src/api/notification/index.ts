import type {
  NotificationDetail,
  NotificationOverview,
  NotificationQueryPayload,
  NotificationUpsertPayload,
} from "./type"
import type { PageRequest, PageResult } from "@/api/base/types"
import { request } from "@/utils/request"

const PREFIX = "/api/notification"

export function getNotificationListApi() {
  return request<NotificationOverview[]>({
    url: `${PREFIX}/list`,
    method: "GET",
  })
}

export function getNotificationPageApi(data: PageRequest<NotificationQueryPayload>) {
  return request<PageResult<NotificationOverview>>({
    url: `${PREFIX}/page`,
    method: "POST",
    data,
  })
}

export function queryNotificationListApi(data: NotificationQueryPayload) {
  return request<NotificationOverview[]>({
    url: `${PREFIX}/query`,
    method: "POST",
    data,
  })
}

export function getNotificationByIdApi(id: number) {
  return request<NotificationDetail>({
    url: `${PREFIX}/${id}`,
    method: "GET",
  })
}

export function createNotificationApi(data: NotificationUpsertPayload) {
  return request({
    url: `${PREFIX}/create`,
    method: "POST",
    data,
  })
}

export function updateNotificationApi(data: NotificationUpsertPayload) {
  return request({
    url: `${PREFIX}/update`,
    method: "PUT",
    data,
  })
}

export function publishNotificationApi(id: number) {
  return request({
    url: `${PREFIX}/publish/${id}`,
    method: "PUT",
  })
}

export function deleteNotificationApi(id: number) {
  return request({
    url: `${PREFIX}/${id}`,
    method: "DELETE",
  })
}
