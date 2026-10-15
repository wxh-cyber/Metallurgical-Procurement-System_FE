# 冶金企业原材料采购管理系统前端

本项目是“冶金企业原材料采购管理系统”的 Vue 3 单页管理端，面向管理员、采购员、质检员和库管员等角色，提供采购业务和仓储业务的可视化操作入口。

当前已接入真实账号注册、用户名/邮箱登录和 JWT 会话恢复；物料、供应商和采购概览页面已连接后端接口。其余采购、检验和仓储业务仍在后续阶段补齐。

## 技术栈

- Vue 3
- Vite
- JavaScript（不使用 TypeScript）
- Element Plus
- Vue Router
- Pinia
- Axios
- ECharts（已加入依赖，后续用于统计报表）

## 当前已实现

- Vite 开发和生产构建配置。
- Element Plus 全局注册和基础样式。
- `MainLayout` 主布局，包含侧边菜单、顶部栏和内容区。
- 登录与注册页面，调用后端认证接口并反馈成功/错误状态。
- Vue Router 路由守卫：非登录页面需要存在 `localStorage.token`。
- Axios 实例：统一使用 `/api` 前缀，并自动附加 Bearer Token。
- 物料、供应商、采购、检验、入库、出库、库存和报表页面路由占位。
- Pinia 用户状态仓库和基础数量校验工具。

## 目录结构

```text
frontend/
├─ index.html
├─ package.json
├─ vite.config.js
└─ src/
   ├─ main.js                  # 应用入口和全局插件注册
   ├─ App.vue                  # 根组件
   ├─ api/
   │  └─ http.js               # Axios 实例和请求拦截器
   ├─ layout/
   │  └─ MainLayout.vue        # 左侧菜单、顶部栏、主内容区
   ├─ router/
   │  └─ index.js              # 页面路由和登录守卫
   ├─ stores/
   │  └─ index.js              # Pinia 用户状态
   ├─ utils/
   │  └─ validation.js         # 表单校验工具
   └─ views/
      ├─ login/                # 登录页
      ├─ dashboard/            # 仪表盘
      └─ Placeholder.vue       # 后续业务页通用占位组件
```

## 页面规划

系统页面按采购到库存的业务闭环组织：

1. 登录
2. 仪表盘
3. 物料档案
4. 供应商管理
5. 采购计划
6. 采购订单
7. 到货检验
8. 入库管理
9. 领用出库
10. 库存台账
11. 统计报表

后续页面将统一提供查询、分页、新增、编辑、删除、状态标签和表单校验，并根据用户角色显示可用菜单。

## 请求与路由

- Vite 开发服务器将 `/api` 代理到 `http://localhost:8080`。
- Axios 实例位于 `src/api/http.js`，默认基地址为 `/api`。
- 请求拦截器从 `localStorage.token` 读取令牌，并添加 `Authorization: Bearer <token>`。
- 响应收到 `401` 时会清理本地 token 并跳转登录页。
- 当前路由守卫只检查 token 是否存在，尚未接入真实 JWT 解析和角色权限判断。

## 本地运行

先按同级后端仓库 `../backend/README.md` 准备 MySQL、配置 `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` 并启动 Spring Boot；数据库脚本需先执行 `schema.sql`，再执行 `data.sql`。在后端已监听 `http://localhost:8080` 后，再在 `frontend` 目录执行：

```bash
npm install
npm run dev
```

开发服务器默认地址为 `http://localhost:5173`。

生产构建和预览：

```bash
npm run build
npm run preview
```

## 后续开发计划

1. 对接后端真实登录接口，保存用户信息和 JWT。
2. 按 ADMIN、PROCUREMENT、INSPECTOR、WAREHOUSE 角色过滤菜单和操作按钮。
3. 实现物料档案、供应商管理和采购计划页面。
4. 实现订单、到货检验、入库、出库和库存预警页面。
5. 使用 ECharts 接入采购量、供应商金额、月度金额和检验合格率报表。
6. 完成前后端联调和完整采购业务演示。

## 当前限制

- 注册和登录依赖后端可访问且数据库连接、表结构已正确配置；请勿将数据库密码提交到前端或仓库。
- 物料、供应商、采购、检验、仓储和报表页面目前为路由占位页。
- 菜单暂未按角色动态过滤。
- 运行前需要先安装 `package.json` 中声明的依赖。
