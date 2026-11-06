(function(){
'use strict';
/* always start at the top on load/reload (no browser scroll restore, no #hash jump) */
if('scrollRestoration' in history) history.scrollRestoration='manual';
if(location.hash && !new URLSearchParams(location.search).get('only')) history.replaceState(null,'',location.pathname+location.search);
const toTop=()=>window.scrollTo(0,0);
toTop();
addEventListener('load',()=>{ toTop(); setTimeout(toTop,60); });
addEventListener('pageshow',e=>{ if(e.persisted) toTop(); });
const SMALLSCREEN = matchMedia('(max-width:900px)').matches;          // phones / iPad portrait get the lighter files
const IMG = (n,sfx=null) => `assets/img/${n}${sfx===null ? (SMALLSCREEN?'-m':'') : sfx}.webp`;
const LQ = window.LQ || {};
// blur-up: show a tiny blurred copy straight away, swap in the real picture once it has downloaded
function setBg(el,name,sfx,pos){
  if(LQ[name]) el.style.backgroundImage = `url(${LQ[name]})`;
  if(pos) el.style.backgroundPosition = pos;
  const url = IMG(name,sfx), im = new Image();
  im.onload = ()=>{ el.style.backgroundImage = `url(${url})`; el.classList.add('img-ready'); };
  im.src = url;
}
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

/* ---- paint images + placeholders (lazy: only load pictures when they are near the screen) ---- */
const lazyIO = new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  const el=e.target; lazyIO.unobserve(el);
  if(el.dataset.mosaic){ el.innerHTML = el.dataset.mosaic.split(',').map(m=>`<div style="background-image:url(${IMG(m.trim(),'-s')})"></div>`).join(''); return; }
  setBg(el, el.dataset.img);
}),{rootMargin:'900px 900px'});
function paint(el){
  const n = el.dataset.img;
  if(el.dataset.mosaic){ lazyIO.observe(el); return; }
  if(n){
    const t = document.createElement('em'); t.className='tag'; t.textContent = n+'.webp'; el.appendChild(t);
    if(LQ[n]) el.style.backgroundImage = `url(${LQ[n]})`;
    lazyIO.observe(el);
  } else {
    el.classList.add('ph');
    el.innerHTML = `<span>${el.dataset.ph || 'Photo TBC'}</span><em class="tag">PLACEHOLDER</em>`;
  }
}
$$('[data-img],[data-mosaic]').forEach(paint);
const heroImg=$('#heroImg'); if(heroImg && heroImg.complete) heroImg.classList.add('on');

/* ---- BUDDHA titles: per-letter entrance ---- */
$$('.title').forEach(t=>{ const txt=t.textContent.trim(); t.setAttribute('aria-label',txt); t.innerHTML=[...txt].map((c,i)=>`<span class="ch" style="--i:${i}" aria-hidden="true">${c}</span>`).join(''); });

/* ---- hero quote: word-by-word entrance ---- */
(function(){
  const p=$('.hero-quote p'); if(!p) return;
  const out=[]; let n=0, last=null;
  const add=(txt)=>{ const sp=document.createElement('span'); sp.className='qw'; sp.style.setProperty('--i',n++); sp.textContent=txt; out.push(sp); last=sp; };
  [...p.childNodes].forEach(node=>{
    if(node.nodeType===3){
      const t=node.textContent;
      t.split(/(\s+)/).forEach((tok,k)=>{
        if(!tok) return;
        if(/^\s+$/.test(tok)){ last=null; return; }
        if(last && k===0 && !/^\s/.test(t)) last.textContent+=tok; else add(tok);
      });
    } else add(node.textContent);
  });
  p.setAttribute('aria-label',p.textContent); p.textContent=''; out.forEach((sp,k)=>{ sp.setAttribute('aria-hidden','true'); p.appendChild(sp); if(k<out.length-1) p.appendChild(document.createTextNode(' ')); });
})();

