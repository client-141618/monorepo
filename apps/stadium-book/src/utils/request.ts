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

    switch (statusCode) {
      case 200:
        return response.data
      case 400:
        ElMessage.warning(msg ?? "请求参数错误")
        break
      case 401:
        return handleUnauthorized(response)
      case 402:
        ElMessage.warning(msg ?? "登录状态已过期，请重新登录")
        localStorage.removeItem("userInfo")
        router.push("/login")
        break
      case 403:
        ElMessage.warning(msg ?? "禁止访问")
        break
      case 404:
        ElMessage.warning(msg ?? "资源不存在")
        break
      case 500:
      default:
        ElMessage.error(msg ?? "操作失败")
        break
    }

    return Promise.reject(new Error(msg ?? "请求失败"))
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

    const responseData = (error.response?.data ?? {}) as {
      msg?: string
    }
    const msg = responseData.msg

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
