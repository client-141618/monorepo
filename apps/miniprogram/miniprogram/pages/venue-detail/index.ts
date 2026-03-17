import type {
  ReservationAvailabilityData,
  ReservationAvailabilitySlot,
} from "../../api/reservation/index"
import type { Venue } from "../../api/venue/index"
import {
  createReservationApi,
  getReservationAvailabilityNextSevenDaysApi,
} from "../../api/reservation/index"
import { getVenueByIdApi } from "../../api/venue/index"

type DateOption = {
  value: string
  label: string
  active: boolean
  className: string
}

type SlotOption = {
  key: string
  label: string
  startMinutes: number
  availableCourtIds: number[]
  bookedCourtIds: number[]
  blockedCourtIds: number[]
}

type GridCell = {
  cellKey: string
  courtId: number
  slotKey: string
  text: "可选" | "已约" | "已选" | "不可用"
  selected: boolean
  occupied: boolean
  blocked: boolean
  disabled: boolean
  className: string
}

type GridRow = {
  slotKey: string
  slotLabel: string
  cells: GridCell[]
}

type LoadPageDataOptions = {
  preferredDate?: string
  selectedCells?: string[]
}

const DEFAULT_COVER =
  "https://dummyimage.com/1200x500/1f2430/ffffff&text=Venue"

let confirmDialogResolver: ((_value: boolean) => void) | null = null

