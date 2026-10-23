# 最終完整自動化驗證（橫向修正後）

重新執行完整 `npm run verify`，並補齊公開檔案、套件弱點、現行 V3 像素比對與三種條件的效能量測。下方 48 項與 92 項紀錄保留為歷史結果，這次另存 [最終摘要](docs/evidence/studio/final/summary.json)。

| 項目                           | 本次實際結果                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| ESLint / Prettier / TypeScript | 通過                                                                                                |
| Astro Check                    | 0 errors / 0 warnings / 0 hints                                                                     |
| 單元測試                       | 33 通過                                                                                             |
| 完整瀏覽器回歸                 | 96 通過、0 失敗、0 跳過、0 flaky；約 7.0 分鐘                                                       |
| 內容與 SEO                     | 中英文、來源與私人邊界通過；18 個語系頁的 SEO fixture 通過                                          |
| 建置                           | 30 個靜態頁面成功；Three.js 大型 chunk 提示仍保留                                                   |
| 現行 V3 視覺比對               | 九張通過；超出每色頻 12 容許值的差異均為 0，未覆寫基準                                              |
| 套件弱點檢查                   | npm audit 回報 0 個已知弱點                                                                         |
| 公開檔案檢查                   | 已追蹤與未忽略的新增檔案均納入常見機密樣式檢查，結果見 public-scan.json；不是所有機密均不存在的保證 |

瀏覽器覆蓋桌面、平板、手機與窄螢幕四個專案，以及七組直橫向切換尺寸。包括六島導航、搜尋空狀態、日夜、人物入口、同頁閱讀、語言、返回、WebGL 備援、context loss、動態暫停、快速切島、單指與雙指手勢、無 JS 內容、圖片／連結／錨點與自動 axe。這些是 Chromium 測試，不是全部瀏覽器或實機通過的宣告。

視覺比對沿用手機橫向修正後的九張既有截圖，先核對 SHA-256，再以同一台 Windows 的 Playwright Chromium channel 重建。原始清單未記錄 browser 版本，因此不宣稱原清單已有版本鎖定；本次版本已寫入結果。`scripts/visual-regression.mjs` 的 V2 基準屬舊設計，未以它冒稱 V3 通過，也沒有為通過而更新舊基準。現行比對另存 [V3 視覺結果](docs/evidence/studio/final/visual-regression.json)。

## 本次三種效能條件

| 條件         | Performance | Accessibility | Best Practices | SEO | LCP   | CLS   |
| ------------ | ----------: | ------------: | -------------: | --: | ----- | ----- |
| home-mobile  |          73 |           100 |            100 |  63 | 2.6 s | 0     |
| home-desktop |          97 |           100 |            100 |  63 | 0.6 s | 0.008 |
| case-mobile  |          97 |           100 |            100 |  66 | 1.2 s | 0     |

本批在功能與視覺測試全部結束後依序執行，每個條件一次，保留三個完整 HTML／JSON 報告；未挑最高分或覆寫前一批手機 72 分的紀錄。本機 loopback、Lighthouse 13.5.0／Chromium；mobile 採預設模擬 CPU 4×、約 1.6Mbps，desktop 為 1350×940、CPU 1×、40ms RTT／10240Kbps。完整設定與失敗項目保留於 [本批摘要](docs/evidence/studio/final/performance/lighthouse-summary.json)。

本次手機首頁 TBT 約 1154 ms，首次建立 3D 場景仍有長時間主執行緒工作。效能分數不是低階手機順暢、FPS、續航或發熱的證明。SEO 63／66 來自預覽索引限制，未為分數移除 noindex。Accessibility 100／axe 通過不等於完整 WCAG 合規。

尚未由本輪自動化驗證實體 iPhone／Android、Safari／Firefox、人工讀屏、GPU／發熱／耗電或公開網路效能。沒有部署正式環境、執行遠端 CI，或重跑兩個來源產品的後端測試。

---

# 手機補測與橫向修正 · 2026-10-23

本次是 Chromium 的手機尺寸、觸控與效能模擬；沒有實體 iPhone／Android 連線工具，不能將結果寫成實機或 Safari 驗證。已另外準備區域網路 preview，供同 Wi-Fi 的手機手動測試，沒有部署正式環境或修改防火牆。

