import type { OperationAuditLogRecord } from "./type"
import type { PageRequest, PageResult } from "@/api/base/types"
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

export function getOperationAuditLogPageApi(data: PageRequest<undefined>) {
  return request<PageResult<OperationAuditLogRecord>>({
    url: `${PREFIX}/page`,
    method: "POST",
    data,
  })
}
