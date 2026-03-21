<script setup lang="ts">
import { Message, Phone, User } from "@element-plus/icons-vue"
import { storeToRefs } from "pinia"
import { ref } from "vue"
import EditPassword from "@/components/EditPassword/index.vue"
import EditUserDialog from "@/components/EditUserDialog/index.vue"
import PageContentShell from "@/components/PageContentShell/index.vue"
import { useUserStore } from "@/store/user"

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const dialogVisible = ref(false)
const editPasswordVisible = ref(false)

const handleEdit = () => {
  dialogVisible.value = true
}

const handleEditPassword = () => {
  editPasswordVisible.value = true
}
</script>

<template>
  <PageContentShell class="my-page" :body-scroll="true">
    <div class="my-page__content">
      <el-card shadow="hover" class="my-page__card">
        <div class="my-page__card-body">
          <el-avatar :size="100" :src="userInfo?.avatar" @error="() => { return true }">
            <img
              src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
            />
          </el-avatar>
          <div class="my-page__profile">
            <span class="my-page__name">{{ userInfo?.username || "--" }}</span>
            <div class="my-page__meta">
              <div> <User size="12px" /> {{ userInfo?.age || "--" }} </div>
              <div> <Message size="12px" /> {{ userInfo?.email || "--" }} </div>
              <div> <Phone size="12px" /> {{ userInfo?.phone || "--" }} </div>
            </div>
          </div>
          <el-button class="my-page__action--start" type="primary" @click="handleEdit">编辑</el-button>
          <el-button type="primary" @click="handleEditPassword">修改密码</el-button>
        </div>
      </el-card>
    </div>

    <EditUserDialog v-model="dialogVisible" />
    <EditPassword v-model="editPasswordVisible" />
  </PageContentShell>
</template>

<style scoped lang="scss">
.my-page__content {
  min-height: 0;
}

.my-page__card {
  border-radius: 10px;
}

.my-page__card-body {
  display: flex;
  gap: 20px;
}

.my-page__profile {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.my-page__name {
  font-size: 20px;
  font-weight: 700;
}

.my-page__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.my-page__action--start {
  margin-left: auto;
}
</style>
