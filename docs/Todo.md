# 后端重写 Todo

> 目标：从零重写 `server/`，对标 `LGS-Paintboard-Helper`（Rust 版）的架构，单进程 Node/TS 落地。
> 决策已定：单进程+模块拆分；1 条读连接 + N 条 writeonly 写连接池；完整移植优先级算法（棋盘+边缘+热衰减）；每 Token 冷却租赁；命令总线；继续 Fastify+ws，REST/面板契约保留并扩展；sharp + vitest。

## 架构目标

- [ ] 后端按 `app / domain / infra / shared` 分层
- [ ] 入口文件只做启动装配，不承载业务逻辑
- [ ] HTTP 控制器只做「解析 → 发命令 → 映射响应」，领域层对 HTTP 零依赖（命令总线）
- [ ] 读连接（版面同步）与写连接池（绘制）分离，规避 IP 连接数限制（readwrite 3 / writeonly 5）
- [ ] 多 Token 并发 + 每 Token 冷却租赁（Available / Acquired / InCooldown）
- [ ] 优先级绘制：棋盘+随机扰动基础优先级 + Canny 边缘增强 + 热衰减惩罚（防互踩/撒点）
- [ ] 全局事件总线解耦：协议层、版面同步、比对循环、绘制引擎彼此解耦
- [ ] 所有导出使用命名导出，禁止 `export default`
- [ ] 优先使用 `interface`，仅在联合类型和映射类型场景使用 `type`
- [ ] 禁止 `any`，不确定输入统一用 `unknown` 后再收窄
- [ ] 函数体控制在 80 行以内，超过就拆分
- [ ] 导入顺序统一为：外部依赖 → 相对路径

## 目标目录

- [ ] `server/src/main.ts`
- [ ] `server/src/container.ts`
- [ ] `server/src/shared/command-router.ts`
- [ ] `server/src/shared/event-bus.ts`
- [ ] `server/src/shared/errors.ts`
- [ ] `server/src/shared/result.ts`
- [ ] `server/src/shared/validators.ts`
- [ ] `server/src/shared/logger.ts`
- [ ] `server/src/domain/protocol/opcode.ts`
- [ ] `server/src/domain/protocol/packetCodec.ts`
- [ ] `server/src/domain/board/board.ts`
- [ ] `server/src/domain/board/local-board.ts`
- [ ] `server/src/domain/board/board-sync.ts`
- [ ] `server/src/domain/paint/types.ts`
- [ ] `server/src/domain/paint/pixel-queue.ts`
- [ ] `server/src/domain/paint/priority.ts`
- [ ] `server/src/domain/paint/token-manager.ts`
- [ ] `server/src/domain/paint/paint-batcher.ts`
- [ ] `server/src/domain/paint/paint-worker.ts`
- [ ] `server/src/domain/paint/paint-service.ts`
- [ ] `server/src/domain/paint/paint-state.ts`
- [ ] `server/src/domain/token/tokenTypes.ts`
- [ ] `server/src/domain/token/tokenService.ts`
- [ ] `server/src/domain/token/tokenPolicy.ts`
- [ ] `server/src/infra/paintboard/http.ts`
- [ ] `server/src/infra/paintboard/ws-actor.ts`
- [ ] `server/src/infra/paintboard/ws-rate-limiter.ts`
- [ ] `server/src/infra/paintboard/ws-response-tracker.ts`
- [ ] `server/src/infra/paintboard/ws-reconnect.ts`
- [ ] `server/src/infra/paintboard/write-pool.ts`
- [ ] `server/src/infra/image/loader.ts`
- [ ] `server/src/infra/image/edge.ts`
- [ ] `server/src/infra/storage/secretStore.ts`
- [ ] `server/src/infra/storage/tokenCrypto.ts`
- [ ] `server/src/infra/storage/tokenRepository.ts`
- [ ] `server/src/infra/runtime/configLoader.ts`
- [ ] `server/src/infra/runtime/idGenerator.ts`
- [ ] `server/src/infra/runtime/boardLoader.ts`
- [ ] `server/src/app/fastify.ts`
- [ ] `server/src/app/controllers/`
- [ ] `server/src/app/routes.ts`
- [ ] `server/src/app/ws-hub.ts`

## 实施顺序

### Phase 0 — 脚手架修复

- [x] `pnpm-workspace.yaml` 改为 `packages: ["server", "web"]`
- [x] 根 `package.json` 脚本对齐；`server/package.json` 增加 `sharp`、`vitest`
- [x] 重建空壳 `container.ts`、`main.ts`（先只打印启动信息）
- [x] 新建 `web/src/app/AppShell.vue`，修好前端构建
- [x] 门禁：`pnpm install` / `pnpm typecheck` / `pnpm build` 全绿

### Phase 1 — 共享层与协议/连接基础设施

