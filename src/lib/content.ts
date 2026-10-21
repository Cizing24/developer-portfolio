export function filterProjects<T extends { data: { tags: string[] } }>(
  projects: T[],
  tag = '',
): T[] {
  return tag
    ? projects.filter((project) => project.data.tags.includes(tag))
    : projects;
}
export function sortProjects<T extends { data: { order: number } }>(
  projects: T[],
): T[] {
  return [...projects].sort((a, b) => a.data.order - b.data.order);
}
export function publishedNotes<
  T extends { data: { draft: boolean; publishedAt: string } },
>(notes: T[]): T[] {
  return notes
    .filter((note) => !note.data.draft)
    .sort((a, b) => b.data.publishedAt.localeCompare(a.data.publishedAt));
}
export function readingMinutes(body = ''): number {
  return Math.max(
    1,
    Math.ceil((body.match(/[\u3400-\u9fff]|\b\w+\b/g)?.length ?? 0) / 350),
  );
}
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Taipei',
  }).format(new Date(`${value}T00:00:00Z`));
}
