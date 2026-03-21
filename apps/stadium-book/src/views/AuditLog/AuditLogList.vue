<script setup lang="ts">
import type { OperationAuditLogRecord } from "@/api/operation-audit-log/type"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { getOperationAuditLogPageApi } from "@/api/operation-audit-log"
import PageContentShell from "@/components/PageContentShell/index.vue"
import PageFilterBar from "@/components/PageFilterBar/index.vue"
import PageRouteTitle from "@/components/PageRouteTitle/index.vue"
import { AUDIT_EVENT_OPTIONS, getAuditEventLabel } from "@/constants/audit-log"
import { WX_USER_STATUS_OPTIONS } from "@/constants/wx-user"
import { formatDateTimeText } from "@/utils/format"
import { parseOptionalNonNegativeInteger } from "@/utils/query"

const tableLoading = ref(false)
const auditLogList = ref<OperationAuditLogRecord[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const eventFilter = ref("")
const bizIdFilter = ref("")
const operatorUserIdFilter = ref("")

const filteredAuditLogList = computed(() => {
  return auditLogList.value.filter((row) => {
    const matchedEvent = eventFilter.value
      ? `${row.bizType}_${row.action}` === eventFilter.value
      : true
    const matchedBizId = bizIdFilter.value
      ? row.bizId === Number(bizIdFilter.value.trim())
      : true
    const matchedOperatorUserId = operatorUserIdFilter.value
      ? row.operatorUserId === Number(operatorUserIdFilter.value.trim())
      : true
    return matchedEvent && matchedBizId && matchedOperatorUserId
  })
})

const paginationTotal = computed(() => {
  if (eventFilter.value || bizIdFilter.value.trim() || operatorUserIdFilter.value.trim()) {
    return filteredAuditLogList.value.length
  }
  return total.value
})

const getOperationObjectLabel = (row: OperationAuditLogRecord) => {
  if (row.bizType === "RESERVATION_BLOCK") return "场馆ID"
  if (row.bizType === "WX_USER" || row.bizType === "RESERVATION") return "用户ID"
  return "对象ID"
}

const wxUserStatusLabelMap = Object.fromEntries(
  WX_USER_STATUS_OPTIONS.map((item) => [item.value, item.label] as const),
) as Record<number, string>

const formatDetailText = (detail: string | undefined, row: OperationAuditLogRecord) => {
  if (!detail) return "--"
  const normalizedDetail = detail.replace(/status=(\d+)/g, (_match, statusRaw: string) => {
    const status = Number(statusRaw)
    const statusLabel = wxUserStatusLabelMap[status]
    return statusLabel ? `状态->${statusLabel}` : `状态->${statusRaw}`
  })

  const operationLabel = getAuditEventLabel(row.bizType, row.action)
  const escapedLabel = operationLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const duplicatedPrefixPattern = new RegExp(`^${escapedLabel}\\s*[,:：，]\\s*`)
  return normalizedDetail.replace(duplicatedPrefixPattern, "")
}

const loadAuditLogList = async () => {
  const parsedBizId = parseOptionalNonNegativeInteger(bizIdFilter.value)
  if (!parsedBizId.valid) {
    ElMessage.warning("业务ID请输入非负整数")
    return
  }

  const parsedOperatorUserId = parseOptionalNonNegativeInteger(
    operatorUserIdFilter.value,
  )
  if (!parsedOperatorUserId.valid) {
    ElMessage.warning("操作人ID请输入非负整数")
    return
  }

  try {
    tableLoading.value = true
    const res = await getOperationAuditLogPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    auditLogList.value = Array.isArray(res.data?.records) ? res.data.records : []
    total.value = Number(res.data?.total) || 0
  } finally {
    tableLoading.value = false
  }
}

const handleQuery = async () => {
  pageNum.value = 1
  await loadAuditLogList()
}

const handleReset = async () => {
  eventFilter.value = ""
  bizIdFilter.value = ""
  operatorUserIdFilter.value = ""
  pageNum.value = 1
  await loadAuditLogList()
}

const handleCurrentPageChange = (value: number) => {
  if (value === pageNum.value) return
  pageNum.value = value
  loadAuditLogList()
}

onMounted(() => {
  loadAuditLogList()
})
</script>

<template>
  <PageContentShell class="audit-log-page">
    <template #header>
      <PageRouteTitle fallback-title="审计日志" />
      <PageFilterBar :query-loading="tableLoading" @query="handleQuery" @reset="handleReset">
        <el-select
          v-model="eventFilter"
          clearable
          placeholder="操作类型"
          class="audit-log-page__filter-item"
        >
          <el-option
            v-for="item in AUDIT_EVENT_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="`${item.bizType}_${item.action}`"
          />
        </el-select>
        <el-input
          v-model="bizIdFilter"
          clearable
          placeholder="对象ID"
          class="audit-log-page__filter-item"
        />
        <el-input
          v-model="operatorUserIdFilter"
          clearable
          placeholder="操作人ID"
          class="audit-log-page__filter-item"
        />
      </PageFilterBar>
    </template>

    <el-card class="audit-log-page__table-card" shadow="never">
      <div class="audit-log-page__table-wrap">
        <el-table
          v-loading="tableLoading"
          :data="filteredAuditLogList"
          stripe
          height="100%"
          empty-text="暂无审计日志数据"
        >
          <el-table-column prop="id" label="日志ID" width="90" />
          <el-table-column label="操作类型" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getAuditEventLabel(row.bizType, row.action) }}
            </template>
          </el-table-column>
          <el-table-column label="操作对象" min-width="160">
            <template #default="{ row }">
              <div class="audit-log-page__object-info">
                <span>{{ getOperationObjectLabel(row) }}：{{ row.bizId ?? "--" }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="详情" min-width="320" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatDetailText(row.detail, row) }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTimeText(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作人" min-width="170">
            <template #default="{ row }">
              <div class="audit-log-page__operator">
                <span>{{ row.operatorName || "--" }}</span>
                <el-tag size="small" type="info">ID: {{ row.operatorUserId }}</el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <template #footer>
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :total="paginationTotal"
        layout="total, prev, pager, next"
        background
        @current-change="handleCurrentPageChange"
      />
    </template>
  </PageContentShell>
</template>

<style scoped lang="scss">
.audit-log-page__table-card {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
}

.audit-log-page__filter-item {
  width: 220px;
}

.audit-log-page__object-info {
  display: flex;
  align-items: center;
  line-height: 1.4;
}

.audit-log-page__operator {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.audit-log-page__table-card .el-card__body) {
  height: 100%;
  min-height: 0;
  padding: 0;
}

.audit-log-page__table-wrap {
  height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
}
</style>
