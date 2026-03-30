<script setup lang="ts">
import type { UploadProps } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, ref, watch } from "vue"
import { buildApiUrl } from "@/utils/api-url"

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
const uploadAction = buildApiUrl("/api/file/upload")

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
    <div class="venue-form__cover-layout">
      <div class="venue-form__cover-title">封面图片</div>
      <div class="venue-form__cover-main">
        <div class="venue-form__upload-tip">建议上传横版封面，展示更协调</div>
        <el-form-item
          prop="image"
          :label-width="0"
          class="venue-form__media-item venue-form__upload-item"
        >
          <div class="venue-form__upload-panel">
            <el-upload
              class="venue-cover-uploader"
              :action="uploadAction"
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
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.venue-form__cover-layout {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 12px;
  align-items: start;
}

.venue-form__cover-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2a37;
  line-height: 1.6;
}

.venue-form__cover-main {
  min-width: 0;
}

@media (max-width: 768px) {
  .venue-form__cover-layout {
    grid-template-columns: 1fr;
    row-gap: 8px;
  }
}
</style>
