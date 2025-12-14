import { request } from '@/utils/request'

const PREFIX = '/api'

export function login(data: { phone: string, password: string }) {
  return request({
    url: `${PREFIX}/user/login`,
    method: "POST",
    data,
  })
}

export function refreshToken(data: { refreshToken: string }) {
  return request({
    url: `${PREFIX}/user/refresh`,
    method: "POST",
    data,
  })
}
