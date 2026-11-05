# Developer Portfolio V3 本機視覺精修驗收

2026-11-05 · Windows · Node.js 24.22.1

## 完成內容

- 統一深青遠海、淺青近岸、暖砂岸、石層和木橋。草地以頂點色呈現乾草與草綠差異，樹冠沿用三種共用色。遠礁降低高度和色差，讓七座可探索的主島保有清楚輪廓。
- 四時段各自配置太陽方向、半球填光、霧色、陰影與窗燈強度。既有平滑過渡同時更新這些參數，直式構圖降低霧密度以補償較遠的相機距離。
- 閱覽室、選單、島名、操作面板和 Engineering Lab 共用暖紙與墨藍。BookFlow 用陶棕強調、AssetFlow 用鋼藍強調，分頁仍以底線及狀態標記指出選取，模擬結果保留文字回饋及原始工程證據。
- 流程與內容沿用本機 V3 與 A+B 工作樹。作品集和 CIZING 維持直達，兩座專案島保留 3D 熱點、操作模擬、架構、證據與深連結。

## 四時段與七島

| 時段 | 美術處理                                               | 桌機全景                                                  |
| ---- | ------------------------------------------------------ | --------------------------------------------------------- |
| 清晨 | 冷藍填光、淡霧及暖色斜光                               | [清晨](.local/v3-visual-polish/after/overview-dawn.png)   |
| 正午 | 中性偏暖的高角度日光，清楚分出草地、砂岸與橋面         | [正午](.local/v3-visual-polish/after/overview-noon.png)   |
| 夕陽 | 琥珀色低斜光與較長投影，保留青藍水色                   | [夕陽](.local/v3-visual-polish/after/overview-sunset.png) |
| 夜晚 | 冷色環境光與較弱的方向光陰影，窗燈和螢幕提供小面積亮點 | [夜晚](.local/v3-visual-polish/after/overview-night.png)  |

| 島嶼                  | 辨識重點                                             |
| --------------------- | ---------------------------------------------------- |
| 作品集                | 青綠亭頂、砂岩基座、地標周邊的淺色步道               |
| BookFlow              | 珊瑚色條紋布棚、暖木桌、彩色行事曆格與青色螢幕       |
| AssetFlow             | 鋼藍設備架、深青交接台、獨立螢幕和設備指示燈         |
| 筆記／Engineering Lab | 霧紫書架頂與書卷米色，閱覽面板以分類標題和分隔線組織 |
| CIZING                | 黃銅桌面、墨藍結構與冷色筆電螢幕                     |
| 在隆昌                | 陶土紅棕雙層屋瓦、橄欖綠草地與木質碼頭               |
| 聯絡                  | 赭黃屋頂和門面標識帶，保留窗燈與天線地標             |

- 專案島與操作畫面見 [BookFlow 白天](.local/v3-visual-polish/after/bookflow.png)、[BookFlow 預約操作](.local/v3-visual-polish/after/bookflow-reader.png)、[AssetFlow 夜間](.local/v3-visual-polish/after/assetflow-night.png)、[BookFlow 夜間](.local/v3-visual-polish/after/bookflow-night.png)。
- 直達入口及閱讀見 [作品總覽](.local/v3-visual-polish/after/portfolio-direct.png)、[CIZING](.local/v3-visual-polish/after/about-direct.png)、[Engineering Lab](.local/v3-visual-polish/after/engineering-lab.png)。
- 390px 版型見 [手機全景](.local/v3-visual-polish/after/mobile-overview.png)、[手機交接表單](.local/v3-visual-polish/after/mobile-handover.png)、[WebGL 備援](.local/v3-visual-polish/after/webgl-fallback.png)。改版前的同尺寸桌機全景與專案聚焦存在 [基準截圖目錄](.local/v3-visual-polish/before/)。

## 變更檔案

| 檔案                                                        | 職責                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| [studio-art.ts](src/lib/studio-art.ts)                      | sRGB 材質色與四時段光照設定                                  |
| [studio-scene.ts](src/lib/studio-scene.ts)                  | 七島材質、頂點色合批、海岸遮罩、海面與時段過渡、互動標記亮度 |
| [studio.css](src/styles/studio.css)                         | 群島介面 Token、暖紙閱覽室、專案分頁、表單、焦點與回饋樣式   |
| [EngineeringLab.astro](src/components/EngineeringLab.astro) | 分類與篩選欄樣式，以及提示文字對比                           |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)                        | V3 色彩與材質維護說明                                        |

## Skills

- **Taste Skill 2.5.0** 直接參照上游 MIT 授權指引，用於維持單一視覺系統、讓作品畫面帶動層級，以及瀏覽器截圖查核。此次未安裝套件或帶入網站範本。 [Taste Skill 原始指引](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md)
- **Impeccable 4.8.0** 使用既有安裝的 `context`、Colorize、Polish 與 Craft Floor。以 Experience 檢視群島，以 Read／Operate 檢視閱覽室和模擬。檢查以常規瀏覽器與 axe 執行，未啟用 Live Apply。
- 瀏覽器驗收沿用專案 Playwright、Chrome 與 axe。此次無新增或更新 Skills、專案依賴、外部素材或付費服務。

