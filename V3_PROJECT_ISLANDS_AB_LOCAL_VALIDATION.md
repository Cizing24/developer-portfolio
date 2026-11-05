# Developer Portfolio V3 專案島 A＋B 本機交付報告

2026-11-05，臺灣時間。開發基準為 `portfolio/integrated-island-navigation` 的 `300caf6`，以及工作樹中上一輪尚未提交的 V3 成果。

## 交付狀態

| 工作項目                   | 狀態     | 交付內容                                                                                                                                           |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| A．兩座 3D 展示島          | 完成     | BookFlow 的預約櫃台、行事曆工作站與伺服器櫃，以及 AssetFlow 的設備架、領還櫃台與監控系統室。島名沿用原相機聚焦，點擊設施或標籤直接開啟展示。       |
| B．共用閱覽室              | 完成     | 操作展示、系統架構、工程證據共用版型與網址機制。架構用可展開的三層流程呈現，節點附對應版本的原始碼。保留原本的 MDX 完整案例與 Engineering Lab。    |
| C．BookFlow 顧客與店家流程 | 完成     | 顧客可選服務、日期、人員及時段，觀察空檔、成功、已預約、重送衝突與重設。店家端有實際行事曆畫面，依工作時間、休假例外和預約管理分三步導覽。         |
| C．AssetFlow 設備生命週期  | 完成     | 清冊可搜尋及依狀態篩選。交接可操作領用、正常歸還和故障歸還，並查看持有人、交接阻擋條件、示意稽核事件及重設。                                       |
| B／C．產品媒體             | 替代完成 | 採四張來源專案既有的實際產品截圖與互動模擬。截圖使用合成測試資料，流程狀態另標示為前端模擬。未取得可公開的原始操作錄影。                           |
| D．3D 與 HTML 效能分工     | 完成     | 六個簡化碰撞代理和場景既有材質合批。高亮接現有繪製排程，開啟閱覽室時暫停背景場景。圖片維持尺寸、延遲載入，並備有載入失敗提示。                     |
| E．導覽與可存取性          | 完成     | 中英文、右選單與設施使用相同入口。舊 `purpose`、`features` 對應操作內容，`architecture` 仍可直接開啟。完整案例維持獨立頁，供無 JavaScript 時閱讀。 |
| Skills                     | 完成     | 使用既有 Impeccable、Graphify、Git 工作流程與 Playwright。Chrome DevTools MCP 未配置，以 Playwright 直接執行 Chromium 驗收。                       |

## 主要實作

- `src/lib/world-config.ts`、`studio-scene.ts`、`world-map.ts` 共用設施位置與入口。模型保留原地形、橋、人物、船隻及照明架構。
- `src/components/StudioReader.astro`、`ProjectShowcase.astro`、`ProjectDemo.astro` 與 `src/lib/studio-reader.ts` 共用原生對話框、歷史紀錄及焦點還原。完整案例有獨立的 reader view。
- `src/lib/showcase-simulations.ts` 儲存頁面記憶體中的示範狀態，`studio-showcase.ts` 接上介面，`project-showcase.ts` 定義雙語架構與證據分類。

## 素材與證據

