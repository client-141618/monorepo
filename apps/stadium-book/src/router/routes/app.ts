import type { RouteRecordRaw } from "vue-router"
import home from "./modules/home"
import setting from "./modules/setting"
import venue from "./modules/venue"

const Login = () => import("@/views/base-page/login/index.vue")

export const loginRoute: RouteRecordRaw = {
  path: "/login",
  component: Login,
  meta: {
    hidden: true,
  },
}

export const appRouter: RouteRecordRaw[] = [...home, ...venue, ...setting, loginRoute]
