import type { RouteRecordRaw } from "vue-router"
import { Bell } from "@element-plus/icons-vue"
import { VenueRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const NotificationList = () => import("@/views/Notification/NotificationList.vue")
const NotificationFormView = () =>
  import("@/views/Notification/NotificationFormView.vue")

const notification: RouteRecordRaw[] = [
  {
    path: "/notification",
    component: Layout,
    children: [
      {
        path: "",
        component: NotificationList,
        name: VenueRoute.NotificationList,
        meta: {
          title: "通知消息",
          icon: Bell,
        },
      },
      {
        path: "create",
        component: NotificationFormView,
        name: VenueRoute.NotificationCreate,
        meta: {
          hidden: true,
          activeMenu: "/notification",
        },
      },
      {
        path: "edit/:id",
        component: NotificationFormView,
        name: VenueRoute.NotificationEdit,
        meta: {
          hidden: true,
          activeMenu: "/notification",
        },
      },
      {
        path: "detail/:id",
        component: NotificationFormView,
        name: VenueRoute.NotificationDetail,
        meta: {
          hidden: true,
          activeMenu: "/notification",
        },
      },
    ],
    meta: {
      order: 3,
      lockOuterScroll: true,
    },
  },
]

export default notification
