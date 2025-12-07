import type { RouteRecordRaw } from "vue-router"

// 首页模块路由
// 如果后续需要扩展更多首页相关的子路由，可以在这里添加
const home: RouteRecordRaw[] = [
  // 示例：如果需要添加首页的子路由，可以这样写
  // {
  //   path: "/home",
  //   component: Layout,
  //   redirect: "/home/index",
  //   children: [
  //     {
  //       path: "index",
  //       component: Home,
  //       name: "Home",
  //       meta: {
  //         title: "首页",
  //         showTag: true,
  //         keepAlive: true,
  //       },
  //     },
  //   ],
  //   meta: {
  //     order: 1,
  //   },
  // },
]

export default home