Page({
  data: {
    loading: false,
    availabilityLoading: false,
    submitLoading: false,
    venueId: 0,
    venue: null as Venue | null,
    dateOptions: [] as DateOption[],
    selectedDate: "",
    selectedDateLabel: "",
    courtOptions: [] as number[],
    gridRows: [] as GridRow[],
    selectedCells: [] as string[],
    selectedCount: 0,
    selectedCourtId: 0,
    boardMessage: "",
    coverSrc: DEFAULT_COVER,
    priceLabel: "--",
    hasPriceLabel: false,
    availability: null as ReservationAvailabilityData | null,
    canSubmit: false,
    confirmDialogVisible: false,
    confirmDialogVenueLine: "",
    confirmDialogDateLine: "",
    confirmDialogSlotLine: "",
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: "场馆详情",
    })
    const venueId = Number(options.id)
    if (!Number.isFinite(venueId) || venueId <= 0) {
      wx.showToast({ title: "场馆参数错误", icon: "none" })
      return
    }

    this.setData({ venueId })
    this.loadPageData()
  },

  async loadPageData(options?: LoadPageDataOptions) {
    if (!this.data.venueId) return
    this.setData({
      loading: true,
      boardMessage: "",
    })
    try {
      const [venueRes, availabilityRes] = await Promise.all([
        getVenueByIdApi(this.data.venueId),
        getReservationAvailabilityNextSevenDaysApi(
          this.data.venueId,
          this.formatDateValue(new Date()),
        ),
      ])

      const venue = venueRes.data || null
      const availability = availabilityRes.data || null
      const rawDateOptions = this.buildDateOptions(availability)
      const firstDateOption = rawDateOptions[0]
      const firstDateValue = firstDateOption ? firstDateOption.value : ""
      const preferredDateCandidate =
        (options && options.preferredDate) || this.data.selectedDate || firstDateValue
      const hasPreferredDate = rawDateOptions.some(
        (item) => item.value === preferredDateCandidate,
      )
      const selectedDate = hasPreferredDate ? preferredDateCandidate : firstDateValue
      const dateOptions = this.applyDateOptionState(rawDateOptions, selectedDate)
      const selectedDateOption = rawDateOptions.find(
        (item) => item.value === selectedDate,
      )
      const selectedDateLabel = selectedDateOption ? selectedDateOption.label : ""
      const slotOptions = this.buildSlotOptions(availability, selectedDate, venue)
      const courtOptions = this.buildCourtOptions(slotOptions, availability, venue)
      const validCellKeySet = new Set<string>()
      slotOptions.forEach((slot) => {
        courtOptions.forEach((courtId) => {
          validCellKeySet.add(`${courtId}@${slot.key}`)
        })
      })
      const rawSelectedCells =
        (options && Array.isArray(options.selectedCells) && options.selectedCells) ||
        this.data.selectedCells ||
        []
      const selectedCells = rawSelectedCells.filter((item) => validCellKeySet.has(item))
      const selectedCourtId = this.resolveSelectedCourtId(selectedCells)
      const gridRows = this.buildGridRows(
        slotOptions,
        courtOptions,
        selectedCells,
        selectedCourtId,
        Boolean(venue && venue.status === 1 && selectedDate),
      )

      this.setData({
        venue,
        availability,
        dateOptions,
        selectedDate,
        selectedDateLabel,
        selectedCells,
        selectedCount: selectedCells.length,
        selectedCourtId,
        courtOptions,
        gridRows,
        canSubmit:
          selectedCells.length > 0 &&
          Boolean(venue && venue.status === 1 && selectedDate),
        boardMessage: this.buildBoardMessage(
          venue,
          availability,
          slotOptions.length,
          courtOptions.length,
          selectedDate,
          selectedCourtId,
        ),
        coverSrc: (venue && venue.image) || DEFAULT_COVER,
        priceLabel: this.formatPriceYuan(venue ? venue.pricePerHour : undefined),
        hasPriceLabel:
          this.formatPriceYuan(venue ? venue.pricePerHour : undefined) !== "--",
      })
    } catch (error) {
      console.error("load venue detail page failed:", error)
      wx.showToast({ title: "详情加载失败", icon: "none" })
    } finally {
      this.setData({ loading: false })
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onDateTap(event: WechatMiniprogram.BaseEvent) {
    const { date } = event.currentTarget.dataset as { date?: string }
    if (!date || date === this.data.selectedDate) return

    const matchedDateOption = this.data.dateOptions.find((item) => item.value === date)
    const selectedDateLabel = matchedDateOption ? matchedDateOption.label : date
    const dateOptions = this.applyDateOptionState(this.data.dateOptions, date)
    const availability = this.data.availability

    const slotOptions = this.buildSlotOptions(availability || null, date, this.data.venue)
    const courtOptions = this.buildCourtOptions(slotOptions, availability || null, this.data.venue)
    const gridRows = this.buildGridRows(
      slotOptions,
      courtOptions,
      [],
      0,
      Boolean(this.data.venue && this.data.venue.status === 1 && date),
    )

    this.setData({
      selectedDate: date,
      selectedDateLabel,
      selectedCells: [],
      selectedCount: 0,
      selectedCourtId: 0,
      dateOptions,
      courtOptions,
      gridRows,
      canSubmit: false,
      boardMessage: this.buildBoardMessage(
        this.data.venue,
        availability || null,
        slotOptions.length,
        courtOptions.length,
        date,
        0,
      ),
    })
  },

  onCellTap(event: WechatMiniprogram.BaseEvent) {
    const {
      cellKey,
      courtId,
      slotKey,
      disabled,
    } = event.currentTarget.dataset as {
      cellKey?: string
      courtId?: number
      slotKey?: string
      disabled?: boolean
    }
    if (!cellKey || !courtId || !slotKey || disabled) return

    const selectedCells = [...this.data.selectedCells]
    const targetIndex = selectedCells.indexOf(cellKey)
    if (targetIndex >= 0) {
      selectedCells.splice(targetIndex, 1)
    } else {
      selectedCells.push(cellKey)
    }

    const selectedCourtId = this.resolveSelectedCourtId(selectedCells)
    const availability = this.data.availability
    const slotOptions = this.buildSlotOptions(
      availability || null,
      this.data.selectedDate,
      this.data.venue,
    )
    const courtOptions = this.buildCourtOptions(slotOptions, availability || null, this.data.venue)
    const gridRows = this.buildGridRows(
      slotOptions,
      courtOptions,
      selectedCells,
      selectedCourtId,
      Boolean(this.data.venue && this.data.venue.status === 1 && this.data.selectedDate),
    )

    this.setData({
      selectedCells,
      selectedCount: selectedCells.length,
      selectedCourtId,
      gridRows,
      canSubmit: selectedCells.length > 0 && !this.data.submitLoading,
      boardMessage: this.buildBoardMessage(
        this.data.venue,
        availability || null,
        slotOptions.length,
        courtOptions.length,
        this.data.selectedDate,
        selectedCourtId,
      ),
    })
  },

  async onSubmitReservation() {
    if (!this.data.selectedDate) {
      wx.showToast({ title: "请先选择日期", icon: "none" })
      return
    }
    if (!this.data.selectedCells.length) {
      wx.showToast({ title: "请至少选择一个时段", icon: "none" })
      return
    }
    const courtId = this.resolveSelectedCourtId(this.data.selectedCells)
    if (!courtId) {
      wx.showToast({ title: "请先选择同一场地", icon: "none" })
      return
    }

    const { slotKeys, labels } = this.resolveSelectedSlotKeys(this.data.selectedCells)
    if (!slotKeys.length) {
      wx.showToast({ title: "未解析到有效时段", icon: "none" })
      return
    }
    const mergedDisplayLabels = this.mergeAdjacentTimeRanges(labels)

    const preservedSelectedDate = this.data.selectedDate
    const preservedSelectedCells = [...this.data.selectedCells]

    try {
      const venueName = (this.data.venue && this.data.venue.name) || "--"
      const dateLine = this.data.selectedDateLabel
        ? `${this.data.selectedDateLabel} (${this.data.selectedDate})`
        : this.data.selectedDate
      const confirmLines = [
        `场地：${venueName}  ${courtId}号场`,
        `日期：${dateLine}`,
        `时段：${mergedDisplayLabels.join("、")}`,
      ]
      const confirmed = await this.confirmPromise(confirmLines)
      if (!confirmed) return
    } catch (_error) {
      return
    }

    this.setData({ submitLoading: true, canSubmit: false })
    wx.showLoading({
      title: "预约提交中",
      mask: true,
    })
    try {
      await createReservationApi({
        venueId: this.data.venueId,
        courtId,
        bookingDate: this.data.selectedDate,
        slotKeys,
        clientRequestId: this.createClientRequestId(),
      })
      wx.showToast({ title: "预约成功", icon: "success" })
      await this.loadPageData({
        preferredDate: preservedSelectedDate,
        selectedCells: preservedSelectedCells,
      })
    } catch (error) {
      console.error("create reservation failed:", error)
      wx.showToast({ title: "预约失败", icon: "none" })
    } finally {
      wx.hideLoading()
      this.setData({
        submitLoading: false,
        canSubmit: this.data.selectedCount > 0,
      })
    }
  },

  buildDateOptions(availability: ReservationAvailabilityData | null) {
    const days = (availability && availability.days) || []
    return days.map((day, index) => ({
      value: day.date,
      label:
        index === 0
          ? "今天"
          : index === 1
            ? "明天"
            : `${Number(day.date.slice(5, 7))}.${Number(day.date.slice(8, 10))}`,
      active: false,
      className: "",
    }))
  },

  applyDateOptionState(options: DateOption[], selectedDate: string) {
    return options.map((item) => {
      const active = item.value === selectedDate
      return {
        ...item,
        active,
        className: active ? "date-item--active" : "",
      }
    })
  },

  buildSlotOptions(
    availability: ReservationAvailabilityData | null,
    selectedDate: string,
    venue: Venue | null,
  ) {
    const days = (availability && availability.days) || []
    const day = days.find((item) => item.date === selectedDate)
    const slots = (day && day.slots) || []
    const isTodaySelected = selectedDate === this.formatDateValue(new Date())
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const closeMinutes = this.toMinutes(venue ? venue.closeTime : undefined)

    return slots
      .map((slot) => this.normalizeSlot(slot, closeMinutes))
      .filter((slot): slot is SlotOption => Boolean(slot))
      .filter((slot) => !isTodaySelected || slot.startMinutes >= nowMinutes)
  },

  buildCourtOptions(
    slotOptions: SlotOption[],
    availability: ReservationAvailabilityData | null,
    venue: Venue | null,
  ) {
    const ids = new Set<number>()
    slotOptions.forEach((slot) =>
      slot.availableCourtIds.forEach((courtId) => ids.add(courtId)),
    )
    slotOptions.forEach((slot) =>
      slot.bookedCourtIds.forEach((courtId) => ids.add(courtId)),
    )
    slotOptions.forEach((slot) =>
      slot.blockedCourtIds.forEach((courtId) => ids.add(courtId)),
    )
    if (!ids.size) {
      const total = Number(
        (availability && availability.totalCourts) ||
        (venue && venue.total) ||
        0,
      )
      for (let index = 1; index <= total; index += 1) {
        ids.add(index)
      }
    }
    return [...ids].sort((left, right) => left - right)
  },

  buildGridRows(
    slotOptions: SlotOption[],
    courtOptions: number[],
    selectedCells: string[],
    selectedCourtId: number,
    canOperate: boolean,
  ) {
    const selectedCellSet = new Set(selectedCells)
    return slotOptions.map((slot) => {
      const cells = courtOptions.map((courtId) => {
        const cellKey = `${courtId}@${slot.key}`
        const selected = selectedCellSet.has(cellKey)
        const blocked = slot.blockedCourtIds.includes(courtId)
        const occupied = !blocked && !slot.availableCourtIds.includes(courtId)
        const disabled =
          !canOperate ||
          blocked ||
          occupied ||
          (selectedCourtId > 0 && selectedCourtId !== courtId && !selected)

        let text: GridCell["text"] = "可选"
        if (blocked) text = "不可用"
        else if (selected) text = "已选"
        else if (occupied) text = "已约"

        return {
          cellKey,
          courtId,
          slotKey: slot.key,
          text,
          selected,
          occupied,
          blocked,
          disabled,
          className: [
            selected ? "grid-cell--selected" : "",
            blocked ? "grid-cell--blocked" : "",
            occupied ? "grid-cell--occupied" : "",
            disabled ? "grid-cell--disabled" : "",
          ]
            .filter(Boolean)
            .join(" "),
        }
      })

      return {
        slotKey: slot.key,
        slotLabel: slot.label,
        cells,
      }
    })
  },

  buildBoardMessage(
    venue: Venue | null,
    availability: ReservationAvailabilityData | null,
    slotCount: number,
    courtCount: number,
    selectedDate: string,
    selectedCourtId: number,
  ) {
    if (!venue) return ""
    if (venue.status !== 1) return "当前场馆未开放，仅可查看可预约时段"
    if (!availability) return "可预约数据加载失败，请下拉刷新重试"
    if (!slotCount && selectedDate === this.formatDateValue(new Date())) {
      return "今天已没有可选时段，请切换到明天或后续日期"
    }
    if (!slotCount) return "当天暂无可预约时段"
    if (!courtCount) return "当前时段暂无可预约场地"
    if (selectedCourtId > 0) {
      return `已锁定场地 ${selectedCourtId}，请在该场地内继续选择时段`
    }
    return ""
  },

  resolveSelectedCourtId(selectedCells: string[]) {
    const first = selectedCells[0]
    if (!first) return 0
    const courtId = Number(first.split("@")[0])
    return Number.isFinite(courtId) ? courtId : 0
  },

  resolveSelectedSlotKeys(selectedCells: string[]) {
    const pairs = selectedCells
      .map((item) => {
        const parts = item.split("@")
        return {
          slotKey: parts[1] || "",
          startMinutes: this.toMinutes((parts[1] || "").split("-")[0]),
        }
      })
      .filter((item) => item.slotKey)

    pairs.sort((left, right) => (left.startMinutes || 0) - (right.startMinutes || 0))

    const uniqueSlotKeys: string[] = []
    pairs.forEach((item) => {
      if (!uniqueSlotKeys.includes(item.slotKey)) {
        uniqueSlotKeys.push(item.slotKey)
      }
    })

    return {
      slotKeys: uniqueSlotKeys,
      labels: uniqueSlotKeys,
    }
  },

  mergeAdjacentTimeRanges(labels: string[]) {
    const parsed = labels
      .map((label) => {
        const parts = label.split("-")
        const startText = (parts[0] || "").trim()
        const endText = (parts[1] || "").trim()
        const startMinutes = this.toMinutes(startText)
        const endMinutes = this.toMinutes(endText)
        if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
          return null
        }
        return {
          startText,
          endText,
          startMinutes,
          endMinutes,
        }
      })
      .filter((item) => Boolean(item)) as {
      startText: string
      endText: string
      startMinutes: number
      endMinutes: number
    }[]

    if (!parsed.length) {
      return labels
    }

    parsed.sort((left, right) => left.startMinutes - right.startMinutes)

    const merged: string[] = []
    let currentStartText = parsed[0].startText
    let currentEndText = parsed[0].endText
    let currentEndMinutes = parsed[0].endMinutes

    for (let index = 1; index < parsed.length; index += 1) {
      const item = parsed[index]
      if (item.startMinutes === currentEndMinutes) {
        currentEndMinutes = item.endMinutes
        currentEndText = item.endText
        continue
      }
      merged.push(`${currentStartText}-${currentEndText}`)
      currentStartText = item.startText
      currentEndText = item.endText
      currentEndMinutes = item.endMinutes
    }

    merged.push(`${currentStartText}-${currentEndText}`)
    return merged
  },

  normalizeSlot(slot: ReservationAvailabilitySlot, closeMinutesLimit: number | null) {
    const startMinutes = this.toMinutes(slot.startTime)
    const endMinutes = this.toMinutes(slot.endTime)
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return null

    const normalizedEndMinutes =
      closeMinutesLimit !== null ? Math.min(endMinutes, closeMinutesLimit) : endMinutes
    if (normalizedEndMinutes <= startMinutes) return null

    const normalizedEndTime = this.toTimeText(normalizedEndMinutes)
    const normalizedSlotKey = `${slot.startTime}-${normalizedEndTime}`

    return {
      key: normalizedSlotKey,
      label: normalizedSlotKey,
      startMinutes,
      availableCourtIds: [...slot.availableCourtIds].sort((left, right) => left - right),
      bookedCourtIds: [...slot.bookedCourtIds].sort((left, right) => left - right),
      blockedCourtIds: [...(slot.blockedCourtIds || [])].sort((left, right) => left - right),
    }
  },

  toMinutes(timeText?: string | null) {
    if (!timeText) return null
    const matched = timeText.trim().match(/^(\d{1,2}):(\d{1,2})$/)
    if (!matched) return null
    const hour = Number(matched[1])
    const minute = Number(matched[2])
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
    return hour * 60 + minute
  },

  toTimeText(totalMinutes: number) {
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  },

  formatDateValue(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  },

  formatPriceYuan(priceInCents?: number) {
    const cents = Number(priceInCents)
    if (!Number.isFinite(cents)) return "--"
    return (cents / 100).toFixed(2)
  },

  createClientRequestId() {
    return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
  },

  confirmPromise(lines: string[]) {
    return new Promise<boolean>((resolve) => {
      confirmDialogResolver = resolve
      this.setData({
        confirmDialogVisible: true,
        confirmDialogVenueLine: lines[0] || "",
        confirmDialogDateLine: lines[1] || "",
        confirmDialogSlotLine: lines[2] || "",
      })
    })
  },

  onConfirmReservationDialog() {
    const resolver = confirmDialogResolver
    confirmDialogResolver = null

    this.setData({
      confirmDialogVisible: false,
    })

    if (resolver) {
      resolver(true)
    }
  },

  onCancelReservationDialog() {
    const resolver = confirmDialogResolver
    confirmDialogResolver = null

    this.setData({
      confirmDialogVisible: false,
    })

    if (resolver) {
      resolver(false)
    }
  },
})
