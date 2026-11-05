// These fixtures live in the reader only. Source product transactions are separate.
export const bookingDates = ['2026-11-12', '2026-11-13', '2026-11-14'];
const staffSchedules: Record<string, string[][]> = {
  north: [['10:00', '11:00'], ['13:00', '14:00'], []],
  south: [['14:00'], ['10:00', '15:00'], []],
};
export type BookingInput = {
  service: string;
  date: string;
  staff: string;
  time: string;
};

export function createBookingDemo() {
  const reservations: BookingInput[] = [];
  function slots({ date, staff, service }: Omit<BookingInput, 'time'>) {
    const schedule = staffSchedules[staff]?.[bookingDates.indexOf(date)] ?? [];
    if (service === 'consult') return schedule;
    if (service === 'session')
      return schedule.filter((_, index) => index === 0);
    return [];
  }
  function isTaken({ date, staff, time }: BookingInput) {
    return reservations.some(
      (item) =>
        item.date === date && item.staff === staff && item.time === time,
    );
  }
  return {
    slots,
    isTaken,
    submit(input: BookingInput) {
      if (!slots(input).includes(input.time)) return 'missing';
      if (isTaken(input)) return 'conflict';
      reservations.push({ ...input });
      return 'confirmed';
    },
    reset() {
      reservations.length = 0;
    },
  };
}

const initialAssets = [
  { id: 'LT-104', kind: 'laptop', status: 'available', holder: '' },
  { id: 'DT-207', kind: 'desktop', status: 'assigned', holder: 'B' },
  { id: 'MN-302', kind: 'monitor', status: 'maintenance', holder: '' },
] as const;
type AssetStatus = (typeof initialAssets)[number]['status'];
type Asset = {
  id: string;
  kind: (typeof initialAssets)[number]['kind'];
  status: AssetStatus;
  holder: string;
};
type Action = 'checkout' | 'checkin' | 'damaged';
type AuditEvent = {
  action: Action;
  asset: string;
  holder: string;
  status: AssetStatus;
  description: string;
};
export const demoEmployees = ['A', 'B'] as const;

export function createAssetDemo() {
  let assets: Asset[] = [];
  const events: AuditEvent[] = [];
  function reset() {
    assets = initialAssets.map((asset) => ({ ...asset }));
    events.length = 0;
  }
  reset();
  return {
    get assets() {
      return assets;
    },
    events,
    reset,
    act(action: Action, id: string, employee: string, description: string) {
      const asset = assets.find((item) => item.id === id);
      if (!asset) return 'assetRequired';
      if (action === 'checkout') {
        if (asset.status !== 'available') return 'unavailable';
        if (!demoEmployees.some((id) => id === employee))
          return 'employeeRequired';
        if (employee === 'B') return 'offboardingEmployee';
        asset.holder = employee;
        asset.status = 'assigned';
      } else {
        if (asset.status !== 'assigned') return 'notAssigned';
        if (action === 'damaged' && !description.trim())
          return 'descriptionRequired';
        asset.status = action === 'damaged' ? 'maintenance' : 'available';
      }
      events.unshift({
        action,
        asset: asset.id,
        holder: asset.holder,
        status: asset.status,
        description: action === 'damaged' ? description.trim() : '',
      });
      if (action !== 'checkout') asset.holder = '';
      return 'updated';
    },
  };
}
