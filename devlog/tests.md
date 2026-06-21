## 2026-06-21 14:00: 为渐进推送添加测试
- **文件:**
  - `tests/shared/collectorProgressiveLoading.test.js`
- **原因:** 新增渐进推送功能需要测试覆盖
- **测试覆盖:**
  - 完整扫描时 onProgress 在 today 和 month 阶段各触发一次
  - 部分数据不含 history/limits key
  - 锚点 tick 不触发 onProgress
