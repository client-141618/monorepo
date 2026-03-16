<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type {
  AdminReservationRecord,
  CreateReservationBlockPayload,
  ReservationBlockRecord,
} from "@/api/reservation/type"
import type { Venue } from "@/api/venue/type"
import { ArrowLeft } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  cancelReservationAdminApi,
  createReservationBlockAdminApi,
  disableReservationBlockAdminApi,
  getReservationBlockListByVenueAndDateAdminApi,
  getReservationListByVenueAndDateAdminApi,
} from "@/api/reservation"
import { getVenueByIdApi } from "@/api/venue"
import HomeVenueDetailBlockDialog from "./detail/HomeVenueDetailBlockDialog.vue"
import HomeVenueDetailBlockRules from "./detail/HomeVenueDetailBlockRules.vue"
import HomeVenueDetailBoard from "./detail/HomeVenueDetailBoard.vue"
import HomeVenueDetailInfoPanel from "./detail/HomeVenueDetailInfoPanel.vue"

interface DateOption {
  value: string
  label: string
}

interface SlotOption {
  key: string
  label: string
  startMinutes: number
  endMinutes: number
}

const ACTIVE_RESERVATION_STATUS = 1
const ACTIVE_BLOCK_STATUS = 1
const DEFAULT_VENUE_IMAGE = "/default.jpg"

const route = useRoute()
const router = useRouter()

const detailLoading = ref(false)
const availabilityLoading = ref(false)
const blockLoading = ref(false)
const hasLoadedOnce = ref(false)
const availabilityLoadFailed = ref(false)
const blockLoadFailed = ref(false)
const venueDetail = ref<Venue | null>(null)
const selectedDate = ref("")
const reservations = ref<AdminReservationRecord[]>([])
const blockList = ref<ReservationBlockRecord[]>([])
const reservationReqId = ref(0)
const blockReqId = ref(0)
const selectedReservationIds = ref<number[]>([])

const cancelDialogVisible = ref(false)
const cancelSubmitting = ref(false)
const cancelFormRef = ref<FormInstance>()
const cancelForm = reactive({ reason: "" })
const cancelFormRules: FormRules<typeof cancelForm> = {
  reason: [{ required: true, message: "请填写取消原因", trigger: "blur" }],
}

const multiCellDialogVisible = ref(false)
const multiCellOptions = ref<AdminReservationRecord[]>([])
const multiCellSelection = ref<number[]>([])

const blockDialogVisible = ref(false)
const blockSubmitting = ref(false)

const weekdayOptions = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 7, label: "周日" },
]

const venueId = computed(() => Number(route.params.id))
const venueImageSrc = computed(() => venueDetail.value?.image?.trim() || DEFAULT_VENUE_IMAGE)
const priceLabel = computed(() => `¥${(Number(venueDetail.value?.pricePerHour || 0) / 100).toFixed(2)}/小时`)
const venueTypeLabel = computed(() => venueDetail.value?.typeName || `类型ID: ${venueDetail.value?.typeId ?? "--"}`)
const openHours = computed(() => {
  const openTime = venueDetail.value?.openTime?.trim()
  const closeTime = venueDetail.value?.closeTime?.trim()
  if (!openTime || !closeTime) return "--"
  return `${openTime} - ${closeTime}`
})

const dateOptions = computed<DateOption[]>(() => {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const value = formatDate(date)
    if (i === 0) return { value, label: "今天" }
    if (i === 1) return { value, label: "明天" }
    return { value, label: `${date.getMonth() + 1}.${date.getDate()}` }
  })
})

const selectedDateLabel = computed(() => {
  return dateOptions.value.find((d) => d.value === selectedDate.value)?.label || selectedDate.value
})

