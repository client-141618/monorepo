import { request } from "../request"

interface PageRequest<TQuery> {
  pageNum: number
  pageSize: number
  queryDTO?: TQuery
}

interface PageResult<TRecord> {
  records?: TRecord[]
  total?: number
  size?: number
  current?: number
}

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

export function getMiniappBannerPageApi(data: PageRequest<undefined>) {
  return request<PageResult<MiniappBanner>>({
    url: "/api/miniapp-banner/page",
    method: "POST",
    skipAuth: true,
    data,
  })
}
