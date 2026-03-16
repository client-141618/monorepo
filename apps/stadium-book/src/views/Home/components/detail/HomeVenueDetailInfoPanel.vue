<script setup lang="ts">
import type { Venue } from "@/api/venue/type"

defineProps<{
  venueDetail: Venue
  venueImageSrc: string
  defaultVenueImage: string
  venueTypeLabel: string
  priceLabel: string
  openHours: string
}>()
</script>

<template>
  <div class="info-panel">
    <div class="info-panel__cover">
      <el-image :src="venueImageSrc" fit="cover" class="info-panel__image">
        <template #error>
          <img :src="defaultVenueImage" alt="场馆默认图片" class="info-panel__image" />
        </template>
      </el-image>
    </div>

    <div class="info-panel__content">
      <h2 class="info-panel__name">{{ venueDetail.name }}</h2>

      <div class="info-panel__line">
        <span class="info-panel__label">场馆类型：</span>
        <span>{{ venueTypeLabel }}</span>
      </div>
      <div class="info-panel__line">
        <span class="info-panel__label">单价：</span>
        <span>{{ priceLabel }}</span>
      </div>
      <div class="info-panel__line">
        <span class="info-panel__label">位置：</span>
        <span>{{ venueDetail.location || "--" }}</span>
      </div>
      <div class="info-panel__line">
        <span class="info-panel__label">营业时间：</span>
        <span>{{ openHours }}</span>
      </div>
      <div class="info-panel__line">
        <span class="info-panel__label">场地单元数：</span>
        <span>{{ venueDetail.total }}</span>
      </div>
      <div class="info-panel__line">
        <span class="info-panel__label">每场地人数：</span>
        <span>{{ venueDetail.unitCapacity }}</span>
      </div>
      <div class="info-panel__line">
        <span class="info-panel__label">最小预约单元：</span>
        <span>{{ venueDetail.slotMinutes }} 分钟</span>
      </div>
      <div class="info-panel__line">
        <span class="info-panel__label">状态：</span>
        <el-tag :type="venueDetail.status === 1 ? 'success' : 'info'">
          {{ venueDetail.status === 1 ? "开放中" : "已停用" }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-panel {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 480px) 1fr;
}

.info-panel__cover {
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  min-height: 280px;
}

.info-panel__image {
  width: 100%;
  height: 100%;
  display: block;
}

.info-panel__name {
  margin: 0 0 14px;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}

.info-panel__line {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  line-height: 22px;
  color: #374151;
}

.info-panel__label {
  color: #6b7280;
}

@media (max-width: 900px) {
  .info-panel {
    grid-template-columns: 1fr;
  }
}
</style>
