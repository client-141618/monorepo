<script setup lang="ts">
import type {
  ReservationAvailabilityData,
  ReservationAvailabilitySlot,
} from "@/api/reservation/type"
import type { Venue } from "@/api/venue/type"
import { ArrowLeft } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  createReservationApi,
  getReservationAvailabilityNextSevenDaysApi,
} from "@/api/reservation"
import { getVenueByIdApi } from "@/api/venue"

interface DateOption {
  value: string
  label: string
}

interface SlotOption {
  key: string
  label: string
  startMinutes: number
  endMinutes: number
  availableCourtIds: number[]
}

interface SelectedSlotDetail {
  courtId: number
  slotKey: string
  slotLabel: string
  startMinutes: number
}

const route = useRoute()
const router = useRouter()

const DEFAULT_VENUE_IMAGE = "/default.jpg"
const GRID_TIME_HEADER_TEXT = "时间段"
const detailLoading = ref(false)
const availabilityLoading = ref(false)
const submitLoading = ref(false)
const hasLoadedOnce = ref(false)
const venueDetail = ref<Venue | null>(null)
const availabilityData = ref<ReservationAvailabilityData | null>(null)
const selectedDate = ref("")
const selectedCells = ref<string[]>([])

const venueId = computed(() => Number(route.params.id))

const venueImageSrc = computed(() => {
  const src = venueDetail.value?.image?.trim()
  return src || DEFAULT_VENUE_IMAGE
})

const priceLabel = computed(() => {
  const cents = Number(venueDetail.value?.pricePerHour)
  if (!Number.isFinite(cents)) return "--"
  return `¥${(cents / 100).toFixed(2)}/小时`
})

const venueTypeLabel = computed(() => {
  if (!venueDetail.value) return "--"
  return venueDetail.value.typeName || `类型ID: ${venueDetail.value.typeId}`
})

const openHours = computed(() => {
  const openTime = venueDetail.value?.openTime?.trim()
  const closeTime = venueDetail.value?.closeTime?.trim()
  if (!openTime || !closeTime) return "--"
  return `${openTime} - ${closeTime}`
})

const dateOptions = computed<DateOption[]>(() => {
  const days = availabilityData.value?.days ?? []
  return days.map((day, index) => {
    if (index === 0) return { value: day.date, label: "今天" }
    if (index === 1) return { value: day.date, label: "明天" }
    const matched = day.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!matched) return { value: day.date, label: day.date }
    return { value: day.date, label: `${Number(matched[2])}.${Number(matched[3])}` }
  })
})

const selectedDateLabel = computed(() => {
  const matched = dateOptions.value.find((item) => item.value === selectedDate.value)
  return matched?.label ?? selectedDate.value
})

const selectedDay = computed(() => {
  return availabilityData.value?.days.find((day) => day.date === selectedDate.value)
})

const isTodaySelected = computed(() => {
  const today = formatDateValue(new Date())
  return selectedDate.value === today
})

const venueCloseMinutes = computed(() => {
  return toMinutes(venueDetail.value?.closeTime ?? null)
})

const slotOptions = computed<SlotOption[]>(() => {
  const slots = selectedDay.value?.slots ?? []
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  return slots
    .map((slot) => normalizeSlot(slot, venueCloseMinutes.value))
    .filter((slot): slot is SlotOption => slot !== null)
    .filter((slot) => !isTodaySelected.value || slot.startMinutes >= nowMinutes)
})

const courtOptions = computed<number[]>(() => {
  const allIds = new Set<number>()
  for (const slot of slotOptions.value) {
    slot.availableCourtIds.forEach((id) => allIds.add(id))
  }

  if (!allIds.size) {
    const fallbackTotal =
      Number(availabilityData.value?.totalCourts ?? 0) ||
      Number(venueDetail.value?.total ?? 0)
    if (fallbackTotal > 0) {
      for (let index = 1; index <= fallbackTotal; index += 1) {
        allIds.add(index)
      }
    }
  }

  return [...allIds].sort((left, right) => left - right)
})

const selectedCellSet = computed(() => new Set(selectedCells.value))

const selectedSlotDetails = computed<SelectedSlotDetail[]>(() => {
  const slotByKey = new Map(slotOptions.value.map((slot) => [slot.key, slot] as const))
  const details: SelectedSlotDetail[] = []

  for (const key of selectedCells.value) {
    const [courtPart, slotKey = ""] = key.split("@")
    const courtId = Number(courtPart)
    const slot = slotByKey.get(slotKey)
    if (!Number.isFinite(courtId) || !slot) continue
    details.push({
      courtId,
      slotKey,
      slotLabel: slot.label,
      startMinutes: slot.startMinutes,
    })
  }

  return details.sort((left, right) => {
    if (left.startMinutes !== right.startMinutes) return left.startMinutes - right.startMinutes
    return left.courtId - right.courtId
  })
})

