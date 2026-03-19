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
</style>
