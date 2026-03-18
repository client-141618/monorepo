<script setup lang="ts">
import type { TencentMapReverseGeocodeResult } from "@/api/tencent-map/type"
import { ElMessage } from "element-plus"
import { BaseMap, MultiCircle, MultiMarker } from "tlbs-map-vue"
import { computed, shallowRef, watch } from "vue"
import { reverseGeocodeTencentMapApi } from "@/api/tencent-map"
import { useTencentMapConfig } from "@/composables/useTencentMapConfig"

interface MapPoint {
  lat: number
  lng: number
}

interface MarkerGeometry {
  id: string
  styleId: string
  position: MapPoint
}

interface CircleGeometry {
  id: string
  styleId: string
  center: MapPoint
  radius: number
}

const DEFAULT_CENTER: MapPoint = {
  lat: 31.230416,
  lng: 121.473701,
}

const props = defineProps<{
  enableLocationVerify: 0 | 1
  location?: string
  checkinLatGcj02?: number
  checkinLngGcj02?: number
  checkinRadiusM?: number
}>()

const emit = defineEmits<{
  "update:enableLocationVerify": [value: 0 | 1]
  "update:location": [value: string]
  "update:checkinLatGcj02": [value: number | undefined]
  "update:checkinLngGcj02": [value: number | undefined]
  "update:checkinRadiusM": [value: number | undefined]
}>()

const { mapConfig, loading, errorMessage, ensureLoaded } = useTencentMapConfig()
const reverseGeocodeLoading = shallowRef(false)
const latestReverseGeocode = shallowRef<TencentMapReverseGeocodeResult | null>(null)
const mapReady = shallowRef(false)
const browserLocateTried = shallowRef(false)
const browserLocateLoading = shallowRef(false)

const enableLocationVerifyModel = computed({
  get: () => props.enableLocationVerify,
  set: (value: 0 | 1) => emit("update:enableLocationVerify", value),
})

const radiusModel = computed({
  get: () => props.checkinRadiusM,
  set: (value: number | undefined) => emit("update:checkinRadiusM", value),
})

const hasSelectedPoint = computed(() => {
  return Number.isFinite(props.checkinLatGcj02) && Number.isFinite(props.checkinLngGcj02)
})

const selectedCenter = computed<MapPoint>(() => {
  if (!hasSelectedPoint.value) return DEFAULT_CENTER

  return {
    lat: Number(props.checkinLatGcj02),
    lng: Number(props.checkinLngGcj02),
  }
})

const markerStyles = {
  selected: {
    width: 28,
    height: 36,
    anchor: { x: 14, y: 36 },
    src: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='28' height='36' viewBox='0 0 28 36'%3e%3cpath fill='%230f766e' d='M14 0C6.268 0 0 6.268 0 14c0 9.944 12.26 20.456 13.23 21.27a1.2 1.2 0 0 0 1.54 0C15.74 34.456 28 23.944 28 14 28 6.268 21.732 0 14 0Z'/%3e%3ccircle cx='14' cy='14' r='5.5' fill='%23fff'/%3e%3c/svg%3e",
  },
} satisfies Record<string, Record<string, unknown>>

const markerGeometries = computed<MarkerGeometry[]>(() => {
  if (!hasSelectedPoint.value) return []

  return [{
    id: "venue-location-center",
    styleId: "selected",
    position: selectedCenter.value,
  }]
})

const circleStyles = {
  selected: {
    color: "rgba(15, 118, 110, 0.22)",
    borderColor: "#0f766e",
    borderWidth: 2,
  },
} satisfies Record<string, Record<string, unknown>>

const circleGeometries = computed<CircleGeometry[]>(() => {
  if (!hasSelectedPoint.value || !Number.isFinite(props.checkinRadiusM) || Number(props.checkinRadiusM) <= 0) {
    return []
  }

  return [{
    id: "venue-location-range",
    styleId: "selected",
    center: selectedCenter.value,
    radius: Number(props.checkinRadiusM),
  }]
})

const mapZoom = computed(() => (hasSelectedPoint.value ? 16 : 11))

const mapHint = computed(() => {
  if (loading.value) return "正在加载地图配置..."
  if (browserLocateLoading.value) return "正在获取当前位置..."
  if (errorMessage.value) return errorMessage.value
  if (reverseGeocodeLoading.value) return "正在解析选点地址..."
  return props.location?.trim() || "请选取地址"
})

const buildAddressText = (result: TencentMapReverseGeocodeResult) => {
  if (result.address?.trim()) return result.address.trim()

  return [
    result.province,
    result.city,
    result.district,
    result.street,
    result.streetNumber,
  ]
    .filter((item): item is string => Boolean(item?.trim()))
    .join("")
}

const extractPointFromEvent = (event: unknown): MapPoint | null => {
  const payload = event as {
    latLng?: {
      lat?: number
      lng?: number
      getLat?: () => number
      getLng?: () => number
    }
  }

  const latLng = payload?.latLng
  if (!latLng) return null

  const lat = typeof latLng.getLat === "function" ? latLng.getLat() : latLng.lat
  const lng = typeof latLng.getLng === "function" ? latLng.getLng() : latLng.lng

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return { lat: Number(lat), lng: Number(lng) }
}

const handleMapClick = async (event: unknown) => {
  const point = extractPointFromEvent(event)
  if (!point) {
    ElMessage.warning("未能识别地图坐标，请重试")
    return
  }

  try {
    await applyPointAndReverseGeocode(point)
  } catch {
    ElMessage.error("地址解析失败，请重新选点或稍后重试")
  }
}

