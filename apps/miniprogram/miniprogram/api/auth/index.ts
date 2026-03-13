import { request } from "../request"

export interface LoginTokenData {
  token: string
  refreshToken: string
  expiresIn?: number
}

interface WxLoginParams {
  code: string
}

interface RefreshTokenParams {
  refreshToken: string
}

export function wxLoginApi(data: WxLoginParams) {
  return request<LoginTokenData>({
    url: "/api/auth/wx-login",
    method: "POST",
    data,
  })
}

export function refreshTokenApi(data: RefreshTokenParams) {
  return request<LoginTokenData>({
    url: "/api/auth/refresh",
    method: "POST",
    data,
  })
}

export function runWxLogin() {
  return new Promise<string>((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (!res.code) {
          reject(new Error("wx.login 未返回 code"))
          return
        }
        resolve(res.code)
      },
      fail: (error) => reject(error),
    })
  })
}

export async function ensureLogin() {
  const token = wx.getStorageSync("accessToken") as string
  if (token) {
    return token
  }

  const code = await runWxLogin()
  const loginRes = await wxLoginApi({ code })
  const { token: accessToken, refreshToken } = loginRes.data
  wx.setStorageSync("accessToken", accessToken)
  wx.setStorageSync("refreshToken", refreshToken)
  return accessToken
}
