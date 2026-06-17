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
