# V2 驗收紀錄

2026-10-22，Asia/Taipei。基線 `a210a26af0951f4d94ffbe3ffdfd455ee29f1ae1`；分支 `codex/portfolio-v2`。結果僅代表本機 V2 與後續 PR 對應 CI；沒有正式部署、來源系統重測或招聘者可用性研究。

## Phase 1–5

| 階段       | 交付                                                                            | 驗證                                       |
| ---------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| 1 視覺     | 暖紙、酒紅、襯線、編輯報頭、不等欄作品、案例閱讀、所有頁型與手機版              | 四尺寸瀏覽器、全頁截圖、目視與像素基準     |
| 2 i18n     | 兩語完整 18 內容頁、2 語系 404、通用 404、舊路由轉址、metadata                  | 語言／hash E2E、內容配對與 SEO fixture     |
| 3 互動     | BookFlow、AssetFlow 六步模擬，成功／409／403、重播／重設                        | 兩語四尺寸，滑鼠與鍵盤斷言、無 JS 文字等價 |
| 4 工程內容 | 每語兩案例各 13 章、兩完整文章、真實產品圖、private guard                       | schema、章節數、版本一致、來源唯讀核對     |
| 5 品質     | Lint／Format／Check／tsc／Unit／E2E／axe／Build／SEO／links／visual／Lighthouse | 詳見 TESTING 與原始 JSON                   |

## 真實執行結果

33 Unit、44 E2E 通過；18 頁 × 四尺寸 axe 零 violations。Astro Check 0 errors／warnings／hints，TypeScript、ESLint、Prettier、Build、內容契約與 SEO fixture 通過。npm audit 0 vulnerabilities。

Production Build 30 頁：18 正常雙語內容 + 2 語系 404 + 1 通用 404 + 9 legacy。共 94 張 V2 新截圖，另 2 張 V1 歷史網站圖。16 組 Windows／Chromium 目視基準像素比較通過。截圖 SHA-256 與實際流程結果見 `screenshots/v2/`。

Lighthouse：繁中手機首頁 100／100／100／63、英文桌面首頁 100／100／100／63、繁中手機 BookFlow 93／100／100／66（Performance／Accessibility／Best Practices／SEO）。LCP 0.9／0.2／1.2s，CLS 均 0。SEO 扣分對應刻意 noindex，不造假網址。完整設定與未通過 audits 保存於 `evidence/v2/lighthouse-summary.json`。

本機建置的唯一外部流程 JS 資產約 6.8KB、gzip 約 3.3KB；另有少量內嵌選單／語言 script。此為檔案壓縮計算，未把它當成伺服器傳輸量或 INP 實測。未新增 runtime 相依。

## 視覺驗收

檢視桌面完整首頁、繁中／英文手機首頁、320px 英文 BookFlow、手機 AssetFlow 實際衝突結果，以及其他頁面的縮圖與段落畫面。作品閱讀順序、圖片比例、手機導覽、文字換行、章節索引、流程狀態與按鈕可讀；自動化亦檢查四尺寸全部內容頁無水平溢位。

首頁從 V1 的深色均勻雙卡轉為暖紙上的編輯敘事。手機清除桌面作品高低落差與側欄，2 欄步驟按閱讀順序排列。全文預設可見，不依賴 scroll reveal。品牌 favicon 與 OG 同步暖紙／酒紅。

一般 link／button 已無裝飾箭頭；E2E 檢查可見控制文字，Unit 檢查 UI source、icon 名稱與 CSS 偽元素。技術正文保留有資訊意義的資料流／關係箭頭。

## 實際流程結果

- BookFlow 衝突：A 取 Tenant lock，鎖後重驗、GiST 保護下提交；B 隨後重新讀到占用回 409。另有不重疊相鄰時段成功情境。
- AssetFlow 衝突：IT_STAFF 允許，Employee／Asset 取鎖重驗、領用與稽核同交易提交；後續重複領用回 409。
- AssetFlow VIEWER：權限檢查 403，未進生命週期交易、不建立領用稽核、AVAILABLE 不變。

以上是瀏覽器流程模擬結果，不是後端效能、授權或並行測試證據。案例中的來源歷史測試另外明示。

## 發現與修復

初次 E2E 的 4 個失敗為同一 Shiki 註解色對比問題，已調整 token，完整回歸 44 通過，未降低檢查。視覺比較的首次輸出缺少目錄，補 mkdir 後完整重跑通過。早期 sandbox cache／loopback 問題未被計為成功。

Lighthouse 逐項另找到語言切換可見文字與 accessible name 不一致（未反映於總分），已修正並擴充 WCAG 2.1 A／2.2 A 回歸；不以總分替代逐項稽核。

## 尚待確認

未部署，正式網域、TLS／CDN、HTTP permanent redirects、host 的語系 404、搜尋索引與公開 Lighthouse 待下一階段。Safari／Firefox、真實觸控、人工讀屏、母語英文審稿與招聘者任務測試未執行。Pixel 基準只適用本輪 Windows／Chromium；Linux CI 功能驗證獨立。

GitHub PR 最新 head 的 CI 必須成功才交付，結果以最後交付訊息附的 PR／run／SHA 為準；此文件不將本機結果冒稱遠端 CI。不自動 merge main。
