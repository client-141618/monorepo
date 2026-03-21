import type {
  AdminCancelReservationPayload,
  AdminReservationListQuery,
  AdminReservationPageQuery,
  AdminReservationRecord,
  CreateReservationBlockPayload,
  CreateReservationPayload,
  CreateReservationResult,
  ReservationAvailabilityData,
  ReservationBlockRecord,
  VenueCheckInQrData,
} from "./type"
import type { PageRequest, PageResult } from "@/api/base/types"
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

export function getReservationListAllAdminApi(params?: AdminReservationListQuery) {
  return request<AdminReservationRecord[]>({
    url: `${PREFIX}/admin/all`,
    method: "GET",
    params,
  })
}

export function getReservationPageAllAdminApi(data: PageRequest<AdminReservationPageQuery>) {
  return request<PageResult<AdminReservationRecord>>({
    url: `${PREFIX}/admin/page`,
    method: "POST",
    data,
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

export function getVenueCheckInQrAdminApi(venueId: number, courtId: number) {
  return request<VenueCheckInQrData>({
    url: `${PREFIX}/admin/check-in/qr/venue/${venueId}/court/${courtId}`,
    method: "GET",
  })
}
