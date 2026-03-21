import type { RouteRecordRaw } from "vue-router"
import { Calendar } from "@element-plus/icons-vue"
import { ReservationRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const ReservationManage = () => import("@/views/Reservation/ReservationManage.vue")

const reservation: RouteRecordRaw[] = [
  {
    path: "/reservation-manage",
    component: Layout,
    children: [
      {
        path: "",
        component: ReservationManage,
        name: ReservationRoute.ReservationManage,
        meta: {
          title: "预定管理",
          icon: Calendar,
          lockOuterScroll: true,
        },
      },
    ],
    meta: {
      order: 2,
    },
  },
]

export default reservation
