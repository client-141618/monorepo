<script setup lang="ts">
import type { VenueFormModel } from "../types"
import type { VenueType } from "@/api/venue-type/type"

defineProps<{
  venueTypeOptions: VenueType[]
  venueTypeLoading: boolean
}>()

const form = defineModel<VenueFormModel>("form", { required: true })
</script>

<template>
  <section class="venue-form__section">
    <div class="venue-form__section-title">基础信息</div>
    <el-row :gutter="18">
      <el-col :xs="24" :sm="24" :md="12">
        <el-form-item label="场馆名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入场馆名称" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-form-item label="场馆类型" prop="typeId">
          <el-select
            v-model="form.typeId"
            :loading="venueTypeLoading"
            placeholder="请选择场馆类型"
          >
            <el-option
              v-for="opt in venueTypeOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="18">
      <el-col :xs="24" :sm="24" :md="12">
        <el-form-item label="所在位置" prop="location">
          <el-input
            v-model="form.location"
            :readonly="form.enableLocationVerify === 1"
            placeholder="开启位置校验后可通过地图选点自动回填"
          />
          <div class="venue-form__inline-hint">
            {{ form.enableLocationVerify === 1
              ? "已开启位置校验时，该地址由地图选点自动回填。"
              : "关闭位置校验时，可按需手动补充场馆地址。"
            }}
          </div>
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
</template>
