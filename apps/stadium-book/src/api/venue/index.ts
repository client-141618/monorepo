import type { Venue } from "./type"
import { request } from "@/utils/request"

const PREFIX = "/api/venue"

/**
 * 获取所有场馆信息
 */
export function getVenueListApi() {
  return request<Venue[]>({
    url: `${PREFIX}/list`,
    method: "GET",
  })
}

/**
 * 根据场地类型 ID 获取场地列表
 */
export function getVenueListByTypeApi(typeId: Venue["typeId"]) {
  return request<Venue[]>({
    url: `${PREFIX}/type/${typeId}`,
    method: "GET",
  })
}

/**
 * 根据 id 获取场馆信息
 */
export function getVenueByIdApi(id: Venue["id"]) {
  return request<Venue>({
    url: `${PREFIX}/${id}`,
    method: "GET",
  })
}

/**
 * 新增场馆
 */
export function addVenueApi(data: Venue) {
  return request({
    url: `${PREFIX}/add`,
    method: "POST",
    data,
  })
}

/**
 * 更新场馆
 */
export function updateVenueApi(data: Venue) {
  return request<Venue>({
    url: `${PREFIX}/update`,
    method: "PUT",
    data,
  })
}

/**
 * 删除场馆
 */
export function deleteVenueApi(id: Venue["id"]) {
  return request({
    url: `${PREFIX}/delete/${id}`,
    method: "DELETE",
  })
}

/**
 * 批量启用
 */
export function batchEnableVenueApi(ids: Venue["id"][]) {
  return request({
    url: `${PREFIX}/batch/enable`,
    method: "PUT",
    data: ids,
  })
}

/**
 * 批量停用
 */
export function batchDisableVenueApi(ids: Venue["id"][]) {
  return request({
    url: `${PREFIX}/batch/disable`,
    method: "PUT",
    data: ids,
  })
}

/**
 * 批量删除场馆
 */
export function batchDeleteVenueApi(ids: Venue["id"][]) {
  return request({
    url: `${PREFIX}/batch/delete`,
    method: "DELETE",
    data: ids,
  })
}

/**
 * 更新场馆开放状态
 */
export function updateVenueStatusApi(id: Venue["id"], status: Venue["status"]) {
  return request({
    url: `${PREFIX}/status`,
    method: "PUT",
    params: {
      id,
      status,
    },
  })
}
