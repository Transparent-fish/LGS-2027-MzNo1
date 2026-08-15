# 重构 Todo

> 目标：把当前“技术切片 + 入口堆逻辑”的结构，收敛成“按业务场景聚合、分层明确、函数小而稳”的架构。

## 目标架构

- [ ] 后端按 `app / domain / infra / shared` 分层
- [ ] 前端按 `app / pages / components / stores / api / shared` 分层
- [ ] 统一导出风格：禁止 `export default`
- [ ] 统一类型风格：优先 `interface`，仅在联合类型和映射类型场景使用 `type`
- [ ] 禁止 `any`，必要时使用 `unknown` 并做显式收窄
- [ ] 函数控制在 80 行以内，超出必须拆分
- [ ] 导入顺序统一为：外部依赖 → `@template/*` 包 → 相对路径

## 后端重构顺序

- [ ] 将 `apps/server/src/main.ts` 纯化为启动装配层，只保留依赖创建、插件注册、路由注册和监听
- [ ] 拆分 `apps/server/src/http/routes.ts`，按 `tokens / paint / status` 分成独立 controller 文件
- [ ] 把 `Painter` 从“状态机 + 队列 + 回执处理 + 调度”拆成多个小模块
- [ ] 将 `diffBoard`、`Board`、任务队列、回执表归入 `domain/paint`
- [ ] 将上游 HTTP / WS 连接归入 `infra/paintboard`
- [ ] 将 token 落盘、加密、解密、读取封装成 `infra/storage` 和 `domain/token` 的组合
- [ ] 把 `routes.ts` 中的请求体 `as` 强转替换为显式校验和窄化
- [ ] 所有 `TODO(老师)` 逐条收敛到具体实现或独立 issue，不保留悬空注释

## 前端重构顺序

- [ ] 将 `App.vue` 拆为布局壳和连接逻辑两部分
- [ ] 将 REST / WS 访问统一收敛到 `api/` 和 `ws/`，避免组件直接拼接口
- [ ] 将 `paint` 与 `tokens` store 中的网络刷新逻辑下沉到服务层
- [ ] 将 `Dashboard.vue`、`Tokens.vue` 拆成页面和可复用组件
- [ ] 把菜单、状态标签、表格、控制按钮拆成独立组件，减少页面文件长度

## 协议与数据待确认

- [ ] 用真实服务端确认 UUID / 识别码字节序
- [ ] 确认 `uid` 拆三字节是否始终取低 24 位
- [ ] 校准 `config.cooldownSecs` 的默认值和服务端实际冷却行为
- [ ] 明确 `PaintProgress`、`TokenView`、状态事件的最终契约，避免前后端字段漂移

## 质量门禁

- [ ] 添加/补齐 lint 规则，强制 `no-explicit-any`、导出规则、import 顺序
- [ ] 给每个新增模块补类型检查覆盖，避免重构期间回退成隐式 `any`
- [ ] 在重构后跑通 `pnpm typecheck` 和 `pnpm build`
- [ ] 对绘画调度链路补最小单测，优先覆盖状态机、回执处理和 token 存储

## 建议的首批落点

- [ ] 先拆 `apps/server/src/main.ts`
- [ ] 再拆 `apps/server/src/http/routes.ts`
- [ ] 然后拆 `apps/server/src/pipeline/painter.ts`
- [ ] 最后整理 `apps/web/src/App.vue` 和两个 store
