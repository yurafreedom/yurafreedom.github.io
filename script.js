(()=>{
  'use strict';
  const projects=window.PORTFOLIO_PROJECTS||[];
  const categories=[['all','ALL WORK'],['visual','AI VISUAL / VIDEO'],['ai','AI / DATA'],['automation','AUTOMATION'],['web','WEB'],['creative','CREATIVE'],['product','PRODUCTS'],['growth','GROWTH'],['education','EDUCATION']];
  const state={category:'all',query:'',expanded:false,caseId:null,galleryIndex:0};
  const $=id=>document.getElementById(id);
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const i18n=window.PORTFOLIO_I18N;
  const tr=(key)=>i18n?.t(key)||key;
  // Mark text whose language differs from the page: project fields the loaded data has not translated
  // (PORTFOLIO_EN_FIELDS, per id) are English; the language can also switch in place without new data.
  const pageLang=()=>i18n?.lang||document.documentElement.lang||'en';
  const fieldLang=(p,field)=>((window.PORTFOLIO_EN_FIELDS||{})[p.id]||[]).includes(field)?'en':(window.PORTFOLIO_DATA_LOCALE||'en');
  const en=(p,field)=>{const l=field?fieldLang(p,field):'en';return l!==pageLang()?` lang="${l}"`:''};
  // URLs in projects-data.js carry the locale it was built for; after an in-place language switch they follow the page.
  const localize=u=>String(u||'').replace(/\/(en|ru|uk|es|pl|de|fr|ar)\//,m=>/^\//.test(u)?`/${pageLang()}/`:m);
  const caseUrl=p=>p.url?localize(p.url):`work/${encodeURIComponent(p.id)}/`;
  const count=cat=>cat==='all'?projects.length:projects.filter(p=>p.category===cat).length;
  const responsiveImg=(src,alt)=>{const m=src.match(/^(.*\/)(velor-hero|velor-alt|jewelry|winter-fashion)\.webp$/);const widths=m?[480,768,1120]:[];const realWidth=m&&m[2]==='jewelry'?1240:1120;const set=m?`${m[1]}${m[2]}-480.webp 480w, ${m[1]}${m[2]}-768.webp 768w, ${src} ${realWidth}w`:'';return `<picture>${set?`<source type="image/webp" srcset="${escape(set)}" sizes="(min-width:1200px) 34vw, (min-width:700px) 47vw, 96vw">`:''}<img src="${escape(src)}" alt="${escape(alt)}" width="${realWidth}" height="${m&&m[2]==='jewelry'?1166:1400}" loading="lazy" decoding="async"/></picture>`};
  const art=p=>p.images&&p.images.length?`<div class="visual-art visual-real">${responsiveImg(p.images[0],p.title+' project image')}</div>`:`<div class="visual-art tone-${escape(p.tone)}" data-glyph="${escape(p.glyph)}" aria-hidden="true"><span class="art-grid"></span><span class="art-disc"></span><span class="art-glow"></span></div>`;
  const filtered=()=>projects.filter(p=>(state.category==='all'||p.category===state.category)&&(!state.query||[p.title,p.eyebrow,p.category,p.summary,p.role||'',...(p.stack||[])].join(' ').toLowerCase().includes(state.query)));
  const projectCard=(p,i)=>`<article class="project-card"><a href="${escape(caseUrl(p))}" data-case="${escape(p.id)}" aria-label="${escape(tr('ui.open'))}: ${escape(p.title)}"><div class="card-media"${en(p)}>${art(p)}<span class="card-counter">CASE / ${String(i+1).padStart(2,'0')}</span><span class="card-corner">↗</span></div><div class="card-body"><div class="card-kicker"${en(p,'eyebrow')}>${escape(p.eyebrow)}</div><h3 class="card-title"${en(p,'title')}>${escape(p.title)}</h3><p class="card-summary"${en(p,'summary')}>${escape(p.summary)}</p><div class="card-bottom"${en(p,'stage')}><b>${escape(p.stage)}</b><span>↗</span></div></div></a></article>`;
  const featureCard=(p,i)=>`<article class="featured-card"><a href="${escape(caseUrl(p))}" data-case="${escape(p.id)}" aria-label="${escape(tr('ui.open'))}: ${escape(p.title)}"><div class="featured-media"${en(p)}>${art(p)}</div><div class="featured-top"${en(p,'eyebrow')}><span>0${i+1} / ${escape(p.eyebrow)}</span><span>${escape(p.year)} ↗</span></div><div class="featured-bottom"><div><h3${en(p,'title')}>${escape(p.title)}</h3><p${en(p,'summary')}>${escape(p.summary)}</p></div><span class="round-arrow" aria-hidden="true">↗</span></div></a></article>`;
  function renderFilters(){
    $('filters').innerHTML=categories.map(([key,name])=>`<button type="button" class="filter ${state.category===key?'active':''}" aria-pressed="${state.category===key}" data-filter="${key}">${escape((tr('ui.categories')||[])[categories.findIndex(c=>c[0]===key)]||name)}<small>${count(key)}</small></button>`).join('');
  }
  function renderGrid(){
    const all=filtered(), shown=(state.expanded||state.query||state.category!=='all')?all:all.slice(0,9);
    $('projectGrid').innerHTML=shown.map(projectCard).join('');
    $('archiveCount').textContent=`${String(all.length).padStart(2,'0')} ${tr('ui.projects')}`;
    $('emptyState').hidden=all.length!==0;
    $('showMore').parentElement.hidden=state.expanded||!!state.query||state.category!=='all'||shown.length>=all.length;
    renderFilters();
  }
  function setCategory(cat){state.category=categories.some(c=>c[0]===cat)?cat:'all';state.expanded=false;renderGrid();}
  const dialog=$('caseDialog');
  let previousFocus=null;
  function openCase(id,pushHash=true){
    const p=projects.find(x=>x.id===id);if(!p)return;
    state.caseId=id;state.galleryIndex=0;previousFocus=document.activeElement;
    $('caseEyebrow').textContent=`CASE FILE / ${p.year} / ${p.category.toUpperCase()}`;
    renderModal();
    if(!dialog.open)dialog.showModal();
    $('caseClose').focus();
    if(pushHash)history.pushState({case:id},'',caseUrl(p));
  }
  function renderModal(){
    const p=projects.find(x=>x.id===state.caseId);if(!p)return;
    let view=(p.gallery||[])[state.galleryIndex]||(p.gallery||[])[0]||'Portfolio view';
    const links=(p.links||[]).map(link=>`<a href="${escape(localize(link.url))}" target="_blank" rel="noopener noreferrer">${escape(link.label)} <span>↗</span></a>`).join('');
    $('caseContent').innerHTML=`<div class="case-layout"><div class="case-hero"><div class="case-hero-content"><span class="case-phase">${escape(p.stage)}</span><h2 id="caseTitle">${escape(p.title)}</h2><p>${escape(p.summary)}</p>${p.role?`<p class="case-role"><strong>MY ROLE</strong> ${escape(p.role)}</p>`:''}${p.review?`<div class="case-review"><strong>CLIENT REVIEW / ${escape(p.review.score)}</strong><p>“${escape(p.review.quote)}”</p><small>${escape(p.review.date)} · ${escape(p.review.earned)}</small></div>`:''}<div class="case-meta"><span>${escape(p.eyebrow)}</span><span>${escape(p.year)}</span><span>${escape(p.category.toUpperCase())}</span></div></div><div class="case-hero-visual">${p.images&&p.images.length?`<img class="case-photo" src="${escape(p.images[state.galleryIndex%p.images.length])}" alt="${escape(view)}"/>`:art({...p,glyph:view})}</div></div><div class="case-gallery" role="group" aria-label="Illustrative concept views">${(p.gallery||[]).map((g,i)=>`<button type="button" data-gallery="${i}" class="${state.galleryIndex===i?'active':''}" aria-pressed="${state.galleryIndex===i}"><span>0${i+1} / VISUAL NOTE</span>${escape(g)}</button>`).join('')}</div><p class="case-gallery-note">${p.images?.length?'GALLERY SHOWS AVAILABLE VISUAL REFERENCES; FOR OTHER TABS THE CAPTIONS ARE EDITORIAL NOTES.':'PREVIEW TABS ARE ILLUSTRATIVE PLACEHOLDERS; ADD REAL PRODUCT SCREENSHOTS AFTER REVIEW.'}</p><div class="case-detail-grid"><div><div class="case-smalllabel">01 / THE CHALLENGE</div><h3>What needed solving</h3><p>${escape(p.challenge)}</p><div class="case-divider"></div><div class="case-smalllabel">03 / TOOLKIT</div><div class="case-stack">${p.stack.map(s=>`<span>${escape(s)}</span>`).join('')}</div></div><div><div class="case-smalllabel">02 / MY CONTRIBUTION</div><h3>Approach and decisions</h3><ul>${p.approach.map(a=>`<li>${escape(a)}</li>`).join('')}</ul><div class="case-divider"></div><div class="case-smalllabel">04 / DELIVERY & STATUS</div><p>${escape(p.outcome)}</p><div class="case-privacy"><strong>DISCLOSURE NOTE / </strong>${escape(p.privacy)}</div>${links?`<div class="case-links">${links}</div>`:''}<div class="case-meta"><span>${p.repos.length?`${p.repos.length} LINKED REPOSITORY RECORD${p.repos.length>1?'S':''}`:'CASE NARRATIVE / NO PUBLIC SOURCE'}</span></div></div></div></div>`;
    $('caseContent').querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>{state.galleryIndex=Number(button.dataset.gallery);renderModal();}));
  }
  function closeCase(goBack=true){
    if(dialog.open)dialog.close();
    state.caseId=null;
    if(goBack)history.replaceState(null,'',`${window.PORTFOLIO_HOME||'./'}#work`);
    if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
  }
  function handleRoute(){
    const match=location.hash.match(/^#case\/([\w-]+)/)||location.pathname.match(/\/work\/([\w-]+)\/?$/);
    if(match){openCase(match[1],false);}else if(dialog.open){closeCase(false);}
  }
  const worlds=$('worldsGrid');
  if(worlds && window.PORTFOLIO_WORLDS){
    worlds.innerHTML=window.PORTFOLIO_WORLDS.map((w,i)=>`<a class="world world-${escape(w.tone)}" lang="en" href="${escape(w.url)}"${w.url.startsWith('work/')?'':' target="_blank" rel="noopener noreferrer"'} aria-label="Open ${escape(w.title)}"><div class="world-top"><span>${String(i+1).padStart(2,'0')} / ${escape(w.head)}</span><span>${w.url.startsWith('work/')?'CASE STUDY':'EXTERNAL'} ↗</span></div><div><p>${escape(w.meta)}</p><h3>${escape(w.title)}</h3></div><span class="world-bottom">EXPLORE EXPERIENCE <span>↗</span></span></a>`).join('');
  }
  $('featuredGrid').innerHTML=projects.filter(p=>p.featured).slice(0,4).map(featureCard).join('');
  renderGrid();
  document.addEventListener('portfolio:language',()=>{renderGrid();$('featuredGrid').innerHTML=projects.filter(p=>p.featured).slice(0,4).map(featureCard).join('');});
  document.addEventListener('click',e=>{
    const caseButton=e.target.closest('[data-case]');if(caseButton){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();openCase(caseButton.dataset.case);return;}
    const filter=e.target.closest('[data-filter]');if(filter){setCategory(filter.dataset.filter);return;}
    const categoryLink=e.target.closest('[data-category-link]');if(categoryLink){setCategory(categoryLink.dataset.categoryLink);}
  });
  $('searchInput').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();renderGrid();});
  $('showMore').addEventListener('click',()=>{state.expanded=true;renderGrid();});
  $('clearFilters').addEventListener('click',()=>{state.query='';$('searchInput').value='';setCategory('all');});
  $('caseClose').addEventListener('click',()=>closeCase());
  dialog.addEventListener('click',e=>{if(e.target===dialog)closeCase();});
  dialog.addEventListener('close',()=>{state.caseId=null;if(state.caseId)history.replaceState(null,'',(window.PORTFOLIO_HOME||'./')+'#work');if(previousFocus&&previousFocus.isConnected)previousFocus.focus();});
  window.addEventListener('hashchange',handleRoute);
  window.addEventListener('popstate',handleRoute);
  handleRoute();
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!dialog.open&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('searchInput').focus();}});
  const menu=$('mobileMenu'),menuButton=$('menuToggle');
  menuButton.addEventListener('click',()=>{const willOpen=menu.hidden;menu.hidden=!willOpen;menuButton.setAttribute('aria-expanded',String(willOpen));});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');}));
  const progress=$('readingProgress');
  function updateProgress(){let max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?(scrollY/max)*100:0)+'%';}
  window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();
})();
