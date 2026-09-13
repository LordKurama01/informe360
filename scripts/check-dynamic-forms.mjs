import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/shared/hse/forms/types.ts',
  'src/shared/hse/forms/validation.mjs',
  'src/services/hse/forms-browser.ts',
  'src/app/app/hse/forms/page.tsx',
  'mobile/src/types/forms.ts',
  'mobile/src/services/forms.ts',
  'mobile/src/services/form-offline.ts',
  'mobile/src/components/forms/DynamicForm.tsx',
  'mobile/src/components/forms/FormField.tsx',
  'mobile/src/components/forms/RiskMatrixField.tsx',
  'mobile/app/forms/index.tsx',
  'mobile/app/forms/[templateId].tsx',
  'mobile/app/form-run/[runId].tsx',
];
const missing = required.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('Missing dynamic-form files:\n' + missing.map(x => `- ${x}`).join('\n'));
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'mobile/package.json'), 'utf8'));
if (pkg.dependencies?.['react-hook-form'] !== '7.88.0') {
  console.error('mobile/package.json must pin react-hook-form 7.88.0');
  process.exit(1);
}
console.log(`Dynamic forms structure OK (${required.length} files)`);
