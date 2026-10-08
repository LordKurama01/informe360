import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const paths = [
  'mobile/assets/brand/app-icon.png',
  'mobile/assets/brand/adaptive-icon.png',
  'mobile/assets/brand/splash-icon.png',
];

for (const path of paths) {
  const file = await readFile(path);
  assert.ok(file.length > 100, `${path} must not be empty`);
  assert.deepEqual([...file.subarray(0, 8)], [137,80,78,71,13,10,26,10], `${path} must be a valid PNG`);
  assert.equal(file.toString('ascii', 12, 16), 'IHDR', `${path} must contain an IHDR chunk`);
  const width = file.readUInt32BE(16);
  const height = file.readUInt32BE(20);
  assert.ok(width >= 512 && height >= 512, `${path} must be at least 512px`);
  assert.equal(width, height, `${path} must be square`);
}

console.log('HSE native brand assets are valid square PNGs');
