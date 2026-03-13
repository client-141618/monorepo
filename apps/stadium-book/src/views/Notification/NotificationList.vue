<script setup lang="ts">
import type { NotificationOverview } from "@/api/notification/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import {
  deleteNotificationApi,
  getNotificationListApi,
  publishNotificationApi,
} from "@/api/notification"
import { getNotificationTypeLabel } from "@/constants/notification"
import { VenueRoute } from "@/router/routes/RouteNameEnum"

const router = useRouter()
const loading = ref(false)
const list = ref<NotificationOverview[]>([])
const hasLoadedOnce = ref(false)

const hasData = computed(() => list.value.length > 0)

const loadList = async () => {
  loading.value = true
  try {
    const res = await getNotificationListApi()
    list.value = res.data ?? []
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

const formatTime = (time?: string | null) => {
  if (!time) return "--"
  return time.replace("T", " ")
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="notification-list-page">
    <div class="notification-list-page__header">
      <div class="notification-list-page__title">通知消息</div>
      <div class="notification-list-page__actions">
        <el-button :loading="loading" @click="loadList">刷新</el-button>
        <el-button type="primary" @click="goCreate">新建通知</el-button>
      </div>
    </div>

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
            <span class="notification-card__time">{{ formatTime(item.publishTime || item.createTime) }}</span>
          </div>
        </div>
        <div class="notification-card__title">{{ item.title }}</div>
        <div class="notification-card__summary">{{ item.summary }}</div>
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

    <div
      v-else-if="loading || !hasLoadedOnce"
      class="notification-list-page__loading"
      v-loading="true"
    />
    <el-empty v-else description="暂无通知消息" />
  </div>
</template>

<style scoped lang="scss">
.notification-list-page {
  padding: 16px;
}

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
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
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
</style>
