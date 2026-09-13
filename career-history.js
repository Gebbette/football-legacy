(function(){
'use strict';

const STORAGE_KEY='footballLegacy_career_archive_v1';
const VERSION=1;
const MAX_CAREERS=150;
const MODE_META={
  quick:{label:'Quick Story',icon:'🎬',href:'quick-story.html'},
  express:{label:'Career Express',icon:'🏟️',href:'express.html'},
  original:{label:'Original Career',icon:'🧭',href:'original.html'}
};

function n(v,d=0){const x=Number(v);return Number.isFinite(x)?x:d}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function text(v,fallback='—'){return v==null||v===''?fallback:String(v)}
function arr(v){return Array.isArray(v)?v:[]}
function names(list){return arr(list).map(x=>typeof x==='string'?x:x&&x.name).filter(Boolean)}
function uniq(list){return [...new Set(arr(list).filter(Boolean))]}
function hash(str){let h=2166136261>>>0;for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function modeInfo(mode){return MODE_META[mode]||{label:text(mode,'Career'),icon:'⚽',href:'#'} }

function blank(){return {version:VERSION,careers:[],updatedAt:0}}
function read(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return blank();
    const db=JSON.parse(raw);
    if(!db||!Array.isArray(db.careers))return blank();
    db.version=VERSION;
    return db;
  }catch(e){return blank()}
}
function write(db){
  try{
    db.version=VERSION;db.updatedAt=Date.now();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
    return true;
  }catch(e){return false}
}
function fingerprint(r){
  return hash([r.mode,r.seed||'',r.playerName||'',r.seasons||0,r.apps||0,r.score||0,r.finalClub||''].join('|'));
}
function saveRecord(record){
  if(!record||!MODE_META[record.mode])return false;
  const db=read();
  record.id=record.id||fingerprint(record);
  record.completedAt=n(record.completedAt,Date.now());
  const idx=db.careers.findIndex(x=>x&&x.id===record.id);
  if(idx>=0){
    // Preserve the first completion timestamp while allowing richer/newer fields to be filled in.
    record.completedAt=n(db.careers[idx].completedAt,record.completedAt);
    db.careers[idx]={...db.careers[idx],...record};
  }else db.careers.unshift(record);
  db.careers=db.careers.filter(Boolean).sort((a,b)=>n(b.completedAt)-n(a.completedAt)).slice(0,MAX_CAREERS);
  const ok=write(db);
  if(ok){try{window.dispatchEvent(new CustomEvent('fl-history-updated',{detail:{record}}))}catch(e){}}
  return ok;
}

function quickScore(s){
  const p=s&&s.player||{},c=p.career||{};
  const trophyNames=names(c.trophies),awardNames=names(c.awards);
  const ballons=awardNames.filter(x=>x==="Ballon d'Or").length;
  const major=trophyNames.filter(x=>x==='Champions League'||x==='World Cup').length;
  const score=8+(n(p.peak)-55)*.92+Math.min(18,n(c.apps)/42)+Math.min(12,(n(c.goals)+n(c.assists))/45)+Math.min(16,trophyNames.length*2.3+major*3.2)+Math.min(18,awardNames.length*2.3+ballons*5)+Math.min(8,n(c.caps)/13);
  return clamp(Math.round(score),0,100);
}
function v3Peak(s){
  const p=s&&s.player||{};
  return Math.max(n(p.rating),...arr(p.seasons).map(x=>n(x&&x.ratingAfter,n(x&&x.ratingBefore))));
}
function v3Score(s){
  const p=s&&s.player||{},c=p.career||{},peak=v3Peak(s),seasons=arr(p.seasons).length,trophies=arr(c.trophies).length,awards=arr(c.awards).length,caps=n(p.international&&p.international.caps),ga=n(c.goals)+n(c.assists);
  return clamp(Math.round((peak-50)*1.15+Math.min(15,seasons*.75)+Math.min(16,n(c.apps)/45)+Math.min(14,ga/55)+Math.min(12,trophies*2.2)+Math.min(6,awards*1.5)+Math.min(5,caps/20)),0,100);
}
function v3Clubs(s){
  const p=s&&s.player||{},out=[];
  const first=arr(p.seasons)[0]?.club||arr(p.transferHistory)[0]?.from||p.club;
  if(first)out.push(first);
  for(const t of arr(p.transferHistory))if(t&&t.to&&!out.includes(t.to))out.push(t.to);
  for(const season of arr(p.seasons))if(season&&season.club&&!out.includes(season.club))out.push(season.club);
  if(p.club&&!out.includes(p.club))out.push(p.club);
  return out;
}
function quickClubs(s){
  const out=[];
  for(const t of arr(s&&s.transfers))if(t&&t.to&&!out.includes(t.to))out.push(t.to);
  const p=s&&s.player||{};
  if(p.club&&!out.includes(p.club))out.push(p.club);
  return out;
}

function recordQuick(s,scoreOverride){
  if(!s||!s.ended||!s.player)return false;
  const p=s.player,c=p.career||{},clubs=quickClubs(s),awardNames=names(c.awards),trophyNames=names(c.trophies);
  return saveRecord({
    mode:'quick',modeLabel:MODE_META.quick.label,seed:text(s.seed,''),playerName:text(p.name,'Unknown player'),nationality:text(p.nationality,''),position:text(p.position,''),
    score:clamp(Math.round(n(scoreOverride,quickScore(s))),0,100),peakOvr:n(p.peak,p.rating),seasons:arr(s.history).length,apps:n(c.apps),goals:n(c.goals),assists:n(c.assists),
    trophies:trophyNames.length,awards:awardNames.length,ballonDors:awardNames.filter(x=>x==="Ballon d'Or").length,caps:n(c.caps),intlGoals:n(c.intGoals),
    startClub:clubs[0]||text(p.club,''),finalClub:text(p.club,''),clubs,completedAt:n(s.completedAt,s.updatedAt||Date.now())
  });
}
function recordV3(s,mode,scoreOverride){
  if(!s||!s.player||!s.player.retired||!MODE_META[mode])return false;
  const p=s.player,c=p.career||{},clubs=v3Clubs(s),awardNames=names(c.awards),trophyNames=names(c.trophies);
  return saveRecord({
    mode,modeLabel:MODE_META[mode].label,seed:text(s.seed,''),playerName:text(p.name,'Unknown player'),nationality:text(p.nationality,''),position:text(p.position,''),
    score:clamp(Math.round(n(scoreOverride,v3Score(s))),0,100),peakOvr:v3Peak(s),seasons:arr(p.seasons).length,apps:n(c.apps),goals:n(c.goals),assists:n(c.assists),
    trophies:trophyNames.length,awards:awardNames.length,ballonDors:awardNames.filter(x=>String(x).toLowerCase().includes('ballon')).length,caps:n(p.international&&p.international.caps),intlGoals:n(p.international&&p.international.goals),
    startClub:clubs[0]||text(p.club,''),finalClub:text(p.club,''),clubs,completedAt:n(s.completedAt,s.updatedAt||Date.now())
  });
}

function migrateSavedCareers(){
  try{
    const seen=[];
    const quick=localStorage.getItem('footballLegacy_quick_story_v1');
    if(quick){try{const s=JSON.parse(quick);if(s&&s.ended){recordQuick(s);seen.push('quick')}}catch(e){}}
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||'';
      let mode=null;
      if(key.startsWith('footballLegacy_express_slot_'))mode='express';
      else if(key.startsWith('footballLegacy_original_slot_'))mode='original';
      if(!mode)continue;
      try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s?.player?.retired){recordV3(s,mode);seen.push(key)}}catch(e){}
    }
    return seen.length;
  }catch(e){return 0}
}

