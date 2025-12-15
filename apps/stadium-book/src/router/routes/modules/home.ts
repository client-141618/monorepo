import type { RouteRecordRaw } from "vue-router"
import { House } from "@element-plus/icons-vue"

const Layout = () => import("@/layout/index.vue")
const Home = () => import("@/views/Home/Home.vue")

const home: RouteRecordRaw[] = [
  {
    path: "/",
    component: Layout,
    redirect: "/home",
    children: [
      {
        path: "home",
        component: Home,
        name: "Home",
        meta: {
          title: "首页",
          icon: House,
        },
      },
    ],
    meta: {
      order: 0,
    },
  },
]

export default home
