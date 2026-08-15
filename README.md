# LGS Paintboard 2027 MzNo1

基于 `docs/api.md` 的 LGS Paintboard 绘画工具，采用 TypeScript + pnpm workspace 组织。

项目分为两个子包：

- `apps/server`：Node 后端，负责上游绘版连接、协议拆包、Token 加密存储、绘画调度和 REST / WebSocket API。
- `apps/web`：Vue 3 + Naive UI 管理面板，负责绘画控制台、Token 管理和运行状态展示。

## 运行要求

- Node.js >= 20
- pnpm >= 10

## 快速开始

```bash
pnpm install
pnpm dev
```

启动后：

- 面板：http://localhost:5173
- 后端：http://127.0.0.1:8787

开发环境下，Vite 会把 `/api` 和 `/ws` 代理到后端 `8787`。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 同时启动前端和后端 |
| `pnpm build` | 构建全部子包 |
| `pnpm start` | 启动后端生产构建，需先 `build` |
| `pnpm typecheck` | 运行全部子包类型检查 |
| `pnpm --filter server dev` | 只运行后端开发模式 |
| `pnpm --filter web dev` | 只运行前端开发模式 |

## 目录结构

```text
apps/
├── server/
│   ├── data/               # 运行数据：tokens.json、.secret
│   └── src/
│       ├── main.ts         # 入口：Fastify + WS + 路由装配
│       ├── config.ts       # 配置加载（根目录 config.json 覆盖默认值）
│       ├── api/
│       │   ├── http.ts     # 上游 HTTP 封装（getboard / gettoken）
│       │   └── token.ts    # TokenResponse 类型
│       ├── protocol/
│       │   ├── opcode.ts   # 操作码、状态码、包长表
│       │   ├── packet.ts   # 粘包拆解 + 0xfe 组包
│       │   └── ws.ts       # 上游 WS：Ping/Pong、退避重连、封禁停止重连
│       ├── board/
│       │   ├── board.ts    # 1000x600 版面模型
│       │   └── diff.ts     # 目标图与版面差异计算
│       ├── pipeline/
│       │   ├── painter.ts  # 绘画调度状态机
│       │   ├── rate.ts     # 令牌桶限速
│       │   └── ack.ts      # 识别码 ↔ 待确认任务表
│       ├── storage/
│       │   └── tokens.ts   # Token 加密存储（AES-256-GCM）
│       └── http/
│           ├── routes.ts   # REST 接口
│           └── ws-hub.ts   # 面板实时推送
└── web/
    └── src/
        ├── App.vue         # 布局、主题、WS 订阅
        ├── router.ts       # /dashboard /tokens
        ├── api/client.ts   # REST 客户端
        ├── ws/client.ts    # 实时事件订阅与自动重连
        ├── stores/
        │   ├── tokens.ts   # Token 状态
        │   └── paint.ts    # 绘画状态与日志
        └── views/
            ├── Dashboard.vue  # 控制台：开始 / 停止 / 暂停 / 恢复
            └── Tokens.vue     # Token 管理：增删改、刷新 PaintKey
```

## 配置

在仓库根目录创建 `config.json` 覆盖默认配置，`apps/server` 会从当前工作目录读取：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `port` | `8787` | 后端监听端口 |
| `apiBase` | `https://paintboard.luogu.me` | 上游 HTTP API |
| `wsUrl` | `wss://paintboard.luogu.me/api/paintboard/ws` | 上游 WS 地址 |
| `maxPacketsPerSec` | `230` | 发包限速，低于服务端上限 256/s |
| `cooldownSecs` | `10` | 收到 `0xee` 后的等待时长 |
| `maxReconnectSecs` | `60` | WS 重连最大退避秒数 |

## Token 管理

- 存储位置：`apps/server/data/tokens.json`
- `accessKey` 和 `paintKey` 都使用 **AES-256-GCM** 加密后落盘，格式为 `iv:tag:data`（base64）。
- 加密密钥优先级：
  1. 环境变量 `PAINTBOARD_SECRET`，建议至少 32 字符
  2. 首次运行自动生成的 `apps/server/data/.secret`
- `data/` 已加入忽略列表，不会提交密钥或密文。
- 新增或刷新 Token 时，后端会自动调用 `gettoken` 换取 PaintKey；列表接口只返回脱敏视图。

## REST 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tokens` | Token 列表（脱敏） |
| POST | `/api/tokens` | 新增 `{ name, uid, accessKey }`，并尝试换取 PaintKey |
| PUT | `/api/tokens/:id` | 更新名称、uid 或 accessKey |
| DELETE | `/api/tokens/:id` | 删除 Token |
| POST | `/api/tokens/:id/refresh` | 重新获取 PaintKey |
| POST | `/api/paint/start` | 开始绘画 `{ tokenId, imagePath, mode }` |
| POST | `/api/paint/stop` | 停止绘画 |
| POST | `/api/paint/pause` | 暂停绘画 |
| POST | `/api/paint/resume` | 恢复绘画 |
| GET | `/api/status` | 调度状态、连接状态、Token 数量 |

## 面板实时推送

WebSocket 地址：`/ws`

| 事件 | 内容 |
| --- | --- |
| `status` | 调度器状态切换 |
| `progress` | 进度：`total` / `painted` / `failed` / `ackCounts` / `queueLength` |
| `log` | 日志行 |
| `tokens` | Token 相关通知 |

## 协议要点

摘自 `docs/api.md` 的关键约定：

- 版面：`GET /api/paintboard/getboard`，返回 `1000 x 600 x 3` 字节 RGB，行序为 `y * 3000 + x * 3`。
- Token：`POST /api/auth/gettoken`，请求 `{ uid, access_key }`，返回 `{ token }`，其中 token 即 PaintKey（UUID）。
- WS：`wss://paintboard.luogu.me/api/paintboard/ws`，消息会粘包，需要自行拆包。
- 操作码：
  - `0xfc` S2C Ping，回 `0xfb` Pong
  - `0xfa` S2C 绘画事件，7 字节：`x, y, r, g, b`
  - `0xff` S2C 回执，5 字节：识别码 `Uint32` + 状态码
  - `0xfe` C2S 绘画请求，31 字节：`x, y, r, g, b + uid 三字节 + Token 16B + 识别码`
- 回执状态码：`0xef` 成功 / `0xee` 冷却 / `0xed` Token 无效 / `0xec` 格式错误 / `0xeb` 无权限 / `0xea` 服务器错误。
- 限制：每连接不超过 256 包/秒；单 IP 连接数有限制；单包不超过 32KB；违规可能触发 429 或 1008。

## 当前实现状态

当前仓库已经完成了基础设施和管理面板的大部分工作，剩余重点在绘画调度链路：

- 已完成：上游 HTTP 封装、WS 拆包与重连、Token 加密存储、前端管理面板、状态展示和日志通道。
- 待完善：`Painter` 的发送循环、回执重试、冷却处理、本地版面同步，以及 `/api/paint/start` 的图片载入与目标版面生成。

## 备注

- UUID / 识别码的字节序在文档里没有明确说明，当前实现按小端处理，落地前建议用真实服务端再验证一次。
- `uid` 拆三字节时默认取低 24 位。
- 冷却时长没有官方固定值，当前使用 `config.cooldownSecs` 可调。
