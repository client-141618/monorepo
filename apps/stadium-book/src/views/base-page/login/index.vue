<script setup lang="ts">
import type { FormInstance, TabsPaneContext } from 'element-plus'
import { DArrowRight, Lock, Phone, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '@/api/base'

const router = useRouter()
const activeName = ref<string>('login')
const formRef = ref<FormInstance>()
const form = ref({
  phone: '',
  password: '',
  code: '',
})
const registerFormRef = ref<FormInstance>()
const registerForm = ref({
  username: '',
  phone: '',
  password: '',
  repeatPassword: '',
})
const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 10, message: '用户名长度为3-10位', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 16, message: '密码长度为8-16位', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (!value) {
          callback()
          return
        }
        if (!/[A-Z]/.test(value) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
          callback(new Error('密码强度过低，请包含大写字母和特殊字符'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  repeatPassword: [
    { required: true, message: '请输入确认密码', trigger: 'blur' },
    { validator: (_rule: any, value: string, callback: any) => {
      if (value !== registerForm.value.password) {
        callback(new Error('两次密码不一致'))
        return
      }
      callback()
    }, trigger: 'blur' },
  ],
})

const handleClick = (tab: TabsPaneContext) => {
  activeName.value = tab.props.name as string

  if (tab.props.name === 'login') {
    formRef.value?.clearValidate()
  } else if (tab.props.name === 'register') {
    registerFormRef.value?.clearValidate()
  }
}

const goRegister = () => {
  activeName.value = 'register'
  formRef.value?.clearValidate()
}
const handleLogin = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      const res = await login(form.value)
      if (res.code === 200) {
        ElMessage.success('登录成功')
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        router.push('/')
      } else {
        ElMessage.error(res.msg || '登录失败')
      }
    }
  },
  )
}

const handleRegister = async () => {
  registerFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      const res = await register(registerForm.value)
      if (res.code === 200) {
        ElMessage.success('注册成功')
        const phone = registerForm.value.phone
        registerFormRef.value?.resetFields()
        activeName.value = 'login'
        form.value.phone = phone
        formRef.value?.clearValidate()
      } else {
        ElMessage.error(res.msg || '注册失败')
      }
    }
  })
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <el-tabs v-model="activeName" @tab-click="handleClick" default-active="login" stretch>
        <el-tab-pane label="登录" name="login">
          <div min-h-300px w-full flex flex-col items-center justify-center p-12px>
            <span mb-6px mt-8px text-2xl font-bold>账号密码登录</span>
            <el-form :model="form" w-full :rules="rules" ref="formRef">
              <el-form-item prop="phone">
                <el-input :prefix-icon="Phone" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
              <el-form-item>
                <el-input
                  type="password"
                  :prefix-icon="Lock"
                  v-model="form.password"
                  placeholder="请输入密码"
                  show-password
                />
              </el-form-item>
            </el-form>
            <div mt-a w-full flex flex-col items-end justify-end>
              <div font-size-12px>没有账号？<el-text type="primary" cursor-pointer underline @click="goRegister">去注册<el-icon><DArrowRight /></el-icon></el-text></div>
              <el-button type="primary" w-full @click="handleLogin">登录</el-button>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <div min-h-300px w-full flex flex-col items-center justify-center p-12px>
            <span mb-6px mt-8px text-2xl font-bold>欢迎注册</span>
            <el-form :model="registerForm" w-full :rules="rules" ref="registerFormRef">
              <el-form-item prop="username">
                <el-input :prefix-icon="User" v-model="registerForm.username" placeholder="请输入用户名" />
              </el-form-item>
              <el-form-item prop="phone" required>
                <el-input :prefix-icon="Phone" v-model="registerForm.phone" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
              <el-form-item prop="password" required>
                <el-input
                  type="password"
                  :prefix-icon="Lock"
                  v-model="registerForm.password"
                  placeholder="请输入密码"
                  show-password
                />
              </el-form-item>
              <el-form-item prop="repeatPassword" required>
                <el-input
                  type="password"
                  :prefix-icon="Lock"
                  v-model="registerForm.repeatPassword"
                  placeholder="确认密码"
                  show-password
                  @paste.prevent="() => { return false }"
                />
              </el-form-item>
            </el-form>
            <el-button mt-a w-full type="primary" @click="handleRegister">注册</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  width: 100vw;
  background-color: #f5f7fa;

  .login-box {
    position: relative;
    left: 50%;
    top: 20%;
    width: 400px;
    height: 400px;
    padding: 20px;
    background-color: #fff;
  }
}
</style>
