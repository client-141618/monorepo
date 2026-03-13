export interface VenueType {
  id: number
  name: string
  createTime?: string
  updateTime?: string
}

export interface AddVenueTypePayload {
  name: string
}

export interface UpdateVenueTypePayload {
  id: number
  name: string
}
