export interface AuditEventOption {
  label: string
  value: string
  bizType: string
  action: string
}

export const AUDIT_EVENT_OPTIONS: AuditEventOption[] = [
  {
    label: "管理员取消预约",
    value: "RESERVATION_ADMIN_CANCEL",
    bizType: "RESERVATION",
    action: "ADMIN_CANCEL",
  },
  {
    label: "管理员创建不可用时段规则",
    value: "RESERVATION_BLOCK_CREATE",
    bizType: "RESERVATION_BLOCK",
    action: "CREATE_BLOCK",
  },
  {
    label: "管理员停用不可用时段规则",
    value: "RESERVATION_BLOCK_DISABLE",
    bizType: "RESERVATION_BLOCK",
    action: "DISABLE_BLOCK",
  },
  {
    label: "系统自动标记预约未到场",
    value: "RESERVATION_AUTO_NO_SHOW",
    bizType: "RESERVATION",
    action: "AUTO_NO_SHOW",
  },
  {
    label: "用户扫码核销预约",
    value: "RESERVATION_CHECK_IN",
    bizType: "RESERVATION",
    action: "CHECK_IN",
  },
  {
    label: "因不可用时段规则冲突，系统自动取消预约",
    value: "RESERVATION_AUTO_CANCEL_BY_BLOCK",
    bizType: "RESERVATION",
    action: "AUTO_CANCEL_BY_BLOCK",
  },
  {
    label: "系统自动将微信用户设为限制预约",
    value: "WX_USER_AUTO_SET_RESTRICTED",
    bizType: "WX_USER",
    action: "AUTO_SET_RESTRICTED",
  },
  {
    label: "系统解除微信用户限制预约记录",
    value: "WX_USER_RESTRICTION_RELEASE",
    bizType: "WX_USER_RESTRICTION",
    action: "RELEASE_RESTRICTION",
  },
  {
    label: "管理员手动解除微信用户限制记录",
    value: "WX_USER_ADMIN_RELEASE_RESTRICTION",
    bizType: "WX_USER",
    action: "ADMIN_RELEASE_RESTRICTION",
  },
  {
    label: "管理员修改微信用户状态",
    value: "WX_USER_ADMIN_UPDATE_STATUS",
    bizType: "WX_USER",
    action: "ADMIN_UPDATE_STATUS",
  },
  // 暂时不需要，不涉及到删除微信用户操作
  // {
  //   label: "管理员删除微信用户（状态置为删除）",
  //   value: "WX_USER_ADMIN_DELETE",
  //   bizType: "WX_USER",
  //   action: "ADMIN_DELETE_WX_USER",
  // },
]

export const getAuditEventLabel = (bizType?: string, action?: string) => {
  if (!bizType || !action) return "--"
  const matched = AUDIT_EVENT_OPTIONS.find(
    (item) => item.bizType === bizType && item.action === action,
  )
  return matched?.label ?? `${bizType} / ${action}`
}
