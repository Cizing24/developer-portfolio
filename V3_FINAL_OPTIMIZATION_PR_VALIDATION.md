# Developer Portfolio V3 最終驗證與 PR 交付

2026-11-05，臺灣時間。工作樹起點為 `portfolio/integrated-island-navigation` 的 `300caf6`，含先前三輪尚未提交的 V3、專案島 A＋B 與視覺精修成果。

## 修改摘要

- 整合七島互動、載入與 WebGL 備援、人物步態與陰影、四時段光照、雙語閱覽室、BookFlow／AssetFlow 展館與 Engineering Lab。兩案採既有公開畫面與瀏覽器內模擬，工程證據連到公開來源專案的指定版本。
- **已修正。** 場景初始化時，陸上尋路圖為路徑取樣反覆計算固定障礙物座標與橋口淨空。現在每次建立版型的通行範圍時先算一次，再供碰撞取樣使用。橫式與直式各比對行人半徑 0.17、0.4 的前後尋路圖，四組共 9,012 個節點，座標、高度、連線順序和連通區均逐項相同。 [world-map.ts](src/lib/world-map.ts)
- **未確認。** 這輪未重現前次報告約 2 秒的美編後首次可用差距。閒置 p95 樣本範圍有重疊，拖曳樣本太少，無法判定幀時間有穩定改善。
- **保留。** 這輪程式修正集中在固定障礙物的計算時機。海岸遮罩已在版型切換時更新，閱讀框開啟後的取樣也沒有繪圖。既有材質、光照、批次及繪圖排程沿用原實作。

## 效能

Windows、Chrome Headless 156.0.8078.80、ANGLE SwiftShader、1440 × 900、DPR 1。Playwright 攔截請求，從本機靜態產物讀取資源。每版三個新瀏覽器 context，採相同設定依序執行，未隨機交錯。閒置每輪取約九秒或 24 個 rAF 間隔，取最近秩 p95。下表為三次中位數與範圍。首次可用從導覽計時到頁面標示 `data-renderer=ready`，包含初次繪圖提交。

| 指標                    |      美編前留存產物 |          收尾修正前 |              交付版 |
| ----------------------- | ------------------: | ------------------: | ------------------: |
| 首次可用                | 4.71 s（4.50–6.43） | 5.12 s（4.78–7.57） | 3.12 s（2.87–3.71） |
| 首次可用前 Long Tasks   |            1（1–2） |            2（1–2） |            1（1–2） |
| 閒置 rAF 間隔 p95       |   467 ms（450–483） |   467 ms（450–483） |   433 ms（433–467） |
| 閒置 WebGL draw／rAF    |              約 237 |              約 162 |              約 162 |
| 閒置 rAF 間隔樣本數／輪 |               22–24 |               22–24 |                  24 |

- 美編前基準使用本機留存的 `.local/seo-config-dist`，其場景 chunk 為 635,445 bytes，與歷史美編前紀錄一致。該產物沒有獨立提交可供對應。收尾修正前是此次開工後以既有工作樹建置的版本，場景 chunk 為 639,942 bytes。交付版為 639,958 bytes。
- 另外用各一次本機探針量初始化。三張尋路圖合計 **2,985 → 1,363 ms**，其中兩張陸上圖合計 **2,349 → 647 ms**。版型初始化整體 **3,119 → 1,507 ms**。海岸遮罩 **34 → 39 ms**，移動陰影高度貼圖 **55 → 61 ms**。交付版從首次 shader 提交到 ready 約 **637 ms**，含首次繪製路徑的其他工作。WebGL API 呼叫時間無法分離 GPU 非同步執行成本。
- 收尾修正前後，三輪場景 chunk 本機回應分別約 57–72 ms、39–50 ms。Vite 仍顯示超過 500 kB 的警示。尚未量測真實網路傳輸與不同裝置的解析成本。
- 收尾修正前後各一輪拖曳 p95 為 517、500 ms，分別只有 19、21 個間隔。閱讀框開啟後各觀察一秒，皆為 0 次 WebGL draw。三組效能樣本的頁面與 Console error 記錄皆為空。
- 同版另觀察一輪 AMD Radeon Graphics／ANGLE D3D11 硬體加速。首次可用 3.60 秒。閒置、拖曳各 24 個間隔，p95 分別為 17、18 ms。缺少硬體前測與長時間取樣。SwiftShader 數據限這次本機比較。

## 視覺與操作

- 目視檢查桌機清晨、正午、夕陽及夜晚全景。七島標籤可辨識，夕陽投影沿相同方向延伸。BookFlow、AssetFlow 夜間設施與標籤清楚，暖紙閱覽室與兩案識別色可區分。
- 桌機從兩座島的 3D 設施進入模擬，驗證 BookFlow 預約及 AssetFlow 清冊與交接。確認 Engineering Lab 篩選、瀏覽器歷史、鍵盤開啟、Escape 關閉與焦點回復。
- 390 × 844 的手機模擬中，AssetFlow 交接表單可完成故障歸還，閱覽區無水平溢出且焦點輪廓可見。驗證 Reduced Motion 與停用 WebGL 後從替代入口閱讀作品。
- Impeccable 以現有 `DESIGN_SYSTEM.md` 及畫面為準。未在本機技能目錄找到已安裝的 Taste Skill，本輪沿用既有設計規則與截圖抽查。

## 驗證結果

| 檢查                                                                                  | 結果                                                                                                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm.cmd run check`、`npm.cmd run typecheck`、`npm.cmd run lint`                      | 通過。Astro 檢查 80 個檔案，0 錯誤、0 警告、0 提示                                                         |
| `npm.cmd run build`                                                                   | 通過，產出 38 個靜態頁面。場景 chunk 保留既有 Vite 大檔警示                                                |
| `npm.cmd test -- tests/navigation.test.ts tests/showcase.test.ts`                     | 2 個檔案、16 項通過                                                                                        |
| `npm.cmd run test:content`、`npm.cmd run test:seo`                                    | 通過                                                                                                       |
| Prettier、`npm.cmd run check:public`、`git diff --check`、`git diff --cached --check` | 通過                                                                                                       |
| Playwright 桌機代表規格                                                               | 3 項通過。BookFlow、AssetFlow 與 Engineering Lab                                                           |
| 本機 Chrome smoke                                                                     | 通過。四時段、鍵盤、手機、Reduced Motion 與 WebGL 備援。Engineering Lab 和手機交接表單的 axe 抽查為 0 違規 |

## Git 交付與留存

- 整合提交為 `68a82c24b04dd94f2adf3b67e0e3ee8648154598`，已推送到 `Cizing24/developer-portfolio` 的 `portfolio/integrated-island-navigation`。GitHub PR 以 `main` 為目標分支。 [PR #12](https://github.com/Cizing24/developer-portfolio/pull/12)
- 驗證報告以獨立文件提交加入同一個 PR。Review、合併與正式部署由維護者處理。

- 截圖、量測 JSON、探針與圖比對腳本保存在 Git 忽略的 `.local`。未提交建置產物、測試截圖或憑證。公開版的歷史驗收報告移除了一個本機絕對路徑。
- `test:seo` 重建了當作美編前基準的 `.local/seo-config-dist`。該暫存建置已被覆蓋，重建前取得的三次量測 JSON 及歷史量測紀錄仍在 `.local`。本輪收尾修正前的建置另保存在 `.local/v3-final-unoptimized-dist`。
- 未執行完整 E2E 矩陣、Safari／Firefox、實體手機、長時間 GPU 測試、來源產品後端或正式站驗收。
