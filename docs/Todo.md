# 后端重构 Todo

> 目标：把 `apps/server` 从“入口堆逻辑 + 技术切片目录”改成“组合根 + 应用层 + 领域层 + 基础设施层”的稳定结构。

## 架构目标

- [ ] 后端按 `app / domain / infra / shared` 分层
- [ ] 入口文件只做启动装配，不承载业务逻辑
- [ ] 路由、控制器、服务、仓储职责分离
- [ ] 协议、网络、存储、调度彼此解耦
- [ ] 所有导出使用命名导出，禁止 `export default`
- [ ] 优先使用 `interface`，仅在联合类型和映射类型场景使用 `type`
- [ ] 禁止 `any`，不确定输入统一用 `unknown` 后再收窄
- [ ] 函数体控制在 80 行以内，超过就拆分
- [ ] 导入顺序统一为：外部依赖 → `@template/*` 包 → 相对路径

## 目标目录

- [ ] `apps/server/src/main.ts`
- [ ] `apps/server/src/app/container.ts`
- [ ] `apps/server/src/app/routes/tokenRoutes.ts`
- [ ] `apps/server/src/app/routes/paintRoutes.ts`
- [ ] `apps/server/src/app/routes/statusRoutes.ts`
- [ ] `apps/server/src/app/controllers/tokenController.ts`
- [ ] `apps/server/src/app/controllers/paintController.ts`
- [ ] `apps/server/src/app/controllers/statusController.ts`
- [ ] `apps/server/src/app/ws/wsHub.ts`
- [ ] `apps/server/src/domain/token/tokenTypes.ts`
- [ ] `apps/server/src/domain/token/tokenService.ts`
- [ ] `apps/server/src/domain/token/tokenPolicy.ts`
- [ ] `apps/server/src/domain/paint/board.ts`
- [ ] `apps/server/src/domain/paint/diff.ts`
- [ ] `apps/server/src/domain/paint/paintQueue.ts`
- [ ] `apps/server/src/domain/paint/paintScheduler.ts`
- [ ] `apps/server/src/domain/paint/paintState.ts`
- [ ] `apps/server/src/domain/protocol/opcode.ts`
- [ ] `apps/server/src/domain/protocol/packetCodec.ts`
- [ ] `apps/server/src/infra/paintboard/paintboardHttp.ts`
- [ ] `apps/server/src/infra/paintboard/paintboardWs.ts`
- [ ] `apps/server/src/infra/storage/tokenRepository.ts`
- [ ] `apps/server/src/infra/storage/tokenCrypto.ts`
- [ ] `apps/server/src/infra/storage/secretStore.ts`
- [ ] `apps/server/src/infra/runtime/configLoader.ts`
- [ ] `apps/server/src/infra/runtime/idGenerator.ts`
- [ ] `apps/server/src/shared/errors.ts`
- [ ] `apps/server/src/shared/result.ts`
- [ ] `apps/server/src/shared/validators.ts`

## 实施顺序

- [ ] 先纯化 `apps/server/src/main.ts`，让它只负责依赖创建和模块装配
- [ ] 拆分 `apps/server/src/http/routes.ts` 为独立 controller 和 route 文件
- [ ] 把 `Painter` 拆成调度器、队列、状态、回执处理几个小模块
- [ ] 把 `Board`、`diffBoard`、`AckTable` 归并到 `domain/paint`
- [ ] 把 `protocol/ws.ts`、`api/http.ts` 收拢到 `infra/paintboard`
- [ ] 把 token 文件读写与加解密拆成 repository 和 crypto 两层
- [ ] 把请求体 `as` 强转替换成显式校验与类型收窄
- [ ] 清理所有 `TODO(老师)`，改成真实实现或拆到独立任务

## 协议确认

- [ ] 用真实服务端确认 UUID / 识别码字节序
- [ ] 确认 `uid` 拆三字节是否始终取低 24 位
- [ ] 校准 `config.cooldownSecs` 默认值和真实冷却时长
- [ ] 明确 `PaintProgress`、Token 视图、WS 事件的最终字段契约

## 质量门禁

- [ ] 补齐 lint 规则，强制 `no-explicit-any`、导出规则、import 顺序
- [ ] 为新增模块补最小类型检查覆盖
- [ ] 重构后跑通 `pnpm typecheck` 和 `pnpm build`
- [ ] 为调度链路补最小单测，优先覆盖状态机、回执和 token 存储
