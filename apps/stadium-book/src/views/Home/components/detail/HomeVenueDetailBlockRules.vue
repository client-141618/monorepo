<script setup lang="ts">
import type { ReservationBlockRecord } from "@/api/reservation/type"

const props = defineProps<{
  blockList: ReservationBlockRecord[]
  blockLoading: boolean
  blockLoadFailed: boolean
  blockScopeLabel: (_row: ReservationBlockRecord) => string
  blockModeLabel: (_row: ReservationBlockRecord) => string
  blockActive: (_row: ReservationBlockRecord) => boolean
  blockStatusLabel: (_row: ReservationBlockRecord) => string
}>()

const emit = defineEmits<{
  (_e: "disable", _row: ReservationBlockRecord): void
}>()
</script>

<template>
  <div class="block-rules">
    <div class="block-rules__title">当天生效不可用时段</div>
    <el-alert
      v-if="blockLoadFailed"
      title="不可用时段加载失败，请稍后重试"
      type="warning"
      :closable="false"
      class="block-rules__alert"
    />

    <el-table v-loading="blockLoading" :data="blockList" stripe>
      <el-table-column prop="id" label="规则ID" width="88" />
      <el-table-column label="范围" min-width="100">
        <template #default="{ row }">{{ props.blockScopeLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="模式" min-width="120">
        <template #default="{ row }">{{ props.blockModeLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="时段" min-width="130">
        <template #default="{ row }">{{ row.startTime }}-{{ row.endTime }}</template>
      </el-table-column>
      <el-table-column label="原因" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.reason || "--" }}</template>
      </el-table-column>
      <el-table-column label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="props.blockActive(row) ? 'warning' : 'info'">
            {{ props.blockStatusLabel(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" :disabled="!props.blockActive(row)" @click="emit('disable', row)">
            停用
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.block-rules {
  margin-top: 22px;
  border-top: 1px solid #e5e7eb;
  padding-top: 18px;
}

.block-rules__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.block-rules__alert {
  margin-bottom: 10px;
}
</style>
