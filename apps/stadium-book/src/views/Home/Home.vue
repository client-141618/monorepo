<script setup lang="ts">
  import { ref } from "vue"

  const count = ref(0)
</script>

<template>
  <div class="home-container">
    <h1 color="red">首页</h1>
    <p>欢迎使用场馆预订系统</p>

    <button @click="count++">点击</button>
  </div>
</template>

<style lang="scss" scoped>
  .home-container {
    padding: 20px;
  }
</style>
