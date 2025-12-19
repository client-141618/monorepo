<script setup lang="ts">
import type { FormInstance, UploadProps } from "element-plus"
import type { UserInfo } from "@/api/user/types"
import { Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { storeToRefs } from "pinia"
import { computed, ref, watch } from "vue"
import { useUserStore } from "@/store/user"

const dialogVisible = defineModel<boolean>("modelValue")
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)
const editForm = ref<Partial<UserInfo>>({})
const editFormRef = ref<FormInstance>()
const imageUrl = ref<string>(userInfo.value?.avatar || "")

const headers = computed(() => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}")
  return {
    token: storedUser?.token || "",
  }
})

const rules = ref({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 10, message: "用户名长度为3-10位", trigger: "blur" },
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
  email: [
    {
      pattern: /^[A-Z0-9\u4E00-\u9FA5]+@[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i,
      message: "请输入正确的邮箱",
      trigger: "blur",
    },
  ],
})

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

const handleClose = () => {
  dialogVisible.value = false
  setTimeout(() => {
    imageUrl.value = userInfo.value?.avatar || ""
    editFormRef.value?.clearValidate()
  }, 100)
}

watch(
  () => dialogVisible.value,
  (visible) => {
    if (visible && userInfo.value) {
      editForm.value = {
        ...userInfo.value,
      }
      imageUrl.value = editForm.value.avatar || userInfo.value?.avatar || ""
    }
  },
  { immediate: true },
)

const handleSave = async () => {
  editFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const res = await userStore.updateUserInfo(editForm.value as UserInfo)
        if (res.code === 200) {
          ElMessage.success("保存成功")
          handleClose()
          await userStore.getUserInfo()
        } else {
          ElMessage.error(res.msg || "保存失败")
        }
      } catch (error) {
        ElMessage.error("保存失败")
        console.error(error)
      }
    }
  })
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑信息"
    width="40%"
    @close="handleClose"
  >
    <el-form :model="editForm" label-width="80px" :rules="rules" ref="editFormRef">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="用户名：" prop="username">
            <el-input v-model="editForm.username" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号：" prop="phone">
            <el-input v-model="editForm.phone" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="邮箱：" prop="email">
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
          <el-icon v-else class="avatar-uploader-icon">
            <Plus />
          </el-icon>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.avatar-uploader .avatar {
  width: 128px;
  height: 128px;
  display: block;
  object-fit: cover;
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
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
