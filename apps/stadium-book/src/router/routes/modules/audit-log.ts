import type { RouteRecordRaw } from "vue-router"
import { Document } from "@element-plus/icons-vue"
import { AuditLogRoute } from "../RouteNameEnum"

const Layout = () => import("@/layout/index.vue")
const AuditLogList = () => import("@/views/AuditLog/AuditLogList.vue")

const auditLog: RouteRecordRaw[] = [
  {
    path: "/audit-log",
    component: Layout,
    children: [
      {
        path: "",
        component: AuditLogList,
        name: AuditLogRoute.AuditLogList,
        meta: {
          title: "审计日志",
          icon: Document,
        },
      },
    ],
    meta: {
      order: 4,
      lockOuterScroll: true,
    },
  },
]

export default auditLog
