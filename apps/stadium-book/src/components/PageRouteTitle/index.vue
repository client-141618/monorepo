<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"

const props = withDefaults(
  defineProps<{
    fallbackTitle?: string
  }>(),
  {
    fallbackTitle: "",
  },
)

const route = useRoute()

const title = computed(() => {
  const matchedTitle = [...route.matched]
    .reverse()
    .find((item) => typeof item.meta?.title === "string")
    ?.meta?.title

  if (typeof matchedTitle === "string" && matchedTitle.trim()) {
    return matchedTitle
  }

  return props.fallbackTitle
})
</script>

<template>
  <div class="page-route-title">{{ title }}</div>
</template>

<style scoped lang="scss">
.page-route-title {
  color: #1d2129;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}
</style>
