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

export interface Venue {
  id: number
  name: string
  image?: string
  type?: string | number
  typeId?: number
  typeName?: string
  description?: string
  location?: string
  pricePerHour: number
  openTime: string
  closeTime: string
  total: number
  unitCapacity?: number
  slotMinutes?: number
  remaining?: number
  status: number
}

export interface VenuePageQuery {
  typeId?: number
}

export function getVenueListApi() {
  return request<Venue[]>({
    url: "/api/venue/list",
    method: "GET",
    skipAuth: true,
  })
}

export function getVenuePageApi(data: PageRequest<VenuePageQuery>) {
  return request<PageResult<Venue>>({
    url: "/api/venue/page",
    method: "POST",
    data,
    skipAuth: true,
  })
}

export function getVenueListByTypeApi(type: string) {
  return request<Venue[]>({
    url: `/api/venue/type/${type}`,
    method: "GET",
    skipAuth: true,
  })
}

export function getVenueByIdApi(id: number) {
  return request<Venue>({
    url: `/api/venue/${id}`,
    method: "GET",
    skipAuth: true,
  })
}
