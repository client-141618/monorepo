<script setup lang="ts">
import { Message, Phone, User } from "@element-plus/icons-vue"
import { storeToRefs } from "pinia"
import { ref } from "vue"
import EditUserDialog from "@/components/EditUserDialog/index.vue"
import { useUserStore } from "@/store/user"

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const dialogVisible = ref(false)

const handleEdit = () => {
  dialogVisible.value = true
}
</script>

<template>
  <div p-10px>
    <el-card shadow="hover" style="border-radius: 10px">
      <div flex gap-20px>
        <el-avatar :size="100" :src="userInfo?.avatar" @error="() => { return true }">
          <img
            src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
          />
        </el-avatar>
        <div flex flex-col gap-10px>
          <span text-20px font-bold>{{ userInfo?.username || "--" }}</span>
          <div flex flex-col gap-6px>
            <div> <User size="12px" /> {{ userInfo?.age || "--" }} </div>
            <div> <Message size="12px" /> {{ userInfo?.email || "--" }} </div>
            <div> <Phone size="12px" /> {{ userInfo?.phone || "--" }} </div>
          </div>
        </div>
        <el-button ml-auto type="primary" @click="handleEdit">编辑</el-button>
      </div>
    </el-card>

    <EditUserDialog v-model="dialogVisible" />
  </div>
</template>
