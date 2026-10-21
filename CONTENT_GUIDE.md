# 內容管理

所有正式內容均使用臺灣繁體中文。公開內容以原始碼與文件證據為依據，沒有客戶、公司、年資或效益數字的虛構宣稱。

## 修改個人資訊

編輯 `src/config.ts` 的 `profile`：name、role、description、github、locale。Email、LinkedIn、resume 預設為空字串，只有填入真實資料才顯示。履歷需先放在 `public/resume.pdf`，再設定 `/resume.pdf`；發布前確認檔案確實存在且適合公開。

這些設定是公開資訊，禁止放入 token 或帳號密碼。設定 email 前需確認本人願意公開。role 是網站定位，不代表虛構任職。

## 新增作品

1. 先查閱實際 repository 的文件、相關程式與已存在截圖，記錄查核 SHA 與日期。
2. 在 `src/content/projects/` 新增 `project-slug.mdx`，檔名就是 URL。
3. 將經授權、檢查過的圖片放入 `src/assets/`，cover 使用相對路徑。
4. 依以下格式補齊 frontmatter 與本文。

```yaml
title: 真實作品名稱
description: 至少二十字的真實摘要，說明專案目的與已完成範圍。
category: FULL-STACK APPLICATION
tags: [TypeScript, PostgreSQL]
highlights: [經驗證的技術特色]
status: 已實作・隔離展示
visibility: private
featured: false
order: 3
sourceCommit: '完整四十字元的實際 Git SHA'
reviewedAt: '2026-10-22'
cover: ../../assets/your-reviewed-image.png
coverAlt: 能說明圖片用途與內容的替代文字
```

上例 SHA／圖片是格式說明，必須改成真實值才可建置。公開 repository 才可加 `repository: https://...`；private 加 repository 會被 schema 拒絕。只有驗證能使用的公開 Demo 才能新增 demo。沒有值就省略，不能放 `#`。

案例保留 13 個章節：概覽、問題與動機、需求、架構、技術、資料模型、核心功能、工程難點、決策、安全可靠性、測試品質、取捨限制、後續改善。區分程式已存在、已實際驗證與計畫項目。

`featured: true` 顯示於首頁；order 決定排序。tags 自動產生作品篩選選項。原始碼、真實個資、憑證、私人連結不得因撰寫案例而複製到公開 repository。

## 新增文章

在 `src/content/notes/` 新增 `.md` 或 `.mdx`：

```yaml
title: 文章標題
description: 至少二十字的清楚摘要，交代技術問題與文章的實際範圍。
publishedAt: '2026-10-22'
category: 資料建模
tags: [TypeScript, PostgreSQL]
draft: true
```

完稿後將 draft 改為 false 或省略。draft 是明確的發布開關；日期是純日期 metadata，不會自動排程。請不要在未到發布日便手動公開未完成內容。

`##` 標題自動成為目錄；用 fenced code block 並指定語言以啟用 Shiki。請使用 `/projects/slug/` 等絕對站內路徑。分類與 tags 自動出現於篩選。閱讀導覽依日期排序，閱讀時間是文字量估計，不是實際追蹤讀者。

MDX 支援 Astro 元件，作者需受信任；普通技術筆記優先選 Markdown，降低維護成本。不要加入來源不明的 script。

## 圖片與發布檢查

合成資料畫面必須明確標示；示意圖不可寫成實際產品畫面。調整文字或圖片後執行 `npm run verify`，本機啟動 preview 再執行 `npm run screenshots`。檢查行動版、目錄、內外連結、private 邊界與個資，再送 PR。

來源查核紀錄見 [SOURCE_REVIEW.md](docs/SOURCE_REVIEW.md)。
