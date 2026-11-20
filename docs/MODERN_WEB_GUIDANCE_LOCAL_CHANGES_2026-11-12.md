# Portfolio JavaScript／CSS 本機精簡紀錄

日期：2026-11-12（Asia/Taipei）。本輪只修改本機，沒有 commit、push、PR、合併或部署。

## 版本核對與同步

- 開工資料夾的 `main` 為 `6b77cb72631f9d31af0faed37d868125574550dc`，與當時線上版本不同。
- 經使用者同意，建立本機分支 `codex/local-web-guidance`，以遠端 `main` 的 `7b4787821a85f64b0477569af712fec395d0e87f` 為修改起點。
- 核對網站為 <https://cizing24-portfolio-test.pages.dev/>。同步後的繁中、英文首頁 HTML 與線上逐字一致；兩頁引用的四份 JS／CSS 均通過 SHA-256 比對。這是修改前基準，修改後的本機版本自然會與線上不同。
- 原有 `AGENTS.md` 工作檔逐位元組保留。遠端新版已刪除該檔，因此在本機新分支顯示為未追蹤；原本暫存與未暫存差異另存於 stash，以及 `.local/modern-web-guidance/AGENTS.*`。
- 依同步後的既有 lockfile 執行 `npm ci`。沒有新增網站依賴，也沒有修改 `package.json` 或 `package-lock.json`。

版本證據：`.local/modern-web-guidance/version-comparison.json`。

## 實際修改

### 延後閱讀期間不需要的 3D 初始化

`src/lib/studio.ts`：原本只要首頁場景進入可見區域，就會下載 Three.js 場景、建立模型和尋路資料，即使網址已直接開啟閱讀框。現在共用原有的可見性更新流程，只有場景可見、分頁未隱藏、閱讀框已關閉且尚未嘗試初始化時才載入。

一般群島首頁保留原有載入方式。直接閱讀連結仍能搜尋、操作展示及切換內容；關閉閱讀框後才載入場景，沿用網址中的島嶼與時段。已開始的下載不會因中途開啟閱讀框而取消。

`src/lib/studio-reader.ts`：延後載入時，關閉閱讀框後島嶼按鈕仍不可見，因此先將焦點還給可見的選單按鈕；已就緒場景維持原有焦點返回流程。

`e2e/loading.spec.ts`：新增中英文回歸案例，覆蓋四種尺寸。檢查閱讀期間沒有場景下載和 canvas、篩選仍可操作、關閉後只下載一次、島嶼與時段還原，以及焦點返回。修改前已確認兩個桌機案例會因過早下載場景而失敗。

### 移除已無引用的全域 CSS

`src/styles/global.css`：移除 86 條規則，共 379 行，包含舊首頁的 hero、編輯側欄、方法步驟，以及已移除的案例摘要和證據面板樣式。每條刪除規則的起始 class 均查過現行原始碼與全部建置 HTML，沒有對應引用。

保留現行閱讀頁、流程模擬、專案列表、響應式與 reduced-motion 樣式。未依單次首頁 CSS Coverage 刪除其他路由才會使用的規則。

刪除明細：`.local/modern-web-guidance/css-removed.json`。原始 CSS 備份：`.local/modern-web-guidance/global.before.css`。

### 限縮 Tailwind 的樣式來源

原設定會從專案根目錄掃描文件與測試，將一般文字也視為 utility class 候選。收尾時已重現：報告加入英文 `invisible`，就使全域 CSS 多出 `.invisible` 規則。現在將 import 設為 `@import 'tailwindcss' source('../');`，相對於樣式檔只掃描 `src`，仍涵蓋 Astro、TypeScript、Markdown 與 MDX。

