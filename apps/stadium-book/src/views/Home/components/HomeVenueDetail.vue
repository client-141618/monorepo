<script setup lang="ts">
import type { Venue } from "@/api/venue/type"
import { ArrowLeft } from "@element-plus/icons-vue"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getVenueByIdApi } from "@/api/venue"
import { VENUE_TYPE_OPTIONS } from "@/constants/venue"

const route = useRoute()
const router = useRouter()

const DEFAULT_VENUE_IMAGE = "/default.jpg"
const detailLoading = ref(false)
const hasLoadedOnce = ref(false)
const venueDetail = ref<Venue | null>(null)

const venueTypeLabelByValue = computed(() => {
  const map = new Map<number, string>()
  for (const opt of VENUE_TYPE_OPTIONS) {
    map.set(opt.value, opt.label)
  }
  return map
})

const venueId = computed(() => Number(route.params.id))

const venueImageSrc = computed(() => {
  const src = venueDetail.value?.image?.trim()
  return src || DEFAULT_VENUE_IMAGE
})

const priceLabel = computed(() => {
  const cents = Number(venueDetail.value?.pricePerHour)
  if (!Number.isFinite(cents)) return "--"
  return `¥${(cents / 100).toFixed(2)}/小时`
})

const venueTypeLabel = computed(() => {
  const type = Number(venueDetail.value?.type)
  return venueTypeLabelByValue.value.get(type) || "--"
})

const openHours = computed(() => {
  const openTime = venueDetail.value?.openTime?.trim()
  const closeTime = venueDetail.value?.closeTime?.trim()
  if (!openTime || !closeTime) return "--"
  return `${openTime} - ${closeTime}`
})

const loadVenueDetail = async () => {
  if (!Number.isFinite(venueId.value) || venueId.value <= 0) {
    venueDetail.value = null
    hasLoadedOnce.value = true
    return
  }

  try {
    detailLoading.value = true
    const res = await getVenueByIdApi(venueId.value)
    venueDetail.value = res.data || null
  } catch (_error) {
    venueDetail.value = null
  } finally {
    detailLoading.value = false
    hasLoadedOnce.value = true
  }
}

const handleBack = () => {
  router.push("/home")
}

watch(
  () => venueId.value,
  () => {
    loadVenueDetail()
  },
  { immediate: true },
)
</script>

<template>
  <div class="home-venue-detail">
    <el-button :icon="ArrowLeft" class="home-venue-detail__back" @click="handleBack">返回首页</el-button>

    <div v-if="detailLoading && !hasLoadedOnce" class="home-venue-detail__loading" v-loading="true" />
    <el-empty v-else-if="!venueDetail" description="未找到该场馆信息">
      <el-button type="primary" @click="handleBack">返回场馆列表</el-button>
    </el-empty>
    <el-card v-else class="home-venue-detail__card" v-loading="detailLoading">
      <div class="home-venue-detail__main">
        <div class="home-venue-detail__cover">
          <el-image :src="venueImageSrc" fit="cover" class="home-venue-detail__image">
            <template #error>
              <img :src="DEFAULT_VENUE_IMAGE" alt="场馆默认图片" class="home-venue-detail__image" />
            </template>
          </el-image>
        </div>
        <div class="home-venue-detail__info">
          <h2 class="home-venue-detail__name">{{ venueDetail.name }}</h2>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">场馆类型：</span>
            <span>{{ venueTypeLabel }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">单价：</span>
            <span>{{ priceLabel }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">位置：</span>
            <span>{{ venueDetail.location || "--" }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">营业时间：</span>
            <span>{{ openHours }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">场地单元数：</span>
            <span>{{ venueDetail.total }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">每场地人数：</span>
            <span>{{ venueDetail.unitCapacity }}</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">最小预约单元：</span>
            <span>{{ venueDetail.slotMinutes }} 分钟</span>
          </div>
          <div class="home-venue-detail__line">
            <span class="home-venue-detail__label">状态：</span>
            <el-tag :type="venueDetail.status === 1 ? 'success' : 'info'">
              {{ venueDetail.status === 1 ? "开放中" : "已停用" }}
            </el-tag>
          </div>
          <div class="home-venue-detail__desc">
            <div class="home-venue-detail__label">场馆介绍</div>
            <p>{{ venueDetail.description || "暂无介绍" }}</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.home-venue-detail {
  padding: 16px;
}

.home-venue-detail__back {
  margin-bottom: 12px;
}

.home-venue-detail__loading {
  min-height: 280px;
}

.home-venue-detail__card {
  border-radius: 10px;
}

.home-venue-detail__main {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 480px) 1fr;
}

.home-venue-detail__cover {
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  min-height: 280px;
}

.home-venue-detail__image {
  width: 100%;
  height: 100%;
  display: block;
}

.home-venue-detail__info {
  min-width: 0;
}

.home-venue-detail__name {
  margin: 0 0 14px;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}

.home-venue-detail__line {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  line-height: 22px;
  color: #374151;
}

.home-venue-detail__label {
  color: #6b7280;
  flex: 0 0 auto;
}

.home-venue-detail__desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;

  p {
    margin: 8px 0 0;
    line-height: 22px;
    color: #374151;
  }
}

@media (max-width: 900px) {
  .home-venue-detail {
    padding: 12px;
  }

  .home-venue-detail__main {
    grid-template-columns: 1fr;
  }
}
</style>
