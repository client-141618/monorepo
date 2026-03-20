import { request } from "../request"

export interface MiniappBanner {
  id: number
  imageUrl: string
  isDelete?: number
  createTime?: string
  updateTime?: string
}

export function getMiniappBannerListApi() {
  return request<MiniappBanner[]>({
    url: "/api/miniapp-banner/list",
    method: "GET",
    skipAuth: true,
  })
}
