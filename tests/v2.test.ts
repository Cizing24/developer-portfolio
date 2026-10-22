import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { simulationSteps, nextStep } from '../src/lib/simulations';
import {
  isLocale,
  localeFromPath,
  localizedPath,
  entrySlug,
} from '../src/lib/i18n';
it('forbids decorative direction icons, glyphs and CSS arrows in UI sources', () => {
  function scan(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
      item.isDirectory() ? scan(join(dir, item.name)) : [join(dir, item.name)],
    );
  }
  for (const path of [...scan('src/components'), ...scan('src/pages')].filter(
    (path) => path.endsWith('.astro'),
  )) {
    expect(readFileSync(path, 'utf8'), path).not.toMatch(
      /ArrowUpRight|ArrowRight|[↗↘➜➔→]/,
    );
  }
  expect(readFileSync('src/styles/global.css', 'utf8')).not.toMatch(
    /content\s*:[^;]*[↗→↘➜➔]/,
  );
});
describe('locale routing', () => {
  it('recognizes only supported URL locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ja')).toBe(false);
    expect(localeFromPath('/en/projects/bookflow/')).toBe('en');
    expect(localeFromPath('/fr/')).toBe('zh-tw');
  });
  it('constructs rooted locale-aware paths', () => {
    expect(localizedPath('en')).toBe('/en/');
    expect(localizedPath('zh-tw', '/projects/bookflow/')).toBe(
      '/zh-tw/projects/bookflow/',
    );
    expect(entrySlug('en/bookflow')).toBe('bookflow');
  });
});
describe('source-grounded flow scenarios', () => {
  it.each(['en', 'zh-tw'] as const)(
    'keeps lock before post-lock validation (%s)',
    (locale) => {
      const steps = simulationSteps('bookflow', 'conflict', locale);
      expect(steps).toHaveLength(6);
      expect(steps[2]?.detail).toMatch(/lock|持鎖/);
      expect(steps[3]?.detail).toMatch(/after acquiring|取得鎖後/);
      expect(steps[5]?.state).toContain('409');
    },
  );
  it('keeps an allowed checkout and audit atomic', () => {
    const steps = simulationSteps('assetflow', 'success', 'en');
    expect(steps[3]?.detail).toContain('Employee then Asset');
    expect(steps[4]?.detail).toContain('roll back');
    expect(steps[5]?.state).toBe('ASSIGNED · success');
  });
  it('denies VIEWER before any transaction or successful checkout audit', () => {
    const steps = simulationSteps('assetflow', 'denied', 'en');
    expect(steps[2]?.state).toContain('403');
    expect(steps[3]?.detail).toContain('No lifecycle transaction');
    expect(steps[4]?.state).toBe('No checkout audit');
    expect(steps[5]?.state).toContain('unchanged');
  });
  it('distinguishes competing assignment from permission denial', () => {
    expect(simulationSteps('assetflow', 'conflict', 'en')[5]?.state).toContain(
      '409',
    );
    expect(
      simulationSteps('assetflow', 'denied', 'en')[5]?.state,
    ).not.toContain('409');
  });
  it('bounds the stepper at completion', () => {
    expect(nextStep(6, 6)).toBe(6);
    expect(nextStep(-1, 6)).toBe(1);
  });
});
