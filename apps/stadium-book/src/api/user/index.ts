import { request } from '@cyz/utils'

const PREFIX = '/api'

export function getUserList() {
  return request({
    url: `${PREFIX}/user/list`,
    method: "GET",
  })
}
