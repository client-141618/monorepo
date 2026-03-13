const TAB_PATH: Record<string, string> = {
  home: "/pages/home/index",
  message: "/pages/message/index",
  order: "/pages/order/index",
  mine: "/pages/mine/index",
}

Component({
  properties: {
    active: {
      type: String,
      value: "home",
    },
  },
  methods: {
    onChange(
      event: WechatMiniprogram.CustomEvent<string | number | { name?: string }>,
    ) {
      const detail = event.detail
      const name =
        typeof detail === "string" || typeof detail === "number"
          ? String(detail)
          : String(detail?.name || "")
      const targetPath = TAB_PATH[name]
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const currentPath = currentPage ? currentPage.route : ""
      if (!targetPath || targetPath === `/${currentPath}`) {
        return
      }

      wx.switchTab({
        url: targetPath,
        fail: () => {
          wx.redirectTo({ url: targetPath })
        },
      })
    },
  },
})
