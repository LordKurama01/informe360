import fs from 'node:fs';
const dirs = ['evidence/revenue','evidence/customers','evidence/ai-logs','evidence/screenshots','evidence/pnl','evidence/testimonials','evidence/expenses','evidence/videos'];
for (const d of dirs) fs.mkdirSync(d, { recursive: true });
console.log('Evidence folders ready');
