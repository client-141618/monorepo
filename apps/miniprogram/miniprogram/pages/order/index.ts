import type { UserReservationRecord } from "../../api/reservation/index"
import type { ReservationStatusClassName } from "../../constants/reservation"
import {
  checkInReservationApi,
  getReservationListByUserApi,
} from "../../api/reservation/index"
import {
  getReservationStatusMeta,
} from "../../constants/reservation"

type OverviewMock = {
  activeCount: number
  totalCount: number
}

type ReservationCardItem = {
  id: number
  title: string
  status: number
  statusText: string
  statusClass: ReservationStatusClassName
  reservationDate: string
  timeRange: string
  amountText: string
  createTimeText: string
}

Page({
  data: {
    loading: false,
    refresherTriggered: false,
    overviewMock: {
      activeCount: 3,
      totalCount: 12,
    } as OverviewMock,
    reservationList: [] as ReservationCardItem[],
    checkInLoadingId: 0,
    errorText: "",
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
    this.loadReservationList()
  },

  async onRefresherRefresh() {
    this.setData({ refresherTriggered: true })
    await this.loadReservationList()
    this.setData({ refresherTriggered: false })
  },

  async loadReservationList() {
    this.setData({
      loading: true,
      errorText: "",
    })

    try {
      const res = await getReservationListByUserApi()
      const list = Array.isArray(res.data) ? res.data : []
      const reservationList = list.map((item, index) =>
        this.toReservationCardItem(item, index),
      )

      this.setData({
        reservationList,
        errorText: "",
      })
    } catch (error) {
      console.error("load reservation list failed:", error)
      this.setData({
        reservationList: [],
        errorText: "预定记录加载失败，请下拉重试",
      })
    } finally {
      this.setData({ loading: false })
    }
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
    const createTimeText =
      this.formatDateTime(item.createTime)
    const statusValue = Number(item.status)
    const status = Number.isFinite(statusValue) ? statusValue : -1
    const statusMeta = getReservationStatusMeta(status)

    return {
      id: Number(item.id) || 100000000 + index,
      title: `${venueName}  ${courtText}`,
      status,
      statusText: statusMeta.text,
      statusClass: statusMeta.className,
      reservationDate,
      timeRange,
      amountText,
      createTimeText,
    }
  },

  async onTapCheckIn(event: WechatMiniprogram.BaseEvent) {
    const reservationId = Number(event.currentTarget.dataset.reservationId || 0)
    if (!reservationId) return
    if (Number(this.data.checkInLoadingId) > 0) return

    this.setData({ checkInLoadingId: reservationId })
    try {
      const qrContent = await this.scanQrCode()
      if (!qrContent) {
        return
      }

      await checkInReservationApi({
        reservationId,
        qrContent,
      })

      wx.showToast({
        title: "核销成功",
        icon: "success",
      })

      await this.loadReservationList()
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
})
