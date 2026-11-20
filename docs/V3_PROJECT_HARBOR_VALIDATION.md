# V3 Project Harbor 驗收紀錄

執行日期：2026-11-19 至 2026-11-20（Asia/Taipei）。Windows、Node 24.22.1、Playwright 1.64.1、Chromium。未部署 Production、未合併 main。

## 範圍與版本

以 PR #14 head `9f7b0a1` 為基準，含其已審核媒體與 Modern Web Guidance 快照。V3 實作 `c1e358d`，強化與安全修補 `ccc3145`。原工作目錄分支 `codex/local-web-guidance` 與全部未提交修改保留。

本輪保留地形與橋面佈局，將兩座作品專用建築換成通用展台與工程設施。固定七個功能地塊不隨作品數量增加，並非重新製作全部地形。Project Harbor 每頁三件；普通作品可省略 demoModule。

## 本機驗證

- Astro check：0 errors / warnings / hints。
- TypeScript、ESLint、Prettier、內容契約、正常41路由 build、20個語系頁面的 SEO fixture 通過。
- Vitest：66/66，包含庫存競爭的兩種先後順序、非法數量、付款重送及 payload 衝突、重複開券、退款／核銷順序、一次性庫存回補、帳冊不被處置覆寫、重跑差異。
- 第一輪完整四尺寸 Playwright：162/168 通過；4項完整案例連結被 reader 攔截、2項測試仍在選單開啟時點擊場景而失敗。已修正原生案例連結及測試的關閉選單步驟。
- 修正與 Astro patch 後，四尺寸受影響流程 28/28 通過，涵蓋三案操作、語系狀態、完整案例、dialog 導覽、lazy chunk 失敗後重試與 axe。
- 最後語系還原、核銷鍵盤焦點與載入重試另執行四尺寸12項測試通過。
- 一般作品 extension fixture：隔離43路由建置、雙語案例及 Harbor fallback 通過；scene 原始檔 bytes 不變。fixture 在 finally 清除，正常 dist 不含假作品。
- 375個已追蹤檔案（文件與證據提交前）公開掃描通過；另檢查新增原始檔與 staged secret-pattern，未加入來源產品私人程式碼、Seed 或設定。AssetFlow 的舊公開來源連結已從網站內容移除。
- npm audit：原 Astro 7.4.2 出現1個 moderate dependency 項目。更新至7.4.13後 0 vulnerabilities；未使用 audit fix --force。

## 效能取樣

同機 localhost、Reduced Motion、全新 Chromium page；每個尺寸各一次取樣。基準為 PR #14 的 Astro7.4.2；最終為安全更新後 Astro7.4.13。期間有其他驗證程序，因此時間不可作為嚴格效能因果比較。

| 指標                         |   基準 | V3 最終 |
| ---------------------------- | -----: | ------: |
| 全部建置 JS（未壓縮 bytes）  | 668483 |  678498 |
| 首頁 resource transfer bytes | 190053 |  188542 |
| 首頁 request 數（含文件）    |      6 |       6 |
| 1440px 3D ready（ms）        |   2622 |    2082 |
| 390px 3D ready（ms）         |   2426 |    1587 |

沒有宣稱速度提升。總 JS 包含新增但延後載入的 TravelOps、BookFlow、AssetFlow 模組；初始頁不下載互動控制器。直接 `?view=projects` 閱讀不下載場景，已由 E2E 網路斷言驗證。展館只下載封面，不載入完整 TravelOps 媒體；影片仍由案例頁 controls 手動播放。

原始 JSON 及兩尺寸場景截圖位於 `docs/evidence/v3-project-harbor/`。重現：`npm run build`、`npm run preview`，再執行 `node scripts/measure-harbor.mjs`。瀏覽器安裝路徑由 PLAYWRIGHT_BROWSERS_PATH 或既有 Playwright 安裝決定。結果輸出至 `.local/harbor-measurements/`，不覆寫歷史證據。

## 人工驗收

1. 首頁立即點「查看作品」，確認不需理解 3D 就能找到三案；切 Featured／其他作品。
2. Project Harbor 點三個展台、閱讀完整案例；用鍵盤與手機觸控操作。
3. TravelOps 重設最後一張票，Online 先買，再用 POS 競爭；反向順序重跑。
4. 付款後重送相同通知、不同金額，確認庫存及權益沒有重複建立。
5. 開券後核銷再退款；另重設並先核准退款再核銷、確認退款，檢查限制與庫存回補。
6. 對帳後新增處置原因、重跑，核對原交易金額不變。
7. 三案使用 Reset；切語言、上一頁、下一頁、Escape，檢查同頁暫態狀態與焦點。
8. 切四時段、暫停動態；停用 WebGL 或 JavaScript 仍能閱讀。

## 邊界與限制

未驗證手機實機、Safari／Firefox、人工讀屏、真實金流／掃碼、來源產品後端測試、正式負載與 CDN。自動 axe 不等於完整 WCAG 合規。

前端模型依序執行，不證明資料庫 Transaction、Row Lock、Queue 或跨系統 exactly-once。庫存預留沒有付款逾時釋放情境；展示以 Reset 重新開始。TravelOps 語系交接最多重播500筆本機操作；一般重新載入會重設，不是持久化服務。

遠端 CI 與 Preview 需以 PR 當次檢查為準，本機結果不代替它們。
