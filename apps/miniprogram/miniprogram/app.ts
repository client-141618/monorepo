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
  globalData: {
    subscribeMessageTemplateIds: {
      // 组队通知模板（发起者与队员共用）
      teamSuccess: "YTvTYoyLUAVmAEbUbLqy1b7zRYqVys-4a_f2g1Vk-xk",
      teamCanceled: "HcqmYs1gCi-bUGWIb8l8uF5DzKC5NfOTT4wh42bxYbI",
      // 预约通知模板
      reservationSuccess: "hQC8ROCLlxHFjlkRIow8DC1-EIb_lzFDr9kzXH78Bm4",
      reservationCanceled: "E9bsjKslGZuJx7yDzxiLISb8nhnosKCOxeixLgUN7Fc",
    },
  },
  async onLaunch() {
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