const slotOptions = computed<SlotOption[]>(() => {
  const open = toMinutes(venueDetail.value?.openTime)
  const close = toMinutes(venueDetail.value?.closeTime)
  const step = Number(venueDetail.value?.slotMinutes || 0)
  if (open === null || close === null || close <= open || step <= 0) return []
  const list: SlotOption[] = []
  for (let start = open; start < close; start += step) {
    const end = Math.min(start + step, close)
    if (end <= start) continue
    const key = `${toTime(start)}-${toTime(end)}`
    list.push({ key, label: key, startMinutes: start, endMinutes: end })
  }
  return list
})

const courtOptions = computed<number[]>(() => {
  return Array.from({ length: Number(venueDetail.value?.total || 0) }, (_, i) => i + 1)
})

const activeReservations = computed(() => {
  return reservations.value.filter((r) => {
    return r.status === ACTIVE_RESERVATION_STATUS && r.reservationDate === selectedDate.value
  })
})

const reservationMapById = computed(() => {
  return new Map(activeReservations.value.map((r) => [r.id, r] as const))
})

const selectedCount = computed(() => {
  return selectedReservationIds.value.filter((id) => reservationMapById.value.has(id)).length
})

const cellMap = computed(() => {
  const map = new Map<string, AdminReservationRecord[]>()
  const courtSet = new Set(courtOptions.value)
  for (const r of activeReservations.value) {
    if (!courtSet.has(r.courtId)) continue
    const rs = toMinutes(r.startTime)
    const re = toMinutes(r.endTime)
    if (rs === null || re === null || re <= rs) continue
    for (const slot of slotOptions.value) {
      if (rs < slot.endMinutes && re > slot.startMinutes) {
        const key = `${r.courtId}@${slot.key}`
        map.set(key, [...(map.get(key) || []), r])
      }
    }
  }
  return map
})

const boardStats = computed(() => {
  const totalCells = slotOptions.value.length * courtOptions.value.length
  const blockedCells = blockedCellSet.value.size
  const occupiedCells = [...cellMap.value.keys()].filter((cellKey) => !blockedCellSet.value.has(cellKey)).length
  return {
    totalCells,
    blockedCells,
    occupiedCells,
    freeCells: Math.max(totalCells - occupiedCells - blockedCells, 0),
  }
})

const boardMessage = computed(() => {
  if (!venueDetail.value) return ""
  if (availabilityLoading.value) {
    return `正在加载 ${selectedDateLabel.value}（${selectedDate.value}）的预约占用...`
  }
  if (availabilityLoadFailed.value) return "预约数据加载失败，请刷新后重试"
  if (!selectedDate.value) return "请选择日期查看预约占用"
  return `正在展示 ${selectedDateLabel.value}（${selectedDate.value}）的预约占用`
})

const loadVenue = async () => {
  if (!Number.isFinite(venueId.value) || venueId.value <= 0) {
    venueDetail.value = null
    hasLoadedOnce.value = true
    return false
  }
  try {
    detailLoading.value = true
    const res = await getVenueByIdApi(venueId.value)
    venueDetail.value = res.data || null
    return Boolean(venueDetail.value)
  } catch {
    venueDetail.value = null
    return false
  } finally {
    detailLoading.value = false
    hasLoadedOnce.value = true
  }
}

const loadReservationsByDate = async (date: string) => {
  if (!date) return
  const reqId = ++reservationReqId.value
  try {
    availabilityLoading.value = true
    availabilityLoadFailed.value = false
    const res = await getReservationListByVenueAndDateAdminApi(venueId.value, date)
    if (reqId !== reservationReqId.value) return
    reservations.value = Array.isArray(res.data) ? res.data : []
  } catch {
    if (reqId !== reservationReqId.value) return
    reservations.value = []
    availabilityLoadFailed.value = true
  } finally {
    if (reqId === reservationReqId.value) availabilityLoading.value = false
  }
}

