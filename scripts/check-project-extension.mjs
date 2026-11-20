import assert from 'node:assert/strict';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Build-only synthetic content; never included in the normal dist or Git.
const slug = 'extension-fixture';
const paths = ['en', 'zh-tw'].map(
  (locale) => `src/content/projects/${locale}/${slug}.md`,
);
const sceneBefore = await readFile('src/lib/studio-scene.ts');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
for (const path of paths) {
  try {
    await readFile(path);
    throw new Error(`Fixture would overwrite ${path}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
try {
  for (const [index, locale] of ['en', 'zh-tw'].entries()) {
    await writeFile(
      paths[index],
      `---
locale: ${locale}
translationKey: ${slug}
title: Extension Fixture
description: Synthetic build-only project proving ordinary content extension without a demo module.
category: TEST FIXTURE
tags: [TypeScript]
highlights: [Synthetic fixture]
status: ${locale === 'en' ? 'In progress' : '持續開發'}
visibility: private
featured: false
order: 99
sourceCommit: ${revision}
reviewedAt: '2026-11-19'
cover: ../../../assets/bookflow.png
coverAlt: Synthetic build-only fixture reusing an approved screenshot
---

## ${locale === 'en' ? 'Purpose' : '目的'}

${locale === 'en' ? 'Build-only fixture. No interactive module is registered.' : '僅供建置驗證，沒有註冊互動模組。'}
`,
    );
  }
  execFileSync(process.execPath, ['scripts/check-content.mjs'], {
    stdio: 'inherit',
  });
  execFileSync(
    process.execPath,
    [
      'node_modules/astro/bin/astro.mjs',
      'build',
      '--outDir',
      '.local/extension-fixture-dist',
    ],
    { stdio: 'inherit' },
  );
  for (const locale of ['en', 'zh-tw']) {
    const home = await readFile(
      `.local/extension-fixture-dist/${locale}/index.html`,
      'utf8',
    );
    const page = await readFile(
      `.local/extension-fixture-dist/${locale}/projects/${slug}/index.html`,
      'utf8',
    );
    assert.ok(home.includes(`/${locale}/projects/${slug}/`));
    assert.ok(home.includes('Extension Fixture'));
    assert.ok(page.includes('Extension Fixture'));
    assert.ok(
      !home.includes(`project-${slug}`),
      'Ordinary content must not register a demo',
    );
  }
  assert.deepEqual(await readFile('src/lib/studio-scene.ts'), sceneBefore);
  console.log(
    'Extension fixture passed: two locale routes, Harbor fallback, no demo or scene changes.',
  );
} finally {
  for (const path of paths)
    await unlink(path).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
}
