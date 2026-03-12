interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
}

const BASE_URL = "http://localhost:8989"

export function request<T>(options: WechatMiniprogram.RequestOption) {
  return new Promise<ApiResponse<T>>((resolve, reject) => {
    wx.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      success: (res) => {
        const data = res.data as ApiResponse<T>
        if (data.code === 200) {
          resolve(data)
          return
        }
        reject(new Error(data.msg || "请求失败"))
      },
      fail: (error) => reject(error),
    })
  })
}
