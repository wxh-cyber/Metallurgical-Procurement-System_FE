# AGENTS.md

## 项目概览

本仓库是“冶金企业原材料采购管理系统”的前端，使用 Vue 3 + Vite 构建，代码采用 JavaScript（不使用 TypeScript）。当前处于阶段 1：基础布局、路由、Axios 封装和页面占位已完成，业务接口和完整页面仍在后续接入。

## 技术栈与约定

- Vue 3，使用单文件组件（.vue）和 <script setup>。
- Vite 5 作为开发服务器和生产构建工具。
- Element Plus 作为 UI 组件库，并在 src/main.js 全局注册。
- Vue Router 负责路由；Pinia 负责用户状态。
- Axios 统一封装在 src/api/http.js。
- ECharts 已声明为依赖，只有在报表功能实现时再接入。
- 遵循现有简洁风格，优先使用 Composition API、明确的数据流和小范围修改；不要未经需求引入 TypeScript、状态管理库或新的 UI 框架。

## 目录职责

- src/main.js：应用入口、Pinia、Router、Element Plus 和全局样式注册。
- src/App.vue：根组件，仅承载顶层路由出口。
- src/layout/MainLayout.vue：登录后的主布局、侧边菜单、顶部栏和退出登录。
- src/router/index.js：路由定义及登录守卫。
- src/stores/index.js：Pinia 用户仓库；当前保存 user 和本地 token。
- src/api/http.js：Axios 实例、/api 基地址、Bearer token 请求拦截器和 401 处理。
- src/utils/validation.js：可复用的表单校验函数。
- src/views/login/：登录页。当前登录按钮写入演示 token，不执行真实认证。
- src/views/dashboard/：仪表盘。
- src/views/Placeholder.vue：业务页面占位组件。
- vite.config.js：Vite 配置；开发环境将 /api 代理到 http://localhost:8080。
- index.html：Vite HTML 入口。

## 开发命令

在仓库根目录（frontend）执行：

```bash
npm install          # 首次安装依赖
npm run dev          # 启动开发服务器，默认 http://localhost:5173
npm run build        # 执行生产构建
npm run preview      # 预览构建产物
```

package.json 当前未配置自动化测试、Lint 或格式化脚本。修改行为后至少运行 npm run build；若新增测试工具或脚本，应同步更新本文件和 package.json。

## 路由、认证与接口

- 除 /login 外的路由由 router.beforeEach 检查 localStorage.token；没有 token 时重定向到登录页。
- Axios 默认 baseURL 为 /api，超时时间为 10 秒。请求会自动附加 Authorization: Bearer <token>。
- 收到 401 响应时会清理本地 token；新增接口调用应复用 src/api/http.js，不要在组件中重复创建 Axios 实例。
- 当前路由和菜单包含：仪表盘、物料档案、供应商管理、采购计划、采购订单、到货检验、入库管理、领用出库、库存台账和统计报表。新增业务页时应同时更新路由、菜单和对应视图。
- 真实登录、JWT 解析、角色权限和动态菜单尚未实现；接入后端时应保留现有守卫意图，并补充失败态、加载态和登出后的状态清理。

## 修改指南

- 页面级功能放在对应的 src/views/<feature>/ 下；通用布局放在 src/layout/，跨页面状态放在 src/stores/，通用请求放在 src/api/。
- 优先复用 Element Plus 组件和现有校验工具，保持现有中文文案和采购业务术语一致。
- 不要把 token、密码、私钥或其他凭据提交到代码、日志或文档中；演示 token 只能用于本地占位。
- 变更路由时检查未登录访问、直接刷新和未知路径等情况；变更请求封装时检查 token 注入和 401 行为。
- 保持改动小而集中，不要顺带重构无关文件；新增依赖前先确认现有依赖无法满足需求。

## 提交前检查

1. 确认修改文件位于正确的目录，且没有提交密钥、环境变量值或生成物。
2. 运行 npm run build，确保 Vite 生产构建成功。
3. 若修改路由或登录流程，在浏览器中验证登录页、受保护页面、刷新和退出登录。
4. 若修改接口封装，确认开发服务器 /api 代理、Bearer token 和 401 清理逻辑未被破坏。
5. 更新 README 或本文件中的命令、目录和当前限制，避免文档与实现脱节。

## 当前已知限制

- 登录页面是阶段 1 演示实现，账号密码输入不会参与校验。
- 物料、供应商、采购、检验、仓储和报表页面仍是占位页。
- 菜单尚未按角色动态过滤。
- 当前没有自动化测试、Lint 或格式化配置。

