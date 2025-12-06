<script setup lang="ts">
	import SideMenu from '@/components/SideMenu/SideMenu.vue'
</script>

<template>
	<div class="common-layout">
		<el-container>
			<el-aside width="200px">
				<SideMenu />
			</el-aside>
			<el-container>
				<el-header>Header</el-header>
				<el-main>Main</el-main>
			</el-container>
		</el-container>
	</div>
</template>

<style lang="scss" scoped></style>