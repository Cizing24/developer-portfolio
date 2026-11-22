import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import benchmarks from '../src/lib/legacylens-benchmarks.json';
import manifest from '../docs/evidence/legacylens/media-manifest.json';

describe('LegacyLens evidence integrity', () => {
  it('preserves the reviewed media and evidence bytes', () => {
    for (const file of manifest.files) {
      const bytes = readFileSync(
        new URL(`../${file.destination}`, import.meta.url),
      );
      expect(bytes.length).toBe(file.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        file.sha256,
      );
    }
  });
  it('uses the source samples, nearest-rank percentiles and IO without rerunning SQL', () => {
    for (const scale of benchmarks) {
      const raw = JSON.parse(
        readFileSync(
          new URL(
            `../docs/evidence/legacylens/benchmark-${scale.scale}.json`,
            import.meta.url,
          ),
          'utf8',
        ).replace(/^\uFEFF/, ''),
      );
      expect(scale.totalRows).toBe(raw.totalRows);
      for (const result of scale.results) {
        const record = raw.results.find(
          (r: { stage: string }) => r.stage === result.stage,
        );
        const sorted = [...record.samplesMs].sort(
          (a: number, b: number) => a - b,
        );
        expect(sorted).toHaveLength(40);
        expect(record.warmups).toBe(5);
        expect(record.resultEquivalent).toBe(true);
        expect(record.checkedOffsets).toEqual([0, 20, 200]);
        expect(result.p50Ms).toBeCloseTo(
          sorted[Math.ceil(sorted.length * 0.5) - 1],
          8,
        );
        expect(result.p95Ms).toBeCloseTo(
          sorted[Math.ceil(sorted.length * 0.95) - 1],
          8,
        );
        expect(result.logicalReads).toBe(record.logicalReads);
      }
    }
  });
  it('keeps both converted caption tracks aligned with source SRT timestamps', () => {
    for (const lang of ['zh-TW', 'en']) {
      const read = (extension: string) =>
        readFileSync(
          new URL(
            `../public/media/legacylens/demo.${lang}.${extension}`,
            import.meta.url,
          ),
          'utf8',
        )
          .replace(/^\uFEFF/, '')
          .replace(/\r\n/g, '\n');
      const srt = read('srt');
      const vtt = read('vtt');
      expect(vtt).toBe(
        'WEBVTT\n\n' + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2'),
      );
      expect((vtt.match(/-->/g) ?? []).length).toBeGreaterThan(0);
    }
  });
});
