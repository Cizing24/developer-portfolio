import type { Locale } from './i18n';
import type { ProjectId } from './project-introductions';

export function showcaseEngineering(id: ProjectId, locale: Locale) {
  const en = locale === 'en';
  if (id === 'bookflow') {
    return {
      nodes: [
        {
          name: en ? 'Customer form & calendar' : '顧客表單與店家行事曆',
          stack: 'React · Next.js',
          detail: en
            ? 'The customer form refreshes available times after a service, staff or date change. The business calendar uses staff schedules, time off and appointments.'
            : '顧客變更服務、人員或日期時，表單會更新可用時段。店家行事曆依人員排班、休假及既有預約安排工作。',
          path: 'src/components/booking-form.tsx',
        },
        {
          name: en ? 'Booking service & access' : '預約服務與存取權限',
          stack: 'Next.js · TypeScript',
          detail: en
            ? 'The server recalculates availability at submission. Tenant-scoped queries and role checks restrict access. An idempotency key lets the same request be retried safely.'
            : '送出時由伺服器重新計算可用時段。租戶範圍查詢與角色檢查限制存取。相同請求可用冪等鍵安全重試。',
          path: 'src/modules/booking/service.ts',
        },
        {
          name: en ? 'Transactions & scheduling constraints' : '交易與排程約束',
          stack: 'Prisma · PostgreSQL',
          detail: en
            ? 'The database rejects overlapping active reservations for the same staff member. A tenant-scoped unique index protects idempotency keys under concurrent writes.'
            : '資料庫拒絕同一人員時間重疊的有效預約，並以租戶範圍唯一索引保護併發寫入時的冪等鍵。',
          path: 'prisma/migrations/202610210003_scheduling/migration.sql',
        },
      ],
      tests: 'tests/integration/scheduling.test.ts',
      ci: '39655913415',
      notes: 'booking-consistency',
      supporting: 'docs/PERMISSIONS.md',
      engineering: en
        ? 'If two customers submit the same time, the losing transaction returns a conflict. Try the concurrency scenario in Engineering Lab for a two-request walkthrough.'
        : '兩位顧客同時送出相同時段時，未取得時段的請求會收到衝突回饋。工程實驗室另有兩筆請求競爭的逐步展示。',
      limits: en
        ? 'The portfolio uses fixed demo schedules and marks slots by staff and start time. Live scheduling, emails and customer management links belong to the source product.'
        : '作品集使用固定示範排班，依人員及起始時間標記時段。即時排程、寄信及顧客管理連結屬於原產品。',
    };
  }
  return {
    nodes: [
      {
        name: en ? 'Equipment & assignment workspace' : '設備與領還工作區',
        stack: 'Vue 3 · Pinia',
        detail: en
          ? 'The assignment form uses the API to list equipment and report validation errors. Pinia stores session state for navigation and user feedback.'
          : '領還表單透過 API 查詢設備與回報驗證結果。Pinia 保存登入狀態，供導覽與介面提示使用。',
        path: 'apps/web/src/pages/Assignments.vue',
      },
      {
        name: en ? 'Authorized lifecycle actions' : '授權與生命週期操作',
        stack: 'Fastify · TypeScript',
        detail: en
          ? 'API permissions control who may write. The service locks relevant rows and checks current employee and equipment states before checkout, return or handover.'
          : 'API 依權限決定誰可寫入。服務層鎖定相關資料列，在領用、歸還或交接前檢查員工與設備的當前狀態。',
        path: 'apps/api/src/services/lifecycle.ts',
      },
      {
        name: en ? 'State, assignment & audit records' : '狀態、領用與稽核紀錄',
        stack: 'Prisma · PostgreSQL',
        detail: en
          ? 'Assignment, asset state and audit entries are written within the same transaction. A damaged return also creates a maintenance record.'
          : '領用紀錄、設備狀態與稽核事件在同一筆交易中寫入。故障歸還還會建立維修紀錄。',
        path: 'apps/api/prisma/schema.prisma',
      },
    ],
    tests: 'apps/api/test/integration.test.ts',
    ci: '39593727102',
    notes: 'date-contracts',
    supporting: 'apps/api/src/routes.ts',
    engineering: en
      ? 'If a write fails, the transaction rolls back. The equipment state and audit history stay at their previous values. Outstanding equipment blocks handover completion.'
      : '任一寫入失敗時，交易會回滾，設備狀態與稽核歷程保留原值。離職員工仍有設備未歸還時，交接無法結案。',
    limits: en
      ? 'The reader has two synthetic employees and a local event log. The source product adds authorization, persistent history and departure-date validation.'
      : '閱覽室使用兩名合成員工與暫態事件紀錄。原產品另有授權、持久化歷程及實際離職日期驗證。',
  };
}
