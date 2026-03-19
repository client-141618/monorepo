<script setup lang="ts">
import type { WxUser } from "@/api/wx-user/type"
import type { WxUserStatus } from "@/constants/wx-user"
import { Refresh } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { getWxUserListApi, updateWxUserStatusApi } from "@/api/wx-user"
import { WX_USER_STATUS_OPTIONS } from "@/constants/wx-user"
import { formatDateTimeText } from "@/utils/format"

const tableLoading = ref(false)
const actionLoadingId = ref<number | null>(null)
const wxUserList = ref<WxUser[]>([])

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

const getWxUserList = async () => {
  try {
    tableLoading.value = true
    const res = await getWxUserListApi()
    wxUserList.value = Array.isArray(res.data) ? res.data : []
  } finally {
    tableLoading.value = false
  }
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
  <div class="wx-user-page">
    <div class="wx-user-page__hero">
      <div class="wx-user-page__title-block">
        <div class="wx-user-page__title">用户管理</div>
        <div class="wx-user-page__subtitle">微信来源用户只读展示，本系统仅可维护状态</div>
      </div>
      <div class="wx-user-page__actions">
        <el-button :icon="Refresh" @click="getWxUserList">刷新</el-button>
      </div>
    </div>

    <el-card class="wx-user-page__table-card" shadow="never">
      <el-table v-loading="tableLoading" :data="wxUserList" stripe>
        <el-table-column prop="id" label="ID" width="90" />
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
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.wx-user-page {
  padding: 16px;
}

.wx-user-page__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 14px;
  padding: 14px 16px;
  border: 1px solid #e6f4ff;
  border-radius: 12px;
  background: linear-gradient(120deg, #f7fbff 0%, #f3fff8 100%);
}

.wx-user-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wx-user-page__title {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
}

.wx-user-page__subtitle {
  font-size: 13px;
  color: #4e5969;
}

.wx-user-page__actions {
  display: flex;
  gap: 8px;
}

.wx-user-page__table-card {
  border-radius: 12px;
}

.wx-user-page__operation {
  display: flex;
  align-items: center;
  gap: 12px;
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

:deep(.wx-user-page__operation .el-button.is-link) {
  height: 20px;
  line-height: 20px;
  padding: 0;
}

@media (max-width: 900px) {
  .wx-user-page__hero {
    flex-direction: column;
    align-items: stretch;
  }

  .wx-user-page__actions {
    justify-content: flex-end;
  }
}
</style>
