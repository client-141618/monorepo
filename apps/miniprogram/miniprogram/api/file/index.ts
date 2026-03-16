import { getBaseUrl } from "../../config/env"
import { ensureLogin, refreshTokenApi } from "../auth/index"

interface UploadResponse {
  code: number
  data: string
  msg?: string
  message?: string
}

class UploadApiError extends Error {
  unauthorized: boolean

  constructor(message: string, unauthorized = false) {
    super(message)
    this.name = "UploadApiError"
    this.unauthorized = unauthorized
  }
}

function uploadWithToken(filePath: string, token: string) {
  return new Promise<string>((resolve, reject) => {
    wx.uploadFile({
      url: `${getBaseUrl()}/api/file/upload`,
      filePath,
      name: "file",
      header: {
        token,
      },
      success: (res) => {
        let parsed: UploadResponse | null = null
        try {
          parsed = JSON.parse(res.data) as UploadResponse
        } catch (_error) {
          reject(new UploadApiError("上传结果解析失败"))
          return
        }

        const isUnauthorized = res.statusCode === 401 || (parsed && parsed.code === 401)
        if (isUnauthorized) {
          reject(new UploadApiError("UNAUTHORIZED", true))
          return
        }

        if (res.statusCode !== 200 || !parsed || parsed.code !== 200 || !parsed.data) {
          const errorMessage =
            (parsed && (parsed.msg || parsed.message)) || "头像上传失败"
          reject(new UploadApiError(errorMessage))
          return
        }

        resolve(parsed.data)
      },
      fail: (error) => reject(error),
    })
  })
}

async function refreshUploadToken() {
  const refreshToken = (wx.getStorageSync("refreshToken") as string) || ""
  if (refreshToken) {
    try {
      const refreshRes = await refreshTokenApi({ refreshToken })
      const tokenData = refreshRes.data
      wx.setStorageSync("accessToken", tokenData.token)
      wx.setStorageSync("refreshToken", tokenData.refreshToken)
      return tokenData.token
    } catch (_error) {
      wx.removeStorageSync("accessToken")
      wx.removeStorageSync("refreshToken")
    }
  } else {
    wx.removeStorageSync("accessToken")
  }

  return ensureLogin()
}

export async function uploadFileApi(filePath: string) {
  const token = await ensureLogin()

  try {
    return await uploadWithToken(filePath, token)
  } catch (error) {
    const uploadError = error as UploadApiError
    if (!uploadError || !uploadError.unauthorized) {
      throw error
    }

    const nextToken = await refreshUploadToken()
    return uploadWithToken(filePath, nextToken)
  }
}
