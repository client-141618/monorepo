const TAB_PATH: Record<string, string> = {
  home: "/pages/home/index",
  team: "/pages/team/index",
  message: "/pages/message/index",
  order: "/pages/order/index",
  mine: "/pages/mine/index",
}

Component({
  data: {
    selected: "home",
  },
  methods: {
    onChange(
      event: WechatMiniprogram.CustomEvent<string | number | { name?: string }>,
    ) {
      const detail = event.detail
      let name = ""
      if (typeof detail === "string" || typeof detail === "number") {
        name = String(detail)
      } else if (detail && typeof detail === "object") {
        name = String(detail.name || "")
      }
      const targetPath = TAB_PATH[name]
      if (!targetPath) {
        return
      }

      this.setData({ selected: name })
      wx.switchTab({ url: targetPath })
    },
  },
})
