import type {
  MiniNotificationDetail,
  MiniNotificationType,
} from "../../api/notification/index"
import { getNotificationByIdApi } from "../../api/notification/index"
import { sanitizeRichHtml } from "../../utils/sanitize-html"

const TYPE_LABEL_MAP: Record<MiniNotificationType, string> = {
  1: "系统通知",
  2: "场地通知",
  3: "账号通知",
  4: "其它",
}

Page({
  data: {
    loading: false,
    detail: null as MiniNotificationDetail | null,
    typeLabel: "",
    safeContent: "",
  },

  onLoad(options) {
    const id = Number(options.id)
    if (!Number.isFinite(id) || id <= 0) {
      wx.showToast({
        title: "通知参数错误",
        icon: "none",
      })
      return
    }
    this.loadDetail(id)
  },

  async loadDetail(id: number) {
    this.setData({ loading: true })
    try {
      const res = await getNotificationByIdApi(id)
      const detail = res.data
      this.setData({
        detail,
        typeLabel: TYPE_LABEL_MAP[detail.type] || "未知类型",
        safeContent: sanitizeRichHtml(detail.content || ""),
      })
    } catch (error) {
      console.error("load notification detail failed:", error)
      wx.showToast({
        title: "通知详情加载失败",
        icon: "none",
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onBack() {
    if (getCurrentPages().length <= 1) {
      wx.reLaunch({
        url: "/pages/message/index",
      })
    }
  },
})
