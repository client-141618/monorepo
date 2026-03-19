import type { RouteRecordRaw } from "vue-router"
import auditLog from "./modules/audit-log"
import home from "./modules/home"
import notification from "./modules/notification"
import reservation from "./modules/reservation"
import setting from "./modules/setting"
import venue from "./modules/venue"
import wxUser from "./modules/wx-user"

const Login = () => import("@/views/base-page/login/index.vue")

export const loginRoute: RouteRecordRaw = {
  path: "/login",
  component: Login,
  meta: {
    hidden: true,
  },
}

export const appRouter: RouteRecordRaw[] = [
  ...home,
  ...venue,
  ...reservation,
  ...notification,
  ...auditLog,
  ...wxUser,
  ...setting,
  loginRoute,
]
