import { request } from "../request"

export interface Venue {
  id: number
  name: string
  image?: string
  type: string | number
  description?: string
  location?: string
  pricePerHour: number
  openTime: string
  closeTime: string
  total: number
  remaining?: number
  status: number
}

export function getVenueListApi() {
  return request<Venue[]>({
    url: "/api/venue/list",
    method: "GET",
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
