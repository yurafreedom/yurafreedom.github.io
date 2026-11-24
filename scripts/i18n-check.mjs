import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const locales=['en','ru','uk','es','pl','de','fr','ar'];
const projects=JSON.parse(fs.readFileSync(path.join(root,'content/projects.json')));
const en=JSON.parse(fs.readFileSync(path.join(root,'locales/en.json')));
let missing=[];
for(const c of locales){
 const d=JSON.parse(fs.readFileSync(path.join(root,`locales/${c}.json`)));
 for(const [key,value] of Object.entries(en)){if(value===undefined||d[key]===undefined||d[key]===''||String(d[key]).includes('[translation missing]'))missing.push(`${c}: interface ${key}`)}
 if(c==='en')continue;
 const copy=JSON.parse(fs.readFileSync(path.join(root,`locales/${c}.projects.json`)));
 for(const p of projects){
  for(const key of ['title','eyebrow','summary','challenge','approach','outcome','stage','privacy']){
   const value=copy[p.id]?.[key];if(!value||(Array.isArray(value)&&value.length!==p[key]?.length))missing.push(`${c}: project ${p.id}.${key}`);
  }
 }
}
if(missing.length){console.error(`Localization incomplete: ${missing.length} missing case fields. Examples:\n${missing.slice(0,24).join('\n')}`);process.exit(1)}
console.log('All eight languages have complete project and interface coverage.');
