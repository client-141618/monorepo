import type { RouteRecordRaw } from "vue-router"

const Layout = () => import("@/layout/index.vue")
const Redirect = () => import("@/views/base-page/redirect/index.vue")
const ErrorPage403 = () => import("@/views/base-page/error-page/ErrorPage403.vue")
const ErrorPage404 = () => import("@/views/base-page/error-page/404.vue")

export const notFoundRoute: RouteRecordRaw = {
  path: "/404",
  component: ErrorPage404,
  meta: {
    hidden: true,
  },
  alias: "/:pathMatch(.*)*",
}

/** 常驻路由 */
export const basicRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layout,
    meta: {
      hidden: true,
    },
    children: [
      {
        name: "Redirect",
        path: "/redirect/:path(.*)",
        component: Redirect,
        meta: {
          title: "Redirect",
          hidden: true,
        },
      },
    ],
  },
  {
    path: "/403",
    component: ErrorPage403,
    meta: {
      hidden: true,
    },
  },
  notFoundRoute,
]

