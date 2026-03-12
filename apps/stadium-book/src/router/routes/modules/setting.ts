import type { RouteRecordRaw } from "vue-router"
import { Setting, User } from "@element-plus/icons-vue"
import { SettingRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const My = () => import("@/views/Setting/My/My.vue")

const setting: RouteRecordRaw[] = [
  {
    path: "/setting",
    component: Layout,
    redirect: "/setting/my",
    meta: {
      title: "设置",
      icon: Setting,
      showTag: true,
      keepAlive: true,
      order: 2,
    },
    children: [
      {
        path: "my",
        component: My,
        name: SettingRoute.My,
        meta: {
          title: "个人信息",
          icon: User,
        },
      },
    ],
  },
]

export default setting
