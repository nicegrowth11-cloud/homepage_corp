import { mkdir, readFile, writeFile, copyFile, rm, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const entries = ['index.html', 'conversion.html', 'local.css', 'local.js', 'consult.js', 'consult-forms.json', 'assets/fonts/WantedSans-OFL.txt'];
const files = new Set(entries);

// Only publish files referenced by the site; keep research snapshots out of deployments.
for (const file of entries) {
  const source = await readFile(resolve(root, file), 'utf8');
  for (const match of source.matchAll(/(?:src|href)=["']([^"'#?]+)["']|url\(["']?([^)'"?#]+)["']?\)/g)) {
    const target = match[1] || match[2];
    if (/^(?:https?:|tel:|mailto:|data:)/.test(target)) continue;
    const path = target.replace(/^\.\//, '');
    const absolute = resolve(root, path);
    if (!absolute.startsWith(root + '/')) throw new Error(`Invalid asset path: ${path}`);
    await stat(absolute);
    files.add(path);
  }
}
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of files) {
  await mkdir(dirname(resolve(out, file)), { recursive: true });
  await copyFile(resolve(root, file), resolve(out, file));
}
let size = 0;
for (const file of files) size += (await stat(resolve(out, file))).size;
console.log(`Built ${files.size} verified files (${(size / 1024).toFixed(0)} KB) in dist/`);
