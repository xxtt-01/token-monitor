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

## 2026-06-18 18:00: 优化目录时间戳缓存 — 排除自同步客户端目录
- **文件:**
  - `src/shared/collector.js`
- **原因:** `collectDirTimestamps` 收集所有客户端目录 mtime，包括 cursor/antigravity 的自同步缓存目录。这些目录在每次 `maybeSyncCursor` 运行后改变，导致下次启动时 `dirsMatch` 为 false，即使其他客户端数据无变化也触发全量扫描
- **决策:** 遍历时跳过 `SELF_SYNCED_CLIENTS`（cursor/antigravity），避免它们干扰 tokscale 跳过判断
- **影响范围:** 启动扫描路径（dirTimestamps 缓存）

## 2026-06-18 20:00: 修复锚点 tick 后 dirTimestamps 不更新 + sync 被 skip 跳过
- **文件:**
  - `src/shared/collector.js`
- **原因/根因:**
  - **Issue A：** `savedDirTimestamps` 只在全量扫描后更新。锚点 tick 完成后时间戳快照仍为旧值，一旦目录有变化，`dirsMatch` 在所有后续 tick 中永远为 false，缓存优化完全失效
  - **Issue B：** `maybeSyncCursor`/`maybeSyncAntigravity` 写在 `if (skipTokenscan)` 的 else 分支内。skip 路径下 sync 完全跳过，且 `SELF_SYNCED_CLIENTS` 已被排除在 `collectDirTimestamps` 外，目录不会变化，sync 永远无法恢复
- **修复:**
  - **A：** 锚点 tick 且 `!dirsMatch` 且数据有效时，更新 `savedDirTimestamps` 到新基线，后续 tick 可重新跳过
  - **B：** 将 sync 移到 `skipTokenscan` 判断之前，始终执行（`syncDue` 内部 5 分钟限速）

## 2026-06-18 19:00: 批量修复审查发现的三大模块问题
- **文件:**
  - `src/shared/usage.js`
  - `src/electron/renderer/index.html`
  - `src/electron/main.js`
  - `src/electron/renderer/app.js`
  - `src/electron/renderer/styles.css`
  - `src/shared/limitCollector.js`
- **修复清单:**
  - **Go 公式去掉 `cacheRead > 0` 限制：** cacheRead=0 时也走 Go 定价，退化公式为 input×输入价 + output×输出价
  - **定价表加来源注释：** URL + 更新日期 + 提示通过 Custom pricing 覆盖
  - **Go 复选框移到 Window 设置：** 从 OpenCode 面板移到 Custom Pricing 区域，语义更准确
  - **移除 CSS `::after` 双发光：** 保留 JS edge-glow div 唯一实现
  - **`move` 事件加 `edgeAnimating` 守卫 + 恢复 resize：** 拖离边缘时 `setResizable(true)`
  - **`edgeDock:state` 加 `enabled` 字段：** 渲染器可区分"禁用"和"启用未吸附"
  - **光效改用 CSS animation：** 替换 JS setInterval，无 transition 断裂问题
  - **OpenCode profile fetch 超时：** 15s `Promise.race` 超时，超时返回 unavailable
  - **`renameProfile` 重名检测：** 新名称已存在时返回错误
- **误报排除（代码已正确）：**
  - `isConfiguredProvider` — `provider.status` 写法正确
  - profile 保存失败清空表单 — 重置在 success 分支内，失败保留输入
  - contenteditable Enter/Escape — 已有 `keydown` 事件绑定

## 2026-06-18 13:00: 新增 Go 套餐计费公式开关
- **文件:**
  - `src/shared/usage.js`
  - `src/shared/collector.js`
  - `src/electron/main.js`
  - `src/electron/renderer/index.html`
  - `src/electron/renderer/app.js`
- **原因:** tokscale 的 cost 公式（input × 输入价 + cacheRead × 缓存价）不适合 DeepSeek/Go 套餐的"从 input 中减去 cacheRead 再分别计价"的规则，导致显示花费虚高 26 倍
- **决策:**
  - 新增 `GO_PLAN_PRICING` 内置定价表（16 个 Go 套餐模型）
  - `extractUsageFromTokscale` 增加 `goPlanFormula` 参数，启用时用公式 `(input - cacheRead) × 输入价 + output × 输出价 + cacheRead × 缓存价` 替代 tokscale 的 cost
  - 添加 `goPlanFormula` 设置开关（默认关闭），位于 OpenCode 设置面板
  - 开关只影响在定价表中的模型，其他模型不受影响
