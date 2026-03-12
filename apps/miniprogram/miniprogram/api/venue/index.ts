import { request } from "../request"

export interface Venue {
  id: number
  name: string
  image?: string
  type: number
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
  })
}
