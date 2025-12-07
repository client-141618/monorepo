import type { RouteRecordRaw } from "vue-router"
import { appRouter } from "./app"
import { basicRoutes } from "./basic"

export const constantRoutes: RouteRecordRaw[] = [...appRouter, ...basicRoutes]
