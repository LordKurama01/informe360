import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
  'mobile/src/services/inspections.ts',
  'mobile/app/inspections/index.tsx',
  'src/app/app/hse/inspections/page.tsx',
];
const missing=required.filter(file=>!fs.existsSync(path.join(root,file)));
if(missing.length){console.error('Missing inspection files:\n'+missing.map(x=>`- ${x}`).join('\n'));process.exit(1);}
const runPage=fs.readFileSync(path.join(root,'mobile/app/form-run/[runId].tsx'),'utf8');
if(!runPage.includes('createFindingFromNonCompliance')){console.error('Form run must expose explicit non-compliance → finding flow');process.exit(1);}
console.log(`Inspection/checklist structure OK (${required.length} dedicated files + finding bridge)`);
