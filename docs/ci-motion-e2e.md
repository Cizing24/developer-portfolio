# 動畫 E2E 的 CI 穩定性修正

## 失敗證據與原因判讀

原始 [Actions run 39984535393](https://github.com/Cizing24/developer-portfolio/actions/runs/39984535393) 在 `026976c` 回報 94 passed、2 failed。Desktop 在暫停按鈕的 actionability 等待耗盡 60 秒；Tablet 的狀態確認／Canvas 截圖也耗盡同一份測試預算。重試未解決問題，手機動畫案例亦花了 58.5 秒。

`studio.ts` 的 click handler 同步更新 `aria-pressed`、`data-ambient`，再呼叫 `scene.setMotion()`。`studio-scene.ts` 持續以 requestAnimationFrame 排程動畫，約 30 次／秒更新人物、鳥、船與水；暫停只取消後續排程，不重置或重繪場景。`studio.css` 有首次 Canvas 淡入，但沒有令暫停按鈕持續位移的樣式。

已證實的是測試時間預算耗盡，而非 handler 拋錯；原始紀錄也沒有元素遮擋的證據。兩個 WebGL 場景、截圖合成／PNG 編碼與 Playwright 等待可能在 CI 競爭 CPU／GPU 資源，這是依程式與紀錄做出的推論；沒有取得原始 runner 的 CPU／GPU profiling，不能斷言是哪個資源先飽和。

## 修正與驗證邊界

- 新增獨立的真實滑鼠暫停／恢復測試，保留 Playwright 可操作性檢查，並確認兩種狀態屬性。
- 動畫像素測試用 `dispatchEvent('click')` 呼叫原有 handler，每次均確認 `aria-pressed` 與 `data-ambient`。
- 四張完整 Canvas 截圖改為三張頁面中央裁切截圖，最大 640×480 CSS pixels，排除頁首與底部按鈕。減少輸出像素與編碼工作，並避免元素截圖額外的捲動／穩定性等待；不改變實際 Canvas 的解析度或渲染設定。
- 等待首次 Canvas 淡入結束，再擷取播放畫面。播放至少 600ms 後暫停，比對最後一幀與先前播放畫面不同；250ms 後再確認暫停畫面完全相同。由於暫停不重繪場景，第一組差異仍來自播放期間。三張實際截圖均附在 Playwright 報告。
- 從播放狀態切換 `prefers-reduced-motion: reduce`，確認按鈕停用、`aria-pressed=false`、場景暫停；還原偏好後確認恢復播放。

未修改正式網站、`playwright.config.ts` 或 workflow。維持兩個 worker、單項 60 秒（既有橫向切換測試仍為 120 秒）、CI 一次 retry 與 job 15 分鐘上限；沒有 skip、fixme 或弱化像素 assertion。

## 重現指令

先建置正式靜態產物，再執行不重試的穩定性檢查：

```sh
npm run build
npx playwright test e2e/studio.spec.ts --grep 'motion button|autonomous people' --repeat-each=3 --retries=0
npm run verify
```

第一組涵蓋 Desktop、Tablet、Mobile、Small mobile，每個尺寸的真實點擊及動畫像素測試各執行三次，共 24 項。`verify` 包含 lint、format check、Astro Check、typecheck、unit、內容、build、SEO 及完整 Playwright；新增點擊案例後，完整 E2E 為 100 項。

## 本機穩定性結果 · 2026-10-24

Windows／Playwright Chromium，兩個 worker，`--retries=0`：24 passed、0 failed、0 skipped、0 flaky，323.3 秒。Desktop、Tablet 的原失敗動畫案例每次耗時如下；同批真實滑鼠案例也各通過三次。

| 尺寸    |    第一次 |    第二次 |    第三次 |
| ------- | --------: | --------: | --------: |
| Desktop | 38.357 秒 | 31.908 秒 | 33.959 秒 |
| Tablet  | 29.985 秒 | 35.480 秒 | 29.354 秒 |

這是修正後的本機結果，不能單獨證明 Linux runner 的資源瓶頸；原失敗證據來自上述 Actions 紀錄。推送後應核對新 commit 的 Actions 結果，不能沿用舊版本的綠燈。
