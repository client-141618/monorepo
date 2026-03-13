import type {
  MiniNotificationItem,
  MiniNotificationType,
} from "../../api/notification/index"
import { getNotificationListApi } from "../../api/notification/index"

interface MessageDisplayItem extends MiniNotificationItem {
  typeLabel: string
}

const TYPE_LABEL_MAP: Record<MiniNotificationType, string> = {
  1: "系统通知",
  2: "场地通知",
  3: "账号通知",
  4: "其它",
}

Page({
  data: {
    loading: false,
    list: [] as MessageDisplayItem[],
  },

  onShow() {
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "message" })
      }
    }
    this.loadNotifications()
  },

  async loadNotifications() {
    this.setData({ loading: true })
    try {
      const res = await getNotificationListApi()
      const list = (res.data || []).map((item) => ({
        ...item,
        typeLabel: TYPE_LABEL_MAP[item.type] || "未知类型",
      }))
      this.setData({ list })
    } catch (error) {
      console.error("load notifications failed:", error)
      wx.showToast({
        title: "通知加载失败",
        icon: "none",
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onTapItem(event: WechatMiniprogram.BaseEvent) {
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(id) || id <= 0) {
      return
    }
    wx.navigateTo({
      url: `/pages/message-detail/index?id=${id}`,
    })
  },
})

