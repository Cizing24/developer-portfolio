# 技術決策

## ADR-001：Astro 靜態輸出

需求以內容、SEO 與可讀案例為主，選擇建置時產生 HTML。相較 Next.js SSR 或完整 SPA，Astro 不需要 server 或 hydration runtime，部署面更小。若未來有動態資料需求，應先評估是否能建置時抓取，避免為少量功能加入後端。

## ADR-002：穩定且已修補的相容版本

初始 Node 22.23.1 可執行 Astro 6.4.8，但 npm audit 發現 Astro critical、sharp high 與 MDX moderate。沒有忽略公告或 force fix，改採專案內 Node 24.22.0、Astro 7.4.2、MDX 8.1.1。ESLint 10 配合 Astro plugin 3 的 peer requirement。最終保留精確直接版本與 package-lock，`npm ci` 重現安裝。

本機專用 Node 放 ignored `.local/runtime`，沒有改寫全機 Node。一般使用者安裝 Node 24 即可，不依賴這個內部路徑。已棄用的上游工具提示與安全漏洞分開處理；安裝有 OpenTelemetry 上游 deprecated 提示，未隱藏輸出，audit 仍需獨立驗證。

## ADR-003：Content Layer + Zod

使用 `src/content.config.ts`、`glob()` 與 `render()`，依官方目前 Content Collections API。Markdown／MDX 比付費 CMS 更貼近工程師 Git workflow；schema 驗證日期、技術標籤、圖片與證據 SHA。private repository 禁止公開 source link。

不引入資料庫、管理後台或內容 API。作者需信任，MDX 可以執行元件；若未來開放外部投稿需另設隔離審核流程。

## ADR-004：Tailwind 4 + 語意 CSS token

依官方 Astro 指南使用 `@tailwindcss/vite`，不用已過時的 `@astrojs/tailwind`。品牌 token 與版面樣式集中 global.css，少量 utility 用於無障礙等情境，避免每頁重複長 class 字串。

## ADR-005：原生互動與系統字型

原生 DOM script 處理主題、選單、篩選；沒有僅為三個互動導入 React/Vue。系統字型減少網路請求與字型位移，也避免無法保證涵蓋繁體中文字形的遠端字型。對外觀的取捨是不同 OS 字型略有差異。

## ADR-006：未知正式網址不自動猜測

空 SITE_URL 的預覽不索引；不以 GitHub repository URL 或虛構 Vercel domain 作 canonical。真實 HTTPS origin 才啟用 sitemap。SEO fixture 使用保留 `.test` origin，產物不追蹤、不部署。Lighthouse 對 noindex 的扣分如實記錄。

## ADR-007：案例與來源測試分開

兩個案例以實際文件與來源程式查核撰寫；原系統的測試結果標明日期與來源，不算入本網站測試。私人程式只公開重新撰寫的摘要與經檢查的合成資料截圖。未公開部署就不顯示 Demo 按鈕。

## ADR-008：公開 repository、PR 與正常合併

只建立新的 developer-portfolio public repository，保留來源可見性。main 初始提交後由功能分支分階段開發，PR 在 CI 成功後正常合併，不 force push、不跳過檢查。GitHub auth 在記憶體中透過既有 credential manager 使用，工具不寫入公開檔案。

## 官方依據

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro 7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Astro static deployment to Vercel](https://docs.astro.build/en/guides/deploy/vercel/)
- [Tailwind CSS Astro integration](https://tailwindcss.com/docs/installation/framework-guides/astro)
- [Playwright CI](https://playwright.dev/docs/ci-intro)

查詢日期 2026-10-22，版本以實際 registry、lockfile、建置與測試結果為準。
