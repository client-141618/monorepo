<script setup lang="ts">
import type { TableInstance } from "element-plus"
import type { Venue } from "@/api/venue/type"
import { Refresh } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref } from 'vue'
import {
  batchDeleteVenueApi,
  batchDisableVenueApi,
  batchEnableVenueApi,
  deleteVenueApi,
  getVenueListApi,
  updateVenueStatusApi,
} from "@/api/venue"
import { VENUE_TYPE_OPTIONS } from "@/constants/venue"
import AddVenue from "./AddVenue.vue"

const venueList = ref<Venue[]>([])
const tableLoading = ref(false)
const hasLoadedOnce = ref(false)
const createDialogVisible = ref(false)
const venueDialogMode = ref<"create" | "edit">("create")
const editingVenue = ref<Venue | null>(null)
const isBatchMode = ref(false)
const selectedVenueIds = ref<number[]>([])
const batchEnableLoading = ref(false)
const batchDisableLoading = ref(false)
const batchDeleteLoading = ref(false)
const statusLoadingIds = ref<number[]>([])
const statusOperateAt = ref<Record<number, number>>({})
const tableRef = ref<TableInstance>()

const hasData = computed(() => venueList.value.length > 0)
const hasSelectedVenue = computed(() => selectedVenueIds.value.length > 0)
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const DEFAULT_VENUE_IMAGE = "/default.jpg"

const getVenueImageSrc = (image?: string) => {
  const src = image?.trim()
  return src ?? DEFAULT_VENUE_IMAGE
}

const venueTypeLabelByValue = computed(() => {
  const map = new Map<number, string>()
  for (const opt of VENUE_TYPE_OPTIONS) map.set(opt.value, opt.label)
  return map
})

const formatVenueType = (value: unknown) => {
  const key = Number(value)
  return venueTypeLabelByValue.value.get(key) ?? String(value ?? "")
}

const formatPriceYuanPerHour = (value: unknown) => {
  const cents = Number(value)
  if (!Number.isFinite(cents)) return ""
  return (cents / 100).toFixed(2)
}

const formatTotalSeats = (row: Venue) => {
  const totalSeats = Number(row.totalSeats)
  if (Number.isFinite(totalSeats) && totalSeats > 0) {
    return totalSeats
  }

  return Number(row.total ?? 0) * Number(row.unitCapacity ?? 0)
}

const handleCreate = () => {
  venueDialogMode.value = "create"
  editingVenue.value = null
  createDialogVisible.value = true
}

const handleRefresh = async () => {
  await getVenueList()
}

const handleCreateSuccess = async () => {
  createDialogVisible.value = false
  await getVenueList()
}

const handleBatchSelect = () => {
  isBatchMode.value = !isBatchMode.value
  selectedVenueIds.value = []
  tableRef.value?.clearSelection()
}

const exitBatchMode = () => {
  isBatchMode.value = false
  selectedVenueIds.value = []
  tableRef.value?.clearSelection()
}

const handleSelectionChange = (rows: Venue[]) => {
  selectedVenueIds.value = rows.map((item) => item.id)
}

const runBatchActionWithLoading = async (
  setLoading: (_loading: boolean) => void,
  action: () => Promise<void>,
) => {
  if (!hasSelectedVenue.value) {
    ElMessage.warning("请先选择场馆")
    return false
  }

  setLoading(true)
  try {
    await Promise.all([action(), sleep(400)])
    exitBatchMode()
    return true
  } catch (_err) {
    return false
  } finally {
    setLoading(false)
  }
}

const handleBatchEnable = async () => {
  await runBatchActionWithLoading((loading) => {
    batchEnableLoading.value = loading
  }, async () => {
    await batchEnableVenueApi(selectedVenueIds.value)
    ElMessage.success("批量启用成功")
    await getVenueList()
  })
}

const handleBatchDisable = async () => {
  await runBatchActionWithLoading((loading) => {
    batchDisableLoading.value = loading
  }, async () => {
    await batchDisableVenueApi(selectedVenueIds.value)
    ElMessage.success("批量停用成功")
    await getVenueList()
  })
}

