// Screenshot an afterburner GLB with additive blending the way the AR runtime shows it.
//   node shot_preview.mjs <project-root-with-node_modules/playwright> <glb path> <out dir> [target x,y,z] [dist] [times...]
// Uses the installed Google Chrome (channel 'chrome') because a real GPU/ANGLE path is needed for WebGL.
// Writes ar_preview_side_t*.png (side view along the plume) and ar_preview_rear_t*.png (looking into the nozzle).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [root,glb,outDir,target='12,0,2',dist='14',...times]=process.argv.slice(2);
const { chromium } = await import(path.resolve(root,'node_modules/playwright/index.mjs'));
const here=path.dirname(new URL(import.meta.url).pathname);
const srv=http.createServer((q,s)=>{const u=new URL(q.url,'http://x');const f=u.pathname==='/'?path.join(here,'preview_page.html'):u.pathname==='/model.glb'?glb:null;
 f&&fs.existsSync(f)?s.end(fs.readFileSync(f)):(s.statusCode=404,s.end())}).listen(0);
const b=await chromium.launch({channel:'chrome'});fs.mkdirSync(outDir,{recursive:true});
for (const [label,side] of [['side','1'],['rear','0']]){
 const p=await b.newPage({viewport:{width:800,height:800}});p.on('pageerror',e=>console.log('pageerror:',e.message));
 await p.goto(`http://localhost:${srv.address().port}/?glb=model.glb&target=${target}&dist=${dist}&side=${side}`);await p.waitForFunction(()=>window.ready,null,{timeout:60000});
 for (const t of (times.length?times:['0.5','2.0']).map(Number)){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:path.join(outDir,`ar_preview_${label}_t${t}s.png`)});}
 await p.close();
}
await b.close();srv.close();console.log('saved to',outDir);
