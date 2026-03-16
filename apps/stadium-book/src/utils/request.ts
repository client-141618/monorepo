import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios"
import axios, { AxiosHeaders } from "axios"
import { ElMessage } from "element-plus"
import { refreshToken as refreshTokenApi } from "@/api/base"
import router from "@/router"

interface ApiResponse<T = unknown> {
  code?: number
  data: T
  msg?: string
  success?: boolean
  [key: string]: unknown
}

export type RequestConfig<D = unknown> = AxiosRequestConfig<D>

interface UserInfo {
  token?: string
  refreshToken?: string
  [key: string]: unknown
}

const SERVER_UNREACHABLE_MESSAGE =
  "无法连接到后端服务，请检查接口地址或确认后端已启动"

const getMessageFromPayload = (payload: unknown): string | undefined => {
  if (typeof payload === "string") {
    const message = payload.trim()
    return message || undefined
  }

  if (payload && typeof payload === "object") {
    const rawMessage = (payload as Record<string, unknown>).msg
    if (typeof rawMessage === "string") {
      const message = rawMessage.trim()
      if (message) return message
    }
    const rawAltMessage = (payload as Record<string, unknown>).message
    if (typeof rawAltMessage === "string") {
      const message = rawAltMessage.trim()
      if (message) return message
    }
  }

  return undefined
}

const getStoredUser = (): UserInfo => {
  return JSON.parse(localStorage.getItem("userInfo") || "{}") as UserInfo
}

const setStoredUser = (userInfo: UserInfo) => {
  localStorage.setItem("userInfo", JSON.stringify(userInfo))
}

const service: AxiosInstance = axios.create({
  baseURL: "/",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
type TokenSubscriber = (_token: string) => void
const refreshSubscribers: TokenSubscriber[] = []

const subscribeTokenRefresh = (callback: TokenSubscriber) => {
  refreshSubscribers.push(callback)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers.length = 0
}

const refreshAccessToken = async (refreshToken: string) => {
  const res = await refreshTokenApi({ refreshToken })

  if (res.code !== 200) {
    throw new Error(res.msg || "刷新登录状态失败")
  }

  return res.data
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const headers = new AxiosHeaders(config.headers)
    const user = getStoredUser()
    if (user?.token) {
      headers.set("token", user.token)
    }

    return {
      ...config,
      headers,
    }
  },
  (error: AxiosError) => Promise.reject(error),
)

service.interceptors.response.use(
  (response) => {
    const { code, msg } = (response.data ?? {}) as ApiResponse
    const statusCode = code
    const message = getMessageFromPayload(response.data) ?? msg

    switch (statusCode) {
      case 200:
        return response.data
      case 400:
        ElMessage.warning(message ?? "请求参数错误")
        break
      case 401:
        return handleUnauthorized(response)
      case 402:
        ElMessage.warning(message ?? "登录状态已过期，请重新登录")
        localStorage.removeItem("userInfo")
        router.push("/login")
        break
      case 403:
        ElMessage.warning(message ?? "禁止访问")
        break
      case 404:
        ElMessage.warning(message ?? "资源不存在")
        break
      case 500:
      default:
        ElMessage.error(message ?? "操作失败")
        break
    }

    return Promise.reject(new Error(message ?? "请求失败"))
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      return handleUnauthorized(error.response)
    }
    if (error.response?.status === 402) {
      ElMessage.warning("登录状态已过期，请重新登录")
      localStorage.removeItem("userInfo")
      router.push("/login")
      return Promise.reject(new Error("刷新令牌过期"))
    }

    if (!error.response) {
      const errorMessage = String(error.message || "")
      const isTimeout = error.code === "ECONNABORTED"
      const isNetworkError =
        error.code === "ERR_NETWORK" ||
        /Network Error|Failed to fetch|ECONNREFUSED|ENOTFOUND/i.test(
          errorMessage,
        )
      const msg = isTimeout
        ? "请求超时，请稍后重试"
        : isNetworkError
          ? SERVER_UNREACHABLE_MESSAGE
          : "网络异常，请稍后重试"
      ElMessage.error(msg)
      return Promise.reject(new Error(msg))
    }

    const msg =
      getMessageFromPayload(error.response.data) ||
      getMessageFromPayload(error.message) ||
      (error.response.status >= 500 ? "服务器异常，请稍后重试" : "请求失败")

    ElMessage.error(msg)
    return Promise.reject(new Error(msg))
  },
)

const request = <T = unknown, D = unknown>(
  config: RequestConfig<D>,
): Promise<ApiResponse<T>> => {
  return service.request<ApiResponse<T>, ApiResponse<T>, D>(config)
}

export type { ApiResponse }

export { request }

function handleUnauthorized(response: any) {
  const originalRequest = response.config as InternalAxiosRequestConfig & {
    retry?: boolean
  }

  if (originalRequest.retry) {
    ElMessage.warning("登录状态失效，请重新登录")
    localStorage.removeItem("userInfo")
    router.push("/login")
    return Promise.reject(new Error("未授权"))
  }

  originalRequest.retry = true
  const user = getStoredUser()
  const currentRefreshToken = user.refreshToken

  if (!currentRefreshToken) {
    ElMessage.warning("登录状态已过期，请重新登录")
    localStorage.removeItem("userInfo")
    router.push("/login")
    return Promise.reject(new Error("缺少刷新令牌"))
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        const headers = new AxiosHeaders(originalRequest.headers)
        headers.set("token", token)
        resolve(service({ ...originalRequest, headers }))
      })
    })
  }

  isRefreshing = true

  return new Promise((resolve, reject) => {
    refreshAccessToken(currentRefreshToken)
      .then((data: any) => {
        const newToken = data.token as string
        const newRefreshToken = data.refreshToken as string | undefined
        setStoredUser({
          ...user,
          token: newToken,
          refreshToken: newRefreshToken ?? currentRefreshToken,
        })
        onRefreshed(newToken)

        const headers = new AxiosHeaders(originalRequest.headers)
        headers.set("token", newToken)
        resolve(service({ ...originalRequest, headers }))
      })
      .catch((err) => {
        localStorage.removeItem("userInfo")
        router.push("/login")
        reject(err)
      })
      .finally(() => {
        isRefreshing = false
      })
  })
}
