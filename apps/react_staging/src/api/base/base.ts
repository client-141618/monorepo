import request from '@/utils/request'

const PREFIX = '/api'

export function getCheckCode() {
    return request({
      url: `${PREFIX}/account/checkCode`,
      method: "GET",
    })
}
  
export function uploadImage(data: FormData) {
  return request({
    url: `${PREFIX}/file/upload`,
    method: "POST",
    data,
  })
}