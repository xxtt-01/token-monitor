# English

**Open-source build, not paid-signed.** macOS and Windows will ask you to confirm on first launch — instructions below.

## What's changed

### Added
- Added cross-device usage Trends and a new Usage Dashboard window. This feature is off by default: go to **Settings → Main Screen** and enable **Show Trends** to use it. Once enabled, click the chart in the middle of the Trends view to open the dashboard. The dashboard features a token activity heatmap and allows switching between bar charts and K-line charts to track usage across multiple machines.
- Added a new toggle to opt-in to usage trend history collection.

### Improved
- Preserved the Settings panel scroll position when saving.

### Fixed
- Fixed visual corner rendering artifacts on Windows (now using a unified 8px radius) and on older macOS versions with vibrancy effects.

## Which file should I download?

- **macOS (Apple Silicon, M1 and later)** — the `.dmg` file
- **Windows 10/11** — `Token Monitor Setup ….exe` (installer, recommended)
- **Windows portable** — `Token Monitor ….exe` (runs without installing)

Intel Macs and Linux are not pre-built — run from source per the [README](https://github.com/Javis603/token-monitor#readme). The macOS `.zip` is the same app repackaged; ignore it unless you specifically need it.

## First-launch unlock

**macOS:** right-click `Token Monitor.app` → Open (once). If you see "Token Monitor" can't be opened or is damaged:

```bash
xattr -dr com.apple.quarantine "/Applications/Token Monitor.app"
```

**Windows:** SmartScreen → More info → Run anyway.

## tokscale dependency

Tokscale is bundled with this app. See **Settings → Tokscale** for the exact version
and the option to download a newer version directly from npm. Tokscale is MIT,
open-source: https://github.com/junhoyeo/tokscale

---

# 中文

**这是开源构建，不是付费签名版本。** macOS 和 Windows 首次启动时会要求你手动确认，操作说明见下方。

## 更新内容

### 新增
- 新增跨设备「趋势」视图与全新「使用仪表板」窗口。此功能默认关闭：请前往 **设置 → 主界面**，开启 **显示 趋势** 即可使用。启用后，点击趋势视图中间的图表即可打开仪表板。仪表板内包含 Token 活动热力图，并支持在柱状图与 K 线图之间切换，以便追踪多台机器的活动。
- 新增趋势历史记录采集的自愿开启（opt-in）开关。

### 改进
- 保存设置时，现在会保留设置面板的滚动位置。

### 修复
- 修复 Windows（现统一为 8px 圆角）与开启 Vibrancy 效果的旧版 macOS 上，窗口角落的渲染瑕疵。

## 应该下载哪个文件？

- **macOS（苹果芯片，M1 及之后机型）** — 下载 `.dmg` 安装包
- **Windows 10/11** — 下载 `Token Monitor Setup ….exe`（安装版，推荐）
- **Windows 便携版** — 下载 `Token Monitor ….exe`（无需安装，直接运行）

Intel Mac 和 Linux 暂不提供预构建版本，请参考 [README](https://github.com/Javis603/token-monitor#readme) 从源码运行。macOS 的 `.zip` 只是同一个 app 的重新打包版本，除非你明确需要，否则可以忽略。

## 首次启动放行

**macOS：** 右键 `Token Monitor.app` → 打开（只需要一次）。如果看到「Token Monitor」未开启 或 已损坏：

```bash
xattr -dr com.apple.quarantine "/Applications/Token Monitor.app"
```

**Windows：** SmartScreen → 更多信息 → 仍要运行。

## tokscale 依赖

Tokscale 已随应用内置。你可以在 **设置 → Tokscale** 查看确切版本，
也可以直接从 npm 下载更新版本。Tokscale 是 MIT 开源项目：
https://github.com/junhoyeo/tokscale
