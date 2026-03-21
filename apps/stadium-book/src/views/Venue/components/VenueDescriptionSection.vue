<script setup lang="ts">
const description = defineModel<string>("description", { required: true })
</script>

<template>
  <section class="venue-form__section">
    <div class="venue-form__section-title">场馆介绍</div>
    <el-form-item label="场馆介绍" prop="description" class="venue-form__media-item">
      <el-input
        v-model="description"
        type="textarea"
        :rows="8"
        placeholder="请输入场馆介绍"
        maxlength="300"
        show-word-limit
        resize="none"
      />
    </el-form-item>
  </section>
</template>
