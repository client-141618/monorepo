<script setup lang="ts">
import type { FormInstance } from "element-plus"
import { Lock } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { useRouter } from "vue-router"
import { updatePassword } from "@/api/user"

const router = useRouter()
const dialogVisible = defineModel<boolean>("modelValue")
const loading = ref(false)
const form = ref({
  password: "",
  newPassword: "",
  confirmPassword: "",
})
const formRef = ref<FormInstance>()
const rules = ref({
  password: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 16, message: "密码长度为8-16位", trigger: "blur" },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (!value) {
          callback()
          return
        }
        if (
          !/[A-Z]/.test(value) ||
            !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
        ) {
          callback(new Error("请包含大写字母和特殊字符"))
          return
        }
        callback()
      },
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请输入确认密码", trigger: "blur" },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== form.value.newPassword) {
          callback(new Error("两次密码不一致"))
          return
        }
        callback()
      },
      trigger: "blur",
    },
  ],
})

const handleCancel = () => {
  dialogVisible.value = false
  setTimeout(() => {
    formRef.value?.resetFields()
    formRef.value?.clearValidate()
  }, 100)
}

const handleSave = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const res = await updatePassword(form.value)
      if (res.code === 200) {
        ElMessage.success("修改密码成功")
      } else {
        ElMessage.error(res.msg || "修改密码失败")
      }
      loading.value = false
      setTimeout(() => {
        localStorage.removeItem("userInfo")
        router.push("/login")
      }, 1000)
    }
  })
}
</script>

<template>
  <el-dialog v-model="dialogVisible" width="30%" @close="handleCancel">
    <template #title>
      <div flex items-center gap-10px>
        <el-icon><Lock /></el-icon>
        <span text-16px font-bold>修改密码</span>
      </div>
    </template>
    <span text-14px color-gray-500>为了您的账号安全，请定期更新密码</span>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" mt-10px p-10px>
      <el-form-item prop="password" label="当前密码">
        <el-input type="password" v-model="form.password" placeholder="请输入当前密码" show-password />
      </el-form-item>
      <el-form-item prop="newPassword" label="新密码">
        <el-input
          type="password"
          v-model="form.newPassword"
          placeholder="新密码(包含特殊字符和大写字母)"
          show-password
        />
      </el-form-item>
      <el-form-item prop="confirmPassword" label="确认新密码">
        <el-input
          type="password"
          v-model="form.confirmPassword"
          placeholder="请确认新密码"
          show-password
          @paste.prevent="
            () => {
              return false
            }
          "
          @keydown.enter="handleSave"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="loading">确认</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
