import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
const cfg={origin:(process.env.SITE_ORIGIN||'https://sachenkolabs.tech').replace(/\/$/,''),base:(process.env.BASE_PATH??'').replace(/^\/?/,'/').replace(/\/$/,'')};
if(cfg.base==='/')cfg.base='';
const locales=['en','ru','uk','es','pl','de','fr','ar'];
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/projects.json')));
const worlds=JSON.parse(fs.readFileSync(path.join(root,'content/worlds.json')));
const sourceConfig=fs.readFileSync(path.join(root,'site.config.js'),'utf8');
const calendarSetting=(sourceConfig.match(/CALENDLY_URL\s*:\s*(null|'[^']*'|\"[^\"]*\")/)||[])[1];
const rawCalendar=process.env.CALENDLY_URL||(calendarSetting&&calendarSetting!=='null'?calendarSetting.slice(1,-1):null);
const verifiedCalendar=rawCalendar&&/^https:\/\/calendly\.com\/[^/\s]+\/[^/\s]+/.test(rawCalendar)?rawCalendar:null;
const dicts=Object.fromEntries(locales.map(c=>[c,JSON.parse(fs.readFileSync(path.join(root,`locales/${c}.json`)))]));
const escaped=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const ensure=p=>fs.mkdirSync(path.dirname(p),{recursive:true});
const write=(p,data)=>{ensure(p);fs.writeFileSync(p,data)};
const url=(route)=>cfg.origin+cfg.base+route;
const projectText=lang=>lang==='en'?{}:JSON.parse(fs.readFileSync(path.join(root,`locales/${lang}.projects.json`)));
// lang="en" for text that stays English on a non-English page (empty on EN pages).
const enAttr=(lang,loc,field)=>lang!=='en'&&!(field&&loc[field]&&(!Array.isArray(loc[field])||loc[field].length))?' lang="en"':'';
const textFields=['title','eyebrow','summary','stage','role','challenge','approach','outcome','privacy','stack','gallery','links'];
// Case pages load the EN families (Syne, Space Grotesk, DM Mono) and the RU/UK ones; each downloads only when text uses it.
const cyrillicFonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Space+Grotesk:wght@400;500;600;700&amp;family=Syne:wght@500;600;700;800&amp;family=Golos+Text:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;family=Oswald:wght@400;500;600&amp;display=swap">';
const isPrivate=p=>/(private|NDA|confidential|anonymi[sz]ed|unverified)/i.test(p.stage||'');
const hasTranslation=(locale,id)=>locale==='en' || !!JSON.parse(fs.readFileSync(path.join(root,`locales/${locale}.projects.json`)))[id];
function linkedPage(src,lang){
 // Internal files are moved to /locale/ while shared assets remain at the base root.
 return src.replace(/\b(href|src)="([^"]+)"/g,(full,attr,raw)=>{
   if(/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(raw))return full;
   if(raw.startsWith('/'))return full;
   if(raw==='index.html')return `${attr}="${cfg.base}/${lang}/"`;
   if(raw.startsWith('index.html#'))return `${attr}="${cfg.base}/${lang}/${raw.slice('index.html'.length)}"`;
   if(raw==='projects-data.js')return `${attr}="${cfg.base}/${lang}/projects-data.js"`;
   if(raw.endsWith('.html'))return `${attr}="${cfg.base}/${lang}/${raw}"`;
   return `${attr}="${cfg.base}/${raw}"`;
 }).replace(/\bsrcset="([^"]+)"/g,(_m,v)=>`srcset="${v.split(',').map(part=>{const entry=part.trim();return entry.startsWith('assets/')?cfg.base+'/'+entry:entry}).join(', ')}"`).replace(/\bdata-pdf="(assets\/[^\"]+)"/g,(_,f)=>`data-pdf="${cfg.base}/${f}"`);
}
function localizeTagged(src,lang){
 const v=dicts[lang];
 // Only authored, trusted HTML from the in-repo dictionaries is inserted.
 return src.replace(/(<([a-z][a-z0-9]*)\b[^>]*?data-i18n(-html)?="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/gi,(whole,open,tag,isHtml,key,old,close)=>{
   const value=v[key];if(typeof value!=='string')return whole;
   // data-i18n-lang: the element takes the page language (it may sit inside an English island)
   if(/\bdata-i18n-lang=/.test(open))open=open.replace(/\bdata-i18n-lang=""/,`data-i18n-lang="" lang="${lang}"`);
   return open+(isHtml?value:escaped(value))+close;
 }).replace(/(<([a-z][a-z0-9]*)\b[^>]*?data-i18n-placeholder="([^"]+)"[^>]*\bplaceholder=")[^"]*(")/gi,(_m,front,_tag,key,close)=>front+escaped(v[key]||'')+close);
}
const addMeta=(html,{lang,title,desc,route,image,kind='website',noindex=false,crumbs=[],work=null})=>{
 const absolute=url(route),ogImage=url('/'+(image||'assets/velor-hero.webp'));
 html=html.replace(/<html\s+lang="[a-z]+"[^>]*>/i,`<html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}">`);
 html=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${escaped(title)}</title>`);
 html=html.replace(/<meta[^>]+name="description"[^>]*>/i,'').replace(/<meta[^>]+property="og:(?:title|description|type)"[^>]*>/gi,'');
 const alternates=lang==='en'?`<link rel="alternate" hreflang="en" href="${escaped(absolute)}"/><link rel="alternate" hreflang="x-default" href="${escaped(absolute)}"/>`:'';
 const person={"@type":"Person",name:'Yurii Sachenko',url:url('/en/')};
 const schema=[{"@context":"https://schema.org","@type":"WebPage",name:title,url:absolute,description:strip(desc),inLanguage:lang,author:person}];
 if(work)schema.push({"@context":"https://schema.org","@type":"CreativeWork",name:work.title,description:work.summary,url:absolute,creator:person,dateCreated:work.year||undefined});
 if(crumbs.length)schema.push({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:crumbs.map((c,i)=>({"@type":"ListItem",position:i+1,name:c.name,item:url(c.route)}))});
 const extra=`<meta name="description" content="${escaped(strip(desc))}"/>\n<meta name="robots" content="${noindex?'noindex,follow':'index,follow'}"/>\n<link rel="canonical" href="${escaped(absolute)}"/>\n${alternates}\n<meta property="og:type" content="${kind}"/><meta property="og:title" content="${escaped(title)}"/><meta property="og:description" content="${escaped(strip(desc))}"/><meta property="og:url" content="${escaped(absolute)}"/><meta property="og:image" content="${escaped(ogImage)}"/>\n<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escaped(title)}"/><meta name="twitter:description" content="${escaped(strip(desc))}"/><meta name="twitter:image" content="${escaped(ogImage)}"/>\n<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
 return html.replace('</head>',extra+'\n</head>');
};
const projectDataFor=(lang)=>{
 const loc=lang==='en'?{}:JSON.parse(fs.readFileSync(path.join(root,`locales/${lang}.projects.json`)));
 const arr=catalog.map(p=>{
  const text=loc[p.id]||{};
  const copy={...p,...text,url:`${cfg.base}/${lang}/work/${p.id}/`};
  if(copy.images)copy.images=copy.images.map(src=>src.startsWith('assets/')?`${cfg.base}/${src}`:src);
  if(copy.links)copy.links=copy.links.map(l=>({...l,url:(!/^https?:/i.test(l.url)&&l.url.endsWith('.html'))?`${cfg.base}/${lang}/${l.url}`:l.url}));
  return copy;
 });
 const enFields=lang==='en'?{}:Object.fromEntries(catalog.map(p=>[p.id,textFields.filter(f=>p[f]!==undefined&&enAttr(lang,loc[p.id]||{},f))]));
 return `/* Generated from content/projects.json — 52 canonical records. */\nwindow.PORTFOLIO_HOME=${JSON.stringify(`${cfg.base}/${lang}/`)};window.PORTFOLIO_DATA_LOCALE=${JSON.stringify(lang)};window.PORTFOLIO_EN_FIELDS=${JSON.stringify(enFields)};window.PORTFOLIO_PROJECTS=${JSON.stringify(arr)};window.PORTFOLIO_WORLDS=${JSON.stringify(worlds)};`;
};
const card=(p,lang)=>{const loc=projectText(lang)[p.id]||{},L=f=>enAttr(lang,loc,f);return `<article class="project-card"><a href="${cfg.base}/${lang}/work/${escaped(p.id)}/"><div class="card-media"${L()}>${p.images?.length?`<div class="visual-art visual-real"><img src="${cfg.base}/${escaped(p.images[0])}" alt="${escaped(p.title)} — portfolio image" loading="lazy" width="1120" height="900"></div>`:`<div class="visual-art tone-${escaped(p.tone||'violet')}" data-glyph="${escaped(p.glyph||'CASE')}"></div>`}</div><div class="card-body"><div class="card-kicker"${L('eyebrow')}>${escaped(p.eyebrow)}</div><h3 class="card-title"${L('title')}>${escaped(p.title)}</h3><p class="card-summary"${L('summary')}>${escaped(p.summary)}</p><div class="card-bottom"${L('stage')}><b>${escaped(p.stage)}</b><span>↗</span></div></div></a></article>`};
const detailName={en:'CASE STUDY',ru:'КЕЙС',uk:'КЕЙС',es:'CASO',pl:'STUDIUM PRZYPADKU',de:'FALLSTUDIE',fr:'ÉTUDE DE CAS',ar:'دراسة حالة'};
const detailTemplate=(p,lang)=>{
 const en=dicts.en,ui=dicts[lang],loc=lang==='en'?{}:JSON.parse(fs.readFileSync(path.join(root,`locales/${lang}.projects.json`)))[p.id]||{};
 const fullyTranslated=lang==='en'||['title','summary','challenge','approach','outcome','stage','eyebrow','privacy'].every(k=>loc[k]&& (Array.isArray(loc[k])?loc[k].length>0:true));
 const text={...p,...loc}; const route=`/${lang}/work/${p.id}/`;
 const label=fullyTranslated?ui:en;
 const L=f=>enAttr(lang,loc,f),E=enAttr(lang,{},null),labelLang=fullyTranslated?'':E;
 const feature=text.images?.[0];
 const links=(text.links||[]).map(l=>`<a${L('links')} href="${escaped((!/^https?:/i.test(l.url)&&l.url.endsWith('.html'))?`${cfg.base}/${lang}/${l.url}`:l.url)}" target="_blank" rel="noopener noreferrer">${escaped(l.label)} ↗</a>`).join('');
 const gallery=text.images?.length?`<section class="section shell" aria-label="Gallery"${E}><div class="section-head">IMAGES / PROJECT VISUALS</div><div class="image-mosaic project-gallery" id="case-gallery" data-gallery-root data-gallery-title="${escaped(text.title)}">${text.images.map((image,i)=>`<figure><a data-gallery-item data-caption="${escaped((text.gallery||[])[i]||text.title)}" href="${cfg.base}/${escaped(image)}"><img src="${cfg.base}/${escaped(image)}" alt="${escaped((text.gallery||[])[i]||text.title)}" loading="lazy" decoding="async" width="1120" height="1000"></a><figcaption>${escaped((text.gallery||[])[i]||`Project image ${i+1}`)}</figcaption></figure>`).join('')}</div></section>`:'';
 const warn=fullyTranslated?'':`<p class="translation-notice" data-english-content-notice>${escaped(ui['ui.moreEnglish'])}</p>`;
 return `<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#09090d"><title>${escaped(text.title)} — Yurii Sachenko</title><link rel="icon" href="${cfg.base}/assets/mark.svg" type="image/svg+xml">${cyrillicFonts}<link rel="stylesheet" href="${cfg.base}/detail.css"><link rel="stylesheet" href="${cfg.base}/css/gallery.css"><link rel="stylesheet" href="${cfg.base}/css/cyrillic-detail.css"><script src="${cfg.base}/site.config.js" defer></script><script src="${cfg.base}/locales-data.js" defer></script><script src="${cfg.base}/i18n.js" defer></script><script src="${cfg.base}/gallery.js" defer></script></head><body><a class="skip-link" href="#case-main"${E}>Skip to case study</a><header class="top"><a class="brand" href="${cfg.base}/${lang}/"${E}>YURII<span>.</span> / PORTFOLIO</a><nav aria-label="Main navigation"${E}><a href="${cfg.base}/${lang}/#work">← ALL WORK</a><a href="${cfg.base}/${lang}/#contact">CONTACT ↗</a></nav><select class="language-switch" data-language-switch aria-label="${escaped(ui['ui.language'])}">${locales.map(l=>`<option value="${l}"${l===lang?' selected':''}>${l.toUpperCase()}</option>`).join('')}</select></header>${warn}<main id="case-main"><section class="mast"><div class="shell"><div class="eyebrow">[ ${escaped(detailName[lang])} / ${E?`<span lang="en">${escaped(text.category.toUpperCase())}</span>`:escaped(text.category.toUpperCase())} / ${escaped(text.year)} ]</div><h1${L('title')}>${escaped(text.title)}</h1><p class="lede"${L('summary')}>${escaped(text.summary)}</p><div class="chips"><span${L('stage')}>${escaped(text.stage)}</span>${text.role?`<span${L('role')}>${escaped(text.role)}</span>`:''}</div><nav class="case-breadcrumbs" aria-label="Breadcrumb"${E}><a href="${cfg.base}/${lang}/">Home</a><span>/</span><a href="${cfg.base}/${lang}/#work">Work</a><span>/</span><span>${escaped(text.title)}</span></nav></div></section><section class="section shell"><div class="section-head"${E}>01 / THE CHALLENGE</div><div class="cols"><div><h2${labelLang}>${escaped(label['ui.challenge'])}</h2></div><p${L('challenge')}>${escaped(text.challenge)}</p></div></section><section class="section shell"><div class="section-head"${E}>02 / MY CONTRIBUTION</div><h2${labelLang}>${escaped(label['ui.approach'])}</h2><ul class="callout-list"${L('approach')}>${(text.approach||[]).map(x=>`<li>${escaped(x)}</li>`).join('')}</ul></section><section class="section shell"><div class="section-head"${E}>03 / OUTCOME & STATUS</div><h2${labelLang}>${escaped(label['ui.status'])}</h2><p${L('outcome')}>${escaped(text.outcome)}</p><h3${E}>Tools &amp; technologies</h3><div class="chips"${L('stack')}>${(text.stack||[]).map(s=>`<span>${escaped(s)}</span>`).join('')}</div><div class="note"${L('privacy')}><strong>Disclosure:</strong> ${escaped(text.privacy||'Scope and outcomes follow the available source record.')}</div>${links?`<div class="actions">${links}</div>`:''}</section>${gallery}</main><footer class="footer shell"${E}><span>YURII SACHENKO © 2026</span><a href="${cfg.base}/${lang}/#work">RETURN TO ARCHIVE ↗</a><a href="${cfg.base}/${lang}/privacy.html">PRIVACY</a></footer><div class="footer__legal shell"${E}><strong>Legal information</strong><address>Hughlings OÜ · Estonian registry code 17603435 · Padriku tee 12/3-4, 11912 Tallinn, Estonia</address><p>Sachenko Labs is a public-facing brand, not the legal entity. Contact: <a href="mailto:yura@sachenkolabs.tech">yura@sachenkolabs.tech</a>.</p></div></body></html>`;
};
// Copy only allowlisted site assets. Do NOT package source plans, IDs, CVs or handoff PDF.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const target of ['assets','css'])fs.cpSync(path.join(root,target),path.join(out,target),{recursive:true});
for(const f of ['detail.css','script.js','gallery.js','locales-data.js','i18n.js','contacts.js'])fs.copyFileSync(path.join(root,f),path.join(out,f));
write(path.join(out,'site.config.js'),`window.PORTFOLIO_CONFIG=${JSON.stringify({SITE_ORIGIN:cfg.origin,BASE_PATH:cfg.base,CALENDLY_URL:verifiedCalendar,TELEGRAM_URL:'https://t.me/yurii_sachenko',EMAIL:'yura@sachenkolabs.tech'})};`);
const caseFiles=['ai-visual-production.html','allegro-case.html','hughlings-gnb.html','sitebrain-case.html','synology-service.html','learning.html','privacy.html'];
const siteIndex=fs.readFileSync(path.join(root,'index.html'),'utf8');
const indexable=[];const detailsIndexable=[];
for(const lang of locales){
 const dir=path.join(out,lang);fs.mkdirSync(dir,{recursive:true});
 write(path.join(dir,'projects-data.js'),projectDataFor(lang));
 let home=linkedPage(siteIndex,lang);
 home=localizeTagged(home,lang);
 home=home.replace(/<html lang="en"/,'<html lang="'+lang+'"');
 const langNotice=lang==='en'?'':`<p class="translation-notice" data-english-content-notice="">${escaped(dicts[lang]['ui.moreEnglish'])}</p>`;
 home=home.replace(/<div class="project-grid" id="projectGrid"><\/div>/,`<div class="project-grid" id="projectGrid">${catalog.map(p=>card(p,lang)).join('')}</div>`);
 home=home.replace(/<div class="featured-grid" id="featuredGrid"><\/div>/,`<div class="featured-grid" id="featuredGrid">${catalog.filter(p=>p.featured).slice(0,4).map(p=>card(p,lang)).join('')}</div>`);
 home=home.replace(/<p class="translation-notice" data-english-content-notice="" hidden=""><\/p>/,langNotice);
 // fallback markup already contains literal notice in the source
 home=home.replace(/<p class="translation-notice" data-english-content-notice="" hidden="">[^<]*<\/p>/,lang==='en'?'':langNotice);
 const desc=strip(dicts[lang]['hero.statement']);const title=lang==='en'?'Yurii Sachenko — AI Visual Production & Software Engineering':`${strip(dicts[lang]['hero.line1'])} — Yurii Sachenko`;
 home=addMeta(home,{lang,title,desc,route:`/${lang}/`,image:'assets/velor-hero.webp',noindex:lang!=='en'});
 write(path.join(dir,'index.html'),home);
 if(lang==='en')indexable.push('/en/');
 for(const filename of caseFiles){
  let html=linkedPage(fs.readFileSync(path.join(root,filename),'utf8'),lang);
  // These six existing editorial pages are not yet translated beyond shared UI.
  html=addMeta(html,{lang,title:(html.match(/<title>(.*?)<\/title>/i)||[])[1]||filename,desc:(html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)||[])[1]||'A portfolio editorial case study.',route:`/${lang}/${filename}`,noindex:lang!=='en'});
  if(lang!=='en'&&!html.includes('data-english-content-notice'))html=html.replace(/<main\b/,`<p class="translation-notice" data-english-content-notice>${escaped(dicts[lang]['ui.moreEnglish'])}</p><main`);
  write(path.join(dir,filename),html);
  if(lang==='en')indexable.push(`/en/${filename}`);
 }
 for(const p of catalog){
  const route=`/${lang}/work/${p.id}/`;
  const page=addMeta(detailTemplate(p,lang),{lang,title:`${p.title} — Yurii Sachenko`,desc:p.summary,route,image:p.images?.[0]||'assets/velor-hero.webp',kind:'article',work:p,crumbs:[{name:'Portfolio',route:`/${lang}/`},{name:'Projects',route:`/${lang}/#work`},{name:p.title,route}],noindex:lang!=='en'||isPrivate(p)||!hasTranslation(lang,p.id)});
  write(path.join(out,lang,'work',p.id,'index.html'),page);
  if(lang==='en'&&!isPrivate(p)){indexable.push(route);detailsIndexable.push(p.id)}
 }
}
write(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${url('/en/')}"><meta http-equiv="refresh" content="0;url=${cfg.base}/en/"><title>Yurii Sachenko — Portfolio</title><script>try{const l=localStorage.getItem("portfolio.locale");if(["en","ru","uk","es","pl","de","fr","ar"].includes(l))location.replace("${cfg.base}/"+l+"/")}catch(e){}</script></head><body><p><a href="${cfg.base}/en/">View the portfolio</a></p></body></html>`);
write(path.join(out,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page not found — Yurii Sachenko</title><meta name="robots" content="noindex"></head><body><h1>Page not found</h1><p><a href="${cfg.base}/en/">Return to portfolio</a></p></body></html>`);
write(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${cfg.origin}${cfg.base}/sitemap.xml\n`);
write(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexable.map(route=>`<url><loc>${escaped(url(route))}</loc></url>`).join('')}</urlset>`);
write(path.join(out,'BUILD_REPORT.json'),JSON.stringify({base:cfg.base,origin:cfg.origin,pages:locales.length*(1+caseFiles.length+catalog.length)+2,locales,projects:catalog.length,fullyLocalized:['en'],stagedIncomplete:locales.filter(x=>x!=='en'),sitemapUrls:indexable.length,indexableProjectIds:detailsIndexable,nonEnglishPages:'noindex pending genuine case translations'},null,2));
console.log(`Built ${locales.length*(catalog.length+1+caseFiles.length)+2} static pages. ${catalog.length} unique project URLs per language; non-English routes are noindex until full translation. Sitemap: ${indexable.length} English URLs.`);
