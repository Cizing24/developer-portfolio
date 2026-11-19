import { takeLanguageState, keepOnLanguageChange } from './language-state';
import { createBookingDemo } from './bookflow-model';
export function initBooking(form: HTMLFormElement) {
  const demo = createBookingDemo();
  const saved = takeLanguageState('bookflow-language');
  if (Array.isArray(saved) && saved.length < 100)
    for (const item of saved) {
      if (
        item &&
        ['service', 'date', 'staff', 'time'].every(
          (key) => typeof item[key] === 'string',
        )
      )
        demo.submit(item);
    }
  keepOnLanguageChange('bookflow-language', () => demo.reservations);
  const copy = JSON.parse(form.dataset.copy!) as Record<string, string>;
  const steps = [
    ...form.querySelectorAll<HTMLFieldSetElement>('[data-booking-step]'),
  ];
  const progress = form.querySelectorAll('ol li');
  const service = form.querySelector<HTMLSelectElement>('[name=service]')!;
  const date = form.querySelector<HTMLSelectElement>('[name=date]')!;
  const staff = form.querySelector<HTMLSelectElement>('[name=staff]')!;
  const time = form.querySelector<HTMLSelectElement>('[name=time]')!;
  const summary = form.querySelector<HTMLElement>('[data-booking-summary]')!;
  const back = form.querySelector<HTMLButtonElement>('[data-booking-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-booking-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!;
  const status = form.querySelector<HTMLElement>('[data-demo-status]')!;
  let step = 0;

  function input() {
    return {
      service: service.value,
      date: date.value,
      staff: staff.value,
      time: time.value,
    };
  }
  function message(key: string, kind = 'error') {
    status.textContent = copy[key] ?? '';
    status.dataset.kind = kind;
  }
  function updateTimes() {
    const selected = time.value;
    const context = input();
    const slots = demo.slots(context);
    time.length = 1;
    for (const slot of slots) {
      const taken = demo.isTaken({ ...context, time: slot });
      time.add(new Option(taken ? `${slot} · ${copy.taken}` : slot, slot));
    }
    time.value = slots.includes(selected) ? selected : '';
    time.disabled = !slots.length;
    submit.disabled = !slots.length;
    summary.textContent = [service, date, staff]
      .map((field) => field.selectedOptions[0]?.text)
      .join(' · ');
    if (slots.length === 0) message('empty');
  }
  function go(index: number) {
    step = index;
    steps.forEach((group, i) => {
      group.hidden = i !== step;
      if (i === step) progress[i]?.setAttribute('aria-current', 'step');
      else progress[i]?.removeAttribute('aria-current');
    });
    back.hidden = step === 0;
    next.hidden = step === 2;
    submit.hidden = step !== 2;
    message('');
    if (step === 2) updateTimes();
    (
      steps[step]?.querySelector<HTMLSelectElement>('select:enabled') ?? back
    ).focus();
  }
  function forward() {
    if (step === 0 && !service.value) {
      message('service');
      service.focus();
    } else if (step === 1 && (!date.value || !staff.value)) {
      message('schedule');
      (!date.value ? date : staff).focus();
    } else go(step + 1);
  }
  next.addEventListener('click', forward);
  back.addEventListener('click', () => go(step - 1));
  form.addEventListener('change', (event) => {
    if (event.target !== time) time.value = '';
    message('');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (step < 2) {
      forward();
      return;
    }
    if (!time.value) {
      message(time.disabled ? 'empty' : 'slot');
      time.focus();
      return;
    }
    const result = demo.submit(input());
    if (result === 'confirmed') updateTimes();
    message(
      result === 'missing' ? 'slot' : result,
      result === 'confirmed' ? 'success' : 'error',
    );
  });
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    demo.reset();
    service.value = date.value = staff.value = time.value = '';
    go(0);
    message('reset', 'success');
  });
}
