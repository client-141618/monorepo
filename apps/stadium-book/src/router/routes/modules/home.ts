import type { RouteRecordRaw } from "vue-router"
import { House } from "@element-plus/icons-vue"

const Layout = () => import("@/layout/index.vue")
const Home = () => import("@/views/Home/Home.vue")
const HomeVenueGrid = () => import("@/views/Home/components/HomeVenueGrid.vue")
const HomeVenueDetail = () => import("@/views/Home/components/HomeVenueDetail.vue")

const home: RouteRecordRaw[] = [
  {
    path: "/",
    component: Layout,
    redirect: "/home",
    children: [
      {
        path: "home",
        component: Home,
        children: [
          {
            path: "",
            component: HomeVenueGrid,
            name: "Home",
            meta: {
              title: "首页",
              icon: House,
            },
          },
          {
            path: "venue/:id",
            component: HomeVenueDetail,
            name: "HomeVenueDetail",
            meta: {
              hidden: true,
              activeMenu: "/home",
            },
          },
        ],
      },
    ],
    meta: {
      order: 0,
      lockOuterScroll: true,
    },
  },
]

export default home
