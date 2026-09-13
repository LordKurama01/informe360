import fs from 'node:fs';
import path from 'node:path';

const INTERNAL_REGISTRY_PREFIX = /https:\/\/packages\.applied-caas-gateway\d+\.internal\.api\.openai\.org\/artifactory\/api\/npm\/npm-public\//g;
const PUBLIC_REGISTRY_PREFIX = 'https://registry.npmjs.org/';

export function normalizeLockfileText(text) {
  JSON.parse(text);
  const normalized = text.replace(INTERNAL_REGISTRY_PREFIX, PUBLIC_REGISTRY_PREFIX);
  JSON.parse(normalized);
  return normalized;
}

function run() {
  const lockPath = path.resolve(process.cwd(), 'package-lock.json');
  const original = fs.readFileSync(lockPath, 'utf8');
  const normalized = normalizeLockfileText(original);

  if (normalized === original) {
    console.log('package-lock.json already uses a portable registry');
    return;
  }

  fs.writeFileSync(lockPath, normalized, 'utf8');
  console.log('package-lock.json registry URLs normalized to registry.npmjs.org');
}

if (process.argv[1] && path.basename(process.argv[1]) === 'normalize-lock-registry.mjs') {
  run();
}
