import type { TeamRecruitmentListItem } from "../../api/team/index"
import type { Venue } from "../../api/venue/index"
import {
  closeTeamApi,
  getTeamDetailApi,
  getTeamPageApi,
  joinTeamApi,
  quitTeamApi,
} from "../../api/team/index"
import { getVenuePageApi } from "../../api/venue/index"
import {
  CACHE_TOKEN_STORAGE_KEY,
  DEFAULT_PROFILE_AVATAR,
  DEFAULT_PROFILE_NAME,
} from "../../constants/profile"

type TeamStatusOption = {
  label: string
  value: number
}

type VenueOption = {
  label: string
  value: number
}

type TeamCardItem = TeamRecruitmentListItem & {
  deadlineText: string
  courtText: string
  progressText: string
  statusText: string
  statusType: "primary" | "success" | "warning" | "danger"
  canJoin: boolean
  canQuit: boolean
  canClose: boolean
  actionLabel: string
  actionKind: "join" | "quit" | "close" | "none"
  memberProfiles: Array<{
    wxUserId: number
    username: string
    avatar: string
  }>
}

const TEAM_STATUS_RECRUITING = 1

Page({
  data: {
    loading: false,
    loadingMore: false,
    refresherTriggered: false,
    noMore: false,
    errorText: "",
    pageNum: 1,
    pageSize: 10,
    total: 0,
    filterDate: "",
    venueOptions: [
      {
        label: "全部场馆",
        value: 0,
      },
    ] as VenueOption[],
    venuePickerIndex: 0,
    statusOptions: [
      { label: "全部状态", value: 0 },
      { label: "招募中", value: 1 },
      { label: "已满", value: 2 },
      { label: "已关闭", value: 3 },
      { label: "已过期", value: 4 },
      { label: "已取消", value: 5 },
    ] as TeamStatusOption[],
    statusPickerIndex: 0,
    currentVenueLabel: "全部场馆",
    currentStatusLabel: "全部状态",
    teamList: [] as TeamCardItem[],
    actionLoadingId: 0,
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: "组队大厅",
    })
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "team" })
      }
    }

    this.ensureBaseData()
  },

  async ensureBaseData() {
    if (!this.data.venueOptions || this.data.venueOptions.length <= 1) {
      await this.loadVenueOptions()
    }
    await this.fetchTeamList(true)
  },

  async loadVenueOptions() {
    try {
      const res = await getVenuePageApi({
        pageNum: 1,
        pageSize: 100,
      })
      const sourceList = res.data && Array.isArray(res.data.records) ? res.data.records : []
      const enabledList = sourceList.filter((item) => Number(item.status) === 1)
      const venueOptions = this.buildVenueOptions(enabledList)
      const currentVenueValue = this.getCurrentVenueValue()
      const nextVenueIndex = this.findVenueIndexByValue(venueOptions, currentVenueValue)

      this.setData({
        venueOptions,
        venuePickerIndex: nextVenueIndex,
        currentVenueLabel: venueOptions[nextVenueIndex].label,
      })
    } catch (error) {
      console.error("load venue options failed:", error)
      this.setData({
        venueOptions: [
          {
            label: "全部场馆",
            value: 0,
          },
        ],
        venuePickerIndex: 0,
        currentVenueLabel: "全部场馆",
      })
    }
  },

  buildVenueOptions(list: Venue[]) {
    const seen = new Set<number>()
    const options: VenueOption[] = [
      {
        label: "全部场馆",
        value: 0,
      },
    ]

    list.forEach((item) => {
      const venueId = Number(item.id)
      if (!Number.isFinite(venueId) || venueId <= 0 || seen.has(venueId)) {
        return
      }
      seen.add(venueId)
      options.push({
        label: item.name || `场馆#${venueId}`,
        value: venueId,
      })
    })

    return options
  },

  findVenueIndexByValue(options: VenueOption[], value: number) {
    const index = options.findIndex((item) => item.value === value)
    if (index < 0) {
      return 0
    }
    return index
  },

  getCurrentVenueValue() {
    const option = this.data.venueOptions[this.data.venuePickerIndex]
    if (!option) {
      return 0
    }
    return Number(option.value) || 0
  },

  getCurrentStatusValue() {
    const option = this.data.statusOptions[this.data.statusPickerIndex]
    if (!option) {
      return 0
    }
    return Number(option.value) || 0
  },

  onDateChange(event: WechatMiniprogram.CustomEvent) {
    const detail = event.detail as { value?: string }
    const filterDate = typeof detail.value === "string" ? detail.value : ""
    this.setData({ filterDate })
    this.fetchTeamList(true)
  },

  onClearDate() {
    if (!this.data.filterDate) {
      return
    }
    this.setData({ filterDate: "" })
    this.fetchTeamList(true)
  },

  onVenueChange(event: WechatMiniprogram.CustomEvent) {
    const detail = event.detail as { value?: number | string }
    const index = Number(detail.value)
    if (!Number.isFinite(index)) {
      return
    }
    const nextIndex = Math.max(0, Math.min(index, this.data.venueOptions.length - 1))
    const option = this.data.venueOptions[nextIndex]
    this.setData({
      venuePickerIndex: nextIndex,
      currentVenueLabel: option ? option.label : "全部场馆",
    })
    this.fetchTeamList(true)
  },

  onStatusChange(event: WechatMiniprogram.CustomEvent) {
    const detail = event.detail as { value?: number | string }
    const index = Number(detail.value)
    if (!Number.isFinite(index)) {
      return
    }
    const nextIndex = Math.max(0, Math.min(index, this.data.statusOptions.length - 1))
    const option = this.data.statusOptions[nextIndex]
    this.setData({
      statusPickerIndex: nextIndex,
      currentStatusLabel: option ? option.label : "全部状态",
    })
    this.fetchTeamList(true)
  },

  async onRefresherRefresh() {
    this.setData({ refresherTriggered: true })
    await this.fetchTeamList(true)
    this.setData({ refresherTriggered: false })
  },

  onScrollToLower() {
    if (this.data.loading || this.data.loadingMore || this.data.noMore) {
      return
    }
    this.fetchTeamList(false)
  },

  async fetchTeamList(reset: boolean) {
    if (this.data.loading || this.data.loadingMore) {
      return
    }

    const nextPageNum = reset ? 1 : this.data.pageNum + 1
    this.setData({
      loading: reset,
      loadingMore: !reset,
      errorText: "",
    })

    try {
      const requestData = this.buildPageRequest(nextPageNum, this.data.pageSize)
      const res = await getTeamPageApi(requestData)
      const pageData = res.data || {}
      const records = Array.isArray(pageData.records) ? pageData.records : []
      const decoratedRecords = await this.decorateRecords(records)
      const previousList = reset ? [] : this.data.teamList
      const mergedList = previousList.concat(decoratedRecords)

      const total = Number(pageData.total)
      const safeTotal = Number.isFinite(total) ? total : mergedList.length
      const noMore = mergedList.length >= safeTotal || records.length < this.data.pageSize

      this.setData({
        pageNum: nextPageNum,
        total: safeTotal,
        teamList: mergedList,
        noMore,
      })
    } catch (error) {
      console.error("fetch team list failed:", error)
      this.setData({
        errorText: "组队列表加载失败，请下拉重试",
      })
      if (reset) {
        this.setData({
          teamList: [],
          noMore: false,
          pageNum: 1,
          total: 0,
        })
      }
    } finally {
      this.setData({
        loading: false,
        loadingMore: false,
      })
    }
  },

  buildPageRequest(pageNum: number, pageSize: number) {
    const venueId = this.getCurrentVenueValue()
    const status = this.getCurrentStatusValue()
    const queryDTO: {
      activityDate?: string
      venueId?: number
      status?: number
    } = {}
    if (this.data.filterDate) {
      queryDTO.activityDate = this.data.filterDate
    }
    if (venueId > 0) {
      queryDTO.venueId = venueId
    }
    if (status > 0) {
      queryDTO.status = status
    }
    return {
      pageNum,
      pageSize,
      queryDTO,
    }
  },

  async decorateRecords(records: TeamRecruitmentListItem[]) {
    const memberProfileMap = await this.fetchMembersByTeam(records)
    const currentWxUserId = this.getCurrentWxUserId()

    return records.map((item) => {
      const teamId = Number(item.id) || 0
      const requiredCount = Number(item.requiredCount) || 0
      const currentCount = Number(item.currentCount) || 0
      const status = Number(item.status) || 0
      const memberProfiles = memberProfileMap.get(teamId) || []
      const initiatorId = Number(item.initiatorWxUserId)
      if (!memberProfiles.length && Number.isFinite(initiatorId) && initiatorId > 0) {
        memberProfiles.push({
          wxUserId: initiatorId,
          username: item.initiatorName || DEFAULT_PROFILE_NAME,
          avatar: DEFAULT_PROFILE_AVATAR,
        })
      }
      const joined = Boolean(item.joined)
      const rawMembers = Array.isArray(item.members) ? item.members : []
      const isOwnerFromMemberRole = rawMembers.some((member) => {
        const memberWxUserId = Number(member.wxUserId)
        const role = Number(member.role)
        return (
          currentWxUserId > 0 &&
          Number.isFinite(memberWxUserId) &&
          memberWxUserId > 0 &&
          memberWxUserId === currentWxUserId &&
          role === 1
        )
      })
      const isOwnerFromSingleMemberFallback =
        joined &&
        rawMembers.length === 1 &&
        Number(rawMembers[0].role) === 1
      const isOwnerFromInitiatorId =
        currentWxUserId > 0 &&
        Number.isFinite(initiatorId) &&
        initiatorId > 0 &&
        initiatorId === currentWxUserId
      const isOwner =
        isOwnerFromMemberRole ||
        isOwnerFromSingleMemberFallback ||
        isOwnerFromInitiatorId
      const canJoin = status === TEAM_STATUS_RECRUITING && !joined
      const canClose = status === TEAM_STATUS_RECRUITING && isOwner
      const canQuit = status === TEAM_STATUS_RECRUITING && joined && !isOwner
      const statusMeta = this.getStatusMeta(status)

      let actionKind: TeamCardItem["actionKind"] = "none"
      let actionLabel = ""
      if (canClose) {
        actionKind = "close"
        actionLabel = "关闭组队"
      } else if (canQuit) {
        actionKind = "quit"
        actionLabel = "退出"
      } else if (canJoin) {
        actionKind = "join"
        actionLabel = "加入"
      } else if (joined) {
        actionLabel = "已加入"
      } else {
        actionLabel = "当前不可加入"
      }

      return {
        ...item,
        deadlineText: this.formatDateTime(item.deadlineTime),
        courtText: this.formatCourt(item.courtId),
        progressText: `${currentCount}/${requiredCount > 0 ? requiredCount : "--"} 人`,
        statusText: statusMeta.text,
        statusType: statusMeta.type,
        canJoin,
        canQuit,
        canClose,
        actionLabel,
        actionKind,
        memberProfiles,
      }
    })
  },

  getCurrentWxUserId() {
    const cacheToken = wx.getStorageSync(CACHE_TOKEN_STORAGE_KEY) as unknown
    if (!cacheToken || typeof cacheToken !== "object") {
      return 0
    }

    const tokenRecord = cacheToken as Record<string, unknown>
    const candidateIds = [tokenRecord.wxUserId, tokenRecord.wx_user_id]

    for (let i = 0; i < candidateIds.length; i += 1) {
      const parsed = Number(candidateIds[i])
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed
      }
    }

    return 0
  },

  async fetchMembersByTeam(records: TeamRecruitmentListItem[]) {
    const resultMap = new Map<number, TeamCardItem["memberProfiles"]>()
    const tasks = records.map(async (record) => {
      const teamId = Number(record.id)
      if (!Number.isFinite(teamId) || teamId <= 0) {
        return
      }

      const rawMembers = Array.isArray(record.members) ? record.members : []
      if (rawMembers.length) {
        const profiles = rawMembers
          .map((member) => {
            const wxUserId = Number(member.wxUserId)
            if (!Number.isFinite(wxUserId) || wxUserId <= 0) {
              return null
            }
            const username =
              typeof member.username === "string" && member.username.trim()
                ? member.username.trim()
                : DEFAULT_PROFILE_NAME
            const avatar =
              typeof member.avatar === "string" && member.avatar.trim()
                ? member.avatar.trim()
                : DEFAULT_PROFILE_AVATAR
            return {
              wxUserId,
              username,
              avatar,
            }
          })
          .filter(
            (
              member,
            ): member is {
              wxUserId: number
              username: string
              avatar: string
            } => Boolean(member),
          )
        resultMap.set(teamId, profiles)
        return
      }

      try {
        const res = await getTeamDetailApi(teamId)
        const members = res.data && Array.isArray(res.data.members) ? res.data.members : []
        const memberProfiles = members
          .map((member) => {
            const wxUserId = Number(member.wxUserId)
            if (!Number.isFinite(wxUserId) || wxUserId <= 0) {
              return null
            }
            const username =
              typeof member.username === "string" && member.username.trim()
                ? member.username.trim()
                : DEFAULT_PROFILE_NAME
            const avatar =
              typeof member.avatar === "string" && member.avatar.trim()
                ? member.avatar.trim()
                : DEFAULT_PROFILE_AVATAR
            return {
              wxUserId,
              username,
              avatar,
            }
          })
          .filter(
            (
              member,
            ): member is {
              wxUserId: number
              username: string
              avatar: string
            } => Boolean(member),
          )
        resultMap.set(teamId, memberProfiles)
      } catch (error) {
        console.warn(`fetch team detail failed, teamId=${teamId}`, error)
        resultMap.set(teamId, [])
      }
    })

    await Promise.all(tasks)
    return resultMap
  },

  getStatusMeta(status: number) {
    if (status === 1) {
      return { text: "招募中", type: "primary" as const }
    }
    if (status === 2) {
      return { text: "已满", type: "success" as const }
    }
    if (status === 3) {
      return { text: "已关闭", type: "warning" as const }
    }
    if (status === 4) {
      return { text: "已过期", type: "danger" as const }
    }
    if (status === 5) {
      return { text: "已取消", type: "danger" as const }
    }
    return { text: "未知状态", type: "warning" as const }
  },

  formatDateTime(raw: unknown) {
    if (typeof raw !== "string" || !raw) {
      return "--"
    }
    return raw.replace("T", " ")
  },

  formatCourt(courtId: unknown) {
    const id = Number(courtId)
    if (!Number.isFinite(id) || id <= 0) {
      return ""
    }
    return `${id}号场`
  },

  async onTapJoinTeam(event: WechatMiniprogram.BaseEvent) {
    const teamId = Number(event.currentTarget.dataset.teamId || 0)
    if (!teamId) {
      return
    }
    if (this.data.actionLoadingId > 0) {
      return
    }

    this.setData({ actionLoadingId: teamId })
    try {
      await joinTeamApi(teamId)
      wx.showToast({
        title: "加入成功",
        icon: "success",
      })
      await this.fetchTeamList(true)
    } catch (error) {
      const message = (error as Error).message || "加入失败，请重试"
      wx.showToast({
        title: message,
        icon: "none",
      })
    } finally {
      this.setData({ actionLoadingId: 0 })
    }
  },

  async onTapQuitTeam(event: WechatMiniprogram.BaseEvent) {
    const teamId = Number(event.currentTarget.dataset.teamId || 0)
    if (!teamId || this.data.actionLoadingId > 0) {
      return
    }

    const confirmed = await this.confirmTeamAction("确认退出该组队？")
    if (!confirmed) {
      return
    }

    this.setData({ actionLoadingId: teamId })
    try {
      await quitTeamApi(teamId)
      wx.showToast({
        title: "退出成功",
        icon: "success",
      })
      await this.fetchTeamList(true)
    } catch (error) {
      const message = (error as Error).message || "退出失败，请重试"
      wx.showToast({
        title: message,
        icon: "none",
      })
    } finally {
      this.setData({ actionLoadingId: 0 })
    }
  },

  async onTapCloseTeam(event: WechatMiniprogram.BaseEvent) {
    const teamId = Number(event.currentTarget.dataset.teamId || 0)
    if (!teamId || this.data.actionLoadingId > 0) {
      return
    }

    const confirmed = await this.confirmTeamAction("确认关闭该组队？关闭后无法继续招募。")
    if (!confirmed) {
      return
    }

    this.setData({ actionLoadingId: teamId })
    try {
      await closeTeamApi(teamId)
      wx.showToast({
        title: "关闭成功",
        icon: "success",
      })
      await this.fetchTeamList(true)
    } catch (error) {
      const message = (error as Error).message || "关闭失败，请重试"
      wx.showToast({
        title: message,
        icon: "none",
      })
    } finally {
      this.setData({ actionLoadingId: 0 })
    }
  },

  confirmTeamAction(content: string) {
    return new Promise<boolean>((resolve) => {
      wx.showModal({
        title: "提示",
        content,
        success: (res) => {
          resolve(Boolean(res.confirm))
        },
        fail: () => {
          resolve(false)
        },
      })
    })
  },

  onTapCreateTeam() {
    wx.navigateTo({
      url: "/pages/team-create/index",
    })
  },
})
