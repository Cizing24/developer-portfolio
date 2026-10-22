# V2 測試與實測紀錄

日期：2026-10-22（Asia/Taipei）。Windows、Node 24.22.0、Astro 7.4.2、Playwright 1.64.1／Chromium 156、Lighthouse 13.5.0。此處僅記 Developer Portfolio，不將來源 AssetFlow／BookFlow 的測試數量算入。

## 指令

```sh
npm ci
npx playwright install chromium
npm run verify
npm run check:public
npm audit --audit-level=moderate
```

verify：ESLint → Prettier → Astro Check → `tsc --noEmit` → Vitest → 內容契約 → Production Build → SEO fixture → Playwright／axe。CI 使用 Linux、Node 24.22.0，另外執行 audit，保留 browser report artifact。

## 本機結果

| 項目              | 實際結果                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ESLint            | 零錯誤、零警告                                                                                                           |
| Prettier          | 來源、測試與文件格式檢查通過                                                                                             |
| Astro Check       | 0 errors／0 warnings／0 hints                                                                                            |
| TypeScript Check  | `tsc --noEmit` 通過                                                                                                      |
| Vitest            | 33 項通過；保留 V1 原有 24 項契約並增加語系、模擬與箭頭防回歸                                                            |
| Content contracts | 兩語完整、配對唯一、同來源 SHA／可見性、每案例 13 章、英文無殘留中文                                                     |
| Production Build  | 30 HTML 頁、robots、最佳化圖片與少量 JS                                                                                  |
| SEO contracts     | 18 個內容頁；預覽 noindex、正式 fixture canonical／hreflang／x-default／OG／Article／sitemap／robots；404 與 legacy 排除 |
| Playwright E2E    | 44 項通過，四尺寸各 11 項                                                                                                |
| axe               | 18 個中英內容頁 × 四尺寸（72 次頁面分析），所測 WCAG 2A／AA、2.1A／AA、2.2A／AA tags 零 violations                       |
| 內部連結／anchors | 18 頁 × 四尺寸驗證，無缺漏                                                                                               |
| 視覺回歸          | 16 組相同 Windows／Chromium 完整頁面像素比較通過                                                                         |
| 截圖              | 94 張 V2 新截圖，另 2 張 V1 歷史網站圖                                                                                   |
| npm audit         | 0 vulnerabilities，含開發相依                                                                                            |

可重現的 JSON：[E2E 摘要](docs/evidence/v2/e2e-summary.json)、[視覺回歸](docs/evidence/v2/visual-regression.json)、[Lighthouse](docs/evidence/v2/lighthouse-summary.json)、[截圖索引](docs/screenshots/v2/README.md)。

## E2E 覆蓋

1440×1000、768×1024、390×844、320×760。中英首頁、skip link、導航、作品技術篩選、案例 13 章、private／public 來源邊界、無假 Demo、文章分類／tags／空狀態／程式碼／閱讀導覽、語言保留案例與 query／翻譯章節錨點、手機 Enter／Tab／Escape／focus return、9 個舊路由、無效語系與真實 404、兩個模擬的成功／409／403、step／replay／reset、reduced motion、無 JS 閱讀、圖片 decode、console／資源錯誤、溢位、內部連結、無裝飾箭頭、聯絡空值。

單元保留 schema、日期、來源 SHA、private guard、metadata escaping 等原契約，新增 Locale path、鎖後重驗順序、權限拒絕未進交易、稽核回滾、完成步進上限與 UI source 箭頭限制。

## 發現與修復

第一輪 40 通過／4 失敗，同一根因：date-contracts 的 Shiki github-dark 註解 `#6a737d` 在深底只有約 3.04:1，不足一般文字 AA。改為建置 transformer 提高至 `#aab3bd`，不關閉或排除 axe；完整重跑後 44 通過。

像素回歸第一次完成比較後，輸出目錄尚未建立造成 ENOENT；補 mkdir，重新執行 16 組通過。這是報告輸出問題，沒有移除斷言。早期 sandbox 的 Chromium cache／loopback 不一致，最終使用既有主機 Chromium cache 與主機 loopback，沒有把連線失敗算成驗證成功。

Lighthouse 逐項報告另找到語言切換 accessible name 未完整包含可見「繁中」文字。即使 Accessibility 總分 100 仍須修正；已讓中英控制名稱包含可見文字，並把 axe 納入 WCAG 2.1 A／2.2 A tags，再完整回歸。

## Lighthouse 真實量測

Production 靜態產物、本機 loopback，其他瀏覽器測試結束後執行。Mobile 採 Lighthouse 預設模擬節流（CPU 4×），Desktop 為 1350×940、CPU 1×、40ms RTT／10240Kbps。可及性修正後，每條件最終量測一次，保留最後完整批次而不挑最高分；分數會受環境波動，非公開網路或真實使用者 Core Web Vitals。

| 頁面／條件            | Performance | Accessibility | Best Practices | SEO | LCP  | CLS |
| --------------------- | ----------: | ------------: | -------------: | --: | ---- | --- |
| 繁中首頁／mobile      |         100 |           100 |            100 |  63 | 0.9s | 0   |
| 英文首頁／desktop     |         100 |           100 |            100 |  63 | 0.2s | 0   |
| 繁中 BookFlow／mobile |          93 |           100 |            100 |  66 | 1.2s | 0   |

SEO 63／66 來自未知正式網域時刻意 noindex／robots 禁爬；沒有為分數建立假網址。正式網址輸出用 reserved `.test` 隔離 fixture 驗證，不是公開部署。完整 HTML／JSON 在 `docs/evidence/v2/`。V1 舊報告留在上一層，沒有覆寫成 V2 結果。

## 截圖與 pixel regression

在獨立終端啟動 preview 後，依序執行 `npm run screenshots`、目視檢視、`npm run test:visual`、`npm run lighthouse`。截圖涵蓋兩語全部 10 頁型與四尺寸、手機選單、兩個衝突結果與 AssetFlow 權限拒絕。

Pixel 比較 16 張：中英 × 桌面／手機 × 首頁／AssetFlow／BookFlow／Article。baseline 為本輪實際目視檢查的 screenshot，不是設計圖。每色頻差超過 12 才計差異，容許比率 0.1%；尺寸必須完全一致。換 OS／Chromium 要另審基準，不靜默覆蓋。Linux CI 跑功能、幾何／溢位、axe，不使用 Windows 字型 pixel baseline；不宣稱跨 OS 視覺完全一致。

## 公開與限制

`check:public` 掃描 Git 追蹤檔案的 env/local 與常見 secret pattern，是有界檢查，不是所有機密均不存在的證明。人工檢視 diff、公開身分、來源圖片與新截圖。沒有複製私人原始碼、環境檔、登入資料或第三方研究素材。

自動 axe 與 Lighthouse 100 不等於完整 WCAG 合規。未完成 Safari／Firefox、實體手機觸控、人工讀屏與專業英文母語審稿。正式 HTTP redirect、host 404、TLS、CDN、索引與公開網路效能必須部署後再測。本輪未部署，也未重跑兩個來源系統的後端測試。

GitHub Actions 必須以 PR 最新 head SHA 判斷，不能沿用 V1 的綠燈。最終遠端 run 與 PR 連結由交付回報提供；本機紀錄不冒稱 CI 成功。
