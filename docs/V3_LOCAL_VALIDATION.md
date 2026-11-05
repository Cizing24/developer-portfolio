# Developer Portfolio V3 本機交付報告

2026-11-05，臺灣時間。工作目錄為 `developer-portfolio`，起始工作樹乾淨，分支為 `portfolio/integrated-island-navigation`（`300caf6`）。

| 工作包             | 結果     | 本機交付                                                                                                                                                                                                                                         |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A 載入與備援       | 完成     | 使用輕量向量圖與雙語狀態文字，首頁可立即閱讀作品。首次 WebGL 繪製後淡出。載入模組失敗、逾時、WebGL 不可用或 context loss 時提供備援與重試。                                                                                                      |
| B 流暢度與效能     | 部分完成 | 模擬採固定 30 Hz 步長並插值，攝影機、時段與環境共用繪製請求。島名寬度由 ResizeObserver 維護，視角變化才投影標籤。尋路圖依直式與橫式配置快取，橋梁依材質合批。軟體 WebGL 測到較少繪圖提交與標籤尺寸讀取，幀時間結果不一致。實機 60 FPS 尚未驗證。 |
| C 接地、動作與陰影 | 完成     | 橋面坡道與尋路共用高度。步態由實際移動距離推進，分開計算支撐腳與擺動腳。島面及橋面承接接觸陰影與日照投影，近處用人體輪廓近似，入夜淡出日照投影。船有隨水面的接觸陰影。已驗證跨橋、抵港、四時段與動態暫停。                                       |
| D Low-poly 角色    | 完成     | NPC 有多種髮色、膚色與服裝，近景有鞋子及程序式步態。CIZING 保留眼鏡、背包與深色上衣。遠景人物由共用的 InstancedMesh 繪製。                                                                                                                       |
| E 島嶼導覽         | 完成     | 點擊作品集與 CIZING 島體、島名或右選單即可閱讀。保留專案島探索、聯絡直達、在隆昌及尋找角色。右選單移除重複的作品總覽捷徑。                                                                                                                       |
| F 專案展示         | 替代完成 | 兩案以既有公開實際截圖和操作步驟說明流程，並整理架構、工程決策、本機重現與版本證據。未取得可公開的原始操作錄影，`ProjectWorkflow.astro` 保留可更新的媒體區。                                                                                     |
| G Engineering Lab  | 完成     | 群島與獨立筆記頁共用同一套分類、關鍵字、標籤、數量及空狀態。保留六篇雙語筆記，收錄 AI 協作、技術證據、來源連結及 BookFlow 併發流程模擬。                                                                                                         |
| H Skills 與驗收    | 完成     | 使用已安裝的 Impeccable、Graphify 與 Agent Skills 工作流程。完成本機建置、靜態檢查及代表性瀏覽器驗收。                                                                                                                                           |

## 主要檔案

- `EngineeringStudio.astro`、`studio.ts` 與 `studio.css` 管理載入、備援、選單、場景可見性及鍵盤入口。
- `world-config.ts` 集中定義島嶼的閱讀捷徑與探索項目。 `studio-reader.ts` 將閱讀歷史和相機狀態分開，保留舊網址、語系、關閉及焦點回復。
- `studio-scene.ts`、`world-map.ts` 與 `studio-shadows.ts` 負責共用橋面、場景節奏、模型簡化與光影。角色投影使用共用的實例化幾何和接地高度貼圖，靜態景物沿用方向光陰影。
- `EngineeringLab.astro`、`StudioReader.astro`、`ProjectWorkflow.astro` 與雙語 MDX 負責案例與筆記內容。 `tests/navigation.test.ts` 覆蓋兩種配置的坡道接地，既有 Playwright 規格也已更新導覽契約。

## 短程效能比對

Windows Chrome Headless、ANGLE SwiftShader、1280 × 900、DPR 1，使用 Playwright 攔截請求並從本機靜態產物提供檔案。改版前使用工作目錄原有的 `dist`，改版後使用 V3 本機 build。兩組各跑一次，每種動作取約 1.8 秒。標籤讀取指讀取島名按鈕的 `offsetWidth`，繪圖提交是取樣期間攔截的 WebGL draw 呼叫總數。幀間距為瀏覽器 `requestAnimationFrame` 的 p95。

