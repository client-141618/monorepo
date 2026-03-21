<script setup lang="ts">
import type { FormInstance, TabsPaneContext } from "element-plus"
import { ArrowLeftBold, DArrowRight, Lock, Phone } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { useRouter } from "vue-router"
import { forgotPassword, login, register, sendSmsCode } from "@/api/base"
import { useSmsCodeCooldown } from "@/utils/useSmsCodeCooldown"

const router = useRouter()
const activeName = ref<string>("login")
const isForgotPasswordMode = ref(false)
const formRef = ref<FormInstance>()
const form = ref({
  phone: "",
  password: "",
})
const registerFormRef = ref<FormInstance>()
const registerForm = ref({
  username: "默认用户",
  phone: "",
  password: "",
  repeatPassword: "",
  smsCode: "",
})
const forgotPasswordFormRef = ref<FormInstance>()
const forgotPasswordForm = ref({
  phone: "",
  smsCode: "",
  newPassword: "",
  repeatNewPassword: "",
})

const phoneRules = [
  { required: true, message: "请输入手机号", trigger: "blur" },
  {
    pattern: /^1[3-9]\d{9}$/,
    message: "请输入正确的手机号",
    trigger: "blur",
  },
]

const passwordRules = [
  { required: true, message: "请输入密码", trigger: "blur" },
  { min: 8, max: 16, message: "密码长度为8-16位", trigger: "blur" },
  {
    validator: (_rule: any, value: string, callback: any) => {
      if (!value) {
        callback()
        return
      }
      if (!/[A-Z]/.test(value) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
        callback(new Error("密码强度过低，请包含大写字母和特殊字符"))
        return
      }
      callback()
    },
    trigger: "blur",
  },
]

const registerRules = ref({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 10, message: "用户名长度为3-10位", trigger: "blur" },
  ],
  phone: phoneRules,
  password: passwordRules,
  repeatPassword: [
    { required: true, message: "请输入确认密码", trigger: "blur" },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.value.password) {
          callback(new Error("两次密码不一致"))
          return
        }
        callback()
      },
      trigger: "blur",
    },
  ],
  smsCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { min: 6, max: 6, message: "验证码长度为6位", trigger: "blur" },
  ],
})

const loginRules = ref({
  phone: phoneRules,
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
})

const forgotPasswordRules = ref({
  phone: phoneRules,
  smsCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { min: 6, max: 6, message: "验证码长度为6位", trigger: "blur" },
  ],
  newPassword: passwordRules,
  repeatNewPassword: [
    { required: true, message: "请输入确认密码", trigger: "blur" },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== forgotPasswordForm.value.newPassword) {
          callback(new Error("两次密码不一致"))
          return
        }
        callback()
      },
      trigger: "blur",
    },
  ],
})

const handleClick = (tab: TabsPaneContext) => {
  activeName.value = tab.props.name as string
  isForgotPasswordMode.value = false

  if (tab.props.name === "login") {
    formRef.value?.clearValidate()
  } else if (tab.props.name === "register") {
    registerFormRef.value?.clearValidate()
  }
}

const goRegister = () => {
  activeName.value = "register"
  isForgotPasswordMode.value = false
  formRef.value?.clearValidate()
}

const goForgotPassword = () => {
  isForgotPasswordMode.value = true
  forgotPasswordForm.value.phone = form.value.phone
  forgotPasswordFormRef.value?.clearValidate()
}

const backToLogin = () => {
  isForgotPasswordMode.value = false
  forgotPasswordFormRef.value?.clearValidate()
}

const handleLogin = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      const res = await login(form.value)
      if (res.code === 200) {
        ElMessage.success("登录成功")
        localStorage.setItem("userInfo", JSON.stringify(res.data))
        router.push("/")
      } else {
        ElMessage.error(res.msg || "登录失败")
      }
    }
  })
}

