import { request } from '@/utils/request'

const PREFIX = '/api'

export function getUserList() {
  return request({
    url: `${PREFIX}/user/list`,
    method: "GET",
  })
}
