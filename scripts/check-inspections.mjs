import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
  'mobile/src/services/inspections.ts',
  'mobile/app/inspections/index.tsx',
  'mobile/app/(tabs)/inspections.tsx',
  'src/app/app/hse/inspections/page.tsx',
];
const missing=required.filter(file=>!fs.existsSync(path.join(root,file)));
if(missing.length){console.error('Missing inspection files:\n'+missing.map(x=>`- ${x}`).join('\n'));process.exit(1);}
const runPage=fs.readFileSync(path.join(root,'mobile/app/form-run/[runId].tsx'),'utf8');
if(!runPage.includes('createFindingFromNonCompliance')){console.error('Form run must expose explicit non-compliance → finding flow');process.exit(1);}
const mobileHome=fs.readFileSync(path.join(root,'mobile/app/(tabs)/index.tsx'),'utf8');
const hasInspectionNavigation=mobileHome.includes("router.push('/inspections')")||mobileHome.includes("router.push('/(tabs)/inspections')");
if(!hasInspectionNavigation){console.error('Mobile Home must link directly to inspections');process.exit(1);}
const desktop=fs.readFileSync(path.join(root,'src/blocks/hse-control/HseControl.tsx'),'utf8');
if(!desktop.includes('href="/app/hse/inspections"')||!desktop.includes('href="/app/hse/forms"')){console.error('HSE Control must link to inspections and form templates');process.exit(1);}
console.log(`Inspection/checklist structure OK (${required.length} dedicated files + finding bridge + navigation)`);