- **BookFlow** 使用 `docs/images/public-booking.png`、`docs/images/calendar-chromium.png`。查核版包含預約表單、伺服器重新驗證、租戶範圍權限與 PostgreSQL 排程約束。公開 CI 頁的該提交狀態為 Success。 [查核提交](https://github.com/Cizing24/bookflow-saas/commit/4c913361edab42f4be2ac4a8dc28eef942947824) · [歷史 CI](https://github.com/Cizing24/bookflow-saas/actions/runs/39655913415)
- **AssetFlow** 使用 `docs/screenshots/assets.png`、`docs/screenshots/offboarding.png`。查核版包含領還與交接交易、故障維修和稽核邏輯。公開 CI 頁的該提交狀態為 Success。 [查核提交](https://github.com/Cizing24/assetflow-itam/commit/7a698fbcd8bbffb4e46ec434a310690973aab77a) · [歷史 CI](https://github.com/Cizing24/assetflow-itam/actions/runs/39593727102)
- 以 SHA-256 比對作品集原始素材與來源截圖，四張皆相同。來源版本與實作範圍沿用 MDX 記錄，CI 為來源版本的歷史證據。兩案的產品資料庫與寄信未接入作品集。
- UI UX Pro Max 與 Review UI Design 的用途與本次沿用的設計檢查重疊。Oil Motion 可在本機處理既有影片，AI 生成則需第三方 API，本次採靜態來源與原生互動。無額外 Skills 或套件安裝。 [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · [Review UI Design](https://github.com/ColourCloudSky/review-ui-design-skill) · [Oil Motion](https://github.com/oil-oil/oil-motion)

## 驗收

- `npm.cmd run lint`、`npm.cmd run format:check`、`npm.cmd run check`、`npm.cmd run typecheck`、`git diff --check` 通過。Astro 診斷為 0 錯誤、0 警告。
- `npm.cmd test` 通過 5 個檔案、55 項測試，包含兩個模擬的成功、拒絕與重設，以及舊入口對應測試。`npm.cmd run test:content`、`npm.cmd run test:seo` 通過。
- `npm.cmd run build` 產出 38 頁。Vite 仍提示延遲載入的 Three.js 場景檔大於 500 kB。
- Playwright 桌機與手機各執行 5 項代表情境，10 項通過。涵蓋實際點擊桌機 3D 櫃台、手機觸控標籤、預約與交接狀態、舊／新連結、右選單、Back／Forward、Escape／焦點、語系、Reduced Motion、WebGL 備援、無 JavaScript 與 Engineering Lab。另執行單指／雙指旋轉及閱覽室捲動，1 項通過。
- 手機交接表單改為單欄，避免英文下拉文字截斷。重建後定點重跑 AssetFlow 手機流程，1 項通過。該流程與 WebGL 備援的 axe 掃描未回報違規。
- 此次環境的預設預覽埠未能完成 Playwright 啟動，改用本機既有 Chrome、SwiftShader 與 Playwright 請求攔截讀取 `dist`。以 `npm.cmd run test:e2e -- --config .local/project-islands-files.config.ts --project desktop --project mobile --workers 1 --grep 'BookFlow facility|AssetFlow inventory|project case pages|WebGL fallback|direct portal shortcuts' --reporter list --output .local/v3-islands-ab` 執行。手勢及修正重測只更換篩選條件和輸出目錄。
- 代表截圖存於 `.local`。 [BookFlow 島](.local/v3-islands-ab/project-showcase-BookFlow--63dd8-ves-history-across-sections-desktop/bookflow-island.png) · [AssetFlow 島](.local/v3-islands-ab/project-showcase-AssetFlow-bd177-he-same-state-and-audit-log-desktop/assetflow-island.png) · [修正後的手機交接表單](.local/v3-islands-mobile/project-showcase-AssetFlow-bd177-he-same-state-and-audit-log-mobile/assetflow-handover.png)

## 本機試用

本次使用 Node.js 24.22.1。從外層工作目錄啟動，依賴已安裝時只需以下指令。乾淨環境先在儲存庫根目錄執行 `npm.cmd ci`。

```powershell
Set-Location .\developer-portfolio
npm.cmd run dev
```

預設網址為 `http://127.0.0.1:4321/`。若連接埠被占用，以 Astro 主控台顯示的網址為準。

- [BookFlow 預約櫃台](http://127.0.0.1:4321/zh-tw/?island=bookflow&view=project-bookflow)
- [AssetFlow 領還交接](http://127.0.0.1:4321/zh-tw/?island=assetflow&view=project-assetflow-handover)
- [英文群島](http://127.0.0.1:4321/en/)

## 工作樹與未驗證範圍

`portfolio/integrated-island-navigation` 維持在 `300caf6`。工作樹包含既有 V3 與本次增量的未提交變更。交付限本機，未部署、未推送、未建立 PR。

前端模擬使用固定排班與暫態設備事件。真實後端交易、通知及完整離職流程由來源系統實作，本次未重跑兩案的後端測試。實機 GPU FPS、手機實機、WebKit／Firefox 與 Lighthouse 未測。
