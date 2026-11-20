# GitHub 展示更新與驗證

日期：2026-11-21（Asia/Taipei）。來源基準 `c932da8475eeb7f694d8263b8b63a8605ce0d1cd`，分支 `docs/github-showcase-refresh`。本次只修改 README、文件與展示素材，沒有變更網站 UI、產品程式、依賴、部署或內容公開範圍。原始工作目錄的未提交變更保留。

## 媒體與閱讀入口

`docs/media/` 的 PNG 來自目前版本的本機 Astro 正式建置；桌面 1280×720，手機 390×844，Chromium，Reduced Motion。`cover.png` 為目前功能分區首頁；`project-harbor.png`、`interactive-demo.png`、`case-study.png`、`mobile.png` 展示不同閱讀與操作情境；另保留 `engineering-notes.png`。

`demo.mp4` 為 77.28 秒連續瀏覽器錄製，包含四時段、展館、OpsFlow 案例、TravelOps 合成流程、英文入口與筆記。`demo.gif` 擷取其中 18 秒，800×450、126 幀；未製作虛構操作。所有操作資料均為公開內容或前端合成資料。影片已隨 PR 提供，沒有新建影片託管或部署網站；GitHub 可下載 MP4。素材來源與瀏覽器結果另見 `media/capture.json`、`media/validation.json`。

原有雙語網站、安裝、完整驗證、部署、內容維護與協作紀錄入口保留。README 原本同時描述兩代導航，已整理為目前固定七個功能分區與四個案例；歷史文件原樣保留。

## 架構查核

使用 graphify 0.9.113 對 95 個來源檔作 AST 抽取，建立 544 nodes／973 edges 的本機查核圖，查詢 `initReader`、`loadDemo`、`initStudio` 及相鄰模組，並直接閱讀下列來源：

| 關係                             | 實作依據                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| 雙語內容與 schema → 靜態路由     | `src/content.config.ts`、`src/lib/schemas.ts`、`src/pages/` |
| 同頁 dialog、URL／焦點與展示入口 | `src/lib/studio-reader.ts`、`src/lib/studio-showcase.ts`    |
| 場景延後載入與生命週期           | `src/lib/studio.ts`、`src/lib/studio-scene.ts`              |
| 共用島位、地形與導航             | `src/lib/world-config.ts`、`world-map.ts`、`navigation.ts`  |
| 三個前端模型及語系暫態交接       | `src/lib/demos/`、`language-state.ts`                       |

架構圖為 `media/architecture.svg`。本站沒有業務 API、資料庫、帳號服務、Queue 或真實金流；案例來源產品的這些元件不畫成本站服務。圖中瀏覽器記憶體只表達展示狀態；重新載入會重設，語系切換有受限的暫態交接。

graphify 僅輔助導航，並非完整依賴證明：14 個來源檔無符號輸出，原始抽取診斷包含 64 條 dangling endpoint、1 個 self-loop，同端點關係合併 186 條。Astro 模板、動態載入與資料契約已另外人工查核；沒有以圖完整覆蓋率或節點數宣稱產品品質。完整本機 graph 留在忽略目錄，未提交工具快取或私人設定。

## 本次實際執行

環境：Windows、Node 24.22.1、鎖定依賴、Chromium。沒有變更任何測試或降低檢查。

- `npm ci --ignore-scripts` 成功，安裝當下 npm audit 摘要為 0 vulnerabilities。
- `npm run build` 成功：44 頁；保留既有大於 500 kB 的場景 chunk 警示。
- `npm test` 成功：7 個 test files、66 項測試通過。
- `npm run test:content` 通過：完整語系配對、唯一 key、來源證據與共用介紹契約。
- `npm run check:public` 在新增素材納入追蹤前通過 403 個 tracked files，納入後再通過 415 個 tracked files；另經 staged 審查，不將此掃描當作完整安全審查。
- 本機真實操作錄製完成，瀏覽器 `pageerror` 為 0；手機展館沒有水平溢出。
- GIF 為 18 秒、126 幀，MP4 完整解碼通過；GitHub GFM 輸出在 1280／390 px 各有 7 張圖片成功載入。Chromium 實測 GIF 影格變動、77.28 秒 MP4 播放與 3 處 seek、SVG 解碼均通過，`pageerror` 為 0，結果記錄於 `media/validation.json`。

GitHub Markdown API 產生 README HTML 後，以獨立 Chromium 在 1280／390 px 驗證本地媒體。這驗證 GitHub 的 Markdown 解析輸出及圖片解碼，不代表 GitHub 版面 CSS 完全相同。SVG 使用標準 XML、文字與向量線條，另核對瀏覽器解碼。

既有 [CI 44773892032](https://github.com/Cizing24/developer-portfolio/actions/runs/44773892032) 對應基準 `c932da8` 且 success；本次 PR 的 CI 狀態以當次 checks 為準。沒有將歷史 188 項 E2E 或舊效能取樣寫成本次完整重跑結果。

## 限制

本次沒有重跑完整 `verify`／188 項 E2E、效能 Benchmark、Lighthouse、Safari／Firefox、實機或人工讀屏。自動 axe、既有測試與本次媒體錄製各有不同範圍，不互相替代。素材只呈現目前可操作功能，不宣稱正式營運、後端並行一致性或 WCAG 合規。
