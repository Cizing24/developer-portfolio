import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
for (const collection of ['projects', 'notes']) {
  const pairs = new Map();
  for (const locale of ['zh-tw', 'en']) {
    for (const file of await readdir(`src/content/${collection}/${locale}`)) {
      const body = await readFile(
        `src/content/${collection}/${locale}/${file}`,
        'utf8',
      );
      const key = body.match(/^translationKey: (.+)$/m)?.[1];
      assert.equal(body.match(/^locale: (.+)$/m)?.[1], locale);
      assert.ok(key, `Missing translationKey: ${file}`);
      const id = `${locale}/${key}`;
      assert.ok(!pairs.has(id), `Duplicate translation: ${id}`);
      pairs.set(id, body);
      if (collection === 'projects')
        assert.equal(
          (body.match(/^## /gm) ?? []).length,
          13,
          `${id}: preserve all 13 engineering sections`,
        );
      if (locale === 'en')
        assert.doesNotMatch(
          body,
          /[\u3400-\u9fff]/,
          `${id}: untranslated Chinese`,
        );
    }
  }
  for (const [id, body] of pairs) {
    const [locale, key] = id.split('/');
    const other = pairs.get(`${locale === 'en' ? 'zh-tw' : 'en'}/${key}`);
    assert.ok(other, `Missing complete translation: ${id}`);
    if (collection === 'projects') {
      assert.equal(
        body.match(/^sourceCommit: (.+)$/m)?.[1],
        other.match(/^sourceCommit: (.+)$/m)?.[1],
      );
      assert.equal(
        body.match(/^visibility: (.+)$/m)?.[1],
        other.match(/^visibility: (.+)$/m)?.[1],
      );
    }
  }
}
console.log(
  'Content contracts: complete locale pairs, unique keys, matching evidence, 13 case sections, no untranslated English body.',
);
