<script setup lang="ts">
import { getUserList } from "@/api/user"

const demo = () => {
  getUserList().then((res) => {
    console.log(res)
  })
}
</script>

<template>
  <div class="home-container">
    <h1 color="red">首页</h1>
    <p>欢迎使用场馆预订系统</p>
    <el-button type="primary" @click="demo">登录</el-button>
  </div>
</template>

<style lang="scss" scoped>
  .home-container {
  padding: 20px;
}
</style>
