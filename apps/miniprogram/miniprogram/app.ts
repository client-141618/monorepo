import { ensureLogin } from "./api/auth/index"
import { BLOCKED_USER_REDIRECT_HOME } from "./constants/auth"

// app.ts
App<IAppOption>({
  globalData: {},
  async onLaunch() {
    const logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs)

    try {
      await ensureLogin()
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
