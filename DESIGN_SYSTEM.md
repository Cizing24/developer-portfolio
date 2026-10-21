# 設計系統

定位是工程師作品集，以完整案例與設計理由建立辨識度。不是 SaaS dashboard，也不以裝飾動畫取代內容。

## 色彩

所有語意 token 位於 `src/styles/global.css`。

| Token   | Dark      | Light     | 用途             |
| ------- | --------- | --------- | ---------------- |
| bg      | `#101310` | `#f5f5ee` | 主背景           |
| surface | `#191d18` | `#e9ece2` | 次層背景         |
| text    | `#f0f0e8` | `#172015` | 主要文字         |
| muted   | `#a8afa4` | `#52604c` | 次要文字         |
| line    | `#343b32` | `#c6cdbd` | 分隔線           |
| accent  | `#c4f178` | `#385b1a` | 重點、focus、CTA |

深色為預設，使用者選擇保存在 localStorage；讀寫失敗時仍能切換當頁，不阻止內容。載入 head 的小型 inline script 在繪製前套用已選主題。

## 字體與尺度

採系統字體 Segoe UI、Noto Sans TC、Microsoft JhengHei，不載入外部字型。中文以易讀為優先；英文 eyebrow 與 metadata 採 Consolas monospace。標題使用 clamp 隨視窗縮放；正文約 16px、行高 1.8，長文限制閱讀寬度約 790px。

首頁以大標題、留白、細線與雙欄作品建立編輯節奏。ProjectCard 以經核對截圖呈現內容，底色區分兩個作品；完整案例不裁切成假產品 UI。

## 版面與元件

- 主內容最大寬度 1240px，桌面雙欄、手機單欄。
- 1000px 調整間距，760px 切換手機導覽與單欄文章。
- 768px 平板保留完整導覽；390px 手機以選單開合。
- Base layout 統一導覽、footer、metadata；ProjectCard、ContactCTA、TableOfContents 可重用。
- 按鈕主要路徑為「作品 → 案例 → 原始碼／聯絡」，避免不必要的選擇。

## 互動與無障礙

有 skip link、語意標題、原生 select、明確 label、aria-expanded、aria-current、圖片 alt 與 focus-visible。Escape 關閉手機選單並歸還焦點；不使用 modal focus trap，因選單是文件流中的展開導覽。

Hover 僅有輕微位移與截圖角度變化；prefers-reduced-motion 關閉轉場、動畫與 smooth scroll。篩選結果有 aria-live 計數與空狀態。無障礙以 WCAG 2.2 AA 為目標，實測範圍見 TESTING；自動化零問題不等於完整合規認證。

## 資產

截圖由 Astro Image 輸出多寬度 WebP、srcset、sizes，列表 lazy loading，案例主圖 eager。OG 提供 1200×630 PNG，原始向量版也保留；`npm run og` 可重建。所有圖片自本機提供，不依賴遠端影像服務。
