import type { UpdatePasswordParams, UserInfo } from "./types"
import { request } from "@/utils/request"

const PREFIX = "/api"

/**
 * 获取用户列表
 */
export function getUserList() {
  return request({
    url: `${PREFIX}/user/list`,
    method: "GET",
  })
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser() {
  return request({
    url: `${PREFIX}/user/curr`,
    method: "GET",
  })
}

/**
 * 图片上传
 */
export function uploadImage(data: FormData) {
  return request({
    url: `${PREFIX}/file/upload`,
    method: "POST",
    data,
  })
}

/**
 * 更新当前用户信息
 */
export function updateUserInfo(data: UserInfo) {
  return request({
    url: `${PREFIX}/user/update`,
    method: "POST",
    data,
  })
}

/**
 * 更改密码
 */
export function updatePassword(data: UpdatePasswordParams) {
  return request({
    url: `${PREFIX}/user/edit_password`,
    method: "POST",
    data,
  })
}
