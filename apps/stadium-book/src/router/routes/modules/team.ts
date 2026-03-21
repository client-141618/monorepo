import type { RouteRecordRaw } from "vue-router"
import { User } from "@element-plus/icons-vue"
import { TeamRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const TeamManage = () => import("@/views/Team/TeamManage.vue")

const team: RouteRecordRaw[] = [
  {
    path: "/team-manage",
    component: Layout,
    children: [
      {
        path: "",
        component: TeamManage,
        name: TeamRoute.TeamManage,
        meta: {
          title: "组队管理",
          icon: User,
        },
      },
    ],
    meta: {
      order: 2,
      lockOuterScroll: true,
    },
  },
]

export default team
