import { request } from "../request"

export interface ReservationAvailabilitySlot {
  startTime: string
  endTime: string
  totalCourts: number
  bookedCount: number
  blockedCount?: number
  availableCount: number
  bookedCourtIds: number[]
  blockedCourtIds?: number[]
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

export function getReservationAvailabilityNextSevenDaysApi(
  venueId: number,
  startDate?: string,
) {
  return request<ReservationAvailabilityData>({
    url: `/api/reservation/venue/${venueId}/availability/next-seven-days`,
    method: "GET",
    data: startDate ? { startDate } : undefined,
  })
}

export function createReservationApi(data: CreateReservationPayload) {
  return request<CreateReservationResult>({
    url: "/api/reservation/create",
    method: "POST",
    data,
  })
}
