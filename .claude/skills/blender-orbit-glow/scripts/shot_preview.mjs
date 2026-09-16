// Screenshot a GLB with additive blending the way the AR runtime shows it.
//   node shot_preview.mjs <project-root-with-node_modules/playwright> <glb path> <out dir> [center-z] [times...]
// Uses the installed Google Chrome (channel 'chrome') because a real GPU/ANGLE path is needed for WebGL.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [root,glb,outDir,cz='2.2',...times]=process.argv.slice(2);
const { chromium } = await import(path.resolve(root,'node_modules/playwright/index.mjs'));
const here=path.dirname(new URL(import.meta.url).pathname);
const srv=http.createServer((q,s)=>{const u=new URL(q.url,'http://x');const f=u.pathname==='/'?path.join(here,'preview_page.html'):u.pathname==='/model.glb'?glb:null;
 f&&fs.existsSync(f)?s.end(fs.readFileSync(f)):(s.statusCode=404,s.end())}).listen(0);
const b=await chromium.launch({channel:'chrome'});const p=await b.newPage({viewport:{width:800,height:800}});
p.on('pageerror',e=>console.log('pageerror:',e.message));
await p.goto(`http://localhost:${srv.address().port}/?glb=model.glb&cz=${cz}`);await p.waitForFunction(()=>window.ready,null,{timeout:60000});
fs.mkdirSync(outDir,{recursive:true});
for (const t of (times.length?times:['0.5','2.0']).map(Number)){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:path.join(outDir,`ar_preview_t${t}s.png`)});}
await b.close();srv.close();console.log('saved to',outDir);
