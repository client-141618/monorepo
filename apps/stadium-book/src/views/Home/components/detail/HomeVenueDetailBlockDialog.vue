<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { CreateReservationBlockPayload } from "@/api/reservation/type"
import { ElMessage } from "element-plus"
import { computed, reactive, ref, watch } from "vue"

interface WeekdayOption {
  value: number
  label: string
}

const props = defineProps<{
  visible: boolean
  loading: boolean
  venueId: number
  selectedDate: string
  courtOptions: number[]
  weekdayOptions: WeekdayOption[]
}>()

const emit = defineEmits<{
  (_e: "update:visible", _value: boolean): void
  (_e: "submit", _payload: CreateReservationBlockPayload): void
}>()

const formRef = ref<FormInstance>()
const form = reactive({
  courtScope: "all" as "all" | "single",
  courtId: undefined as number | undefined,
  blockType: 1 as 1 | 2,
  blockDate: "",
  weekday: undefined as number | undefined,
  repeatStartDate: "",
  repeatEndDate: "",
  startTime: "",
  endTime: "",
  reason: "",
})

const rules = computed<FormRules>(() => {
  const currentRules: FormRules = {
    blockType: [{ required: true, message: "请选择规则模式", trigger: "change" }],
    courtScope: [{ required: true, message: "请选择作用范围", trigger: "change" }],
    startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }],
    endTime: [{ required: true, message: "请选择结束时间", trigger: "change" }],
  }
  if (form.courtScope === "single") {
    currentRules.courtId = [{ required: true, message: "请选择场地", trigger: "change" }]
  }
  if (form.blockType === 1) {
    currentRules.blockDate = [{ required: true, message: "请选择日期", trigger: "change" }]
  } else {
    currentRules.weekday = [{ required: true, message: "请选择星期", trigger: "change" }]
    currentRules.repeatStartDate = [{ required: true, message: "请选择开始日期", trigger: "change" }]
  }
  return currentRules
})

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
})

const resetForm = () => {
  const fallbackDate = props.selectedDate || formatDate(new Date())
  form.courtScope = "all"
  form.courtId = undefined
  form.blockType = 1
  form.blockDate = fallbackDate
  form.weekday = undefined
  form.repeatStartDate = fallbackDate
  form.repeatEndDate = ""
  form.startTime = ""
  form.endTime = ""
  form.reason = ""
}

const submit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const start = toMinutes(form.startTime)
  const end = toMinutes(form.endTime)
  if (start === null || end === null || end <= start) {
    ElMessage.warning("结束时间必须晚于开始时间")
    return
  }

  emit("submit", {
    venueId: props.venueId,
    courtId: form.courtScope === "all" ? null : Number(form.courtId),
    blockType: form.blockType,
    blockDate: form.blockType === 1 ? form.blockDate : undefined,
    weekday: form.blockType === 2 ? Number(form.weekday) : undefined,
    repeatStartDate: form.blockType === 2 ? form.repeatStartDate : undefined,
    repeatEndDate: form.blockType === 2 && form.repeatEndDate ? form.repeatEndDate : undefined,
    startTime: form.startTime,
    endTime: form.endTime,
    reason: form.reason.trim() || undefined,
  })
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    resetForm()
    formRef.value?.clearValidate()
  },
)

function toMinutes(time?: string | null) {
  if (!time) return null
  const matched = time.trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!matched) return null
  const hour = Number(matched[1])
  const minute = Number(matched[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="设置不可用时段"
    width="620px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="规则模式" prop="blockType">
        <el-radio-group v-model="form.blockType">
          <el-radio :value="1">单日</el-radio>
          <el-radio :value="2">按周</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="作用范围" prop="courtScope">
        <el-radio-group v-model="form.courtScope">
          <el-radio value="all">整馆</el-radio>
          <el-radio value="single">单场地</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.courtScope === 'single'" label="场地" prop="courtId">
        <el-select v-model="form.courtId" placeholder="请选择场地">
          <el-option v-for="courtId in courtOptions" :key="courtId" :label="`场地 ${courtId}`" :value="courtId" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.blockType === 1" label="不可用日期" prop="blockDate">
        <el-date-picker v-model="form.blockDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" />
      </el-form-item>

      <template v-else>
        <el-form-item label="星期" prop="weekday">
          <el-select v-model="form.weekday" placeholder="请选择星期">
            <el-option v-for="w in weekdayOptions" :key="w.value" :label="w.label" :value="w.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="repeatStartDate">
          <el-date-picker v-model="form.repeatStartDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择开始日期" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="form.repeatEndDate" type="date" value-format="YYYY-MM-DD" placeholder="可选，不填表示长期生效" />
        </el-form-item>
      </template>

      <el-form-item label="开始时间" prop="startTime">
        <el-time-picker v-model="form.startTime" value-format="HH:mm" format="HH:mm" placeholder="请选择开始时间" />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-time-picker v-model="form.endTime" value-format="HH:mm" format="HH:mm" placeholder="请选择结束时间" />
      </el-form-item>
      <el-form-item label="原因">
        <el-input v-model="form.reason" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="可选，建议填写便于运营追溯" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确认创建</el-button>
    </template>
  </el-dialog>
</template>
