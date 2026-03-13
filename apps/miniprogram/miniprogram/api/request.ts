import { getBaseUrl } from "../config/env"

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
      const { token, refreshToken } = res.data
      saveTokens(token, refreshToken)
      return token
    })
    .finally(() => {
      loginPromise = null
    })

  return loginPromise
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
        if (res.statusCode === 401 || data.code === 401) {
          reject(new Error("UNAUTHORIZED"))
          return
        }
        if (res.statusCode === 200 && data.code === 200) {
          resolve(data)
          return
        }
        reject(new Error(data.msg || "请求失败"))
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
