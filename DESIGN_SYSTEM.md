# V3 群島視覺

首頁延續全螢幕低多邊形群島。世界以青藍海、鼠尾草綠、暖砂岸、木橋為共用底色。主地標使用青綠亭頂，BookFlow 用珊瑚色布棚，AssetFlow 用鋼藍設備，Engineering Lab 用霧紫書架，CIZING 用黃銅工作桌，聯絡站用赭黃屋頂，在隆昌用陶土屋瓦與橄欖綠草地。

- [studio-art.ts](src/lib/studio-art.ts) 定義材質本色與四時段照明。黃昏的暖色來自低角度斜光，夜間由冷色填光及低亮度窗燈、螢幕保留物件輪廓。材質本色在時段切換時保持固定。
- [studio-scene.ts](src/lib/studio-scene.ts) 將草地漸層和物件本色放入頂點色，依材質表面合批。淺水遮罩只在群島版型切換時更新。窗光、螢幕及互動標記保有各自的光感。
- [studio.css](src/styles/studio.css) 在群島內共用暖紙、墨藍、欄位底色及焦點輪廓。BookFlow 的陶棕和 AssetFlow 的鋼藍用於分頁、工作區和主要按鈕。選取保留實線或底線，回饋保留可讀的文字。

互動與內容維護見 [互動網站說明](docs/INTERACTIVE_WORLD.md)。以下保留 V2 的歷史決策。

# V2 設計系統

以 A：Editorial Engineering Lab 為主要語言（70%），將 B 的系統步驟與狀態展示（30%）納入同一套暖紙／酒紅 token，不混合 B 的藍色或 C 的工作室風格。

## Design Tokens

定義在 `src/styles/global.css`。

| Token      | 值        | 語意                        |
| ---------- | --------- | --------------------------- |
| bg         | `#f3efe5` | Warm paper 全站背景         |
| paper      | `#faf7ef` | 實驗與閱讀面板              |
| text       | `#202722` | 主要文字                    |
| muted      | `#576052` | 次要文字與說明              |
| accent     | `#982d36` | Burgundy 強調、連結與 focus |
| accent-ink | `#fff9f0` | 酒紅按鈕文字                |
| surface    | `#e5e7d9` | 實驗區與產品畫面底色        |
| line       | `#b8bbae` | 分隔、資訊邊界              |

這次以暖紙作唯一品牌底色，移除 V1 的深／淺主題控制及其 localStorage 狀態，避免視覺語言分裂。BookFlow 圖片底色使用低飽和紙棕，仍屬同一紙張系統。

字體：Georgia、Noto Serif TC、PMingLiU、serif 作 display；Segoe UI／Microsoft JhengHei 作正文；Consolas／Cascadia Code 僅供小型技術標籤。全部為系統 fallback，沒有遠端字型，跨 OS 排版會不同。

Spacing scale：4、8、12、24、40、64、104px。桌面 section 104px，手機 60px；容器最大 1320px，桌面 gutter 56px，平板 32px，手機 20px，320px 縮為 16px。正文最大 850px。

Hero 桌面 clamp 48–91px（寬螢幕 96px）、手機約 38–61px，320px 34px；H2 約 32–52px；正文 16px／1.85–1.95。長文與中文標題優先可讀，不把英文強行限制單行。

## 版面

以下為 V2 歷史版面：報頭、品牌主張與編輯旁註、60／40 作品與高低落差、互動實驗、工程方法、筆記、聯絡。目前顯示名稱統一為 CIZING，社群圖卡使用 C 字標；七島版面以 [本機更新紀錄](docs/LOCAL_ISLANDS_UPDATE.md) 為準。

案例：Quick Overview、實際產品畫面、流程模擬、完整 13 章 Deep Dive、Evidence。章節目錄桌面 sticky，手機移至正文前，320px 單欄。兩張產品圖維持比例，不斜放、不捏造 UI。

Breakpoint：1100px 調整欄寬與流程 3 欄；760px 改手機導覽、單欄作品與 2 欄流程；350px 微調文字、邊界與目錄。手機清除作品落差，重排閱讀順序。

## 禁止裝飾箭頭

普通連結與按鈕不得附加無功能意義的箭頭，包括 `↗`、`→`、ArrowUpRight／ArrowRight icon、CSS `::after`、hover 才出現的箭頭或等效方向 SVG。請以清楚文字、字重、底線、邊框、背景、hover 與 focus 表達互動。

有實際方向意義的返回、前後步進或輪播可用具名方向圖示；目前 V2 這些操作也使用純文字。技術內文的資料流與關係箭頭是資訊，不是普通連結裝飾，不應刪除其工程意義。E2E 逐頁檢查連結與按鈕；內容檢查亦防止新增 UI icon／偽元素箭頭。

## 可及性與動態

至少 44px 的主要操作、skip link、focus-visible、語意 landmarks、aria-current、aria-expanded、原生 select/details、aria-live 結果。Escape 關閉手機導覽並還原焦點，不作 modal trap。非互動狀態也用文字說明，不只靠顏色。

圖片 hover／focus-within 最多上移 5px、180ms。Reduced Motion 停用 transition、transform 與 smooth scroll。沒有自動播放或先隱藏正文。無 JS 主要閱讀與導航仍可用。

Shiki github-dark 的註解原色在正文小字下不足 AA，建置 transformer 將該註解 token 提升至 `#aab3bd`，不關閉 axe 對比檢查。

圖片沿用 Astro Image WebP、srcset 與尺寸。實際產品畫面、合成資料、前端模擬、來源測試紀錄分別標示。自動 axe 零問題仍不代表完整 WCAG 合規；範圍見 TESTING。
