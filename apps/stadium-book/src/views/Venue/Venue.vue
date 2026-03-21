<script setup lang="ts">
import type { TableInstance } from "element-plus"
import type { VenueCheckInQrData } from "@/api/reservation/type"
import type { Venue } from "@/api/venue/type"
import { Refresh } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref } from 'vue'
import { getVenueCheckInQrAdminApi } from "@/api/reservation"
import {
  batchDeleteVenueApi,
  batchDisableVenueApi,
  batchEnableVenueApi,
  deleteVenueApi,
  getVenuePageApi,
  updateVenueStatusApi,
} from "@/api/venue"
import PageContentShell from "@/components/PageContentShell/index.vue"
import { formatYuanFromFen } from "@/utils/format"
import AddVenue from "./AddVenue.vue"

const venueList = ref<Venue[]>([])
const tableLoading = ref(false)
const hasLoadedOnce = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
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
const checkInQrDialogVisible = ref(false)
const checkInQrLoading = ref(false)
const checkInQrGenerating = ref(false)
const checkInQrRow = ref<Venue | null>(null)
const selectedCourtId = ref<number | null>(null)
const checkInQrData = ref<VenueCheckInQrData | null>(null)

const hasData = computed(() => venueList.value.length > 0)
const hasSelectedVenue = computed(() => selectedVenueIds.value.length > 0)
const selectedVenueCourtOptions = computed(() => {
  const total = Number(checkInQrRow.value?.total)
  if (!Number.isFinite(total) || total <= 0) return []
  return Array.from({ length: total }, (_, index) => index + 1)
})
const checkInQrImageSrc = computed(() => {
  if (!checkInQrData.value?.qrImageBase64) return ""
  return `data:image/png;base64,${checkInQrData.value.qrImageBase64}`
})
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const DEFAULT_VENUE_IMAGE = "/default.jpg"

const getVenueImageSrc = (image?: string) => {
  const src = image?.trim()
  return src ?? DEFAULT_VENUE_IMAGE
}

const formatVenueType = (row: Venue) => {
  if (row.typeName) return row.typeName
  return row.typeId ? `类型ID: ${row.typeId}` : "--"
}

const formatPriceYuanPerHour = (value?: number | string | null) => {
  return formatYuanFromFen(value, { fallback: "" })
}

const formatLocationVerifyStatus = (row: Venue) => {
  return row.enableLocationVerify === 1 ? "已开启" : "未开启"
}

const formatLocationVerifyRadius = (row: Venue) => {
  const radius = Number(row.checkinRadiusM)
  if (row.enableLocationVerify !== 1 || !Number.isFinite(radius) || radius <= 0) {
    return "--"
  }

  return `${radius} 米`
}

const handleCreate = () => {
  venueDialogMode.value = "create"
  editingVenue.value = null
  createDialogVisible.value = true
}