function summary(){
  const careers=read().careers.filter(x=>x&&MODE_META[x.mode]);
  const best=careers.slice().sort((a,b)=>n(b.score)-n(a.score)||n(b.completedAt)-n(a.completedAt))[0]||null;
  const total=k=>careers.reduce((sum,x)=>sum+n(x[k]),0);
  const modes={};
  for(const mode of Object.keys(MODE_META)){
    const list=careers.filter(x=>x.mode===mode);
    const bestMode=list.slice().sort((a,b)=>n(b.score)-n(a.score))[0]||null;
    modes[mode]={count:list.length,best:bestMode,avg:list.length?Math.round(list.reduce((a,x)=>a+n(x.score),0)/list.length):0};
  }
  const topBy=k=>careers.slice().sort((a,b)=>n(b[k])-n(a[k])||n(b.score)-n(a.score))[0]||null;
  const clubCounts={},positionCounts={};
  for(const c of careers){for(const club of uniq(c.clubs))clubCounts[club]=(clubCounts[club]||0)+1;if(c.position)positionCounts[c.position]=(positionCounts[c.position]||0)+1}
  const maxEntry=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]||null;
  return {
    careers,best,modes,count:careers.length,totalSeasons:total('seasons'),totalApps:total('apps'),totalGoals:total('goals'),totalAssists:total('assists'),totalTrophies:total('trophies'),totalAwards:total('awards'),
    highestOvr:topBy('peakOvr'),mostGoals:topBy('goals'),mostAssists:topBy('assists'),mostTrophies:topBy('trophies'),longest:topBy('seasons'),favouriteClub:maxEntry(clubCounts),commonPosition:maxEntry(positionCounts)
  };
}

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function formatDate(ts){try{return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(ts))}catch(e){return ''}}
function scoreClass(score){return score>=90?'elite':score>=75?'great':score>=60?'strong':'standard'}
function careerLine(c){return `${n(c.seasons)} seasons • ${n(c.apps)} apps • ${n(c.goals)}G ${n(c.assists)}A`}
function modeCard(mode,data){
  const m=MODE_META[mode],best=data.best;
  return `<article class="flModeRecord flMode-${mode}"><div class="flModeRecordTop"><span class="flModeIcon">${m.icon}</span><div><small>${esc(m.label)}</small><strong>${data.count?`${n(best?.score)}/100`:'—'}</strong></div></div><div class="flModeRecordMeta"><span><b>${data.count}</b> completed</span><span><b>${data.count?data.avg:'—'}</b> avg score</span></div>${best?`<div class="flModeBest"><span>Best career</span><b>${esc(best.playerName)}</b><small>${careerLine(best)}</small></div>`:`<div class="flModeEmpty">Complete a ${esc(m.label)} career to set your first record.</div>`}<a href="${m.href}">Play ${esc(m.label)} →</a></article>`;
}
function recordTile(icon,label,c,value,suffix=''){
  return `<div class="flRecordTile"><span>${icon}</span><div><small>${label}</small><b>${value==null?'—':esc(value)}${value==null?'':suffix}</b>${c?`<em>${esc(c.playerName)} • ${esc(modeInfo(c.mode).label)}</em>`:''}</div></div>`;
}
function recentRow(c){
  return `<div class="flRecentCareer"><div class="flRecentMode">${modeInfo(c.mode).icon}</div><div class="flRecentMain"><b>${esc(c.playerName)}</b><span>${esc(modeInfo(c.mode).label)} • ${esc(c.finalClub||c.startClub||'Career complete')}</span><small>${careerLine(c)} • ${formatDate(c.completedAt)}</small></div><div class="flRecentScore ${scoreClass(c.score)}">${n(c.score)}<small>/100</small></div></div>`;
}
function archiveMarkup(){
  const s=summary();
  if(!s.count){
    return `<div class="flRecordsHero"><div><div class="flArchiveEyebrow">YOUR CAREERS • THIS DEVICE</div><h2>Legacy Records</h2><p>Your completed careers will build a permanent local record here.</p></div><div class="flLocalPill">● Saved on this device</div></div><div class="flArchiveEmpty"><div class="flArchiveEmptyIcon">🏆</div><h3>Your record book starts with your next retirement.</h3><p>Finish a Quick Story, Career Express or Original Career and Football Legacy will automatically save the final score and career statistics here. Existing completed saves still on this device are imported automatically.</p><button type="button" data-fl-go-play>Choose a mode</button></div>`;
  }
  const best=s.best;
  return `<div class="flRecordsHero"><div><div class="flArchiveEyebrow">YOUR CAREERS • THIS DEVICE</div><h2>Legacy Records</h2><p>Every completed career, one record book. Compare modes, chase personal bests and watch your history grow.</p></div><div class="flLocalPill">● Saved on this device</div></div>
  <div class="flSummaryStrip"><div><small>CAREERS</small><b>${s.count}</b></div><div><small>BEST SCORE</small><b>${best.score}<em>/100</em></b></div><div><small>HIGHEST OVR</small><b>${n(s.highestOvr?.peakOvr)}</b></div><div><small>TROPHIES</small><b>${s.totalTrophies}</b></div></div>
  <div class="flModeRecords">${modeCard('quick',s.modes.quick)}${modeCard('express',s.modes.express)}${modeCard('original',s.modes.original)}</div>
  <div class="flArchiveGrid">
    <section class="flArchivePanel flBestCareer"><div class="flPanelTitle"><div><small>PERSONAL BEST</small><h3>Your greatest career</h3></div><span>${modeInfo(best.mode).icon} ${esc(modeInfo(best.mode).label)}</span></div><div class="flBestBody"><div class="flBestScore ${scoreClass(best.score)}"><strong>${best.score}</strong><small>OUT OF 100</small></div><div class="flBestInfo"><h4>${esc(best.playerName)}</h4><p>${esc(best.position||'Player')} • ${esc(best.finalClub||best.startClub||'Career complete')}</p><div class="flBestStats"><span><b>${best.peakOvr}</b> Peak OVR</span><span><b>${best.seasons}</b> Seasons</span><span><b>${best.goals+best.assists}</b> G+A</span><span><b>${best.trophies}</b> Trophies</span></div></div></div></section>
    <section class="flArchivePanel"><div class="flPanelTitle"><div><small>ALL CAREERS</small><h3>Career totals</h3></div></div><div class="flTotalsGrid"><div><b>${s.totalSeasons}</b><small>Seasons</small></div><div><b>${s.totalApps}</b><small>Apps</small></div><div><b>${s.totalGoals}</b><small>Goals</small></div><div><b>${s.totalAssists}</b><small>Assists</small></div><div><b>${s.totalTrophies}</b><small>Trophies</small></div><div><b>${s.totalAwards}</b><small>Awards</small></div></div></section>
  </div>
  <section class="flArchivePanel"><div class="flPanelTitle"><div><small>PERSONAL RECORDS</small><h3>The numbers to beat</h3></div></div><div class="flRecordTiles">${recordTile('📈','Highest OVR',s.highestOvr,s.highestOvr?.peakOvr)}${recordTile('⚽','Most goals',s.mostGoals,s.mostGoals?.goals)}${recordTile('🎯','Most assists',s.mostAssists,s.mostAssists?.assists)}${recordTile('🏆','Most trophies',s.mostTrophies,s.mostTrophies?.trophies)}${recordTile('🗓️','Longest career',s.longest,s.longest?.seasons,' seasons')}${recordTile('🏟️','Favourite club',null,s.favouriteClub?.[0]||null)}</div></section>
  <section class="flArchivePanel"><div class="flPanelTitle"><div><small>RECENT HISTORY</small><h3>Your latest careers</h3></div><span>${s.count} total</span></div><div class="flRecentList">${s.careers.slice(0,6).map(recentRow).join('')}</div></section>`;
}

