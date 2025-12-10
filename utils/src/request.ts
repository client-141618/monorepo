import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios"
import axios from "axios"
import { ElMessage } from "element-plus"

interface ApiResponse<T = unknown> {
  code?: number
  data: T
  msg?: string
  success?: boolean
  [key: string]: unknown
}

export type RequestConfig<D = unknown> = AxiosRequestConfig<D>

const service: AxiosInstance = axios.create({
  baseURL: "/",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {}
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (user) {
      config.headers['token'] = user.token
    }
    // if (typeof window !== 'undefined') {
    //   const token = window.localStorage.getItem('token')
    //   if (token && !config.headers.Authorization) {
    //     config.headers.Authorization = `Bearer ${token}`
    //   }
    // }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

service.interceptors.response.use(
  (response) => {
    const { code, msg } = (response.data ?? {}) as ApiResponse
    const statusCode = code ?? response.status

    switch (statusCode) {
      case 200:
        return response.data
      case 400:
        ElMessage.warning(msg ?? "请求参数错误")
        break
      case 401:
        ElMessage.warning(msg ?? "未授权")
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
    const responseData = (error.response?.data ?? {}) as {
      message?: string
    }
    const statusMessageMap: Record<number, string> = {
      400: "请求参数错误",
      401: "未授权",
      403: "禁止访问",
      404: "资源不存在",
      500: "服务器内部错误",
    }
    const message =
      responseData.message ??
      statusMessageMap[error.response?.status ?? 0] ??
      error.response?.statusText ??
      error.message ??
      "网络错误，请稍后重试"

    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
)

const request = <T = unknown, D = unknown>(
  config: RequestConfig<D>,
): Promise<ApiResponse<T>> => {
  return service.request<ApiResponse<T>, ApiResponse<T>, D>(config)
}

export type { ApiResponse }

export { request }
