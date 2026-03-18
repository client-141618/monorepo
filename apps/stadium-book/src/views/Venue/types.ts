export interface VenueFormModel {
  name: string
  image: string
  typeId: number
  description: string
  location: string
  pricePerHour: number
  openTime: string
  closeTime: string
  total: number
  unitCapacity: number
  slotMinutes: number
  status: number
  enableLocationVerify: 0 | 1
  checkinLatGcj02?: number
  checkinLngGcj02?: number
  checkinRadiusM?: number
}
