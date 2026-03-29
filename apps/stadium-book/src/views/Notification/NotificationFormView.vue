<script setup lang="ts">
import type { IDomEditor } from "@wangeditor/editor"
import type { FormInstance, FormRules } from "element-plus"
import type { NotificationType } from "@/constants/notification"
import { Editor, Toolbar } from "@wangeditor/editor-for-vue"
import { ElMessage } from "element-plus"
import { computed, onBeforeUnmount, ref, shallowRef } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  createNotificationApi,
  getNotificationByIdApi,
  updateNotificationApi,
} from "@/api/notification"
import PageContentShell from "@/components/PageContentShell/index.vue"
import {
  getNotificationTypeLabel,
  NOTIFICATION_PUBLISH_STATUS_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
} from "@/constants/notification"
import { VenueRoute } from "@/router/routes/RouteNameEnum"
import { sanitizeRichHtml } from "@/utils/sanitizeHtml"
import "@wangeditor/editor/dist/css/style.css"

interface NotificationFormData {
  title: string
  summary: string
  content: string
  type: NotificationType
  targetUserIdsText: string
  creatorName: string
  publishStatus: 0 | 1
}

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editorRef = shallowRef<IDomEditor>()

const form = ref<NotificationFormData>({
  title: "",
  summary: "",
  content: "",
  type: 1,
  targetUserIdsText: "",
  creatorName: "",
  publishStatus: 0,
})

const editorConfig = {
  placeholder: "请输入通知内容（支持富文本 HTML）",
}

const toolbarConfig = {
  excludeKeys: ["group-video", "todo", "insertTable"],
}

const currentId = computed(() => Number(route.params.id))
const isCreate = computed(() => route.name === VenueRoute.NotificationCreate)
const isEdit = computed(() => route.name === VenueRoute.NotificationEdit)
const isDetail = computed(() => route.name === VenueRoute.NotificationDetail)
const isReadonly = computed(() => isDetail.value)

const pageTitle = computed(() => {
  if (isCreate.value) return "新建通知"
  if (isEdit.value) return "编辑通知"
  return "通知详情"
})

const displayType = computed(() => getNotificationTypeLabel(form.value.type))
const safeDetailHtml = computed(() => sanitizeRichHtml(form.value.content))
const displayTargetUser = computed(() => {
  const text = form.value.targetUserIdsText.trim()
  if (!text) return "全体用户"
  return text
})
const displayCreator = computed(() => form.value.creatorName || "--")

const rules: FormRules<NotificationFormData> = {
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  summary: [{ required: true, message: "请输入摘要", trigger: "blur" }],
  type: [{ required: true, message: "请选择通知类型", trigger: "change" }],
  content: [{ required: true, message: "请输入通知内容", trigger: "blur" }],
}

const onEditorCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

const loadDetail = async () => {
  if (!Number.isFinite(currentId.value) || currentId.value <= 0) return
  loading.value = true
  try {
    const res = await getNotificationByIdApi(currentId.value)
    const data = res.data
    const targetUserIds = Array.isArray(data.targetUserIds)
      ? data.targetUserIds.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0)
      : []
    form.value = {
      title: data.title,
      summary: data.summary,
      content: data.content,
      type: data.type,
      targetUserIdsText: targetUserIds.join(", "),
      creatorName: data.creatorName || "",
      publishStatus: data.publishStatus,
    }
  } finally {
    loading.value = false
  }
}

const backToList = () => {
  router.push({ name: VenueRoute.NotificationList })
}

const buildPayload = () => {
  const idText = form.value.targetUserIdsText.trim()
  const targetUserIds = idText
    ? idText
        .split(/[,\s，]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => Number(item))
    : []

  if (targetUserIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    ElMessage.warning("目标用户ID格式错误，请输入正整数，多个ID用逗号分隔")
    return null
  }

  const dedupTargetUserIds = Array.from(new Set(targetUserIds))

  const payload = {
    title: form.value.title.trim(),
    summary: form.value.summary.trim(),
    content: form.value.content,
    type: form.value.type,
    targetUserIds: dedupTargetUserIds,
    publishStatus: form.value.publishStatus,
  }
  if (isEdit.value) {
    return {
      ...payload,
      id: currentId.value,
    }
  }

  return payload
}

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const payload = buildPayload()
  if (!payload) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateNotificationApi(payload)
      ElMessage.success("更新成功")
    } else {
      await createNotificationApi(payload)
      ElMessage.success("创建成功")
    }
    backToList()
  } finally {
    submitting.value = false
  }
}

