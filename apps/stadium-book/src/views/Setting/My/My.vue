<script setup lang="ts">
import type { UploadProps } from "element-plus"
import type { UserInfo } from "@/api/user/types"
import { Message, Phone, Plus, User } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { getCurrentUser, updateUserInfo } from "@/api/user"

const userInfo = ref<UserInfo>()
const dialogVisible = ref(false)
const editForm = ref<Partial<UserInfo>>({})
const imageUrl = ref<string>("")

const headers = computed(() => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}")
  return {
    token: storedUser?.token || "",
  }
})

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
      userId: userInfo.value.userId,
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
  response,
  uploadFile,
) => {
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
  if (response.code === 200) {
    editForm.value.avatar = response.data
  } else {
    ElMessage.error(response.msg || "上传失败")
  }
}

const beforeAvatarUpload: UploadProps["beforeUpload"] = (rawFile) => {
  if (rawFile.type !== "image/jpeg") {
    ElMessage.error("图片必须是 JPG 格式!")
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error("图片大小不能超过 2MB!")
    return false
  }
  return true
}

const handleSave = async () => {
  try {
    const res = await updateUserInfo(editForm.value)
    if (res.code === 200) {
      ElMessage.success("保存成功")
      handleClose()
      getUserInfo()
    } else {
      ElMessage.error(res.msg || "保存失败")
    }
  } catch (error) {
    ElMessage.error("保存失败")
    console.error(error)
  }
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
            class="avatar-uploader"
            action="/api/file/upload"
            :headers="headers"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="imageUrl" :src="imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.avatar-uploader .avatar {
  width: 128px;
  height: 128px;
  display: block;
}
</style>

<style lang="scss">
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 128px;
  height: 128px;
  text-align: center;
}
</style>
