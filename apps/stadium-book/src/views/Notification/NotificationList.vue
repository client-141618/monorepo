<script setup lang="ts">
import type { NotificationOverview, NotificationQueryPayload } from "@/api/notification/type"
import type { NotificationType } from "@/constants/notification"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import {
  deleteNotificationApi,
  getNotificationPageApi,
  publishNotificationApi,
} from "@/api/notification"
import PageContentShell from "@/components/PageContentShell/index.vue"
import {
  getNotificationTypeLabel,
  NOTIFICATION_TYPE_OPTIONS,
} from "@/constants/notification"
import { VenueRoute } from "@/router/routes/RouteNameEnum"
import { formatDateTimeText } from "@/utils/format"

const router = useRouter()
const loading = ref(false)
const list = ref<NotificationOverview[]>([])
const hasLoadedOnce = ref(false)
const querying = ref(false)
const hasQueried = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const creatorUserIdFilter = ref("")
const targetUserIdFilter = ref("")
const typeFilter = ref<NotificationType | "">("")
const currentQuery = ref<NotificationQueryPayload | undefined>(undefined)

const hasData = computed(() => list.value.length > 0)
const emptyDescription = computed(() => {
  if (hasQueried.value) return "暂无符合筛选条件的通知"
  return "暂无通知消息"
})

const loadList = async () => {
  pageNum.value = 1
  currentQuery.value = undefined
  hasQueried.value = false
  await fetchPage()
}

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await getNotificationPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      queryDTO: currentQuery.value,
    })
    const rawList = Array.isArray(res.data?.records) ? res.data.records : []
    list.value = rawList.map((item) => ({
      ...item,
      targetUserIds: normalizeTargetUserIds(item),
    }))
    total.value = Number(res.data?.total) || 0
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const goCreate = () => {
  router.push({ name: VenueRoute.NotificationCreate })
}

const goDetail = (id: number) => {
  router.push({ name: VenueRoute.NotificationDetail, params: { id } })
}

const goEdit = (id: number) => {
  router.push({ name: VenueRoute.NotificationEdit, params: { id } })
}

const handlePublish = async (id: number) => {
  await publishNotificationApi(id)
  ElMessage.success("发布成功")
  await loadList()
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除该通知？此操作不可恢复。", "提示", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button--danger",
    })
  } catch (_error) {
    return
  }

  await deleteNotificationApi(id)
  ElMessage.success("删除成功")
  await loadList()
}

const normalizeTargetUserIds = (item: NotificationOverview): number[] => {
  const rawTargetUserIds: unknown = (item as { targetUserIds?: unknown }).targetUserIds

  if (Array.isArray(rawTargetUserIds)) {
    return rawTargetUserIds
      .map((value: unknown) => Number(value))
      .filter((value: number) => Number.isInteger(value) && value > 0)
  }

  if (typeof rawTargetUserIds === "string") {
    return rawTargetUserIds
      .split(/[,\s，]+/)
      .map((value: string) => Number(value.trim()))
      .filter((value: number) => Number.isInteger(value) && value > 0)
  }

  if (rawTargetUserIds && typeof rawTargetUserIds === "object") {
    return Object.values(rawTargetUserIds as Record<string, unknown>)
      .map((value: unknown) => Number(value))
      .filter((value: number) => Number.isInteger(value) && value > 0)
  }

  return []
}

const formatTargetUser = (item: NotificationOverview) => {
  const targetUserIds = item.targetUserIds
  if (targetUserIds.length > 0) {
    return `ID ${targetUserIds.join("，")}`
  }
  return "全体用户"
}

const formatCreator = (item: NotificationOverview) => {
  if (item.creatorName?.trim()) return item.creatorName
  if (item.creatorUserId !== null && item.creatorUserId !== undefined) {
    return `ID ${item.creatorUserId}`
  }
  return "--"
}

const resetFilters = () => {
  creatorUserIdFilter.value = ""
  targetUserIdFilter.value = ""
  typeFilter.value = ""
}

const parseNullableInt = (value: string, fieldLabel: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const numberValue = Number(trimmed)
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    ElMessage.warning(`${fieldLabel}请输入非负整数`)
    return undefined
  }

  return numberValue
}

const handleQuery = async () => {
  const adminId = parseNullableInt(creatorUserIdFilter.value, "创建者ID")
  if (adminId === undefined) return

  const userId = parseNullableInt(targetUserIdFilter.value, "目标用户ID")
  if (userId === undefined) return

  querying.value = true
  try {
    currentQuery.value = {
      adminId,
      userId,
      type: typeFilter.value === "" ? null : typeFilter.value,
    }
    pageNum.value = 1
    await fetchPage()
    hasQueried.value = true
  } finally {
    querying.value = false
  }
}

const handleReset = async () => {
  resetFilters()
  await loadList()
}