- [x] `event-bus.ts`、`errors/result/validators/logger`
- [x] `protocol/opcode.ts` + `packetCodec.ts`，修复 UUID→hex16 字节编码（对齐 docs/api.md）
- [x] `configLoader` 扩展新配置字段
- [x] `ws-rate-limiter`（令牌桶，每连接 256/s）/ `ws-reconnect`（指数退避，1008/429 封禁停止）/ `ws-response-tracker`（paintId→resolver+超时清理）
- [x] `ws-actor.ts`：读写两种模式客户端（粘包拆解、0xfc→0xfb、0xfa→事件、0xff→回执、20ms pump）
- [x] `write-pool.ts`：N 条 writeonly 连接池（按负载分发）
- [x] 单测：codec 组包/拆包往返、限速、回执超时、退避策略

### Phase 2 — 版面同步

- [ ] `board.ts` + `local-board.ts`（热力图指数衰减 + 兴趣点加速 + updateFromBoard/updateFromBytes）
- [ ] `board-sync.ts`：定时 getBoard → 更新 localBoard → 事件广播差异
- [ ] 单测：localBoard 更新语义、热度衰减曲线

### Phase 3 — Token 域

- [ ] token 域保留现有 service/policy/加密仓储语义，存储路径统一到 `server/data`
- [ ] 新增 `token-manager.ts`（每 Token 冷却租赁）
- [ ] 单测：租赁生命周期、冷却轮转

### Phase 4 — 图像与优先级

- [ ] `infra/image/loader.ts`（sharp：读图→缩放→RGBA，alpha=0 跳过）+ `edge.ts`（灰度→模糊→边缘检测→边缘强度图）
- [ ] `pixel-queue.ts` 优先级二叉堆 + `merge_updates`（按 pos 去重）
- [ ] `priority.ts`：`base(棋盘+随机, 缺像素=10000) × 1/(1+heat×penalty) + edge_bonus`
- [ ] 单测：堆序、去重、优先级公式

### Phase 5 — 绘制引擎

- [ ] `paint-batcher.ts`：聚合操作，按 batchSize / batchFlushMs 触发，粘包发送，维护 pending 像素
- [ ] `paint-worker.ts`：N 个 worker 弹像素 + 租 Token
- [ ] `paint-service.ts`：start（预处理→初始 diff→起 worker/比对循环）/stop/pause/resume；0xee 回执→该 Token 冷却；状态含 token 冷却数、各连接状态、队列峰值
- [ ] 单测：状态机、比对循环（mock board）、回执分发

### Phase 6 — 命令总线与 HTTP/WS 层

- [ ] `command-router.ts`：CommandHandler 注册 + dispatch，控制器零领域依赖
- [ ] 命令：StartPainting / StopPainting / PausePainting / ResumePainting / RefreshToken 等
- [ ] `app/fastify.ts` + `controllers/*` + `routes.ts`，保留原 REST 契约并扩展
- [ ] `ws-hub.ts` 事件扩展（progress / log / tokens / status + 连接与 token 统计）
- [ ] `container.ts` 重写装配、`main.ts` 正式引导
- [ ] 门禁：`pnpm typecheck` 通过；真机联调字节序/回执/冷却

### Phase 7 — 面板适配与联调

- [ ] Dashboard：多 Token 选择、模式（paint/guard）、连接数/队列峰值/各 Token 冷却展示
- [ ] Tokens：每 Token CD 状态、刷新 PaintKey
- [ ] 真机验证：UUID / 识别码字节序、IP 连接数限制、写连接池规模

### Phase 8 — 收尾

- [ ] `pnpm typecheck` / `pnpm build` / `pnpm -r test` 全绿
- [ ] README、`docs/api.md` 对齐新架构
- [ ] 清理 `apps/` 残余引用

## 新增配置字段（config.example.json）

- [ ] `writeConnections`：writeonly 池大小（1..5，默认 3）
- [ ] `maxPacketsPerSec`：每连接令牌桶（默认 230）
- [ ] `cdTimeMs`：每 Token 冷却（默认 3000）
- [ ] `batchSize` / `batchFlushMs`：批量聚合阈值（默认 100 / 100）
- [ ] `comparisonIntervalMs`：守护比对间隔（默认 2000）
- [ ] `syncIntervalMs`：HTTP 全量同步间隔（默认 7500）
- [ ] `penaltyScale`：热惩罚系数（默认 1.0）
- [ ] `cannyLow` / `cannyHigh`：边缘检测阈值（默认 20 / 40）

## 协议确认

- [ ] 用真实服务端确认 UUID / 识别码字节序
- [ ] 确认 `uid` 拆三字节是否始终取低 24 位
- [ ] 校准每 Token 冷却时长（cdTimeMs）默认值
- [ ] 明确 PaintProgress、Token 视图、WS 事件的最终字段契约

## 质量门禁

- [ ] 补齐 lint 规则，强制 `no-explicit-any`、导出规则、import 顺序
- [ ] 关键模块单测：状态机、回执、token 存储、优先级队列
- [ ] 重构后跑通 `pnpm typecheck` 和 `pnpm build`
- [ ] 全部完成后 `pnpm -r test` 通过
