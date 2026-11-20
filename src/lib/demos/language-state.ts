export function takeLanguageState(key: string): unknown {
  try {
    const saved = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return saved && saved.length < 100000 ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function keepOnLanguageChange(key: string, snapshot: () => unknown) {
  document
    .querySelectorAll('[data-reader-locale], [data-world-locale]')
    .forEach((link) =>
      link.addEventListener('click', () => {
        try {
          sessionStorage.setItem(key, JSON.stringify(snapshot()));
        } catch {
          /* Storage is optional. */
        }
      }),
    );
}
