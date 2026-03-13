import { request } from "@/utils/request"
import type {
  NotificationDetail,
  NotificationOverview,
  NotificationUpsertPayload,
} from "./type"

const PREFIX = "/api/notification"

export function getNotificationListApi() {
  return request<NotificationOverview[]>({
    url: `${PREFIX}/list`,
    method: "GET",
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
