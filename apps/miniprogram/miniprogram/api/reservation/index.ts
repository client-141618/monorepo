import { request } from "../request"

interface PageRequest<TQuery> {
  pageNum: number
  pageSize: number
  queryDTO?: TQuery
}

interface PageResult<TRecord> {
  records?: TRecord[]
  total?: number
  size?: number
  current?: number
}

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

export interface UserReservationRecord {
  id: number
  userId: number | string
  status?: number
  venueId?: number
  venueName?: string
  courtId?: number
  reservationDate?: string
  startTime?: string
  endTime?: string
  totalPrice?: number
  createTime?: string
}

export interface ReservationCheckInPayload {
  reservationId: number
  qrContent: string
  latitudeGcj02: number
  longitudeGcj02: number
  locationAccuracy: number
}

export interface ReservationUserCountResponse {
  pendingVerificationCount?: number
  totalCount?: number
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

export function getReservationListByUserApi() {
  return request<UserReservationRecord[]>({
    url: "/api/reservation/user",
    method: "GET",
  })
}

export function getReservationPageByUserApi(data: PageRequest<undefined>) {
  return request<PageResult<UserReservationRecord>>({
    url: "/api/reservation/user/page",
    method: "POST",
    data,
  })
}

export function getReservationUserCountApi() {
  return request<ReservationUserCountResponse>({
    url: "/api/reservation/user/count",
    method: "GET",
  })
}

export function checkInReservationApi(data: ReservationCheckInPayload) {
  return request<null>({
    url: "/api/reservation/check-in",
    method: "POST",
    data,
  })
}

export function cancelReservationApi(reservationId: number) {
  return request<null>({
    url: `/api/reservation/cancel/${reservationId}`,
    method: "PUT",
  })
}
