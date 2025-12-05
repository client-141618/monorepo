import axios from 'axios'
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'

interface ApiResponse<T = unknown> {
  code?: number
  data: T
  message?: string
  success?: boolean
  [key: string]: unknown
}

export type RequestConfig<D = unknown> = AxiosRequestConfig<D>

const service: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {}

    // if (typeof window !== 'undefined') {
    //   const token = window.localStorage.getItem('token')
    //   if (token && !config.headers.Authorization) {
    //     config.headers.Authorization = `Bearer ${token}`
    //   }
    // }

    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const responseData = (error.response?.data ?? {}) as {
      message?: string
    }
    const message =
      responseData.message ??
      error.response?.statusText ??
      error.message ??
      '网络错误，请稍后重试'

    return Promise.reject(new Error(message))
  }
)

const request = <T = unknown, D = unknown>(
  config: RequestConfig<D>
): Promise<ApiResponse<T>> => {
  return service.request<ApiResponse<T>, ApiResponse<T>, D>(config)
}

export type { ApiResponse }

export { request }