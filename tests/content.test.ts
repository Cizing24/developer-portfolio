import { describe, expect, it } from 'vitest';
import { projectSchema, noteSchema } from '../src/lib/schemas';
import {
  filterProjects,
  publishedNotes,
  sortProjects,
  readingMinutes,
  formatDate,
} from '../src/lib/content';
import { canonicalUrl, pageTitle, safeJsonLd } from '../src/lib/metadata';
import { resolveSiteUrl } from '../src/lib/site-url.mjs';

const project = {
  locale: 'zh-tw',
  translationKey: 'project',
  title: 'Project',
  description: 'A verified engineering project for public display.',
  category: 'ENGINEERING',
  tags: ['TypeScript'],
  highlights: ['Transactions'],
  status: '已實作・隔離展示',
  visibility: 'public',
  order: 1,
  sourceCommit: 'a'.repeat(40),
  reviewedAt: '2026-10-22',
  coverAlt: 'Actual screenshot with synthetic data',
};
describe('content schema', () => {
  it('accepts an evidence-backed project with no fabricated demo', () => {
    expect(projectSchema.parse(project).demo).toBeUndefined();
  });
  it('rejects a private source link', () => {
    expect(
      projectSchema.safeParse({
        ...project,
        visibility: 'private',
        repository: 'https://github.com/org/private',
      }).success,
    ).toBe(false);
  });
  it('rejects unsafe URLs', () => {
    expect(
      projectSchema.safeParse({ ...project, demo: 'javascript:alert(1)' })
        .success,
    ).toBe(false);
  });
  it('rejects missing evidence version', () => {
    expect(
      projectSchema.safeParse({ ...project, sourceCommit: 'unknown' }).success,
    ).toBe(false);
  });
  it('rejects a nonexistent calendar date', () => {
    expect(
      projectSchema.safeParse({ ...project, reviewedAt: '2026-02-30' }).success,
    ).toBe(false);
  });
  it('rejects incomplete articles', () => {
    expect(noteSchema.safeParse({ title: 'Empty' }).success).toBe(false);
  });
});
describe('content utilities', () => {
  const projects = [
    { data: { tags: ['Vue'], order: 2 } },
    { data: { tags: ['Next.js', 'TypeScript'], order: 1 } },
  ];
  it('filters exact technology tags', () => {
    expect(filterProjects(projects, 'Vue')).toEqual([projects[0]]);
  });
  it('returns all when no filter is selected', () => {
    expect(filterProjects(projects)).toHaveLength(2);
  });
  it('supports an empty result', () => {
    expect(filterProjects(projects, 'Rust')).toEqual([]);
  });
  it('sorts without mutating input', () => {
    expect(sortProjects(projects)[0]).toBe(projects[1]);
    expect(projects[0]?.data.order).toBe(2);
  });
  it('omits drafts and sorts by date', () => {
    expect(
      publishedNotes([
        { data: { draft: true, publishedAt: '2026-10-23' } },
        { data: { draft: false, publishedAt: '2026-10-21' } },
        { data: { draft: false, publishedAt: '2026-10-22' } },
      ]).map((n) => n.data.publishedAt),
    ).toEqual(['2026-10-22', '2026-10-21']);
  });
  it('counts Chinese reading time with a one-minute minimum', () => {
    expect(readingMinutes()).toBe(1);
    expect(readingMinutes('字'.repeat(701))).toBe(3);
  });
  it('renders date-only values consistently', () => {
    expect(formatDate('2026-10-22')).toContain('22');
  });
});
describe('metadata', () => {
  it('omits unknown canonical identity', () => {
    expect(canonicalUrl('/projects/')).toBeUndefined();
  });
  it('resolves the real configured origin', () => {
    expect(canonicalUrl('/projects/', 'https://portfolio.test')).toBe(
      'https://portfolio.test/projects/',
    );
  });
  it('adds consistent identity to the title', () => {
    expect(pageTitle('作品', 'CIZING')).toContain('CIZING / Software Engineer');
  });
  it('escapes HTML delimiters in structured data', () => {
    expect(safeJsonLd({ name: '</script>' })).not.toContain('<');
  });
  it('leaves an unset site URL empty', () => {
    expect(resolveSiteUrl('')).toBeUndefined();
  });
  it.each([
    'http://portfolio.test',
    'https://example.com',
    'https://localhost',
    'https://portfolio.test/path',
    'https://u:p@portfolio.test',
    'https://portfolio.test/?query=1',
  ])('rejects invalid production identity %s', (value) => {
    expect(() => resolveSiteUrl(value)).toThrow();
  });
});
