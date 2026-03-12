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
  createTime?: string
  updateTime?: string
}
