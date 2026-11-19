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
    get reservations() {
      return reservations.map((value) => ({ ...value }));
    },
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
