<script setup lang="ts">
import type { RouteRecordRaw } from "vue-router"
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

// 递归获取所有应该显示的路由（包括嵌套路由）
const getDisplayableRoutes = (
  routes: RouteRecordRaw[],
  basePath = "",
): RouteRecordRaw[] => {
  const result: RouteRecordRaw[] = []

  routes.forEach((routeItem) => {
    // 跳过隐藏的路由
    if (routeItem.meta?.hidden) {
      return
    }

    // 如果有子路由，递归处理
    if (routeItem.children && routeItem.children.length > 0) {
      const childRoutes = getDisplayableRoutes(
        routeItem.children,
        routeItem.path,
      )
      result.push(...childRoutes)
    } else if (routeItem.meta?.title) {
      // 没有子路由且有 title 的路由，添加到结果中
      // 处理路径：如果是相对路径，需要拼接 basePath
      const fullPath = routeItem.path.startsWith("/")
        ? routeItem.path
        : basePath
          ? `${basePath}/${routeItem.path}`.replace(/\/+/g, "/")
          : `/${routeItem.path}`

      result.push({
        ...routeItem,
        path: fullPath,
      })
    }
  })

  return result
}

// 获取所有应该显示的路由
const menuRoutes = computed(() => {
  const allRoutes = router.getRoutes()
  return getDisplayableRoutes(allRoutes)
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 处理菜单点击
const handleMenuClick = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="side-menu-container">
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="false"
        background-color="transparent"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
      >
        <template v-for="routeItem in menuRoutes" :key="routeItem.path">
          <el-menu-item
            :index="routeItem.path"
            @click="handleMenuClick(routeItem.path)"
          >
            <el-icon v-if="routeItem.meta?.icon">
              <component :is="routeItem.meta.icon" />
            </el-icon>
            <span>{{ routeItem.meta?.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
  .side-menu-container {
  height: 100%;
  background-color: #fff;

  :deep(.scrollbar-wrapper) {
    overflow-x: hidden !important;
  }

  :deep(.el-menu) {
    width: 100% !important;
    height: 100%;
    background: transparent !important;
    border: none;
  }

  :deep(.el-menu-item) {
    height: 56px;
    line-height: 56px;
    background: transparent !important;
    color: #000;

    &.is-active {
      background-color: rgba(64, 158, 255, 0.2) !important;
      color: #409eff !important;
    }

    &:hover {
      background-color: rgba(64, 158, 255, 0.1) !important;
    }

    .el-icon {
      margin-right: 8px;
      font-size: 18px;
    }
  }
}
</style>
