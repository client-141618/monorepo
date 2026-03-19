import { request } from "../request"

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
