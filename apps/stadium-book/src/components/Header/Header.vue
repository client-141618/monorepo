<script setup lang="ts">
import { ArrowDown, FullScreen, ScaleToOriginal } from "@element-plus/icons-vue"
import { storeToRefs } from "pinia"
import { onMounted, onUnmounted, shallowRef } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/store/user"

const userStore = useUserStore()
const router = useRouter()
const { userInfo } = storeToRefs(userStore)
const isFullscreen = shallowRef(false)

const errorHandle = () => {
  return true
}

const handleLogout = () => {
  localStorage.removeItem("userInfo")
  router.push("/login")
}

const handleEditProfile = () => {
  router.push("/setting/my")
}

const syncFullscreenState = () => {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await document.documentElement.requestFullscreen()
  } catch (error) {
    console.error("toggle fullscreen failed:", error)
  }
}

const handleWindowKeydown = async (event: KeyboardEvent) => {
  if (event.key !== "F11") return
  event.preventDefault()
  await toggleFullscreen()
}

onMounted(() => {
  userStore.getUserInfo()
  syncFullscreenState()
  document.addEventListener("fullscreenchange", syncFullscreenState)
  window.addEventListener("keydown", handleWindowKeydown)
})

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", syncFullscreenState)
  window.removeEventListener("keydown", handleWindowKeydown)
})
</script>

<template>
  <div my-6px h-full flex items-center justify-between class="header-container">
    <div class="logo">logo</div>
    <div class="right">
      <el-tooltip :content="isFullscreen ? '退出全屏 (F11)' : '全屏显示 (F11)'" placement="bottom">
        <button
          type="button"
          class="fullscreen-button"
          :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
          @click="toggleFullscreen"
        >
          <el-icon :size="18">
            <ScaleToOriginal v-if="isFullscreen" />
            <FullScreen v-else />
          </el-icon>
          <span class="fullscreen-button__label">{{ isFullscreen ? "退出全屏" : "全屏" }}</span>
        </button>
      </el-tooltip>
      <el-dropdown>
        <div class="user-dropdown-trigger">
          <span class="username">{{ userInfo?.username || "默认用户" }}</span>
          <el-icon class="dropdown-icon">
            <arrow-down />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleEditProfile">编辑资料</el-dropdown-item>
            <el-dropdown-item>修改密码</el-dropdown-item>
            <el-dropdown-item divided style="color: red" @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-avatar :size="40" :src="userInfo?.avatar" @error="errorHandle">
        <img
          src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
        />
      </el-avatar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-container {
  .right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .fullscreen-button {
    padding: 0;
    border: none;
    background: transparent;
    color: #111827;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    cursor: pointer;
    transition:
      color 0.2s ease,
      opacity 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
      opacity: 0.9;
    }
  }

  .fullscreen-button__label {
    font-size: 14px;
    line-height: 1;
    white-space: nowrap;
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