const handleRegister = async () => {
  registerFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      const res = await register(registerForm.value)
      if (res.code === 200) {
        ElMessage.success("注册成功")
        const phone = registerForm.value.phone
        registerFormRef.value?.resetFields()
        activeName.value = "login"
        form.value.phone = phone
        formRef.value?.clearValidate()
      } else {
        ElMessage.error(res.msg || "注册失败")
      }
    }
  })
}

const handleForgotPassword = async () => {
  forgotPasswordFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    const res = await forgotPassword({
      phone: forgotPasswordForm.value.phone,
      smsCode: forgotPasswordForm.value.smsCode,
      newPassword: forgotPasswordForm.value.newPassword,
    })
    if (res.code === 200) {
      ElMessage.success("密码重置成功，请使用新密码登录")
      form.value.phone = forgotPasswordForm.value.phone
      form.value.password = ""
      forgotPasswordFormRef.value?.resetFields()
      isForgotPasswordMode.value = false
      formRef.value?.clearValidate()
    } else {
      ElMessage.error(res.msg || "密码重置失败")
    }
  })
}

const { isCooldown, buttonText: sendCodeButtonText, startCooldown } =
  useSmsCodeCooldown()

const sendCode = async (target: "register" | "forgot") => {
  if (isCooldown.value) return

  const phone = target === "register"
    ? registerForm.value.phone
    : forgotPasswordForm.value.phone

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.error("请输入正确的手机号")
    return
  }

  const res = await sendSmsCode(phone)
  if (res.code === 200) {
    ElMessage.success("发送验证码成功")
    startCooldown()
  } else {
    ElMessage.error(res.msg || "发送验证码失败")
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <template v-if="isForgotPasswordMode">
        <div class="forgot-header">
          <el-button text class="back-button" @click="backToLogin">
            <el-icon><ArrowLeftBold /></el-icon>
            <span>返回登录</span>
          </el-button>
        </div>
        <div class="panel">
          <el-form
            :model="forgotPasswordForm"
            :rules="forgotPasswordRules"
            ref="forgotPasswordFormRef"
            class="form-body"
          >
            <el-form-item prop="phone">
              <el-input
                :prefix-icon="Phone"
                v-model="forgotPasswordForm.phone"
                placeholder="请输入手机号"
                maxlength="11"
              />
            </el-form-item>
            <el-form-item prop="smsCode">
              <div class="code-row">
                <el-input
                  :prefix-icon="Lock"
                  v-model="forgotPasswordForm.smsCode"
                  placeholder="请输入验证码"
                  maxlength="6"
                />
                <el-button
                  type="primary"
                  :disabled="isCooldown"
                  class="code-btn"
                  @click="sendCode('forgot')"
                >
                  {{ sendCodeButtonText }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item prop="newPassword">
              <el-input
                type="password"
                :prefix-icon="Lock"
                v-model="forgotPasswordForm.newPassword"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item prop="repeatNewPassword">
              <el-input
                type="password"
                :prefix-icon="Lock"
                v-model="forgotPasswordForm.repeatNewPassword"
                placeholder="请再次输入新密码"
                show-password
                @paste.prevent="
                  () => {
                    return false
                  }
                "
                @keydown.enter="handleForgotPassword"
              />
            </el-form-item>
          </el-form>
          <div class="actions">
            <el-button type="primary" class="primary-btn" @click="handleForgotPassword">
              确认重置
            </el-button>
          </div>
        </div>
      </template>
      <template v-else>
        <el-tabs
          v-model="activeName"
          @tab-click="handleClick"
          default-active="login"
          stretch
          class="entry-tabs"
        >
          <el-tab-pane label="登录" name="login">
            <div class="panel">
              <el-form :model="form" :rules="loginRules" ref="formRef" class="form-body">
                <el-form-item prop="phone">
                  <el-input
                    :prefix-icon="Phone"
                    v-model="form.phone"
                    placeholder="请输入手机号"
                    maxlength="11"
                  />
                </el-form-item>
                <el-form-item prop="password">
                  <el-input
                    type="password"
                    :prefix-icon="Lock"
                    v-model="form.password"
                    placeholder="请输入密码"
                    show-password
                    @keydown.enter="handleLogin"
                  />
                </el-form-item>
              </el-form>
              <div class="actions">
                <div class="helper-row">
                  <el-text type="primary" class="helper-link" @click="goForgotPassword">
                    忘记密码
                  </el-text>
                  <div class="register-entry">
                    <span class="helper-muted">没有账号？</span>
                    <el-text type="primary" class="helper-link" @click="goRegister">
                      去注册
                      <el-icon><DArrowRight /></el-icon>
                    </el-text>
                  </div>
                </div>
                <el-button type="primary" class="primary-btn" @click="handleLogin">登录</el-button>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="注册" name="register">
            <div class="panel">
              <el-form
                :model="registerForm"
                :rules="registerRules"
                ref="registerFormRef"
                class="form-body"
              >
                <!-- <el-form-item prop="username">
                  <el-input
                    :prefix-icon="User"
                    v-model="registerForm.username"
                    placeholder="请输入用户名"
                  />
                </el-form-item> -->
                <el-form-item prop="phone" required>
                  <el-input
                    :prefix-icon="Phone"
                    v-model="registerForm.phone"
                    placeholder="请输入手机号"
                    maxlength="11"
                  />
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
                    @paste.prevent="
                      () => {
                        return false
                      }
                    "
                  />
                </el-form-item>
                <el-form-item prop="smsCode" required>
                  <div class="code-row">
                    <el-input
                      :prefix-icon="Lock"
                      v-model="registerForm.smsCode"
                      placeholder="请输入验证码"
                      maxlength="6"
                      @keydown.enter="handleRegister"
                    />
                    <el-button
                      type="primary"
                      :disabled="isCooldown"
                      class="code-btn"
                      @click="sendCode('register')"
                    >
                      {{ sendCodeButtonText }}
                    </el-button>
                  </div>
                </el-form-item>
              </el-form>
              <div class="actions">
                <el-button type="primary" class="primary-btn" @click="handleRegister">注册</el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  width: 100vw;
  background-color: #f5f7fa;
}

.login-box {
  position: relative;
  left: 50%;
  top: 16%;
  width: 400px;
  min-height: 430px;
  padding: 20px;
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 48px rgba(22, 41, 91, 0.15);
  overflow: hidden;
}

.panel {
  display: flex;
  min-height: 380px;
  flex-direction: column;
  padding: 16px 20px 18px;
}

.panel-title {
  margin: 12px 0 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
  text-align: center;
}

.form-body {
  margin-top: 18px;
}

.code-row {
  display: flex;
  width: 100%;
  gap: 10px;
}

.code-btn {
  width: 124px;
  border-radius: 10px;
  font-weight: 500;
}

.actions {
  margin-top: auto;
  padding-top: 10px;
}

.helper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.register-entry {
  display: flex;
  align-items: center;
  gap: 4px;
}

.helper-muted {
  font-size: 13px;
  color: #6b7280;
}

.helper-link {
  cursor: pointer;
  font-size: 13px;
}

.primary-btn {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
}

.secondary-btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0;
  height: 38px;
  border-radius: 10px;
  font-size: 14px;
}

.forgot-header {
  display: flex;
  align-items: center;
  padding: 14px 20px 0;
}

.back-button {
  padding: 4px 0;
  color: #3b82f6;
  font-weight: 500;
}

.entry-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 12px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    background-color: #dbe6f7;
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 10px;
  }

  :deep(.el-tabs__item) {
    height: 52px;
    font-size: 18px;
    font-weight: 600;
    color: #4b5563;
  }

  :deep(.el-tabs__item.is-active) {
    color: #2b67f6;
  }
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-input__wrapper) {
  min-height: 40px;
  border-radius: 10px;
}

@media (max-width: 640px) {
  .login-box {
    left: 50%;
    width: 360px;
    max-width: calc(100vw - 20px);
    min-height: 430px;
  }

  .panel {
    min-height: 380px;
    padding: 16px;
  }

  .panel-title {
    font-size: 28px;
  }

  .code-btn {
    width: 110px;
    font-size: 13px;
  }
}
</style>
