<script setup lang="ts">
import type { AdminReservationRecord } from "@/api/reservation/type"
import { Refresh } from "@element-plus/icons-vue"
import { onMounted, ref } from "vue"
import { getReservationListAllAdminApi } from "@/api/reservation"
import { getVenueListApi } from "@/api/venue"
import {
  getReservationStatusLabel,
  getReservationStatusTagType,
} from "@/constants/reservation"
import { formatCurrencyFromFen, formatDateTimeText } from "@/utils/format"
import { formatVenueCourtInfo } from "@/utils/venue"

const loading = ref(false)
const reservationList = ref<AdminReservationRecord[]>([])
const venueNameMap = ref<Record<number, string>>({})

const getCourtInfo = (row: AdminReservationRecord) => {
  return formatVenueCourtInfo({
    venueId: row.venueId,
    courtId: row.courtId,
    venueName: row.venueName,
    venueNameMap: venueNameMap.value,
  })
}

const loadVenueNameMap = async () => {
  const res = await getVenueListApi()
  const list = Array.isArray(res.data) ? res.data : []
  venueNameMap.value = Object.fromEntries(
    list.map((item) => [item.id, item.name] as const),
  )
}

const loadReservationList = async () => {
  loading.value = true
  try {
    const [reservationRes] = await Promise.all([
      getReservationListAllAdminApi(),
      loadVenueNameMap(),
    ])
    const res = reservationRes
    reservationList.value = Array.isArray(res.data) ? res.data : []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReservationList()
})
</script>

<template>
  <div class="reservation-page">
    <div class="reservation-page__hero">
      <div class="reservation-page__title-block">
        <div class="reservation-page__title">预定管理</div>
        <div class="reservation-page__subtitle">展示所有用户预约记录，支持管理员快速巡检</div>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadReservationList">刷新</el-button>
    </div>

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
  </div>
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

.reservation-page__hero {
  margin-bottom: 14px;
  padding: 14px 16px;
  border: 1px solid #e6f4ff;
  border-radius: 12px;
  background: linear-gradient(120deg, #f7fbff 0%, #f3fff8 100%);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.reservation-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reservation-page__title {
  color: #1d2129;
  font-size: 20px;
  font-weight: 600;
}

.reservation-page__subtitle {
  color: #4e5969;
  font-size: 13px;
}

.reservation-page__table-card {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
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

@media (max-width: 900px) {
  .reservation-page__hero {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
