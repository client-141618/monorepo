<script setup lang="ts">
import type { AdminReservationRecord } from "@/api/reservation/type"
import { ElMessage } from "element-plus"
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { getReservationPageAllAdminApi } from "@/api/reservation"
import { getVenueListApi } from "@/api/venue"
import PageContentShell from "@/components/PageContentShell/index.vue"
import PageFilterBar from "@/components/PageFilterBar/index.vue"
import PageRouteTitle from "@/components/PageRouteTitle/index.vue"
import {
  getReservationStatusLabel,
  getReservationStatusTagType,
  RESERVATION_STATUS_OPTIONS,
} from "@/constants/reservation"
import { formatCurrencyFromFen, formatDateTimeText } from "@/utils/format"
import { parseOptionalNonNegativeInteger } from "@/utils/query"
import { formatVenueCourtInfo } from "@/utils/venue"

const route = useRoute()
const loading = ref(false)
const reservationList = ref<AdminReservationRecord[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const venueNameMap = ref<Record<number, string>>({})
const userIdFilter = ref("")
const dateRangeFilter = ref<[string, string] | null>(null)
const statusFilter = ref<number | "">("")

const getCourtInfo = (row: AdminReservationRecord) => {
  return formatVenueCourtInfo({
    venueId: row.venueId,
    courtId: row.courtId,
    venueName: row.venueName,
    venueNameMap: venueNameMap.value,
  })
}

const loadVenueNameMap = async () => {
  if (Object.keys(venueNameMap.value).length > 0) return
  const res = await getVenueListApi()
  const list = Array.isArray(res.data) ? res.data : []
  venueNameMap.value = Object.fromEntries(
    list.map((item) => [item.id, item.name] as const),
  )
}

const loadReservationList = async () => {
  const parsedUserId = parseOptionalNonNegativeInteger(userIdFilter.value)
  if (!parsedUserId.valid) {
    ElMessage.warning("用户ID请输入非负整数")
    return
  }

  loading.value = true
  try {
    const [reservationRes] = await Promise.all([
      getReservationPageAllAdminApi({
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        queryDTO: {
          userId: parsedUserId.value ?? undefined,
          startDate: dateRangeFilter.value?.[0] || undefined,
          endDate: dateRangeFilter.value?.[1] || undefined,
          status: statusFilter.value === "" ? undefined : statusFilter.value,
        },
      }),
      loadVenueNameMap(),
    ])
    const res = reservationRes
    reservationList.value = Array.isArray(res.data?.records) ? res.data.records : []
    total.value = Number(res.data?.total) || 0
  } finally {
    loading.value = false
  }
}

const handleQuery = async () => {
  pageNum.value = 1
  await loadReservationList()
}

const handleReset = async () => {
  userIdFilter.value = ""
  dateRangeFilter.value = null
  statusFilter.value = ""
  pageNum.value = 1
  await loadReservationList()
}

const handleCurrentPageChange = (value: number) => {
  if (value === pageNum.value) return
  pageNum.value = value
  loadReservationList()
}

onMounted(() => {
  const userIdQuery = route.query.userId
  if (typeof userIdQuery === "string") {
    userIdFilter.value = userIdQuery
  } else if (Array.isArray(userIdQuery) && typeof userIdQuery[0] === "string") {
    userIdFilter.value = userIdQuery[0]
  }
  loadReservationList()
})
</script>

<template>
  <PageContentShell class="reservation-page">
    <template #header>
      <PageRouteTitle fallback-title="预定管理" />
      <PageFilterBar :query-loading="loading" @query="handleQuery" @reset="handleReset">
        <el-input
          v-model="userIdFilter"
          clearable
          placeholder="用户ID"
          class="reservation-page__filter-item"
        />
        <el-date-picker
          v-model="dateRangeFilter"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
          class="reservation-page__filter-item reservation-page__filter-item--range"
        />
        <el-select
          v-model="statusFilter"
          clearable
          placeholder="预约状态"
          class="reservation-page__filter-item"
        >
          <el-option
            v-for="item in RESERVATION_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </PageFilterBar>
    </template>

    <el-card shadow="never" class="reservation-page__table-card">
      <div class="reservation-page__table-wrap">
        <el-table
          v-loading="loading"
          :data="reservationList"
          stripe
          height="100%"
          empty-text="暂无预约数据"
        >
          <el-table-column prop="id" label="预约ID" width="100" />
          <el-table-column prop="userId" label="用户ID" width="100" />
          <el-table-column label="场地信息" min-width="220">
            <template #default="{ row }">
              {{ getCourtInfo(row) }}
            </template>
          </el-table-column>
          <el-table-column prop="reservationDate" label="预约日期" width="120" />
          <el-table-column label="时段" min-width="150">
            <template #default="{ row }">
              {{ row.startTime }} - {{ row.endTime }}
            </template>
          </el-table-column>
          <el-table-column prop="durationMinutes" label="时长(分钟)" width="110" />
          <el-table-column label="金额" width="110">
            <template #default="{ row }">
              {{ formatCurrencyFromFen(row.totalPrice) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="96">
            <template #default="{ row }">
              <el-tag :type="getReservationStatusTagType(row.status)">
                {{ getReservationStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTimeText(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="更新时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTimeText(row.updateTime) }}
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.remark || "--" }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <template #footer>
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="handleCurrentPageChange"
      />
    </template>
  </PageContentShell>
</template>

<style scoped lang="scss">
.reservation-page {
  height: 100%;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reservation-page__table-card {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
}

.reservation-page__filter-item {
  width: 200px;
}

.reservation-page__filter-item--range {
  width: 260px;
}

:deep(.reservation-page__table-card .el-card__body) {
  height: 100%;
  min-height: 0;
  padding: 0;
}

.reservation-page__table-wrap {
  height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
}

:deep(.reservation-page__table-wrap .el-table__body-wrapper) {
  scrollbar-width: none;
}

:deep(.reservation-page__table-wrap .el-table__body-wrapper::-webkit-scrollbar) {
  width: 0;
  height: 0;
}

:deep(.reservation-page__table-wrap .el-scrollbar__bar.is-vertical) {
  display: none;
}
</style>
