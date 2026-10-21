import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const findings = [];
for (const file of files) {
  if (/^\.local\/|(^|\/)\.env($|\.(?!example$))/.test(file))
    findings.push(`${file}: forbidden public file`);
  if (/\.(png|webp|jpg|jpeg|ico|pdf)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  if (
    /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(
      text,
    )
  )
    findings.push(`${file}: possible secret pattern`);
}
assert.deepEqual(findings, [], 'Public file review failed; do not publish');
console.log(
  `Public file scan passed: ${files.length} tracked files; forbidden env/local files and common secret patterns absent. This is a bounded scan, not proof against every possible secret.`,
);
