import type { RouteRecordRaw } from "vue-router"
import { House } from "@element-plus/icons-vue"

const Layout = () => import("@/layout/index.vue")
const Login = () => import("@/views/base-page/login/index.vue")
const Home = () => import("@/views/Home/Home.vue")

export const rootRoute: RouteRecordRaw = {
  path: "/",
  component: Layout,
  redirect: "/home",
  meta: {
    hidden: true,
  },
  children: [
    {
      path: "home",
      component: Home,
      name: "Home",
      meta: {
        title: "首页",
        icon: House,
        showTag: true,
        keepAlive: true,
      },
    },
  ],
}

export const loginRoute: RouteRecordRaw = {
  path: "/login",
  component: Login,
  meta: {
    hidden: true,
  },
}

export const appRouter = [rootRoute, loginRoute]
