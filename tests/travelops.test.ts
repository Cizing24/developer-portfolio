import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectIntroduction } from '../src/lib/project-introductions';
import {
  isIsland,
  isProjectIsland,
  projectShowcaseView,
} from '../src/lib/world-config';

describe('TravelOps publication boundaries', () => {
  it.each(['en', 'zh-tw'] as const)(
    'has its own %s introduction without creating an island',
    (locale) => {
      const intro = projectIntroduction('travelops', locale);
      expect(intro.name).toBe('TravelOps');
      expect(intro.architecture.map((layer) => layer.tech).join(' ')).toContain(
        'MySQL',
      );
      expect(projectIntroduction('bookflow', locale).name).toBe('BookFlow');
      expect(projectIntroduction('assetflow', locale).name).toBe('AssetFlow');
      expect(isProjectIsland('travelops')).toBe(false);
      expect(isIsland('travelops')).toBe(false);
      expect(projectShowcaseView('project-travelops')).toBeUndefined();
    },
  );

  it('keeps the approved video unchanged', () => {
    const video = readFileSync('public/media/travelops/travelops-v3-demo.mp4');
    expect(createHash('sha256').update(video).digest('hex')).toBe(
      'ad746872b2a3b136b4db4b6f01dd5e42e262b490c32588f70c0fbf9efa31dbcf',
    );
  });

  it('converts all ten English cues to ordered WebVTT within the video duration', () => {
    const vtt = readFileSync(
      'public/media/travelops/travelops-v3-demo.en.vtt',
      'utf8',
    );
    expect(vtt.startsWith('WEBVTT\n\n')).toBe(true);
    const cues = [
      ...vtt.matchAll(
        /(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})\n([^\n]+)/g,
      ),
    ];
    expect(cues).toHaveLength(10);
    let previousEnd = 0;
    for (const cue of cues) {
      const time = (offset: number) =>
        Number(cue[offset]) * 3600 +
        Number(cue[offset + 1]) * 60 +
        Number(cue[offset + 2]) +
        Number(cue[offset + 3]) / 1000;
      const start = time(1),
        end = time(5);
      expect(start).toBeGreaterThanOrEqual(previousEnd);
      expect(end).toBeGreaterThan(start);
      expect(end).toBeLessThanOrEqual(74.36);
      previousEnd = end;
    }
    expect(previousEnd).toBe(74.36);
    expect(vtt).not.toMatch(/\d{2}:\d{2}:\d{2},\d{3}/);
  });
});
