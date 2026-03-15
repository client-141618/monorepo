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