const selectedCourtId = computed<number | null>(() => {
  const firstSelected = selectedSlotDetails.value[0]
  if (!firstSelected) return null
  return firstSelected.courtId
})

const isVenueOpen = computed(() => venueDetail.value?.status === 1)
const canBook = computed(() => {
  return Boolean(
    venueDetail.value &&
      isVenueOpen.value &&
      selectedDate.value &&
      slotOptions.value.length > 0 &&
      courtOptions.value.length > 0,
  )
})

const getBoardMessage = computed(() => {
  if (!venueDetail.value) return ""
  if (!isVenueOpen.value) return "当前场馆未开放，仅可查看可预约时段"
  if (availabilityLoading.value) return ""
  if (!availabilityData.value) return "可预约数据加载失败，请刷新后重试"
  if (!slotOptions.value.length && isTodaySelected.value) {
    return "今天已没有可选时段，请切换到明天或后续日期"
  }
  if (!slotOptions.value.length) return "当天暂无可预约时段"
  if (!courtOptions.value.length) return "当前时段暂无可预约场地"
  if (selectedCourtId.value !== null) {
    return `已锁定场地 ${selectedCourtId.value}，请在该场地内继续选择时段`
  }
  return ""
})

const loadVenueDetail = async () => {
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
  } catch (_error) {
    venueDetail.value = null
    return false
  } finally {
    detailLoading.value = false
    hasLoadedOnce.value = true
  }
}

const loadAvailability = async () => {
  if (!Number.isFinite(venueId.value) || venueId.value <= 0) {
    availabilityData.value = null
    return
  }

  try {
    availabilityLoading.value = true
    const startDate = formatDateValue(new Date())
    const res = await getReservationAvailabilityNextSevenDaysApi(venueId.value, startDate)
    availabilityData.value = res.data
  } catch (_error) {
    availabilityData.value = null
  } finally {
    availabilityLoading.value = false
  }
}

const handleBack = () => {
  router.push("/home")
}

const getCellKey = (courtId: number, slot: SlotOption) => `${courtId}@${slot.key}`

const isCellSelected = (courtId: number, slot: SlotOption) => {
  return selectedCellSet.value.has(getCellKey(courtId, slot))
}

const isCellAvailable = (courtId: number, slot: SlotOption) => {
  return slot.availableCourtIds.includes(courtId)
}

const isCellDisabled = (courtId: number, slot: SlotOption) => {
  if (!canBook.value || !isCellAvailable(courtId, slot)) return true
  if (
    selectedCourtId.value !== null &&
    selectedCourtId.value !== courtId &&
    !isCellSelected(courtId, slot)
  ) {
    return true
  }
  return false
}

const handleDateSelect = (dateValue: string) => {
  if (selectedDate.value === dateValue) return
  if (selectedCells.value.length > 0) {
    ElMessage.info("已切换日期，之前选择的时段已清空")
  }
  selectedDate.value = dateValue
  selectedCells.value = []
}

const toggleCellSelection = (courtId: number, slot: SlotOption) => {
  if (isCellDisabled(courtId, slot)) return
  const cellKey = getCellKey(courtId, slot)
  if (selectedCellSet.value.has(cellKey)) {
    selectedCells.value = selectedCells.value.filter((item) => item !== cellKey)
    return
  }
  selectedCells.value = [...selectedCells.value, cellKey]
}

const handleCreateReservation = async () => {
  if (!selectedDate.value) {
    ElMessage.warning("请先选择预约日期")
    return
  }
  if (!selectedSlotDetails.value.length) {
    ElMessage.warning("请至少选择一个预约时段")
    return
  }
  const courtId = selectedCourtId.value
  if (courtId === null) {
    ElMessage.warning("请先选择预约场地")
    return
  }

  const slotKeys = selectedSlotDetails.value
    .map((item) => item.slotKey)
    .filter((slotKey, index, array) => array.indexOf(slotKey) === index)

  try {
    await ElMessageBox.confirm(
      [
        `场馆：${venueDetail.value?.name ?? "--"}`,
        `日期：${selectedDateLabel.value} (${selectedDate.value})`,
        `场地：${courtId}`,
        `时段：${slotKeys.join("、")}`,
      ].join("\n"),
      "确认预约",
      {
        confirmButtonText: "提交预约",
        cancelButtonText: "取消",
        customClass: "home-venue-detail__summary-dialog",
      },
    )
  } catch (_error) {
    return
  }

  try {
    submitLoading.value = true
    await createReservationApi({
      venueId: venueId.value,
      courtId,
      bookingDate: selectedDate.value,
      slotKeys,
      clientRequestId: createClientRequestId(),
    })
    ElMessage.success("预约成功")
    selectedCells.value = []
    await loadAvailability()
  } finally {
    submitLoading.value = false
  }
}

