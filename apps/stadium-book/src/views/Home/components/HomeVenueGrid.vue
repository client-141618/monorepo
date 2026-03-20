<script setup lang="ts">
import type { VenueType } from "@/api/venue-type/type"
import type { Venue } from "@/api/venue/type"
import { Refresh } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { getVenueListApi, getVenueListByTypeApi } from "@/api/venue"
import { getVenueTypeListApi } from "@/api/venue-type"
import PageContentShell from "@/components/PageContentShell/index.vue"
import HomeVenueCard from "./HomeVenueCard.vue"

const router = useRouter()
const venueList = ref<Venue[]>([])
const tableLoading = ref(false)
const typeLoading = ref(false)
const hasLoadedOnce = ref(false)
const loadFailed = ref(false)
const activeType = ref<"all" | number>("all")
const venueTypeOptions = ref<VenueType[]>([])

const hasData = computed(() => venueList.value.length > 0)
const typeOptions = computed(() => [
  { label: "全部", value: "all" as const },
  ...venueTypeOptions.value.map((item) => ({ label: item.name, value: item.id })),
])

const getVenueTypeList = async () => {
  try {
    typeLoading.value = true
    const res = await getVenueTypeListApi()
    venueTypeOptions.value = res.data
    if (
      activeType.value !== "all" &&
      !venueTypeOptions.value.some((item) => item.id === activeType.value)
    ) {
      activeType.value = "all"
    }
  } finally {
    typeLoading.value = false
  }
}

const getVenueList = async () => {
  try {
    tableLoading.value = true
    loadFailed.value = false
    const res =
      activeType.value === "all"
        ? await getVenueListApi()
        : await getVenueListByTypeApi(activeType.value)
    venueList.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    loadFailed.value = true
    const msg = error instanceof Error ? error.message : "加载失败"
    ElMessage.error(msg || "加载失败")
  } finally {
    tableLoading.value = false
    hasLoadedOnce.value = true
  }
}

const handleSelect = (venueId: number) => {
  router.push(`/home/venue/${venueId}`)
}

const handleTypeChange = () => {
  getVenueList()
}

onMounted(() => {
  Promise.all([getVenueTypeList(), getVenueList()])
})
</script>

<template>
  <PageContentShell class="home-venue-grid" :body-scroll="true">
    <template #header>
      <div class="home-venue-grid__header">
        <div class="home-venue-grid__title">场馆总览</div>
        <el-button :icon="Refresh" :loading="tableLoading" @click="getVenueList">刷新</el-button>
      </div>
      <div class="home-venue-grid__filter">
        <span class="home-venue-grid__filter-label">场馆类型</span>
        <el-radio-group v-model="activeType" :disabled="typeLoading" @change="handleTypeChange">
          <el-radio-button v-for="item in typeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <div v-if="!hasLoadedOnce && tableLoading" class="home-venue-grid__loading" v-loading="true" />
    <el-result v-else-if="loadFailed" icon="error" title="场馆加载失败" sub-title="请检查网络或稍后重试">
      <template #extra>
        <el-button type="primary" @click="getVenueList">重新加载</el-button>
      </template>
    </el-result>
    <el-empty v-else-if="!hasData" description="暂无场馆信息" />
    <div v-else class="home-venue-grid__list" v-loading="tableLoading">
      <HomeVenueCard v-for="venue in venueList" :key="venue.id" :venue="venue" @select="handleSelect" />
    </div>
  </PageContentShell>
</template>

<style scoped lang="scss">
.home-venue-grid {
  overflow: hidden;
}

.home-venue-grid__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.home-venue-grid__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.home-venue-grid__loading {
  min-height: 280px;
}

.home-venue-grid__filter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.home-venue-grid__filter-label {
  font-size: 14px;
  color: #4b5563;
}

.home-venue-grid__list {
  display: grid;
  gap: 16px;
  width: 100%;
  min-width: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1280px) {
  .home-venue-grid__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home-venue-grid__list {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
