import type {
  CreateReservationPayload,
  CreateReservationResult,
  ReservationAvailabilityData,
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
