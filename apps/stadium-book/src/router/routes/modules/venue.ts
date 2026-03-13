import type { RouteRecordRaw } from "vue-router"
import { Bell, OfficeBuilding } from "@element-plus/icons-vue"
import { VenueRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const Venue = () => import("@/views/Venue/Venue.vue")
const NotificationList = () => import("@/views/Notification/NotificationList.vue")
const NotificationFormView = () =>
  import("@/views/Notification/NotificationFormView.vue")

const venue: RouteRecordRaw[] = [
  {
    path: "/",
    component: Layout,
    redirect: "/venue",
    meta: {
      title: "场馆管理",
      icon: OfficeBuilding,
      order: 1,
    },
    children: [
      {
        path: "venue",
        component: Venue,
        name: VenueRoute.Venue,
        meta: {
          title: "场馆列表",
          icon: OfficeBuilding,
        },
      },
      {
        path: "notification",
        component: NotificationList,
        name: VenueRoute.NotificationList,
        meta: {
          title: "通知消息",
          icon: Bell,
        },
      },
      {
        path: "notification/create",
        component: NotificationFormView,
        name: VenueRoute.NotificationCreate,
        meta: {
          hidden: true,
          activeMenu: "/notification",
        },
      },
      {
        path: "notification/edit/:id",
        component: NotificationFormView,
        name: VenueRoute.NotificationEdit,
        meta: {
          hidden: true,
          activeMenu: "/notification",
        },
      },
      {
        path: "notification/detail/:id",
        component: NotificationFormView,
        name: VenueRoute.NotificationDetail,
        meta: {
          hidden: true,
          activeMenu: "/notification",
        },
      },
    ],
  },
]

export default venue
