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

export interface VenueType {
  id: number
  name: string
  createTime?: string
  updateTime?: string
}

export function getVenueTypeListApi() {
  return request<VenueType[]>({
    url: "/api/venue-type/list",
    method: "GET",
    skipAuth: true,
  })
}

export function getVenueTypePageApi(data: PageRequest<undefined>) {
  return request<PageResult<VenueType>>({
    url: "/api/venue-type/page",
    method: "POST",
    skipAuth: true,
    data,
  })
}
