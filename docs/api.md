# 冶金企业原材料采购管理系统前端接口调用文档

> 版本：阶段 1 接口契约草案｜更新：2026-10-08

本文档面向 Vue 3 页面开发，接口契约与 `backend/docs/api.md` 保持一致。当前只有登录接口在后端实现，其余页面和接口均为规划中。

## 1. 请求基础

统一使用 `src/api/http.js` 导出的 Axios 实例：

```js
import http from '@/api/http'

const response = await http.get('/materials', {
  params: { pageNum: 1, pageSize: 20, keyword: '铁矿' }
})
// response 即后端返回的 { code, msg, data }
```

- Axios `baseURL` 为 `/api`，因此调用路径不要重复写 `/api`。
- 请求默认超时 10 秒；请求拦截器自动读取 `localStorage.token` 并添加 `Authorization: Bearer <token>`。
- 收到 `401` 时清理本地 token，页面应跳转 `/login` 并提示重新登录。
- 成功判断：`response.code === 200`；失败优先展示 `response.msg`。
- 列表统一传 `pageNum`（从 1 开始）、`pageSize`（建议不超过 100），读取 `data.records`、`data.total`、`data.pages`。

## 2. 通用响应与页面处理

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

建议处理：`400` 显示字段校验错误，`401` 清理状态并回登录页，`403` 显示无权限，`404` 显示数据不存在，`409` 显示业务冲突，`500` 显示系统异常。列表加载显示 `loading`，写操作成功后刷新列表或详情，避免直接修改未确认的本地数据。

## 3. 登录与注册

### 登录页 `/login`

目标调用：

```js
const res = await http.post('/auth/login', {
  username: form.account,
  password: form.password
})
localStorage.setItem('token', res.data.token)
```

后端登录成功返回 `data.token`、`data.expiresIn` 和 `data.user`，前端保存 token 并将用户写入 Pinia；密码错误返回 401，停用账号返回 403。

注册调用：`POST /auth/register`，提交 `username`、`email`、`password`；成功后回到登录页，不在前端保存密码。后端未部署或仍为旧版本时返回 404，页面会提示检查后端版本。

## 4. 页面与接口映射

| 页面路由 | 接口 | 前端主要用途 | 当前状态 |
|---|---|---|---|
| `/dashboard` | `GET /dashboard/summary` | 卡片、待办、库存预警概览 | 页面占位 |
| `/material` | `GET /materials`、`GET /materials/{id}` | 物料列表/详情 | 页面占位 |
| `/material` | `POST /materials`、`PUT /materials/{id}`、`DELETE /materials/{id}` | 新增、编辑、删除 | 页面占位 |
| `/supplier` | `GET /suppliers`、`POST /suppliers`、`PUT /suppliers/{id}`、`PATCH /suppliers/{id}/status` | 供应商管理 | 页面占位 |
| `/purchase-plan` | `GET /purchase-plans`、`POST /purchase-plans`、`POST /purchase-plans/{id}/submit`、`POST /purchase-plans/{id}/approve` | 计划申请与审批 | 页面占位 |
| `/purchase-order` | `GET /purchase-orders`、`GET /purchase-orders/{id}`、`POST /purchase-orders`、`POST /purchase-orders/{id}/status` | 订单创建与跟踪 | 页面占位 |
| `/arrival-inspect` | `GET /arrival-inspects`、`POST /arrival-inspects` | 到货检验 | 页面占位 |
| `/inbound` | `GET /inbounds`、`POST /inbounds` | 合格物料入库 | 页面占位 |
| `/outbound` | `GET /outbounds`、`POST /outbounds` | 领用出库 | 页面占位 |
| `/inventory` | `GET /inventories`、`GET /inventories/warnings` | 台账和预警 | 页面占位 |
| `/report` | `GET /reports/purchase`、`/suppliers`、`/monthly`、`/inspection` | ECharts 统计图 | 页面占位 |

## 5. 表单与列表字段

### 物料与供应商

物料表单字段：`materialCode`、`materialName`、`category`、`unit`、`mainIndexRequired`、`sMax`、`pMax`、`granularity`、`unitPrice`、`safetyStock`、`remark`。供应商表单字段：`supplierCode`、`supplierName`、`contactPerson`、`phone`、`address`、`mainMaterials`、`businessLicense`、`status`、`remark`。

列表应展示编码、名称、类别/联系人、状态、更新时间，并将 `status` 的 `1/0` 显示为“启用/停用”。删除前需二次确认；存在采购、库存关联时优先改为停用。

### 采购计划与订单

计划表单：`materialId`、`quantity`、`expectDate`、`applyDept`、`reason`、`applicant`；状态标签：`PENDING`、`SUBMITTED`、`APPROVED`、`REJECTED`。订单表单：`planId`、`supplierId`、`materialId`、`quantity`、`unitPrice`、`orderDate`、`expectArrivalDate`；总金额由后端计算，前端只展示 `totalAmount`。订单状态：`CREATED`、`SENT`、`PARTIAL_RECEIVED`、`RECEIVED`、`CANCELLED`。

### 检验、入库、出库、库存

- 检验字段：`orderId`、`materialId`、`arrivalDate`、`arrivalQuantity`、`mainIndexActual`、`sActual`、`pActual`、`granularityOk`、`result`、`inspector`、`inspectTime`、`remark`；`result` 显示为待检、合格、不合格。
- 入库字段：`inspectId`、`orderId`、`materialId`、`quantity`、`inTime`、`operator`、`remark`；仅允许选择合格检验记录。
- 出库字段：`materialId`、`quantity`、`dept`、`outTime`、`operator`、`remark`；收到 `409` 时提示库存不足。
- 库存列表展示物料、当前数量、安全库存、预警状态；`quantity < safetyStock` 显示预警。

## 6. 统计图表数据

报表请求日期使用 `yyyy-MM-dd`，年度参数使用 `year`：

- `/reports/purchase`：采购数量、采购金额和按物料聚合数据。
- `/reports/suppliers`：供应商订单数、数量和金额。
- `/reports/monthly`：月份序列及采购金额/数量。
- `/reports/inspection`：检验总数、合格数、不合格数和合格率。

前端将接口返回的数据转换为 ECharts `series`，不要要求后端返回颜色、坐标轴等组件配置。

## 7. 角色与联调注意事项

角色为 `ADMIN`、`PROCUREMENT`、`INSPECTOR`、`WAREHOUSE`。菜单和按钮最终应依据登录返回的 `user.role` 过滤；阶段 1 路由守卫只能判断 token 是否存在，不能视为权限控制。

注册和登录均已接入真实认证接口，不在前端保存密码。接口调用统一放在 `src/api/` 或对应页面的 API 模块中，不要在组件内重复创建 Axios 实例。
