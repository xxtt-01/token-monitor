## 2026-06-17 18:00: 多账号采集 — 每个 profile 独立查询限额
- **文件:**
  - `src/shared/limitCollector.js`
  - `src/shared/limits.js`
  - `src/electron/main.js`
- **原因:** 支持 OpenCode 多账号配置，每个 profile 独立采集限额数据
- **决策:**
  - `fetchOpenCodeLimits` 改为接收 `opencodeProfiles` 对象，返回 provider 数组
  - 新增 `fetchSingleOpenCodeProfile` 辅助函数处理单个 profile 的 Go/Zen 查询
  - `providerCollapseKey` 增加 opencode 配置账号不走聚合，确保每个 profile 独立显示
  - main.js 添加 `opencodeProfiles` 配置字段和旧 `opencodeCookie` 迁移逻辑
  - 本地 Local（SQLite）作为独立 provider 始终显示
- **影响范围:** 限额采集流程、UI 显示聚合逻辑、Electron 主进程配置传递

## 2026-06-17 18:50: 多账号 IPC 通道和 preload API 桥接
- **文件:**
  - `src/electron/main.js`
  - `src/electron/preload.js`
- **原因:** 为多账号管理提供完整的 IPC 通信层
- **决策:**
  - defaultSettings 添加 `opencodeProfiles: {}`
  - readSettings 添加旧 `opencodeCookie` 到 `opencodeProfiles` 自动迁移
  - `currentOpenCodeCookie()` 优先使用 profiles 中的启用 cookie
  - 重写 `opencode:saveCookie` 同时写入 `profiles.default` 和 `opencodeCookie`
  - 重写 `opencode:logout` 同时清空 profiles 和 opencodeCookie
  - 重写 `opencode:status` 遍历所有 profiles 查询状态，保留 env 环境变量兼容
  - 新增 5 个 IPC handler: getProfiles/saveProfile/deleteProfile/renameProfile/setProfileEnabled
  - preload.js 桥接所有新 IPC 方法到 renderer 进程
- **影响范围:** Electron 主进程 IPC 层、渲染进程 API 桥接

## 2026-06-17 19:00: 多账号 UI — OpenCode 设置面板
- **文件:**
  - `src/electron/renderer/index.html`
  - `src/electron/renderer/styles.css`
  - `src/electron/renderer/app.js`
- **原因:** 为多账号功能提供 UI 界面支持
- **决策:**
  - index.html: 旧面板替换为多账号面板，新增 profile list 容器、profile name 输入框
  - styles.css: 新增 `.opencode-profile-*` 样式类（list/item/name/status/balance/delete）
  - app.js: 新增 `renderOpenCodeProfiles()` 和 `updateOpenCodeProfilesStatus()` 动态渲染 profile 列表
  - app.js: 移除了 `state.opencodeAccount` 状态追踪，改用 `state.opencodeProfileCount`
  - app.js: 事件绑定改为使用 `saveProfile`/`deleteProfile`/`renameProfile`/`setProfileEnabled` IPC API
- **影响范围:** 设置面板 OpenCode 多账号管理 UI

## 2026-06-17 19:30: 兼容单 cookie 传参方式，修复测试回归
- **文件:**
  - `src/shared/limitCollector.js`
- **原因:** `fetchOpenCodeLimits` 重写后只读 `opencodeProfiles`，旧代码和测试传的是 `opencodeCookie`，导致 7 个测试失败
- **根因:** 新旧接口不兼容，单 cookie 传参方式未做向后兼容
- **决策:**
  - `fetchOpenCodeLimits` 改为双路径：单 cookie（≤1 个源）走旧合并逻辑，多 cookie（2+ 个源）走新分离逻辑
  - 单 cookie 保留原有 Go web > Go local > Zen 的合并行为，确保测试和旧 API 兼容
  - 多 cookie 时每个 profile 独立查询，本地 Local 作为独立 provider
- **影响范围:** `fetchOpenCodeLimits` 函数逻辑

## 2026-06-17 20:00: 代码清理 — 移除死代码、去重、UI 即时刷新
- **文件:**
  - `src/electron/main.js`
  - `src/electron/renderer/app.js`
  - `src/shared/limitCollector.js`
- **原因:** 审查发现的代码质量问题
- **决策:**
  - 移除死函数 `readOpenCodeStatus()`（已被 `opencode:status` 内联逻辑替代）
  - 禁用 Profile 不再被 `opencode:status` 查询，减少 HTTP 请求
  - 多账号路径复用 `fetchSingleOpenCodeProfile` 去重
  - Profile 切换/删除后即时调用 `renderSettingsSummaries()` 更新摘要 pill
- **影响范围:** 代码质量、UI 响应性

## 2026-06-18 01:00: 修复 totalTokens 重复计算 cacheRead
- **文件:**
  - `src/shared/usage.js`
- **原因:** `extractUsageFromTokscale` 中 `tokenValue(row)` 求和了所有组件（input+output+cacheRead），但 input 已包含 cacheRead per API 规范（Anthropic、OpenAI 等），导致 cacheRead 被重复计数
- **决策:** 当 cacheRead 存在时，改用 `input + output` 作为 totalTokens。cacheRead 仍独立记录用于详情展示。字段缺失时回退到原 tokenValue 逻辑
- **影响范围:** 所有工具的今日/本月/全部 Token 总量显示

## 2026-06-18 01:30: 增加缓存命中率显示，改进 Profile 列表 UI
- **文件:**
  - `src/electron/renderer/index.html`
  - `src/electron/renderer/app.js`
  - `src/electron/renderer/styles.css`
- **原因:**
  - 用户需要直观看到缓存命中率
  - Profile 列表 UI 丑且缺少引导
