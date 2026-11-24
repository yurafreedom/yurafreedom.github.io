/* V4 accessible image deck — dependency-free, progressive enhancement. */
(() => {
 'use strict';
 const groups=[...document.querySelectorAll('[data-gallery-root]')];
 if (!groups.length) return;
 const dialog=document.createElement('dialog');
 dialog.className='gallery-viewer'; dialog.setAttribute('aria-label','Image presentation viewer');
 dialog.innerHTML=`<div class="gallery-viewer__shell">
   <div class="gallery-viewer__head"><span class="gallery-viewer__count" aria-live="polite"></span><p class="gallery-viewer__caption" id="galleryCaption"></p>
     <div class="gallery-viewer__head-actions"><a class="gallery-viewer__pdf" hidden target="_blank" rel="noopener noreferrer">PDF ↗</a><button class="gallery-viewer__zoom" type="button" aria-pressed="false">ZOOM +</button><button class="gallery-viewer__close" type="button" aria-label="Close image gallery">CLOSE ×</button></div>
   </div>
   <div class="gallery-viewer__stage"><button class="gallery-viewer__prev" type="button" aria-label="Previous slide">‹</button>
     <div class="gallery-viewer__scroller"><img class="gallery-viewer__image" alt="" draggable="false" /></div>
     <button class="gallery-viewer__next" type="button" aria-label="Next slide">›</button></div>
   <div class="gallery-viewer__bottom"><div class="gallery-viewer__strip" aria-label="Choose slide"></div><p class="gallery-viewer__instruction">← → Navigate · Esc Close · Zoom to inspect</p></div>
 </div>`;
 document.body.append(dialog);
 const $=selector=>dialog.querySelector(selector);
 const image=$('.gallery-viewer__image'), scroller=$('.gallery-viewer__scroller'),strip=$('.gallery-viewer__strip');
 let items=[],index=0,origin=null,previousOverflow='',zoomed=false,selectedGroup=null;
 const escapeHTML=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const makeThumbs=()=>{
   strip.innerHTML=items.map((item,i)=>`<button type="button" data-gallery-index="${i}" aria-label="Go to slide ${i+1}" aria-current="${i===index?'true':'false'}"><img src="${escapeHTML(item.thumb)}" alt="" loading="lazy"><span>${String(i+1).padStart(2,'0')}</span></button>`).join('');
 };
 const preload=i=>{if(i<0||i>=items.length)return;const im=new Image();im.src=items[i].src;};
 const setZoom=value=>{zoomed=value;dialog.classList.toggle('gallery-viewer--zoomed',zoomed);$('.gallery-viewer__zoom').setAttribute('aria-pressed',String(zoomed));$('.gallery-viewer__zoom').textContent=zoomed?'FIT −':'ZOOM +'; scroller.scrollTo(0,0)};
 const show=i=>{
   index=(i+items.length)%items.length; const item=items[index];setZoom(false);
   image.alt=item.alt || `Slide ${index+1} of ${items.length}`; image.src=item.src;
   $('.gallery-viewer__count').textContent=`${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
   $('.gallery-viewer__caption').textContent=item.caption || image.alt;
   strip.querySelectorAll('[data-gallery-index]').forEach((button,j)=>button.setAttribute('aria-current',String(j===index)));
   strip.querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});
   preload((index+1)%items.length);preload((index-1+items.length)%items.length);
 };
 function open(group,at=0,trigger){
   selectedGroup=group; origin=trigger||document.activeElement;
   items=[...group.querySelectorAll('[data-gallery-item]')].map(a=>({src:a.getAttribute('href'),thumb:a.querySelector('img')?.getAttribute('src')||a.getAttribute('href'),caption:a.dataset.caption,alt:a.querySelector('img')?.alt||a.dataset.caption}));
   if(!items.length) return;
   const pdf=group.dataset.pdf;
   $('.gallery-viewer__pdf').hidden=!pdf;
   if(pdf) $('.gallery-viewer__pdf').href=pdf;
   dialog.setAttribute('aria-label',group.dataset.galleryTitle||'Image presentation');
   previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
   makeThumbs();dialog.showModal();show(at);$('.gallery-viewer__close').focus();
 }
 function close(){if(dialog.open)dialog.close()}
 groups.forEach(group=>group.addEventListener('click',e=>{
   const a=e.target.closest('[data-gallery-item], [data-gallery-featured]'); if(!a||!group.contains(a))return;
   // left/middle-click, modifiers and 'open in new tab' keep native fallback.
   if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
   const idx=a.hasAttribute('data-gallery-featured')?0:[...group.querySelectorAll('[data-gallery-item]')].indexOf(a);
   if(idx<0)return;e.preventDefault();open(group,idx,a);
 }));
 $('.gallery-viewer__next').addEventListener('click',()=>show(index+1));
 $('.gallery-viewer__prev').addEventListener('click',()=>show(index-1));
 $('.gallery-viewer__close').addEventListener('click',close);
 $('.gallery-viewer__zoom').addEventListener('click',()=>setZoom(!zoomed));
 strip.addEventListener('click',e=>{const btn=e.target.closest('[data-gallery-index]');if(btn)show(Number(btn.dataset.galleryIndex))});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 dialog.addEventListener('keydown',e=>{
   if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
   if(e.key==='ArrowRight'){e.preventDefault();show(index+(document.dir==='rtl'?-1:1))}
   if(e.key==='ArrowLeft'){e.preventDefault();show(index+(document.dir==='rtl'?1:-1))}
 });
 dialog.addEventListener('close',()=>{
   document.body.style.overflow=previousOverflow;image.removeAttribute('src');items=[];setZoom(false);
   if(origin && origin.isConnected)origin.focus();
 });
 let startX=null,startY=null;
 scroller.addEventListener('touchstart',e=>{if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY}else startX=null},{passive:true});
 scroller.addEventListener('touchend',e=>{
   if(startX===null||zoomed||!e.changedTouches.length)return;
   const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;startX=null;
   if(Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?(document.dir==='rtl'?-1:1):(document.dir==='rtl'?1:-1)));
 },{passive:true});
 window.PortfolioGallery={open: (groupId,index=0)=>{const group=document.getElementById(groupId);if(group)open(group,index)},close};
})();
