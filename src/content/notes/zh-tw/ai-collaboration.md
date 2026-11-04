---
locale: zh-tw
translationKey: ai-collaboration
title: AI 協作：讓需求、實作與驗證各自有依據
description: 以本次 AssetFlow 與 BookFlow 作品集整備為例，說明人的目標與公開決策、Codex 的查證與實作，以及尚不能認定的作者分工。
publishedAt: '2026-11-04'
category: AI Collaboration
tags: [AI Collaboration, 工程證據]
---

## 我指定方向，協作者把證據連起來

本次工作由我指定求職定位、工程成果優先順序、保留 V3 互動世界，以及公開來源和部署範圍。Codex 作為實作與驗證協作者，核對公開程式、整理雙語案例、修改頁面並執行必要檢查。這是本次的可公開分工摘要，沒有換算為工時或程式碼百分比。

## AssetFlow：從設備介面追到交接規則

我要求展示已存在的完整流程，並遵守原始碼公開限制。Codex 先確認 Repository 當下為 Public，再追查 Vue 領還表單、Pinia 登入狀態、生命週期交易、日期契約及測試，把「設備歸還」與「確認實際離職」分成清楚的工程說明。

成果可由[案例](/zh-tw/projects/assetflow/)、[日期修正 Commit](https://github.com/Cizing24/assetflow-itam/commit/7a698fbcd8bbffb4e46ec434a310690973aab77a)及[歷史 CI](https://github.com/Cizing24/assetflow-itam/actions/runs/39593727102)對照。這些來源證明規則與測試紀錄，沒有單獨證明過往每段程式的人工／AI 分工。

## BookFlow：從預約操作追到並行保護

我指定優先整理既有成果，不增加金流或訂閱模組。Codex 核對 React 表單、API、Tenant lock、冪等與排程測試，將可用時段、搶訂與回應遺失後重試分開解釋。

成果可由[案例](/zh-tw/projects/bookflow/)、[公開 PR #1](https://github.com/Cizing24/bookflow-saas/pull/1)及[歷史 CI](https://github.com/Cizing24/bookflow-saas/actions/runs/39655913415)對照。這次沒有重新執行兩個系統的測試，也不把測試紀錄當作正式營運成效。

## 哪些事情可以公開說明

| 已證實                                                        | 合理推論                                 | 待使用者確認                             |
| ------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| 本次目標由我指定，公開案例與頁面由 Codex 協助查證、整理及實作 | 不以作者名稱、提交時間推定程式分工       | 過往每個架構決策、手寫範圍及學習完成程度 |
| 公開程式、Commit、PR 與對應版本 CI 可供檢查                   | 不由綠燈推定正式服務容量或所有細節已熟練 | 尚未有紀錄的親自驗收與正式營運           |

只有「已證實」的部分作為事實敘述。更完整的本次範圍見[公開協作紀錄](https://github.com/Cizing24/developer-portfolio/blob/main/docs/AI_COLLABORATION.md)。作品集變更可從該文件的 Git 歷史追查，私人筆記與對話不在公開來源中。
