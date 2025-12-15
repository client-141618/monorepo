import { request } from '@/utils/request'

const PREFIX = '/api'

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
