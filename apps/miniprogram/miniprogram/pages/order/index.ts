import type { UserReservationRecord } from "../../api/reservation/index"
import type { ReservationStatusClassName } from "../../constants/reservation"
import {
  cancelReservationApi,
  checkInReservationApi,
  getReservationPageByUserApi,
  getReservationUserCountApi,
} from "../../api/reservation/index"
import {
  getReservationStatusMeta,
} from "../../constants/reservation"

type OverviewCardItem = {
  key: string
  label: string
  value: number
  className: string
}

type ReservationDetailLine = {
  key: string
  label: string
  value: string
  valueClassName?: string
}

type ReservationCardItem = {
  id: number
  title: string
  status: number
  statusText: string
  statusClass: ReservationStatusClassName
  detailLines: ReservationDetailLine[]
}

type FuzzyLocationPayload = {
  latitudeGcj02: number
  longitudeGcj02: number
  locationAccuracy: number
}

Page({
  data: {
    loading: false,
    loadingMore: false,
    refresherTriggered: false,
    overviewCards: [
      {
        key: "active",
        label: "进行中预约",
        value: 0,
        className: "overview-card--active",
      },
      {
        key: "total",
        label: "总预约",
        value: 0,
        className: "overview-card--total",
      },
    ] as OverviewCardItem[],
    reservationList: [] as ReservationCardItem[],
    checkInLoadingId: 0,
    cancelLoadingId: 0,
    errorText: "",
    pageNum: 1,
    pageSize: 10,
    total: 0,
    noMore: false,
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: "预定",
    })
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "order" })
      }
    }
    this.loadReservationList(true)
  },

  async onRefresherRefresh() {
    this.setData({ refresherTriggered: true })
    await this.loadReservationList(true)
    this.setData({ refresherTriggered: false })
  },

  onScrollToLower() {
    if (this.data.loading || this.data.loadingMore || this.data.noMore) {
      return
    }
    this.loadReservationList(false)
  },

  async loadReservationList(reset: boolean) {
    if (!reset && this.data.loadingMore) {
      return
    }

    const nextPageNum = reset ? 1 : this.data.pageNum + 1
    this.setData({
      loading: reset,
      loadingMore: !reset,
      errorText: "",
    })

    try {
      const requestTasks: Array<Promise<unknown>> = [
        getReservationPageByUserApi({
          pageNum: nextPageNum,
          pageSize: this.data.pageSize,
        }),
      ]
      if (reset) {
        requestTasks.push(getReservationUserCountApi())
      }

      const [listResRaw, countResRaw] = await Promise.all(requestTasks)
      const listRes = listResRaw as { data?: { records?: UserReservationRecord[]; total?: number } }
      const records = listRes.data && Array.isArray(listRes.data.records) ? listRes.data.records : []
      const reservationPageList = records.map((item, index) =>
        this.toReservationCardItem(item, index),
      )
      const reservationList = reset
        ? reservationPageList
        : this.data.reservationList.concat(reservationPageList)
      const rawTotal = Number(listRes.data && listRes.data.total)
      const safeTotal = Number.isFinite(rawTotal) ? rawTotal : reservationList.length
      const noMore = reservationList.length >= safeTotal || records.length < this.data.pageSize

      let overviewCards = this.data.overviewCards
      if (reset && countResRaw) {
        const countRes = countResRaw as { data?: { pendingVerificationCount?: number; totalCount?: number } }
        overviewCards = this.toOverviewCards(countRes.data || {})
      }

      this.setData({
        overviewCards,
        reservationList,
        pageNum: nextPageNum,
        total: safeTotal,
        noMore,
        errorText: "",
      })
    } catch (error) {
      console.error("load reservation list failed:", error)
      if (reset) {
        this.setData({
          overviewCards: this.toOverviewCards({}),
          reservationList: [],
          pageNum: 1,
          total: 0,
          noMore: false,
          errorText: "预定记录加载失败，请下拉重试",
        })
      }
    } finally {
      this.setData({
        loading: false,
        loadingMore: false,
      })
    }
  },

  toOverviewCards(raw: {
    pendingVerificationCount?: number
    totalCount?: number
  }) {
    const pendingVerificationCount = Number(raw.pendingVerificationCount)
    const totalCount = Number(raw.totalCount)
    return [
      {
        key: "active",
        label: "进行中预约",
        value: Number.isFinite(pendingVerificationCount) ? pendingVerificationCount : 0,
        className: "overview-card--active",
      },
      {
        key: "total",
        label: "总预约",
        value: Number.isFinite(totalCount) ? totalCount : 0,
        className: "overview-card--total",
      },
    ] as OverviewCardItem[]
  },

  toReservationCardItem(item: UserReservationRecord, index: number): ReservationCardItem {
    const venueName =
      (typeof item.venueName === "string" && item.venueName.trim()) ||
      (item.venueId ? `场馆 #${item.venueId}` : "未命名场馆")

    const reservationDate =
      (typeof item.reservationDate === "string" && item.reservationDate) || "日期待定"

    const startTime = typeof item.startTime === "string" ? item.startTime : ""
    const endTime = typeof item.endTime === "string" ? item.endTime : ""
    const timeRange =
      startTime && endTime ? `${startTime} - ${endTime}` : "时段待定"

    const courtText =
      typeof item.courtId === "number" ? `${item.courtId}号场` : "场地待定"

    const amountText = this.formatAmount(item.totalPrice)
    const createTimeText = this.formatDateTime(item.createTime)
    const statusValue = Number(item.status)
    const status = Number.isFinite(statusValue) ? statusValue : -1
    const statusMeta = getReservationStatusMeta(status)
    const detailLines = [
      {
        key: "reservationDate",
        label: "预约日期",
        value: reservationDate,
      },
      {
        key: "timeRange",
        label: "预约时段",
        value: timeRange,
      },
      {
        key: "amount",
        label: "金额",
        value: amountText,
        valueClassName: "reservation-card__value--price",
      },
      {
        key: "createTime",
        label: "创建时间",
        value: createTimeText,
      },
    ].filter((line) => Boolean(line.value))

    return {
      id: Number(item.id) || 100000000 + index,
      title: `${venueName}  ${courtText}`,
      status,
      statusText: statusMeta.text,
      statusClass: statusMeta.className,
      detailLines,
    }
  },

  async onTapCheckIn(event: WechatMiniprogram.BaseEvent) {
    const reservationId = Number(event.currentTarget.dataset.reservationId || 0)
    if (!reservationId) return
    if (Number(this.data.checkInLoadingId) > 0) return

    this.setData({ checkInLoadingId: reservationId })
    try {
      const locationPayload = await this.getFuzzyLocationPayload()

      const qrContent = await this.scanQrCode()
      if (!qrContent) {
        return
      }

      await checkInReservationApi({
        reservationId,
        qrContent,
        latitudeGcj02: locationPayload.latitudeGcj02,
        longitudeGcj02: locationPayload.longitudeGcj02,
        locationAccuracy: locationPayload.locationAccuracy,
      })

      wx.showToast({
        title: "核销成功",
        icon: "success",
      })

      await this.loadReservationList(true)
    } catch (error) {
      const message = (error as Error).message || "核销失败，请稍后重试"
      wx.showToast({
        title: message,
        icon: "none",
      })
    } finally {
      this.setData({ checkInLoadingId: 0 })
    }
  },

  async onTapCancelReservation(event: WechatMiniprogram.BaseEvent) {
    const reservationId = Number(event.currentTarget.dataset.reservationId || 0)
    if (!reservationId) return
    if (Number(this.data.checkInLoadingId) > 0 || Number(this.data.cancelLoadingId) > 0) return

    const confirmed = await this.confirmCancelReservation()
    if (!confirmed) return

    this.setData({ cancelLoadingId: reservationId })
    try {
      await cancelReservationApi(reservationId)

      wx.showToast({
        title: "取消成功",
        icon: "success",
      })

      await this.loadReservationList(true)
    } catch (error) {
      const message = (error as Error).message || "取消失败，请稍后重试"
      wx.showToast({
        title: message,
        icon: "none",
      })
    } finally {
      this.setData({ cancelLoadingId: 0 })
    }
  },

  scanQrCode() {
    return new Promise<string>((resolve, reject) => {
      wx.scanCode({
        onlyFromCamera: true,
        scanType: ["qrCode"],
        success: (res) => {
          const result = typeof res.result === "string" ? res.result.trim() : ""
          if (!result) {
            reject(new Error("二维码内容为空"))
            return
          }
          resolve(result)
        },
        fail: (error) => {
          const errMsg =
            error && typeof error.errMsg === "string" ? error.errMsg : ""
          if (errMsg.indexOf("cancel") >= 0) {
            resolve("")
            return
          }
          reject(error)
        },
      })
    })
  },

  getFuzzyLocationPayload() {
    return new Promise<FuzzyLocationPayload>((resolve, reject) => {
      wx.getFuzzyLocation({
        type: "gcj02",
        success: (res) => {
          const latitude = Number(res.latitude)
          const longitude = Number(res.longitude)
          const accuracy = Number(res.accuracy)

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            reject(new Error("获取定位失败，请重试"))
            return
          }

          resolve({
            latitudeGcj02: this.roundToFixed(latitude, 6),
            longitudeGcj02: this.roundToFixed(longitude, 6),
            locationAccuracy: Number.isFinite(accuracy) ? this.roundToFixed(accuracy, 2) : 0,
          })
        },
        fail: (error) => {
          const errMsg =
            error && typeof error.errMsg === "string" ? error.errMsg : ""
          if (
            errMsg.indexOf("auth deny") >= 0 ||
            errMsg.indexOf("scope.userFuzzyLocation") >= 0 ||
            errMsg.indexOf("cancel") >= 0
          ) {
            reject(new Error("您已取消授权"))
            return
          }
          reject(new Error("获取定位失败，请稍后重试"))
        },
      })
    })
  },

  confirmCancelReservation() {
    return new Promise<boolean>((resolve) => {
      wx.showModal({
        title: "确认取消",
        content: "取消后该预约将无法继续签到，是否继续？",
        confirmText: "确认取消",
        confirmColor: "#dc2626",
        success: (res) => {
          resolve(Boolean(res.confirm))
        },
        fail: () => {
          resolve(false)
        },
      })
    })
  },

  formatAmount(totalPrice: unknown) {
    const value = Number(totalPrice)
    if (!Number.isFinite(value)) {
      return ""
    }
    return `¥${(value / 100).toFixed(2)}`
  },

  formatDateTime(raw: unknown) {
    if (typeof raw !== "string") {
      return ""
    }
    return raw.replace("T", " ")
  },

  roundToFixed(value: number, fractionDigits: number) {
    return Number(value.toFixed(fractionDigits))
  },
})
