import type { Venue } from "../../api/venue/index"
import { getMiniappBannerListApi } from "../../api/miniapp-banner/index"
import { getVenueTypeListApi } from "../../api/venue-type/index"
import { getVenuePageApi } from "../../api/venue/index"

type TabValue = "all" | string
interface VenueTypeOption {
  label: string
  value: string
}
interface FilterOption extends VenueTypeOption {
  icon: string
}

interface DisplayVenue extends Venue {
  remaining: number
  progress: number
  priceYuan: string
}

interface BannerItem {
  id: number
  imageUrl: string
}

const SEARCH_DEBOUNCE_MS = 350

Page({
  data: {
    loading: false,
    refresherTriggered: false,
    bannerList: [] as BannerItem[],
    activeType: "all" as TabValue,
    typeOptions: [] as VenueTypeOption[],
    filterOptions: [
      {
        label: "全部",
        value: "all",
        icon: "apps-o",
      },
    ] as FilterOption[],
    searchKeyword: "",
    displayList: [] as DisplayVenue[],
    pageNum: 1,
    pageSize: 10,
    total: 0,
    noMore: false,
    loadingMore: false,
  },
  currentVenueList: [] as Venue[],
  searchDebounceTimer: 0 as number,

  onLoad() {
    this.onRefresherRefresh()
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: "场馆预约",
    })
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "home" })
      }
    }
  },

  onRefresherRefresh() {
    this.setData({ refresherTriggered: true })
    this.refreshHomeData(true)
  },

  onScrollToLower() {
    if (this.data.loading || this.data.loadingMore || this.data.noMore) {
      return
    }
    this.fetchVenueList(this.data.activeType, false)
  },

  async refreshHomeData(fromPullDown = false) {
    this.setData({ loading: true })
    try {
      await Promise.all([this.fetchBannerList(), this.fetchTypeOptions()])
      await this.fetchVenueList(this.data.activeType, true)
    } finally {
      if (fromPullDown) {
        this.setData({ refresherTriggered: false })
      }
      this.setData({ loading: false })
    }
  },

  async fetchBannerList() {
    try {
      const res = await getMiniappBannerListApi()
      const rawList = Array.isArray(res.data) ? res.data : []
      const bannerList = rawList
        .filter((item) => item && typeof item.id === "number" && Boolean(item.imageUrl))
        .map((item) => ({
          id: item.id,
          imageUrl: item.imageUrl,
        }))
      this.setData({ bannerList })
    } catch (error) {
      console.error("load miniapp banner list failed:", error)
      this.setData({ bannerList: [] })
    }
  },

  async fetchTypeOptions() {
    try {
      const res = await getVenueTypeListApi()
      const rawList = Array.isArray(res.data) ? res.data : []
      const nextTypeOptions: VenueTypeOption[] = rawList
        .filter((item) => typeof item.id === "number" && item.id > 0)
        .map((item) => ({
          label: item.name,
          value: String(item.id),
        }))

      const currentActiveType = String(this.data.activeType)
      const activeTypeExists =
        currentActiveType === "all" ||
        nextTypeOptions.some((item) => item.value === currentActiveType)

      this.setData({
        typeOptions: nextTypeOptions,
        filterOptions: this.buildFilterOptions(nextTypeOptions),
        activeType: activeTypeExists ? currentActiveType : "all",
      })
    } catch (error) {
      console.error("load venue type list failed:", error)
      wx.showToast({
        title: "类型加载失败",
        icon: "none",
      })
    }
  },

  async fetchVenueList(type: TabValue = "all", reset = true) {
    if (!reset && this.data.loadingMore) {
      return
    }

    const nextPageNum = reset ? 1 : this.data.pageNum + 1
    if (!reset) {
      this.setData({ loadingMore: true })
    }

    try {
      const numericTypeId = Number(type)
      const queryDTO =
        type === "all" || !Number.isFinite(numericTypeId) || numericTypeId <= 0
          ? undefined
          : { typeId: numericTypeId }

      const res = await getVenuePageApi({
        pageNum: nextPageNum,
        pageSize: this.data.pageSize,
        queryDTO,
      })
      const records = res.data && Array.isArray(res.data.records) ? res.data.records : []
      const validList = records.filter((item) => Number(item.status) === 1)
      const mergedList = reset ? validList : this.currentVenueList.concat(validList)
      const rawTotal = Number(res.data && res.data.total)
      const safeTotal = Number.isFinite(rawTotal) ? rawTotal : mergedList.length
      const noMore = mergedList.length >= safeTotal || records.length < this.data.pageSize

      this.currentVenueList = mergedList
      this.applyVenueFilters()
      this.setData({
        pageNum: nextPageNum,
        total: safeTotal,
        noMore,
      })
    } catch (error) {
      console.error("load venue list failed:", error)
      wx.showToast({
        title: "场馆加载失败",
        icon: "none",
      })
      if (reset) {
        this.currentVenueList = []
        this.setData({
          pageNum: 1,
          total: 0,
          noMore: false,
        })
      }
    } finally {
      if (!reset) {
        this.setData({ loadingMore: false })
      }
    }
  },

  onTypeTap(event: WechatMiniprogram.BaseEvent) {
    const { value } = event.currentTarget.dataset as { value?: string }
    const activeType = typeof value === "string" && value ? value : "all"
    if (activeType === this.data.activeType) {
      return
    }

    this.setData({ activeType })
    this.refreshVenueListByActiveType()
  },

  async refreshVenueListByActiveType() {
    this.setData({ loading: true })
    try {
      await this.fetchVenueList(this.data.activeType, true)
    } finally {
      this.setData({ loading: false })
    }
  },

  onSearchInput(event: WechatMiniprogram.BaseEvent) {
    const detail = event.detail as { value?: string }
    const rawValue = detail.value
    const searchKeyword = typeof rawValue === "string" ? rawValue : ""
    this.setData({ searchKeyword })
    this.scheduleSearch()
  },

  onSearchConfirm() {
    this.cancelScheduledSearch()
    this.applyVenueFilters()
  },

  onSearchClear() {
    this.cancelScheduledSearch()
    if (!this.data.searchKeyword) {
      return
    }
    this.setData({ searchKeyword: "" })
    this.applyVenueFilters()
  },

  scheduleSearch() {
    this.cancelScheduledSearch()
    this.searchDebounceTimer = setTimeout(() => {
      this.applyVenueFilters()
      this.searchDebounceTimer = 0
    }, SEARCH_DEBOUNCE_MS) as unknown as number
  },

  cancelScheduledSearch() {
    if (!this.searchDebounceTimer) {
      return
    }
    clearTimeout(this.searchDebounceTimer)
    this.searchDebounceTimer = 0
  },

  buildFilterOptions(typeOptions: VenueTypeOption[]) {
    return [
      {
        label: "全部",
        value: "all",
        icon: "apps-o",
      },
      ...typeOptions.map((item) => ({
        ...item,
        icon: this.pickTypeIcon(item.label),
      })),
    ]
  },

  pickTypeIcon(label: string) {
    if (label.indexOf("羽毛") > -1) {
      return "fire-o"
    }
    if (label.indexOf("乒乓") > -1 || label.indexOf("桌球") > -1) {
      return "points"
    }
    if (label.indexOf("足球") > -1) {
      return "flag-o"
    }
    if (label.indexOf("篮球") > -1) {
      return "shop-o"
    }
    if (label.indexOf("网球") > -1) {
      return "photo-o"
    }
    if (label.indexOf("跑") > -1 || label.indexOf("田径") > -1) {
      return "guide-o"
    }
    return "label-o"
  },

  applyVenueFilters() {
    const keyword = this.data.searchKeyword.trim().toLowerCase()
    const filteredList = this.currentVenueList.filter((item) => {
      if (!keyword) {
        return true
      }
      const name = typeof item.name === "string" ? item.name.toLowerCase() : ""
      const location = typeof item.location === "string" ? item.location.toLowerCase() : ""
      return name.indexOf(keyword) > -1 || location.indexOf(keyword) > -1
    })
    this.updateDisplayList(filteredList)
  },

  updateDisplayList(list: Venue[]) {
    const displayList: DisplayVenue[] = list.map((item) => {
      const remainingValue =
        item.remaining === undefined || item.remaining === null ? 0 : item.remaining
      const remaining = Math.max(0, remainingValue)
      const total = Math.max(0, item.total || 0)
      const progress = total > 0 ? Math.min(100, (remaining / total) * 100) : 0
      const priceCents = Number(item.pricePerHour)
      const priceYuan = Number.isFinite(priceCents) ? (priceCents / 100).toFixed(2) : "--"
      return {
        ...item,
        remaining,
        progress,
        priceYuan,
      }
    })

    this.setData({ displayList })
  },

  onVenueTap(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: number }
    const venueId = Number(id)
    if (!Number.isFinite(venueId) || venueId <= 0) {
      wx.showToast({
        title: "场馆参数错误",
        icon: "none",
      })
      return
    }

    wx.navigateTo({
      url: `/pages/venue-detail/index?id=${venueId}`,
    })
  },
})