function initHome(){
  const home=document.getElementById('siteHome');if(!home||document.getElementById('flHomeTabs'))return;
  const hero=home.querySelector('.hero'),modeIntro=document.getElementById('modeIntro'),how=document.getElementById('how-it-works'),modes=document.getElementById('modes');if(!hero||!modes)return;
  const tabs=document.createElement('nav');tabs.className='flHomeTabs';tabs.id='flHomeTabs';tabs.setAttribute('aria-label','Football Legacy home');tabs.innerHTML='<button class="active" type="button" data-fl-home-tab="play" aria-selected="true">Play</button><button type="button" data-fl-home-tab="records" aria-selected="false"><span>Legacy Records</span><i id="flRecordCount"></i></button>';
  home.insertBefore(tabs,hero);
  const records=document.createElement('section');records.id='flLegacyRecords';records.className='flLegacyRecords';records.hidden=true;hero.insertAdjacentElement('afterend',records);
  const review=document.getElementById('reviews-feedback');
  const playSections=[hero,modeIntro,how,modes,review].filter(Boolean);
  function renderRecords(){migrateSavedCareers();records.innerHTML=archiveMarkup();const cnt=summary().count,el=document.getElementById('flRecordCount');if(el)el.textContent=cnt?String(cnt):'';records.querySelectorAll('[data-fl-go-play]').forEach(b=>b.onclick=()=>setTab('play'))}
  function setTab(which){
    const showRecords=which==='records';
    tabs.querySelectorAll('button').forEach(b=>{const on=b.dataset.flHomeTab===which;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});
    playSections.forEach(el=>{if(el)el.hidden=showRecords});records.hidden=!showRecords;
    if(showRecords){renderRecords();records.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}
    else window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-fl-home-tab]');if(b)setTab(b.dataset.flHomeTab)});
  renderRecords();records.hidden=true;
  window.addEventListener('fl-history-updated',()=>{renderRecords()});
}

window.FLHistory={key:STORAGE_KEY,read,summary,recordQuick,recordV3,migrateSavedCareers,renderArchive:archiveMarkup};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{migrateSavedCareers();initHome()},{once:true});
else{migrateSavedCareers();initHome()}
})();
