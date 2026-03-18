import type { WxUserProfile } from "../../utils/profile"
import { getWxUserProfileFromStorage } from "../../utils/profile"

interface MineSettingItem {
  key: "profile" | "notification" | "invoice" | "feedback"
  title: string
}

Page({
  data: {
    userProfile: getWxUserProfileFromStorage() as WxUserProfile,
    settingList: [
      { key: "profile", title: "个人资料" },
      { key: "notification", title: "通知设置" },
      { key: "invoice", title: "发票与抬头" },
      { key: "feedback", title: "帮助与反馈" },
    ] as MineSettingItem[],
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: "我的",
    })
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "mine" })
      }
    }

    this.setData({
      userProfile: getWxUserProfileFromStorage(),
    })
  },

  onTapSetting(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key?: MineSettingItem["key"] }
    if (!key) {
      return
    }

    if (key === "profile") {
      wx.navigateTo({
        url: "/pages/profile/index",
      })
      return
    }

    wx.showToast({
      title: "功能开发中",
      icon: "none",
    })
  },
})
