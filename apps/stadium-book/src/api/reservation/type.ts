export interface ReservationAvailabilitySlot {
  startTime: string
  endTime: string
  totalCourts: number
  bookedCount: number
  availableCount: number
  bookedCourtIds: number[]
  availableCourtIds: number[]
}

export interface ReservationAvailabilityDay {
  date: string
  slots: ReservationAvailabilitySlot[]
}

export interface ReservationAvailabilityData {
  venueId: number
  startDate: string
  slotMinutes: number
  totalCourts: number
  days: ReservationAvailabilityDay[]
}

export interface CreateReservationPayload {
  venueId: number
  courtId: number
  bookingDate: string
  slotKeys: string[]
  clientRequestId: string
  remark?: string
}

export interface CreateReservationResult {
  reservationIds: number[]
  venueId: number
  courtId: number
  bookingDate: string
  confirmedSlots: string[]
}

export interface VenueCheckInQrData {
  venueId: number
  courtId: number
  qrPayload: string
  qrImageBase64: string
}

export interface AdminReservationRecord {
  id: number
  userId: number | string
  venueId: number
  venueName?: string
  courtId: number
  reservationDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  reservedSeats: number
  totalPrice: number
  status: number
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface AdminReservationListQuery {
  userId?: number
  status?: number
  startDate?: string
  endDate?: string
}

export interface AdminCancelReservationPayload {
  reason?: string
}

export interface CreateReservationBlockPayload {
  venueId: number
  courtId: number | null
  blockType: 1 | 2
  blockDate?: string
  weekday?: number
  repeatStartDate?: string
  repeatEndDate?: string
  startTime: string
  endTime: string
  reason?: string
}

export interface ReservationBlockRecord {
  id: number
  venueId: number
  courtId: number | null
  blockType: 1 | 2
  blockDate?: string | null
  weekday?: number | null
  repeatStartDate?: string | null
  repeatEndDate?: string | null
  startTime: string
  endTime: string
  reason?: string | null
  status: number
  createTime?: string
  updateTime?: string
}