const applyPointAndReverseGeocode = async (point: MapPoint) => {
  emit("update:checkinLatGcj02", point.lat)
  emit("update:checkinLngGcj02", point.lng)
  emit("update:location", "")
  latestReverseGeocode.value = null

  reverseGeocodeLoading.value = true
  try {
    const res = await reverseGeocodeTencentMapApi({
      latitude: point.lat,
      longitude: point.lng,
    })
    const resolvedAddress = buildAddressText(res.data)
    if (!resolvedAddress) return

    latestReverseGeocode.value = res.data
    emit("update:location", resolvedAddress)
  } finally {
    reverseGeocodeLoading.value = false
  }
}

const ensureMapReady = async () => {
  if (mapReady.value) return true
  try {
    await ensureLoaded()
    mapReady.value = true
    return true
  } catch {
    mapReady.value = false
    return false
  }
}

const tryUseBrowserCurrentPosition = async () => {
  if (browserLocateTried.value || hasSelectedPoint.value) return
  browserLocateTried.value = true
  if (!navigator?.geolocation) return

  browserLocateLoading.value = true
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      })
    })

    await applyPointAndReverseGeocode({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    })
  } catch {
    // 用户拒绝或定位失败时保持静默，让用户手动选点
  } finally {
    browserLocateLoading.value = false
  }
}

watch(
  () => props.enableLocationVerify,
  async (enabled) => {
    if (enabled !== 1) {
      browserLocateTried.value = false
      browserLocateLoading.value = false
      return
    }
    const loaded = await ensureMapReady()
    if (!loaded) return
    tryUseBrowserCurrentPosition()
  },
  { immediate: true },
)

watch(
  () => hasSelectedPoint.value,
  (selected) => {
    if (selected) {
      browserLocateLoading.value = false
    }
  },
)
</script>

<template>
  <section class="location-verify-section">
    <div class="location-verify-section__title">位置校验</div>

    <el-row :gutter="18">
      <el-col :xs="24" :sm="24" :md="12">
        <el-form-item
          label="开启校验"
          prop="enableLocationVerify"
          class="location-verify-section__switch-item"
        >
          <el-switch
            v-model="enableLocationVerifyModel"
            :active-value="1"
            :inactive-value="0"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
      </el-col>

      <el-col v-if="enableLocationVerify === 1" :xs="24" :sm="24" :md="12">
        <el-form-item label="校验范围" prop="checkinRadiusM">
          <el-input-number
            v-model="radiusModel"
            :min="1"
            :step="10"
            :controls="false"
            class="location-verify-section__full-width"
          />
          <div class="location-verify-section__hint">单位：米，建议设置为 30 - 300 米。</div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item v-if="enableLocationVerify === 1" label="地图选点" prop="checkinLatGcj02">
      <div class="location-verify-map">
        <div class="location-verify-map__meta">
          <div class="location-verify-map__meta-item">
            <span class="location-verify-map__meta-label">选择的位置</span>
            <span class="location-verify-map__meta-value">{{ mapHint }}</span>
          </div>
        </div>

        <div v-loading="loading || reverseGeocodeLoading || browserLocateLoading" class="location-verify-map__canvas-wrap">
          <div v-if="errorMessage" class="location-verify-map__fallback">
            <el-alert
              :title="errorMessage"
              type="error"
              show-icon
              :closable="false"
            />
          </div>

          <BaseMap
            v-else-if="mapReady && mapConfig?.key"
            class="location-verify-map__canvas"
            :api-key="mapConfig.key"
            :center="selectedCenter"
            :zoom="mapZoom"
            :control="{ scale: true, zoom: true, rotation: false }"
            @click="handleMapClick"
          >
            <MultiMarker
              v-if="markerGeometries.length"
              :styles="markerStyles"
              :geometries="markerGeometries"
            />
            <MultiCircle
              v-if="circleGeometries.length"
              :styles="circleStyles"
              :geometries="circleGeometries"
            />
          </BaseMap>

          <div v-else class="location-verify-map__fallback">
            <el-alert
              title="地图配置未就绪，请稍后重试"
              type="warning"
              show-icon
              :closable="false"
            />
          </div>
        </div>

      </div>
    </el-form-item>
  </section>
</template>

<style scoped lang="scss">
.location-verify-section {
  padding: 18px 20px 8px;
  border: 1px solid #e8edf5;
  border-radius: 16px;
  background: linear-gradient(180deg, #f7fdfc 0%, #ffffff 100%);
}

.location-verify-section__title {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2a37;
}

.location-verify-section__switch-item :deep(.el-form-item__content) {
  min-height: 40px;
  display: flex;
  align-items: center;
}

.location-verify-section__full-width {
  width: 100%;
}

.location-verify-section__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.location-verify-map {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-verify-map__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.location-verify-map__meta-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f4f8f7;
  border: 1px solid #dfeae7;
}

.location-verify-map__meta-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #6b7280;
}

.location-verify-map__meta-value {
  display: block;
  font-size: 13px;
  line-height: 1.5;
  color: #1f2937;
  word-break: break-all;
}

.location-verify-map__canvas-wrap {
  min-height: 320px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #d8e5e2;
  background: #eef5f3;
}

.location-verify-map__canvas {
  width: 100%;
  height: 320px;
}

.location-verify-map__fallback {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .location-verify-section {
    padding: 16px 14px 6px;
    border-radius: 14px;
  }

  .location-verify-map__meta {
    grid-template-columns: 1fr;
  }

  .location-verify-map__canvas,
  .location-verify-map__canvas-wrap,
  .location-verify-map__fallback {
    min-height: 280px;
    height: 280px;
  }
}
</style>
