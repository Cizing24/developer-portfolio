# V1 → V2 遷移

沿用同一 repository、Astro／TypeScript／Tailwind／Content Collections、兩個來源案例與產品圖、既有工程證據。沒有資料庫 migration、沒有來源專案變更。

## 路由對照

| V1                            | V2 繁中                             | V2 英文                          |
| ----------------------------- | ----------------------------------- | -------------------------------- |
| `/`                           | `/zh-tw/`                           | `/en/`                           |
| `/about/`                     | `/zh-tw/about/`                     | `/en/about/`                     |
| `/projects/`                  | `/zh-tw/projects/`                  | `/en/projects/`                  |
| `/projects/assetflow/`        | `/zh-tw/projects/assetflow/`        | `/en/projects/assetflow/`        |
| `/projects/bookflow/`         | `/zh-tw/projects/bookflow/`         | `/en/projects/bookflow/`         |
| `/notes/`                     | `/zh-tw/notes/`                     | `/en/notes/`                     |
| `/notes/booking-consistency/` | `/zh-tw/notes/booking-consistency/` | `/en/notes/booking-consistency/` |
| `/notes/date-contracts/`      | `/zh-tw/notes/date-contracts/`      | `/en/notes/date-contracts/`      |
| `/contact/`                   | `/zh-tw/contact/`                   | `/en/contact/`                   |

每個舊地址輸出靜態轉址 HTML；JS `location.replace` 保留 query/hash，無 JS 有 meta refresh／真實連結。Vercel permanent HTTP redirect 已準備但未部署。Astro 本機 preview 的靜態回應不是正式 301／308 證據。舊中文章節 slug 保留。

無效 locale／slug 不生成假翻譯，回 HTTP 404。合法語系錯誤頁 `/en/404/`、`/zh-tw/404/` 提供 noindex 文件；未知 URL 由 host 的 404.html 回真正 404。

## 內容

`src/content/projects/*.mdx` 移至 `projects/zh-tw/`，notes 同理。新增完整 `en/` 內容。保留 sourceCommit、reviewedAt、visibility、source guard、產品圖片與歷史測試數。圖片相對路徑新增一層 `../`；內文連結加入語系。翻譯 chapter 順序須一致。

原有私有來源不公開、未部署狀態不變。新 Evidence 區補上來源查核與限制，沒有重跑兩個原專案的測試。

## 視覺與互動

炭綠／萊姆深色、均勻雙卡與旋轉畫面，改為暖紙／酒紅、編輯式襯線、不等欄、旁註與長文閱讀地圖。深淺主題按鈕和儲存邏輯一併移除。普通連結／按鈕裝飾箭頭全部移除，資料流箭頭保留資訊語意。

原有篩選、目錄、閱讀導覽、skip、keyboard、mobile menu、focus、reduced motion、圖片最佳化保留；新增兩個來源規則模擬。V1 截圖沿用 repository 既有真實畫面，V2 為本輪新 build 的真實瀏覽器畫面。

## 回復

本輪尚未 merge 或部署。可不合併 PR 繼續使用 main；若日後合併後需回復，用正常 revert 與前一個已驗證部署，不 force push。沒有業務資料需回滾。
