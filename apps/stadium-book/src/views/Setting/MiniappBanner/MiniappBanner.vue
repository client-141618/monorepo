<script setup lang="ts">
import type { UploadProps } from "element-plus"
import type { MiniappBanner } from "@/api/miniapp-banner/type"
import { Plus } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref } from "vue"
import {
  addMiniappBannerApi,
  deleteMiniappBannerApi,
  getMiniappBannerListApi,
} from "@/api/miniapp-banner"
import PageContentShell from "@/components/PageContentShell/index.vue"
import PageRouteTitle from "@/components/PageRouteTitle/index.vue"
import { formatDateTimeText } from "@/utils/format"

const tableLoading = ref(false)
const uploadLoading = ref(false)
const bannerList = ref<MiniappBanner[]>([])

const uploadHeaders = computed(() => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}")
  return {
    token: storedUser?.token || "",
  }
})

const getBannerList = async () => {
  try {
    tableLoading.value = true
    const res = await getMiniappBannerListApi()
    bannerList.value = Array.isArray(res.data) ? res.data : []
  } finally {
    tableLoading.value = false
  }
}

const beforeBannerUpload: UploadProps["beforeUpload"] = (rawFile) => {
  const isImage =
    rawFile.type === "image/jpeg" ||
    rawFile.type === "image/png" ||
    rawFile.type === "image/jpg" ||
    rawFile.type === "image/webp"

  if (!isImage) {
    ElMessage.error("仅支持 JPG/PNG/WEBP 图片")
    return false
  }

  if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error("图片大小不能超过 5MB")
    return false
  }

  uploadLoading.value = true
  return true
}

const handleUploadSuccess: UploadProps["onSuccess"] = async (response) => {
  try {
    if (response?.code !== 200 || !response?.data) {
      ElMessage.error(response?.msg || "上传失败")
      return
    }

    await addMiniappBannerApi({
      imageUrl: String(response.data),
    })
    ElMessage.success("Banner 新增成功")
    await getBannerList()
  } finally {
    uploadLoading.value = false
  }
}

const handleUploadError: UploadProps["onError"] = () => {
  uploadLoading.value = false
  ElMessage.error("上传失败")
}

const handleDelete = async (row: MiniappBanner) => {
  try {
    await ElMessageBox.confirm("确认删除这张 Banner？", "提示", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button--danger",
    })
  } catch (_error) {
    return
  }

  await deleteMiniappBannerApi(row.id)
  ElMessage.success("删除成功")
  await getBannerList()
}

onMounted(() => {
  getBannerList()
})
</script>

<template>
  <PageContentShell class="miniapp-banner-page">
    <template #header>
      <div class="miniapp-banner-page__header">
        <PageRouteTitle fallback-title="小程序banner设置" />
        <div class="miniapp-banner-page__actions">
          <el-button :disabled="tableLoading" @click="getBannerList">刷新</el-button>
          <el-upload
            action="/api/file/upload"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="beforeBannerUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
          >
            <el-button type="primary" :loading="uploadLoading">
              <el-icon><Plus /></el-icon>
              新增 Banner
            </el-button>
          </el-upload>
        </div>
      </div>
    </template>

    <el-card shadow="never" class="miniapp-banner-page__card">
      <div class="miniapp-banner-page__table-wrap">
        <el-table
          v-loading="tableLoading"
          :data="bannerList"
          stripe
          height="100%"
          empty-text="暂无 Banner 数据"
        >
          <el-table-column prop="id" label="ID" width="100" />
          <el-table-column label="图片" min-width="320">
            <template #default="{ row }">
              <el-image
                :src="row.imageUrl"
                fit="cover"
                preview-teleported
                :preview-src-list="[row.imageUrl]"
                class="miniapp-banner-page__image"
              />
            </template>
          </el-table-column>
          <el-table-column prop="imageUrl" label="URL" min-width="380" show-overflow-tooltip />
          <el-table-column label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTimeText(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </PageContentShell>
</template>

<style scoped lang="scss">
.miniapp-banner-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.miniapp-banner-page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.miniapp-banner-page__card {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
}

.miniapp-banner-page__image {
  width: 240px;
  height: 96px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

:deep(.miniapp-banner-page__card .el-card__body) {
  height: 100%;
  min-height: 0;
  padding: 0;
}

.miniapp-banner-page__table-wrap {
  height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
}
</style>
