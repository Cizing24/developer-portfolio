# TravelOps × Developer Portfolio 整合驗收

日期：2026-11-12（Asia/Taipei）。本次交付為獨立 PR，由擁有者審閱、合併與部署。

## 內容、版本與公開邊界

- TravelOps 產品來源：`11c0e7ae5fa828a69438f807be220c4f37be41c9`。已審核媒體提交：`9c099041a44c0bfb6fdd391945106faa859816cf`。來源媒體 PR 尚未合併，本次只讀取其中的已追蹤素材。
- 作品集起點：`7b4787821a85f64b0477569af712fec395d0e87f`，並帶入擁有者既有的 Modern Web Guidance 本機修改。這些修改以獨立提交保留：延後直接閱讀時的 3D 初始化、焦點返回、CSS 精簡、Tailwind 掃描範圍與相關測試。原工作目錄的未提交變更及 AGENTS.md 均保留。
- 新增 `/zh-tw/projects/travelops/`、`/en/projects/travelops/`，沿用 Astro Content Collections 與既有 schema。雙語 `translationKey`、`sourceCommit`、`reviewedAt`、`visibility` 一致。
- 新增 `/projects/travelops/`，沿用現有 LegacyRedirect，保留 query 與有效錨點。繁中／英文案例切換可保留影片、架構、工程決策及驗證章節錨點。
- `visibility: private` 表示來源私有，案例仍可公開閱讀；沒有私人原始碼、登入或 Live Demo 連結。
- 已完成本批素材的擁有者人工公開審核。沒有搬入來源媒體驗收文件、evidence map、原始錄影、session、帳密、私有 runtime、HTML 架構展示檔或未審核資料。

## 元件與閱讀流程

| 位置                                            | 修改及理由                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 雙語 `travelops.mdx`                            | 共用目的、操作展示、功能、架構，再依問題、決策、實作、驗證與取捨解說五項工程設計。                                             |
| `project-introductions.ts`                      | 新增 TravelOps 的雙語介紹；`IslandProjectId` 保持只含 BookFlow／AssetFlow，避免新案例落入既有模擬的二分邏輯。                  |
| `ProjectWorkflow.astro`、`TravelOpsMedia.astro` | 串起影片、旅客、POS、系統與交易圖、營運畫面；新媒體不新增瀏覽器 JavaScript。                                                   |
| `StudioReader.astro`                            | 三案都列於作品總覽，只有既有兩座作品島會渲染完整閱讀與互動內容。TravelOps 使用普通連結離開群島閱讀框，首頁不嵌入其大圖或影片。 |
| `ProjectCard.astro`、獨立案例路由               | 正確標示票券履約類別，連回作品總覽，不導向不存在的 TravelOps 島。                                                              |
| `project-showcase.ts` 與場景相關型別引用        | 限定既有島嶼型別；不新增 TravelOps 假互動，也不更動模型、島位、相機、光照及動畫。                                              |
| `studio.css`                                    | 修正既有 390／320 px 英文 AssetFlow 內容標籤邊緣重疊，僅讓第三個標籤增加 12 px 間距；原非重疊斷言保留。                        |
| 內容、SEO 與 E2E                                | 新案例加入頁面掃描、axe、SEO fixture、無語系轉址與 no-JS 清單契約；新增專用媒體及首頁載入回歸。                                |

五項工程敘事分別處理共用庫存的 MySQL 列鎖、Inbox／body hash 冪等、持久 Outbox 與 Redis 故障恢復、退款／核銷共用訂單鎖、原始帳冊與人工處置分離。對照來源程式與整合測試核對，不把可恢復派送描述成跨服務 exactly-once，也不把本地 Mock 說成真實第三方整合。

## 媒體與可讀性

