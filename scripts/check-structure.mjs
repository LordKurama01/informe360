import fs from 'node:fs';
const required = ['src/blocks/landing','src/blocks/auth','src/blocks/reports','src/blocks/gemini','src/blocks/control','src/blocks/calendar','database/supabase','evidence'];
const missing = required.filter(p => !fs.existsSync(p));
if (missing.length) { console.error('Missing:', missing); process.exit(1); }
console.log('Informe360 structure OK');
