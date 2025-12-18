<script lang="ts" setup>
import { computed } from "vue"

const props = defineProps({
  prefix: {
    type: String,
    default: "icon",
  },
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: '16px',
  },
})

const symbolId = computed(() => `#${props.prefix}-${props.name}`)
</script>

<template>
  <i class="cp-el-icon" :style="{ fontSize: props.size }">
    <svg class="svg-icon" aria-hidden="true">
      <use :href="symbolId" />
    </svg>
  </i>
</template>

  <style lang="scss" scoped>
  // 沿用 element-plus 的 icon 样式
.cp-el-icon {
  --color: inherit;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  font-size: inherit;
  line-height: 1em;
  color: var(--color);
  fill: currentcolor;

  .svg-icon {
    width: 1em;
    height: 1em;
    overflow: hidden;
    fill: currentcolor;
  }
}
</style>
