Page({
  onShow() {
    if (typeof this.getTabBar === "function") {
      const tabBar = this.getTabBar()
      if (tabBar) {
        tabBar.setData({ selected: "mine" })
      }
    }
  },
})

