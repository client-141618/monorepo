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
      <el-header style="height: 60px; background-color: #fff">
        <Header />
      </el-header>
      <el-container>
        <el-aside width="200px">
          <SideMenu />
        </el-aside>
        <el-main style="background-color: #f6f6f6">
          <div h-full rounded-10px bg-white p-10px>
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

  :deep(.el-container) {
    height: 100%;
  }
}
</style>
