# 2026-11-12 TravelOps 維護補充

TravelOps 的 `translationKey` 為 `travelops`，來源原始碼維持私有，`visibility: private` 不隱藏公開案例。沿用現有 schema，不加入私人 repository 或未驗證的 demo 連結。

共用介紹的 `ProjectId` 包含三個專案；`IslandProjectId` 只包含 BookFlow／AssetFlow。`StudioReader` 的作品總覽列出三案，但只渲染既有作品島的案例與模擬。TravelOps 以普通連結前往 `/zh-tw/projects/travelops/` 或 `/en/projects/travelops/`，不將完整媒體放進首頁隱藏的 dialog。

`TravelOpsMedia.astro` 提供影片、旅客、POS、架構及營運五組展示。依現有案例順序先渲染影片組，該組同時輸出本案例共用樣式一次；其餘組共用樣式，首頁不輸出這份 CSS。PNG 由 Astro Image 產生尺寸與 WebP，原圖連結保留可放大版本；可信 SVG 僅用作圖片。影片為已審核 MP4，英文 WebVTT 由同批 SRT 轉換並檢查十段時間碼，影片本身不重製。

網站維持原有暖紙主題；深色總覽以原生 details 提供獨立閱讀版本。長流程 SVG 放在可鍵盤捲動區域，另附文字摘要與原尺寸連結。擴充時保留雙語固定錨點與案例頁語言切換。

# 2026-11-04 維護補充

現行案例由 `ProjectIntroduction.astro` 的簡介與雙語 MDX 工程內容組成，`ProjectWorkflow.astro` 使用已審核的合成資料截圖。`WebsiteCases.astro` 共用實際網站經驗摘要，`SkillsIndex.astro` 將能力連到案例與筆記。新增內容須同時維護兩語，不增加產品後端或虛構操作展示。

首頁入口統一由 `world-config.ts` 的島嶼內容、場景物件與同頁閱覽室提供；作品島有四個展示熱點，個人島有介紹、技能與 AI 協作三個入口。普通閱讀連結收進既有世界選單，no-JS 保留獨立頁面備援，不在世界外加浮動入口。AssetFlow 的 Public 狀態已於 2026-11-04 查核，未來使用來源時仍須重新確認。內部來源審查與交付報告保留在 Repository 外，不得提交私人筆記索引。

---

> 2026-10-23 更新：首頁與專案介紹已改為 V3 全螢幕互動群島；目前行為與內容維護以 [互動網站說明](docs/INTERACTIVE_WORLD.md) 為準。以下 V2 內容保留作為歷史決策紀錄，六步流程與 13 章案例不再是本輪驗收要求。

# V2 內容管理

繁體中文與英文完整維護，以來源文件與程式證據為依據，不虛構個人經歷、成果數字或系統能力。

## 身分與聯絡

`src/config.ts` 是公開資訊來源。顯示名稱統一為 CIZING，GitHub 網址保留真實帳號。Email、LinkedIn 與 resume 依當前設定呈現；只有確認可公開的值才加入，空值不產生假入口。履歷如設定 `/resume.pdf`，需先加入已審查檔案。不要放 token 或機密。

## 新增作品或文章

檔案分別位於 `src/content/projects/{zh-tw,en}/` 與 `src/content/notes/{zh-tw,en}/`。相同內容使用一致 slug 與 `translationKey`，明確設定 `locale: zh-tw` 或 `locale: en`。字典只管理 UI 文案；長文保留 Markdown／MDX。

作品必要 frontmatter：title、description（20–200 字元）、category、tags、highlights、status、visibility、featured、order、sourceCommit（實際 40 字元 SHA）、reviewedAt（真實日期）、cover（例如 `../../../assets/bookflow.png`）、coverAlt。私有作品不得含 repository；沒有已驗證公開 Demo 就省略 demo，不能放 `#`。

文章必要欄位：locale、translationKey、title、description、publishedAt、category、tags。draft 預設 false，可設 true 暫不發布。日期不是排程機制。

新增後執行 `npm run test:content`，驗證配對唯一、兩語完整、證據版本一致、英文沒有殘留中文，以及每案例 13 章。建置 schema 另驗必要欄位、日期、圖片與私人來源。

## 保留工程深度

案例章節依序：概覽、問題動機、需求、架構、技術選型、資料模型、主要功能、工程難點、決策、安全可靠性、測試品質、取捨限制、後續改善。兩語維持相同章節順序，因切語言使用建置時 heading slug 配對。更動章節後需重跑 anchor E2E。

公開內容清楚區分已實作、來源歷史測試、本網站實測與未完成方向。AI 協助撰寫或分析不等於本人已完成學習、實務任職或生產營運。更新來源時先唯讀核對實際文件與程式，更新 sourceCommit／reviewedAt；不要重寫歷史測試數字成為本輪驗證。

## 連結、圖片與模擬

內文使用完整語系路徑，如 `/en/projects/bookflow/`、`/zh-tw/projects/assetflow/`。文章目錄由 `##` 產生。英文不是把中文本文放在 lang=en；缺譯須隱藏對應切換，現有完整內容契約會拒絕遺漏配對。

程式碼指定 fenced language，由 Shiki 高亮。MDX 能執行元件，只有受信任作者可維護。普通超連結／按鈕禁止裝飾箭頭，詳見 DESIGN_SYSTEM。

產品圖片只使用已確認適合公開的合成資料畫面，存 `src/assets/` 並由 Astro Image 處理。不能把設計稿或模擬圖當實際截圖。流程內容在 `src/lib/simulations.ts`，必須對照來源與明示前端模擬，不得連私人 API 或宣稱證明真實並行安全。

修改後執行 `npm run verify`、逐尺寸閱讀，再依需要更新 screenshots 與視覺基準。不要在未目視確認時直接用新圖片覆蓋基準以消除失敗。
