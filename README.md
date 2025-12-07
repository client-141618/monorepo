## Monorepo 项目
一个基于 pnpm workspace 的单仓库项目管理，包含多个前端应用和共享包。
---

## 📁 目录结构

```
monorepo/
├── apps/                    # 应用目录
│   ├── react_staging/       # React 应用
│   └── stadium-book/        # Vue 应用
├── packages/                # 共享包目录（预留）
├── components/              # 共享组件库
├── utils/                   # 共享工具库
├── pnpm-workspace.yaml      # pnpm workspace 配置
├── eslint.config.ts         # ESLint 配置
├── .commitlintrc.js         # Commitlint 配置
└── package.json             # 根 package.json
```

---

## 🚀 Apps 中项目技术栈

### 1. react_staging

**技术栈：**
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **状态管理**: Redux Toolkit
- **路由**: React Router v7
- **UI 组件库**: Ant Design 5
- **样式方案**: UnoCSS
- **HTTP 客户端**: Axios

**运行命令：**
```bash
cd apps/react_staging
pnpm dev        # 开发模式（端口 3000）
pnpm build      # 构建生产版本
pnpm preview    # 预览构建结果
```

### 2. stadium-book

**技术栈：**
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **路由**: Vue Router 4
- **UI 组件库**: Element Plus
- **样式方案**: UnoCSS + Sass
- **开发工具**: Vue DevTools
- **自动导入**: unplugin-auto-import + unplugin-vue-components

**运行命令：**
```bash
cd apps/stadium-book
pnpm dev        # 开发模式（端口 3344）
pnpm build      # 构建生产版本
pnpm preview    # 预览构建结果
```

---

## 📦 共享包

### components (@client/components)

共享 Vue 组件库，可在各个 Vue 应用中复用。

### utils (@cyz/utils)

共享工具函数库，包含 HTTP 请求封装等通用工具。

---

## 🛠️ 开发工具

项目使用以下开发工具保证代码质量：

- **包管理**: pnpm 10.14.0 (workspace)
- **代码规范**: ESLint (@antfu/eslint-config)
- **代码格式化**: Prettier
- **Git Hooks**: Husky + lint-staged
- **提交规范**: Commitlint (Conventional Commits)
- **类型检查**: TypeScript

**根目录命令：**
```bash
pnpm lint              # 检查代码规范
pnpm lint:fix          # 自动修复代码规范问题
pnpm format            # 格式化代码
pnpm format:check      # 检查代码格式
pnpm type-check        # 类型检查
```

---

## 📝 安装与使用

### 安装依赖

```bash
# 在根目录执行，会安装所有 workspace 的依赖
pnpm install
```

### 运行项目

```bash
# 运行 React 应用
cd apps/react_staging
pnpm dev

# 运行 Vue 应用
cd apps/stadium-book
pnpm dev
```

---

## ⚙️ 后端接口配置

**注意：** 后端接口是本地项目，没有在当前仓库，也没有上传到远程仓库。

当前代理配置（stadium-book）：

```ts
proxy: {
  "/api": {
    target: "http://127.0.0.1:8080",
    changeOrigin: true,
    // rewrite: (path) => path.replace(/^\/api/, ''),
  },
},
```
