import type { UserReservationRecord } from "../../api/reservation/index"
import type { ReservationStatusClassName } from "../../constants/reservation"
import { getReservationListByUserApi } from "../../api/reservation/index"
import { getReservationStatusMeta } from "../../constants/reservation"

type OverviewMock = {
  activeCount: number
  totalCount: number
}

type ReservationCardItem = {
  id: number
  title: string
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
    const statusMeta = getReservationStatusMeta(item.status)

    return {
      id: Number(item.id) || 100000000 + index,
      title: `${venueName}  ${courtText}`,
      statusText: statusMeta.text,
      statusClass: statusMeta.className,
      reservationDate,
      timeRange,
      amountText,
      createTimeText,
    }
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
