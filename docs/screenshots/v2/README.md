# V2 真實瀏覽器截圖

2026-10-22；Windows、Playwright Chromium、Astro Production 靜態產物。V2 有 94 張新擷取 PNG，另有 2 張 V1 歷史截圖供比較。不是設計探索原型。`manifest.json` 記錄網址、尺寸與實際流程結果；`files.sha256.json` 記錄全部 PNG 的雜湊。

| 頁面      | 繁中桌面                               | 英文桌面                            | 繁中手機                              | 英文手機                           |
| --------- | -------------------------------------- | ----------------------------------- | ------------------------------------- | ---------------------------------- |
| 首頁      | [開啟](zh-tw-home-desktop.png)         | [開啟](en-home-desktop.png)         | [開啟](zh-tw-home-mobile.png)         | [開啟](en-home-mobile.png)         |
| Projects  | [開啟](zh-tw-projects-desktop.png)     | [開啟](en-projects-desktop.png)     | [開啟](zh-tw-projects-mobile.png)     | [開啟](en-projects-mobile.png)     |
| AssetFlow | [開啟](zh-tw-assetflow-desktop.png)    | [開啟](en-assetflow-desktop.png)    | [開啟](zh-tw-assetflow-mobile.png)    | [開啟](en-assetflow-mobile.png)    |
| BookFlow  | [開啟](zh-tw-bookflow-desktop.png)     | [開啟](en-bookflow-desktop.png)     | [開啟](zh-tw-bookflow-mobile.png)     | [開啟](en-bookflow-mobile.png)     |
| Notes     | [開啟](zh-tw-notes-desktop.png)        | [開啟](en-notes-desktop.png)        | [開啟](zh-tw-notes-mobile.png)        | [開啟](en-notes-mobile.png)        |
| 預約文章  | [開啟](zh-tw-article-desktop.png)      | [開啟](en-article-desktop.png)      | [開啟](zh-tw-article-mobile.png)      | [開啟](en-article-mobile.png)      |
| 日期文章  | [開啟](zh-tw-date-article-desktop.png) | [開啟](en-date-article-desktop.png) | [開啟](zh-tw-date-article-mobile.png) | [開啟](en-date-article-mobile.png) |
| About     | [開啟](zh-tw-about-desktop.png)        | [開啟](en-about-desktop.png)        | [開啟](zh-tw-about-mobile.png)        | [開啟](en-about-mobile.png)        |
| Contact   | [開啟](zh-tw-contact-desktop.png)      | [開啟](en-contact-desktop.png)      | [開啟](zh-tw-contact-mobile.png)      | [開啟](en-contact-mobile.png)      |
| 404       | [開啟](zh-tw-404-desktop.png)          | [開啟](en-404-desktop.png)          | [開啟](zh-tw-404-mobile.png)          | [開啟](en-404-mobile.png)          |

同名 `-tablet.png` 是 768×1024，`-small-mobile.png` 是 320×760；desktop 是 1440×1000，mobile 是 390×844，全部為 fullPage，實際圖高依內容延伸。

## 實際互動結果

- [BookFlow 桌面：成功與 409](zh-tw-bookflow-result-desktop.png)、[手機](zh-tw-bookflow-result-mobile.png)。
- [AssetFlow 桌面：成功與 409](zh-tw-assetflow-result-desktop.png)、[手機](zh-tw-assetflow-result-mobile.png)。
- [AssetFlow VIEWER 403](zh-tw-assetflow-denied-mobile.png)。
- [英文 BookFlow](en-bookflow-result-desktop.png)、[英文 AssetFlow](en-assetflow-result-desktop.png)、[英文拒絕](en-assetflow-denied-mobile.png)。
- [繁中手機導覽](zh-tw-navigation-mobile.png)、[英文手機導覽](en-navigation-mobile.png)。

這些是瀏覽器操作前端流程模擬後的畫面，不代表後端併發測試。成功、衝突、拒絕情境的互動斷言見 E2E。

## V1／V2 比較

| V1（已提交的歷史實際網站畫面） | V2（本輪重新擷取）             |
| ------------------------------ | ------------------------------ |
| [桌面](v1-home-desktop.png)    | [桌面](zh-tw-home-desktop.png) |
| [手機](v1-home-mobile.png)     | [手機](zh-tw-home-mobile.png)  |

V1 來自原 `docs/screenshots/home-desktop.png` 與 `home-mobile.png`，沒有宣稱本輪重新建置或截取 V1。V2 沒有使用任何探索原型截圖。主要差異：深底均勻卡片轉為暖紙編輯構圖；加入完整雙語、閱讀分層與資訊型互動；普通連結不再附裝飾箭頭。

## 重現與視覺基準

先 `npm run build`，開啟 preview，再 `npm run screenshots`。先目視檢查再執行 `npm run test:visual`，不可用覆蓋基準來掩蓋回歸。Windows 系統字型與相同 Chromium 版本才適用這份 pixel 基準，Linux CI 的功能、溢位與 axe 另外驗證。
