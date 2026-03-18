import type { FormInstance, FormRules } from "element-plus"
import type { VenueFormModel } from "../types"
import type { VenueType } from "@/api/venue-type/type"
import type { Venue, VenueUpsertPayload } from "@/api/venue/type"
import { reactive, ref } from "vue"
import { addVenueApi, updateVenueApi } from "@/api/venue"
import { getVenueTypeListApi } from "@/api/venue-type"

const createDefaultForm = (): VenueFormModel => ({
  name: "",
  image: "",
  typeId: undefined as unknown as number,
  description: "",
  location: "",
  pricePerHour: 0,
  openTime: "",
  closeTime: "",
  total: 0,
  unitCapacity: 0,
  slotMinutes: 0,
  status: 1,
  enableLocationVerify: 0,
  checkinLatGcj02: undefined,
  checkinLngGcj02: undefined,
  checkinRadiusM: undefined,
})

let venueTypeCache: VenueType[] | null = null
let pendingVenueTypeRequest: Promise<VenueType[]> | null = null

export function useVenueFormDialog() {
  const formRef = ref<FormInstance>()
  const form = reactive<VenueFormModel>(createDefaultForm())

  const venueTypeOptions = ref<VenueType[]>([])
  const venueTypeLoading = ref(false)

  const parseTimeToMinutes = (value: string): number | null => {
    const [hoursText, minutesText] = value.split(":")
    const hours = Number(hoursText)
    const minutes = Number(minutesText)
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    return hours * 60 + minutes
  }

  const isTimeAlignedWithSlot = (timeText: string, slot: number) => {
    const totalMinutes = parseTimeToMinutes(timeText)
    if (totalMinutes === null) return false
    return totalMinutes % slot === 0
  }

  const formatMinutesToTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  }

  const getSlotMinuteValue = () => {
    const parsed = Math.floor(Number(form.slotMinutes))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  const isSlotMinuteReady = () => getSlotMinuteValue() > 0

  const hasSelectedLocationPoint = () => {
    return Number.isFinite(form.checkinLatGcj02) && Number.isFinite(form.checkinLngGcj02)
  }

  const validateOpenTime = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error("请选择开放时间"))
      return
    }
    if (!isSlotMinuteReady()) {
      callback(new Error("请先填写最小预约单元"))
      return
    }
    if (!isTimeAlignedWithSlot(value, getSlotMinuteValue())) {
      callback(new Error("开放时间需按最小预约单元对齐"))
      return
    }
    callback()
  }

  const validateCloseTime = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error("请选择关闭时间"))
      return
    }
    if (!isSlotMinuteReady()) {
      callback(new Error("请先填写最小预约单元"))
      return
    }
    if (!isTimeAlignedWithSlot(value, getSlotMinuteValue())) {
      callback(new Error("关闭时间需按最小预约单元对齐"))
      return
    }
    if (!form.openTime) {
      callback()
      return
    }
    const openTimeMinutes = parseTimeToMinutes(form.openTime)
    const closeTimeMinutes = parseTimeToMinutes(value)
    if (openTimeMinutes === null || closeTimeMinutes === null) {
      callback(new Error("时间格式不正确"))
      return
    }
    if (closeTimeMinutes <= openTimeMinutes) {
      callback(new Error("关闭时间需晚于开放时间"))
      return
    }
    if ((closeTimeMinutes - openTimeMinutes) % getSlotMinuteValue() !== 0) {
      callback(new Error("开放与关闭时间跨度需按最小预约单元对齐"))
      return
    }
    callback()
  }

  const validateLocationText = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (form.enableLocationVerify !== 1) {
      callback()
      return
    }
    if (!value?.trim()) {
      callback(new Error("请通过地图选点回填场馆地址"))
      return
    }
    callback()
  }

  const validateLocationPoint = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
    if (form.enableLocationVerify !== 1) {
      callback()
      return
    }
    if (!hasSelectedLocationPoint()) {
      callback(new Error("请在地图上选择签到中心点"))
      return
    }
    callback()
  }

  const validateLocationRadius = (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
    if (form.enableLocationVerify !== 1) {
      callback()
      return
    }
    const radius = Number(value)
    if (!Number.isFinite(radius) || radius <= 0) {
      callback(new Error("请输入有效的校验范围"))
      return
    }
    callback()
  }

  const rules: FormRules<VenueFormModel> = {
    name: [{ required: true, message: "请输入场馆名称", trigger: "blur" }],
    typeId: [{ required: true, message: "请选择场馆类型", trigger: "change" }],
    location: [{ validator: validateLocationText, trigger: ["blur", "change"] }],
    pricePerHour: [
      { required: true, message: "请输入每小时价格", trigger: "change" },
    ],
    openTime: [{ validator: validateOpenTime, trigger: "change" }],
    closeTime: [{ validator: validateCloseTime, trigger: "change" }],
    total: [{ required: true, message: "请输入场地单元数量", trigger: "change" }],
    unitCapacity: [{ required: true, message: "请输入每个场地人数", trigger: "change" }],
    slotMinutes: [{ required: true, message: "请输入最小预约时间单元", trigger: "change" }],
    checkinRadiusM: [{ validator: validateLocationRadius, trigger: "change" }],
    checkinLatGcj02: [{ validator: validateLocationPoint, trigger: "change" }],
  }

  const timeSelectStep = () => formatMinutesToTime(getSlotMinuteValue() || 1)

  const timeSelectEnd = () => {
    if (!isSlotMinuteReady()) return "23:59"
    const slot = getSlotMinuteValue()
    const alignedLastMinute = Math.floor((24 * 60 - 1) / slot) * slot
    return formatMinutesToTime(alignedLastMinute)
  }

  const resetForm = () => {
    Object.assign(form, createDefaultForm())
  }

  const setFormByVenue = (venue: Venue) => {
    form.name = venue.name ?? ""
    form.image = venue.image ?? ""
    form.typeId = venue.typeId
    form.description = venue.description ?? ""
    form.location = venue.location ?? ""
    form.pricePerHour = Number((Number(venue.pricePerHour) / 100).toFixed(2))
    form.openTime = venue.openTime ?? ""
    form.closeTime = venue.closeTime ?? ""
    form.total = Number(venue.total ?? 0)
    form.unitCapacity = Number(venue.unitCapacity ?? 0)
    form.slotMinutes = Number(venue.slotMinutes ?? 0)
    form.status = venue.status ?? 1
    form.enableLocationVerify = venue.enableLocationVerify ?? 0
    form.checkinLatGcj02 = venue.checkinLatGcj02
    form.checkinLngGcj02 = venue.checkinLngGcj02
    form.checkinRadiusM = venue.checkinRadiusM
  }

  const normalizeOptionalNumber = (value: number | undefined) => {
    return Number.isFinite(value) ? Number(value) : undefined
  }

  const submitVenue = async (mode: "create" | "edit" = "create", editData?: Venue | null) => {
    if (!formRef.value) return false

    const valid = await formRef.value.validate()
    if (!valid) return false

    const payload: VenueUpsertPayload = {
      name: form.name.trim(),
      image: form.image || undefined,
      typeId: form.typeId,
      description: form.description?.trim() || undefined,
      location: form.location?.trim() || undefined,
      pricePerHour: Math.round(Number(form.pricePerHour) * 100),
      openTime: form.openTime,
      closeTime: form.closeTime,
      total: Number(form.total),
      unitCapacity: Number(form.unitCapacity),
      slotMinutes: Number(form.slotMinutes),
      status: form.status,
      enableLocationVerify: form.enableLocationVerify,
      checkinLatGcj02: form.enableLocationVerify === 1
        ? normalizeOptionalNumber(form.checkinLatGcj02)
        : undefined,
      checkinLngGcj02: form.enableLocationVerify === 1
        ? normalizeOptionalNumber(form.checkinLngGcj02)
        : undefined,
      checkinRadiusM: form.enableLocationVerify === 1
        ? normalizeOptionalNumber(form.checkinRadiusM)
        : undefined,
    }

    if (mode === "edit") {
      payload.id = editData?.id
      await updateVenueApi(payload)
    } else {
      await addVenueApi(payload)
    }

    return true
  }

  const ensureVenueTypeOptions = async () => {
    if (venueTypeCache) {
      venueTypeOptions.value = venueTypeCache
      return venueTypeCache
    }

    if (pendingVenueTypeRequest) {
      venueTypeLoading.value = true
      const data = await pendingVenueTypeRequest
      venueTypeLoading.value = false
      venueTypeOptions.value = data
      return data
    }

    venueTypeLoading.value = true
    pendingVenueTypeRequest = getVenueTypeListApi()
      .then((res) => {
        venueTypeCache = res.data
        return venueTypeCache
      })
      .finally(() => {
        pendingVenueTypeRequest = null
      })

    try {
      const data = await pendingVenueTypeRequest
      venueTypeOptions.value = data
      return data
    } finally {
      venueTypeLoading.value = false
    }
  }

  return {
    formRef,
    form,
    rules,
    venueTypeOptions,
    venueTypeLoading,
    ensureVenueTypeOptions,
    timeSelectStep,
    timeSelectEnd,
    isSlotMinuteReady,
    isTimeAlignedWithSlot,
    getSlotMinuteValue,
    resetForm,
    setFormByVenue,
    submitVenue,
  }
}
