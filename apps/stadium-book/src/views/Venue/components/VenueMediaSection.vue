<script setup lang="ts">
import type { UploadProps } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, ref, watch } from "vue"

const props = defineProps<{
  image: string
  headers: Record<string, string>
}>()

const emit = defineEmits<{
  "update:image": [value: string]
}>()

const localPreviewUrl = ref("")

const imageModel = computed({
  get: () => props.image,
  set: (value: string) => emit("update:image", value),
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
    <div class="venue-form__section-title">封面图片</div>
    <el-form-item prop="image" class="venue-form__media-item venue-form__upload-item">
      <div class="venue-form__upload-panel">
        <div class="venue-form__upload-heading">
          <span class="venue-form__upload-heading-title">封面图片</span>
          <span class="venue-form__upload-tip">建议上传横版封面，展示更协调</span>
        </div>
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
  </section>
</template>