| 情境         | 島名寬度讀取 | WebGL 繪圖提交 |   幀間距 p95 |
| ------------ | -----------: | -------------: | -----------: |
| 全景環境動態 |       49 → 0 |  4,193 → 2,466 | 272 → 300 ms |
| 滑鼠旋轉     |       77 → 0 |  6,583 → 1,641 | 550 → 483 ms |
| 切換夕陽     |       56 → 0 |  5,968 → 1,296 | 800 → 817 ms |
| 開啟閱讀框   |       14 → 0 |    1,192 → 754 | 567 → 433 ms |

首次觀察到場景可用約為 6.50 → 6.11 秒，Long Tasks 為 3 → 1。兩次取樣的幀數與實際窗口長度不同，不能用繪圖總數推算固定的每幀改善，也不能由軟體渲染推定實體 GPU 的幀率。原始數據與測量程式位於 `.local/v3-baseline.json`、`.local/v3-perf-after.json` 和 `.local/v3-perf.mjs`。

## 驗收與素材

- `npm.cmd run build` 成功產出 38 個靜態頁。 `npm.cmd run lint`、`npm.cmd run check`、`npm.cmd run typecheck`、變更檔案的 Prettier 格式與 `git diff --check` 通過。
- Vitest 首輪 51 項通過，原有裝飾字元規範擋下新增的選單符號。移除符號後只重跑受影響的 `tests/v2.test.ts`，9 項皆通過。 `test:content`、`test:seo` 與既有追蹤檔案的 `check:public` 通過。
- Vite 仍提示延遲載入的 Three.js 場景 chunk 大於 500 kB。本輪的計時使用本機檔案，未測網路傳輸情境。

- 代表性 Chromium smoke 使用 1280 × 900 桌機視窗與 390 × 844 的手機觸控模擬，另以 850 × 580 檢查動態。涵蓋載入、兩個島體實際點擊、鍵盤入口與焦點、案例圖像、Lab 搜尋、空狀態與模擬、閱讀目錄、Back／Forward、語系與深連結、WebGL 備援、場景檔下載失敗與重試、停用 JavaScript、四時段、相機旋轉、跨橋與抵港。
- 手機 Lab 的 axe WCAG 2／2.1 A、AA 標籤掃描無違規。代表性截圖及 smoke 紀錄位於 `.local/v3/`。
- BookFlow 與 AssetFlow 畫面取自既有公開實際截圖，使用合成測試資料。案例內的來源、測試及 GitHub Actions 是對應版本的歷史證據。 [BookFlow](https://github.com/Cizing24/bookflow-saas) · [BookFlow CI](https://github.com/Cizing24/bookflow-saas/actions/runs/39655913415) · [AssetFlow](https://github.com/Cizing24/assetflow-itam) · [AssetFlow CI](https://github.com/Cizing24/assetflow-itam/actions/runs/39593727102)
- 本輪沿用 Impeccable 的既有設計脈絡與 Graphify 的本機 AST 圖。UI UX Pro Max 與 Review UI Design 的功能已由現有工具覆蓋。Oil Motion 的生成流程需要第三方 API，且沒有真實產品錄影可供處理。沒有新增安裝、憑證設定或付費服務。 [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · [Review UI Design](https://github.com/ColourCloudSky/review-ui-design-skill) · [Oil Motion](https://github.com/oil-oil/oil-motion)

## 本機啟動

需 Node.js 24。從工作區根目錄執行下列 PowerShell 指令，依賴已安裝時可直接啟動。

```powershell
Set-Location .\developer-portfolio
npm.cmd ci
npm.cmd run dev
```

開啟 [繁體中文首頁](http://127.0.0.1:4321/zh-tw/) 或 [英文首頁](http://127.0.0.1:4321/en/)。本機正式產物可用 `npm.cmd run build` 與 `npm.cmd run preview` 預覽。

尚未部署、未推送 GitHub、未建立 PR。實機 GPU、手機實機、全瀏覽器矩陣與來源產品後端測試未在本輪執行。
