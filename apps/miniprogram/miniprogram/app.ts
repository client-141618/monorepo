import { ensureLogin } from "./api/auth/index"

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
      console.error("miniapp login failed:", error)
      wx.showToast({
        title: "登录失败，请稍后重试",
        icon: "none",
      })
    }
  },
})
