import { ensureLogin } from "./api/auth/index"
import {
  getCurrentWxUserProfileApi,
  saveCurrentWxUserProfileToCache,
} from "./api/wx-user/index"
import { BLOCKED_USER_REDIRECT_HOME } from "./constants/auth"

async function syncWxUserInfoSilently() {
  try {
    const res = await getCurrentWxUserProfileApi()
    saveCurrentWxUserProfileToCache(res.data || {})
  } catch (error) {
    console.warn("silent load wx user info failed:", error)
  }
}

// app.ts
App<IAppOption>({
  globalData: {},
  async onLaunch() {
    const logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs)

    try {
      await ensureLogin()
      await syncWxUserInfoSilently()
    } catch (error) {
      if ((error as Error).message === BLOCKED_USER_REDIRECT_HOME) {
        return
      }

      console.error("miniapp login failed:", error)
      wx.showToast({
        title: "登录失败，请稍后重试",
        icon: "none",
      })
    }
  },
})
