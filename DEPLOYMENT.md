# V2 靜態部署交接

**本輪沒有部署、買網域或建立付費資源。** GitHub PR 與本機 preview 均不代表公開網站已上線。沿用純靜態 `dist`，沒有資料庫 migration 或 runtime secrets。

## 本機

Node.js 24、npm：`npm ci`、`npm run verify`、`npm run preview`。開啟 `http://127.0.0.1:4321/zh-tw/` 與 `/en/`。變更後要重新 build；預覽讀取 dist。Windows 可以使用 npm.cmd／npx.cmd。

此環境專用 `.local/runtime` 不提交；一般下載者使用 Node 24 即可。若 Chromium 安裝在另一使用者 cache，可在 shell 指定真實 `PLAYWRIGHT_BROWSERS_PATH`，不要將本機路徑寫入專案設定。

## 正式與預覽環境

Preview 不設定 SITE_URL：全頁 noindex、robots Disallow、不輸出假 canonical 或 sitemap。Production 在取得本人控制的真實 HTTPS origin 後設定 SITE_URL，再重新 build。不能用 GitHub repo URL 或虛構網域替代正式身分。

`vercel.json` 保留 Astro Build、dist、trailing slash、安全 headers 與 hashed asset 快取；新增 9 個 V1 permanent redirects。這是準備好的設定，未執行遠端驗證，也不代表本輪選定必須使用 Vercel。Cloudflare Pages／VPS 部署均不在本輪範圍。

## 正式部署前

1. 驗收並合併本輪 PR（本輪不自動合併）。
2. 由本人決定 hosting、網域、可公開身分與聯絡資料。
3. 在預覽環境確認兩語內容、實際產品素材與英文文意；保持 noindex。
4. 設定真實 SITE_URL，重新驗證 canonical、hreflang、sitemap、robots 與 OG。
5. 配置 host 的 permanent redirects 與 404；不要將未知路徑 rewrite 為首頁。一般靜態 host 的轉址頁 meta refresh 不能取代正式 HTTP redirect。
6. 部署授權後才上線；驗證 TLS、CDN、headers、快取、實際 HTTP 301／308／404、語系 fallback、社群預覽與公開 Lighthouse。

正式 host 若支援按語系指定 404 文件，優先使用 `/en/404/index.html`、`/zh-tw/404/index.html`；不支援時通用 404.html 有明確雙語回復入口，JS 依 URL 前綴調整介面。此部署契約需公開環境再驗收。

## 回滾

使用 host 既有可回復的前一個驗證部署；程式用正常 revert commit，不覆寫 main 或 force push。更動 SITE_URL 必須重建靜態產物。回滾不涉及業務資料，因本網站沒有後端資料庫。

## 限制

本機 Lighthouse 只代表 Windows loopback 靜態產物；不代表真實網路 Core Web Vitals。Safari／Firefox、人工讀屏、實機與公開索引仍需後續。原有產品均未公開部署，網站不得自行新增 Live Demo。
