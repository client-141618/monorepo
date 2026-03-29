<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { VenueType } from "@/api/venue-type/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref } from "vue"
import {
  addVenueTypeApi,
  deleteVenueTypeApi,
  getVenueTypePageApi,
  updateVenueTypeApi,
} from "@/api/venue-type"
import PageContentShell from "@/components/PageContentShell/index.vue"
import { formatDateTimeText } from "@/utils/format"

type DialogMode = "create" | "edit"

const tableLoading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogMode = ref<DialogMode>("create")
const currentEditId = ref<number | null>(null)
const venueTypeList = ref<VenueType[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const formRef = ref<FormInstance>()

const form = reactive({
  name: "",
})

const rules: FormRules<typeof form> = {
  name: [{ required: true, message: "请输入类型名称", trigger: "blur" }],
}

const dialogTitle = computed(() =>
  dialogMode.value === "create" ? "新增场地类型" : "编辑场地类型",
)

const getVenueTypeList = async () => {
  try {
    tableLoading.value = true
    const res = await getVenueTypePageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    venueTypeList.value = Array.isArray(res.data?.records) ? res.data.records : []
    total.value = Number(res.data?.total) || 0
  } finally {
    tableLoading.value = false
  }
}

const resetForm = () => {
  form.name = ""
  currentEditId.value = null
}

const openCreateDialog = () => {
  dialogMode.value = "create"
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row: VenueType) => {
  dialogMode.value = "edit"
  currentEditId.value = row.id
  form.name = row.name
  dialogVisible.value = true
}

const handleDialogClosed = () => {
  formRef.value?.clearValidate()
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const isValid = await formRef.value.validate()
  if (!isValid) return

  submitLoading.value = true
  try {
    const name = form.name.trim()
    if (dialogMode.value === "create") {
      await addVenueTypeApi({ name })
      ElMessage.success("新增成功")
    } else if (currentEditId.value !== null) {
      await updateVenueTypeApi({ id: currentEditId.value, name })
      ElMessage.success("更新成功")
    }
    dialogVisible.value = false
    await getVenueTypeList()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: VenueType) => {
  try {
    await ElMessageBox.confirm(
      `确认删除类型「${row.name}」？`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    )
  } catch (_err) {
    return
  }

  await deleteVenueTypeApi(row.id)
  ElMessage.success("删除成功")
  await getVenueTypeList()
}

onMounted(() => {
  getVenueTypeList()
})

const handleCurrentPageChange = (value: number) => {
  if (value === pageNum.value) return
  pageNum.value = value
  getVenueTypeList()
}
</script>

<template>
  <PageContentShell class="venue-type-page" :skeleton-loading="tableLoading" skeleton-variant="table">
    <template #header>
      <div class="venue-type-page__header">
        <div class="venue-type-page__title">场地类型设置</div>
        <div class="venue-type-page__actions">
          <el-button @click="getVenueTypeList">刷新</el-button>
          <el-button type="primary" @click="openCreateDialog">新增类型</el-button>
        </div>
      </div>
    </template>

    <el-card shadow="never">
      <div class="venue-type-page__table-wrap">
        <el-table
          v-loading="tableLoading"
          :data="venueTypeList"
          stripe
          height="100%"
          empty-text="暂无场地类型数据"
        >
          <el-table-column prop="id" label="ID" width="120" />
          <el-table-column prop="name" label="类型名称" min-width="220" />
          <el-table-column label="更新时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTimeText(row.updateTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <template #footer>
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="handleCurrentPageChange"
      />
    </template>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="460px"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit placeholder="请输入场地类型名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </PageContentShell>
</template>

<style scoped lang="scss">
.venue-type-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.venue-type-page__title {
  font-size: 18px;
  font-weight: 600;
}

.venue-type-page__actions {
  display: flex;
  gap: 8px;
}

:deep(.venue-type-page .el-card) {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
}

:deep(.venue-type-page .el-card__body) {
  height: 100%;
  min-height: 0;
  padding: 0;
}

.venue-type-page__table-wrap {
  height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
}
</style>
