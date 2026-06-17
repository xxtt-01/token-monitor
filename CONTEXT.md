# Token Monitor Context

Electron 桌面应用，追踪 13+ 款 AI 开发工具的 Token 消耗和限额。

## Glossary

### 账号（Account）
一套独立的登录凭据，用于认证一个 AI 工具的服务端。每个账号包含该工具所需的认证信息（如 cookie、API key、token）。一个用户可以拥有同一个工具的多个账号。

### 用户（User）
使用 Token Monitor 应用的实体（自然人）。与"账号"不同，一个用户可以有多个账号。"用户"概念在本文中不涉及登录认证——Token Monitor 是本地桌面应用，没有用户系统。

### Profile
单个账号的完整配置快照。对于 OpenCode，一个 Profile 包含一条 cookie 和一个启用/禁用开关。

### 多账号显示（Multi-Account Display）
所有已启用的账号**同时显示**各自的限额和余额，用户无需切换。每个账号在 UI 中作为独立的条目渲染（如 `opencode:work`、`opencode:personal`）。

### 本地用量（Local Usage）
从本地 SQLite 数据库（`opencode.db`）读取的 token 历史消耗。所有账号的用量数据写入同一个数据库，无法按账号拆分，仅显示总和。

### 服务端限额（Server-Side Limits）
通过 opencode.ai 的 HTTP API 获取的限额数据（Go 使用率百分比 + Zen 订阅余额）。每个账号使用各自的 cookie 独立查询。

### 启用/禁用开关（Toggle）
每个账号的独立开关。关闭后，该账号的 cookie 不会被用于查询服务端限额，且在 UI 中隐藏。

### 传统模式（Legacy Mode）
单 cookie 工作方式：通过 `TOKEN_MONITOR_OPENCODE_COOKIE` 环境变量设置单一 cookie，不使用多账号管理功能。此模式在界面中添加后缀 `(env)` 标识以区分。

### Provider
Token Monitor 中的限额头采集单元。每个工具可有一个或多个 Provider。多账号场景下，每个账号作为**独立的 Provider** 注册（如 `opencode:work`、`opencode:personal`），各自独立采集、缓存。
