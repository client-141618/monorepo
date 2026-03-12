import { getVenueListApi, type Venue } from "../../api/venue/index"
import { VENUE_TYPE_OPTIONS } from "../../constants/venue"

type TabValue = "all" | string

interface DisplayVenue extends Venue {
  remaining: number
  progress: number
}

Page({
  data: {
    loading: false,
    activeType: "all" as TabValue,
    typeOptions: VENUE_TYPE_OPTIONS,
    list: [] as Venue[],
    displayList: [] as DisplayVenue[],
  },

  onLoad() {
    this.fetchVenueList()
  },

  async fetchVenueList() {
    this.setData({ loading: true })
    try {
      const res = await getVenueListApi()
      const validList = (res.data || []).filter((item) => item.status === 1)
      this.setData({ list: validList })
      this.updateDisplayList()
    } catch (error) {
      console.error("load venue list failed:", error)
      wx.showToast({
        title: "场馆加载失败",
        icon: "none",
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onTypeChange(event: WechatMiniprogram.CustomEvent<{ name: string | number }>) {
    this.setData({ activeType: String(event.detail.name) }, () => this.updateDisplayList())
  },

  updateDisplayList() {
    const { list, activeType } = this.data
    const filtered =
      activeType === "all"
        ? list
        : list.filter((item) => String(item.type) === activeType)

    const displayList: DisplayVenue[] = filtered.map((item) => {
      const remaining = Math.max(0, item.remaining ?? 0)
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
