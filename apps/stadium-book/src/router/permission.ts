import router from "./index"

router.beforeEach((to, _from, next) => {
  const hasLogin = Boolean(localStorage.getItem("userInfo"))

  if (!hasLogin && to.path !== "/login") {
    next({ path: "/login" })
    return
  }

  next()
})
