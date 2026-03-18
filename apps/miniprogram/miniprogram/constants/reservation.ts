export const RESERVATION_STATUS_CANCELLED = 0
export const RESERVATION_STATUS_PENDING_VERIFICATION = 1
export const RESERVATION_STATUS_COMPLETED = 2
export const RESERVATION_STATUS_NO_SHOW = 3

export type ReservationStatusClassName =
  | "status-tag--cancelled"
  | "status-tag--pending"
  | "status-tag--completed"
  | "status-tag--no-show"
  | "status-tag--unknown"

export interface ReservationStatusMeta {
  text: string
  className: ReservationStatusClassName
}

export function getReservationStatusMeta(status: unknown): ReservationStatusMeta {
  const value = Number(status)
  if (!Number.isFinite(value)) {
    return {
      text: "未知状态",
      className: "status-tag--unknown",
    }
  }

  if (value === RESERVATION_STATUS_CANCELLED) {
    return {
      text: "已取消",
      className: "status-tag--cancelled",
    }
  }

  if (value === RESERVATION_STATUS_PENDING_VERIFICATION) {
    return {
      text: "待核销",
      className: "status-tag--pending",
    }
  }

  if (value === RESERVATION_STATUS_COMPLETED) {
    return {
      text: "已完成",
      className: "status-tag--completed",
    }
  }

  if (value === RESERVATION_STATUS_NO_SHOW) {
    return {
      text: "未到场",
      className: "status-tag--no-show",
    }
  }

  return {
    text: `状态${value}`,
    className: "status-tag--unknown",
  }
}
