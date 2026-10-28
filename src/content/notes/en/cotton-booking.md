---
locale: en
translationKey: cotton-booking
title: Cotton booking — turning client needs into a clear booking flow
description: A limited public account of client work, covering booking flow, existing workflows, consistency and error feedback while protecting internal client information.
publishedAt: '2026-10-28'
category: Client work
tags: [Booking flow, Requirements, Data consistency]
---

## Begin with the client's workflow

The Cotton booking website is a client project. These public notes discuss shareable engineering decisions: helping customers complete a booking while allowing the business to keep familiar tools and limit additional administration.

## Separate interface steps from business rules

The customer flow has three broad stages: select a date and time, provide necessary information, and confirm the result. Behind that interface, the server must validate input, availability and booking state again. Availability previously shown in a browser cannot be the final authority.

| Situation                  | Engineering concern                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| Concurrent bookings        | Check availability and create the record within one consistency boundary |
| Temporary external failure | Separate persistence from subsequent synchronization and allow retries   |
| Customer uncertainty       | Give clear feedback that discourages duplicate submissions               |
| Maintenance                | Retain enough history to investigate failures                            |

## Define a useful delivery boundary

The project reinforced the relationship between requirements and everyday operations. More features do not automatically serve a client better. Daily use, maintenance and troubleshooting also shape a useful delivery.

This page excludes customer data, precise operating rules, third-party accounts, internal procedures, deployment addresses and source code. It also provides no independently unauthorized demo link. This is an engineering summary rather than an operating manual for the client's system.
