<script setup lang="ts">
import type { UserInfo } from '@/api/user/types'
import { ArrowDown } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser } from '@/api/user'

const router = useRouter()
const userInfo = ref<UserInfo>()
const errorHandle = () => {
  return true
}

const handleLogout = () => {
  localStorage.removeItem('userInfo')
  router.push('/login')
}

const getUserInfo = async () => {
  try {
    const res = await getCurrentUser()
    if (res.code === 200) {
      userInfo.value = res.data as UserInfo
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <div my-6px h-full flex items-center justify-between class="header-container">
    <div class="logo">logo</div>
    <div class="right">
      <el-dropdown>
        <div class="user-dropdown-trigger">
          <span class="username">{{ userInfo?.username || '默认用户' }}</span>
          <el-icon class="dropdown-icon">
            <arrow-down />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>我的预定</el-dropdown-item>
            <el-dropdown-item>编辑资料</el-dropdown-item>
            <el-dropdown-item>修改密码</el-dropdown-item>
            <el-dropdown-item divided style="color: red" @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-avatar
        :size="40"
        :src="userInfo?.avatar"
        @error="errorHandle"
      >
        <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
      </el-avatar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-container {
  .right {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .user-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    color: var(--el-text-color-primary);

    &:hover {
      border: none;
      background-color: var(--el-fill-color-light);
    }

    .username {
      font-size: 14px;
      line-height: 1;
    }

    .dropdown-icon {
      font-size: 12px;
      transition: transform 0.2s;
    }
  }
}
</style>
