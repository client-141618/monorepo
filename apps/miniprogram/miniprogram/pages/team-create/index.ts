import type { UserReservationRecord } from "../../api/reservation/index"
import { getReservationListByUserApi } from "../../api/reservation/index"
import { createTeamApi } from "../../api/team/index"

type ReservationOption = {
  label: string
  value: number
  titleSuggestion: string
}

type ContactTypeOption = {
  label: string
  value: number
}

type PageLoadOptions = {
  reservationId?: string
  suggestTitle?: string
}

Page({
  data: {
    loadingReservations: false,
    submitting: false,
    reservationOptions: [] as ReservationOption[],
    reservationPickerIndex: 0,
    currentReservationLabel: "",
    preselectedReservationId: 0,
    prefilledTitle: "",
    title: "",
    description: "",
    deadlineDate: "",
    deadlineTimeOnly: "",
    requiredCountText: "2",
    contactTypeOptions: [
      { label: "手机号", value: 1 },
      { label: "微信", value: 2 },
      { label: "QQ", value: 3 },
    ] as ContactTypeOption[],
    contactTypeIndex: 1,
    currentContactTypeLabel: "微信",
    contactValue: "",
  },

  onLoad(options: PageLoadOptions) {
    const preselectedReservationId = Number(options.reservationId || 0)
    const prefilledTitle = this.decodeQueryText(options.suggestTitle)
    const now = new Date()
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const deadlineDate = this.formatDate(oneDayLater)
    const deadlineTimeOnly = "20:00"

    this.setData({
      preselectedReservationId: Number.isFinite(preselectedReservationId)
        ? preselectedReservationId
        : 0,
      prefilledTitle,
      title: prefilledTitle || "",
      deadlineDate,
      deadlineTimeOnly,
      currentContactTypeLabel: this.data.contactTypeOptions[this.data.contactTypeIndex].label,
    })

    this.loadReservations()
  },

  decodeQueryText(raw: unknown) {
    if (typeof raw !== "string" || !raw) {
      return ""
    }
    try {
      return decodeURIComponent(raw)
    } catch (_error) {
      return raw
    }
  },

  async loadReservations() {
    this.setData({ loadingReservations: true })
    try {
      const res = await getReservationListByUserApi()
      const sourceList = Array.isArray(res.data) ? res.data : []
      const options = this.buildReservationOptions(sourceList)

      if (!options.length) {
        this.setData({
          reservationOptions: [],
          reservationPickerIndex: 0,
          currentReservationLabel: "",
        })
        return
      }

      const defaultIndex = this.resolveInitialReservationIndex(options)
      const currentOption = options[defaultIndex]
      const nextTitle = this.data.title || currentOption.titleSuggestion

      this.setData({
        reservationOptions: options,
        reservationPickerIndex: defaultIndex,
        currentReservationLabel: currentOption.label,
        title: nextTitle,
      })
    } catch (error) {
      console.error("load reservations failed:", error)
      wx.showToast({
        title: "预约数据加载失败",
        icon: "none",
      })
      this.setData({
        reservationOptions: [],
        reservationPickerIndex: 0,
        currentReservationLabel: "",
      })
    } finally {
      this.setData({ loadingReservations: false })
    }
  },

  buildReservationOptions(sourceList: UserReservationRecord[]) {
    const activeList = sourceList.filter((item) => Number(item.status) === 1)
    const list = activeList.length ? activeList : sourceList

    return list
      .map((item) => {
        const reservationId = Number(item.id)
        if (!Number.isFinite(reservationId) || reservationId <= 0) {
          return null
        }
        const venueName = item.venueName || "场馆"
        const dateText = item.reservationDate || "--"
        const timeText = this.resolveTimeRange(item.startTime, item.endTime)
        return {
          label: `#${reservationId} ${venueName} ${dateText} ${timeText}`,
          value: reservationId,
          titleSuggestion: `${dateText} ${venueName} 缺人组队`,
        }
      })
      .filter((item): item is ReservationOption => Boolean(item))
  },

  resolveTimeRange(startTime: unknown, endTime: unknown) {
    const start = typeof startTime === "string" ? startTime : ""
    const end = typeof endTime === "string" ? endTime : ""
    if (start && end) {
      return `${start}-${end}`
    }
    if (start) {
      return start
    }
    return "时段待定"
  },

  resolveInitialReservationIndex(options: ReservationOption[]) {
    const targetId = Number(this.data.preselectedReservationId)
    if (Number.isFinite(targetId) && targetId > 0) {
      const index = options.findIndex((item) => item.value === targetId)
      if (index >= 0) {
        return index
      }
    }
    return 0
  },

  onReservationChange(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string | number }
    const rawIndex = Number(detail.value)
    if (!Number.isFinite(rawIndex)) {
      return
    }
    const nextIndex = Math.max(0, Math.min(rawIndex, this.data.reservationOptions.length - 1))
    const option = this.data.reservationOptions[nextIndex]
    if (!option) {
      return
    }

    const title = this.data.prefilledTitle ? this.data.prefilledTitle : option.titleSuggestion
    this.setData({
      reservationPickerIndex: nextIndex,
      currentReservationLabel: option.label,
      title,
    })
  },

  onTitleInput(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string }
    this.setData({
      title: typeof detail.value === "string" ? detail.value : "",
    })
  },

  onDescriptionInput(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string }
    this.setData({
      description: typeof detail.value === "string" ? detail.value : "",
    })
  },

  onDeadlineDateChange(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string }
    this.setData({
      deadlineDate: typeof detail.value === "string" ? detail.value : this.data.deadlineDate,
    })
  },

  onDeadlineTimeChange(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string }
    this.setData({
      deadlineTimeOnly:
        typeof detail.value === "string" ? detail.value : this.data.deadlineTimeOnly,
    })
  },

  onRequiredCountInput(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string }
    const rawValue = typeof detail.value === "string" ? detail.value : ""
    const digitsOnly = rawValue.replace(/[^\d]/g, "")
    this.setData({
      requiredCountText: digitsOnly,
    })
  },

  onContactTypeChange(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string | number }
    const rawIndex = Number(detail.value)
    if (!Number.isFinite(rawIndex)) {
      return
    }
    const nextIndex = Math.max(0, Math.min(rawIndex, this.data.contactTypeOptions.length - 1))
    const option = this.data.contactTypeOptions[nextIndex]
    this.setData({
      contactTypeIndex: nextIndex,
      currentContactTypeLabel: option ? option.label : "微信",
    })
  },

  onContactValueInput(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string }
    this.setData({
      contactValue: typeof detail.value === "string" ? detail.value : "",
    })
  },

  getCurrentReservationId() {
    const option = this.data.reservationOptions[this.data.reservationPickerIndex]
    if (!option) {
      return 0
    }
    return Number(option.value) || 0
  },

  buildDeadlineTimeValue() {
    if (!this.data.deadlineDate || !this.data.deadlineTimeOnly) {
      return ""
    }
    return `${this.data.deadlineDate}T${this.data.deadlineTimeOnly}:00`
  },

  validatePayload() {
    const reservationId = this.getCurrentReservationId()
    if (!reservationId) {
      return "请选择关联预约"
    }

    const title = this.data.title.trim()
    if (!title) {
      return "请输入组队标题"
    }

    const deadlineTime = this.buildDeadlineTimeValue()
    if (!deadlineTime) {
      return "请选择截止日期和时间"
    }

    const requiredCount = Number(this.data.requiredCountText)
    if (!Number.isFinite(requiredCount) || requiredCount < 2) {
      return "总人数至少为2"
    }

    const contactValue = this.data.contactValue.trim()
    if (!contactValue) {
      return "请输入联系方式"
    }

    return ""
  },

  async onSubmit() {
    if (this.data.submitting) {
      return
    }
    const validationError = this.validatePayload()
    if (validationError) {
      wx.showToast({
        title: validationError,
        icon: "none",
      })
      return
    }

    const reservationId = this.getCurrentReservationId()
    const title = this.data.title.trim()
    const description = this.data.description.trim()
    const deadlineTime = this.buildDeadlineTimeValue()
    const requiredCount = Number(this.data.requiredCountText)
    const contactTypeOption = this.data.contactTypeOptions[this.data.contactTypeIndex]
    const contactType = contactTypeOption ? contactTypeOption.value : 2
    const contactValue = this.data.contactValue.trim()

    this.setData({ submitting: true })
    try {
      await createTeamApi({
        reservationId,
        title,
        description,
        deadlineTime,
        requiredCount,
        contactType,
        contactValue,
      })
      wx.showToast({
        title: "发起成功",
        icon: "success",
      })
      setTimeout(() => {
        wx.switchTab({
          url: "/pages/team/index",
        })
      }, 500)
    } catch (error) {
      const message = (error as Error).message || "发起失败，请稍后重试"
      wx.showToast({
        title: message,
        icon: "none",
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  formatDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  },
})
