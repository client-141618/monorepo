import type { RouteRecordRaw } from "vue-router"
import { OfficeBuilding } from "@element-plus/icons-vue"
import { VenueRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const Venue = () => import("@/views/Venue/Venue.vue")

const venue: RouteRecordRaw[] = [
  {
    path: "/",
    component: Layout,
    redirect: "/venue",
    children: [
      {
        path: "venue",
        component: Venue,
        name: VenueRoute.Venue,
        meta: {
          title: "场地管理",
          icon: OfficeBuilding,
        },
      },
    ],
    meta: {
      order: 1,
    },
  },
]

export default venue
