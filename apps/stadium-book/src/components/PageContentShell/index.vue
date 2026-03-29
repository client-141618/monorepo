<script setup lang="ts">
import { computed, ref, watch } from "vue"
import PageShellSkeleton from "@/components/PageShellSkeleton/index.vue"

type SkeletonVariant = "table" | "card" | "detail"

const props = withDefaults(
  defineProps<{
    padding?: number
    headerGap?: number
    bodyScroll?: boolean
    skeletonLoading?: boolean
    skeletonOnce?: boolean
    skeletonVariant?: SkeletonVariant
    skeletonRows?: number
    skeletonCards?: number
  }>(),
  {
    padding: 16,
    headerGap: 12,
    bodyScroll: false,
    skeletonLoading: false,
    skeletonOnce: true,
    skeletonVariant: "table",
    skeletonRows: 6,
    skeletonCards: 6,
  },
)

const hasLoadedOnce = ref(false)

watch(
  () => props.skeletonLoading,
  (isLoading, wasLoading) => {
    if (wasLoading && !isLoading) {
      hasLoadedOnce.value = true
    }
  },
)

const showSkeleton = computed(() => {
  if (!props.skeletonLoading) return false
  if (!props.skeletonOnce) return true
  return !hasLoadedOnce.value
})
</script>

<template>
  <div class="page-content-shell" :style="{ padding: `${props.padding}px` }">
    <div
      v-if="$slots.header"
      class="page-content-shell__header"
      :style="{ marginBottom: `${props.headerGap}px` }"
    >
      <slot name="header" />
    </div>
    <div class="page-content-shell__body" :class="{ 'page-content-shell__body--scroll': props.bodyScroll }">
      <slot v-if="!showSkeleton" />
      <slot v-else name="skeleton">
        <PageShellSkeleton
          :variant="props.skeletonVariant"
          :rows="props.skeletonRows"
          :cards="props.skeletonCards"
        />
      </slot>
    </div>
    <div v-if="$slots.footer && !showSkeleton" class="page-content-shell__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-content-shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-content-shell__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-content-shell__body--scroll {
  overflow: auto;
}

.page-content-shell__footer {
  margin-top: 12px;
  flex: none;
}

.page-content-shell__footer :deep(.el-pagination) {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
}

.page-content-shell__footer :deep(.el-pagination__total) {
  margin-right: auto;
}
</style>