- **决策:**
  - 主统计栏新增缓存命中率显示（`总 tokens 数 → 费用 → Cache hit: XX%`）
  - Profile 列表改用 grid 布局，新增表头列（名称、状态、余额）
  - 空状态添加中文引导文字
  - 所有按钮/提示改为中文
- **影响范围:** 主界面统计显示、设置面板 OpenCode 账号管理

## 2026-06-18 02:00: 重做添加账号 UI + 修复 totalTokens/cacheRead 多次回退
- **文件:**
  - `src/electron/renderer/index.html`
  - `src/electron/renderer/app.js`
  - `src/electron/renderer/styles.css`
  - `src/shared/usage.js`
- **原因:**
  - 添加账号面板太简陋
  - totalTokens 和 cacheRead 的关系判断错误，来回回退三次
  - inline 编辑在 Electron 沙箱中不可用（prompt 被禁用）
- **决策:**
  - 添加账号改用玻璃拟态折叠面板 + SVG 图标 + 渐变按钮
  - totalTokens = input + output（input 已含 cacheRead，符合业界标准）
  - 缓存命中率 = cacheRead / input * 100
  - Profile 列表改用三列 grid 布局（复选框 | 名称+✎ | 状态+删除）
  - 重命名用 inline input 替代 prompt，回车保存 Esc 取消
  - 添加通用 `.hidden { display: none !important }` 类
- **影响范围:** 设置面板、Token 总量统计、缓存命中率

## 2026-06-18 02:30: 额度视图支持多 opencode 账号展示
- **文件:**
  - `src/electron/renderer/app.js`
- **原因:** `renderLimits` 中多账号时只取了 `visibleProviders[0]`，后面的 opencode 账号被静默丢弃
- **决策:** 新增 `renderOpenCodeAccountGroup`，参照 Codex 多账号模式展开显示所有 profile 的日/周/月额度
- **影响范围:** 额度面板 OpenCode 多账号显示

## 2026-06-18 03:30: 状态栏可见 + 渐进式展示 + 锚点持久化
- **文件:**
  - `src/electron/renderer/styles.css`
  - `src/electron/renderer/app.js`
  - `src/shared/collector.js`
- **原因:**
  - 状态栏 .status 默认 display:none，用户看不到加载进度
  - 首次启动要等 90s today+month+allTime 扫完才能看到数据
  - 后续启动同样要等 90s，month/allTime 数据其实没变化
- **决策:**
  - 状态栏改为可见，加载时蓝色脉冲文字
  - 渐进式展示：today 扫完立刻推数据，不等 month/allTime
  - 锚点持久化：全量扫描结果存磁盘，后续启动直接复用
  - 锚点过期检测：仅当 dateKey 当天有效
- **影响范围:** 启动速度（首 90s→30s 见数据，后续 90s→30s）

## 2026-06-18 04:00: 修复初始启动未使用锚点的问题
- **文件:**
  - `src/shared/collector.js`
- **原因:** 锚点持久化实现了但初始启动没用到。loop() 调用 runTick('interval') 没传 todayOnly，导致每次启动即使有有效锚点也跑满三个扫描
- **根因:** loop() 中 runTick 未传递 todayOnly 参数，anchored 始终为 false
- **决策:** loop() 中检测 anchor 有效性，有有效锚点时传 todayOnly: true
- **影响范围:** 后续启动速度（90s → 30s，与预期一致）

## 2026-06-18 04:30: 目录时间戳缓存 — 文件未变时完全跳过 tokscale
- **文件:**
  - `src/shared/collector.js`
- **原因:** 即使锚点有效，每次启动仍需跑一次 `--today` 扫描（~30s），因为 78k+ 消息的扫描无法跳过
- **决策:**
  - 新增 `collectDirTimestamps()` 收集所有客户端数据目录的 mtime
  - 新增 `timestampsEqual()` 比较时间戳是否变化
  - 全量扫描后将目录时间戳存入 `collector-dirts.json`
  - 启动时对比当前时间戳与缓存，无变化则直接复用锚点数据（跳过 tokscale）
  - 同步跳过 `maybeSyncCursor`/`maybeSyncAntigravity`（避免写入缓存文件导致下次失效）
  - 锚点路径也增加了 `onProgress` 回调，加载中有反馈
- **影响范围:** 启动速度（无文件变化时 30s → 0s，对话中首次扫描后重启立即可见数据）

## 2026-06-18 11:30: 修复 skipTokenscan 路径缺少 onProgress 导致用户看不到数据
- **文件:**
  - `src/shared/collector.js`
- **原因:** 目录时间戳缓存命中时，skipTokenscan 路径直接从锚点取数据，但没有触发 onProgress，用户要等 history/limits 都收集完才能看到数据（额外 30s+）
- **根因:** skipTokenscan 路径只设了 today/month/allTime 变量就结束了，onProgress 只存在于 tokscale 扫描路径
- **决策:** skipTokenscan 拿到锚点数据后立即触发 onProgress，与全量扫描/锚点扫描路径行为一致
- **影响范围:** 缓存命中时的启动体验（数据即时可见）

## 2026-06-18 12:00: 修复空锚点导致 skipTokenscan 永远返回 0 数据
- **文件:**
  - `src/shared/collector.js`
- **原因:** 某次全量扫描返回了 0 数据，空锚点被保存后，目录时间戳匹配导致每次启动都走 skipTokenscan 路径，永远返回 0 数据，用户永远看不到数据
- **根因:** skipTokenscan 只检查锚点存在性和 dateKey，不验证锚点是否包含有效数据
- **决策:** 新增 `anchorHasData` 检查 (`today/month/allTime.totalTokens > 0`)，空锚点时走锚点扫描路径重新采集
- **影响范围:** 启动数据展示（空锚点恢复为正常扫描）
