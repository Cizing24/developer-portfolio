# 技術與設計決策

## ADR-001：延續 Astro 靜態架構

沿用 Astro 7.4.2、TypeScript strict、Tailwind 4、Content Collections、MDX、Vitest、Playwright 與 GitHub Actions，不為改版重建 repository。沒有新增 React／Vue runtime、動態後端或大型動畫相依。原有來源測試證據與資產保留。

## ADR-002：A 70%／B 30%

採 A 的暖紙、酒紅、襯線與編輯節奏；B 僅提供可追蹤系統步驟與狀態，不引入另一套藍色品牌。C 不採用。從均勻雙卡改成不等欄，首頁先定位、作品，再用模擬說明工程問題。24 與 c. 沿用身分線索，沒有虛構人物背景。

## ADR-003：完整雙語，而非字典翻譯首頁

使用 Astro 原生 i18n 設定與 `[locale]` 靜態路由，字典管理 UI，locale／translationKey 配對完整內容。無第三方 i18n runtime。切換保留內容、query、翻譯後章節 hash，未知錨點移除。章節配對依順序，增加維護約束，以契約與 E2E 保護。

## ADR-004：模擬服務閱讀，不冒充後端

BookFlow 依 Tenant lock、鎖後重驗與 GiST；AssetFlow 依 RBAC、固定鎖順序、Serializable 與原子稽核。合成情境透過純函式得到各步驟狀態，原生按鈕與 select 操作，不執行 API。沒有自動播放；重播回第一步，避免動畫干擾閱讀與測試。

拒絕請求不假稱產生成功領用 AuditLog。GiST 是獨立資料庫防線，正常服務衝突可由鎖後時段重驗攔下，不把每個 409 都描述成約束錯誤。

## ADR-005：品牌底色與箭頭規則

V2 只提供暖紙品牌主題，移除原深淺切換與儲存邏輯，保留 reduced motion、keyboard 與 focus。普通連結使用文字與底線，不加裝飾方向圖示；技術內文保留有意義的資料流。

## ADR-006：未知網址持續 noindex

SITE_URL 仍驗證真實 HTTPS origin。未配置不產生假 canonical、hreflang 或 sitemap；配置後才產生對應雙語 SEO。reserved `.test` 僅用於隔離 fixture。404 與 legacy 不納入 sitemap。沒有為 Lighthouse SEO 分數解除 noindex。

## ADR-007：保留舊連結與靜態部署可攜性

舊 URL 輸出帶 meta refresh、真實連結及 query/hash 保留 script 的靜態轉址頁。Vercel 準備 HTTP permanent redirects，但不宣稱平台已上線。未知路由回真實 404。通用靜態 fallback 對 `/en/` 回復英語，無 JS 可使用雙語首頁入口。

## ADR-008：可重現的驗證與交付

原有 24 Unit 擴充為 33；原有 E2E 的閱讀、篩選、安全與聯絡邊界保留並擴充四尺寸雙語。axe 找到 Shiki 註解色對比不足，修正高亮 token 而不關閉測試。Pixel regression 比對相同 Windows／Chromium 已檢視基準；Linux CI 執行功能、版面與 axe，不假稱跨 OS 像素一致。

只 push 工作分支並建立 PR，禁止自動 merge 或部署。本輪不修改 BookFlow／AssetFlow repository、不新增付費資源。來源說明見 SOURCE_REVIEW；本輪結果見 V2_VALIDATION。
