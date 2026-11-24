import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const dist=path.join(root,'dist');
const cfg=JSON.parse(fs.readFileSync(path.join(dist,'BUILD_REPORT.json')));const base=cfg.base;
let files=[],errors=[],urls=0,siblings=0;
const SIBLINGS=['/hughlings/'];
const walk=d=>{for(const item of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,item.name);if(item.isDirectory())walk(f);else if(f.endsWith('.html'))files.push(f)}};
walk(dist);
for(const file of files){
 const html=fs.readFileSync(file,'utf8');
 const found=[...html.matchAll(/\b(?:href|src|data-pdf)="([^"]+)"/g)].map(x=>x[1]);
 const srcset=[...html.matchAll(/\bsrcset="([^"]+)"/g)].flatMap(x=>x[1].split(',').map(v=>v.trim().split(/\s+/)[0]));
 for(const uri of [...found,...srcset]){
  if(/^(https?:|mailto:|tel:|#|data:|javascript:)/.test(uri))continue;
  urls++;
  // Sibling GitHub Pages sites on the same domain (other repositories), not part of this build.
  if(SIBLINGS.some(prefix=>uri.startsWith(prefix))){siblings++;continue}
  if(!uri.startsWith(base+'/')){errors.push(`${path.relative(dist,file)}: unbased ${uri}`);continue}
  const clean=uri.split(/[?#]/)[0].slice(base.length).replace(/^\//,'');
  const p=path.resolve(dist,clean);
  if(!p.startsWith(dist+path.sep)){errors.push(`${file}: escapes root ${uri}`);continue}
  const ok=(fs.existsSync(p) && fs.statSync(p).isFile())||(fs.existsSync(path.join(p,'index.html')));
  if(!ok)errors.push(`${path.relative(dist,file)} -> ${uri} (404)`);
 }
}
if(errors.length){console.error(`Failed ${errors.length} of ${urls} internal references:`);console.error(errors.slice(0,45).join('\n'));process.exit(1)}
console.log(`Verified ${urls-siblings} internal href/src/srcset/data-pdf references across ${files.length} HTML pages (filesystem validation only); ${siblings} links to sibling sites (${SIBLINGS.join(', ')}) skipped.`);
