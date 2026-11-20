# OpsFlow Mini ERP 作品集整合

日期：2026-11-20（Asia/Taipei）。本次只修改 Developer Portfolio；OpsFlow 為唯讀來源，不部署 ERP，不合併 main。

## 範圍與設計

從作品集 `origin/main` 的 `7cf0c01` 建立 `codex/opsflow-portfolio` 隔離工作樹。原 `codex/local-web-guidance` 的未提交修改及未追蹤檔案保留，未混入此次提交。

- 新增 `/zh-tw/projects/opsflow/` 與 `/en/projects/opsflow/`，使用既有 Content Collections 與案例頁模板。
- 作品總覽及 Project Harbor 自動讀取 metadata，顯示特色、技術、GitHub 與案例入口；OpsFlow 不設定 `demoModule` 或 `demo`。
- Engineering Lab 新增資料一致性／Benchmark、維護／Regression 兩項入口；技術索引與相關專案導覽可到達新案例。
- 沿用現有 V3 tokens 與 Read 模式。語意化流程、架構與共同比例長條圖皆為靜態 HTML/CSS，不新增圖表套件、JavaScript 或 3D 模型。
- 案例章節 ID 在兩語一致，語言切換保留章節；圖片使用 Astro Image、WebP、srcset、尺寸與 lazy loading。案例頁既有封面保留 eager loading。

## 來源查核

