export interface Venue {
  id: number
  name: string
  image?: string
  typeId: number
  typeName?: string
  description?: string
  location?: string
  pricePerHour: number
  openTime: string
  closeTime: string
  total: number
  unitCapacity: number
  slotMinutes: number
  status: number
  totalSeats?: number
  createTime?: string
  updateTime?: string
}
