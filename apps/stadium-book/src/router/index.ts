import type { RouteRecordRaw } from "vue-router"
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from "vue-router"
import { constantRoutes } from "./routes"
import home from "./routes/modules/home"

const modulesRoutes: RouteRecordRaw[] = [...home].sort((a, b) => {
  const orderA = (a.meta?.order as number) ?? 0
  const orderB = (b.meta?.order as number) ?? 0
  return orderA - orderB
})

/**
 * 动态路由
 * 用来放置有权限 (Roles 属性) 的路由
 * 必须带有 Name 属性
 */
export const asyncRoutes: RouteRecordRaw[] = [
  ...modulesRoutes,
  {
    path: "/:pathMatch(.*)*", // 必须将 'ErrorPage' 路由放在最后
    redirect: "/404",
    name: "ErrorPage",
    meta: {
      hidden: true,
    },
  },
]

const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === "hash"
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH || "/")
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH || "/"),
  routes: constantRoutes,
  scrollBehavior() {
    // 始终滚动到顶部
    return { left: 0, top: 0 }
  },
})

/** 重置路由 */
export function resetRouter() {
  // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
  //   try {
  //     router.getRoutes().forEach((route) => {
  //       const { name, meta } = route
  //       if (name && meta.roles?.length) {
  //         router.hasRoute(name) && router.removeRoute(name)
  //       }
  //     })
  //   } catch (error) {
  // 强制刷新浏览器也行，只是交互体验不是很好
  window.location.reload()
  //   }
}

export default router
