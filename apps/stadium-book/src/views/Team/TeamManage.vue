<script setup lang="ts">
import type { TeamRecord } from "@/api/team/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { cancelTeamApi, getTeamPageApi } from "@/api/team"
import PageContentShell from "@/components/PageContentShell/index.vue"
import PageFilterBar from "@/components/PageFilterBar/index.vue"
import PageRouteTitle from "@/components/PageRouteTitle/index.vue"
import {
  getTeamStatusLabel,
  getTeamStatusTagType,
  TEAM_STATUS_OPTIONS,
} from "@/constants/team"
import { formatDateTimeText } from "@/utils/format"

const tableLoading = ref(false)
const skeletonLoading = ref(true)
const actionLoadingId = ref<number | null>(null)
const teamList = ref<TeamRecord[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const activityDateFilter = ref("")
const statusFilter = ref<number | "">("")

const getCourtDisplay = (row: TeamRecord) => {
  const courtId = Number(row.courtId)
  if (!Number.isFinite(courtId) || courtId <= 0) return "--"
  return `${courtId}号场`
}

const getVenueCourtDisplay = (row: TeamRecord) => {
  const venueName = row.venueName || "--"
  const courtText = getCourtDisplay(row)
  if (courtText === "--") return venueName
  return `${venueName} ${courtText}`
}

const getProgressDisplay = (row: TeamRecord) => {
  const current = Number(row.currentCount) || 0
  const required = Number(row.requiredCount) || 0
  if (required <= 0) return `${current}/--`
  return `${current}/${required}`
}

const getMemberUserIdsDisplay = (row: TeamRecord) => {
  const members = Array.isArray(row.members) ? row.members : []
  const ids = members
    .map((member) => Number(member.wxUserId))
    .filter((id) => Number.isFinite(id) && id > 0)
    .map((id) => String(id))
  if (!ids.length) return "--"
  return ids.join("，")
}

const getTeamList = async () => {
  tableLoading.value = true
  try {
    const res = await getTeamPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      queryDTO: {
        activityDate: activityDateFilter.value || undefined,
        status: statusFilter.value === "" ? undefined : statusFilter.value,
      },
    })
    teamList.value = Array.isArray(res.data?.records) ? res.data.records : []
    total.value = Number(res.data?.total) || 0
  } finally {
    tableLoading.value = false
    if (skeletonLoading.value) {
      skeletonLoading.value = false
    }
  }
}

const handleQuery = async () => {
  pageNum.value = 1
  await getTeamList()
}

const handleReset = async () => {
  activityDateFilter.value = ""
  statusFilter.value = ""
  pageNum.value = 1
  await getTeamList()
}

const handleCurrentPageChange = (value: number) => {
  if (value === pageNum.value) return
  pageNum.value = value
  getTeamList()
}

const handleCancelTeam = async (row: TeamRecord) => {
  if (!row.id || actionLoadingId.value !== null) return

  try {
    await ElMessageBox.confirm(
      `确认取消组队「${row.title || "未命名组队"}」(ID: ${row.id})？`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "确认取消",
        cancelButtonText: "返回",
      },
    )
  } catch (_error) {
    return
  }

  actionLoadingId.value = row.id
  try {
    await cancelTeamApi(row.id, { reason: "管理员取消组队" })
    ElMessage.success("取消组队成功")
    await getTeamList()
  } finally {
    actionLoadingId.value = null
  }
}

onMounted(() => {
  getTeamList()
})
</script>

<template>
  <PageContentShell class="team-page">
    <template #header>
      <PageRouteTitle fallback-title="组队管理" />
      <PageFilterBar :query-loading="tableLoading" @query="handleQuery" @reset="handleReset">
        <el-date-picker
          v-model="activityDateFilter"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="活动日期"
          clearable
          class="team-page__filter-item"
        />
        <el-select
          v-model="statusFilter"
          clearable
          placeholder="组队状态"
          class="team-page__filter-item"
        >
          <el-option
            v-for="item in TEAM_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </PageFilterBar>
    </template>

    <el-card class="team-page__table-card" shadow="never">
      <el-skeleton :loading="skeletonLoading" animated>
        <template #template>
          <div class="team-page__skeleton">
            <el-skeleton-item variant="h3" style="width: 45%" />
            <el-skeleton-item variant="text" style="width: 100%" />
            <el-skeleton-item variant="text" style="width: 100%" />
            <el-skeleton-item variant="text" style="width: 100%" />
            <el-skeleton-item variant="text" style="width: 100%" />
            <el-skeleton-item variant="text" style="width: 100%" />
          </div>
        </template>
        <div class="team-page__table-wrap">
          <el-table v-loading="tableLoading" :data="teamList" stripe height="100%">
            <el-table-column prop="id" label="组队ID" width="96" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column label="场馆/场地" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getVenueCourtDisplay(row) }}
              </template>
            </el-table-column>
            <el-table-column prop="activityDate" label="活动日期" width="120" />
            <el-table-column label="截止时间" min-width="170">
              <template #default="{ row }">
                {{ formatDateTimeText(row.deadlineTime) }}
              </template>
            </el-table-column>
            <el-table-column label="人数进度" width="100">
              <template #default="{ row }">
                {{ getProgressDisplay(row) }}
              </template>
            </el-table-column>
            <el-table-column prop="initiatorName" label="发起人" width="110" />
            <el-table-column label="队伍成员ID" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getMemberUserIdsDisplay(row) }}
              </template>
            </el-table-column>
            <el-table-column prop="contactMasked" label="联系方式" min-width="110" />
            <el-table-column label="状态" width="96">
              <template #default="{ row }">
                <el-tag :type="getTeamStatusTagType(row.status)">
                  {{ getTeamStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" min-width="170">
              <template #default="{ row }">
                {{ formatDateTimeText(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  link
                  :disabled="actionLoadingId !== null || row.status === 5"
                  :loading="actionLoadingId === row.id"
                  @click="handleCancelTeam(row)"
                >
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-skeleton>
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
.team-page {
  height: 100%;
  min-height: 0;
}

.team-page__filter-item {
  width: 200px;
}

.team-page__table-card {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
}

:deep(.team-page__table-card .el-card__body) {
  height: 100%;
  min-height: 0;
  padding: 0;
}

.team-page__table-wrap {
  height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
}

.team-page__skeleton {
  padding: 16px;
  display: grid;
  row-gap: 14px;
}
</style>
