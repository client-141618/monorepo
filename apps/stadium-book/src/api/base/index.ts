import type { ForgotPasswordParams, RegisterParams } from "./types"
import { request } from "@/utils/request"

const PREFIX = "/api"

export function login(data: { phone: string; password: string }) {
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

/**
 * 发送短信验证码
 */
export function sendSmsCode(phone: string, scene: "REGISTER" | "FORGOT_PASSWORD") {
  return request({
    url: `${PREFIX}/user/send_sms_code`,
    method: "POST",
    data: { phone, scene },
  })
}

export function register(data: RegisterParams) {
  return request({
    url: `${PREFIX}/user/register`,
    method: "POST",
    data,
  })
}

export function forgotPassword(data: ForgotPasswordParams) {
  return request({
    url: `${PREFIX}/user/forgot_password`,
    method: "POST",
    data,
  })
}
