<script setup lang="ts">
import type { VenueFormModel } from "../types"

defineProps<{
  isSlotMinuteReady: boolean
  timeSelectStep: string
  timeSelectEnd: string
}>()

const form = defineModel<VenueFormModel>("form", { required: true })
</script>

<template>
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
            :controls="false"
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
            :controls="false"
            class="full-width-input-number"
          />
          <div class="venue-form__inline-hint">单位：分钟</div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="18">
      <el-col :xs="24" :sm="24" :md="12">
        <el-form-item label="开放时间" prop="openTime">
          <el-time-select
            v-model="form.openTime"
            :disabled="!isSlotMinuteReady"
            :placeholder="isSlotMinuteReady ? '请选择开放时间' : '请先填写最小预约单元'"
            start="00:00"
            :end="timeSelectEnd"
            :step="timeSelectStep"
            class="full-width-picker"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-form-item label="关闭时间" prop="closeTime">
          <el-time-select
            v-model="form.closeTime"
            :disabled="!isSlotMinuteReady"
            :placeholder="isSlotMinuteReady ? '请选择关闭时间' : '请先填写最小预约单元'"
            start="00:00"
            :end="timeSelectEnd"
            :step="timeSelectStep"
            :min-time="form.openTime || undefined"
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
            :controls="false"
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
            :controls="false"
            class="full-width-input-number"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </section>
</template>
