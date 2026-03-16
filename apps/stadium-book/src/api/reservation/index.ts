import type {
  AdminCancelReservationPayload,
  AdminReservationRecord,
  CreateReservationBlockPayload,
  CreateReservationPayload,
  CreateReservationResult,
  ReservationAvailabilityData,
  ReservationBlockRecord,
} from "./type"
import { request } from "@/utils/request"

const PREFIX = "/api/reservation"

export function getReservationAvailabilityNextSevenDaysApi(
  venueId: number,
  startDate?: string,
) {
  return request<ReservationAvailabilityData>({
    url: `${PREFIX}/venue/${venueId}/availability/next-seven-days`,
    method: "GET",
    params: startDate ? { startDate } : undefined,
  })
}

export function createReservationApi(data: CreateReservationPayload) {
  return request<CreateReservationResult>({
    url: `${PREFIX}/create`,
    method: "POST",
    data,
  })
}

export function getReservationListByVenueAndDateAdminApi(venueId: number, date: string) {
  return request<AdminReservationRecord[]>({
    url: `${PREFIX}/admin/venue/${venueId}/date/${date}`,
    method: "GET",
  })
}

export function cancelReservationAdminApi(
  reservationId: number,
  data?: AdminCancelReservationPayload,
) {
  return request<null>({
    url: `${PREFIX}/admin/cancel/${reservationId}`,
    method: "PUT",
    data,
  })
}

export function createReservationBlockAdminApi(data: CreateReservationBlockPayload) {
  return request<ReservationBlockRecord>({
    url: `${PREFIX}/admin/block/create`,
    method: "POST",
    data,
  })
}

export function disableReservationBlockAdminApi(blockId: number) {
  return request<null>({
    url: `${PREFIX}/admin/block/disable/${blockId}`,
    method: "PUT",
  })
}

export function getReservationBlockListByVenueAndDateAdminApi(venueId: number, date: string) {
  return request<ReservationBlockRecord[]>({
    url: `${PREFIX}/admin/block/venue/${venueId}/date/${date}`,
    method: "GET",
  })
}
