import nProgress from "nprogress"
import router from "./index"
import "nprogress/nprogress.css"
import "../styles/nprogress.scss"

nProgress.configure({
  showSpinner: false,
})

router.beforeEach((to, _from, next) => {
  nProgress.start()
  const hasLogin = Boolean(localStorage.getItem("userInfo"))

  if (!hasLogin && to.path !== "/login") {
    next({ path: "/login" })
    return
  }

  next()
  nProgress.done()
})