const loadBlocksByDate = async (date: string) => {
  if (!date) return
  const reqId = ++blockReqId.value
  try {
    blockLoading.value = true
    blockLoadFailed.value = false
    const res = await getReservationBlockListByVenueAndDateAdminApi(venueId.value, date)
    if (reqId !== blockReqId.value) return
    blockList.value = Array.isArray(res.data) ? res.data : []
  } catch {
    if (reqId !== blockReqId.value) return
    blockList.value = []
    blockLoadFailed.value = true
  } finally {
    if (reqId === blockReqId.value) blockLoading.value = false
  }
}

const refreshDateData = async () => {
  if (!selectedDate.value) return
  await Promise.all([loadReservationsByDate(selectedDate.value), loadBlocksByDate(selectedDate.value)])
}

const handleDateSelect = (dateValue: string) => {
  if (selectedDate.value === dateValue) return
  selectedDate.value = dateValue
  selectedReservationIds.value = []
}

const handleBack = () => router.push("/home")

const cellReservations = (courtId: number, slot: SlotOption) => {
  return cellMap.value.get(`${courtId}@${slot.key}`) || []
}

const blockedCellSet = computed(() => {
  const set = new Set<string>()
  const courtList = courtOptions.value
  for (const block of blockList.value) {
    if (block.status !== ACTIVE_BLOCK_STATUS) continue
    const blockStart = toMinutes(block.startTime)
    const blockEnd = toMinutes(block.endTime)
    if (blockStart === null || blockEnd === null || blockEnd <= blockStart) continue
    const targetCourts = block.courtId === null ? courtList : [block.courtId]
    for (const slot of slotOptions.value) {
      const overlap = blockStart < slot.endMinutes && blockEnd > slot.startMinutes
      if (!overlap) continue
      targetCourts.forEach((courtId) => set.add(`${courtId}@${slot.key}`))
    }
  }
  return set
})

const isCellBlocked = (courtId: number, slot: SlotOption) => {
  return blockedCellSet.value.has(`${courtId}@${slot.key}`)
}

const isCellOccupied = (courtId: number, slot: SlotOption) => {
  if (isCellBlocked(courtId, slot)) return false
  return cellReservations(courtId, slot).length > 0
}

const isCellSelected = (courtId: number, slot: SlotOption) => {
  if (isCellBlocked(courtId, slot)) return false
  return cellReservations(courtId, slot).some((r) => selectedReservationIds.value.includes(r.id))
}

const cellUserText = (courtId: number, slot: SlotOption) => {
  const users = [...new Set(cellReservations(courtId, slot).map((r) => r.userId))]
  if (!users.length) return ""
  const [first, ...rest] = users
  return rest.length ? `用户ID: ${first} +${rest.length}` : `用户ID: ${first}`
}

const toggleReservation = (reservationId: number) => {
  selectedReservationIds.value = selectedReservationIds.value.includes(reservationId)
    ? selectedReservationIds.value.filter((id) => id !== reservationId)
    : [...selectedReservationIds.value, reservationId]
}

const handleCellClick = (courtId: number, slot: SlotOption) => {
  if (isCellBlocked(courtId, slot)) return
  const list = cellReservations(courtId, slot)
  if (!list.length) return
  if (list.length === 1) {
    const target = list[0]
    if (!target) return
    toggleReservation(target.id)
    return
  }
  multiCellOptions.value = list
  multiCellSelection.value = list
    .map((r) => r.id)
    .filter((id) => selectedReservationIds.value.includes(id))
  multiCellDialogVisible.value = true
}

const confirmMultiCell = () => {
  const cellIds = new Set(multiCellOptions.value.map((r) => r.id))
  const next = new Set(selectedReservationIds.value.filter((id) => !cellIds.has(id)))
  multiCellSelection.value.forEach((id) => next.add(id))
  selectedReservationIds.value = [...next]
  multiCellDialogVisible.value = false
}

const openCancelDialog = () => {
  if (!selectedCount.value) return
  cancelForm.reason = ""
  cancelDialogVisible.value = true
}

