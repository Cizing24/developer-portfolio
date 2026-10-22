# Developer Portfolio V2 實作紀錄

日期：2026-10-22，Asia/Taipei。基線 main：`a210a26af0951f4d94ffbe3ffdfd455ee29f1ae1`。工作分支：`codex/portfolio-v2`。本輪不 merge、不部署、不修改兩個來源專案。

## Phase 1：完整視覺系統

暖紙／酒紅／襯線 token、1320px container、編輯報頭、24 旁註、不等欄且錯位的作品、圖像說明、期刊式筆記與聯絡 footer。首頁、About、Projects、Case、Notes、Article、Contact、404 全部改版。手機改閱讀順序與單欄，流程為 2 欄、320px 收縮 spacing。保留 focus、44px controls、skip、Escape 與 reduced motion。移除普通連結裝飾箭頭與原主題狀態。

## Phase 2：雙語

Astro 原生 i18n 配置、locale 靜態路由、型別字典、locale + translationKey collections。兩案例與兩文章完整翻譯，列表／導覽／metadata 一併本地化。語言切換查找真實配對，保留案例、query、對應章節；無對應內容不出現假入口。18 個正常內容頁、2 個語系 404、1 個通用 404、9 個 legacy 轉址，共 30 HTML 頁。

未知正式 SITE_URL 保留 noindex；隔離 fixture 驗證雙語 canonical、hreflang、x-default、sitemap、Article 與 OG。原路由轉址與 host 需求見 V2_MIGRATION。

## Phase 3：兩個工程模擬

`FlowSimulation.astro` 與 `simulations.ts`，無新增前端 runtime 或動畫套件。六步按鈕可直接探索、Next 依序前進；Replay 回第一步；Reset 回 0/6 與預設情境。結果 aria-live，情境選擇重設步驟，停用 JS 仍可展開文字順序。

BookFlow 的正常服務流程先取 Tenant lock，再重讀可用時段；衝突由鎖後重驗拒絕，GiST 另守資料庫不變條件。成功情境使用不重疊相鄰占用。

AssetFlow 先查當前角色，ADMIN／IT_STAFF 可寫入；VIEWER 403 直接拒絕。交易固定鎖 Employee、Asset 並重驗，領用、狀態與稽核同交易。並行後續請求讀到 ASSIGNED 回 409；拒絕不產生成功領用稽核。

來源唯讀核對 BookFlow docs/ARCHITECTURE.md、booking/service.ts；AssetFlow ARCHITECTURE.md、routes.ts、services/lifecycle.ts。既有 SOURCE_REVIEW 與查核 SHA 保留。所有展示明示合成前端模擬，並非即時 API／DB 測試。

## Phase 4：工程內容

中文正文保留完整 13 章，僅修正圖片相對路徑與語系連結；英文完整表達架構、資料模型、鎖、約束、稽核、安全、歷史測試與限制。雙層閱讀增強掃讀，不以摘要取代長文。原產品圖片保留，AssetFlow private guard 不變；BookFlow 真實公開連結保留；沒有假 Demo。

## Phase 5：驗證與交付

ESLint、Prettier、Astro Check、tsc、33 Unit、內容配對契約、SEO fixture、四尺寸 E2E／axe、內部連結與錨點、Production Build、實際全頁截圖、相同環境 pixel regression、Lighthouse。實際結果與限制見 V2_VALIDATION，不用 CI 綠燈取代目視驗收。

## 擴充

新增內容先補完整 locale 配對與來源查核；新增語言需更新 Locale、Astro i18n、字典、內容目錄、sitemap locale map 和測試矩陣，不直接複製中文到英文頁。流程新增情境以純函式與來源規則為基礎，優先單元測試拒絕、回滾等邊界，避免只測文字與程式一模一樣。

不需增加 SPA 或資料庫。若日後需要 live demo，應獨立定義服務權限、合成資料、流量／費用與部署授權，不能將本輪模擬擴稱正式後端。
