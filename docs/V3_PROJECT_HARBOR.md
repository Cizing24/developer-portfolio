# V3 Project Harbor 架構與維護

## 分工

- Astro Content Collections：作品 metadata、案例路由、封面、語系配對與 SEO。
- EngineeringStudio：建置時取得作品，輸出固定展台的名稱、view 與一般作品 href。Three.js 不認識 BookFlow、AssetFlow 或 TravelOps。
- world-config / world-map：固定七個功能地塊與五條橋，Community 維持獨立海路。Main Hall 分流、Harbor 選作品、Engineering Lab 導向工程閱讀、Notes 集中長文、About 與 Contact 提供個人資訊。
- ProjectHarbor：每頁三件的 HTML 作品列。新增作品不增加 Geometry、Material 或 Texture。
- BookFlowDemo、AssetFlowDemo、TravelOpsDemo：各自 markup。lib/demos 中的模型與控制器分開維護，控制器動態匯入。
- loadDemo：下載期間停用控制項、阻擋原生 submit；失敗提供重試。
- 案例頁：`[locale]/projects/[slug].astro` 自動輸出，沒有互動模組也能正常閱讀。

場景保留材質快取、靜態幾何合併、離頁 dispose、按需繪製與低功耗設定。專屬預約／資產建築已換成共用展台和工程設施；地形仍沿用原本已驗證的群島與橋面佈局，沒有宣稱全面重新設計每個地塊。

## 三個入口

| 作品      | 展示網址 query            | 操作                                              |
| --------- | ------------------------- | ------------------------------------------------- |
| TravelOps | `?view=project-travelops` | 建單、付款、重送通知、開券、退款／核銷、對帳      |
| BookFlow  | `?view=project-bookflow`  | 選服務、日期／人員、送出預約、重複時段衝突、Reset |
| AssetFlow | `?view=project-assetflow` | 搜尋、狀態篩選、領還、故障歸還、離職交接與稽核    |

所有展示均為本地循序 TypeScript 狀態。TravelOps 庫存預留與來源的資料庫 Transaction／Row Lock 是不同實作。付款事件以本地事件鍵及 payload 判斷重複；沒有真實簽章驗證、Redis Worker 或跨系統 exactly-once。

TravelOps 退款先申請再核准；核准時重新確認無已使用權益。核准後等待確認期間禁止核銷，確認後才撤銷權益並回補一次庫存。只支援整筆退款。對帳使用整數分，差異包含內外帳缺漏與金額不符。人工處置新增原因，不修改原交易；重跑未解決差異仍存在。

## 新增一般作品

1. 在 `src/content/projects/{zh-tw,en}/` 各新增同名 Markdown，使用相同 `translationKey`。
2. 提供 `locale`、`title`、20–200 字 description、`category`、`tags`、`highlights`、`status`、`visibility`、`featured`、`order`、真實 `sourceCommit` 與 `reviewedAt`、`cover`、`coverAlt`。
3. 沒有互動功能時省略 `demoModule`；展館及案例頁會自然提供閱讀入口。普通 Markdown 不必使用現有三案專屬 ProjectIntroduction。
4. 有獨立互動功能時，在 lib/demos 新增模型／控制器和元件，加入 schema 允許的 demoModule，以及 reader loader。Three.js 不需修改。
5. 使用 metadata 設定 featured 與 order；不要以作品 ID 在場景註冊模型。
6. 執行 verify、公開邊界檢查與 audit。新增未追蹤檔案另行人工審查。

### 普通作品範例

```yaml
locale: en
translationKey: example-tool
title: Example Tool
description: A small engineering tool with a documented workflow and explicit limitations.
category: TOOLS
tags: [TypeScript]
highlights: [Documented workflow]
status: In progress
visibility: private
featured: false
order: 10
# sourceCommit 必須填入實際查核的 40 字元 SHA，不使用此說明文字。
sourceCommit: REPLACE_WITH_REVIEWED_COMMIT
reviewedAt: '2026-11-19'
cover: ../../../assets/REPLACE_WITH_REVIEWED_COVER.png
coverAlt: Screenshot using synthetic data in the example engineering tool
```

新增兩語本文後，作品總覽、Harbor、案例與 SEO 自動取得內容。這是教學模板，不會作為公開作品建置。

## 來源整合

V3 隔離 worktree 建立自 PR #14 head `9f7b0a1`，原目錄所有未提交修改維持原狀。PR #14 已包含與原工作目錄相同的 Modern Web Guidance 快照，毋須覆寫或重複 cherry-pick。PR #13 的 README 已由擁有者在執行期間合併至 main；本輪將 main 的文件更新合併進 V3 分支，保留其編排並補上現行功能分區。

不修改來源產品 Repository、不合併 main、不發布 Production。

## 預覽回饋調整（2026-11-20）

- 大展廳（Main Hall）取代迎賓廣場名稱，保留 portfolio URL 識別。
- 工程實驗室維持 view=journal 舊深連結，集中技術決策、測試與架構。筆記島改為開發手記（Field Notes），使用 view=field-notes。
- 筆記 metadata 的 section 可設 engineering 或 journal，預設 engineering；開發手記由 section=journal 的雙語文章自動產生。筆記返回連結依 section 導回所屬區域。獨立 notes 總覽仍保留所有文章。
- TravelOps 訊息不再 sticky；只有非空訊息有邊框及內距，保留 role=status 朗讀，避免遮擋下方表單。
