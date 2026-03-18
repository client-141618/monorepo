<script setup lang="ts">
import type { UploadProps } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, ref, watch } from "vue"

const props = defineProps<{
  image: string
  description: string
  headers: Record<string, string>
}>()

const emit = defineEmits<{
  "update:image": [value: string]
  "update:description": [value: string]
}>()

const localPreviewUrl = ref("")

const imageModel = computed({
  get: () => props.image,
  set: (value: string) => emit("update:image", value),
})

const descriptionModel = computed({
  get: () => props.description,
  set: (value: string) => emit("update:description", value),
})

const displayImageUrl = computed(() => localPreviewUrl.value || imageModel.value || "")

watch(
  () => props.image,
  (value) => {
    if (!value) {
      localPreviewUrl.value = ""
    }
  },
)

const handleCoverSuccess: UploadProps["onSuccess"] = (response, uploadFile) => {
  if (uploadFile?.raw) {
    localPreviewUrl.value = URL.createObjectURL(uploadFile.raw)
  }

  if (response?.code === 200) {
    imageModel.value = response.data || ""
  } else {
    ElMessage.error(response?.msg || "上传失败")
  }
}

const beforeCoverUpload: UploadProps["beforeUpload"] = (rawFile) => {
  const isImage =
    rawFile.type === "image/jpeg" ||
    rawFile.type === "image/png" ||
    rawFile.type === "image/jpg"

  if (!isImage) {
    ElMessage.error("仅支持 JPG/PNG 图片!")
    return false
  }

  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error("图片大小不能超过 2MB!")
    return false
  }

  return true
}
</script>

<template>
  <section class="venue-form__section venue-form__section--media">
    <div class="venue-form__section-title">展示信息</div>
    <div class="venue-form__media-grid">
      <el-form-item label="封面图片" prop="image" class="venue-form__media-item venue-form__upload-item">
        <div class="venue-form__upload-panel">
          <div class="venue-form__upload-tip">建议上传横版封面，展示更协调</div>
          <el-upload
            class="venue-cover-uploader"
            action="/api/file/upload"
            :headers="headers"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
          >
            <img
              v-if="displayImageUrl"
              :src="displayImageUrl"
              alt="封面图片"
              class="venue-cover-image"
            />
            <div v-else class="venue-cover-placeholder">
              <el-icon class="venue-cover-icon">
                <Plus />
              </el-icon>
              <span>上传封面</span>
            </div>
          </el-upload>
        </div>
      </el-form-item>

      <el-form-item label="场馆介绍" prop="description" class="venue-form__media-item">
        <el-input
          v-model="descriptionModel"
          type="textarea"
          :rows="7"
          placeholder="请输入场馆介绍"
          maxlength="300"
          show-word-limit
          resize="none"
        />
      </el-form-item>
    </div>
  </section>
</template>
