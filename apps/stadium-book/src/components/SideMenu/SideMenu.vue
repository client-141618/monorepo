<script setup lang="ts">
import type { RouteRecordRaw } from "vue-router"
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

const joinPath = (base: string, path: string) => {
  if (path.startsWith("/")) return path
  if (!base) return `/${path}`
  return `${base}/${path}`.replace(/\/+/g, "/")
}

const normalizeRoutes = (
  routes: readonly RouteRecordRaw[],
  basePath = "",
): RouteRecordRaw[] => {
  const result: RouteRecordRaw[] = []

  routes
    .filter((item) => !item.meta?.hidden)
    .forEach((item) => {
      const fullPath = joinPath(basePath, item.path)
      const children = item.children
        ? normalizeRoutes(item.children, fullPath)
        : undefined

      const hasTitle = Boolean(item.meta?.title)
      const hasChildren = Boolean(children && children.length)

      if (hasTitle || !hasChildren) {
        // 有标题或没有子节点，直接收录
        result.push({
          ...item,
          path: fullPath,
          children,
        } as RouteRecordRaw)
      } else if (hasChildren) {
        // 没有标题但有子节点，直接提升子节点（避免空父级显示）
        result.push(...(children as RouteRecordRaw[]))
      }
    })

  return result
}

const menuRoutes = computed<RouteRecordRaw[]>(() =>
  normalizeRoutes(router.options.routes),
)

const activeMenu = computed(() => {
  return route.path
})

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
        text-color="#000000"
        active-text-color="#000000"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
      >
        <template v-for="routeItem in menuRoutes" :key="routeItem.path">
          <el-sub-menu
            v-if="routeItem.children && routeItem.children.length"
            :index="routeItem.path"
          >
            <template #title>
              <el-icon v-if="routeItem.meta?.icon">
                <component :is="routeItem.meta.icon" />
              </el-icon>
              <span>{{ routeItem.meta?.title }}</span>
            </template>
            <template v-for="child in routeItem.children" :key="child.path">
              <el-sub-menu
                v-if="child.children && child.children.length"
                :index="child.path"
              >
                <template #title>
                  <el-icon v-if="child.meta?.icon">
                    <component :is="child.meta.icon" />
                  </el-icon>
                  <span>{{ child.meta?.title }}</span>
                </template>
                <el-menu-item
                  v-for="grand in child.children"
                  :key="grand.path"
                  :index="grand.path"
                  @click="handleMenuClick(grand.path)"
                >
                  <el-icon v-if="grand.meta?.icon">
                    <component :is="grand.meta.icon" />
                  </el-icon>
                  <span>{{ grand.meta?.title }}</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item
                v-else
                :index="child.path"
                @click="handleMenuClick(child.path)"
              >
                <el-icon v-if="child.meta?.icon">
                  <component :is="child.meta.icon" />
                </el-icon>
                <span>{{ child.meta?.title }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>
          <el-menu-item
            v-else
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

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
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
