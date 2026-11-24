/* Eight-locale client-side chrome. Content translation completeness is tracked separately. */
(() => {
 'use strict';
 const locales=window.PORTFOLIO_TRANSLATIONS||{},config=window.PORTFOLIO_CONFIG||{};
 const base=(config.BASE_PATH||'').replace(/\/$/,'');const codes=Object.keys(locales);
 const pathLocale=()=>{const path=location.pathname;const escaped=base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return (path.match(new RegExp('^'+escaped+'/(en|ru|uk|es|pl|de|fr|ar)(?:/|$)'))||[])[1]||document.documentElement.lang||'en'};
 let lang=codes.includes(pathLocale())?pathLocale():'en';
 const t=(key)=>locales[lang]?.[key]||locales.en?.[key]||key;
 const meta=(key,value)=>{const el=document.querySelector(key);if(el)el.setAttribute('content',value)};
 const canonicalUrl=()=>`${config.SITE_ORIGIN}${location.pathname}`;
 const changeUrl=(code)=>{
   let path=location.pathname;
   const root=base+'/';
   if(path.startsWith(root)){
     const remainder=path.slice(root.length).replace(/^(?:en|ru|uk|es|pl|de|fr|ar)(?=\/|$)/,'').replace(/^\//,'');
     return root+code+'/'+remainder;
   }
   return location.pathname;
 };
 function apply(code,{push=false}={}){
   if(!codes.includes(code))return;
   lang=code;document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
   document.querySelectorAll('[data-i18n]').forEach(node=>{const key=node.getAttribute('data-i18n');if(locales[code]?.[key])node.textContent=t(key)});
   document.querySelectorAll('[data-i18n-lang]').forEach(node=>node.lang=code);  // translated text inside an English island
   document.querySelectorAll('[data-i18n-html]').forEach(node=>{const key=node.getAttribute('data-i18n-html');if(locales[code]?.[key])node.innerHTML=t(key)});
   document.querySelectorAll('[data-i18n-placeholder]').forEach(node=>node.placeholder=t(node.dataset.i18nPlaceholder));
   document.querySelectorAll('[data-i18n-aria]').forEach(node=>node.setAttribute('aria-label',t(node.dataset.i18nAria)));
   document.querySelectorAll('select[data-language-switch]').forEach(node=>{node.value=lang;node.setAttribute('aria-label',t('ui.language'))});
   const message=document.querySelector('[data-english-content-notice]');if(message){message.hidden=lang==='en';message.textContent=t('ui.moreEnglish');message.lang=lang}
   if(push){const next=changeUrl(code)+location.search+location.hash;if(next!==location.pathname+location.search+location.hash)history.pushState({locale:code},'',next);}
   // All internal root-relative routes preserve current case and anchors when language changes.
   for(const a of document.querySelectorAll('a[href]')){
     const raw=a.getAttribute('href');if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('http')||raw.startsWith('data:'))continue;
     if(raw.startsWith(base+'/')&&!raw.startsWith('//'))a.href=raw.replace(new RegExp('^'+base+'/(?:en|ru|uk|es|pl|de|fr|ar)/'),base+'/'+lang+'/');
   }
   const projectTitle=document.querySelector('main#case-main h1');
   const homeHero=document.querySelector('#heroTitle');
   // Editorial pages have individually authored SEO metadata: do not overwrite it
   // with the generic homepage title while initializing or switching chrome locale.
   if(projectTitle || homeHero){
     document.title=projectTitle?`${projectTitle.textContent.trim()} — Yurii Sachenko`:(lang==='en'?'Yurii Sachenko — AI Visual Production & Software Engineering':`${t('hero.line1').replace(/<[^>]*>/g,'')} — Yurii Sachenko`);
     meta('meta[name="description"]',projectTitle?(document.querySelector('.lede')?.textContent||projectTitle.textContent):(lang==='en'?'AI visual production, software engineering and selected case studies by Yurii Sachenko.':t('hero.statement').replace(/<[^>]+>/g,'')));
     meta('meta[property="og:description"]',document.querySelector('meta[name="description"]')?.content||'');
     meta('meta[property="og:title"]',document.title);
   }
   const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=canonicalUrl();
   try{localStorage.setItem('portfolio.locale',code)}catch(e){}
   document.dispatchEvent(new CustomEvent('portfolio:language',{detail:{lang}}));
 }
 document.addEventListener('change',e=>{if(e.target.matches('[data-language-switch]'))apply(e.target.value,{push:true})});
 window.addEventListener('popstate',()=>apply(pathLocale()));
 window.PORTFOLIO_I18N={t,apply,get lang(){return lang},codes};
 // Defer is run after parse, so available before the project JS initializes.
 apply(lang);
 // Wrap every ↗ inside a link or button in span.arrow-nudge so CSS can nudge it on hover/focus.
 // Re-runs on DOM changes (card grids, modal, language switch rewrite these nodes).
 const ARROW='\u2197';
 const markArrows=(root)=>{
   if(!root||!root.querySelectorAll)return;
   const scope=root.matches?.('a,button')?[root]:[];
   for(const el of [...scope,...root.querySelectorAll('a,button')]){
     const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const hits=[];
     for(let n;(n=walker.nextNode());)if(n.data.includes(ARROW)&&!n.parentElement.classList.contains('arrow-nudge'))hits.push(n);
     for(const n of hits){
       const parts=n.data.split(ARROW);const frag=document.createDocumentFragment();
       parts.forEach((part,i)=>{if(part)frag.append(part);if(i<parts.length-1){const s=document.createElement('span');s.className='arrow-nudge';s.setAttribute('aria-hidden','true');s.textContent=ARROW;frag.append(s)}});
       n.replaceWith(frag);
     }
   }
 };
 markArrows(document.body);
 // Phrase-title typesetting (hard rule 3b; uppercase display headings are exempt). For each <br>/block run the
 // break points are chosen to fit the column with the fewest lines, then the most even widths (as text-wrap:
 // balance does), such that no line is a lone word of 1-3 letters and, in titles of four or more words, no two
 // consecutive lines are single words unless each fills 70% of the column; every other space becomes a no-break space. Hyphenated words stay whole.
 // Runs again whenever a title changes size or content, and when web fonts arrive.
 const HEAD='.mast h1,.case-hero h2,.section h2,.tile h3,.card-title,.featured-bottom h3';
 const original=new WeakMap();
 const isWord=t=>/[\p{L}\p{N}]/u.test(t);
 const content=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [r.left+parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth),r.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth)]};
 const column=h=>{let [L,R]=content(h.parentElement);const [hl,hr]=content(h);L=Math.max(L,hl,0);R=Math.min(R,hr,innerWidth);
   for(let a=h.parentElement;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);if(s.overflowX!=='visible'||s.overflowY!=='visible'||a.matches('.container,.shell')){const [l,r]=content(a);L=Math.max(L,l);R=Math.min(R,r)}}
   return R-L};
 const wrapHyphens=h=>{
   const w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);const hits=[];
   for(let n;(n=w.nextNode());)if(/\S-\S/.test(n.data)&&!n.parentElement.hasAttribute('data-keep'))hits.push(n);
   for(const n of hits){const frag=document.createDocumentFragment();
     n.data.split(/(\S*[^\s-]-[^\s-]\S*)/).forEach((part,i)=>{if(!part)return;if(i%2){const s=document.createElement('span');s.setAttribute('data-keep','');s.style.whiteSpace='nowrap';s.textContent=part;frag.append(s)}else frag.append(part)});
     n.replaceWith(frag)}
 };
 const glue=h=>{
   if(!h.isConnected)return;
   if(!/\p{Ll}/u.test(h.textContent))return;  // all-uppercase titles are display headings: exempt from 3b
   wrapHyphens(h);
   const texts=[];const tw=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);
   for(let n;(n=tw.nextNode());){if(!original.has(n))original.set(n,n.data);else if(n.data!==original.get(n))n.data=original.get(n);texts.push(n)}
   if(h.getBoundingClientRect().width<1)return;
   const cs=getComputedStyle(h),fs=parseFloat(cs.fontSize);
   for(let shrink=1;shrink>=0.94;shrink-=0.02){  // verify the real layout; retry with a narrower column if a chunk overflows
   const col=column(h)*shrink-1;
   const blocks=[[]];
   const walk=n=>{for(const c of n.childNodes){
     if(c.nodeType===3)for(let i=0;i<c.data.length;i++)blocks[blocks.length-1].push([c,i,c.data[i]]);
     else if(c.nodeName==='BR')blocks.push([]);
     else if(c.nodeType===1){const blk=!getComputedStyle(c).display.startsWith('inline');if(blk)blocks.push([]);walk(c);if(blk)blocks.push([])}}};
   walk(h);
   const edits=[];
   for(const chars of blocks){
     // tokens separated by whitespace; a regular space may become a break, an original no-break space never does
     const toks=[];let cur=null,gap=[];
     for(const ch of chars){if(/\s/.test(ch[2])){if(cur){cur=null;gap=[]}gap.push(ch);continue}
       if(!cur){cur={a:ch,b:ch,t:'',before:gap};toks.push(cur);gap=[]}cur.b=ch;cur.t+=ch[2]}
     if(toks.length<2)continue;
     let space=0.28*fs+(parseFloat(cs.letterSpacing)||0);
     for(const t of toks){const rg=document.createRange();rg.setStart(t.a[0],t.a[1]);rg.setEnd(t.b[0],t.b[1]+1);
       const q=[...rg.getClientRects()].filter(x=>x.width>0.5);t.w=q.reduce((m,x)=>m+x.width,0);t.word=isWord(t.t);
       const g=t.before.find(c=>/ /.test(c[2]));if(g){const r2=document.createRange();r2.setStart(g[0],g[1]);r2.setEnd(g[0],g[1]+1);const gw=r2.getBoundingClientRect().width;if(gw>0.5)space=gw}}
     const canBreak=i=>i>0&&toks[i].before.some(c=>/[ \t\n]/.test(c[2]))&&toks[i].word;  // break before token i
     const n=toks.length,width=(i,j)=>{let w=0;for(let k=i;k<=j;k++)w+=toks[k].w;return w+(j-i)*space};
     const words=(i,j)=>{let c=0;for(let k=i;k<=j;k++)if(toks[k].word)c++;return c};
     // A line is a "single" when it holds one word; weak when that word fills < 70% of the column (0.72: margin).
     // Rule 3b: no line is a lone word of 1-3 letters; no two consecutive singles unless both are strong.
     const total=(h.textContent.match(/\S+/g)||[]).filter(isWord).length;  // up to three words: one word per line is fine
     const free=total<4||(h.matches('.case-hero h2')&&innerWidth<600);  // the modal title below 600 breaks freely
     const kind=(i,j,w)=>free||words(i,j)!==1?0:(w>=0.72*(col+1)?1:2);
     const shortLone=(i,j)=>{if(words(i,j)!==1)return false;for(let k=i;k<=j;k++)if(toks[k].word)return (toks[k].t.match(/[\p{L}\p{N}]/gu)||[]).length<=3;return false};
     // best[i][p] = [lines, maxWidth, next, kind] for tokens i..n-1 when the previous line has kind p
     const best=Array.from({length:n+1},()=>[null,null,null]);best[n]=[[0,0,-1,0],[0,0,-1,0],[0,0,-1,0]];
     for(let i=n-1;i>=0;i--)for(let p=0;p<3;p++){
       for(let j=i;j<n;j++){
         if(j+1<n&&!canBreak(j+1))continue;
         const w=width(i,j);if(w>col)break;
         if(shortLone(i,j))continue;
         const k=kind(i,j,w);if(k&&p&&(k===2||p===2))continue;
         const rest=best[j+1][k];if(!rest)continue;
         const cand=[rest[0]+1,Math.max(w,rest[1]),j+1,k];
         const cur=best[i][p];if(!cur||cand[0]<cur[0]||(cand[0]===cur[0]&&cand[1]<cur[1]))best[i][p]=cand}}
     if(!best[0][0])continue;  // nothing satisfies the rule at this size: leave the browser's layout
     const breaks=new Set();for(let i=0,p=0;best[i][p][2]!==-1&&best[i][p][2]<n;){const b=best[i][p];breaks.add(b[2]);i=b[2];p=b[3]}
     for(let k=1;k<n;k++)if(!breaks.has(k))for(const c of toks[k].before)if(/[ \t\n]/.test(c[2]))edits.push(c);
   }
   const byNode=new Map();for(const [node,i] of edits){if(!byNode.has(node))byNode.set(node,[]);byNode.get(node).push(i)}
   for(const [node,idx] of byNode){const d=[...node.data];for(const i of idx)d[i]=' ';node.data=d.join('')}
   if(!overflows(h))return;
   for(const n of texts)n.data=original.get(n);  // undo and try a narrower column
   }
 };
 const overflows=h=>{const box=h.getBoundingClientRect(),s=getComputedStyle(h.parentElement),pr=h.parentElement.getBoundingClientRect();
   const right=Math.min(innerWidth,pr.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth),box.right)+0.5;const rg=document.createRange();rg.selectNodeContents(h);
   return [...rg.getClientRects()].some(q=>q.width>0.5&&q.right>right)};
 const ro=new ResizeObserver(entries=>{for(const e of entries)glue(e.target)});
 const watch=root=>{if(!root.querySelectorAll)return;const list=root.matches?.(HEAD)?[root]:[];for(const h of [...list,...root.querySelectorAll(HEAD)])ro.observe(h)};
 watch(document.body);
 new MutationObserver(list=>{for(const m of list){const h=m.target.closest?.(HEAD);if(h)glue(h);for(const n of m.addedNodes)if(n.nodeType===1)watch(n)}}).observe(document.body,{childList:true,subtree:true});
 // Word widths change when a web font arrives, often without changing the heading's box: lay out again.
 const glueAll=()=>document.querySelectorAll(HEAD).forEach(glue);
 document.fonts?.ready.then(glueAll);document.fonts?.addEventListener('loadingdone',glueAll);
 window.__headingGlue=glue;
 // Puts back the text a title had before typesetting (used by the measuring tools before they save innerHTML).
 window.__headingRestore=h=>{const w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);for(let n;(n=w.nextNode());)if(original.has(n))n.data=original.get(n)};
 new MutationObserver(list=>{for(const m of list)for(const node of m.addedNodes)if(node.nodeType===1)markArrows(node);else if(node.nodeType===3&&node.parentElement)markArrows(node.parentElement.closest('a,button'))}).observe(document.body,{childList:true,subtree:true});
})();
