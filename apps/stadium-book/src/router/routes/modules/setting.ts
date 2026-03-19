import type { RouteRecordRaw } from "vue-router"
import { Operation, Picture, Setting, User } from "@element-plus/icons-vue"
import { SettingRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const My = () => import("@/views/Setting/My/My.vue")
const VenueType = () => import("@/views/Setting/VenueType/VenueType.vue")
const MiniappBanner = () =>
  import("@/views/Setting/MiniappBanner/MiniappBanner.vue")

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
      lockOuterScroll: true,
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
      {
        path: "venue-type",
        component: VenueType,
        name: SettingRoute.VenueType,
        meta: {
          title: "场地类型设置",
          icon: Operation,
        },
      },
      {
        path: "miniapp-banner",
        component: MiniappBanner,
        name: SettingRoute.MiniappBanner,
        meta: {
          title: "小程序banner设置",
          icon: Picture,
        },
      },
    ],
  },
]

export default setting
