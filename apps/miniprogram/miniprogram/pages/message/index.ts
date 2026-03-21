import type {
  MiniNotificationItem,
  MiniNotificationType,
} from "../../api/notification/index"
import { getNotificationPageApi } from "../../api/notification/index"

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
    loadingMore: false,
    refresherTriggered: false,
    list: [] as MessageDisplayItem[],
    pageNum: 1,
    pageSize: 10,
    total: 0,
    noMore: false,
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: "通知消息",
    })
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "message" })
      }
    }
    this.loadNotifications(true)
  },

  async onRefresherRefresh() {
    this.setData({ refresherTriggered: true })
    await this.loadNotifications(true)
    this.setData({ refresherTriggered: false })
  },

  onScrollToLower() {
    if (this.data.loading || this.data.loadingMore || this.data.noMore) {
      return
    }
    this.loadNotifications(false)
  },

  async loadNotifications(reset: boolean) {
    if (!reset && this.data.loadingMore) {
      return
    }

    const nextPageNum = reset ? 1 : this.data.pageNum + 1
    this.setData({
      loading: reset,
      loadingMore: !reset,
    })

    try {
      const res = await getNotificationPageApi({
        pageNum: nextPageNum,
        pageSize: this.data.pageSize,
      })
      const records = res.data && Array.isArray(res.data.records) ? res.data.records : []
      const pageList = records.map((item) => ({
        ...item,
        typeLabel: TYPE_LABEL_MAP[item.type] || "未知类型",
      }))
      const mergedList = reset ? pageList : this.data.list.concat(pageList)
      const rawTotal = Number(res.data && res.data.total)
      const safeTotal = Number.isFinite(rawTotal) ? rawTotal : mergedList.length
      const noMore = mergedList.length >= safeTotal || records.length < this.data.pageSize

      this.setData({
        list: mergedList,
        pageNum: nextPageNum,
        total: safeTotal,
        noMore,
      })
    } catch (error) {
      console.error("load notifications failed:", error)
      wx.showToast({
        title: "通知加载失败",
        icon: "none",
      })
      if (reset) {
        this.setData({
          list: [],
          pageNum: 1,
          total: 0,
          noMore: false,
        })
      }
    } finally {
      this.setData({
        loading: false,
        loadingMore: false,
      })
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
