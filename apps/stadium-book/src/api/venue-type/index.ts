import type {
  AddVenueTypePayload,
  UpdateVenueTypePayload,
  VenueType,
} from "./type"
import { request } from "@/utils/request"

const PREFIX = "/api/venue-type"

/**
 * 获取场地类型列表
 */
export function getVenueTypeListApi() {
  return request<VenueType[]>({
    url: `${PREFIX}/list`,
    method: "GET",
  })
}

/**
 * 新增场地类型
 */
export function addVenueTypeApi(data: AddVenueTypePayload) {
  return request({
    url: `${PREFIX}/add`,
    method: "POST",
    data,
  })
}

/**
 * 更新场地类型
 */
export function updateVenueTypeApi(data: UpdateVenueTypePayload) {
  return request({
    url: `${PREFIX}/update`,
    method: "PUT",
    data,
  })
}

/**
 * 删除场地类型
 */
export function deleteVenueTypeApi(id: VenueType["id"]) {
  return request({
    url: `${PREFIX}/delete/${id}`,
    method: "DELETE",
  })
}
