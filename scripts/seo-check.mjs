import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const d=path.join(root,'dist');
if(!fs.existsSync(d)){console.error('Run npm run build first');process.exit(1)}
const report=JSON.parse(fs.readFileSync(path.join(d,'BUILD_REPORT.json')));
const sitemap=fs.readFileSync(path.join(d,'sitemap.xml'),'utf8');
let error=[];let checked=0;
for(const file of fs.readdirSync(path.join(d,'en','work'))){
 const html=fs.readFileSync(path.join(d,'en','work',file,'index.html'),'utf8');checked++;
 for(const marker of ['rel="canonical"','name="robots"','property="og:image"','application/ld+json','<main','<h1'])if(!html.includes(marker))error.push(`${file}: missing ${marker}`);
 if(!html.includes(`work/${file}/`))error.push(`${file}: wrong canonical path`);
}
if(!sitemap.includes('<urlset')||!fs.existsSync(path.join(d,'robots.txt')))error.push('Missing sitemap/robots');
if(checked!==52)error.push('Project pages != 52');
if(error.length){console.error(error.slice(0,25).join('\n'));process.exit(1)}
console.log(`SEO structure passed: ${checked} English static case pages, robots, sitemap, metadata and JSON-LD; ${report.sitemapUrls} submitted URLs. This does not assert indexing or Lighthouse performance.`);
