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
    onChange(event: WechatMiniprogram.CustomEvent<{ name: string }>) {
      const { name } = event.detail
      const targetPath = TAB_PATH[name]
      const pages = getCurrentPages()
      const currentPath = pages[pages.length - 1]?.route
      if (!targetPath || targetPath === `/${currentPath}`) {
        return
      }
      wx.reLaunch({ url: targetPath })
    },
  },
})