/* ---- nav ---- */
const nav = $('#nav'), prog = $('#progress');
const hudSec=$('#hudSec'), hudTc=$('#hudTc');
const hudNames=['Cover','Logline','Story','World','Tone','Themes','Characters','End'];
function hud(y,h){
  const p=h>0?Math.min(1,Math.max(0,y/h)):0, tot=p*6300, hh=Math.floor(tot/3600), mm=Math.floor(tot%3600/60), ss=Math.floor(tot%60), ff=Math.floor((tot%1)*24);
  const f=n=>String(n).padStart(2,'0');
  if(hudTc) hudTc.textContent=`${f(hh)}:${f(mm)}:${f(ss)}:${f(ff)}`;
  const ids=$$('main>section'); let cur=0; ids.forEach((x,i)=>{ if(x.getBoundingClientRect().top<innerHeight*.5) cur=i; });
  if(hudSec) hudSec.textContent=`(${f(cur+1)}) ${hudNames[cur]||''}`;
}
// light-weight scroll work: one pass per frame, and no parallax / timecode on touch screens
const FANCY = !SMALLSCREEN && matchMedia('(hover:hover)').matches;
const heroBgEl = $('#heroBg');
function onScroll(){
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  nav.classList.toggle('solid', y>60);
  prog.style.transform = 'scaleX('+(h>0?y/h:0)+')';
  if(FANCY){
    hud(y,h);
    if(heroBgEl && y<innerHeight) heroBgEl.style.translate = '0 '+(y*.18)+'px';
  }
}
let scrollTick = false;
addEventListener('scroll', ()=>{ if(scrollTick) return; scrollTick = true; requestAnimationFrame(()=>{ onScroll(); scrollTick = false; }); }, {passive:true});
onScroll();
$('#burger').onclick = ()=>nav.classList.toggle('open');
$$('#links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const secs = $$('main section[id]');
const linkMap = Object.fromEntries($$('#links a').map(a=>[a.getAttribute('href').slice(1),a]));
const navIO = new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){ $$('#links a').forEach(a=>a.classList.remove('on')); const l=linkMap[e.target.id]; l&&l.classList.add('on'); }
}),{rootMargin:'-45% 0px -50% 0px'});
secs.forEach(s=>navIO.observe(s));

/* ---- live Chennai clock ---- */
const ck=$('#clock');
if(ck){ const tick=()=>{ ck.textContent='Chennai '+new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',second:'2-digit'}); }; tick(); setInterval(tick,1000); }

/* ---- reveal ---- */
const rio = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); rio.unobserve(e.target);} }),{threshold:.15});
$$('.reveal').forEach(el=>rio.observe(el));
requestAnimationFrame(()=>$('#title').classList.add('is-in'));

$$('.beat .n').forEach(n=>{ n.innerHTML='<b>'+n.textContent.trim()+'</b>'; });

/* ---- reels (Logan carousel) ---- */
$$('.reel').forEach(reel=>{
  const track = $('.reel-track',reel), beats = $$('.beat',reel), cnt = $('.count b',reel);
  let cur = -1, gliding = false, raf = 0;
  function setActive(i){
    if(i===cur) return;
    cur = i; beats.forEach((b,k)=>b.classList.toggle('active',k===i));
    cnt.textContent = String(i+1).padStart(2,'0');
    cnt.classList.remove('roll'); void cnt.offsetWidth; cnt.classList.add('roll');
  }
  // slow-in / slow-out glide; the card state (scale, dimming, number circle) changes at the START,
  // so it eases in together with the slide instead of snapping once the slide has finished
  function glide(to,dur){
    cancelAnimationFrame(raf);
    const from=track.scrollLeft, t0=performance.now(); gliding=true;
    track.style.scrollSnapType='none';
    (function step(now){
      const p=Math.min(1,Math.max(0,(now-t0)/dur)), e=-(Math.cos(Math.PI*p)-1)/2;
      track.scrollLeft=from+(to-from)*e;
      if(p<1) raf=requestAnimationFrame(step); else { gliding=false; track.style.scrollSnapType=''; }
    })(t0);
  }
  function go(i,dur=640){
    i = Math.max(0,Math.min(beats.length-1,i));
    const b = beats[i];
    setActive(i);
    glide(b.offsetLeft - (track.clientWidth-b.clientWidth)/2, dur);
  }
  let t;
  track.addEventListener('scroll',()=>{
    if(gliding) return;                      // our own glide drives the state
    clearTimeout(t); t=setTimeout(()=>{
      const mid = track.scrollLeft + track.clientWidth/2;
      let best=0,bd=1e9;
      beats.forEach((b,k)=>{ const d=Math.abs(b.offsetLeft+b.clientWidth/2-mid); if(d<bd){bd=d;best=k;} });
      setActive(best);
    },60);
  },{passive:true});
  beats.forEach((b,k)=>b.addEventListener('click',()=>go(k)));
  $('.prev',reel).onclick = ()=>go(cur-1);
  $('.next',reel).onclick = ()=>go(cur+1);
  requestAnimationFrame(()=>go(0,1));
});

/* ---- equaliser bars ---- */
const eq=$('#eq');
if(eq){ for(let k=0;k<44;k++){ const b=document.createElement('i'); b.style.animationDuration=(0.5+Math.random()*1.5).toFixed(2)+'s'; b.style.animationDelay=(-Math.random()*2).toFixed(2)+'s'; eq.appendChild(b);} }

/* ---- world accordion ---- */
const ws = $$('#worlds .w');
ws.forEach(w=>{
  const on = ()=>{ ws.forEach(x=>x.classList.remove('on')); w.classList.add('on'); };
  w.addEventListener('click',on); w.addEventListener('focus',on);
});

