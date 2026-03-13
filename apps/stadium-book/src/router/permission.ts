import nProgress from "nprogress"
import router from "./index"
import "nprogress/nprogress.css"
import "../styles/nprogress.scss"

nProgress.configure({
  showSpinner: false,
})

const APP_TITLE = "stadium-book"

const updateDocumentTitle = (title?: string) => {
  document.title = title ? `${title} - ${APP_TITLE}` : APP_TITLE
}

router.beforeEach((to, _from, next) => {
  nProgress.start()
  const hasLogin = Boolean(localStorage.getItem("userInfo"))
  const routeTitle = [...to.matched]
    .reverse()
    .find((item) => typeof item.meta?.title === "string")
    ?.meta?.title as string | undefined

  updateDocumentTitle(routeTitle)

  if (!hasLogin && to.path !== "/login") {
    next({ path: "/login" })
    return
  }

  next()
  nProgress.done()
})
