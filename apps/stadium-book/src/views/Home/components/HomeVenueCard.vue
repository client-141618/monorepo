<script setup lang="ts">
import type { Venue } from "@/api/venue/type"
import { computed } from "vue"
import { formatCurrencyFromFen } from "@/utils/format"

const props = defineProps<{
  venue: Venue
}>()

const emit = defineEmits<{
  select: [venueId: number]
}>()

const DEFAULT_VENUE_IMAGE = "/default.jpg"

const imageSrc = computed(() => {
  const src = props.venue.image?.trim()
  return src || DEFAULT_VENUE_IMAGE
})

const venueTypeLabel = computed(() => {
  return props.venue.typeName || `类型ID: ${props.venue.typeId}`
})

const priceLabel = computed(() => {
  const price = formatCurrencyFromFen(props.venue.pricePerHour)
  if (price === "--") return "--"
  return `${price}/小时`
})

const openHours = computed(() => {
  const openTime = props.venue.openTime?.trim()
  const closeTime = props.venue.closeTime?.trim()
  if (!openTime || !closeTime) return "--"
  return `${openTime} - ${closeTime}`
})

const isDisabled = computed(() => props.venue.status !== 1)

const handleSelect = () => {
  emit("select", props.venue.id)
}
</script>

<template>
  <el-card class="home-venue-card" shadow="hover" @click="handleSelect">
    <div class="home-venue-card__body" :class="{ 'home-venue-card__body--disabled': isDisabled }">
      <div class="home-venue-card__cover">
        <el-image
          :src="imageSrc"
          fit="cover"
          class="home-venue-card__image"
          :preview-src-list="[imageSrc]"
          preview-teleported
        >
          <template #error>
            <img :src="DEFAULT_VENUE_IMAGE" alt="场馆默认图片" class="home-venue-card__image" />
          </template>
        </el-image>
        <div class="home-venue-card__price">{{ priceLabel }}</div>
        <el-tag v-if="isDisabled" class="home-venue-card__status" type="info" effect="dark">停用</el-tag>
      </div>

      <div class="home-venue-card__info">
        <div class="home-venue-card__title" :title="venue.name">{{ venue.name }}</div>
        <div class="home-venue-card__line">
          <span class="home-venue-card__label">类型</span>
          <span class="home-venue-card__value">{{ venueTypeLabel }}</span>
        </div>
        <div class="home-venue-card__line">
          <span class="home-venue-card__label">位置</span>
          <span class="home-venue-card__value" :title="venue.location || '--'">{{ venue.location || "--" }}</span>
        </div>
        <div class="home-venue-card__line">
          <span class="home-venue-card__label">营业</span>
          <span class="home-venue-card__value">{{ openHours }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.home-venue-card {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.home-venue-card__body {
  height: 320px;
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s ease;
}

.home-venue-card__body--disabled {
  opacity: 0.8;
}

.home-venue-card__cover {
  position: relative;
  flex: 7;
  min-height: 0;
}

.home-venue-card__image {
  width: 100%;
  height: 100%;
  display: block;
}

.home-venue-card__price {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  color: #fff;
  font-size: 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
}

.home-venue-card__status {
  position: absolute;
  left: 10px;
  top: 10px;
}

.home-venue-card__info {
  flex: 3;
  min-height: 0;
  padding: 12px;
  background: #fff;
}

.home-venue-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-venue-card__line {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  color: #4b5563;
  font-size: 13px;
  line-height: 18px;
}

.home-venue-card__label {
  flex: 0 0 auto;
  color: #6b7280;
}

.home-venue-card__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
