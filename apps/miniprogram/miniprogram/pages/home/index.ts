import type { Venue } from "../../api/venue/index"
import { getVenueListApi, getVenueListByTypeApi } from "../../api/venue/index"
import { VENUE_TYPE_OPTIONS } from "../../constants/venue"

type TabValue = "all" | string

interface DisplayVenue extends Venue {
  remaining: number
  progress: number
}

Page({
  data: {
    loading: false,
    refresherTriggered: false,
    activeType: "all" as TabValue,
    typeOptions: VENUE_TYPE_OPTIONS,
    displayList: [] as DisplayVenue[],
  },

  onLoad() {
    this.onRefresherRefresh()
  },

  onShow() {
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "home" })
      }
    }
  },

  onRefresherRefresh() {
    this.setData({ refresherTriggered: true })
    this.fetchVenueList(this.data.activeType, true)
  },

  async fetchVenueList(type: TabValue = "all", fromPullDown = false) {
    this.setData({ loading: true })
    try {
      const res =
        type === "all" ? await getVenueListApi() : await getVenueListByTypeApi(String(type))
      const validList = (res.data || []).filter((item) => item.status === 1)
      this.updateDisplayList(validList)
    } catch (error) {
      console.error("load venue list failed:", error)
      wx.showToast({
        title: "场馆加载失败",
        icon: "none",
      })
    } finally {
      if (fromPullDown) {
        this.setData({ refresherTriggered: false })
      }
      this.setData({ loading: false })
    }
  },

  onTypeChange(event: WechatMiniprogram.CustomEvent<{ name: string | number }>) {
    const activeType = String(event.detail.name)
    this.setData({ activeType })
    this.fetchVenueList(activeType)
  },

  updateDisplayList(list: Venue[]) {
    const displayList: DisplayVenue[] = list.map((item) => {
      const remainingValue =
        item.remaining === undefined || item.remaining === null ? 0 : item.remaining
      const remaining = Math.max(0, remainingValue)
      const total = Math.max(0, item.total || 0)
      const progress = total > 0 ? Math.min(100, (remaining / total) * 100) : 0
      return {
        ...item,
        remaining,
        progress,
      }
    })

    this.setData({ displayList })
  },
})

