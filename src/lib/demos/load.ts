export function loadDemo(root: HTMLElement, initialize: () => Promise<void>) {
  const controls = [
    ...root.querySelectorAll<
      HTMLInputElement | HTMLButtonElement | HTMLSelectElement
    >('input,button,select'),
  ];
  const disabled = controls.map((control) => control.disabled);
  const status = document.createElement('p');
  status.role = 'status';
  const en = document.documentElement.lang.startsWith('en');
  root.prepend(status);
  const block = (event: Event) => event.preventDefault();
  root.addEventListener('submit', block, true);
  async function attempt() {
    controls.forEach((control) => (control.disabled = true));
    status.textContent = en
      ? 'Loading interactive controls…'
      : '正在載入操作功能…';
    try {
      await initialize();
      controls.forEach(
        (control, index) => (control.disabled = disabled[index]!),
      );
      root.removeEventListener('submit', block, true);
      status.remove();
    } catch {
      status.textContent = en
        ? 'Controls could not load. '
        : '操作功能載入失敗。';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = en ? 'Retry' : '重試';
      retry.addEventListener('click', () => void attempt(), { once: true });
      status.append(retry);
    }
  }
  void attempt();
}
