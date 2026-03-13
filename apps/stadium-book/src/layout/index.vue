<script setup lang="ts">
import { useRouter } from "vue-router"
import Header from "@/components/Header/Header.vue"
import SideMenu from "@/components/SideMenu/SideMenu.vue"

const router = useRouter()
const userInfo = localStorage.getItem("userInfo")
if (!userInfo) {
  router.push("/login")
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="common-layout__header">
        <Header />
      </el-header>
      <el-container>
        <el-aside width="200px">
          <SideMenu />
        </el-aside>
        <el-main class="common-layout__main">
          <div class="common-layout__content">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.common-layout {
  height: 100vh;
  overflow: hidden;

  :deep(.el-container) {
    height: 100%;
    min-height: 0;
  }
}

.common-layout__header {
  height: 60px;
  background-color: #fff;
}

.common-layout__main {
  background-color: #f6f6f6;
  overflow: auto;
  min-width: 0;
}

.common-layout__content {
  min-height: 100%;
  border-radius: 10px;
  background-color: #fff;
  padding: 10px;
}
</style>
