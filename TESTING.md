# 測試與實測紀錄

日期：2026-10-22（Asia/Taipei）。以下僅計入 Developer Portfolio 本身，沒有將 AssetFlow 或 BookFlow 的原專案測試數量算入。

## 環境與指令

Windows、專案專用 Node 24.22.0、npm 10.9.8、Astro 7.4.2、Playwright 1.64.1 Chromium。正式靜態 Build 由 Astro preview 在 loopback 4321 提供，非 dev server。

```sh
npm ci
npx playwright install chromium
npm run verify
```

verify 包含 Lint、Format、Astro Check、Unit、Build、SEO 契約與 E2E。CI 亦安裝 Linux Chromium 系統相依、執行 audit，並保留瀏覽器報告作 artifact。結果需核對實際 commit，不以歷史綠燈代替。

## 本機結果

| 檢查             | 結果                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| ESLint           | 零錯誤、零警告                                                                                       |
| Prettier         | 全部納入檢查的來源與文件格式一致；原生工具報告不重新格式化                                           |
| Astro Check      | 0 errors／0 warnings／0 hints                                                                        |
| Vitest           | 24 項通過                                                                                            |
| Production Build | 10 頁成功，另輸出 robots、資產與多尺寸 WebP                                                          |
| SEO contract     | 預覽 noindex／無假 canonical；隔離 fixture canonical／OG PNG／Article／sitemap／robots／404 排除成功 |
| Playwright       | 24 項通過，桌面／平板／手機各 8 項                                                                   |
| axe              | 已測主要頁面 WCAG 2 A／AA、2.1 AA、2.2 AA tags 為零 violations；另測淺色 Contact                     |
| npm audit        | 0 vulnerabilities（含開發相依）                                                                      |
| 實際截圖         | 6 張，逐張目視檢查，見 docs/screenshots                                                              |

單元覆蓋內容 schema、私人來源公開邊界、URL、真實曆日、來源 SHA、草稿、排序、中文閱讀時間、metadata escaping、canonical 與 site URL 驗證。

瀏覽器覆蓋首頁、主要導覽、skip link、技術篩選、兩個 13 章案例、來源連結邊界、分類／tags／空結果、文章程式碼、目錄、閱讀導覽、手機選單／Escape、主題持久化、無效路由 HTTP 404、站內連結與錨點、圖片 decode、console／資源錯誤、水平 overflow、reduced-motion 與真實聯絡入口。最後另補 localStorage 不可用時的主題操作，並在最終回歸確認。

E2E 視窗：Desktop Chrome 1280×720、tablet 768×1024、Pixel 7 模擬手機。沒有宣稱實體手機或 Safari／Firefox 已驗證。

## 發現與修復

1. 初始 Astro 6／MDX 5 相依出現已公告漏洞，升級相容穩定版本；剩餘 esbuild low 採相容修補，最終 audit 0，未 force 降版或忽略公告。
2. 第一輪 Typecheck 發現測試圖片 locator 的元素型別過寬，加入 HTMLImageElement 檢查後通過。
3. 第一輪 E2E 21 通過／3 失敗，精確 label locator 包含 select 子內容；改成明確 for／id 關聯，保留斷言，原情境三裝置通過，再完整 24 項通過。
4. Lighthouse 找到品牌連結可見文字與 accessible name 不一致；移除覆寫名稱，保留真實文字及隱藏首頁文字，重測不再出現該項。
5. Windows chrome-launcher spawn 失敗，改為同一 Playwright Chromium 的 CDP 連線，未捏造分數。

## Lighthouse

實際工具 Lighthouse 13.5.0，Playwright Chromium headless，Windows 本機 loopback 的 Production 靜態產物；手機使用 Lighthouse 預設 simulated throttling／CPU 4×，桌面使用 1350×940、CPU 1×、40ms RTT／10240Kbps。每個條件最終測一次；不同執行曾有波動，以下保留最後完整測量而非挑最高分。

| 頁面／條件            | Performance | Accessibility | Best Practices | SEO | LCP  | CLS |
| --------------------- | ----------: | ------------: | -------------: | --: | ---- | --- |
| 首頁／mobile          |          90 |           100 |            100 |  63 | 0.9s | 0   |
| 首頁／desktop         |         100 |           100 |            100 |  63 | 0.3s | 0   |
| BookFlow 案例／mobile |          89 |           100 |            100 |  66 | 1.1s | 0   |

SEO 的 is-crawlable 失敗是未設定真實 SITE_URL 時的刻意 noindex 與 robots 禁爬。沒有為了取得分數公開假網域。設定網址的 SEO 輸出已以 reserved `.test` fixture 驗證，但不是正式部署實測。手機案例 TBT 約 460ms，需於真實部署與固定環境再量測，不能把本機結果等同真實使用者 Core Web Vitals。

完整報告：

- [摘要與條件 JSON](docs/evidence/lighthouse-summary.json)
- [手機首頁 HTML](docs/evidence/lighthouse-home-mobile.html)
- [桌面首頁 HTML](docs/evidence/lighthouse-home-desktop.html)
- [手機案例 HTML](docs/evidence/lighthouse-case-mobile.html)

Lighthouse 與 axe 均不能證明完整 WCAG 合規；人工讀屏、所有鍵盤情境、真實裝置、跨瀏覽器與正式公開網路仍需後續驗收。

## 重新產生證據

先 `npm run build`，另一個終端啟動 `npm run preview`，再執行：

```sh
npm run screenshots
npm run lighthouse
```

請不要讓多個 Playwright 測試同時寫入同一 test-results；Lighthouse 亦應在其他測試結束後量測，降低資源競爭。腳本會正常關閉自己建立的瀏覽器。

## 公開檔案檢查

`npm run check:public` 掃描 Git 追蹤檔案，拒絕 `.local`／環境檔與常見 token、private key pattern。這是有界掃描，不能證明所有可能機密均不存在。另人工檢查兩張來源圖片、六張網站截圖、設定與 diff。來源程式、環境檔與 credential helper 均不公開。

## 遠端 CI

`.github/workflows/ci.yml` 在功能分支 push、PR 與 main push 執行。實際 run URL、SHA 與合併結果將由交付報告讀回 GitHub 確認；未有結果前不宣稱遠端成功。
