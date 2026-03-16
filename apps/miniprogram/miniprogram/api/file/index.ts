import { getBaseUrl } from "../../config/env"
import { ensureLogin } from "../auth/index"

interface UploadResponse {
  code: number
  data: string
  msg?: string
  message?: string
}

export async function uploadFileApi(filePath: string) {
  const token = await ensureLogin()

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
          reject(new Error("上传结果解析失败"))
          return
        }

        if (res.statusCode !== 200 || !parsed || parsed.code !== 200 || !parsed.data) {
          const errorMessage =
            (parsed && (parsed.msg || parsed.message)) || "头像上传失败"
          reject(new Error(errorMessage))
          return
        }

        resolve(parsed.data)
      },
      fail: (error) => reject(error),
    })
  })
}
