import type { UpdateWxUserStatusPayload, WxUser, WxUserListQuery, WxUserPageQuery } from "./type"
import type { PageRequest, PageResult } from "@/api/base/types"
import { request } from "@/utils/request"

const PREFIX = "/api/wx-user"

/**
 * 获取微信登录用户列表
 */
export function getWxUserListApi(params?: WxUserListQuery) {
  return request<WxUser[]>({
    url: `${PREFIX}/list`,
    method: "GET",
    params,
  })
}

export function getWxUserPageApi(data: PageRequest<WxUserPageQuery>) {
  return request<PageResult<WxUser>>({
    url: `${PREFIX}/page`,
    method: "POST",
    data,
  })
}

/**
 * 根据 id 获取微信登录用户
 */
export function getWxUserByIdApi(id: WxUser["id"]) {
  return request<WxUser>({
    url: `${PREFIX}/${id}`,
    method: "GET",
  })
}

/**
 * 更新微信登录用户状态
 */
export function updateWxUserStatusApi(data: UpdateWxUserStatusPayload) {
  return request({
    url: `${PREFIX}/status`,
    method: "PUT",
    data,
  })
}

/**
 * 删除微信登录用户
 */
export function deleteWxUserApi(id: WxUser["id"]) {
  return request({
    url: `${PREFIX}/delete/${id}`,
    method: "DELETE",
  })
}
