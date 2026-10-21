# 案例來源與公開邊界

查核日期：2026-10-22，僅唯讀來源 repository。來源檔案未加入本專案；只有經重新撰寫的摘要與兩張合成資料圖片。

| 作品           | 本機與遠端一致的 HEAD                      | API 可見性 |
| -------------- | ------------------------------------------ | ---------- |
| AssetFlow ITAM | `7a698fbcd8bbffb4e46ec434a310690973aab77a` | private    |
| BookFlow SaaS  | `4c913361edab42f4be2ac4a8dc28eef942947824` | public     |

## 實際讀取文件

AssetFlow：README.md、ARCHITECTURE.md、DECISIONS.md、DATABASE_DESIGN.md、TESTING.md。不存在 `docs/STATUS.md`，未假設該路徑存在。核心規則對照 `apps/api/src/db.ts`、`apps/api/src/services/lifecycle.ts` 與資料庫約束文件。

BookFlow：README.md、docs/ARCHITECTURE.md、docs/TECHNICAL_DEEP_DIVE.md、docs/STATUS.md。無根目錄 ARCHITECTURE／DECISIONS／DATABASE_DESIGN／TESTING，採實際存在的 docs 文件。交叉核對 `src/modules/booking/service.ts`、`repository.ts`、`src/modules/operations/notifications.ts` 與 `prisma/migrations` 的 GiST、冪等與版本約束。

## 圖片

| 本網站資產                 | 來源                                     | 公開判斷                                                              |
| -------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `src/assets/assetflow.png` | `docs/screenshots/dashboard-desktop.png` | README 明示所有設備與員工為合成資料，逐張目視確認無憑證或真實聯絡資料 |
| `src/assets/bookflow.png`  | `docs/images/calendar-chromium.png`      | 合成測試店家、Synthetic operator、合成顧客；無私人管理 token          |

兩者皆標示「實際畫面／合成資料」。不是 UI 示意圖，也不代表公開網站。

## 宣稱與證據

- 已實作功能：根據程式碼、SQL 與文件交叉檢查。
- 原專案測試：數量明確標示為來源測試文件的歷史紀錄，不是本網站重新測試的結果。
- 本網站測試：另見 TESTING.md，不把來源系統測試數量計入本網站。
- Demo：兩個來源都明示沒有公開部署，因此沒有 demo URL。
- 私人專案：不提供 AssetFlow repository 連結、不複製程式碼片段、Seed、環境變數或帳密。
- 身分：僅使用使用者提供的 Cizing24 與 GitHub；沒有推定真名、學歷、年資、任職或 Email。

作品公開摘要與合成截圖在本次使用者授權範圍內。未變更來源可見性，亦未對來源 repository 執行任何寫入。
