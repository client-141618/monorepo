<script setup lang="ts">
import SideMenu from '@/components/SideMenu/SideMenu.vue'
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header style="height: 60px;background-color: #fff;">Header</el-header>
      <el-container>
        <el-aside width="200px">
          <SideMenu />
        </el-aside>
        <el-main style="background-color: #f6f6f6;">
          <router-view />
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