const submitCancelReservations = async () => {
  if (!cancelFormRef.value) return
  const valid = await cancelFormRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    await ElMessageBox.confirm(
      `确认取消已选 ${selectedCount.value} 条预约？\n取消后将通知对应用户。`,
      "确认取消预约",
      { type: "warning", confirmButtonText: "确认取消", cancelButtonText: "返回" },
    )
  } catch {
    return
  }

  cancelSubmitting.value = true
  const targets = [...selectedReservationIds.value]
  const results = await Promise.allSettled(
    targets.map((id) => cancelReservationAdminApi(id, { reason: cancelForm.reason.trim() })),
  )
  cancelSubmitting.value = false

  const successCount = results.filter((r) => r.status === "fulfilled").length
  const failCount = results.length - successCount
  if (successCount) ElMessage.success(`已成功取消 ${successCount} 条预约`)
  if (failCount) ElMessage.error(`${failCount} 条预约取消失败`)

  cancelDialogVisible.value = false
  await refreshDateData()
  selectedReservationIds.value = selectedReservationIds.value.filter((id) => {
    return reservationMapById.value.has(id)
  })
}

const openBlockDialog = () => {
  blockDialogVisible.value = true
}

const submitCreateBlock = async (payload: CreateReservationBlockPayload) => {
  try {
    await ElMessageBox.confirm(
      "创建后可能自动取消冲突预约并通知对应用户，是否继续？",
      "确认设置不可用时段",
      {
        type: "warning",
        confirmButtonText: "确认创建",
        cancelButtonText: "返回修改",
      },
    )
  } catch {
    return
  }

  blockSubmitting.value = true
  try {
    await createReservationBlockAdminApi(payload)
    ElMessage.success("不可用时段创建成功")
    blockDialogVisible.value = false
    await refreshDateData()
  } finally {
    blockSubmitting.value = false
  }
}

const blockScopeLabel = (row: ReservationBlockRecord) => {
  return row.courtId === null ? "整馆" : `场地 ${row.courtId}`
}

const blockModeLabel = (row: ReservationBlockRecord) => {
  if (row.blockType === 1) return "单日"
  return `按周（${weekdayOptions.find((i) => i.value === row.weekday)?.label || "未知"}）`
}

const blockActive = (row: ReservationBlockRecord) => row.status === ACTIVE_BLOCK_STATUS
const blockStatusLabel = (row: ReservationBlockRecord) => {
  return blockActive(row) ? "生效中" : "已停用"
}

const disableBlock = async (row: ReservationBlockRecord) => {
  if (!blockActive(row)) return
  try {
    await ElMessageBox.confirm(`确认停用规则 #${row.id}？`, "确认停用", {
      type: "warning",
      confirmButtonText: "确认停用",
      cancelButtonText: "取消",
    })
  } catch {
    return
  }
  await disableReservationBlockAdminApi(row.id)
  ElMessage.success("规则已停用")
  await refreshDateData()
}

watch(
  () => reservations.value,
  () => {
    selectedReservationIds.value = selectedReservationIds.value.filter((id) => {
      return reservationMapById.value.has(id)
    })
  },
)

watch(
  () => dateOptions.value,
  (options) => {
    if (!options.length) {
      selectedDate.value = ""
      return
    }
    if (!options.some((item) => item.value === selectedDate.value)) {
      const first = options[0]
      if (!first) return
      selectedDate.value = first.value
    }
  },
  { immediate: true },
)

watch(
  () => venueId.value,
  async () => {
    venueDetail.value = null
    reservations.value = []
    blockList.value = []
    selectedReservationIds.value = []
    availabilityLoadFailed.value = false
    blockLoadFailed.value = false

    const ok = await loadVenue()
    if (!ok || !selectedDate.value) return
    await refreshDateData()
  },
  { immediate: true },
)

watch(
  () => selectedDate.value,
  async (date) => {
    if (!date || !venueDetail.value) return
    await refreshDateData()
  },
)

function toMinutes(time?: string | null) {
  if (!time) return null
  const m = time.trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!m) return null
  const h = Number(m[1])
  const mm = Number(m[2])
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null
  return h * 60 + mm
}

