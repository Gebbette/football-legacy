/* Football Legacy: presentation only. No career state, RNG, storage or network writes. */
(function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assetBase = new URL('./', document.currentScript.src).href;
  const scenes = {
    premier: {asset:'premier-league',category:'LEAGUE CHAMPIONS',opening:['Every match.','Every point.','All yours.'],headline:['Champions.'],note:'The title belongs to you.',label:'Premier League',duration:6400},
    league: {asset:'cup',category:'LEAGUE CHAMPIONS',opening:['A season of belief.','A place in history.'],headline:['Champions.'],note:'The title belongs to you.',duration:6100},
    europe: {asset:'champions-league',category:'EUROPEAN CHAMPIONS',opening:['Under the lights.','Above them all.'],headline:['Europe.','Conquered.'],note:'Your name. Among the greats.',duration:6900},
    world: {asset:'world-cup',category:'WORLD CHAMPIONS',opening:['For the shirt.','For the nation.','For history.'],headline:['On top of','the world.'],note:'A moment for an entire nation.',label:'World Cup',duration:7200},
    ballon: {asset:'ballon-dor',category:'THE HIGHEST INDIVIDUAL HONOUR',opening:['An extraordinary season.','One extraordinary player.'],headline:['Ballon','d’Or'],note:'Football’s greatest individual distinction.',label:'Ballon d’Or',duration:7400},
    global: {asset:'global',category:'THE WORLD’S BEST',opening:['The game has spoken.','The world has chosen.'],headline:['The Best.'],note:'An exceptional season. A global honour.',duration:6700},
    cup: {asset:'cup',category:'CUP WINNERS',opening:['The final whistle.','The lasting memory.'],headline:['Glory','is yours.'],note:'Another chapter written in silver.',duration:5800},
    award: {asset:'award',category:'INDIVIDUAL HONOUR',opening:['An outstanding season.','An enduring achievement.'],headline:['A season','apart.'],note:'Excellence, recognised.',duration:5600}
  };
  function sceneFor(name, type) {
    if (type === 'award') return /ballon d['’]or/i.test(name) ? 'ballon' : /the best fifa/i.test(name) ? 'global' : 'award';
    if (/world cup/i.test(name)) return 'world';
    if (/champions league/i.test(name)) return 'europe';
    if (/premier league/i.test(name)) return 'premier';
    if (/la liga|bundesliga|serie a|ligue 1|eredivisie|primeira|league title/i.test(name)) return 'league';
    return 'cup';
  }
  function html({season = {}, player = {}, items = [], type = 'trophy', buttonId = 'flCinemaContinue', buttonLabel = 'Continue', tier = 3}) {
    if (!items.length) return '';
    const name = String(items[0]), scene = sceneFor(name, type), config = scenes[scene];
    const winner = player.name || 'Your player';
    const affiliation = scene === 'world' ? (player.nationality || season.club) : season.club;
    const title = config.label || name;
    const extras = items.slice(1);
    return `<section class="flCinema" data-scene="${scene}" data-tier="${tier}" data-duration="${config.duration}" role="dialog" aria-modal="true" aria-label="${escape(title)} — ${escape(winner)}" tabindex="-1">
      <div class="flCinemaAtmosphere" aria-hidden="true"><div class="flCinemaWash"></div><div class="flCinemaHorizon"></div><div class="flCinemaLines"><i></i><i></i><i></i><i></i><i></i></div><div class="flCinemaOrbit"><i></i><i></i><i></i></div><div class="flCinemaStandard flCinemaStandardLeft"></div><div class="flCinemaStandard flCinemaStandardRight"></div></div>
      <header class="flCinemaHeader"><span class="flCinemaBrand">FL<span>/</span> <b>FOOTBALL LEGACY</b></span><span class="flCinemaEdition">${escape(season.label || 'CAREER HONOURS')}</span></header>
      <div class="flCinemaIntro" aria-hidden="true"><span class="flCinemaIntroOverline">${escape(title)}</span>${config.opening.map(line => `<span class="flCinemaIntroLine">${escape(line)}</span>`).join('')}<i></i></div>
      <div class="flCinemaComposition">
        <div class="flCinemaArt" aria-hidden="true"><div class="flCinemaArtRule"></div><div class="flCinemaTrophyWrap"><img class="flCinemaTrophy" src="${assetBase}${config.asset}.svg" alt="" width="400" height="440" decoding="sync" loading="eager"></div><div class="flCinemaArtCaption">${escape(config.category)}</div></div>
        <div class="flCinemaCopy"><div class="flCinemaCompetition">${escape(title)}</div><h2 class="flCinemaTitle">${config.headline.map(line => `<span>${escape(line)}</span>`).join('')}</h2><p class="flCinemaNote">${escape(config.note)}</p><div class="flCinemaWinner"><span>${type === 'award' ? 'AWARDED TO' : 'A PLACE IN HISTORY FOR'}</span><strong>${escape(winner)}</strong><div>${escape(affiliation || '')}</div></div>${extras.length ? `<div class="flCinemaExtras">${extras.map(item => `<span>${escape(item)}</span>`).join('')}</div>` : ''}</div>
      </div>
      <footer class="flCinemaFooter"><div class="flCinemaMemento"><i></i><span>YOUR LEGACY, FOREVER.</span></div><button class="primary flCinemaContinue" id="${escape(buttonId)}" disabled>${escape(buttonLabel)} <span aria-hidden="true">→</span></button></footer>
      <button type="button" class="flCinemaSkip" aria-label="Skip animation and show honour">Skip animation <span aria-hidden="true">↗</span></button>
      <div class="flCinemaProgress" aria-hidden="true"><i></i></div>
    </section>`;
  }

  // A controller belongs to one mounted ceremony. Removing it cancels all work;
  // the host keeps ownership of Continue and multiplayer capture listeners.
  const active = new Map();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function mount(root) {
    if (active.has(root)) return;
    const animations = [], duration = Number(root.dataset.duration), button = root.querySelector('.flCinemaContinue');
    const skip = root.querySelector('.flCinemaSkip'), previousFocus = document.activeElement;
    let finished = false, timer;
    const animate = (selector, frames, options) => {
      root.querySelectorAll(selector).forEach((el, i) => {
        animations.push(el.animate(frames, {fill:'both',easing:'cubic-bezier(.2,.7,.2,1)',...options,delay:(options.delay || 0) + i * (options.stagger || 0)}));
      });
    };
    const finish = (focus = true) => {
      if (finished) return;
      const moveFocus = focus && document.activeElement === skip;
      finished = true; clearTimeout(timer);
      animations.forEach(animation => animation.cancel());
      root.classList.add('is-settled');
      button.disabled = false;
      skip.hidden = true;
      if (moveFocus) button.focus({preventScroll:true});
    };
    const keydown = event => {
      if (event.key === 'Escape' && !finished) { event.preventDefault(); finish(); }
      if (event.key === 'Tab') {
        const controls = [skip,button].filter(el => !el.hidden && !el.disabled);
        if (controls.length) {event.preventDefault(); controls[0].focus({preventScroll:true});}
      }
    };
    const mediaChange = event => {if (event.matches) finish();};
    const controller = {finish,dispose() {
      clearTimeout(timer); animations.forEach(animation => animation.cancel());
      reducedMotion.removeEventListener('change', mediaChange);
      root.removeEventListener('keydown', keydown);
      if ((!document.activeElement || document.activeElement === document.body) && previousFocus?.isConnected && !previousFocus.closest('.flCinema')) previousFocus.focus({preventScroll:true});
    }};
    active.set(root,controller);
    root.dataset.mounted = 'true';
    root.addEventListener('keydown',keydown);
    skip.addEventListener('click',() => finish());
    reducedMotion.addEventListener('change',mediaChange);
    if (reducedMotion.matches) {finish(false); root.focus({preventScroll:true}); return;}
    root.focus({preventScroll:true});
    const scene = root.dataset.scene;
    const reveal = scene === 'world' ? 3100 : scene === 'premier' || scene === 'ballon' ? 3000 : 2700;
    animate('.flCinemaIntroOverline',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:500,delay:100});
    animate('.flCinemaIntroLine',[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],{duration:850,delay:250,stagger:350});
    animate('.flCinemaIntro > i',[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:1000,delay:500});
    animate('.flCinemaIntro',[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-18px)'}],{duration:650,delay:reveal-650});
    animate('.flCinemaWash',[{opacity:0,transform:'scale(.75)'},{opacity:1,transform:'scale(1)'}],{duration:2300,delay:reveal-400});
    animate('.flCinemaHorizon',[{opacity:0,transform:'scaleX(.25)'},{opacity:1,transform:'scaleX(1)'}],{duration:1600,delay:reveal+200});
    animate('.flCinemaStandardLeft',[{opacity:0,transform:'translateY(-105%)'},{opacity:1,transform:'none'}],{duration:1800,delay:reveal-300});
    animate('.flCinemaStandardRight',[{opacity:0,transform:'translateY(-105%)'},{opacity:1,transform:'none'}],{duration:1800,delay:reveal-100});
    animate('.flCinemaLines i',[{opacity:0,transform:'scaleY(.05)'},{opacity:1,transform:'scaleY(1)'}],{duration:1900,delay:reveal-350,stagger:110});
    animate('.flCinemaOrbit',[{opacity:0,transform:'rotate(-25deg) scale(.6)'},{opacity:1,transform:'rotate(0deg) scale(1)'}],{duration:2400,delay:reveal-300});
    const trophyStart = scene === 'europe' ? 'translateY(62px) scale(.78)' : scene === 'ballon' ? 'translateY(18px) scale(.88) rotate(-9deg)' : scene === 'world' ? 'translateY(75px) scale(.84)' : 'translateY(55px) scale(.9)';
    animate('.flCinemaTrophyWrap',[{opacity:0,transform:trophyStart,filter:'brightness(.15)'},{opacity:1,transform:'translateY(-5px) scale(1.02)',filter:'brightness(1.25)',offset:.78},{opacity:1,transform:'none',filter:'brightness(1)'}],{duration:2100,delay:reveal-160});
    animate('.flCinemaArtRule, .flCinemaArtCaption',[{opacity:0},{opacity:1}],{duration:800,delay:reveal+1500});
    animate('.flCinemaCompetition',[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:600,delay:reveal+600});
    animate('.flCinemaTitle span',[{opacity:0,transform:'translateY(35px)',filter:'blur(5px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:1000,delay:reveal+850,stagger:140});
    animate('.flCinemaNote',[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:700,delay:reveal+1500});
    animate('.flCinemaWinner, .flCinemaExtras',[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:850,delay:reveal+1850});
    animate('.flCinemaMemento',[{opacity:0},{opacity:1}],{duration:650,delay:duration-950});
    animate('.flCinemaContinue',[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:500,delay:duration-500});
    animate('.flCinemaProgress i',[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration,easing:'linear'});
    timer = setTimeout(finish,duration);
  }
  function sync() {
    for (const [root, controller] of active) if (!root.isConnected || root.closest('.hidden') || root.closest('#flash:not(.show)')) {controller.dispose(); active.delete(root);}
    document.querySelectorAll('.flCinema:not([data-mounted])').forEach(root => {if (!root.closest('.hidden') && !root.closest('#flash:not(.show)')) mount(root);});
  }

  // Original / Express retain their existing flash-close semantics. A delayed
  // individual award joins a currently showing title ceremony instead of erasing it.
  const flashQueues = new WeakMap();
  function showFlash({title,body,state,card,host}) {
    let names = [], type = 'trophy';
    const season = / WINNERS$/i.test(title) ? {...state.season,club:state.player.club} : (state?.season?.reviewData?.season || state?.player?.seasons?.at(-1) || state?.season || {});
    if (/INDIVIDUAL AWARD WON/i.test(title)) {
      type = 'award';
      const fragment = document.createElement('div'); fragment.innerHTML = body;
      names = (fragment.querySelector('.flAwardCelebration b')?.textContent || '').split(' • ').filter(Boolean);
    } else if (/ WINNERS$/i.test(title)) names = [title.replace(/ WINNERS$/i,'')];
    else if (title === 'SEASON COMPLETE' && season.position === 1) names = [season.league];
    if (!names.length) return false;
    const entries = names.map(name => ({name,type,season:{...season,club:season.club || state.player.club},player:{name:state.player.name,nationality:state.player.nationality}}));
    const current = flashQueues.get(card);
    if (current && host.classList.contains('show') && card.querySelector('.flCinema')) {current.push(...entries); return true;}
    const queue = entries; flashQueues.set(card,queue);
    const next = () => {
      const item = queue.shift();
      if (!item) {host.classList.remove('show'); flashQueues.delete(card); return;}
      card.className = 'flashCard flCinemaFlash';
      card.innerHTML = html({season:item.season,player:item.player,items:[item.name],type:item.type,buttonId:'flashClose',buttonLabel:'Continue'});
      host.classList.add('show');
      card.querySelector('#flashClose').onclick = next;
    };
    next(); return true;
  }
  window.FLCinema = Object.freeze({html,sceneFor,showFlash,finish:root => active.get(root)?.finish()});
  new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();
})();
