import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('docs/evidence', { recursive: true });
const browser = await chromium.launch({
  args: ['--remote-debugging-port=9222'],
});
try {
  const summary = [];
  for (const [name, path, desktop] of [
    ['home-mobile', '/', false],
    ['home-desktop', '/', true],
    ['case-mobile', '/projects/bookflow/', false],
  ]) {
    const result = await lighthouse(`http://127.0.0.1:4321${path}`, {
      port: 9222,
      output: ['html', 'json'],
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      ...(desktop
        ? {
            formFactor: 'desktop',
            screenEmulation: {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
              requestLatencyMs: 0,
              downloadThroughputKbps: 0,
              uploadThroughputKbps: 0,
            },
          }
        : {}),
    });
    if (!result) throw new Error('No Lighthouse result');
    const { lhr, report } = result;
    await writeFile(
      `docs/evidence/lighthouse-${name}.html`,
      report[0].replace(/[ \t]+$/gm, ''),
    );
    await writeFile(`docs/evidence/lighthouse-${name}.json`, report[1]);
    const row = {
      name,
      url: lhr.finalDisplayedUrl,
      fetchTime: lhr.fetchTime,
      lighthouseVersion: lhr.lighthouseVersion,
      userAgent: lhr.userAgent,
      settings: lhr.configSettings,
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([key, value]) => [
          key,
          Math.round((value.score ?? 0) * 100),
        ]),
      ),
      lcp: lhr.audits['largest-contentful-paint']?.displayValue,
      cls: lhr.audits['cumulative-layout-shift']?.displayValue,
      failed: Object.entries(lhr.audits)
        .filter(([, v]) => v.score !== null && v.score < 1)
        .map(([id, v]) => ({ id, score: v.score, title: v.title })),
    };
    summary.push(row);
    console.log(
      JSON.stringify({ name, scores: row.scores, lcp: row.lcp, cls: row.cls }),
    );
  }
  await writeFile(
    'docs/evidence/lighthouse-summary.json',
    JSON.stringify(summary, null, 2),
  );
} finally {
  await browser.close();
}
