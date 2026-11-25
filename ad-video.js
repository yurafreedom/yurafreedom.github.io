/* Vertical ad-creative players (case page and case modal).
   - One video plays at a time: starting one pauses the others.
   - Sound only after the viewer presses play: no autoplay, no muted start.
   - Posters: the 540 px poster is in the markup (and is all a no-JS visitor gets); where the player is drawn
     wider than 540 device pixels, it switches to the 1080 px poster. preload="none" means no video bytes load before play. */
(()=>{
  'use strict';
  const SEL='video[data-ad-video]';
  const upgrade=(root=document)=>root.querySelectorAll(SEL).forEach(v=>{
    const full=v.dataset.posterFull;
    if(full&&!v.poster.endsWith(full)&&v.clientWidth*(window.devicePixelRatio||1)>540)v.poster=full;
  });
  const pauseAll=(root=document)=>root.querySelectorAll(SEL).forEach(v=>{if(!v.paused)v.pause()});
  // 'play' does not bubble; listen in the capture phase so players added later (the modal) are covered too.
  document.addEventListener('play',e=>{
    const t=e.target;if(!(t instanceof HTMLVideoElement)||!t.matches(SEL))return;
    document.querySelectorAll(SEL).forEach(v=>{if(v!==t&&!v.paused)v.pause()});
  },true);
  window.PORTFOLIO_AD_VIDEO={upgrade,pauseAll};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>upgrade());else upgrade();
})();
