<script setup lang="ts">
import type { UploadProps } from "element-plus"
import type { UserInfo } from "@/api/user/types"
import { Message, Phone, Plus, User } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { onMounted, ref } from "vue"
import { getCurrentUser } from "@/api/user"

const userInfo = ref<UserInfo>()
const dialogVisible = ref(false)
const editForm = ref<Partial<UserInfo>>({})
const imageUrl = ref<string>("")

const getUserInfo = async () => {
  const res = await getCurrentUser()
  if (res.code === 200) {
    userInfo.value = res.data as UserInfo
  }
}

onMounted(() => {
  getUserInfo()
})

const handleEdit = () => {
  if (userInfo.value) {
    editForm.value = {
      username: userInfo.value.username,
      phone: userInfo.value.phone,
      email: userInfo.value.email,
      age: userInfo.value.age,
      avatar: userInfo.value.avatar,
    }
  }
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleAvatarSuccess: UploadProps["onSuccess"] = (
  _response,
  uploadFile,
) => {
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
}

const beforeAvatarUpload: UploadProps["beforeUpload"] = (rawFile) => {
  if (rawFile.type !== "image/jpeg") {
    ElMessage.error("Avatar picture must be JPG format!")
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error("Avatar picture size can not exceed 2MB!")
    return false
  }
  return true
}
</script>

<template>
  <div p-10px>
    <el-card shadow="hover" style="border-radius: 10px">
      <div flex gap-20px>
        <el-avatar :size="100" :src="userInfo?.avatar" />
        <div flex flex-col gap-10px>
          <span text-20px font-bold>{{ userInfo?.username }}</span>
          <div flex flex-col gap-6px>
            <div> <User size="12px" /> {{ userInfo?.age || "--" }} </div>
            <div> <Message size="12px" /> {{ userInfo?.email || "--" }} </div>
            <div> <Phone size="12px" /> {{ userInfo?.phone || "--" }} </div>
          </div>
        </div>
        <el-button ml-auto type="primary" @click="handleEdit">编辑</el-button>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      title="编辑信息"
      width="40%"
      @close="handleClose"
    >
      <el-form :model="editForm" label-width="80px">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="用户名：">
              <el-input v-model="editForm.username" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号：">
              <el-input v-model="editForm.phone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="邮箱：">
              <el-input v-model="editForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄：">
              <el-input-number
                v-model="editForm.age"
                :min="0"
                :max="100"
                :step="1"
                :controls="false"
                step-strictly
                :align="'left'"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="头像：">
          <el-upload
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="imageUrl" :src="imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
