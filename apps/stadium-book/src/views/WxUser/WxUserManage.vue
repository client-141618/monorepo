<script setup lang="ts">
import type { WxUser } from "@/api/wx-user/type"
import type { WxUserStatus } from "@/constants/wx-user"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { getWxUserPageApi, updateWxUserStatusApi } from "@/api/wx-user"
import PageContentShell from "@/components/PageContentShell/index.vue"
import PageFilterBar from "@/components/PageFilterBar/index.vue"
import PageRouteTitle from "@/components/PageRouteTitle/index.vue"
import { WX_USER_STATUS_OPTIONS } from "@/constants/wx-user"
import { ReservationRoute } from "@/router/routes/RouteNameEnum"
import { formatDateTimeText } from "@/utils/format"
import { parseOptionalNonNegativeInteger } from "@/utils/query"

const router = useRouter()
const tableLoading = ref(false)
const actionLoadingId = ref<number | null>(null)
const wxUserList = ref<WxUser[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const userIdFilter = ref("")
const statusFilter = ref<WxUserStatus | "">("")

const statusLabelMap = computed(() =>
  Object.fromEntries(
    WX_USER_STATUS_OPTIONS.map((item) => [item.value, item.label] as const),
  ) as Record<WxUserStatus, string>,
)

const statusTypeMap = computed(() =>
  Object.fromEntries(
    WX_USER_STATUS_OPTIONS.map((item) => [item.value, item.type] as const),
  ) as Record<WxUserStatus, "" | "success" | "warning" | "info" | "danger">,
)

const statusChangeOptions = computed(() =>
  WX_USER_STATUS_OPTIONS.filter((item) => item.value !== 4),
)

const getStatusActionLabel = (currentStatus: number, nextStatus: Exclude<WxUserStatus, 4>) => {
  if (nextStatus === 1) {
    return currentStatus === 2 ? "解除限制" : "启用"
  }
  if (nextStatus === 2) return "限制预约"
  return "停用"
}

const getStatusActions = (status: number) => {
  return statusChangeOptions.value
    .filter((item) => item.value !== status)
    .map((item) => ({
      value: item.value,
      label: getStatusActionLabel(status, item.value as Exclude<WxUserStatus, 4>),
    }))
}

const getStatusLabel = (status: number) => {
  return statusLabelMap.value[status as WxUserStatus] ?? "未知"
}

const getStatusType = (status: number) => {
  return statusTypeMap.value[status as WxUserStatus] ?? "info"
}

const maskSessionKey = (value: string | null) => {
  if (!value) return "--"
  if (value.length <= 10) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const getDisplayUsername = (row: WxUser) => {
  return row.username || "--"
}

const getDisplayAvatar = (row: WxUser) => {
  return row.avatar || ""
}

const handleGoReservationByUserId = (id: number) => {
  router.push({
    name: ReservationRoute.ReservationManage,
    query: { userId: String(id) },
  })
}

const getWxUserList = async () => {
  const parsedUserId = parseOptionalNonNegativeInteger(userIdFilter.value)
  if (!parsedUserId.valid) {
    ElMessage.warning("用户ID请输入非负整数")
    return
  }

  try {
    tableLoading.value = true
    const res = await getWxUserPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      queryDTO: {
        userId: parsedUserId.value ?? undefined,
        status: statusFilter.value === "" ? undefined : statusFilter.value,
      },
    })
    wxUserList.value = Array.isArray(res.data?.records) ? res.data.records : []
    total.value = Number(res.data?.total) || 0
  } finally {
    tableLoading.value = false
  }
}

const handleQuery = async () => {
  pageNum.value = 1
  await getWxUserList()
}

const handleReset = async () => {
  userIdFilter.value = ""
  statusFilter.value = ""
  pageNum.value = 1
  await getWxUserList()
}

const handleCurrentPageChange = (value: number) => {
  if (value === pageNum.value) return
  pageNum.value = value
  getWxUserList()
}

const handleChangeStatus = async (row: WxUser, status: WxUserStatus) => {
  if (row.status === status) return

  const nextStatusLabel = statusLabelMap.value[status]
  try {
    await ElMessageBox.confirm(
      `确认将用户（ID: ${row.id}）状态修改为「${nextStatusLabel}」？`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "确认",
        cancelButtonText: "取消",
      },
    )
  } catch (_error) {
    return
  }

  actionLoadingId.value = row.id
  try {
    await updateWxUserStatusApi({
      id: row.id,
      status,
    })
    ElMessage.success("状态更新成功")
    await getWxUserList()
  } finally {
    actionLoadingId.value = null
  }
}

onMounted(() => {
  getWxUserList()
})
</script>

<template>
  <PageContentShell class="wx-user-page">
    <template #header>
      <PageRouteTitle fallback-title="用户管理" />
      <PageFilterBar :query-loading="tableLoading" @query="handleQuery" @reset="handleReset">
        <el-input
          v-model="userIdFilter"
          clearable
          placeholder="用户ID"
          class="wx-user-page__filter-item"
        />
        <el-select
          v-model="statusFilter"
          clearable
          placeholder="用户状态"
          class="wx-user-page__filter-item"
        >
          <el-option
            v-for="item in WX_USER_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </PageFilterBar>
    </template>

    <el-card class="wx-user-page__table-card" shadow="never">
      <div class="wx-user-page__table-wrap">
        <el-table v-loading="tableLoading" :data="wxUserList" stripe height="100%">
          <el-table-column label="ID" width="90">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                class="wx-user-page__id-link"
                @click="handleGoReservationByUserId(row.id)"
              >
                {{ row.id }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="用户信息" min-width="200">
            <template #default="{ row }">
              <div class="wx-user-page__user">
                <el-avatar :size="34" :src="getDisplayAvatar(row)">
                  {{ getDisplayUsername(row).slice(0, 1) }}
                </el-avatar>
                <span class="wx-user-page__user-name">{{ getDisplayUsername(row) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="appid" label="AppID" min-width="160" show-overflow-tooltip />
          <el-table-column prop="openid" label="OpenID" min-width="220" show-overflow-tooltip />
          <el-table-column label="SessionKey" min-width="150">
            <template #default="{ row }">
              {{ maskSessionKey(row.sessionKey) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
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
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <div class="wx-user-page__operation">
                <el-button
                  v-for="action in getStatusActions(row.status)"
                  :key="action.value"
                  link
                  type="primary"
                  :disabled="actionLoadingId === row.id"
                  @click="handleChangeStatus(row, action.value)"
                >
                  {{ action.label }}
                </el-button>
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
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="handleCurrentPageChange"
      />
    </template>
  </PageContentShell>
</template>

<style scoped lang="scss">
.wx-user-page__table-card {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
}

.wx-user-page__filter-item {
  width: 200px;
}

.wx-user-page__operation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wx-user-page__id-link {
  min-height: 20px;
  padding: 0;
}

.wx-user-page__user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.wx-user-page__user-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.wx-user-page__table-card .el-card__body) {
  height: 100%;
  min-height: 0;
  padding: 0;
}

.wx-user-page__table-wrap {
  height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
}

:deep(.wx-user-page__operation .el-button.is-link) {
  height: 20px;
  line-height: 20px;
  padding: 0;
}
</style>