const handleBatchDelete = async () => {
  if (!hasSelectedVenue.value) {
    ElMessage.warning("请先选择场馆")
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认删除已选择的 ${selectedVenueIds.value.length} 个场馆？此操作不可恢复。`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    )
  } catch (_err) {
    return
  }

  await runBatchActionWithLoading((loading) => {
    batchDeleteLoading.value = loading
  }, async () => {
    await batchDeleteVenueApi(selectedVenueIds.value)
    ElMessage.success("批量删除成功")
    await getVenueList()
  })
}

const handleEdit = (row: Venue) => {
  venueDialogMode.value = "edit"
  editingVenue.value = { ...row }
  createDialogVisible.value = true
}

const handleDelete = async (row: Venue) => {
  try {
    await ElMessageBox.confirm(
      `确认删除场馆「${row.name}」？此操作不可恢复。`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    )
  } catch (_err) {
    return
  }

  await deleteVenueApi(row.id)
  ElMessage.success("删除成功")
  await getVenueList()
}

const isStatusLoading = (id: number) => statusLoadingIds.value.includes(id)
const STATUS_CLICK_INTERVAL = 800

const setVenueStatusById = (id: number, status: number) => {
  const target = venueList.value.find((venue) => venue.id === id)
  if (!target) return
  target.status = status
}

const handleBeforeStatusChange = async (row: Venue) => {
  if (isStatusLoading(row.id)) {
    ElMessage.warning("请勿操作过快")
    return false
  }

  const now = Date.now()
  const lastOperateAt = statusOperateAt.value[row.id] ?? 0
  if (now - lastOperateAt < STATUS_CLICK_INTERVAL) {
    ElMessage.warning("请勿操作过快")
    return false
  }

  const nextStatus = row.status === 1 ? 0 : 1
  statusOperateAt.value[row.id] = now
  statusLoadingIds.value = [...statusLoadingIds.value, row.id]
  try {
    await updateVenueStatusApi(row.id, nextStatus)
    setVenueStatusById(row.id, nextStatus)
    ElMessage.success(nextStatus === 1 ? "已启用" : "已停用")
    return true
  } catch (_err) {
    return false
  } finally {
    statusLoadingIds.value = statusLoadingIds.value.filter((id) => id !== row.id)
  }
}

const getVenueList = async () => {
  try {
    tableLoading.value = true
    const res = await getVenueListApi()
    venueList.value = res.data
  } finally {
    tableLoading.value = false
    hasLoadedOnce.value = true
  }
}

onMounted(() => {
  getVenueList()
})
</script>

<template>
  <div class="venue-page">
    <div class="venue-header">
      <div class="venue-header__title">场馆管理</div>
      <div class="venue-header__actions">
        <template v-if="!isBatchMode">
          <el-button
            :icon="Refresh"
            :loading="tableLoading"
            :disabled="tableLoading"
            @click="handleRefresh"
          >
            刷新
          </el-button>
          <el-button type="primary" @click="handleCreate">新增场馆</el-button>
          <el-button @click="handleBatchSelect">批量操作</el-button>
        </template>
        <template v-else>
          <el-button
            type="success"
            :loading="batchEnableLoading"
            :disabled="batchDisableLoading || batchDeleteLoading"
            @click="handleBatchEnable"
          >
            批量启用
          </el-button>
          <el-button
            type="warning"
            :loading="batchDisableLoading"
            :disabled="batchEnableLoading || batchDeleteLoading"
            @click="handleBatchDisable"
          >
            批量停用
          </el-button>
          <el-button
            type="danger"
            :loading="batchDeleteLoading"
            :disabled="batchEnableLoading || batchDisableLoading"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button
            :disabled="batchEnableLoading || batchDisableLoading || batchDeleteLoading"
            @click="exitBatchMode"
          >
            取消
          </el-button>
        </template>
      </div>
    </div>

    <div v-if="hasData" class="venue-table-wrapper">
      <el-table
        ref="tableRef"
        v-loading="tableLoading"
        :data="venueList"
        style="width: 100%"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="isBatchMode" type="selection" width="55" />
        <el-table-column label="图片" width="120">
          <template #default="{ row }">
            <el-image
              :src="getVenueImageSrc(row.image)"
              fit="cover"
              class="venue-table__image"
              :preview-src-list="[getVenueImageSrc(row.image)]"
            >
              <template #error>
                <img
                  :src="DEFAULT_VENUE_IMAGE"
                  alt="场馆默认图片"
                  class="venue-table__image"
                />
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column label="场馆类型" min-width="120">
          <template #default="{ row }">
            {{ formatVenueType(row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="元/h" min-width="120">
          <template #default="{ row }">
            {{ formatPriceYuanPerHour(row.pricePerHour) }}
          </template>
        </el-table-column>
        <el-table-column prop="openTime" label="开放时间" min-width="160" />
        <el-table-column prop="closeTime" label="关闭时间" min-width="160" />
        <el-table-column prop="total" label="场地单元数" min-width="120" />
        <el-table-column prop="unitCapacity" label="每场地人数" min-width="120" />
        <el-table-column label="总可约人数" min-width="120">
          <template #default="{ row }">
            {{ formatTotalSeats(row) }}
          </template>
        </el-table-column>
        <el-table-column label="最小预约单元" min-width="140">
          <template #default="{ row }">
            {{ row.slotMinutes }} 分钟
          </template>
        </el-table-column>

        <el-table-column label="是否开放" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              :active-value="1"
              :inactive-value="0"
              :loading="isStatusLoading(row.id)"
              :before-change="() => handleBeforeStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else-if="tableLoading || !hasLoadedOnce" class="venue-table-wrapper venue-table-wrapper--loading" v-loading="true" />
    <el-empty v-else description="暂无场馆信息" />

    <AddVenue
      v-model:visible="createDialogVisible"
      :mode="venueDialogMode"
      :edit-data="editingVenue"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<style scoped lang="scss">
.venue-page {
  padding: 16px;
}

.venue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  &__title {
    font-size: 18px;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.venue-table-wrapper {
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.venue-table-wrapper--loading {
  min-height: 240px;
}

.venue-table__image {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
}
</style>
