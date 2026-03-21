import type { AddMiniappBannerPayload, MiniappBanner } from "./type"
import type { PageRequest, PageResult } from "@/api/base/types"
import { request } from "@/utils/request"

const PREFIX = "/api/miniapp-banner"

/**
 * 查询未删除 Banner 列表（小程序首页）
 */
export function getMiniappBannerListApi() {
  return request<MiniappBanner[]>({
    url: `${PREFIX}/list`,
    method: "GET",
  })
}

export function getMiniappBannerPageApi(data: PageRequest<undefined>) {
  return request<PageResult<MiniappBanner>>({
    url: `${PREFIX}/page`,
    method: "POST",
    data,
  })
}

/**
 * 新增 Banner
 */
export function addMiniappBannerApi(data: AddMiniappBannerPayload) {
  return request<MiniappBanner>({
    url: `${PREFIX}/add`,
    method: "POST",
    data,
  })
}

/**
 * 删除 Banner（逻辑删除）
 */
export function deleteMiniappBannerApi(id: number) {
  return request({
    url: `${PREFIX}/delete/${id}`,
    method: "DELETE",
  })
}
