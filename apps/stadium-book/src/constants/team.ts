export type TeamStatusTagType = "" | "success" | "warning" | "info" | "danger" | "primary"

export const TEAM_STATUS_MAP: Record<number, { label: string; type: TeamStatusTagType }> = {
  1: { label: "招募中", type: "success" },
  2: { label: "已满", type: "warning" },
  3: { label: "已关闭", type: "info" },
  4: { label: "已过期", type: "danger" },
  5: { label: "已取消", type: "danger" },
}

export const TEAM_STATUS_OPTIONS = Object.entries(TEAM_STATUS_MAP)
  .map(([key, value]) => ({
    label: value.label,
    value: Number(key),
  }))
  .sort((a, b) => a.value - b.value)

export const getTeamStatusLabel = (status: number | undefined) => {
  if (typeof status !== "number") return "未知"
  return TEAM_STATUS_MAP[status]?.label ?? "未知"
}

export const getTeamStatusTagType = (status: number | undefined): TeamStatusTagType => {
  if (typeof status !== "number") return "info"
  return TEAM_STATUS_MAP[status]?.type ?? "info"
}