const handleRefresh = async () => {
  pageNum.value = 1
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

const handleOpenCheckInQrDialog = (row: Venue) => {
  checkInQrRow.value = row
  const fallbackCourtId = Number.isFinite(Number(row.total)) && Number(row.total) > 0 ? 1 : null
  selectedCourtId.value = fallbackCourtId
  checkInQrData.value = null
  checkInQrDialogVisible.value = true
}

const handleCheckInQrDialogClosed = () => {
  checkInQrRow.value = null
  selectedCourtId.value = null
  checkInQrData.value = null
  checkInQrGenerating.value = false
}

const handleGenerateCheckInQr = async () => {
  const row = checkInQrRow.value
  const courtId = selectedCourtId.value
  if (!row) return
  if (!courtId) {
    ElMessage.warning("请先选择场地号")
    return
  }

  checkInQrGenerating.value = true
  try {
    const res = await getVenueCheckInQrAdminApi(row.id, courtId)
    checkInQrData.value = res.data
    ElMessage.success("签到码生成成功")
  } finally {
    checkInQrGenerating.value = false
  }
}

const handleCourtIdChange = () => {
  checkInQrData.value = null
}

const sanitizeFileName = (text: string) =>
  text.replace(/[\\/:*?"<>|]/g, "-").trim() || "venue"

const handleDownloadCheckInQr = () => {
  const row = checkInQrRow.value
  const courtId = selectedCourtId.value
  const imageSrc = checkInQrImageSrc.value
  if (!row || !courtId || !imageSrc) {
    ElMessage.warning("请先生成签到码")
    return
  }

  checkInQrLoading.value = true
  try {
    const link = document.createElement("a")
    link.href = imageSrc
    const venueName = sanitizeFileName(row.name || `venue-${row.id}`)
    link.download = `${venueName}-场地${courtId}-签到码.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    checkInQrLoading.value = false
  }
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
    const res = await getVenuePageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    const pageData = res.data
    venueList.value = Array.isArray(pageData?.records) ? pageData.records : []
    total.value = Number(pageData?.total) || 0
  } finally {
    tableLoading.value = false
    hasLoadedOnce.value = true
  }
}

const handleCurrentPageChange = (value: number) => {
  if (value === pageNum.value) return
  pageNum.value = value
  getVenueList()
}

onMounted(() => {
  getVenueList()
})
</script>

<template>
  <PageContentShell class="venue-page">
    <template #header>
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
    </template>

    <div v-if="hasData" class="venue-table-wrapper">
      <el-table
        ref="tableRef"
        v-loading="tableLoading"
        :data="venueList"
        style="width: 100%"
        height="100%"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="isBatchMode" type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="50" />
        <el-table-column label="图片" width="120" align="center">
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
            {{ formatVenueType(row) }}
          </template>
        </el-table-column>
        <el-table-column label="元/h" min-width="120">
          <template #default="{ row }">
            {{ formatPriceYuanPerHour(row.pricePerHour) }}
          </template>
        </el-table-column>

        <el-table-column label="位置校验" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.enableLocationVerify === 1 ? 'success' : 'info'">
              {{ formatLocationVerifyStatus(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="校验范围" min-width="120">
          <template #default="{ row }">
            {{ formatLocationVerifyRadius(row) }}
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
        <el-table-column prop="openTime" label="开放时间" min-width="160" />
        <el-table-column prop="closeTime" label="关闭时间" min-width="160" />
        <el-table-column prop="total" label="场地单元数" min-width="120" />
        <el-table-column label="最小预约单元" min-width="140">
          <template #default="{ row }">
            {{ row.slotMinutes }} 分钟
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="240">
          <template #default="{ row }">
            <el-button type="success" link @click="handleOpenCheckInQrDialog(row)">生成签到码</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div
      v-else-if="tableLoading || !hasLoadedOnce"
      class="venue-table-wrapper venue-table-wrapper--loading"
      v-loading="true"
    />
    <div v-else class="venue-table-wrapper venue-table-wrapper--empty">
      <el-empty description="暂无场馆信息" />
    </div>

    <AddVenue
      v-model:visible="createDialogVisible"
      :mode="venueDialogMode"
      :edit-data="editingVenue"
      @success="handleCreateSuccess"
    />

    <el-dialog
      v-model="checkInQrDialogVisible"
      width="520px"
      :close-on-click-modal="false"
      title="生成签到码"
      @closed="handleCheckInQrDialogClosed"
    >
      <div class="check-in-qr-dialog">
        <div class="check-in-qr-dialog__header">
          <div class="check-in-qr-dialog__title">
            {{ checkInQrRow?.name || "场馆" }}
          </div>
          <div class="check-in-qr-dialog__subtitle">选择场地后生成静态核销二维码，可直接下载打印</div>
        </div>

        <el-form label-width="76px">
          <el-form-item label="场地号">
            <el-select
              v-model="selectedCourtId"
              placeholder="请选择场地号"
              style="width: 100%"
              :disabled="checkInQrGenerating"
              @change="handleCourtIdChange"
            >
              <el-option
                v-for="courtId in selectedVenueCourtOptions"
                :key="courtId"
                :label="`场地 ${courtId}`"
                :value="courtId"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="check-in-qr-preview">
          <el-empty v-if="!checkInQrImageSrc" description="请选择场地号并生成签到码" :image-size="80" />
          <template v-else>
            <img :src="checkInQrImageSrc" class="check-in-qr-preview__image" alt="签到码" />
            <p class="check-in-qr-preview__meta">
              场地 {{ selectedCourtId }} · 核销码已就绪
            </p>
          </template>
        </div>
      </div>
      <template #footer>
        <div class="check-in-qr-dialog__footer">
          <el-button @click="checkInQrDialogVisible = false">关闭</el-button>
          <el-button type="primary" :loading="checkInQrGenerating" @click="handleGenerateCheckInQr">
            {{ checkInQrImageSrc ? "刷新签到码" : "生成签到码" }}
          </el-button>
          <el-button type="success" :loading="checkInQrLoading" :disabled="!checkInQrImageSrc" @click="handleDownloadCheckInQr">
            下载
          </el-button>
        </div>
      </template>
    </el-dialog>
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
.venue-page {
  min-height: 0;
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
  flex: 1;
  min-height: 0;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.venue-table-wrapper--loading {
  display: flex;
  min-height: 0;
}

.venue-table-wrapper--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.venue-table__image {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
}

.check-in-qr-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.check-in-qr-dialog__header {
  border-radius: 12px;
  background: linear-gradient(135deg, #ecfeff 0%, #dbeafe 100%);
  padding: 12px 14px;
}

.check-in-qr-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.check-in-qr-dialog__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #334155;
}

.check-in-qr-preview {
  min-height: 240px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 16px;
}

.check-in-qr-preview__image {
  width: 220px;
  height: 220px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
}

.check-in-qr-preview__meta {
  margin: 10px 0 0;
  color: #475569;
  font-size: 13px;
}

.check-in-qr-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
