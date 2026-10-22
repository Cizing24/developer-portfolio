import type { Locale } from './i18n';
export type System = 'bookflow' | 'assetflow';
export type Scenario = 'success' | 'conflict' | 'denied';
export interface Step {
  title: string;
  detail: string;
  state: string;
}
export function simulationSteps(
  system: System,
  scenario: Scenario,
  locale: Locale,
): Step[] {
  const en = locale === 'en';
  const rows =
    system === 'bookflow'
      ? en
        ? [
            [
              'Booking requests',
              scenario === 'success'
                ? 'Synthetic customers A and B select adjacent, non-overlapping buffered slots for the same staff member.'
                : 'Two synthetic customers A and B select the same staff member and buffered slot. A visible slot is not reserved.',
              'A + B · pending',
            ],
            [
              'Tenant context',
              'Resolve the active tenant and scope service, staff and customer relationships to tenantId. A URL alone is not authorization.',
              'Tenant · scoped',
            ],
            [
              'Concurrency control',
              'Acquire the shared Tenant row lock inside a transaction. B waits while A owns the lock.',
              'A · locked / B · waiting',
            ],
            [
              'Slot validation',
              'Reread tenant status, policy, qualifications, schedules, absences and occupancy after acquiring the lock.',
              'A · valid',
            ],
            [
              'Database constraint',
              'The partial GiST exclusion constraint protects CONFIRMED buffered occupancy. Booking, event and outbox commit together.',
              'A · committed',
            ],
            [
              'Result',
              scenario === 'conflict'
                ? 'A succeeds. B acquires the lock and rereads committed occupancy: the slot is unavailable, so B receives 409. GiST remains a separate database defense.'
                : 'A succeeds. In this scenario B selected an adjacent non-overlapping slot, so its revalidation and commit also succeed. No capacity claim is implied.',
              scenario === 'conflict'
                ? 'A · success / B · 409 conflict'
                : 'A + B · success',
            ],
          ]
        : [
            [
              '預約請求',
              scenario === 'success'
                ? '合成顧客 A、B 為同一人員選擇相鄰且不重疊的含緩衝占用區間。'
                : '合成顧客 A、B 選擇同一人員與含緩衝時段。畫面可用不代表時段已保留。',
              'A + B · 等待',
            ],
            [
              'Tenant Context',
              '讀取啟用店家，以 tenantId 限定服務、人員與顧客關聯。URL 本身不構成授權。',
              'Tenant · 已限定',
            ],
            [
              '並行控制',
              '交易內取得共用 Tenant row lock。A 持鎖時，B 等待同一把鎖。',
              'A · 持鎖 / B · 等待',
            ],
            [
              '時段驗證',
              '取得鎖後重新讀取店家狀態、政策、資格、排班、休假與有效占用。',
              'A · 驗證通過',
            ],
            [
              'Database Constraint',
              '部分 GiST 排他約束保護 CONFIRMED 含緩衝占用。預約、事件與 Outbox 同交易提交。',
              'A · 已提交',
            ],
            [
              '結果',
              scenario === 'conflict'
                ? 'A 成功。B 取得鎖後重新讀到已提交占用，時段不可用，回傳 409；GiST 仍是獨立的資料庫防線。'
                : 'A 成功。此情境的 B 選擇相鄰且不重疊的占用區間，重新驗證後也成功提交。此結果不代表容量測試。',
              scenario === 'conflict'
                ? 'A · 成功 / B · 409 衝突'
                : 'A + B · 成功',
            ],
          ]
      : en
        ? [
            [
              'Asset state',
              'A synthetic device begins AVAILABLE. Only an active employee can receive it.',
              'AVAILABLE',
            ],
            [
              'Checkout request',
              'A checkout request selects a device and employee. Client state is not authoritative.',
              'Request · pending',
            ],
            [
              'Permission check',
              scenario === 'denied'
                ? 'The current role is VIEWER. Server RBAC rejects the write with 403 before entering the lifecycle transaction.'
                : 'Session, Origin and CSRF are checked. ADMIN and IT_STAFF are allowed to write; frontend controls do not grant access.',
              scenario === 'denied' ? '403 · denied' : 'IT_STAFF · allowed',
            ],
            [
              'Database transaction',
              scenario === 'denied'
                ? 'No lifecycle transaction runs for the denied request.'
                : 'A Serializable transaction locks Employee then Asset, rereads both states and conditionally updates AVAILABLE to ASSIGNED.',
              scenario === 'denied'
                ? 'Transaction · skipped'
                : 'ASSIGNED · uncommitted',
            ],
            [
              'Audit log',
              scenario === 'denied'
                ? 'No successful checkout audit is created. This simulation does not claim rejected requests are stored in AuditLog.'
                : 'Create the assignment and append CHECKOUT audit in the same transaction. An audit failure would roll back the business change.',
              scenario === 'denied'
                ? 'No checkout audit'
                : 'Assignment + audit · atomic',
            ],
            [
              'Result',
              scenario === 'denied'
                ? '403: the device remains AVAILABLE. No assignment or checkout audit is written.'
                : scenario === 'conflict'
                  ? 'A commits. B locks and rereads ASSIGNED, so its repeated checkout receives 409. A partial unique index also protects active assignments.'
                  : 'Commit succeeds: AVAILABLE becomes ASSIGNED, with one assignment and its audit record.',
              scenario === 'denied'
                ? 'AVAILABLE · unchanged'
                : scenario === 'conflict'
                  ? 'A · success / B · 409 conflict'
                  : 'ASSIGNED · success',
            ],
          ]
        : [
            [
              '資產狀態',
              '合成設備初始為 AVAILABLE，只有在職員工可以領用。',
              'AVAILABLE',
            ],
            [
              '借出申請',
              '提出設備與員工的領用申請。前端顯示不是權威狀態。',
              '申請 · 等待',
            ],
            [
              '權限檢查',
              scenario === 'denied'
                ? '目前角色為 VIEWER，伺服器 RBAC 回傳 403，在生命週期交易前拒絕寫入。'
                : '先檢查 Session、Origin 與 CSRF。ADMIN、IT_STAFF 可寫入，介面控制不授予權限。',
              scenario === 'denied' ? '403 · 拒絕' : 'IT_STAFF · 允許',
            ],
            [
              '資料庫交易',
              scenario === 'denied'
                ? '遭拒的請求不執行生命週期交易。'
                : 'Serializable transaction 依 Employee、Asset 固定順序取鎖，重新檢查狀態，條件更新 AVAILABLE 為 ASSIGNED。',
              scenario === 'denied' ? '交易 · 未執行' : 'ASSIGNED · 尚未提交',
            ],
            [
              'Audit Log',
              scenario === 'denied'
                ? '不建立成功領用稽核；此模擬不宣稱拒絕請求寫入 AuditLog。'
                : '建立領用紀錄，於同交易追加 CHECKOUT 稽核；稽核寫入失敗時，業務變更一起回滾。',
              scenario === 'denied' ? '無領用稽核' : '領用 + 稽核 · 原子提交',
            ],
            [
              '結果',
              scenario === 'denied'
                ? '403：設備維持 AVAILABLE，不建立領用與領用稽核。'
                : scenario === 'conflict'
                  ? 'A 提交後，B 取鎖重新讀到 ASSIGNED，重複領用回傳 409。部分唯一索引另保護有效領用。'
                  : '提交成功：AVAILABLE 變為 ASSIGNED，產生一筆領用與對應稽核。',
              scenario === 'denied'
                ? 'AVAILABLE · 未變更'
                : scenario === 'conflict'
                  ? 'A · 成功 / B · 409 衝突'
                  : 'ASSIGNED · 成功',
            ],
          ];
  return rows.map(([title = '', detail = '', state = '']) => ({
    title,
    detail,
    state,
  }));
}
export function nextStep(current: number, count: number) {
  return Math.min(Math.max(current, 0) + 1, count);
}