- 八張原始 PNG：商品目錄、手機商品詳情、訂單進度、場館權益、POS 桌面／手機、對帳、報表。由 Astro Image 提供 WebP、srcset、尺寸及 lazy loading；首張封面 eager。每張均有替代文字與說明，並可開啟原尺寸。
- MP4：1280×720、H.264、74.36 秒、無音訊、1,045,600 bytes；保留已燒錄繁中字幕。使用原海報、controls、`preload="metadata"`、playsinline，不自動播放，附文字分鏡。
- 英文字幕由核准 SRT 轉為 WebVTT：十段、時序遞增、最後結束於 74.36 秒，字幕文字與來源完全一致。英文頁預設開啟英文 track。
- 深淺系統總覽 PNG 與交易流程 SVG：保留文字摘要、原尺寸連結；長 SVG 使用原生 details 與可鍵盤水平／垂直捲動區域，避免縮成不可讀小圖。
- 全站維持既有暖紙主題，沒有新增全站 dark mode。深色架構圖以獨立 details 提供，不假設網站跟隨系統配色。
- 13 份複製的原始媒體共 2,832,709 bytes，SHA-256 全部與核准 manifest 相符；不含後續 Astro 衍生 WebP、字幕及授權文件。保留 MIT／OFL 授權，技術標誌無廠商背書。
- 媒體 CSS 僅在案例的影片區塊輸出一次。這避免 Astro 將匯入元件的樣式帶進首頁；其他四組展示共用同一份樣式。

## 首頁資源比較

Windows、Node.js 24.22.1，同一 lockfile 與建置方式。基準為上述 main 加上擁有者既有 Modern Web Guidance 修改，使用另一隔離 worktree 重建。數字為未壓縮建置 bytes，不是 CDN 實際傳輸量或 Core Web Vitals。

| 項目                                 |  整合前 |  整合後 | 差異                               |
| ------------------------------------ | ------: | ------: | ---------------------------------- |
| 3 份 JavaScript 合計，含延後載入場景 | 668,483 | 668,483 | 檔名及 SHA-256 完全相同            |
| 閱讀介面 2 份 JavaScript，不含場景   |  28,525 |  28,525 | 沒有新增 JavaScript                |
| 場景 JavaScript                      | 639,958 | 639,958 | 相同                               |
| 首頁 2 份外部 CSS                    |  45,683 |  45,749 | +66，為既有手機標籤間距修正        |
| 首頁內嵌 CSS                         |   8,549 |   8,549 | 相同，TravelOps 媒體樣式未進入首頁 |
| 英文首頁 HTML                        | 120,931 | 121,307 | +376，新增案例文字入口             |
| 繁中首頁 HTML                        | 115,482 | 115,869 | +387，新增案例文字入口             |

另外以 Playwright 1.64.1／Chromium 156.0.8078.4、1440×900、reduced motion，在兩版各建立四個全新 context，依序檢查兩語的一般首頁與 `?view=projects`。一般首頁各 6 個請求、668,483 bytes JavaScript；直接閱讀各 8 個請求、28,525 bytes JavaScript，場景請求為 0。兩版兩語均沒有 TravelOps 媒體請求或 console error；一般首頁維持一次場景請求。這是資源隔離與載入行為驗證，沒有用小樣本就緒時間宣稱效能提升。

Astro 圖片與 SVG 輸出使用既有帶雜湊資產路徑；沿用既有 `/_astro/*` 快取設定。MP4 使用固定 public 路徑，本次未修改 hosting headers、部署設定或宣稱已驗證 CDN 快取。

## 驗證紀錄

