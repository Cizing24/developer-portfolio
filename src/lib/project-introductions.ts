import type { Locale } from './i18n';
export type ProjectId = 'bookflow' | 'assetflow' | 'travelops';
export type IslandProjectId = Exclude<ProjectId, 'travelops'>;
export type ProjectTopic = 'purpose' | 'features' | 'architecture';
export const projectTopics: ProjectTopic[] = [
  'purpose',
  'features',
  'architecture',
];
export function projectIntroduction(project: ProjectId, locale: Locale) {
  const en = locale === 'en';
  if (project === 'travelops')
    return {
      name: 'TravelOps',
      tagline: en
        ? 'Follow a ticket from sale to settlement.'
        : '讓一張票，從售出到結算都有跡可循。',
      audience: en
        ? 'For customers, store staff, venue staff and operations teams in a synthetic ticketing scenario.'
        : '以旅客、門市、場館與營運人員共用的合成售票情境為設計對象。',
      purpose: en
        ? 'Online and store sales share stock, while payment, issuance, redemption and refunds finish at different times. TravelOps keeps these steps in one transaction model so a duplicate callback, unavailable queue or concurrent refund cannot silently lose the work or bypass ticket rules.'
        : '線上與門市共用庫存，付款、開券、核銷與退款卻在不同時間完成。TravelOps 將這些步驟放進同一套交易模型，處理重複回呼、佇列暫停與退款競爭，讓未完成的工作和票券狀態都能追查。',
      features: en
        ? [
            {
              title: 'Buy and follow a ticket',
              text: 'Browse tickets, simulate payment, follow issuance and inspect each venue entitlement.',
            },
            {
              title: 'Sell and redeem across channels',
              text: 'POS uses the same checkout and stock rules. Authorized venues validate entitlements before redemption.',
            },
            {
              title: 'Investigate and reconcile',
              text: 'Operations reviews refunds, recovers work and compares internal transactions with separate local Mock statements.',
            },
          ]
        : [
            {
              title: '購票與追蹤履約',
              text: '瀏覽票券、模擬付款、追蹤開券，並查看每個場館的剩餘權益。',
            },
            {
              title: '跨通路銷售與核銷',
              text: 'POS 共用結帳及庫存規則；場館經授權後檢查權益並核銷。',
            },
            {
              title: '營運調查與對帳',
              text: '審核退款、追蹤可恢復工作，比較內部交易與獨立保存的本地 Mock 帳冊。',
            },
          ],
      architecture: en
        ? [
            {
              title: 'Authorized role interfaces',
              tech: 'PHP 8.4 · Laravel · Livewire · Filament',
              text: 'A modular monolith shares business services across customer, POS, venue and operations screens.',
            },
            {
              title: 'Durable transaction state',
              tech: 'MySQL 8.4 · InnoDB',
              text: 'Transactions, row locks, Inbox and Outbox records protect stock, callback handling and persistent work.',
            },
            {
              title: 'Recoverable delivery',
              tech: 'Redis 7.4 · Worker · Scheduler · Docker',
              text: 'The scheduler redispatches durable work. Workers call local Mock adapters outside order locks and confirm results in a new transaction.',
            },
          ]
        : [
            {
              title: '依角色授權的操作介面',
              tech: 'PHP 8.4 · Laravel · Livewire · Filament',
              text: '以模組化單體共用業務服務，串起旅客、POS、場館與營運介面。',
            },
            {
              title: '持久交易狀態',
              tech: 'MySQL 8.4 · InnoDB',
              text: '透過交易、列鎖、Inbox 與 Outbox 保存庫存、回呼判斷及待處理工作。',
            },
            {
              title: '可恢復的工作派送',
              tech: 'Redis 7.4 · Worker · Scheduler · Docker',
              text: '排程重派持久工作；Worker 在訂單鎖外呼叫本地 Mock，再用新交易確認結果。',
            },
          ],
      status: en
        ? 'Independent project with private source, synthetic data and local Mock integrations. No production deployment or public login.'
        : '私人原始碼的獨立作品，使用合成資料及本地 Mock 整合，沒有正式部署或公開登入。',
    };
  if (project === 'bookflow')
    return {
      name: 'BookFlow',
      tagline: en
        ? 'Appointments, without the back-and-forth.'
        : '讓預約不用再來回傳訊息。',
      audience: en
        ? 'For appointment-based studios and service businesses.'
        : '為工作室、美容護理與採預約制的服務店家設計。',
      purpose: en
        ? 'Customers need to find a service and an available time. Businesses need a clear view of appointments, staff availability and changes. BookFlow brings both sides into one booking system, reducing the need to coordinate each appointment through messages.'
        : '顧客想知道有哪些服務、什麼時候可以預約；店家需要掌握行事曆、人員與臨時異動。BookFlow 把這兩件事放進同一套預約系統，減少逐筆用訊息確認的負擔。',
      features: en
        ? [
            {
              title: 'Book an appointment',
              text: 'Customers choose a service, staff member and available time, then manage their booking through a personal link.',
            },
            {
              title: 'Manage the working day',
              text: 'The business manages services, schedules, time off and appointments in one place.',
            },
            {
              title: 'Keep businesses separate',
              text: 'Each business works with its own staff, customers and bookings. Platform administration manages the businesses.',
            },
          ]
        : [
            {
              title: '顧客線上預約',
              text: '選擇服務、人員與可用時段，完成預約後，可透過專屬連結查看與管理預約。',
            },
            {
              title: '店家管理日常營運',
              text: '在同一個後台管理服務項目、人員排班、休假與預約行事曆。',
            },
            {
              title: '多店家各自管理',
              text: '每個店家有自己的員工、顧客與預約資料，平台則能管理各店家的啟用狀態。',
            },
          ],
      architecture: en
        ? [
            {
              title: 'Customer & business screens',
              tech: 'Next.js · TypeScript',
              text: 'Booking pages for customers and management screens for the business.',
            },
            {
              title: 'Booking service',
              tech: 'Next.js server / API',
              text: 'Checks permissions and availability, then handles booking, rescheduling and cancellation.',
            },
            {
              title: 'Shared records',
              tech: 'Prisma · PostgreSQL',
              text: 'Stores businesses, services, schedules and bookings while protecting their relationships.',
            },
          ]
        : [
            {
              title: '顧客與店家介面',
              tech: 'Next.js · TypeScript',
              text: '提供顧客預約頁面，以及店家使用的管理後台。',
            },
            {
              title: '預約服務',
              tech: 'Next.js server / API',
              text: '確認使用者權限與可用時段，處理預約、改期及取消。',
            },
            {
              title: '資料儲存',
              tech: 'Prisma · PostgreSQL',
              text: '保存店家、服務、排班與預約，維持資料之間的正確關聯。',
            },
          ],
      status: en
        ? 'Implemented as a project. Not publicly deployed; no public login or live service is provided.'
        : '已完成專案實作，尚未公開部署，未提供公開登入或正式服務。',
    };
  return {
    name: 'AssetFlow',
    tagline: en
      ? 'Know where every device belongs.'
      : '知道每一台設備在哪裡、由誰使用。',
    audience: en
      ? 'For internal IT teams managing equipment and employee handovers.'
      : '為管理公司設備與員工交接的內部 IT 人員設計。',
    purpose: en
      ? 'Equipment information often ends up scattered across spreadsheets and messages. AssetFlow keeps devices, employees and handover records together, so the team can see who uses each device and what still needs to be returned.'
      : '設備資料容易散落在試算表和訊息裡，時間久了，就很難確認誰正在使用哪一台、哪些還沒歸還。AssetFlow 集中管理設備、員工與交接紀錄，讓資產的去向清楚可查。',
    features: en
      ? [
          {
            title: 'Maintain an equipment register',
            text: 'View device details, availability and current assignees in one place.',
          },
          {
            title: 'Handle checkout & return',
            text: 'Record when a device is assigned or returned, and keep its history available.',
          },
          {
            title: 'Complete employee handovers',
            text: 'See equipment awaiting return during offboarding and follow the handover through to completion.',
          },
        ]
      : [
          {
            title: '整理設備清冊',
            text: '集中查看設備資訊、目前狀態，以及正在使用它的員工。',
          },
          {
            title: '辦理領用與歸還',
            text: '記錄設備交給誰、何時歸還，並保留每次異動的歷史。',
          },
          {
            title: '追蹤離職交接',
            text: '員工離職時，列出尚未歸還的設備，逐步完成交接。',
          },
        ],
    architecture: en
      ? [
          {
            title: 'IT management workspace',
            tech: 'Vue 3 · TypeScript',
            text: 'Screens for equipment, employees, assignments and offboarding.',
          },
          {
            title: 'Asset service',
            tech: 'Fastify / API',
            text: 'Checks roles and current equipment state before handling each operation.',
          },
          {
            title: 'Asset & handover records',
            tech: 'Prisma · PostgreSQL',
            text: 'Keeps equipment, employee assignments and audit history together.',
          },
        ]
      : [
          {
            title: 'IT 管理介面',
            tech: 'Vue 3 · TypeScript',
            text: '提供設備、員工、領用紀錄與離職交接的操作畫面。',
          },
          {
            title: '資產服務',
            tech: 'Fastify / API',
            text: '確認操作者的角色與設備狀態，再處理領用、歸還與交接。',
          },
          {
            title: '資產與交接資料',
            tech: 'Prisma · PostgreSQL',
            text: '保存設備、員工、領用關係，以及可供追查的異動紀錄。',
          },
        ],
    status: en
      ? 'Personal project with public source code. No public login or live demo is provided.'
      : '個人實作專案，原始碼已公開；未提供公開登入或線上 Demo。',
  };
}
export function topicTitle(topic: ProjectTopic, locale: Locale) {
  return (
    locale === 'en'
      ? {
          purpose: 'Project purpose',
          features: 'What it does',
          architecture: 'How it is built',
        }
      : { purpose: '專案目的', features: '主要作用', architecture: '系統架構' }
  )[topic];
}