發現並修正：手機橫放時，原本 480px 最低高度使底部六個操作按鈕全部落在畫面外。場景改用動態 viewport 高度；短橫向版面縮減控制區、使用寬版島嶼配置及合適相機距離，側欄與閱讀框保留各自捲動。直向窄螢幕搜尋欄採 16px 文字；iOS 軟鍵盤與縮放仍須實機確認。

| 項目              | 實際結果                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| 手機／窄螢幕回歸  | 48 通過，0 失敗、0 跳過、0 flaky；約 3.1 分鐘                                                  |
| 尺寸切換          | 320×568、360×640、430×932、844×390、667×375、390×620、390×844；控制留在畫面內，閱讀框可捲動    |
| 視覺／axe 補測    | 三種尺寸 × 主畫面／選單／閱讀框，共九個狀態零 violations、無 pageerror、無頁面溢位；九張新截圖 |
| 靜態檢查          | ESLint、TypeScript、格式與建置通過；30 個靜態頁面                                              |
| Lighthouse        | Performance 72 / Accessibility 100 / Best Practices 100 / SEO 63                               |
| 載入指標          | FCP 1.4 秒、LCP 2.6 秒、TBT 1,220 ms、CLS 0                                                    |
| 3D 初始化獨立探針 | 可操作狀態訊號約 2.57 秒；無 pageerror                                                         |
| 區網 HTTP         | 本機使用 Wi-Fi 位址回應 200；非安全來源的剪貼簿備援輸入框可用。手機端的網路連通仍待手動確認    |

Lighthouse 13.5.0 使用預設 mobile 模擬：412×823、CPU 4×、150ms RTT、約 1.6Mbps；只量測一次並保留全部結果。獨立場景探針為 390×844、CDP CPU 4×、150ms latency、200,000 bytes/s download，使用新的 browser context。兩者方法不同，不混寫為同一次或相同指標。使用本機 Chromium／軟體 WebGL，不代表實體手機 GPU、公開網路速度、FPS、續航或發熱。

3D 程式的最長主執行緒工作在 Lighthouse 約 1.27 秒，初始化仍有改善空間。Performance 72 不代表低階手機已足夠順暢，Lighthouse 的 LCP 也不是完整 3D 顯示時間。SEO 63 仍是預覽的 noindex 設定；未為分數開啟正式索引。自動 Accessibility 100／axe 通過不等於完整 WCAG 合規。

證據：[48 項回歸](docs/evidence/studio/mobile/regression-summary.json)、[Lighthouse 摘要](docs/evidence/studio/mobile/lighthouse-summary.json)、[完整報告](docs/evidence/studio/mobile/lighthouse.html)、[場景探針](docs/evidence/studio/mobile/scene-load.json)、[視覺與區網檢查](docs/evidence/studio/mobile/visual-checks.json)。下方 92 項紀錄為本次橫向修正前的完整四尺寸回歸，沒有把這次 48 項寫成新一輪完整 96 項。

---

# 六島與日夜增強歷史驗證 · 2026-10-23

本次包含透明頁首、獨立圓形時段控制、六座固定島嶼、右側搜尋清單、個人角色與平順過場。下方各版紀錄依實際執行分開，沒有沿用歷史通過數作為本次結果。

| 項目              | 本次實際結果                                         |
| ----------------- | ---------------------------------------------------- |
| ESLint / Prettier | 通過                                                 |
| Astro Check       | 0 errors / 0 warnings / 0 hints                      |
| TypeScript        | 通過                                                 |
| Vitest            | 33 通過                                              |
| 內容契約          | 中英文配對、來源版本、私人來源與共用產品介紹通過     |
| Build / SEO       | 30 個靜態頁面；18 個語系頁的 SEO fixture 通過        |
| Playwright / axe  | 完整 92 項通過、0 失敗、0 跳過、0 flaky，約 7.4 分鐘 |

覆蓋 1440×1000、768×1024、390×844、320×760；包括透明頁首及圓形按鈕、六島入口、右側搜尋／空狀態、四時段、人物入口、同頁內容、深連結與語言、返回、WebGL 備援與 context loss、動畫暫停、快速連點過場與單指／雙指觸控。各語系內容頁、四時段與主要閱讀面板執行自動 axe，所測狀態零 violations。