function toTime(total: number) {
  const h = String(Math.floor(total / 60)).padStart(2, "0")
  const m = String(total % 60).padStart(2, "0")
  return `${h}:${m}`
}
function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
</script>

<template>
  <div class="home-venue-detail">
    <el-button :icon="ArrowLeft" class="home-venue-detail__back" @click="handleBack">返回首页</el-button>

    <div v-if="detailLoading && !hasLoadedOnce" class="home-venue-detail__loading" v-loading="true" />
    <el-empty v-else-if="!venueDetail" description="未找到该场馆信息">
      <el-button type="primary" @click="handleBack">返回场馆列表</el-button>
    </el-empty>
    <el-card v-else class="home-venue-detail__card" v-loading="detailLoading">
      <HomeVenueDetailInfoPanel
        :venue-detail="venueDetail"
        :venue-image-src="venueImageSrc"
        :default-venue-image="DEFAULT_VENUE_IMAGE"
        :venue-type-label="venueTypeLabel"
        :price-label="priceLabel"
        :open-hours="openHours"
      />

      <HomeVenueDetailBoard
        :board-message="boardMessage"
        :date-options="dateOptions"
        :selected-date="selectedDate"
        :selected-count="selectedCount"
        :slot-options="slotOptions"
        :court-options="courtOptions"
        :availability-loading="availabilityLoading"
        :board-stats="boardStats"
        :is-cell-blocked="isCellBlocked"
        :is-cell-occupied="isCellOccupied"
        :is-cell-selected="isCellSelected"
        :cell-user-text="cellUserText"
        @select-date="handleDateSelect"
        @open-cancel="openCancelDialog"
        @open-block="openBlockDialog"
        @click-cell="handleCellClick"
      />

      <HomeVenueDetailBlockRules
        :block-list="blockList"
        :block-loading="blockLoading"
        :block-load-failed="blockLoadFailed"
        :block-scope-label="blockScopeLabel"
        :block-mode-label="blockModeLabel"
        :block-active="blockActive"
        :block-status-label="blockStatusLabel"
        @disable="disableBlock"
      />
    </el-card>

    <el-dialog v-model="cancelDialogVisible" title="取消预约" width="500px" :close-on-click-modal="false">
      <el-form ref="cancelFormRef" :model="cancelForm" :rules="cancelFormRules" label-width="84px">
        <el-form-item label="取消原因" prop="reason">
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入取消原因（将用于通知用户）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="cancelSubmitting" @click="submitCancelReservations">确认取消</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="multiCellDialogVisible"
      title="该时段存在多条预约，请选择要操作的预约"
      width="540px"
      :close-on-click-modal="false"
    >
      <el-checkbox-group v-model="multiCellSelection" class="home-venue-detail__picker-list">
        <el-checkbox v-for="item in multiCellOptions" :key="item.id" :value="item.id">
          预约ID {{ item.id }} ｜用户ID {{ item.userId }} ｜{{ item.startTime }}-{{ item.endTime }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="multiCellDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMultiCell">确定</el-button>
      </template>
    </el-dialog>

    <HomeVenueDetailBlockDialog
      v-model:visible="blockDialogVisible"
      :loading="blockSubmitting"
      :venue-id="venueId"
      :selected-date="selectedDate"
      :court-options="courtOptions"
      :weekday-options="weekdayOptions"
      @submit="submitCreateBlock"
    />
  </div>
</template>

<style scoped lang="scss">
.home-venue-detail {
  padding: 16px;
}

.home-venue-detail__back {
  margin-bottom: 12px;
}

.home-venue-detail__loading {
  min-height: 280px;
}

.home-venue-detail__card {
  border-radius: 10px;
  overflow: visible;
}

.home-venue-detail__card :deep(.el-card__body) {
  overflow: visible;
}

.home-venue-detail__picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 900px) {
  .home-venue-detail {
    padding: 12px;
  }
}
</style>
