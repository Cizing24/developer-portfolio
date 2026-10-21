# Vercel 靜態部署

本次只準備設定與文件，**未部署 Production、未建立付費資源或購買網域**。Repository 的公開不等於網站已部署。

## 本機預覽

需求：Node.js 24（`.nvmrc` 固定開發驗證版 24.22.0）、npm。

```sh
npm ci
npx playwright install chromium
npm run verify
npm run preview
```

開啟 `http://127.0.0.1:4321/`。preview 讀取 `dist`；變更程式後需要重新 build。開發使用 `npm run dev`。

Windows 若已有舊 Node，不必更動其他專案，可用 nvm-windows 切換 Node 24，或在受控的本機 shell 使用專用 runtime。此開發環境的 `.local/runtime` 不在 Git 中，一般下載者不應依賴它。

## Vercel 匯入步驟

1. 以自己的 Vercel 帳號匯入 `Cizing24/developer-portfolio`，Root Directory 為 repository 根目錄。
2. Framework 選 Astro；Node.js 選 24.x；Install `npm ci`、Build `npm run build`、Output `dist`。
3. 設定 Preview／Production 環境分開。Preview 不設定 SITE_URL，保持 noindex。
4. 先取得 Vercel 實際分配的 HTTPS 網址或自行擁有的網域，再將 **Production** `SITE_URL` 設為該 origin，格式 `https://` 加真實網域，不含子路徑、query 或 fragment。
5. 重新建置讓網址寫入靜態產物。不要把範例或本機網址設為正式設定；沒有真實網址時先保留 noindex。
6. 部署成功後依下列清單驗證。這些是部署後待執行工作，不能以本機結果代替。

不需要 Vercel adapter，因為輸出是純靜態。`vercel.json` 指定 dist、trailing slash、基本安全 headers 與 hashed asset 長期快取。未知路由由 `404.html` 處理，沒有將所有路由 rewrite 為首頁。

官方依據：[Astro 靜態部署](https://docs.astro.build/en/guides/deploy/vercel/)、[Vercel 支援 Node.js 24.x](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)。平台會選擇可用的 24.x patch，不保證與本機 patch 完全相同。

## 部署後驗收

- 首頁、兩個案例、兩篇筆記與 Contact 均可讀，錯誤路由 HTTP 404。
- 真實 origin 的 canonical、og:url、og:image 與 JSON-LD 一致。
- `/og.png` 200，社群平台預覽可讀；社群快取需另等候或重新抓取。
- `/robots.txt` 允許爬取並指向正確 `/sitemap-index.xml`。
- sitemap 含公開內容，不含 404 或草稿。
- 桌面／手機導覽、圖片、theme 與 focus 正常；沒有 console errors。
- TLS、headers、快取、公開存取與 Vercel Logs 正常。
- 對真實公開網址重新執行 Lighthouse。loopback 結果不代表 CDN 或真實網路分數。

## 回滾與更新

更新內容透過 PR，CI 成功後合併 main。Vercel 部署與環境更新由擁有者依自己的 Git integration 決定。若發布後異常，從 Vercel Deployments 回復上一個已驗證部署；若是錯誤程式，使用正常 revert commit，不覆寫 main 歷史。

此網站沒有資料庫或 migration。回滾不涉及業務資料，但 SITE_URL 改變仍需重新建置，不能只在 runtime 修改。切換網域後也要驗證舊網址 redirect 與搜尋索引。

## 正式公開前使用者應補充

可直接使用 Cizing24 作公開名稱。真實姓名、個人介紹、Email、LinkedIn、履歷與客製網域均為選填；未提供時不顯示假的入口。若補履歷，請先審核願意公開的個資。

權限、機密與付費設定由擁有者掌握，本 repository 不需任何 runtime secret。