if (!isCreate.value) {
  loadDetail()
}

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})
</script>

<template>
  <PageContentShell
    class="notification-form-view"
    :body-scroll="true"
    :skeleton-loading="loading"
    skeleton-variant="detail"
  >
    <template #header>
      <div v-if="isDetail" class="notification-form-view__header notification-form-view__header--detail">
        <div class="notification-form-view__back-row">
          <el-button @click="backToList">返回列表</el-button>
        </div>
        <div class="notification-form-view__title notification-form-view__title--center">
          {{ pageTitle }}
        </div>
      </div>

      <div v-else class="notification-form-view__header">
        <el-button @click="backToList">返回列表</el-button>
        <div class="notification-form-view__title">{{ pageTitle }}</div>
        <div class="notification-form-view__spacer">
          <el-button type="primary" :loading="submitting" @click="submit">
            {{ isEdit ? "保存" : "创建" }}
          </el-button>
        </div>
      </div>
    </template>

    <el-form
      v-if="!isReadonly"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      class="notification-form"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" maxlength="80" show-word-limit />
      </el-form-item>

      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" style="width: 220px">
          <el-option
            v-for="item in NOTIFICATION_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="摘要" prop="summary">
        <el-input v-model="form.summary" maxlength="120" show-word-limit />
      </el-form-item>

      <el-form-item label="目标用户">
        <el-input
          v-model="form.targetUserIdsText"
          placeholder="多个用户ID用逗号分隔；留空表示全体用户"
        />
      </el-form-item>

      <el-form-item label="发布状态">
        <el-radio-group v-model="form.publishStatus">
          <el-radio
            v-for="item in NOTIFICATION_PUBLISH_STATUS_OPTIONS"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="通知内容" prop="content">
        <div class="notification-editor">
          <Toolbar
            :editor="editorRef"
            :default-config="toolbarConfig"
            mode="default"
            class="notification-editor__toolbar"
          />
          <Editor
            v-model="form.content"
            :default-config="editorConfig"
            mode="default"
            class="notification-editor__content"
            @on-created="onEditorCreated"
          />
        </div>
      </el-form-item>
    </el-form>

    <div v-else class="notification-detail">
      <h1 class="notification-detail__title">{{ form.title }}</h1>
      <div class="notification-detail__meta">
        <el-tag>{{ displayType }}</el-tag>
        <el-tag :type="form.publishStatus === 1 ? 'success' : 'info'">
          {{ form.publishStatus === 1 ? "已发布" : "草稿" }}
        </el-tag>
      </div>
      <div class="notification-detail__info-grid">
        <div class="notification-detail__info-item">
          <span class="notification-detail__info-label">创建者</span>
          <span class="notification-detail__info-value">{{ displayCreator }}</span>
        </div>
        <div class="notification-detail__info-item">
          <span class="notification-detail__info-label">目标用户ID</span>
          <span class="notification-detail__info-value">{{ displayTargetUser }}</span>
        </div>
      </div>
      <div class="notification-detail__summary">
        {{ form.summary }}
      </div>
      <article class="notification-detail__content" v-html="safeDetailHtml" />
    </div>
  </PageContentShell>
</template>

<style scoped lang="scss">
.notification-form-view__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.notification-form-view__header--detail {
  display: block;
}

.notification-form-view__back-row {
  margin-bottom: 8px;
}

.notification-form-view__title {
  font-size: 18px;
  font-weight: 600;
}

.notification-form-view__title--center {
  text-align: center;
}

.notification-form-view__spacer {
  justify-self: end;
}

.notification-form {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}

.notification-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}

.notification-editor__toolbar {
  border-bottom: 1px solid #ebeef5;
}

.notification-editor__content {
  min-height: 280px;
}

.notification-detail {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.notification-detail__title {
  margin: 0;
  text-align: center;
  font-size: 24px;
  line-height: 1.5;
  color: #303133;
}

.notification-detail__meta {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.notification-detail__summary {
  margin-top: 18px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #606266;
  padding: 12px;
  line-height: 22px;
}

.notification-detail__info-grid {
  margin-top: 16px;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fbfcff;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.notification-detail__info-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.notification-detail__info-label {
  color: #94a3b8;
  font-size: 12px;
  flex: none;
}

.notification-detail__info-value {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-detail__content {
  margin-top: 18px;
  line-height: 1.75;
  color: #303133;
}
</style>
