export interface OperationAuditLogRecord {
  id: number
  bizType: string
  bizId: number
  action: string
  detail: string
  operatorUserId: number
  operatorName: string
  createTime: string
}