公開來源：[OpsFlow Repository](https://github.com/Cizing24/opsflow-mini-erp)。查核版本 `bc922605f9d71ad7fae3b133c005bba85c70363f`；本機來源工作樹乾淨且 HEAD 相符。[PR #10](https://github.com/Cizing24/opsflow-mini-erp/pull/10) 已於 2026-11-20 合併，合併提交 `aa2f234dbee3f2e550762dedd5f544cbdc7f5781`。保留已驗證的 PR head 作為案例版本，不把合併視為重新執行來源測試。

[CI 44629535764](https://github.com/Cizing24/opsflow-mini-erp/actions/runs/44629535764) 的 head 為 `bc92260`，conclusion success。已直接核對最新工作紀錄 Unit 7、真實 MySQL Integration 27、Chromium E2E 4。來源 `ci-artifact-summary.json` 是前一次 Run，僅 Unit 6；本頁沒有沿用該舊數字冒充最新 CI。

| 內容                                                | 查核依據（皆位於上述版本）                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 角色、簽核、部分收貨、領料與成本口徑                | `docs/business-process/WORKFLOW.md`、`apps/api/src/procurement.ts`、`inventory.ts`                |
| Vue／NestJS／Prisma／MySQL 架構                     | `docs/architecture/SYSTEM_ARCHITECTURE.md`、`ERD.md`                                              |
| 交易、原子扣庫存、Key replay、SQL 彙總              | `apps/api/src/inventory.ts`、`transactions.ts`、`resources.ts`、`reports.ts`                      |
| UCI 541,909 列、100 商品、合成 TWD 成本、WWI 未匯入 | `docs/data-sources/DATA_SOURCES.md`                                                               |
| Benchmark 與限制                                    | `docs/benchmarks/RESULTS.md`、`METHODOLOGY.md`、`results.json`、`before-project-aggregation.json` |
| 真實 Bug、Issue 與修復                              | `docs/maintenance/REAL_BUG_RECORDS.md`                                                            |
| 故障演練與復原                                      | `FAULT_INJECTION.md`、`MIGRATION_GUIDE.md`、`BACKUP_RESTORE.md`、`backup-restore-results.json`    |

## 素材與公開審查

兩張來源 PNG 原樣複製到 `src/assets/opsflow/`。目視確認為產品工作台、虛構企業與合成交易；沒有登入憑證、密碼或私有部署網址。未複製資料集、Seed、設定、備份或完整來源 Repository。

| 素材          | SHA-256                                                            |
| ------------- | ------------------------------------------------------------------ |
| `desktop.png` | `2c748492dfa47cf5b8ebdac5626d7c5481fd70e8d0e6d7271b31690e509f3b6f` |
| `mobile.png`  | `19c458696d3a44a8f8e630bc90df89a1a108b1d6c4a812cc3c703d0c446d4989` |

英文案例描述來源介面為繁體中文，不將原始截圖誤稱英文產品。UCI 只說明轉換成果，保留 Chen (2015)、DOI 與 CC BY 4.0 歸屬，未將零售交易冒充工程營運。

## Benchmark 展示邊界

100,706 筆異動、1,080 正式讀 API 樣本、並行 1／4／16，當次請求錯誤率 0%。16 並行 P95：異動 137.55 ms、專案列表 303.19 ms、成本報表 315.39 ms。索引查詢平均 4.324 → 2.179 ms。

2,291.71 → 303.19 ms 已核對為 `/api/projects?page=1&pageSize=20`，不是成本報表。前後版本 `3a98e22`／`7cdf742`；未控制主機與快取，不能將全部差異歸因 SQL。Benchmark 為 Windows 同機 Node harness 與 Docker MySQL 短測，沒有 production SLA、實機或長時間負載宣稱，未執行 k6。

真實 Bug 選擇核准／重送預算競態、非同步搜尋覆寫、Session 過期恢復。刻意注入故障、8 同 Key、12 人最後一件、交易 rollback、Migration 與 Backup／Restore 另外標示範圍。

## 本次驗證

來源 ERP 的 38 個歷史案例與本作品集測試分開記錄。本次 Windows、Node 24.22.1、Playwright 1.64.1／Chromium 156；四尺寸為 1440×1000、768×1024、390×844、320×760，預設 Reduced Motion，動畫案例另行啟用。

- Lint、Prettier、Astro check（0 errors／warnings／hints）、TypeScript、66 項 Vitest、雙語內容契約通過。追加轉址與斷言修正後，Lint／格式重新通過。
- 最終建置 44 頁；22 個語系頁面的 noindex／正式 origin 隔離 SEO fixture 通過。沒有設定正式 SITE_URL。
- 完整首輪 Playwright 188 項：180 通過、8 失敗；失敗為無語系 OpsFlow 路由缺漏及 no-JS 舊三作品斷言，各在四尺寸重複。補上既有 LegacyRedirect 與四作品斷言，另外確認 OpsFlow 連結。
- 最終建置後重跑兩項修正及全部 OpsFlow 測試，四尺寸共 24／24 通過，其中 OpsFlow 為 16／16。合併兩輪涵蓋 188 項，沒有未解決失敗；沒有宣稱修正後又完整重跑 188 項。摘要見 `docs/evidence/opsflow/validation.json`。
- 包含雙語頁面、來源／Benchmark 數值、語言章節、展館／實驗室、圖片、no-JS、axe 與既有 TravelOps／BookFlow／AssetFlow 回歸。新增 28 個外部連結全部 HTTP 200；三個 API P95、1,080 樣本與 0 錯誤另以原始 JSON 比對。
- 1440／390 px 實際瀏覽器截圖保存在 `docs/evidence/opsflow/`；已目視檢查封面、流程、架構與圖表。來源資訊展開後沒有水平溢出，原始圖片連結可用鍵盤開啟。
- 新檔納入 Git 追蹤後執行 check:public 通過，並另行人工審查新增內容與兩張合成資料 PNG；npm audit --audit-level=moderate 為 0 vulnerabilities。這些檢查不代表完整滲透測試。

遠端 GitHub Actions 與 Cloudflare Preview 由同一 PR 的提交檢查及描述記錄，不以本機結果代替遠端驗證。原始完整回歸與修正重驗紀錄保存在隔離工作樹 `.local/`；PR 的 CI artifact 另提供瀏覽器證據。

已知限制：未驗證 Safari、Firefox、真實手機、人工讀屏與正式負載；沿用既有 Three.js 場景 chunk 大小警示。本次不修改場景、碰撞、來源 ERP 或正式環境設定。
