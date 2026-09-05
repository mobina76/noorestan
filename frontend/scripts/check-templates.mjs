import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = [/\bany\b/, /subscribe\s*\([^)]*=>[\s\S]*subscribe\s*\(/];
const files = [];

function visit(path) {
  for (const name of readdirSync(path)) {
    const child = join(path, name);
    const stat = statSync(child);
    if (stat.isDirectory()) visit(child);
    else if (/\.(ts|html)$/.test(name)) files.push(child);
  }
}

visit('src');
const failures = files.flatMap((file) => {
  const content = readFileSync(file, 'utf8');
  return forbidden
    .filter((pattern) => pattern.test(content))
    .map((pattern) => `${file}: ${pattern}`);
});

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
