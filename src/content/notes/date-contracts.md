---
title: 日期不是時間點：把業務日期與事件時間分開
description: 以 AssetFlow 的離職交接為例，說明純日期、實際離職日與完成時間的資料契約，以及台灣午夜的邊界。
publishedAt: '2026-10-22'
category: 資料建模
tags: [TypeScript, Date, AssetFlow]
---

## 三個欄位，三種事實

AssetFlow 分別保存預計離職日、實際離職日與交接完成時間。預計日是規劃；實際離職日是經確認的業務事實；交接完成時間則是一次操作發生的瞬間。即使設備提早歸還，也不能直接將員工視為已離職。

本文依 AssetFlow `7a698fbcd8bbffb4e46ec434a310690973aab77a` 的日期契約、交接服務與設計文件整理，只公開概念摘要。

## 純日期不做時區位移

DATE 的 API 契約是 `YYYY-MM-DD`，不代表 UTC 午夜或台灣午夜的一個事件。若 ORM 必須使用 Date 物件承載，應明確定義 carrier 的轉換規則，再於邊界還原純日期，而不是讓瀏覽器自由轉換。

事件時間則保存 UTC instant，以含 Z 的 ISO 格式傳輸，顯示時明確採用業務時區。兩種資料都可能以字串傳輸，但語意與驗證不同。

## 今天需要業務時區

台灣凌晨時，UTC 仍可能是前一天。使用 ISO timestamp 的前十碼取「今天」，會讓預計歸還與實際離職驗證在午夜附近出錯。

以下為獨立說明範例，不是私人原始碼：

```ts
const instant = new Date('2026-10-21T16:30:00Z');
const display = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Taipei',
  dateStyle: 'long',
}).format(instant);
// 台灣曆日是 2026 年 10 月 22 日。
```

## 日期規則也需要交易保護

完成交接前，服務在交易內取得 Employee lock，重新檢查零有效領用、員工狀態與日期範圍。員工停用、實際離職日、交接完成 timestamp 與 audit 一起提交。

欄位驗證無法取代並行控制；並行控制也無法替代清楚的業務語意。

## 驗證邊界

原專案記錄涵蓋日期轉換、台灣午夜與交接流程回歸。本網站未重新執行私人專案測試，也不推定歷史錯填的日期可以自動修正；那需要外部人事事實。

[閱讀 AssetFlow 案例](/projects/assetflow/)
