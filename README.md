# Developer Portfolio · 專案群島

CIZING 的雙語前端作品集。訪客可以從七座 3D 群島探索專案與工程筆記，也可以直接從選單閱讀案例，查看實際產品畫面、設計取捨與對應版本的實作及測試證據。

![V3 七島桌面全景，顯示作品、BookFlow、AssetFlow、筆記、聯絡、CIZING 與在隆昌的入口](docs/screenshots/islands-update/desktop-overview.png)

_V3 七島更新時的實際截圖。_ [中文互動預覽](https://cizing24-portfolio-test.pages.dev/zh-tw/) · [English preview](https://cizing24-portfolio-test.pages.dev/en/)

## 主要功能

- **3D 七島導航** — 拖曳、縮放或選擇島嶼，切換四個時段的光照，觀察人物走橋與船隻進出港口。
- **雙語案例** — 提供繁體中文與英文內容，從案例讀取專案畫面、操作流程、程式碼與歷史驗證紀錄。
- **互動展示** — 在 BookFlow 體驗選時段與預約，在 AssetFlow 操作資產清冊及離職交接。流程在瀏覽器內以合成資料模擬。
- **Engineering Lab** — 依關鍵字、分類或標籤探索工程筆記、技術索引與相關案例。
- **替代閱讀路徑** — 支援鍵盤操作與減少動態效果。WebGL 無法使用時保留替代地圖，停用 JavaScript 時仍能閱讀獨立內容頁。

## 技術與架構

| 層級       | 技術                                                      |
| ---------- | --------------------------------------------------------- |
| 靜態網站   | Astro、TypeScript、Content Collections、MDX、Tailwind CSS |
| 場景與互動 | Three.js、WebGL、HTML `dialog`                            |
| 驗證       | Vitest、Playwright、axe、Lighthouse                       |

```text
雙語內容與案例 → Astro 靜態頁面 → 獨立內容頁、群島選單與同頁閱覽室
                              └→ 瀏覽器按需載入 Three.js 場景
```

共用島嶼設定把場景熱點對應到內容入口。 [場景、路徑與互動架構](docs/INTERACTIVE_WORLD.md) · [雙語內容維護](CONTENT_GUIDE.md)

## 工程重點

- **讓畫面與路徑共用地形。** 島面、橋梁與障礙物資料同時支援場景定位和通行判斷。建立尋路圖前先算好固定障礙物及橋口淨空，避免每個取樣點重算。四組尋路圖共 9,012 個節點，優化前後的座標、連線與連通區逐項一致。 [效能取樣與路徑比對](V3_FINAL_OPTIMIZATION_PR_VALIDATION.md)
- **減少 3D 初始化與背景繪製成本。** Three.js 場景按需載入，開啟閱覽室、場景離開可視範圍或分頁隱藏時暫停更新。本機 Chrome／SwiftShader 的場景首次可用時間中位數由 5.12 秒降至 3.12 秒，每版取樣三次。
- **保留操作與閱讀狀態。** 原生 `dialog` 支援 Escape 與關閉後焦點返回，網址可分享並支援瀏覽器歷史。系統偏好減少動態效果時，預設停用自主動態。

## 開發與 AI 協作

Tanci 設定求職展示方向、案例順序、雙語與無障礙需求，以及素材公開範圍。Codex 協助實作案例導航與證據索引、核對來源專案、執行代表性檢查並重構本頁。 [公開協作紀錄](docs/AI_COLLABORATION.md) · [V3 整合 PR](https://github.com/Cizing24/developer-portfolio/pull/12)

## 快速啟動

需要 Git、Node.js 24 與 npm。Windows 可使用 `npm.cmd`。

```sh
git clone https://github.com/Cizing24/developer-portfolio.git
cd developer-portfolio
npm ci
npm run dev
```

開啟 [繁體中文](http://127.0.0.1:4321/zh-tw/) 或 [English](http://127.0.0.1:4321/en/)。可先從選單直接讀一篇案例，再從 BookFlow 或 AssetFlow 島開啟互動展示。

執行 `npm run build` 產生靜態網站，再以 `npm run preview` 預覽建置結果。 [靜態建置與部署設定](DEPLOYMENT.md)

## 測試與技術文件

- [V3 本機驗證](docs/V3_LOCAL_VALIDATION.md) 與 [最終驗證報告](V3_FINAL_OPTIMIZATION_PR_VALIDATION.md) 記錄建置、尋路與模擬測試，以及桌機和手機尺寸的代表性操作檢查，包含鍵盤、Reduced Motion、WebGL 備援與 axe 抽查。
- [PR #12 合併提交的 CI](https://github.com/Cizing24/developer-portfolio/actions/runs/42033004651) 在 E2E 步驟失敗。本機驗證範圍見上方報告。
- `npm test` 跑單元測試。完整驗證前先執行 `npx playwright install chromium`，再執行 `npm run verify`。 [測試方式與各版本證據](TESTING.md)

## 目前範圍

作品集為靜態網站。BookFlow 與 AssetFlow 的互動展示使用合成資料，來源產品的後端驗證由各自儲存庫提供。棉麻屋的客戶畫面與部署網址維持私有。效能數值限於報告中的本機環境，仍有場景 chunk 大小警示。