watch(
  () => dateOptions.value,
  (options) => {
    if (!options.length) {
      selectedDate.value = ""
      return
    }
    if (!options.some((item) => item.value === selectedDate.value)) {
      const firstOption = options[0]
      if (!firstOption) return
      selectedDate.value = firstOption.value
      selectedCells.value = []
    }
  },
  { immediate: true },
)

watch(
  () => venueId.value,
  async () => {
    selectedDate.value = ""
    selectedCells.value = []
    availabilityData.value = null
    const hasVenueDetail = await loadVenueDetail()
    if (!hasVenueDetail) return
    await loadAvailability()
  },
  { immediate: true },
)

function normalizeSlot(
  slot: ReservationAvailabilitySlot,
  closeMinutesLimit: number | null,
): SlotOption | null {
  const startMinutes = toMinutes(slot.startTime)
  const endMinutes = toMinutes(slot.endTime)
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null
  }
  const normalizedEndMinutes =
    closeMinutesLimit !== null ? Math.min(endMinutes, closeMinutesLimit) : endMinutes
  if (normalizedEndMinutes <= startMinutes) return null

  const normalizedEndTime = toTimeText(normalizedEndMinutes)
  const normalizedSlotKey = `${slot.startTime}-${normalizedEndTime}`

  return {
    key: normalizedSlotKey,
    label: normalizedSlotKey,
    startMinutes,
    endMinutes: normalizedEndMinutes,
    availableCourtIds: [...slot.availableCourtIds].sort((left, right) => left - right),
  }
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toMinutes(timeText?: string | null) {
  if (!timeText) return null
  const matched = timeText.trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!matched) return null
  const hour = Number(matched[1])
  const minute = Number(matched[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}

function createClientRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toTimeText(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
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
      <div class="home-venue-detail__main">
        <div class="home-venue-detail__cover">
          <el-image :src="venueImageSrc" fit="cover" class="home-venue-detail__image">
            <template #error>
              <img :src="DEFAULT_VENUE_IMAGE" alt="场馆默认图片" class="home-venue-detail__image" />
            </template>
          </el-image>
        </div>
        <div class="home-venue-detail__info">
          <h2 class="home-venue-detail__name">{{ venueDetail.name }}</h2>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">场馆类型：</span>
            <span>{{ venueTypeLabel }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">单价：</span>
            <span>{{ priceLabel }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">位置：</span>
            <span>{{ venueDetail.location || "--" }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">营业时间：</span>
            <span>{{ openHours }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">场地单元数：</span>
            <span>{{ venueDetail.total }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">每场地人数：</span>
            <span>{{ venueDetail.unitCapacity }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">最小预约单元：</span>
            <span>{{ venueDetail.slotMinutes }} 分钟</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">状态：</span>
            <el-tag :type="venueDetail.status === 1 ? 'success' : 'info'">
              {{ venueDetail.status === 1 ? "开放中" : "已停用" }}
            </el-tag>
          </div>
          <div class="home-venue-detail__desc">
            <div class="home-venue-detail__label">场馆介绍</div>
            <p>{{ venueDetail.description || "暂无介绍" }}</p>
          </div>
        </div>
      </div>

      <div class="home-venue-detail__booking">
        <div class="home-venue-detail__booking-header">
          <div class="home-venue-detail__booking-title">预约时段</div>
          <div class="home-venue-detail__booking-tip">
            通过后端实时占用数据渲染；单次预约仅支持同一场地多时段
          </div>
        </div>

        <el-alert
          v-if="getBoardMessage"
          :title="getBoardMessage"
          :type="selectedCourtId === null ? 'warning' : 'info'"
          :closable="false"
          class="home-venue-detail__booking-alert"
        />

        <div class="home-venue-detail__date-bar">
          <button
            v-for="item in dateOptions"
            :key="item.value"
            type="button"
            class="home-venue-detail__date-item"
            :class="{ 'home-venue-detail__date-item--active': selectedDate === item.value }"
            @click="handleDateSelect(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="home-venue-detail__board" v-loading="availabilityLoading">
          <div class="home-venue-detail__time-column">
            <div class="home-venue-detail__time-head">{{ GRID_TIME_HEADER_TEXT }}</div>
            <div
              v-for="slot in slotOptions"
              :key="slot.key"
              class="home-venue-detail__time-item"
            >
              {{ slot.label }}
            </div>
          </div>

          <div class="home-venue-detail__grid-scroll">
            <div
              class="home-venue-detail__grid-court-head"
              :style="{ gridTemplateColumns: `repeat(${courtOptions.length || 1}, minmax(110px, 1fr))` }"
            >
              <div
                v-for="courtId in courtOptions"
                :key="courtId"
                class="home-venue-detail__court-item"
              >
                场地 {{ courtId }}
              </div>
              <div v-if="!courtOptions.length" class="home-venue-detail__court-item">
                无场地
              </div>
            </div>

            <div
              v-for="slot in slotOptions"
              :key="slot.key"
              class="home-venue-detail__grid-row"
              :style="{ gridTemplateColumns: `repeat(${courtOptions.length || 1}, minmax(110px, 1fr))` }"
            >
              <button
                v-for="courtId in courtOptions"
                :key="`${courtId}-${slot.key}`"
                type="button"
                class="home-venue-detail__grid-cell"
                :class="{
                  'home-venue-detail__grid-cell--selected': isCellSelected(courtId, slot),
                  'home-venue-detail__grid-cell--occupied': !isCellAvailable(courtId, slot),
                  'home-venue-detail__grid-cell--disabled': isCellDisabled(courtId, slot),
                }"
                :disabled="isCellDisabled(courtId, slot)"
                @click="toggleCellSelection(courtId, slot)"
              >
                <span v-if="isCellSelected(courtId, slot)">已选</span>
                <span v-else-if="isCellAvailable(courtId, slot)">可选</span>
                <span v-else>已约</span>
              </button>

              <div
                v-if="!courtOptions.length"
                class="home-venue-detail__grid-cell home-venue-detail__grid-cell--disabled"
              >
                --
              </div>
            </div>
          </div>
        </div>

        <div class="home-venue-detail__booking-footer">
          <div class="home-venue-detail__booking-summary">
            已选 {{ selectedSlotDetails.length }} 个时段
          </div>
          <el-button
            type="primary"
            :disabled="!canBook || !selectedSlotDetails.length"
            :loading="submitLoading"
            @click="handleCreateReservation"
          >
            确认预约
          </el-button>
        </div>
      </div>
    </el-card>
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
}

.home-venue-detail__main {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 480px) 1fr;
}

.home-venue-detail__cover {
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  min-height: 280px;
}

.home-venue-detail__image {
  width: 100%;
  height: 100%;
  display: block;
}

.home-venue-detail__info {
  min-width: 0;
}

.home-venue-detail__name {
  margin: 0 0 14px;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}

.home-venue-detail__line {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  line-height: 22px;
  color: #374151;
}

.home-venue-detail__label {
  color: #6b7280;
  flex: 0 0 auto;
}

.home-venue-detail__desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;

  p {
    margin: 8px 0 0;
    line-height: 22px;
    color: #374151;
  }
}

.home-venue-detail__booking {
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.home-venue-detail__booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.home-venue-detail__booking-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.home-venue-detail__booking-tip {
  font-size: 13px;
  color: #6b7280;
}

.home-venue-detail__booking-alert {
  margin-bottom: 12px;
}

.home-venue-detail__date-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow-x: auto;
}

.home-venue-detail__date-item {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  border-radius: 8px;
  padding: 8px 16px;
  min-width: 88px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.home-venue-detail__date-item--active {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.home-venue-detail__board {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  min-height: 260px;
}

.home-venue-detail__time-column {
  width: 130px;
  flex: 0 0 130px;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
}

.home-venue-detail__time-head,
.home-venue-detail__court-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.home-venue-detail__time-item {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f1f5f9;
  padding: 0 8px;
  text-align: center;
}

.home-venue-detail__grid-scroll {
  flex: 1;
  min-width: 0;
  overflow: auto;
  background: #fff;
}

.home-venue-detail__grid-court-head,
.home-venue-detail__grid-row {
  display: grid;
}

.home-venue-detail__grid-cell {
  height: 52px;
  border: none;
  border-right: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.home-venue-detail__grid-cell--selected {
  background: #2563eb;
  color: #fff;
}

.home-venue-detail__grid-cell--occupied {
  color: #9ca3af;
  background: #f9fafb;
}

.home-venue-detail__grid-cell--disabled {
  cursor: not-allowed;
}

.home-venue-detail__booking-footer {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.home-venue-detail__booking-summary {
  font-size: 14px;
  color: #374151;
}

@media (max-width: 900px) {
  .home-venue-detail {
    padding: 12px;
  }

  .home-venue-detail__main {
    grid-template-columns: 1fr;
  }

  .home-venue-detail__time-column {
    width: 110px;
    flex-basis: 110px;
  }

  .home-venue-detail__booking-footer {
    flex-direction: column;
    align-items: stretch;
  }
}

:deep(.home-venue-detail__summary-dialog .el-message-box__content) {
  white-space: pre-line;
  line-height: 1.7;
}
</style>
