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

type VenueForm = Omit<Venue, "id" | "createTime" | "updateTime" | "totalSeats">
type VenueSubmitPayload = Omit<Venue, "createTime" | "updateTime" | "totalSeats">

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
  unitCapacity: 0,
  slotMinutes: 0,
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
  total: [{ required: true, message: "请输入场地单元数量", trigger: "change" }],
  unitCapacity: [{ required: true, message: "请输入每个场地人数", trigger: "change" }],
  slotMinutes: [{ required: true, message: "请输入最小预约时间单元", trigger: "change" }],
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
  form.unitCapacity = 0
  form.slotMinutes = 0
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
  form.unitCapacity = Number(venue.unitCapacity ?? 0)
  form.slotMinutes = Number(venue.slotMinutes ?? 0)
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

  const payload: VenueSubmitPayload = {
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
    class="venue-dialog"
    width="min(1040px, calc(100vw - 32px))"
    top="4vh"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <template #header>
      <div class="venue-dialog__header">
        <div class="venue-dialog__title">{{ dialogTitle }}</div>
        <div class="venue-dialog__subtitle">
          完成基础信息、容量配置和开放时间设置后即可投入预约使用
        </div>
      </div>
    </template>

    <div class="venue-dialog__body">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="108px"
        label-position="right"
        class="venue-form"
      >
        <section class="venue-form__section">
          <div class="venue-form__section-title">基础信息</div>
          <el-row :gutter="18">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="场馆名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入场馆名称" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
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

          <el-row :gutter="18">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="所在位置" prop="location">
                <el-input v-model="form.location" placeholder="请输入场馆位置" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="是否开放" prop="status" class="venue-form__switch-item">
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
        </section>

        <section class="venue-form__section">
          <div class="venue-form__section-title">预约规则</div>
          <el-row :gutter="18">
            <el-col :xs="24" :sm="24" :md="12">
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
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="最小预约单元" prop="slotMinutes">
                <el-input-number
                  v-model="form.slotMinutes"
                  :min="1"
                  :step="5"
                  controls-position="right"
                  class="full-width-input-number"
                />
                <div class="venue-form__inline-hint">单位：分钟，起止时间需按该单元对齐。</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="18">
            <el-col :xs="24" :sm="24" :md="12">
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
            <el-col :xs="24" :sm="24" :md="12">
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

          <el-row :gutter="18">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="场地单元数" prop="total">
                <el-input-number
                  v-model="form.total"
                  :min="1"
                  :step="1"
                  controls-position="right"
                  class="full-width-input-number"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="每场地人数" prop="unitCapacity">
                <el-input-number
                  v-model="form.unitCapacity"
                  :min="1"
                  :step="1"
                  controls-position="right"
                  class="full-width-input-number"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

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
                    v-if="imageUrl"
                    :src="imageUrl"
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
                v-model="form.description"
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
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="handleCancel">取 消</el-button>
        <el-button size="large" type="primary" @click="handleConfirm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.venue-dialog__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.venue-dialog__title {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.venue-dialog__subtitle {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.venue-dialog__body {
  max-height: min(76vh, 740px);
}

.venue-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.venue-form__section {
  padding: 18px 20px 8px;
  border: 1px solid #e8edf5;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.venue-form__section--media {
  padding-bottom: 18px;
}

.venue-form__section-title {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2a37;
}

.venue-form__media-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.venue-form__media-item {
  margin-bottom: 0;
}

.venue-form__upload-item :deep(.el-form-item__content) {
  display: block;
}

.venue-form__upload-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.venue-form__upload-tip,
.venue-form__inline-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.venue-form__switch-item :deep(.el-form-item__content) {
  min-height: 40px;
  display: flex;
  align-items: center;
}

.venue-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.venue-form :deep(.el-form-item__label) {
  color: #4b5563;
  white-space: nowrap;
}

.venue-form :deep(.el-input__wrapper),
.venue-form :deep(.el-textarea__inner),
.venue-form :deep(.el-input-number),
.venue-form :deep(.el-select__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #d2dae6 inset;
}

.venue-form :deep(.el-input__wrapper),
.venue-form :deep(.el-select__wrapper),
.venue-form :deep(.el-input-number .el-input__wrapper) {
  min-height: 42px;
}

.venue-form :deep(.el-input-number) {
  overflow: hidden;
}

.venue-form :deep(.el-input-number__increase),
.venue-form :deep(.el-input-number__decrease) {
  width: 40px;
  color: #6b7280;
  background: #f7faff;
  border-left: 1px solid #d2dae6;
}

.venue-form :deep(.el-input-number__increase) {
  border-bottom: 1px solid #d2dae6;
}

.venue-form :deep(.el-textarea__inner) {
  min-height: 172px;
  padding-top: 12px;
}

.full-width-input-number,
.full-width-picker {
  width: 100%;
}

.venue-cover-icon {
  font-size: 32px;
}

.venue-cover-placeholder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  width: 100%;
  height: 100%;
}

.venue-cover-image {
  width: 100%;
  height: 168px;
  object-fit: cover;
  border-radius: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
}

@media (max-width: 960px) {
  .venue-form__media-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .venue-dialog__subtitle {
    font-size: 12px;
  }

  .venue-form__section {
    padding: 16px 14px 6px;
    border-radius: 14px;
  }

  .venue-form :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .venue-form {
    :deep(.el-form-item__label) {
      width: 108px !important;
    }
  }
}

@media (max-height: 820px) {
  .venue-dialog__body {
    max-height: 74vh;
  }

  .venue-form {
    gap: 12px;
  }

  .venue-form__section {
    padding-top: 16px;
    padding-bottom: 6px;
  }

  .venue-form__section-title {
    margin-bottom: 12px;
  }

  .venue-cover-image {
    height: 148px;
  }

  .venue-form :deep(.el-textarea__inner) {
    min-height: 148px;
  }
}
</style>

<style lang="scss">
.venue-cover-uploader .el-upload {
  border: 1px dashed #cdd8ea;
  border-radius: 14px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 100%;
  height: 168px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f7faff 0%, #eef4fb 100%);
}

.venue-cover-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 10px 24px rgba(64, 158, 255, 0.12);
}

.venue-dialog {
  padding: 0 8px;
}

.venue-dialog .el-dialog {
  max-width: calc(100vw - 32px);
  border-radius: 20px;
  overflow: hidden;
}

.venue-dialog .el-dialog__header {
  padding: 24px 28px 10px;
}

.venue-dialog .el-dialog__body {
  padding: 0 28px 8px;
  overflow-y: auto;
}

.venue-dialog .el-dialog__footer {
  padding: 0 28px 22px;
}

@media (max-width: 768px) {
  .venue-dialog .el-dialog {
    max-width: calc(100vw - 16px);
  }

  .venue-dialog .el-dialog__header {
    padding: 20px 18px 10px;
  }

  .venue-dialog .el-dialog__body {
    padding: 0 18px 8px;
  }

  .venue-dialog .el-dialog__footer {
    padding: 0 18px 18px;
  }
}

@media (max-height: 820px) {
  .venue-cover-uploader .el-upload {
    height: 148px;
  }
}
</style>
