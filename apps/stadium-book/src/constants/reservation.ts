export type ReservationStatusTagType =
  | ""
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "primary"

export const RESERVATION_STATUS_MAP: Record<
  number,
  { label: string; type: ReservationStatusTagType }
> = {
  0: { label: "已取消", type: "warning" },
  1: { label: "待核销", type: "primary" },
  2: { label: "已完成", type: "success" },
  3: { label: "已过期未到场", type: "danger" },
}

export const getReservationStatusLabel = (status: number) => {
  return RESERVATION_STATUS_MAP[status]?.label ?? `状态${status}`
}

export const getReservationStatusTagType = (status: number): ReservationStatusTagType => {
  return RESERVATION_STATUS_MAP[status]?.type ?? "info"
}
