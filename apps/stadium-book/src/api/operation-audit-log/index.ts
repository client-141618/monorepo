import type { OperationAuditLogRecord } from "./type"
import { request } from "@/utils/request"

const PREFIX = "/api/operation-audit-log"

/**
 * 管理端查询全部操作日志
 */
export function getOperationAuditLogListApi() {
  return request<OperationAuditLogRecord[]>({
    url: `${PREFIX}/list`,
    method: "GET",
  })
}
