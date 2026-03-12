<script setup lang="ts">
import type { FormInstance, FormRules, UploadProps } from "element-plus"
import type { Venue } from "@/api/venue/type"
import { Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, reactive, ref, watch } from "vue"
import { addVenueApi, updateVenueApi } from "@/api/venue"
import { VENUE_TYPE_OPTIONS } from "@/constants/venue"

const props = defineProps<{
  visible: boolean
  mode?: "create" | "edit"
  editData?: Venue | null
}>()

const emit = defineEmits(["update:visible", "success"])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit("update:visible", val),
})

const isEditMode = computed(() => props.mode === "edit")
const dialogTitle = computed(() => (isEditMode.value ? "编辑场馆" : "新增场馆"))

type VenueForm = Omit<Venue, "id" | "createTime" | "updateTime">

const formRef = ref<FormInstance>()

const form = reactive<VenueForm>({
  name: "",
  image: "",
  type: undefined as unknown as number,
  description: "",
  location: "",
  pricePerHour: 0,
  openTime: "",
  closeTime: "",
  total: 0,
  status: 1,
})

const imageUrl = ref<string>("")

const rules: FormRules<VenueForm> = {
  name: [{ required: true, message: "请输入场馆名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择场馆类型", trigger: "change" }],
  pricePerHour: [
    { required: true, message: "请输入每小时价格", trigger: "change" },
  ],
  openTime: [{ required: true, message: "请选择开放时间", trigger: "change" }],
  closeTime: [{ required: true, message: "请选择关闭时间", trigger: "change" }],
  total: [{ required: true, message: "请输入总容量", trigger: "change" }],
}

const resetForm = () => {
  form.name = ""
  form.image = ""
  form.type = undefined as unknown as number
  form.description = ""
  form.location = ""
  form.pricePerHour = 0
  form.openTime = ""
  form.closeTime = ""
  form.total = 0
  form.status = 1
  imageUrl.value = ""
}

const setFormByVenue = (venue: Venue) => {
  form.name = venue.name ?? ""
  form.image = venue.image ?? ""
  form.type = venue.type
  form.description = venue.description ?? ""
  form.location = venue.location ?? ""
  form.pricePerHour = Number((Number(venue.pricePerHour) / 100).toFixed(2))
  form.openTime = venue.openTime ?? ""
  form.closeTime = venue.closeTime ?? ""
  form.total = Number(venue.total ?? 0)
  form.status = venue.status ?? 1
  imageUrl.value = form.image || ""
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleClosed = () => {
  formRef.value?.clearValidate()
  resetForm()
}

const handleConfirm = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate()
  if (!valid) return

  const payload: Venue = {
    ...(form as unknown as Venue),
    id: props.editData?.id ?? 0,
    pricePerHour: Math.round(Number(form.pricePerHour) * 100),
  }

  if (isEditMode.value) {
    await updateVenueApi(payload)
  } else {
    await addVenueApi(payload)
  }

  emit("success")
}

const headers = computed(() => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}")
  return {
    token: storedUser?.token || "",
  }
})

const handleCoverSuccess: UploadProps["onSuccess"] = (response, uploadFile) => {
  if (uploadFile?.raw) {
    imageUrl.value = URL.createObjectURL(uploadFile.raw)
  }

  if (response?.code === 200) {
    form.image = response.data
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

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    formRef.value?.clearValidate()
    if (isEditMode.value && props.editData) {
      setFormByVenue(props.editData)
      return
    }
    resetForm()
  },
)
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="680px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="96px"
      label-position="right"
      class="venue-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="场馆名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入场馆名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="场馆类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择场馆类型">
              <el-option
                v-for="opt in VENUE_TYPE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所在位置" prop="location">
            <el-input v-model="form.location" placeholder="请输入场馆位置" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否开放" prop="status">
            <el-switch
              v-model="form.status"
              :active-value="1"
              :inactive-value="0"
              active-text="开放"
              inactive-text="关闭"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="每小时价格" prop="pricePerHour">
            <el-input-number
              v-model="form.pricePerHour"
              :min="0"
              :step="10"
              :precision="2"
              controls-position="right"
              class="full-width-input-number"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" />
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="开放时间" prop="openTime">
            <el-time-picker
              v-model="form.openTime"
              placeholder="请选择开放时间"
              format="HH:mm"
              value-format="HH:mm"
              class="full-width-picker"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="关闭时间" prop="closeTime">
            <el-time-picker
              v-model="form.closeTime"
              placeholder="请选择关闭时间"
              format="HH:mm"
              value-format="HH:mm"
              class="full-width-picker"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="总容量" prop="total">
            <el-input-number
              v-model="form.total"
              :min="0"
              :step="10"
              controls-position="right"
              class="full-width-input-number"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" />
      </el-row>

      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="封面图片" prop="image">
            <el-upload
              class="venue-cover-uploader"
              action="/api/file/upload"
              :headers="headers"
              :show-file-list="false"
              :on-success="handleCoverSuccess"
              :before-upload="beforeCoverUpload"
            >
              <img
                v-if="imageUrl"
                :src="imageUrl"
                alt="封面图片"
                class="venue-cover-image"
              />
              <el-icon v-else class="venue-cover-icon">
                <Plus />
              </el-icon>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="场馆介绍" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入场馆介绍"
          maxlength="300"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.venue-form {
  padding-top: 8px;
}

.full-width-input-number,
.full-width-picker {
  width: 100%;
}

.venue-cover-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.venue-cover-icon {
  font-size: 32px;
  color: var(--el-text-color-secondary);
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.venue-cover-image {
  width: 160px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style lang="scss">
.venue-cover-uploader .el-upload {
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
  background-color: var(--el-fill-color-lighter);
}
</style>
