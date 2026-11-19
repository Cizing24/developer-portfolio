# V3 design direction

首頁是 Experience，展館與模擬是 Operate，案例頁是 Read。沿用 limestone、teal、coral、brass 與低多邊形材質；文字與表單沿用既有 CSS tokens。

固定功能區（七個地塊）：中央 Main Hall、左側 Project Harbor、右側 Engineering Lab、西南 Notes 閱讀區、北側 About、東南 Contact、獨立 Community 港口。Project Harbor 使用三個可重用展台，內容選擇移至可分頁、篩選的閱讀框。中央廣場通往五座主島，Community 保留海路。

Three.js 不匯入作品 ID。展台只管理固定位置，名稱與入口來自 Content Collections。主要入口「查看作品」始終可見，直接作品列表提供 no-JS 路徑。保留原生 dialog 的 Escape、焦點回復與上一頁行為。

新增 UI：展館為封面加摘要的橫向作品列；手機單欄，控制項至少 44px；互動以欄位、狀態表與紀錄呈現。新素材不生成，重用已審核素材。實作後以四尺寸 Chromium、axe、鍵盤與截圖檢查。
