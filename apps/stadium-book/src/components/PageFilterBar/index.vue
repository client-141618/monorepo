<script setup lang="ts">
withDefaults(
  defineProps<{
    queryLoading?: boolean
    queryDisabled?: boolean
    resetDisabled?: boolean
  }>(),
  {
    queryLoading: false,
    queryDisabled: false,
    resetDisabled: false,
  },
)

const emit = defineEmits<{
  (_e: "query"): void
  (_e: "reset"): void
}>()

const handleQuery = () => emit("query")
const handleReset = () => emit("reset")
</script>

<template>
  <div class="page-filter-bar">
    <div class="page-filter-bar__fields">
      <slot />
    </div>
    <div class="page-filter-bar__actions">
      <el-button :disabled="resetDisabled" @click="handleReset">重置</el-button>
      <el-button type="primary" :loading="queryLoading" :disabled="queryDisabled" @click="handleQuery">
        查询
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-filter-bar {
  margin-top: 12px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-filter-bar__fields {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-filter-bar__actions {
  display: flex;
  gap: 8px;
  flex: none;
}

@media (max-width: 900px) {
  .page-filter-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-filter-bar__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
