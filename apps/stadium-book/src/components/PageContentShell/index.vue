<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    padding?: number
    headerGap?: number
    bodyScroll?: boolean
  }>(),
  {
    padding: 16,
    headerGap: 12,
    bodyScroll: false,
  },
)
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
      <slot />
    </div>
    <div v-if="$slots.footer" class="page-content-shell__footer">
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
