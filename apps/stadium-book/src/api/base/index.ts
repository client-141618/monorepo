import { request } from '@cyz/utils'

const PREFIX = '/api'

export function login(data: { phone: string, password: string }) {
  return request({
    url: `${PREFIX}/user/login`,
    method: "POST",
    data,
  })
}
