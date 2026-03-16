import { mergeCacheToken } from "../../utils/profile"
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
    skipAuth: true,
  })
}

export function refreshTokenApi(data: RefreshTokenParams) {
  return request<LoginTokenData>({
    url: "/api/auth/refresh",
    method: "POST",
    data,
    skipAuth: true,
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
  const loginData = loginRes.data as LoginTokenData & Record<string, unknown>
  const { token: accessToken, refreshToken } = loginData
  wx.setStorageSync("accessToken", accessToken)
  wx.setStorageSync("refreshToken", refreshToken)
  mergeCacheToken(extractCacheTokenPatch(loginData))
  return accessToken
}

function extractCacheTokenPatch(source: Record<string, unknown>) {
  const patch: Record<string, unknown> = {}
  const keys = [
    "id",
    "userId",
    "wxUserId",
    "key",
    "username",
    "avatar",
    "status",
  ]

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]
    const value = source[key]
    if (value !== undefined && value !== null) {
      patch[key] = value
    }
  }

  return patch
}
