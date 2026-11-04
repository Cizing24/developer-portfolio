# 2026-11-04 求職展示更新

首頁保留 V3 群島，增加四個案例、技能與聯絡的普通連結。AssetFlow 與 BookFlow 的雙語案例連結實作、流程截圖、測試及對應版本 CI；兩者皆無公開登入或 Live Demo。AssetFlow 本次確認為 Public，更新原先的私人來源標示。

技能索引位於兩語的 `/about/#skills`。AI 協作的公開範圍與證據見 [docs/AI_COLLABORATION.md](docs/AI_COLLABORATION.md)。棉麻屋不公開客戶畫面或部署網址；在隆昌使用公開首頁截圖。未取得四份原始 GIF，沒有製作替代操作錄影。

建置方式沿用既有指令；本次 CI、PR 與部署結果請查核實際遠端紀錄，不能由本段推定上線。

---

# Developer Portfolio V3 · 專案群島

CIZING 的中英文互動作品集。首頁有七座功能島：作品集、BookFlow、AssetFlow、筆記、聯絡、CIZING 與在隆昌。點選島嶼移動視角，再選擇內容開啟同頁閱讀框。在隆昌以獨立港口連接海路，周圍裝飾群島圍成有限海域。

![專案群島首頁](docs/screenshots/islands-update/desktop-overview.png)

## 目前體驗

- 六座主群島以橋梁連接，第七座在隆昌島沒有陸橋。人物可過橋，船隻以水路抵達港口；建築、樹木、燈柱、人物及碼頭有通行限制。
- 透明頁首只保留 CIZING、中英文切換和四個時段圖示。清晨、中午、夕陽與晚上會改變海面、光線、窗戶和路燈；移動物件的投影陰影持續更新。
- 右側清單可搜尋島嶼與內容、移動到該島、閱讀細節；底部以圖示控制全景、縮放、動態、個人角色與操作說明。
- 兩座專案島各有三個入口：目的、作用、架構。說明以產品用途為主，不要求訪客先理解交易鎖或錯誤碼。
- 同頁原生 dialog 閱讀：兩個專案、六篇分類筆記、實際網站經驗、個人介紹、技能與聯絡。支援 Escape、焦點返回、瀏覽器上一頁與中英文狀態保留。
- 個人島有原創的眼鏡、深色上衣與背包角色，可以自由行走及過橋；個人角色按鈕可找到目前位置。
- 相機、時段、選單與閱讀框使用平順過場；自主環境動態可暫停；系統設定減少動態效果時預設停用。開啟閱讀框、離開可見區域或隱藏分頁時停止場景更新。
- WebGL 不可用或 context loss 時，仍有可操作的主題地圖與閱讀框。未啟用 JavaScript 時可直接閱讀獨立內容頁。

## 本機開啟

Node.js 24、npm。Windows 可使用 `npm.cmd`、`npx.cmd`。

```sh
npm ci
npx playwright install chromium
npm run dev
```

開啟 `http://127.0.0.1:4321/zh-tw/` 或 `/en/`。

```sh
npm run verify
npm run preview
```

`verify` 執行格式、靜態檢查、單元測試、內容契約、正式建置、SEO fixture 與四種螢幕尺寸的 Playwright／axe 驗證。詳細結果與限制見 [TESTING.md](TESTING.md)。

## 內容維護

- `src/lib/project-introductions.ts`：兩個專案的中英文目的、功能、架構與狀態，供島嶼閱讀框及獨立內容頁共用。
- `src/content/projects/`：專案中繼資料、真實畫面、來源版本及共用介紹元件入口。
- `src/content/notes/`：深入的工程筆記。它們與產品用途介紹分開閱讀。
- `src/components/EngineeringStudio.astro`：整站主介面。
- `src/lib/world-config.ts`：七座島、四時段與雙語內容入口的共同來源。
- `src/lib/world-map.ts`、`src/lib/navigation.ts`：島位、橋梁、地面／水域、路徑與碰撞。
- `src/lib/studio-scene.ts`：原創 Three.js 模型、相機、點選與環境動態。
- `src/lib/studio-reader.ts`：同頁閱讀、網址狀態、焦點、語言與分享。

沿用 Astro 7.4.2、TypeScript strict、Tailwind CSS 4、Content Collections、Markdown／MDX；新增 Three.js。仍為純靜態網站，無業務後端或資料庫。

## 公開邊界

場景人物及動態是視覺展示，不代表真實使用者或即時營運資料。專案畫面使用合成測試資料，網站沒有連線正式產品。AssetFlow 原始碼為私人專案；BookFlow 保留已確認的公開來源。未提供假登入或假 Live Demo。

作品集的本機測試、遠端 CI 與部署各自保留驗證紀錄；目前版本的合併與發布狀態請核對 GitHub PR 與 Cloudflare 部署。作品集測試不包含兩個來源專案的後端測試。

詳細設計與維護說明見 [互動網站說明](docs/INTERACTIVE_WORLD.md)。V2 歷史實測與證據保留在原文件及 `docs/evidence/v2/`，其效能分數不代表 V3。

本次八項更新、本機驗證及內容公開界線見 [七島更新紀錄](docs/LOCAL_ISLANDS_UPDATE.md)。
