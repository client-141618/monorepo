<script setup lang="ts">
import { computed } from "vue"

type SkeletonVariant = "table" | "card" | "detail"

const props = withDefaults(
  defineProps<{
    variant?: SkeletonVariant
    rows?: number
    cards?: number
    animated?: boolean
  }>(),
  {
    variant: "table",
    rows: 6,
    cards: 6,
    animated: true,
  },
)

const safeRows = computed(() => {
  return Math.max(1, Number(props.rows) || 1)
})

const safeCards = computed(() => {
  return Math.max(1, Number(props.cards) || 1)
})

const detailRows = computed(() => {
  return Math.max(4, safeRows.value)
})
</script>

<template>
  <el-skeleton :loading="true" :animated="props.animated">
    <template #template>
      <div v-if="props.variant === 'table'" class="page-shell-skeleton page-shell-skeleton--table">
        <el-skeleton-item variant="h3" class="page-shell-skeleton__title" />
        <div class="page-shell-skeleton__filters">
          <el-skeleton-item variant="text" class="page-shell-skeleton__filter" />
          <el-skeleton-item variant="text" class="page-shell-skeleton__filter" />
          <el-skeleton-item variant="text" class="page-shell-skeleton__filter" />
        </div>
        <div class="page-shell-skeleton__table">
          <el-skeleton-item
            v-for="index in safeRows"
            :key="`table-row-${index}`"
            variant="text"
            class="page-shell-skeleton__row"
          />
        </div>
      </div>

      <div v-else-if="props.variant === 'card'" class="page-shell-skeleton page-shell-skeleton--card">
        <el-skeleton-item variant="h3" class="page-shell-skeleton__title" />
        <div class="page-shell-skeleton__card-grid">
          <div
            v-for="index in safeCards"
            :key="`card-${index}`"
            class="page-shell-skeleton__card"
          >
            <el-skeleton-item variant="image" class="page-shell-skeleton__card-image" />
            <el-skeleton-item variant="h3" class="page-shell-skeleton__card-title" />
            <el-skeleton-item variant="text" class="page-shell-skeleton__card-text" />
            <el-skeleton-item variant="text" class="page-shell-skeleton__card-text page-shell-skeleton__card-text--short" />
          </div>
        </div>
      </div>

      <div v-else class="page-shell-skeleton page-shell-skeleton--detail">
        <el-skeleton-item variant="h3" class="page-shell-skeleton__title" />
        <el-skeleton-item variant="text" class="page-shell-skeleton__detail-subtitle" />
        <el-skeleton-item variant="rect" class="page-shell-skeleton__detail-main" />
        <el-skeleton-item
          v-for="index in detailRows"
          :key="`detail-row-${index}`"
          variant="text"
          class="page-shell-skeleton__row"
        />
      </div>
    </template>
  </el-skeleton>
</template>

<style scoped lang="scss">
.page-shell-skeleton {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.page-shell-skeleton__title {
  width: 42%;
  height: 26px;
}

.page-shell-skeleton__filters {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 220px));
  gap: 10px;
}

.page-shell-skeleton__filter {
  height: 34px;
}

.page-shell-skeleton__table {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.page-shell-skeleton__row {
  height: 18px;
}

.page-shell-skeleton__card-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.page-shell-skeleton__card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px;
  display: grid;
  gap: 8px;
}

.page-shell-skeleton__card-image {
  width: 100%;
  height: 132px;
  border-radius: 8px;
}

.page-shell-skeleton__card-title {
  width: 52%;
  height: 20px;
}

.page-shell-skeleton__card-text {
  width: 100%;
  height: 14px;
}

.page-shell-skeleton__card-text--short {
  width: 70%;
}

.page-shell-skeleton__detail-subtitle {
  margin-top: 12px;
  width: 56%;
  height: 18px;
}

.page-shell-skeleton__detail-main {
  margin-top: 14px;
  width: 100%;
  height: 220px;
  border-radius: 10px;
}

.page-shell-skeleton--detail .page-shell-skeleton__row {
  margin-top: 10px;
}

@media (max-width: 1200px) {
  .page-shell-skeleton__filters {
    grid-template-columns: repeat(2, minmax(0, 220px));
  }

  .page-shell-skeleton__card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-shell-skeleton {
    padding: 12px;
  }

  .page-shell-skeleton__title {
    width: 62%;
  }

  .page-shell-skeleton__filters {
    grid-template-columns: 1fr;
  }

  .page-shell-skeleton__card-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .page-shell-skeleton__detail-main {
    height: 180px;
  }
}
</style>