| 驗證              | 本次結果                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`  | 完整流程 exit 0：lint、format、Astro check、TypeScript、Vitest、內容契約、build、SEO fixture、Playwright。                                                                |
| Astro／TypeScript | 84 個 Astro 檔案：0 errors、0 warnings、0 hints；TypeScript 通過。                                                                                                        |
| Vitest            | 6 個測試檔，59 tests 通過。新增案例介紹／島嶼邊界、MP4 雜湊及 WebVTT 時間碼回歸。                                                                                         |
| Playwright        | **160／160 通過，9.3 分鐘**。1440×1000、768×1024、390×844、320×760，兩個 worker。新增 TravelOps 專用測試共 20 個，原有測試全部保留。                                      |
| 媒體互動          | 四種尺寸均通過雙語入口、八張圖片解碼與尺寸、鍵盤開啟原圖、深色圖展開、長 SVG 鍵盤捲動、零水平溢出、字幕載入十段、影片播放與 1／37／73 秒跳轉、no-JS 閱讀。                |
| 自動可及性與網路  | 全部掃描頁面含 TravelOps 的 WCAG 2.2 AA axe 檢查通過；新案例於 light／dark 系統配色均通過，沒有非預期外部請求或 console error。授權索引頁另以 axe 檢查通過。              |
| 建置與 SEO        | 41 個 Astro 路由完成建置；SEO fixture 覆蓋 20 個語系頁面。新增頁面檢查 noindex、canonical／alternate、Article、sitemap；無語系轉址保留 query 與錨點。                     |
| 公開與依賴        | `check:public` 及 Git whitespace 檢查通過；核對新增檔案清單與媒體白名單。`npm audit --audit-level=moderate`：0 vulnerabilities。package.json／lockfile 未改，無新增依賴。 |
| 人工視覺          | 目視繁中 1440／390 px、英文 390 px 的封面、影片／字幕影格、架構摘要與可捲動長圖。修正繁中粗體被 CommonMark 當作字面符號的問題，新增渲染回歸斷言。                         |

初次完整瀏覽器驗證暴露新頁面缺少無語系轉址及既有 no-JS 清單仍預期兩案，均修正後重新執行完整 verify。原本已有的 AssetFlow 手機標籤重疊以精簡 CSS 修正，未更動任何斷言。完整流程之後只更新 SEO 結果數量的訊息、授權頁 landmark 與文件，另完成最終 lint／format／build、SEO fixture 及授權頁 axe，沒有無理由重跑整套瀏覽器測試。

原始測試日誌、Playwright 截圖、瀏覽器環境與資源比對留於忽略的 `.local/`、`test-results/` 等驗證輸出，不提交錄影中間檔或 session。CI 會依既有設定上傳 browser evidence；其實際結果以 PR Checks 為準。

## Git 交付

分支：`codex/travelops-portfolio-integration`，目標 `main`。提交分開保存：

- `18215cf`：保留擁有者既有 Modern Web Guidance 修改。
- `7786a0a`：已審核媒體、字幕及授權。
- `ffc48a5`：共用元件、專案／島嶼型別邊界及媒體驗證。
- `2ddc527`：雙語案例、入口、轉址、SEO 與 E2E。
- 本報告以後續文件提交保存；PR URL 與遠端 CI 最終狀態於交付訊息及 PR 描述提供。

來源產品的歷史紀錄與本次作品集測試分開：2026-11-10 V3 記錄 34 tests／415 assertions；2026-11-12 媒體製作隔離環境記錄 34 tests／416 assertions。本次唯讀核對來源與測試，未重啟來源資料庫重跑 PHPUnit。

## 後續建議與未驗證項目

1. 未來若增加 TravelOps 3D 島，另開設計與實作工作，先定義空間位置、通行與入口，再驗證效能、相機和可及性。本 PR 不包含新島、大型模型或工程動畫。
2. 可考慮另做故障／恢復互動解說，但需明示為前端教學模擬，不能冒充真正後端驗證；目前文字、影片與架構圖已提供閱讀入口。
3. 未執行手機實機、人工讀屏、實體掃碼、全面跨瀏覽器、正式負載或真實金流驗證；自動 axe 通過不代表完整 WCAG 合規。
4. Three.js 場景仍有既有大檔建置警告。首頁資源證據支持本次未新增大資源負擔，不代表已完成一般群島初始化或 GPU 效能優化。
5. 本次不合併任何 PR、不部署 Production、不更動資料庫或雲端資源。遠端 CI、PR Preview 與正式部署各自核對，不以本機測試替代。