## 本機驗證

| 命令或方法                                                        | 實際結果                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm.cmd run check`                                               | 首輪 Astro 檢查 80 個檔案，0 錯誤、0 警告、0 提示                                                                                                                  |
| `npm.cmd run typecheck`、`git diff --check`                       | 最終微調後通過                                                                                                                                                     |
| `npm.cmd run build`                                               | 最終建置成功，產出 38 頁。Vite 仍警示延遲載入的 Three.js 檔超過 500 kB                                                                                             |
| `npm.cmd test -- tests/navigation.test.ts tests/showcase.test.ts` | 2 個測試檔、16 項通過，涵蓋坡道／尋路及操作模擬                                                                                                                    |
| Playwright 桌機代表規格                                           | 4 項通過，涵蓋兩島 3D 射線點擊、預約／交接、架構與工程證據、右選單、Back／Forward、Escape 焦點復原、時段／語系連結及 Lab 篩選                                      |
| `node .local/v3-visual-polish.mjs after`                          | 最終版 Chrome 驗收通過。含桌機四時段及兩島聚焦、鍵盤直達、390px 表單輸入與送出、Reduced Motion 與關閉 WebGL 後開啟作品總覽。Lab 與手機交接表單的 axe 抽查為 0 違規 |
| `node .local/v3-visual-polish-recheck.mjs after`                  | 最終版補測通過。在未設定 Reduced Motion 的情況下切換夕陽及夜晚，確認時段 URL、按鈕狀態及夜間 BookFlow 聚焦，並重複短效能取樣                                       |

瀏覽器使用 Playwright 在本機從 `dist` 回應請求。桌機代表規格以既有本機 fixture 執行，命令如下。Playwright 當時提示 `FORCE_COLOR` 優先於 `NO_COLOR`。

```powershell
npm.cmd run test:e2e -- --config .local/project-islands-files.config.ts --project desktop --workers 1 --grep 'BookFlow facility|AssetFlow inventory|four times change|direct portal shortcuts' --reporter list --output .local/v3-visual-polish/e2e
```

主文字對暖紙約 11.33:1，欄位提示文字對底色約 6.74:1，BookFlow 與 AssetFlow 主要按鈕文字分別約 6.95:1 與 7.67:1。欄位邊線對欄位底色約 4.24:1。島名使用不透明底色，鍵盤焦點保有雙色輪廓。上述數值為指定色對的計算，axe 結果僅涵蓋抽查畫面。

## 效能與限制

同一台 Windows Chrome Headless／ANGLE SwiftShader，1440 × 900、DPR 1。以開工時的本機 `dist` 為基準，比較一次閒置、一次拖曳的約 1.8 秒取樣。繪圖提交以 WebGL draw 呼叫數除以樣本的 rAF 回呼數估算。

| 指標                    | 既有 V3＋A+B | 最終取樣 1 | 最終取樣 2 |
| ----------------------- | -----------: | ---------: | ---------: |
| 場景首次可用            |      3.74 秒 |    5.86 秒 |    5.75 秒 |
| 首次可用前的 Long Tasks |            2 |          1 |          1 |
| 閒置 draw 呼叫／rAF     |          237 |        162 |        162 |
| 拖曳 draw 呼叫／rAF     |       約 236 |        162 |        162 |
| 閒置 rAF 間隔 p95       |       317 ms |     450 ms |     451 ms |
| 拖曳 rAF 間隔 p95       |       450 ms |     450 ms |     450 ms |

繪圖提交約少 32%。在這次 SwiftShader 樣本中，兩次首次可用均較基準慢約 2 秒，閒置 rAF 的 p95 也較高，拖曳樣本的 p95 相同。首次可用與閒置時間的效能驗收未達基準。樣本各只有數個 rAF 回呼，無法由此判定實機幀率或回歸原因。 合批保留各站點的點擊範圍，24 道浪紋共用一個實例批次。海面沿用單一網格和渲染流程，128 × 128 的雙通道遮罩在本機產生，單次取樣同時帶入近岸深淺與水色帶。延遲載入的未壓縮場景檔由 635,445 增至 639,942 bytes（約 0.7%）。未測實機 GPU、實體手機、Safari／WebKit 或完整視窗矩陣。

原始取樣見 [基準](.local/v3-visual-polish/before/runtime.json)、[最終](.local/v3-visual-polish/after/runtime.json)、[補測](.local/v3-visual-polish/after/runtime-recheck.json)。

## 本機試用與工作樹

```powershell
npm.cmd run dev
```

[繁體中文首頁](http://127.0.0.1:4321/zh-tw/) · [英文首頁](http://127.0.0.1:4321/en/) · [繁中夕陽](http://127.0.0.1:4321/zh-tw/?time=sunset)

分支為 `portfolio/integrated-island-navigation`。保留原有 V3 與 A+B 的未提交成果，本輪精修與本報告也留在本機工作樹。截圖與驗收腳本在 Git 忽略的 `.local`。本輪無 commit、部署、Push、PR 或遠端變更。
