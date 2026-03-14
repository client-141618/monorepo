export type WxUserStatus = 1 | 2 | 3 | 4

export type WxUserStatusOption = {
  label: string
  value: WxUserStatus
  type: "" | "success" | "warning" | "info" | "danger"
}

export const WX_USER_STATUS_OPTIONS: WxUserStatusOption[] = [
  { label: "正常", value: 1, type: "success" },
  { label: "限制预约", value: 2, type: "warning" },
  { label: "停用", value: 3, type: "danger" },
  { label: "删除", value: 4, type: "info" },
]
