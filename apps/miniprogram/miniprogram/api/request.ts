import { getBaseUrl } from "../config/env"
import {
  BLOCKED_USER_REDIRECT_HOME,
  WX_USER_BLOCKED_CODES,
  WX_USER_BLOCKED_MESSAGE_MAP,
} from "../constants/auth"
import { mergeCacheToken } from "../utils/profile"

interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
}

interface RequestOptions extends WechatMiniprogram.RequestOption {
  skipAuth?: boolean
  _retry?: boolean
}

let refreshingPromise: Promise<string> | null = null
let loginPromise: Promise<string> | null = null
let blockedUserModalPromise: Promise<never> | null = null
const AUTH_ENDPOINTS = ["/api/auth/wx-login", "/api/auth/refresh"] as const
const BUSINESS_ERROR_MESSAGE_MAP: Record<number, string> = {
  40902: "签到失败，不在可签到范围内",
}

function getAccessToken() {
  return (wx.getStorageSync("accessToken") as string) || ""
}

function getRefreshToken() {
  return (wx.getStorageSync("refreshToken") as string) || ""
}

function saveTokens(accessToken: string, refreshToken: string) {
  wx.setStorageSync("accessToken", accessToken)
  wx.setStorageSync("refreshToken", refreshToken)
}

function clearTokens() {
  wx.removeStorageSync("accessToken")
  wx.removeStorageSync("refreshToken")
}

function isBlockedUserCode(code: number): code is (typeof WX_USER_BLOCKED_CODES)[number] {
  return WX_USER_BLOCKED_CODES.includes(code as (typeof WX_USER_BLOCKED_CODES)[number])
}

function handleBlockedUser(code: (typeof WX_USER_BLOCKED_CODES)[number], msg?: string) {
  if (blockedUserModalPromise) {
    return blockedUserModalPromise
  }

  clearTokens()

  blockedUserModalPromise = new Promise<never>((_resolve, reject) => {
    const content = msg || WX_USER_BLOCKED_MESSAGE_MAP[code] || "账号状态异常"

    wx.showModal({
      title: "提示",
      content,
      showCancel: false,
      confirmText: "确认",
      complete: () => {
        wx.reLaunch({
          url: "/pages/home/index",
          complete: () => {
            reject(new Error(BLOCKED_USER_REDIRECT_HOME))
          },
        })
      },
    })
  }).finally(() => {
    blockedUserModalPromise = null
  })

  return blockedUserModalPromise
}

function shouldHandleBlockedByOptions(options: RequestOptions) {
  const isAuthEndpoint = AUTH_ENDPOINTS.includes((options.url || "") as (typeof AUTH_ENDPOINTS)[number])
  return !options.skipAuth || isAuthEndpoint
}

function runWxLogin() {
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

async function ensureAccessToken() {
  const token = getAccessToken()
  if (token) {
    return token
  }

  if (loginPromise) {
    return loginPromise
  }

  loginPromise = runWxLogin()
    .then((code) =>
      requestRaw<{ token: string; refreshToken: string }>({
        url: "/api/auth/wx-login",
        method: "POST",
        data: { code },
        skipAuth: true,
      }),
    )
    .then((res) => {
      const loginData = res.data as { token: string; refreshToken: string } & Record<string, unknown>
      const { token, refreshToken } = loginData
      saveTokens(token, refreshToken)
      mergeCacheToken(extractCacheTokenPatch(loginData))
      return token
    })
    .finally(() => {
      loginPromise = null
    })

  return loginPromise
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

function resolveBusinessErrorMessage(code: number, fallbackMsg?: string) {
  const mappedMessage = BUSINESS_ERROR_MESSAGE_MAP[code]
  if (mappedMessage) {
    return mappedMessage
  }

  if (typeof fallbackMsg === "string" && fallbackMsg.trim()) {
    return fallbackMsg
  }

  return "请求失败"
}

function requestRaw<T>(options: RequestOptions) {
  return new Promise<ApiResponse<T>>((resolve, reject) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.header as Record<string, string>),
    }
    const token = getAccessToken()
    if (!options.skipAuth && token) {
      headers.token = token
    }

    wx.request({
      ...options,
      header: headers,
      url: `${getBaseUrl()}${options.url}`,
      success: (res) => {
        const data = res.data as ApiResponse<T>

        if (isBlockedUserCode(data.code) && shouldHandleBlockedByOptions(options)) {
          handleBlockedUser(data.code, data.msg).catch((error) => reject(error))
          return
        }

        if (res.statusCode === 401 || data.code === 401) {
          reject(new Error("UNAUTHORIZED"))
          return
        }
        if (res.statusCode === 200 && data.code === 200) {
          resolve(data)
          return
        }
        reject(new Error(resolveBusinessErrorMessage(data.code, data.msg)))
      },
      fail: (error) => reject(error),
    })
  })
}

async function refreshAccessToken() {
  if (refreshingPromise) {
    return refreshingPromise
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error("NO_REFRESH_TOKEN")
  }

  refreshingPromise = requestRaw<{ token: string; refreshToken: string }>({
    url: "/api/auth/refresh",
    method: "POST",
    data: { refreshToken },
    skipAuth: true,
  })
    .then((res) => {
      const { token, refreshToken: nextRefreshToken } = res.data
      saveTokens(token, nextRefreshToken)
      return token
    })
    .finally(() => {
      refreshingPromise = null
    })

  return refreshingPromise
}

export async function request<T>(options: RequestOptions) {
  if (!options.skipAuth && !getAccessToken()) {
    await ensureAccessToken()
  }

  try {
    return await requestRaw<T>(options)
  } catch (error) {
    const message = (error as Error).message
    if (message === BLOCKED_USER_REDIRECT_HOME) {
      throw error
    }

    if (message !== "UNAUTHORIZED" || options.skipAuth || options._retry) {
      throw error
    }

    try {
      await refreshAccessToken()
      return await requestRaw<T>({ ...options, _retry: true })
    } catch (refreshError) {
      clearTokens()
      throw refreshError
    }
  }
}

export type { ApiResponse, RequestOptions }