- **影响范围:** 主面板花费显示（启用后正确反映 Go 套餐等值消耗）

## 2026-06-18 13:30: 修复切换 Go 套餐开关后需要重启才能生效的问题
- **文件:**
  - `src/electron/main.js`
- **原因:** `goPlanFormula` 在 collector 初始化时捕获到闭包中，切换开关后只保存了设置但没重启 collector，导致刷新按钮仍用旧值
- **根因:** 设置变更检测列表中没有 `goPlanFormula`
- **决策:** settings:update handler 中新增 `previousGoPlanFormula` 追踪，检测到变化时自动调用 `startMode()` 重启 collector
- **影响范围:** Go 套餐开关即时生效（无需重启应用）

## 2026-06-18 14:00: 修复客户端/模型 token 重复计数 cacheRead + OpenCode 额度显示改为已用百分比
- **文件:**
  - `src/shared/usage.js`
  - `src/electron/renderer/app.js`
- **原因:**
  - 工具维度下 totalTokens=5.7亿 但 claude=11.4亿，因为 `tokenValue(row)` 对 cacheRead 重复计数（input 已含 cacheRead），而 `totalTokens` 已用 `input+output` 修正了
  - OpenCode 额度显示"还剩 XX%"，用户希望看"已用 XX%"
- **根因:** `period.clients`/`period.models` 仍用 `tokenValue(row)`（含重复 cacheRead），未同步使用修正后的 `adjustedTokens`
- **决策:**
  - 客户端/模型拆分改用 `adjustedTokens`（与 `totalTokens` 一致），消除 2x 重复
  - `limitWindowNode` 增加 `showRemaining` 参数（默认 true），OpenCode 窗口传 false 显示已用百分比和对应进度条
- **影响范围:** 工具维度 token 数据一致性、OpenCode 额度显示方式

## 2026-06-18 14:30: 新增贴边隐藏功能（类似QQ）
- **文件:**
  - `src/electron/main.js`
  - `src/electron/renderer/index.html`
  - `src/electron/renderer/app.js`
- **原因:** 需要窗口拖到屏幕边缘自动隐藏，鼠标移上滑出的功能，类似 QQ 贴边
- **决策:**
  - 新增 `edgeDockState` 管理贴边状态 + EDGE_DOCK_* 常量控制参数（隐藏后露 5px、触发吸附 50px、悬停 20px）
  - `edgeDockDo(side)` 将窗口定位到左右边缘，仅露 stripPx
  - `edgeDockSlideTo(targetX)` 12 步动画丝滑滑入/滑出
  - `startEdgeDockMonitor()` 40ms 轮询鼠标位置，悬停展开、离开 600ms 后隐藏
  - 设置项 `edgeDock`（默认关闭），位于 Window 设置面板
  - 窗口移动结束后自动检测是否靠近边缘，靠近则吸附
- **影响范围:** 窗口交互行为（仅开启时生效）

## 2026-06-18 15:00: 修复贴边隐藏的无限吸附/解除循环 + 中文化选项
- **文件:**
  - `src/electron/main.js`
  - `src/electron/renderer/index.html`
- **原因:** edgeDockDo 调用 setBounds 触发 moved 事件 → persistBoundsSoon → edgeDockAfterMove → undock → edgeDockCheck → 再次 dock → 无限循环。且 expandedBounds 被清空导致悬停展开失效
- **根因:** setBounds 触发的 moved 事件无法与用户拖拽区分，导致 dock/undock 循环
- **决策:** 
  - 新增 `edgeDockSuppressCheck` 标志，setBounds 前设为 true，200ms 后清除
  - 动画过程中也设置该标志
  - 选项改为中文"贴边隐藏 — 拖到屏幕边缘自动吸附隐藏"
- **影响范围:** 贴边隐藏功能稳定性

## 2026-06-18 16:00: 重写贴边隐藏 — 去掉微任务抑制，改用状态守卫
- **文件:**
  - `src/electron/main.js`
- **原因:** 贴边隐藏功能仍不稳定（窗口缩在边缘无法唤出），微任务抑制机制（`edgeSuppress`）过于复杂且不可靠
- **根因:** `edgeSuppress` 用 `Promise.resolve().then(setTimeout(clear, 0))` 尝试区分 `setBounds` 触发的 `moved` 事件和用户拖拽，但时序不可控
- **决策:**
  - 参考开源实现改造：
    - `nashaofu/electron-demo`（最完整 QQ 风格实现）
    - `lx-music-desktop`（成熟方案，300ms 轮询）
  - 去掉 `edgeSuppress` 微任务抑制机制
  - 改用状态守卫：动画中忽略、在已知位置忽略、位置异常才退出
  - 轮询间隔从 40ms 降到 150ms
  - 动画从线性插值改为 easeInOutQuad 缓动曲线
  - 动画步数从 12 降到 8，总时长 60ms
  - 删除了 `edgeExpand`/`edgeCollapse`/`edgeSlide`(旧) 等冗余辅助函数
  - 统一用 `edgeSlide(from, to)` 处理双向动画