/* ---- ordinary -> mythic scroll story ---- */
const lines = $$('.ord-line'), imgs = $$('.ord-img');
const lio = new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    const i = +e.target.dataset.i;
    lines.forEach(l=>l.classList.toggle('on',l===e.target));
    imgs.forEach((m,k)=>m.classList.toggle('on',k===i));
  }
}),{rootMargin:'-42% 0px -42% 0px'});
lines.forEach(l=>lio.observe(l));

/* ---- torn edges on the tone photo ---- */
(function(){
  const st=$('.ord-stage'); if(!st) return;
  let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const J=.75, pts=[], nx=140, ny=90; let v=.5;
  const t=()=>{ v=v*.55+rnd()*.45; return v*J; };
  for(let i=0;i<=nx;i++) pts.push([i/nx*100, t()]);
  for(let i=1;i<=ny;i++) pts.push([100-t(), i/ny*100]);
  for(let i=1;i<=nx;i++) pts.push([100-i/nx*100, 100-t()]);
  for(let i=1;i<ny;i++) pts.push([t(), 100-i/ny*100]);
  st.style.clipPath='polygon('+pts.map(p=>p[0].toFixed(2)+'% '+p[1].toFixed(2)+'%').join(',')+')';
})();

/* ---- very subtle, realistic torn paper edge on the character polaroid ---- */
(function(){
  const el=$('#portrait'); if(!el) return;
  let seed=29; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const nx=110, ny=130, pts=[]; let v=.5;
  const t=(big)=>{ v=v*.6+rnd()*.4; const a=big&&rnd()<.07?.75:.3; return v*a; };   // % inset, tiny; rare slightly deeper nick
  for(let i=0;i<=nx;i++) pts.push([i/nx*100, t(1)]);
  for(let i=1;i<=ny;i++) pts.push([100-t(0), i/ny*100]);
  for(let i=1;i<=nx;i++) pts.push([100-i/nx*100, 100-t(1)*1.3]);
  for(let i=1;i<ny;i++) pts.push([t(0), 100-i/ny*100]);
  el.style.clipPath='polygon('+pts.map(p=>p[0].toFixed(2)+'% '+p[1].toFixed(2)+'%').join(',')+')';
})();

/* ---- subtle, realistic torn edges for every tape (same idea as the character polaroid) ---- */
function tornPoly(w,h,seed,ampX,ampY){
  let sd=seed; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  const pts=[], step=5; let v=.5;
  const wob=(amp)=>{ v=v*.55+rnd()*.45; const nick=rnd()<.07?1.7:1; return v*amp*nick; };
  const nx=Math.max(8,Math.round(w/step)), ny=Math.max(5,Math.round(h/step));
  for(let i=0;i<=nx;i++) pts.push([i/nx*w, wob(ampY)]);
  for(let i=1;i<=ny;i++) pts.push([w-wob(ampX), i/ny*h]);
  for(let i=1;i<=nx;i++) pts.push([w-i/nx*w, h-wob(ampY)]);
  for(let i=1;i<ny;i++) pts.push([wob(ampX), h-i/ny*h]);
  return 'polygon('+pts.map(p=>(p[0]/w*100).toFixed(2)+'% '+(p[1]/h*100).toFixed(2)+'%').join(',')+')';
}
let tearSeed=11;
function tear(w,h,ampX,ampY){ tearSeed=(tearSeed*7+13)%2147483; return tornPoly(w,h,tearSeed+1,ampX,ampY); }
function tearAll(){
  // header tapes: ends tear a little more than the long edges, like real tape
  $$('.sec-title span, .tape-label span').forEach(el=>{
    const w=el.offsetWidth, h=el.offsetHeight; if(!w||!h) return;
    el.style.clipPath=tear(w,h,4.5,1.6);
  });
  // small strips of tape holding photos/notes (pseudo-elements read --tear)
  $$('.beat .media').forEach(el=>el.style.setProperty('--tear',tear(84,26,3.5,1.3)));
  $$('.paper-card').forEach(el=>el.style.setProperty('--tear',tear(110,28,3.8,1.3)));
  $$('.polaroid.pin').forEach(el=>el.style.setProperty('--tear',tear(60,22,3,1.2)));
}
tearAll();
document.fonts && document.fonts.ready.then(tearAll);   // re-measure once the web fonts have loaded

