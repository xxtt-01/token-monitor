## 2026-06-21 14:00: 实现渐进推送 onProgress 回调
- **文件:**
  - `src/shared/collector.js`
- **原因:** PR #23 审查反馈 — 需要将渐进推送拆分为独立 PR，并修复 null key 问题
- **决策:**
  - 在完整扫描路径（3 次 tokscale 调用）中，每次 period 完成后通过 `onProgress` 推送中间结果
  - 部分摘要中**省略** `history` 和 `limits` key（而非设为 null），让 `carryDeviceHistory` 正常延续前值
  - 锚点 tick（watch 触发）不触发 onProgress，因为单次 --today 扫描已经很快
- **影响范围:** `src/shared/collector.js` — `collectUsageOnce` 新增 onProgress 调用点，`performTick` 新增 onProgress handler
