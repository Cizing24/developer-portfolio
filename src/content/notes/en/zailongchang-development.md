---
locale: en
translationKey: zailongchang-development
title: Zailongchang — a maintainable public home for local stories
description: Development notes from the live Zailongchang website, covering information architecture, publication conditions, media permissions and long-term maintenance.
publishedAt: '2026-10-28'
category: Zailongchang / Web development
tags: [Zailongchang, Next.js, Content management]
---

## Start with the place

[Zailongchang](https://zailongchang.tw/) is live. The website serves a continuing local identity through place introductions, cultural preservation, local services and collaborative exhibitions. A single event can have its own entry without becoming the identity of the entire website.

The development challenge is turning a large collection of potential material into a maintainable structure. Visitors first understand the place and its identity, then choose cultural stories or exhibitions. Launching the website does not mean that all cultural material is complete.

## Publication requires several conditions

The current source separates publication, public visibility and permission. Public cultural queries require all three conditions; hiding a link in the interface is not the access boundary.

Images follow the same principle. Public views use an explicitly published image URL rather than deriving one from the location of an internal original. Material that can be archived is not automatically material that should be published.

## Follow the content through the system

| Layer              | Development question                                                  |
| ------------------ | --------------------------------------------------------------------- |
| Content management | How do drafts, publication and permissions remain separate?           |
| Public queries     | Which records actually qualify for public display?                    |
| Pages              | How do identity, place, culture and exhibitions remain clear?         |
| Maintenance        | How are media, the database and the website maintained independently? |

The site uses Next.js, TypeScript, PostgreSQL with Prisma, and object storage. This note describes source-verified concepts without exposing the admin interface, private source or infrastructure identifiers. The portfolio island is a separate visual representation.

## Keep application records separate

My personal Youth Village Cultural Action application has its own [government-plan note](/en/notes/youth-village-action/). The website is live while the plan remains an application. Proposed tours, training and cultural outputs are not presented as completed work.