const handleCurrentPageChange = (value: number) => {
  if (value === pageNum.value) return
  pageNum.value = value
  fetchPage()
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <PageContentShell class="notification-list-page" :body-scroll="true">
    <template #header>
      <div class="notification-list-page__header">
        <div class="notification-list-page__title">通知消息</div>
        <div class="notification-list-page__actions">
          <el-button :loading="loading" @click="fetchPage">刷新</el-button>
          <el-button type="primary" @click="goCreate">新建通知</el-button>
        </div>
      </div>

      <div class="notification-list-page__filters">
        <el-input
          v-model="creatorUserIdFilter"
          clearable
          placeholder="创建者ID"
          class="notification-list-page__filter-input"
        />
        <el-input
          v-model="targetUserIdFilter"
          clearable
          placeholder="目标用户ID"
          class="notification-list-page__filter-input"
        />
        <el-select
          v-model="typeFilter"
          clearable
          placeholder="通知类型"
          class="notification-list-page__filter-select"
        >
          <el-option
            v-for="item in NOTIFICATION_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="notification-list-page__filter-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" :loading="querying" @click="handleQuery">查询</el-button>
        </div>
      </div>
    </template>

    <div
      v-if="hasData"
      class="notification-list-page__list"
      v-loading="loading"
    >
      <div
        v-for="item in list"
        :key="item.id"
        class="notification-card"
        @click="goDetail(item.id)"
      >
        <div class="notification-card__top">
          <div class="notification-card__type">{{ getNotificationTypeLabel(item.type) }}</div>
          <div class="notification-card__meta">
            <el-tag size="small" :type="item.publishStatus === 1 ? 'success' : 'info'">
              {{ item.publishStatus === 1 ? "已发布" : "草稿" }}
            </el-tag>
            <span class="notification-card__time">
              {{ formatDateTimeText(item.publishTime || item.createTime) }}
            </span>
          </div>
        </div>
        <div class="notification-card__body">
          <div class="notification-card__title">{{ item.title }}</div>
          <div class="notification-card__summary">{{ item.summary }}</div>
          <div class="notification-card__extra">
            <div class="notification-card__extra-item">
              <span class="notification-card__extra-label">创建者</span>
              <span class="notification-card__extra-value">{{ formatCreator(item) }}</span>
            </div>
            <div class="notification-card__extra-item">
              <span class="notification-card__extra-label">目标用户</span>
              <span class="notification-card__extra-value">{{ formatTargetUser(item) }}</span>
            </div>
          </div>
          <div class="notification-card__footer">
            <span>已读人数：{{ item.readCount }}</span>
            <div class="notification-card__buttons">
              <el-button link type="primary" @click.stop="goEdit(item.id)">编辑</el-button>
              <el-button
                v-if="item.publishStatus === 0"
                link
                type="success"
                @click.stop="handlePublish(item.id)"
              >
                发布
              </el-button>
              <el-button link type="danger" @click.stop="handleDelete(item.id)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="loading || !hasLoadedOnce"
      class="notification-list-page__loading"
      v-loading="true"
    />
    <el-empty v-else :description="emptyDescription" />
    <template #footer>
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="total, pager"
        background
        @current-change="handleCurrentPageChange"
      />
    </template>
  </PageContentShell>
</template>

<style scoped lang="scss">
.notification-list-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.notification-list-page__title {
  font-size: 18px;
  font-weight: 600;
}

.notification-list-page__actions {
  display: flex;
  gap: 8px;
}

.notification-list-page__filters {
  margin-bottom: 14px;
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(180px, 260px) minmax(180px, 240px) 1fr;
  gap: 10px;
  align-items: center;
}

.notification-list-page__filter-input,
.notification-list-page__filter-select {
  width: 100%;
}

.notification-list-page__filter-actions {
  justify-self: end;
  display: flex;
  gap: 8px;
}

.notification-list-page__list {
  display: grid;
  gap: 12px;
}

.notification-list-page__loading {
  min-height: 240px;
}

.notification-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.notification-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 10px rgba(64, 158, 255, 0.16);
}

.notification-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.notification-card__type {
  color: #409eff;
  font-size: 14px;
  font-weight: 600;
}

.notification-card__meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.notification-card__time {
  color: #909399;
  font-size: 12px;
}

.notification-card__title {
  margin-top: 8px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.notification-card__body {
  padding-left: 2em;
}

.notification-card__summary {
  margin-top: 8px;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  text-overflow: ellipsis;
}

.notification-card__extra {
  margin-top: 12px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.notification-card__extra-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.notification-card__extra-label {
  color: #94a3b8;
  font-size: 12px;
  flex: none;
}

.notification-card__extra-value {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-card__footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.notification-card__buttons {
  display: flex;
  gap: 8px;
}

@media (max-width: 1100px) {
  .notification-list-page__filters {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }

  .notification-list-page__filter-actions {
    justify-self: start;
  }
}
</style>