此設定再排除未用於網站的 utilities；未來若在 `src` 以外新增實際 UI，需另外登記樣式來源。設定依據：[Tailwind 官方文件](https://tailwindcss.com/docs/detecting-classes-in-source-files#setting-your-base-path)。

## 量測

Windows、Node.js 24.22.1、Playwright Chromium 156.0.8078.4、1440 × 900、DPR 1、reduced motion。本機 preview，每個網址每版各三個新 context，前後依序執行，沒有隨機交錯。位元組為未壓縮內容；gzip 為離線壓縮估計，並非 CDN 實際傳輸紀錄。

| 項目               |        修改前 |        修改後 | 解讀                                |
| ------------------ | ------------: | ------------: | ----------------------------------- |
| 直接閱讀初次 JS    | 668,444 bytes |  28,525 bytes | 約減少 95.7%；關閉閱讀框後才下載 3D |
| 全域 CSS 建置檔    |  33,301 bytes |  24,985 bytes | 減少 8,316 bytes，約 25.0%          |
| 全域 CSS gzip 估計 |   8,027 bytes |   6,282 bytes | 減少 1,745 bytes，約 21.7%          |
| 首頁兩份 CSS 合計  |  53,999 bytes |  45,683 bytes | 減少約 15.4%                        |
| 3D 場景模組        | 639,958 bytes | 639,958 bytes | 保留功能；本輪處理載入時機          |

一般群島首頁前測就緒時間中位數為 2.00 秒，最後重測為 1.87 秒；樣本少且沒有交錯執行，不能據此判定 3D 首頁有穩定改善。直接閱讀的確認時間中位數為 2.48 → 0.17 秒，後測不再發生 3D 初始化的兩段大型工作；它仍有閱讀介面自身的短暫工作，不能宣稱完全消除長任務。

此處的就緒時間是從導覽到 Playwright 確認指定介面狀態，包含頁面 load，並非 LCP、INP 或真實使用者的 Core Web Vitals。未做實機、實際網路或 GPU 效能的前後比較。

原始紀錄與畫面：`.local/modern-web-guidance/before/`、`after/`。

## Modern Web Guidance 的採用與取捨

參考 [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)，使用 CLI 1.0.0 查詢與取得指引；工具只存於本機忽略的快取，沒有成為網站依賴。

- [performance](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/performance/performance.md)：依「DON'T load invisible or unreachable CSS/JS」刪除無引用 CSS，並將既有動態 import 延後到真正需要場景時。未為消除 500 kB 警告而增加額外 chunk 或提高警告門檻。
- [identify-heavy-scripts](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/performance/identify-heavy-scripts.md)：依「DO summarize the key information」在本機量測器觀察 Long Tasks 與 Long Animation Frames，記錄主要初始化成本。量測器不會加入網站或送出使用者資料。
- `defer-rendering-heavy-content`：未套用。原有未開啟的 dialog 已不參與一般版面計算，首頁上方可見場景也不適合增加 `content-visibility: auto`。
- `dialog`：掃描唯一命中是手動 backdrop 關閉。保留這段精簡處理，因它會同步閱讀歷史與焦點；直接改成 `closedby="any"` 無法取代目前的歷史流程，該屬性也尚未跨瀏覽器普遍可用。

`legacy-scan` 前後皆為 1 項，這是保留並註記的取捨。此掃描只涵蓋指引中可靜態辨識的部分規則，不能代表完整效能驗收。

## 驗證與限制

- ESLint、Astro check、TypeScript、55 項 Vitest、內容契約、38 頁建置、SEO fixture、公開檔案掃描與 diff whitespace 檢查已通過。
- 32 張靜態頁面截圖逐像素一致：兩語、1440／390px、作品列表、兩案內容、筆記索引、預約一致性文章、關於、聯絡及 404。比對前等待圖片解碼，使用相同建置內容，僅替換已核對的原版 CSS 與精簡 CSS；這不是跨瀏覽器或完整互動狀態的視覺驗收。
- 原始 `npm run verify` 在 `format:check` 被既有 `AGENTS.md` 阻擋。該檔保留未改；另外執行 `prettier --check . '!AGENTS.md'` 已通過，並接續執行原 verify 的其餘步驟，沒有更動檢查設定。
- 完整 Playwright 首輪為 134／140 通過，新增的八個延後載入案例全部通過。四個筆記案例因既有的精確 label 定位失敗；`e2e/portfolio.spec.ts` 改以 `combobox` 的可存取名稱定位，所有原有斷言保留，四種尺寸重跑全部通過。共 138 個不同案例已通過，不能寫成完整套件全綠。
- 其餘兩個失敗是 390px／320px 下 AssetFlow 內容標籤的邊緣重疊。以線上原始 HTML、JS 與 CSS 在相同環境重現，重疊座標和本機修改版完全一致：390px 約 2px 高，320px 最多約 7px 高。此問題與本輪刪除的 CSS 和延後載入無關，保留原測試失敗並記錄，沒有降低斷言，也未將效能工作擴展為場景標籤排版修改。
- 最後限縮 Tailwind 掃描範圍後，重新確認 32 張畫面逐像素一致，並重跑四種尺寸的 32 個相關 E2E，全數通過。涵蓋新增載入案例、全頁連結／圖片／主控台檢查、全頁 axe、兩案操作展示、選單搜尋與閱讀歷史。此後未再執行完整 140 個案例。

測試證據：`.local/modern-web-guidance/full-e2e-results.json`、`notes-tests.log`、`final-targeted-tests.log`、`label-baseline.json`、`verify.log`、`verify-remaining.log`。手寫 CSS 原始 333 條規則精簡為 247 條，另以 PostCSS 確認所有保留規則內容均未改變；Tailwind 產生的 utilities 另外由來源掃描範圍控制。

Three.js 場景仍有大檔警告，首次進入群島仍有模型、尋路與繪圖初始化成本；直接閱讀的節省不代表一般 3D 首頁也減少同等下載量。首次關閉閱讀框後會等待場景初始化。未執行 Lighthouse、其他瀏覽器、實機、人工讀屏、遠端 CI 或部署驗收。