- **影响范围:** 贴边隐藏功能全部重写（main.js 约 200 行）

## 2026-06-18 16:30: 修复展开态隐藏判定 — 窗口内操作不再触发自动隐藏
- **文件:**
  - `src/electron/main.js`
- **原因:** 窗口展开后用户无法操作内容，鼠标移入窗口即触发隐藏倒计时
- **根因:** 展开态时仍用"屏幕边缘热区"检测鼠标位置（`hover`），而非"窗口范围"。用户鼠标一离开边缘进入窗口内容区域，`hover` 变 false，600ms 后窗口缩回
- **决策:**
  - 贴边态（`atDock`）：继续使用屏幕边缘热区检测（鼠标靠近边缘 → 展开）
  - 展开态（`atExpand`）：改用窗口范围检测（鼠标在窗口上 → 保持，离开窗口 → 开始倒计时）
  - 这样用户可以在展开的窗口中自由操作，离开窗口才自动隐藏
- **影响范围:** 贴边隐藏监控逻辑（edgeStartMonitor）

## 2026-06-18 17:00: 修复贴边隐藏多处 bug（启动无法展开 + 动画残留 + 关闭贴边时窗口跑位）
- **文件:**
  - `src/electron/main.js`
- **原因/根因:** 三个独立 bug：
  1. **启动无法展开：** `startEdgeDock` 用 `edgeDetectSide()` 检测贴边窗口，但贴边后窗口坐标在屏幕外数百像素（x=-1195），50px 阈值永远无法命中。且即使命中了，`expandBounds` 被设为与 `dockBounds` 相同的贴边坐标，导致 `edgeSlide` 检测 `from === to` 直接返回
  2. **动画残留：** `edgeUndo()` 没清理 `edgeAnimTimer`，关闭贴边或拖离时动画继续跑，窗口跑到错误位置
  3. **expandBounds 不准：** `edgeDo` 直接存 `mainWindow.getBounds()`，启动时窗口已在贴边位置，存的是贴边坐标
- **决策:**
  - `startEdgeDock` 不依赖 `edgeDetectSide()`，改直接检测窗口可见 strip 位置（`b.x + b.width` 等）
  - `edgeDo(side, presetExpand?)` 增加可选参数，启动时传入正确的展开坐标
  - `edgeUndo()` 清理 `edgeAnimTimer` + 重置 `edgeAnimating`
- **影响范围:** 启动流程、贴边解除流程、退出贴边清理

## 2026-06-18 17:30: 修复三类贴边隐藏问题（分屏干扰 + 展开不全 + 光效增强）
- **文件:**
  - `src/electron/main.js`
  - `src/electron/renderer/styles.css`
- **原因/决策:**
  1. **Windows 分屏干扰（Aero Snap）：** 拖到边缘时 Windows 分屏布局覆盖，窗口变成半屏。在 `move` 事件中检测边缘临近后立即 `setResizable(false)` 阻止 Snap，`edgeDo` 中确认禁用，`edgeUndo` 和动画完成后恢复
  2. **展开不全：** 用户拖到边缘触发吸附时 `expandBounds` 直接沿用拖拽释放位置（可能离边缘还有几像素~几十像素），展开后部分窗口仍在屏幕外。`edgeDo` 计算 `expandBounds` 时修正到与 `workArea` 边缘齐平（左贴边 `x: wa.x`，右贴边 `x: wa.x + wa.width - b.width`）
  3. **光效不显示：** 两层原因：① `sendEdgeDockState` 在渲染进程监听器就绪前调用，body 类名从未加上；② `body::after` 与 shell 的层叠上下文交互可能被遮挡
- **决策:**
  - `did-finish-load` 时重新 `sendEdgeDockState()`，确保渲染进程监听器就绪
  - 改为 JS 直接创建 `<div id="edge-glow">` DOM 元素，完全绕过 CSS `::after` 层叠问题
  - 元素使用 `position:fixed` + 高 `z-index` + `box-shadow` 外发光 + 呼吸动画
- **影响范围:** 贴边隐藏功能