/* ---- character select (Big Hero 6) ---- */
const DATA = window.BUDDHA_CHARS;
const rail=$('#rail'), silh=$('#silh'), portrait=$('#portrait'), ghost=$('#ghost');
let group='family', idx=0;
function list(){ return DATA[group]; }
function renderRail(){
  rail.innerHTML='';
  list().forEach((c,i)=>{
    const li=document.createElement('li');
    li.className='av'+(c.img?'':' ph')+(i===idx?' on':'');
    li.title=c.name;
    li.innerHTML=`<div style="${c.img?`background-image:url(${IMG(c.img,'-s')});background-position:${c.pos||'center 20%'}`:''}"></div>`;
    li.onclick=()=>select(i);
    rail.appendChild(li);
  });
}
function select(i){
  idx=i; const c=list()[i];
  $$('.av',rail).forEach((a,k)=>a.classList.toggle('on',k===i));
  // stage
  portrait.className='portrait'; portrait.innerHTML=''; portrait.style.backgroundImage='';
  void portrait.offsetWidth; // restart animation
  if(c.img){
    setBg(portrait,c.img,null,c.pos||'center 20%');
    silh.className='silh photo'; setBg(silh,c.img,'-s',c.pos||'center');
    const t=document.createElement('em'); t.className='tag'; t.textContent=c.img+'.webp'; portrait.appendChild(t);
  } else {
    portrait.classList.add('ph');
    portrait.innerHTML=`<span>${c.ph||c.name} · photo TBC</span><em class="tag">PLACEHOLDER</em>`;
    silh.className='silh empty'; silh.style.backgroundImage='';
  }
  ghost.textContent=c.name.split(' ')[0];
  // panel
  const p=$('#panel'); p.style.animation='none'; void p.offsetWidth; p.style.animation='';
  $('#pGroup').textContent='File · '+group;
  $('#pCount').textContent=String(i+1).padStart(2,'0')+' / '+String(list().length).padStart(2,'0');
  $('#pName').textContent=c.name;
  $('#pRole').textContent=c.role;
  $('#pQuote').textContent=c.quote||'';
  $('#pBio').textContent=c.bio;
  $('#pInfo').innerHTML=c.info.map(r=>`<li><b>${r[0]}</b><span>${r[1]}</span></li>`).join('')+(c.note?`<li style="border:0;background:none;padding:0;display:block"><span class="note">${c.note}</span></li>`:'');
  const av=$$('.av',rail)[i]; if(av&&rail.scrollWidth>rail.clientWidth) rail.scrollTo({left:av.offsetLeft-rail.clientWidth/2+av.clientWidth/2,behavior:'smooth'});
}
$$('#tabs button').forEach(b=>b.onclick=()=>{
  $$('#tabs button').forEach(x=>x.classList.toggle('on',x===b));
  group=b.dataset.g; idx=0; renderRail(); select(0);
});
addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P'){ document.body.classList.toggle('show-tags'); return; }
  const sec=$('#characters').getBoundingClientRect();
  const inView = sec.top<innerHeight*.6 && sec.bottom>innerHeight*.4;
  if(!inView) return;
  if(e.key==='ArrowDown'||e.key==='ArrowRight'){ e.preventDefault(); select((idx+1)%list().length); }
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'){ e.preventDefault(); select((idx-1+list().length)%list().length); }
});
renderRail(); select(0);
/* QA helper: ?probe lists anything wider than the screen */
if(new URLSearchParams(location.search).has('probe')){ setTimeout(()=>{ const W=document.documentElement.clientWidth, bad=[]; document.querySelectorAll('body *').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width>0 && (r.right>W+2||r.left<-2) && !e.closest('.reel-track') && !e.closest('.hero-bg') && !e.closest('.grain')) bad.push((e.id?'#'+e.id:e.tagName.toLowerCase()+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')).slice(0,60)+' '+Math.round(r.left)+'..'+Math.round(r.right)); }); const pre=document.createElement('pre'); pre.id='probe'; pre.textContent='W='+W+' scrollW='+document.documentElement.scrollWidth+'\n'+bad.slice(0,25).join('\n'); document.body.appendChild(pre); },1500); }

/* review mode: ?only=story shows one section, fully revealed (used for QA screenshots) */
const only=new URLSearchParams(location.search).get('only');
if(only){ const qg=new URLSearchParams(location.search).get('g'), qi=+(new URLSearchParams(location.search).get('i')||0); const qb=new URLSearchParams(location.search).get('b'); if(qb!==null){ const r1=$$('#reel1 .beat')[+qb], r2=$$('#reel2 .beat')[+qb]; setTimeout(()=>{ r1&&r1.click(); r2&&r2.click(); },400); }
  if(qg){ const tb=$(`#tabs button[data-g="${qg}"]`); tb&&tb.click(); select(qi); }
  $$('main>section').forEach(x=>{ if(x.id!==only) x.style.display='none'; }); $$('.reveal').forEach(x=>x.classList.add('in')); $('#nav').style.display='none'; scrollTo(0,0); }
})();
