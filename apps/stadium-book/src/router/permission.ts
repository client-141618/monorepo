import router from "./index"

/**
 * 简单权限控制：
 * 1. 未登录访问非登录页时，强制跳转到 /login
 * 2. 已登录访问 /login 时，重定向到首页
 */
router.beforeEach((to, _from, next) => {
  const hasLogin = Boolean(localStorage.getItem("userInfo"))

  if (!hasLogin && to.path !== "/login") {
    next({ path: "/login" })
    return
  }

  if (hasLogin && to.path === "/login") {
    next({ path: "/" })
    return
  }

  next()
})
