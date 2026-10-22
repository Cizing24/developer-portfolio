---
locale: en
translationKey: date-contracts
title: 'A date is not an instant: separating business dates from events'
description: Using AssetFlow offboarding to explain date-only values, actual departure dates, completion timestamps and the business-day boundary around midnight in Taiwan.
publishedAt: '2026-10-22'
category: Data modeling
tags: [TypeScript, Date, AssetFlow]
---

## Three fields, three facts

AssetFlow stores planned departure, actual departure and handover completion separately. A planned date is an intention; actual departure is a confirmed business fact; completion time is the instant an operation occurred. Returning equipment early does not mean the employee has already left.

This article summarizes date contracts, offboarding services and design documents at AssetFlow `7a698fbcd8bbffb4e46ec434a310690973aab77a`. It publishes conceptual summaries only.

## Date-only values do not shift timezones

The API DATE contract is `YYYY-MM-DD`. It does not describe an event at UTC midnight or Taiwan midnight. If an ORM requires a Date object as a carrier, define its conversion rules and restore date-only values at the boundary rather than allowing arbitrary browser conversion.

Event times are UTC instants transmitted as ISO strings with Z and displayed in an explicit business timezone. Both can be strings, but their meaning and validation differ.

## Today needs a business timezone

Around midnight in Taiwan, UTC can still be on the previous day. Taking the first ten characters of an ISO timestamp for today can break expected-return and actual-departure validation.

This is an independent explanatory example, not private source code:

```ts
const instant = new Date('2026-10-21T16:30:00Z');
const display = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Taipei',
  dateStyle: 'long',
}).format(instant);
// The calendar date in Taiwan is October 22, 2026.
```

## Date rules also need transactions

Before completing offboarding, the service acquires an Employee lock inside a transaction and rechecks zero active assignments, employee status and date bounds. Employee deactivation, actual departure, completion timestamp and audit commit together.

Field validation cannot replace concurrency control. Concurrency control cannot replace clear business meaning.

## Verification boundaries

The source project records regression coverage for date conversion, Taiwan midnight and offboarding. This portfolio does not rerun private-project tests or assume historical wrong dates can be corrected automatically; that requires external personnel facts.

[Read the AssetFlow case study](/en/projects/assetflow/)
