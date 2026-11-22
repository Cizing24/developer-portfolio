# LegacyLens 作品集整合

查核日期：2026-11-23（Asia/Taipei）。僅修改 Developer Portfolio，未修改或執行來源應用，未重跑 Benchmark，未部署後端，未合併 PR，未調整 Production 設定。

## 基準與來源

- Portfolio：`Cizing24/developer-portfolio`，從最新 `origin/main` `c65be96` 建立 `feat/integrate-legacylens-case-study`，隔離工作樹為 `.work/legacylens`。
- 開始時 Open PR 清單為空。原 `codex/local-web-guidance` 的未提交修改、未追蹤 AGENTS.md、文件與測試均保留，沒有帶入本分支。
- 唯一產品來源：[公開 LegacyLens-Showcase](https://github.com/Cizing24/LegacyLens-Showcase)。重新讀取 main，仍為 `1d2e0dd841b2c9fe1c1bd73f9246d0661c16481e`；雙語 `sourceCommit` 與證據連結固定於此 SHA。
- 核對 README、四份 ADR、三個維護案例、DEV-001／002、架構、資料來源、原始 Benchmark／SQL IO、測試報告、媒體與相關 C#／Web Forms 實作。未讀取私人原始 Repository。
- 來源最新 [Windows CI 45011724113](https://github.com/Cizing24/LegacyLens-Showcase/actions/runs/45011724113) 在上述 SHA 為 success；已核對 restore/build、LocalDB、NUnit、工具及 IIS Express browser steps 成功。來源現存公開報告為 58 NUnit（25 Unit＋33 SQL）、13 Chromium E2E、6 工具測試，與本作品集驗證分開。

## 展示範圍與架構

- `/zh-tw/projects/legacylens/` 與 `/en/projects/legacylens/` 使用現有 Content Collections 與動態案例模板；無語系路徑沿用 LegacyRedirect。
- metadata 使用 `featured: false`、`order: 5`，保留既有四案順序。Harbor 自動讀取第五案，每頁仍三件；All／Featured／Other 與前後頁沿用現有程式。不增加 3D 島嶼、`demo`、`demoModule` 或模擬 CRUD。
- ProjectCard 與 Harbor 提供公開 GitHub、完整案例及影片章節連結。Related Projects 自動雙向納入新案例。
- Engineering Lab 在 Backend & Data、Testing & Quality 各加入一個可搜尋項目；技術 tag 涵蓋 C#、ASP.NET Web Forms、.NET Framework、SQL Server、ADO.NET、Debugging、Testing、Performance Optimization、NUnit、Playwright、Migration 與 Rollback。
- Skills Index 三個既有類別連到架構、SQL-001 與驗證章節，沒有另建技能資料系統。雙語固定章節 ID 與案例模板 anchor map 保留切語言位置。
- 案例依序提供概覽、影片、功能與截圖、架構、WEB-001、SQL-001、CHANGE-001、真實開發問題、來源測試、決策與限制。WEB-001 明示 Controlled Fault Injection，CHANGE-001 明示 Synthetic Scenario；不把獨立練習包裝成企業導入或事故。

## 真實素材與完整性

來源均為上述固定 SHA 的 `docs/media/`。複製原始畫面、不使用 AI 圖片、不重新錄製影片；英文保留來源繁中介面並提供英文說明。完整來源路徑、目的路徑、bytes、SHA-256 與轉換記錄見 [media-manifest.json](evidence/legacylens/media-manifest.json)。

| 素材      | 來源檔                                                                                   | 使用位置                            | 完整性／呈現                                                                            |
| --------- | ---------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| 封面      | cover.png                                                                                | 列表、Harbor、案例封面、影片 poster | 單一來源檔；Astro Image 產生 WebP／srcset；封面可開原圖                                 |
| 功能截圖  | case-search、case-detail、customers、reassignment-history、audit-report、mobile-form.png | 兩語案例 Screenshots                | 六張真實畫面，lazy、alt、原尺寸連結；手機圖維持 390px 上限                              |
| 故障畫面  | web001-before.png                                                                        | WEB-001                             | 隔離故障注入證據，不冒稱實際事故                                                        |
| GIF       | workflow.gif                                                                             | 影片後原生 details                  | ffprobe 20.01 秒、800×450；使用者主動展開，可收合                                       |
| MP4       | demo.mp4                                                                                 | 兩語案例影片                        | 118 秒、1280×720；controls、playsinline、preload=none、poster，無 autoplay              |
| 字幕      | demo.zh-TW.srt、demo.en.srt                                                              | SRT 下載與雙語 track                | 轉成 WebVTT，只改 header／時間碼格式／換行；保留原 SRT；Vitest 比對、Chromium 解析 cues |
| 架構      | architecture.svg                                                                         | 架構章節                            | 原始 1200×660 SVG 作 img；原圖與文字替代說明                                            |
| Benchmark | 三份 results.json                                                                        | HTML/CSS P95 圖與完整表格           | 保留原 JSON，不另存重複 PNG／SVG；Vitest 從 samples 核對 percentile 與 IO               |

來源素材與影片抽樣分鏡已目視審查：實際 IIS Express 合成資料畫面，沒有密碼、私人端點或登入憑證。影片片尾舊 54／11 數字維持原樣，頁面緊鄰影片明示最新來源為 58／13／6。來源字幕與 JSON 的 BOM／換行原樣保存，局部 `.gitattributes -text` 避免 checkout 改變 SHA-256；WebVTT 使用 UTF-8 LF。

首頁只讀封面與連結，未渲染完整案例媒體；沒有 MP4／GIF 初始載入。PNG 由 Astro 產生適應尺寸、尺寸屬性與 lazy loading。沒有新增 runtime JavaScript、圖表套件或 dependency。

## SQL 引用與限制

[來源實測方法](https://github.com/Cizing24/LegacyLens-Showcase/blob/1d2e0dd841b2c9fe1c1bd73f9246d0661c16481e/docs/benchmarks/RESULTS.md)與各規模 `results.json` 固定於查核 SHA。圖表資料位於 `src/lib/legacylens-benchmarks.json`；原始結果存於本目錄 evidence。

100k Baseline → Rewrite＋covering indexes：P50 22.3420 → 1.0832 ms，P95 26.7085 → 1.3413 ms，總 Logical Reads 3,255 → 87。另顯示僅 Rewrite 與 10k／50k，沒有隱藏其 reads 不變的結果。

單一本機 client、SQL Server 2019 LocalDB、已開啟連線、Warm Cache；每方案 5 次預熱、40 次正式計時、nearest-rank。條件 Open／空主旨／offset 0／21 rows；100k 為 100,000 公開列加合成案例，共 100,047 rows。比對 offsets 0／20／200 有序 ID 相同。

計時包括 ExecuteReader 與讀完結果，不含開連線、登入、網路與完整 HTTP。未測 cold cache、長時間併發或索引寫入成本；Open 占比低、substring 與深頁 OFFSET 限制保留。不將查詢數據宣稱為整站加速或 SLA。沒有重跑或改寫原 Benchmark。

## 修改檔案

- 新增：雙語 `legacylens.mdx`、`LegacyLensEvidence.astro`、Benchmark 展示 JSON、真實素材與字幕、原始 Benchmark／manifest、`e2e/legacylens.spec.ts`、`tests/legacylens.test.ts`、LegacyRedirect 與本報告。
- 擴充：`ProjectCard.astro`、`ProjectHarbor.astro`、`EngineeringLab.astro`、`SkillsIndex.astro`、既有案例模板 anchor map。
- 回歸：SEO route list、Portfolio E2E route list、no-JS 五案斷言；README 維持全站定位，CONTENT_GUIDE 記錄本次維護方式。
- byte integrity：`.gitattributes` 僅新增必要來源證據保留規則。

## 驗證紀錄

環境：Windows、Node.js 24.22.1、Playwright 1.64.1／Chromium、鎖定 npm dependencies。本機 Chromium 模擬四尺寸：1440×1000、768×1024、390×844、320×760；新增 LegacyLens 案例另檢查 1280×900。

- `npm ci`、lint、Prettier、Astro check（0 errors／warnings／hints）、TypeScript、69／69 Vitest、雙語內容契約、47 頁 build、24 個語系頁面 SEO fixture 通過。
- 完整 `npm run verify` 執行到四尺寸 208 項 Playwright：204 通過、4 失敗，均為既有 Harbor 測試仍預期 Other Projects=0。修正為唯一項目 LegacyLens 後，四尺寸定向重跑 **4／4 通過**。沒有刪除測試、降低 axe 或更新視覺基準；不把兩輪說成修正後本機重新完整執行 208 項。
- LegacyLens 專用 **20／20** 通過，含雙語、Harbor 分頁／分類、Lab／Skills、正確來源、三個案例、九組 Benchmark 結果、圖片、MP4／SRT／WebVTT、118 秒 duration、兩字幕軌 cues、no-JS、語言章節切換、320～1440px 與額外 1280px、Console、axe。
- 第一輪專用測試發現手機 Benchmark 雙層捲動與 320px 展開來源 SHA 溢出。修正局部表格 display／overflow，讓具 tabindex 的外層負責捲動；共用來源資訊加入 overflow-wrap。新增方向鍵捲動斷言，最終四尺寸通過。
- 原圖與影片抽樣、桌機繁中／手機英文首屏、影片與圖表、Harbor 展台已目視檢查；截圖存於 evidence/legacylens。影片另在 390px 實際播放並暫停，currentTime >1 秒、duration=118、兩字幕軌。
- 納入追蹤後 `check:public` 通過；`npm audit --audit-level=moderate` 為 0 vulnerabilities。18 份來源／轉換／原始結果的工作檔及 Git 暫存 bytes 均與 SHA-256 manifest 一致。24 個固定 SHA 的來源文件連結在公開 checkout 中均存在。
- 機器可讀摘要：[validation.json](evidence/legacylens/validation.json)。完整本機原始記錄保留於隔離工作樹 `.local/`，不公開個人環境資料。

SEO 沿用未設定 SITE_URL 的 noindex／Disallow；隔離 `https://portfolio.test` fixture 檢查 canonical、hreflang、OG、Article JSON-LD 與 sitemap。未為本次任務設定正式 origin；OG 沿用全站圖。

## 公開展示品質評估

| 招募閱讀問題          | 頁面提供的入口與證據                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| 10 秒內理解定位？     | 標題下描述與首段指出 ASP.NET maintenance、故障調查、SQL、相容變更；仍屬設計評估，未做招募使用者計時研究 |
| 30 秒內找到操作畫面？ | 開場封面、目錄「產品畫面」及「觀看操作影片」；未做計時研究                                              |
| 直接觀看 Demo？       | 原生影片 controls 與雙語 captions，沒有登入需求                                                         |
| 理解三個工程案例？    | 每案分開列問題、分類、根因／規則、決策、回歸與取捨                                                      |
| 查證 SQL Benchmark？  | 完整三規模三方案表格，連到固定 SHA 報告、samples、plans 與 IO                                           |
| 看見技術決策？        | ADR、RCA、Alternative、Index／OFFSET／Migration 與安全成本                                              |
| 與既有作品一致？      | 同一案例模板、暖紙 tokens、Astro Image、原生 details 與既有 Harbor／Lab／Skills                         |

## 未驗證與邊界

沒有正式部署驗證、真實手機、Safari／Firefox、人工螢幕閱讀器或完整滲透測試；axe 不代表完整 WCAG 合規。既有 Three.js >500kB chunk 警示保留。未更新 V2 視覺基準或重跑歷史 Lighthouse；本輪以實際頁面與截圖檢查，不用舊 V2 baseline 代替驗收。

本次 PR 的遠端 GitHub Actions、既有 Cloudflare Preview 連結與實際驗證狀態記錄於 PR 描述及交付訊息，與上述本機結果分開；不以本機測試代替遠端成功。
