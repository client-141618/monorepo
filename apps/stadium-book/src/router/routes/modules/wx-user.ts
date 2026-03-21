import type { RouteRecordRaw } from "vue-router"
import { UserFilled } from "@element-plus/icons-vue"
import { WxUserRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const WxUserManage = () => import("@/views/WxUser/WxUserManage.vue")

const wxUser: RouteRecordRaw[] = [
  {
    path: "/wx-user",
    component: Layout,
    children: [
      {
        path: "",
        component: WxUserManage,
        name: WxUserRoute.WxUserList,
        meta: {
          title: "用户管理",
          icon: UserFilled,
        },
      },
    ],
    meta: {
      order: 2,
      lockOuterScroll: true,
    },
  },
]

export default wxUser
