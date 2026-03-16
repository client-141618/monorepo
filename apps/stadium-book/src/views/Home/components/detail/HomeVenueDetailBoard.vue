<script setup lang="ts">
interface DateOption {
  value: string
  label: string
}

interface SlotOption {
  key: string
  label: string
  startMinutes: number
  endMinutes: number
}

interface BoardStats {
  totalCells: number
  blockedCells: number
  occupiedCells: number
  freeCells: number
}

const props = defineProps<{
  boardMessage: string
  dateOptions: DateOption[]
  selectedDate: string
  selectedCount: number
  slotOptions: SlotOption[]
  courtOptions: number[]
  availabilityLoading: boolean
  boardStats: BoardStats
  isCellBlocked: (_courtId: number, _slot: SlotOption) => boolean
  isCellOccupied: (_courtId: number, _slot: SlotOption) => boolean
  isCellSelected: (_courtId: number, _slot: SlotOption) => boolean
  cellUserText: (_courtId: number, _slot: SlotOption) => string
}>()

const emit = defineEmits<{
  (_e: "select-date", _date: string): void
  (_e: "open-cancel"): void
  (_e: "open-block"): void
  (_e: "click-cell", _courtId: number, _slot: SlotOption): void
}>()

const GRID_TIME_HEADER_TEXT = "时间段"

const handleDateClick = (date: string) => emit("select-date", date)
const handleCellClick = (courtId: number, slot: SlotOption) => emit("click-cell", courtId, slot)
</script>

<template>
  <div class="board">
    <div class="board__header">
      <div class="board__title">预约占用看板</div>
      <div class="board__tip">点选已预约格后可取消预约；支持设置不可用时段</div>
    </div>

    <el-alert :title="boardMessage" type="info" :closable="false" class="board__alert" />

    <div class="board__topbar">
      <div class="board__date-bar">
        <button
          v-for="item in dateOptions"
          :key="item.value"
          type="button"
          class="board__date-item"
          :class="{ 'board__date-item--active': selectedDate === item.value }"
          @click="handleDateClick(item.value)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="board__toolbar">
        <el-button type="danger" :disabled="!selectedCount" @click="emit('open-cancel')">
          取消预约（已选 {{ selectedCount }}）
        </el-button>
        <el-button type="primary" plain @click="emit('open-block')">设置不可用时段</el-button>
      </div>
    </div>

    <div class="board__grid-wrap" v-loading="availabilityLoading">
      <div class="board__time-column">
        <div class="board__time-head">{{ GRID_TIME_HEADER_TEXT }}</div>
        <div v-for="slot in slotOptions" :key="slot.key" class="board__time-item">{{ slot.label }}</div>
      </div>

      <div class="board__grid-scroll">
        <div
          class="board__court-head"
          :style="{ gridTemplateColumns: `repeat(${courtOptions.length || 1}, minmax(140px, 1fr))` }"
        >
          <div v-for="courtId in courtOptions" :key="courtId" class="board__court-item">场地 {{ courtId }}</div>
          <div v-if="!courtOptions.length" class="board__court-item">无场地</div>
        </div>

        <div
          v-for="slot in slotOptions"
          :key="slot.key"
          class="board__grid-row"
          :style="{ gridTemplateColumns: `repeat(${courtOptions.length || 1}, minmax(140px, 1fr))` }"
        >
          <button
            v-for="courtId in courtOptions"
            :key="`${courtId}-${slot.key}`"
            type="button"
            class="board__cell"
            :class="{
              'board__cell--blocked': props.isCellBlocked(courtId, slot),
              'board__cell--occupied': props.isCellOccupied(courtId, slot),
              'board__cell--free': !props.isCellOccupied(courtId, slot) && !props.isCellBlocked(courtId, slot),
              'board__cell--selected': props.isCellSelected(courtId, slot),
            }"
            @click="handleCellClick(courtId, slot)"
          >
            <template v-if="props.isCellBlocked(courtId, slot)">
              <span class="board__cell-title">不可用</span>
            </template>
            <template v-else-if="props.isCellOccupied(courtId, slot)">
              <span class="board__cell-title">已约</span>
              <span class="board__cell-user">{{ props.cellUserText(courtId, slot) }}</span>
            </template>
            <span v-else class="board__cell-title">空闲</span>
          </button>
        </div>
      </div>
    </div>

    <div class="board__footer">
      <div class="board__summary">
        总格数：{{ boardStats.totalCells }}，不可用：{{ boardStats.blockedCells }}，已占用：{{ boardStats.occupiedCells }}，空闲：{{ boardStats.freeCells }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.board {
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.board__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.board__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.board__tip {
  font-size: 13px;
  color: #6b7280;
}

.board__alert {
  margin-bottom: 12px;
}

.board__date-bar {
  display: flex;
  gap: 12px;
  min-width: 0;
  flex: 1;
  padding: 2px 0;
  overflow-x: auto;
}

.board__date-item {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 16px;
  min-width: 88px;
  flex: 0 0 auto;
  cursor: pointer;
}

.board__date-item--active {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.board__topbar {
  position: sticky;
  top: 64px;
  z-index: 20;
  margin-bottom: 14px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.board__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}

.board__grid-wrap {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow-x: auto;
  overflow-y: visible;
  overscroll-behavior-x: contain;
  scrollbar-gutter: stable;
  min-height: 260px;
}

.board__time-column {
  width: 130px;
  flex: 0 0 130px;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
}

.board__time-head,
.board__court-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.board__time-item {
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f1f5f9;
  padding: 0 8px;
  text-align: center;
}

.board__grid-scroll {
  flex: 1;
  min-width: 0;
  overflow: visible;
  background: #fff;
}

.board__court-head,
.board__grid-row {
  display: grid;
}

.board__cell {
  height: 58px;
  border-right: 1px solid #eef2f7;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  cursor: pointer;
}

.board__cell--free {
  background: #fff;
  color: #4b5563;
  cursor: default;
}

.board__cell--occupied {
  background: #fff8db;
  color: #92400e;
}

.board__cell--blocked {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.board__cell--selected {
  box-shadow: inset 0 0 0 2px #2563eb;
  background: #e8f1ff;
}

.board__cell-title {
  font-size: 13px;
  font-weight: 600;
}

.board__cell-user {
  font-size: 12px;
}

.board__footer {
  margin-top: 14px;
}

.board__summary {
  font-size: 14px;
  color: #374151;
}

@media (max-width: 900px) {
  .board__topbar {
    top: 56px;
  }

  .board__time-column {
    width: 110px;
    flex-basis: 110px;
  }

  .board__toolbar {
    justify-content: flex-end;
  }

  .board__topbar {
    gap: 10px;
  }
}
</style>