可查閱 [本次驗證摘要](docs/evidence/studio/six-island-regression-summary.json)。

執行方式：`npm run verify`。Playwright 以兩個 worker 執行，避免多個 WebGL 場景同時競爭主機 GPU；所有功能與 axe 斷言均保留。一般功能用 reduced motion，專門的動態測試明確恢復動畫，驗證人物／環境會移動、暫停後像素固定，以及快速切島可中斷相機過場。暫停比較前等待控制按鈕的 hover 過場結束，避免把按鈕變色誤判為場景移動。

25 張本版正式建置截圖已完成，五個尺寸／語系組合均未觀察到 pageerror 或頁面溢位。結果見 [截圖檢查摘要](docs/evidence/studio/six-island-screenshots.json)。

截圖可用 `node scripts/capture-world.mjs` 在 preview 啟動後重建。包含中英文、四尺寸、閱讀框，以及桌面／手機的清晨、夕陽、晚上、清單與個人角色。SHA-256 與狀態記錄於 `docs/screenshots/studio/manifest.json`。

沒有部署、合併、CI 或來源專案後端測試。尚未執行實體手機、Safari／Firefox、人工讀屏、V3 Lighthouse、公開網路或電池量測。自動 axe 通過不代表完整 WCAG 合規。Three.js 動態載入 chunk 仍有超過 500 kB 的建置提示。

---

# V3 前一版驗證 · 2026-10-23

此段是六島與日夜增強前的歷史紀錄；舊截圖清單已由現行版本更新。下方 V2 結果不代表 V3 效能或畫面。

| 項目                | 本輪實際結果                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------- |
| ESLint / Prettier   | 通過                                                                                        |
| Astro Check         | 0 errors、0 warnings、0 hints；已排除產生的 browser report、trace 與 coverage，保留來源檢查 |
| TypeScript          | 通過，含最後的觸控控制修改                                                                  |
| Vitest              | 33 通過                                                                                     |
| 內容契約            | 中英文配對、來源版本與私人來源保護通過；兩個專案共用簡明產品介紹                            |
| Build / SEO fixture | 30 個靜態頁面建置成功；18 個語系頁的 canonical、alternate、OG 與 noindex 邊界通過           |
| 完整瀏覽器回歸      | 72 通過、0 失敗、0 跳過、0 flaky，約 2 分鐘                                                 |
| 最後觸控增強        | 另跑 4 項單指／雙指 CDP 觸控測試，4 通過；修改後另執行 lint、typecheck、build               |
| 截圖                | 15 張正式建置實際畫面，含中英文、四種尺寸、探索與閱讀框，均未觀察到 pageerror 或水平溢位    |
| 公開檔案掃描        | 210 個已追蹤檔案的有限 secret pattern／env 檢查通過；不涵蓋所有未知機密形式                 |

完整回歸執行於最後觸控增強前；觸控增強後的四項測試另外保存，沒有把兩次執行寫成同一次 76 項完整測試。兩份摘要位於 `docs/evidence/studio/`。截圖與 SHA-256 清單位於 `docs/screenshots/studio/manifest.json`。

覆蓋尺寸：1440×1000、768×1024、390×844、320×760。涵蓋三個專案主題、同頁閱讀、返回與重新整理、中英文切換、焦點與鍵盤、無 JS 閱讀、WebGL 無法使用及 context loss、人物／環境動態與暫停、手勢及原生閱讀捲動。一般測試使用 reduced motion；動態專用測試明確恢復動畫，以畫面變動及暫停後像素穩定性驗證。

本輪修正：平板側欄遮擋主題、手機相機控制遮擋指南、品牌按鈕可見名稱與 accessible name 不一致、純文字閱讀區缺少鍵盤焦點，以及原先不正確的雙指 OrbitControls 設定。未刪除無障礙規則或強制點擊被遮住的控制。

尚未執行 V3 Lighthouse、Safari／Firefox、實體觸控裝置、人工讀屏、公開網路速度或電池消耗量測。自動 axe 通過不等於完整 WCAG 合規。Three.js chunk 仍有超過 500 kB 的建置提示，未提高門檻隱藏。未部署、未宣稱 CI 通過，也未重跑來源專案後端測試。

---

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
