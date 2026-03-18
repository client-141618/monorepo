<script setup lang="ts">
import type { Venue } from "@/api/venue/type"
import { computed, watch } from "vue"
import VenueLocationVerifyFields from "@/components/venue/VenueLocationVerifyFields.vue"
import { useTencentMapConfig } from "@/composables/useTencentMapConfig"
import VenueBasicInfoSection from "./components/VenueBasicInfoSection.vue"
import VenueBookingRulesSection from "./components/VenueBookingRulesSection.vue"
import VenueMediaSection from "./components/VenueMediaSection.vue"
import { useVenueFormDialog } from "./composables/useVenueFormDialog"

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

const {
  formRef,
  form,
  rules,
  venueTypeOptions,
  venueTypeLoading,
  ensureVenueTypeOptions,
  timeSelectStep,
  timeSelectEnd,
  isSlotMinuteReady,
  isTimeAlignedWithSlot,
  getSlotMinuteValue,
  resetForm,
  setFormByVenue,
  submitVenue,
} = useVenueFormDialog()

const { ensureLoaded: ensureTencentMapLoaded } = useTencentMapConfig()

const handleCancel = () => {
  dialogVisible.value = false
}

const handleClosed = () => {
  formRef.value?.clearValidate()
  resetForm()
}

const handleConfirm = async () => {
  const success = await submitVenue(props.mode, props.editData)
  if (!success) return
  emit("success")
}

const headers = computed(() => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}")
  return {
    token: storedUser?.token || "",
  }
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    formRef.value?.clearValidate()
    if (isEditMode.value && props.editData) {
      setFormByVenue(props.editData)
    } else {
      resetForm()
    }
    ensureVenueTypeOptions()
    ensureTencentMapLoaded().catch(() => {})
  },
)

watch(
  () => form.slotMinutes,
  () => {
    if (!isSlotMinuteReady()) {
      form.openTime = ""
      form.closeTime = ""
      return
    }

    const slot = getSlotMinuteValue()
    if (form.openTime && !isTimeAlignedWithSlot(form.openTime, slot)) {
      form.openTime = ""
    }
    if (form.closeTime && !isTimeAlignedWithSlot(form.closeTime, slot)) {
      form.closeTime = ""
    }
  },
)

watch(
  () => form.enableLocationVerify,
  (enabled) => {
    if (enabled === 1) return
    formRef.value?.clearValidate(["checkinRadiusM", "checkinLatGcj02", "location"])
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
        <VenueBasicInfoSection
          v-model:form="form"
          :venue-type-options="venueTypeOptions"
          :venue-type-loading="venueTypeLoading"
        />

        <VenueLocationVerifyFields
          v-model:enable-location-verify="form.enableLocationVerify"
          v-model:location="form.location"
          v-model:checkin-lat-gcj02="form.checkinLatGcj02"
          v-model:checkin-lng-gcj02="form.checkinLngGcj02"
          v-model:checkin-radius-m="form.checkinRadiusM"
        />

        <VenueBookingRulesSection
          v-model:form="form"
          :is-slot-minute-ready="isSlotMinuteReady()"
          :time-select-step="timeSelectStep()"
          :time-select-end="timeSelectEnd()"
        />

        <VenueMediaSection
          v-model:image="form.image"
          v-model:description="form.description"
          :headers="headers"
        />
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

<style lang="scss">
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
