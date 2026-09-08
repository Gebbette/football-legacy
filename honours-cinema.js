/* Football Legacy honours cinema v104 — presentation only. No career state, RNG, storage or network writes. */
(function () {
  'use strict';

  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assetBase = new URL('./', document.currentScript.src).href;

  // Shared multiplayer Ballon d'Or audio is synthesized locally with Web Audio.
  // The context is primed from the review-ready click so mobile browsers permit later playback.
  let sharedAudioContext = null;
  function primeAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      sharedAudioContext ||= new AudioCtx();
      if (sharedAudioContext.state === 'suspended') sharedAudioContext.resume().catch(()=>{});
      return true;
    } catch (_) { return false; }
  }
  function playSharedBallonDrumRoll(revealDelayMs) {
    try {
      if (!primeAudio() || sharedAudioContext.state !== 'running') return () => {};
      const ctx = sharedAudioContext, out = ctx.createGain();
      out.gain.value = .0001; out.connect(ctx.destination);
      const now = ctx.currentTime + .05;
      const revealAt = now + Math.max(3.2, revealDelayMs / 1000);
      out.gain.setValueAtTime(.0001, now);
      out.gain.exponentialRampToValueAtTime(.18, now + .35);
      out.gain.linearRampToValueAtTime(.32, revealAt - .18);
      out.gain.exponentialRampToValueAtTime(.0001, revealAt + .95);
      const makeHit = (time, strength, duration=.055) => {
        const frames=Math.max(1,Math.floor(ctx.sampleRate*duration));
        const buffer=ctx.createBuffer(1,frames,ctx.sampleRate), data=buffer.getChannelData(0);
        for(let i=0;i<frames;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/frames,1.7);
        const src=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), gain=ctx.createGain();
        src.buffer=buffer; filter.type='bandpass'; filter.frequency.value=1550; filter.Q.value=.75; gain.gain.value=strength;
        src.connect(filter); filter.connect(gain); gain.connect(out); src.start(time);
      };
      let t=now+.4, step=.2, n=0;
      while(t<revealAt-.18){
        const progress=(t-now)/(revealAt-now);
        makeHit(t,.18+progress*.47,.05);
        if(n%2===1) makeHit(t+.025,.08+progress*.22,.035);
        step=Math.max(.063,.2-progress*.14); t+=step; n++;
      }
      const pulse=(time,gainValue=.12)=>{
        const osc=ctx.createOscillator(), g=ctx.createGain();
        osc.type='sine'; osc.frequency.setValueAtTime(94,time); osc.frequency.exponentialRampToValueAtTime(48,time+.24);
        g.gain.setValueAtTime(.0001,time); g.gain.exponentialRampToValueAtTime(gainValue,time+.018); g.gain.exponentialRampToValueAtTime(.0001,time+.3);
        osc.connect(g); g.connect(out); osc.start(time); osc.stop(time+.31);
      };
      pulse(now+1.55,.10); pulse(now+2.65,.12); pulse(now+3.75,.15);
      pulse(revealAt,.34);
      const frames=Math.floor(ctx.sampleRate*.9), buffer=ctx.createBuffer(1,frames,ctx.sampleRate), data=buffer.getChannelData(0);
      for(let i=0;i<frames;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/frames,2.2);
      const crash=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), cg=ctx.createGain();
      crash.buffer=buffer; hp.type='highpass'; hp.frequency.value=3200; cg.gain.setValueAtTime(.22,revealAt); cg.gain.exponentialRampToValueAtTime(.0001,revealAt+.86);
      crash.connect(hp); hp.connect(cg); cg.connect(out); crash.start(revealAt);
      return () => { try { out.disconnect(); } catch (_) {} };
    } catch (_) { return () => {}; }
  }

  const scenes = {
    ballon:      {asset:'ballon-dor',       category:'THE HIGHEST INDIVIDUAL HONOUR', opening:[], headline:['Ballon','d’Or'],          note:'Football’s greatest individual distinction.', label:'Ballon d’Or', duration:8200, intro:'envelope', prestige:7, figure:true},
    world:       {asset:'world-cup',         category:'WORLD CHAMPIONS',               opening:['For the shirt.','For the nation.','For history.'], headline:['On top of','the world.'], note:'A moment for an entire nation.', label:'World Cup', duration:7900, prestige:7},
    euros:       {asset:'euros',             category:'CHAMPIONS OF EUROPE',           opening:['A continent watching.','One nation standing.'], headline:['Kings of','Europe.'], note:'European champions. A summer that lasts forever.', label:'European Championship', duration:7600, prestige:6},
    europe:      {asset:'champions-league',  category:'EUROPEAN CHAMPIONS',            opening:['Under the lights.','Above them all.'], headline:['Europe.','Conquered.'], note:'Your name. Among the greats.', label:'Champions League', duration:7500, prestige:6},
    premier:     {asset:'premier-league',    category:'LEAGUE CHAMPIONS',              opening:['Every match.','Every point.','All yours.'], headline:['Champions.'], note:'The title belongs to you.', label:'Premier League', duration:6500, prestige:5},
    global:      {asset:'global',            category:'THE WORLD’S BEST',              opening:[], headline:['The Best.'],            note:'An exceptional season. A global honour.', duration:7100, intro:'envelope', prestige:5, figure:true},
    goldenboot:  {asset:'golden-boot', assetExt:'png',      category:'SCORING HONOUR',                opening:[], headline:['Golden','Boot'],         note:'The season’s most feared finisher.', duration:5400, intro:'direct', prestige:5},
    goldenglove: {asset:'goalkeeper-glove', assetExt:'png',  category:'GOALKEEPING HONOUR',            opening:[], headline:['Golden','Glove'],        note:'Goalkeeping excellence, recognised.', duration:5200, intro:'direct', prestige:4},
    youth:       {asset:'award',             category:'YOUNG PLAYER HONOUR',           opening:[], headline:['The future.','Now.'],    note:'A breakthrough season recognised.', duration:5700, intro:'envelope-fast', prestige:4},
    playeraward: {asset:'award',             category:'INDIVIDUAL HONOUR',             opening:[], headline:['A season','apart.'],     note:'Excellence across an entire campaign.', duration:5900, intro:'envelope-fast', prestige:4},
    worldxi:     {asset:null,                category:'ELITE XI SELECTION',            opening:['Among the elite.','Your place is earned.'], headline:['Selected.'], note:'Your place among the season’s best.', duration:5600, prestige:4, selection:true},
    continental: {asset:'cup',               category:'CONTINENTAL HONOUR',            opening:['A European campaign.','A lasting reward.'], headline:['Continental','glory.'], note:'A continental chapter written.', duration:4900, prestige:3},
    international:{asset:'cup',              category:'INTERNATIONAL HONOUR',          opening:['For the nation.','For the moment.'], headline:['International','glory.'], note:'A national-team honour secured.', duration:5000, prestige:3},
    league:      {asset:'cup',               category:'LEAGUE CHAMPIONS',              opening:['A season of belief.','A place in history.'], headline:['Champions.'], note:'The title belongs to you.', duration:4700, prestige:3},
    cup:         {asset:'cup',               category:'CUP WINNERS',                   opening:['The final whistle.','The lasting memory.'], headline:['Glory','is yours.'], note:'Another chapter written in silver.', duration:4200, prestige:2},
    award:       {asset:'award',             category:'INDIVIDUAL HONOUR',             opening:['An outstanding season.'], headline:['Recognised.'], note:'Excellence, recognised.', duration:3900, prestige:1}
  };

  function sceneFor(name, type) {
    const n = String(name || '');
    if (type === 'award') {
      if (/ballon d['’]or/i.test(n)) return 'ballon';
      if (/the best fifa|world player(?: of the year)?/i.test(n)) return 'global';
      if (/golden boot|golden shoe|european golden shoe|top scorer|gerd m[uü]ller/i.test(n)) return 'goldenboot';
      if (/golden glove|yashin|goalkeeper of the (?:year|season)|best goalkeeper/i.test(n)) return 'goldenglove';
      if (/golden boy|young player|kopa/i.test(n)) return 'youth';
      if (/world xi|world 11|team of the (?:season|year)|toty|tots/i.test(n)) return 'worldxi';
      if (/player of the (?:season|year)|players[’']? player|supporters[’']? player|footballer of the year|mvp|defender of the|midfielder of the|playmaker/i.test(n)) return 'playeraward';
      return 'award';
    }
    if (/world cup/i.test(n)) return 'world';
    if (/european championship|uefa euro|euros\b/i.test(n)) return 'euros';
    if (/champions league/i.test(n)) return 'europe';
    if (/premier league/i.test(n)) return 'premier';
    if (/europa league|conference league|uefa cup|copa libertadores|copa sudamericana|afc champions|caf champions/i.test(n)) return 'continental';
    if (/copa am[eé]rica|afcon|africa cup of nations|asian cup|nations league|gold cup/i.test(n)) return 'international';
    if (/la liga|bundesliga|serie a|ligue 1|eredivisie|primeira|premiership|super lig|superliga|league title|liga mx|mls/i.test(n)) return 'league';
    return 'cup';
  }

  function headlineFor(scene, name) {
    if (scene === 'goldenboot' && /shoe/i.test(name)) return ['Golden','Shoe'];
    if (scene === 'goldenglove' && /yashin/i.test(name)) return ['Goalkeeping','excellence.'];
    return scenes[scene].headline;
  }

  function envelopeMarkup(winner, title, fast) {
    return `<div class="flCinemaAnnouncement ${fast ? 'is-fast' : ''}" aria-hidden="true">
      <div class="flCinemaEnvelope">
        <div class="flCinemaEnvelopeBack"></div>
        <div class="flCinemaEnvelopeCard"><span>FOOTBALL LEGACY</span><strong>${escape(winner)}</strong><small>${escape(title)}</small></div>
        <div class="flCinemaEnvelopeFront"></div>
        <div class="flCinemaEnvelopeFlap"></div>
        <i class="flCinemaSeal">FL</i>
      </div>
    </div>`;
  }

  function sharedBallonPreludeMarkup(finalists = []) {
    const names = (Array.isArray(finalists) ? finalists : []).map(x => typeof x === 'string' ? x : x?.careerName || x?.name).filter(Boolean).slice(0,3);
    return `<div class="flCinemaBallonPrelude" aria-hidden="true">
      <div class="flCinemaBallonVote"><span>THE FINAL VOTE IS IN</span><strong>One name will leave with football’s greatest individual prize.</strong></div>
      ${names.length ? `<div class="flCinemaBallonFinalists"><small>FINAL CONTENDERS</small>${names.map((n,i)=>`<div class="flCinemaBallonFinalist" style="--fi:${i}"><i>${escape(n).split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}</i><b>${escape(n)}</b></div>`).join('')}</div>` : ''}
      <div class="flCinemaBallonSealLine"><i></i><span>THE ENVELOPE IS SEALED</span><i></i></div>
    </div>
    <div class="flCinemaSharedImpact" aria-hidden="true"><i></i><i></i><i></i></div>`;
  }

  function selectionMarkup(winner, position) {
    return `<div class="flCinemaSelection" aria-hidden="true">
      <div class="flCinemaPitch">
        <i class="flPitchHalf"></i><i class="flPitchCircle"></i><i class="flPitchBox flPitchBoxTop"></i><i class="flPitchBox flPitchBoxBottom"></i>
      </div>
      <div class="flCinemaSelectionCard"><span>${escape(position || 'XI')}</span><strong>${escape(winner)}</strong><small>ELITE XI</small></div>
      <div class="flCinemaSelectionPulse"></div>
    </div>`;
  }

  function stageMarkup(assetUrl, figure) {
    return `<div class="flCinemaStageFx" aria-hidden="true">
      <div class="flCinemaStageGlow"></div>
      <div class="flCinemaSpotlights"><i></i><i></i><i></i></div>
      <div class="flCinemaPedestal"><i></i></div>
      <div class="flCinemaCameraFlashes"><i></i><i></i><i></i><i></i></div>
      <div class="flCinemaParticles"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      ${assetUrl ? `<span class="flCinemaTrophyGleam" style="--fl-trophy-mask:url('${assetUrl}')"></span>` : ''}
      ${figure ? `<div class="flCinemaPlayerFigure"><svg class="flFigureEditorial" viewBox="0 0 260 360" aria-label="Clean illustration of the award winner in formalwear at the ceremony"><ellipse class="flDrawShadow" cx="132" cy="345" rx="80" ry="8"/><path class="flDrawLegBack" d="M108 202h31l-18 132H94l14-132Z"/><path class="flDrawLegFront" d="M137 201h30l16 133h-27l-19-133Z"/><path class="flDrawShoe" d="M92 331h31l6 10H84c1-5 3-8 8-10Zm62 0h30l10 10h-45c0-4 2-8 5-10Z"/><path class="flDrawArmBack" d="M96 116c-18 18-31 39-42 64l19 9c12-23 25-40 42-56l-19-17Z"/><path class="flDrawHand" d="M55 179c-5 2-7 6-5 10 3 4 8 5 13 3l10-5-7-12-11 4Z"/><path class="flDrawJacket" d="M97 103c12-8 27-12 43-11 18 1 34 7 44 18l-4 87c-18 9-38 13-60 12-18-1-34-5-47-12l11-67 13-27Z"/><path class="flDrawShirt" d="M119 101h31l12 100h-59l16-100Z"/><path class="flDrawLapel" d="m119 102-24 16 23 63 17-43-16-36Zm32 1 22 17-28 61-12-43 18-35Z"/><path class="flDrawTie" d="m135 111 9 12-8 14 7 62h-17l7-62-7-14 9-12Z"/><path class="flDrawArmFront" d="M174 119c11 23 9 47-5 72-8 13-19 23-32 31l-11-16c13-9 22-19 27-30 8-17 9-32 4-46l17-11Z"/><path class="flDrawHand" d="M128 205c-5 3-7 7-4 11 3 4 8 5 13 2l8-6-8-10-9 3Z"/><path class="flDrawNeck" d="M127 82h23l-1 22c-6 5-15 6-22 1V82Z"/><path class="flDrawHead" d="M113 41c6-15 20-21 35-18 15 3 24 15 23 32-1 11-5 21-13 29-7 7-16 10-25 6-11-4-19-15-21-28-2-8-1-15 1-21Z"/><path class="flDrawEar" d="M114 55c-5 0-7 4-6 10 2 5 5 7 9 7l2-14-5-3Z"/><path class="flDrawHair" d="M112 52c1-20 13-33 32-33 14 0 24 6 31 17-11-1-21-5-29-13-8 9-19 14-34 17v12Z"/><path class="flDrawFaceLine" d="M127 53h6m15 3h6m-6 7 4 6-4 2m-11 10c5 1 9 0 13-2"/><path class="flDrawPocket" d="M89 164h20m50 5h17"/></svg></div>` : ''}
      <div class="flCinemaTunnel"><i></i><i></i><i></i><i></i><i></i></div>
    </div>`;
  }

  function html({season = {}, player = {}, items = [], type = 'trophy', buttonId = 'flCinemaContinue', buttonLabel = 'Continue', tier = 3, sharedBallon = false, sharedFinalists = []}) {
    if (!items.length) return '';
    const name = String(items[0]);
    const scene = sceneFor(name, type);
    const config = scenes[scene];
    const isSharedBallon = !!sharedBallon && scene === 'ballon';
    const winner = player.name || 'Your player';
    const affiliation = (scene === 'world' || scene === 'euros') ? (player.nationality || season.club) : season.club;
    const title = config.label || name;
    const extras = items.slice(1);
    const assetUrl = config.asset ? `${assetBase}${config.asset}.${config.assetExt || 'svg'}` : '';
    const headlines = headlineFor(scene, name);
    const intro = config.intro || 'lines';
    const art = config.selection
      ? selectionMarkup(winner, player.position)
      : `<div class="flCinemaTrophyWrap"><img class="flCinemaTrophy" src="${assetUrl}" alt="" width="400" height="440" decoding="sync" loading="eager"></div>`;

    return `<section class="flCinema" data-scene="${scene}" data-tier="${tier}" data-prestige="${config.prestige}" data-intro="${intro}" data-duration="${isSharedBallon ? 16000 : config.duration}" data-shared-ballon="${isSharedBallon ? 1 : 0}" role="dialog" aria-modal="true" aria-label="${escape(title)} — ${escape(winner)}" tabindex="-1">
      <div class="flCinemaAtmosphere" aria-hidden="true"><div class="flCinemaWash"></div><div class="flCinemaHorizon"></div><div class="flCinemaLines"><i></i><i></i><i></i><i></i><i></i></div><div class="flCinemaOrbit"><i></i><i></i><i></i></div><div class="flCinemaStandard flCinemaStandardLeft"></div><div class="flCinemaStandard flCinemaStandardRight"></div></div>
      <header class="flCinemaHeader"><a class="flCinemaBrand" href="index.html" aria-label="Football Legacy home">FL<span>/</span> <b>FOOTBALL LEGACY</b></a><span class="flCinemaEdition">${escape(season.label || 'CAREER HONOURS')}</span></header>
      ${isSharedBallon ? sharedBallonPreludeMarkup(sharedFinalists) : ''}
      ${intro.startsWith('envelope') ? envelopeMarkup(winner, title, intro === 'envelope-fast') : ''}
      <div class="flCinemaIntro" aria-hidden="true"><span class="flCinemaIntroOverline">${escape(title)}</span>${config.opening.map(line => `<span class="flCinemaIntroLine">${escape(line)}</span>`).join('')}<i></i></div>
      <div class="flCinemaComposition">
        <div class="flCinemaArt" aria-hidden="true">${stageMarkup(assetUrl, config.figure)}<div class="flCinemaArtRule"></div>${art}<div class="flCinemaArtCaption">${escape(config.category)}</div></div>
        <div class="flCinemaCopy"><div class="flCinemaCompetition">${escape(title)}</div><h2 class="flCinemaTitle">${headlines.map(line => `<span>${escape(line)}</span>`).join('')}</h2><p class="flCinemaNote">${escape(config.note)}</p><div class="flCinemaWinner"><span>${type === 'award' ? 'AWARDED TO' : 'A PLACE IN HISTORY FOR'}</span><strong>${escape(winner)}</strong><div>${escape(affiliation || '')}</div></div>${extras.length ? `<div class="flCinemaExtras">${extras.map(item => `<span>${escape(item)}</span>`).join('')}</div>` : ''}</div>
      </div>
      <footer class="flCinemaFooter"><div class="flCinemaMemento"><i></i><span>YOUR LEGACY, FOREVER.</span></div><button class="primary flCinemaContinue" id="${escape(buttonId)}" disabled>${escape(buttonLabel)} <span aria-hidden="true">→</span></button></footer>
      <button type="button" class="flCinemaSkip" aria-label="Skip animation and show honour">Skip animation <span aria-hidden="true">↗</span></button>
      <div class="flCinemaProgress" aria-hidden="true"><i></i></div>
    </section>`;
  }

  const active = new Map();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function mount(root) {
    if (active.has(root)) return;
    const animations = [];
    const duration = Number(root.dataset.duration) || 4500;
    const button = root.querySelector('.flCinemaContinue');
    const skip = root.querySelector('.flCinemaSkip');
    const previousFocus = document.activeElement;
    const sharedBallon = root.dataset.sharedBallon === '1' && root.dataset.scene === 'ballon';
    let finished = false, timer, audioStop = null;

    const animate = (selector, frames, options = {}) => {
      root.querySelectorAll(selector).forEach((el, i) => {
        const opts = {...options};
        const stagger = opts.stagger || 0;
        delete opts.stagger;
        animations.push(el.animate(frames, {fill:'both',easing:'cubic-bezier(.2,.7,.2,1)',...opts,delay:(opts.delay || 0) + i * stagger}));
      });
    };

    const finish = (focus = true) => {
      if (finished) return;
      const moveFocus = focus && document.activeElement === skip;
      finished = true;
      clearTimeout(timer);
      audioStop?.(); audioStop = null;
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
        if (controls.length) { event.preventDefault(); controls[0].focus({preventScroll:true}); }
      }
    };
    const mediaChange = event => { if (event.matches) finish(); };
    const controller = {finish,dispose() {
      clearTimeout(timer);
      audioStop?.(); audioStop = null;
      animations.forEach(animation => animation.cancel());
      reducedMotion.removeEventListener('change', mediaChange);
      root.removeEventListener('keydown', keydown);
      if ((!document.activeElement || document.activeElement === document.body) && previousFocus?.isConnected && !previousFocus.closest('.flCinema')) previousFocus.focus({preventScroll:true});
    }};

    active.set(root,controller);
    root.dataset.mounted = 'true';
    root.addEventListener('keydown',keydown);
    skip.addEventListener('click',() => finish());
    reducedMotion.addEventListener('change',mediaChange);
    if (reducedMotion.matches) {
      root.classList.add('is-reduced-motion');
      root.focus({preventScroll:true});
      const readableHold = sharedBallon ? 9000 : (intro.startsWith('envelope') ? (intro === 'envelope-fast' ? 2300 : 2900) : Math.max(2200, Math.min(4200, duration - 700)));
      timer = setTimeout(() => finish(false), readableHold);
      return;
    }
    root.focus({preventScroll:true});

    const scene = root.dataset.scene;
    const intro = root.dataset.intro;
    const prestige = Number(root.dataset.prestige) || 1;
    const reveal = sharedBallon ? 9800 : (({ballon:3150,world:3150,europe:2900,premier:2650,global:2850,goldenboot:650,goldenglove:650,youth:2350,playeraward:2400,worldxi:2050,continental:1900,international:1900,league:1800,cup:1550,award:1350})[scene] || 1800);

    // Individual-award announcement timing: readable hold, then a quick clean fade.
    if (intro.startsWith('envelope')) {
      const fast = intro === 'envelope-fast';
      if (sharedBallon) {
        // Signature multiplayer Ballon d'Or reveal: contenders first, then the sealed envelope.
        animate('.flCinemaBallonPrelude',[
          {opacity:0,transform:'translateY(12px)'},
          {opacity:1,transform:'none',offset:.12},
          {opacity:1,transform:'none',offset:.82},
          {opacity:0,transform:'translateY(-10px)'}
        ],{duration:3000,delay:150,easing:'cubic-bezier(.2,.72,.18,1)'});
        animate('.flCinemaBallonVote strong',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:650,delay:420});
        animate('.flCinemaBallonFinalist',[{opacity:0,transform:'translateY(14px) scale(.97)'},{opacity:1,transform:'none'}],{duration:520,delay:850,stagger:280});
        animate('.flCinemaBallonSealLine',[{opacity:0,transform:'scaleX(.65)'},{opacity:1,transform:'scaleX(1)'}],{duration:520,delay:1880});

        animate('.flCinemaAnnouncement',[
          {opacity:0,transform:'translateY(24px) scale(.97)'},
          {opacity:1,transform:'none',offset:.10},
          {opacity:1,transform:'none',offset:.965},
          {opacity:0,transform:'translateY(-12px) scale(.985)'}
        ],{duration:6500,delay:2800,easing:'cubic-bezier(.2,.72,.18,1)'});
        animate('.flCinemaEnvelope',[{opacity:0,transform:'translateY(36px) scale(.91)'},{opacity:1,transform:'translateY(0) scale(1.035)',offset:.74},{opacity:1,transform:'none'}],{duration:900,delay:3000});
        animate('.flCinemaEnvelopeFlap',[{transform:'rotateX(0deg)'},{transform:'rotateX(-178deg)'}],{duration:900,delay:4100,easing:'cubic-bezier(.3,.05,.2,1)'});
        animate('.flCinemaSeal',[{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.16)',offset:.55},{opacity:0,transform:'translate(-50%,-50%) scale(.75)'}],{duration:430,delay:4040});
        animate('.flCinemaEnvelopeCard',[
          {transform:'translateY(82px) scale(.98)',opacity:0},
          {transform:'translateY(82px) scale(.98)',opacity:1,offset:.12},
          {transform:'translateY(-60px) scale(1.04)',opacity:1,offset:.48},
          {transform:'translateY(-60px) scale(1.04)',opacity:1}
        ],{duration:1900,delay:4750,easing:'cubic-bezier(.14,.82,.18,1)'});
        animate('.flCinemaEnvelopeCard strong',[{filter:'brightness(.92)'},{filter:'brightness(1.15)',offset:.55},{filter:'brightness(1)'}],{duration:3200,delay:6100,easing:'ease-in-out'});
        animate('.flCinemaSharedImpact i',[{opacity:0,transform:'scale(.25)'},{opacity:1,transform:'scale(1)',offset:.22},{opacity:0,transform:'scale(1.55)'}],{duration:760,delay:reveal-80,stagger:70,easing:'ease-out'});
        audioStop = playSharedBallonDrumRoll(reveal - 180);
      } else {
        const total = fast ? 2180 : 2600;
        const flapDelay = fast ? 500 : 610;
        const cardDelay = fast ? 730 : 850;
        animate('.flCinemaAnnouncement',[
          {opacity:0},
          {opacity:1,offset:.10},
          {opacity:1,offset:.90},
          {opacity:0}
        ],{duration:total,delay:90,easing:'cubic-bezier(.2,.72,.18,1)'});
        animate('.flCinemaEnvelope',[{opacity:0,transform:'translateY(24px) scale(.95)'},{opacity:1,transform:'none'}],{duration:fast?430:520,delay:130});
        animate('.flCinemaEnvelopeFlap',[{transform:'rotateX(0deg)'},{transform:'rotateX(-178deg)'}],{duration:fast?520:600,delay:flapDelay,easing:'cubic-bezier(.3,.05,.2,1)'});
        animate('.flCinemaSeal',[{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(.72)'}],{duration:230,delay:flapDelay});
        animate('.flCinemaEnvelopeCard',[
          {transform:'translateY(76px)',opacity:0},
          {transform:'translateY(76px)',opacity:1,offset:.12},
          {transform:'translateY(-48px)',opacity:1,offset:.50},
          {transform:'translateY(-48px)',opacity:1}
        ],{duration:fast?1120:1300,delay:cardDelay,easing:'cubic-bezier(.16,.8,.2,1)'});
      }
    } else if (intro === 'direct') {
      // Known statistical awards (Golden Boot/Glove) go directly to the award itself.
      root.querySelector('.flCinemaIntro')?.setAttribute('hidden','');
    } else {
      animate('.flCinemaIntroOverline',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:420,delay:100});
      animate('.flCinemaIntroLine',[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'none'}],{duration:700,delay:220,stagger:260});
      animate('.flCinemaIntro > i',[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:780,delay:420});
      animate('.flCinemaIntro',[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-14px)'}],{duration:520,delay:Math.max(700,reveal-500)});
    }

    // Atmosphere builds before the object enters, never changing the approved final layout.
    animate('.flCinemaWash',[{opacity:0,transform:'scale(.82)'},{opacity:1,transform:'scale(1)'}],{duration:1500,delay:Math.max(200,reveal-450)});
    animate('.flCinemaHorizon',[{opacity:0,transform:'scaleX(.35)'},{opacity:1,transform:'scaleX(1)'}],{duration:1100,delay:reveal+80});
    animate('.flCinemaStandardLeft',[{opacity:0,transform:'translateY(-100%)'},{opacity:1,transform:'none'}],{duration:1200,delay:reveal-250});
    animate('.flCinemaStandardRight',[{opacity:0,transform:'translateY(-100%)'},{opacity:1,transform:'none'}],{duration:1200,delay:reveal-100});
    animate('.flCinemaLines i',[{opacity:0},{opacity:.72},{opacity:.36}],{duration:1500,delay:reveal-350,stagger:90});
    animate('.flCinemaOrbit',[{opacity:0,transform:'rotate(-18deg) scale(.72)'},{opacity:1,transform:'rotate(0deg) scale(1)'}],{duration:1750,delay:reveal-330});
    animate('.flCinemaStageGlow',[{opacity:0,transform:'translate(-50%,-50%) scale(.45)'},{opacity:.95,transform:'translate(-50%,-50%) scale(1)'},{opacity:.52,transform:'translate(-50%,-50%) scale(.92)'}],{duration:1300,delay:reveal-200});
    animate('.flCinemaPedestal',[{opacity:0,transform:'translateX(-50%) scaleX(.45)'},{opacity:1,transform:'translateX(-50%) scaleX(1)'}],{duration:900,delay:reveal});
    animate('.flCinemaSpotlights i',[{opacity:0,filter:'blur(7px)'},{opacity:prestige >= 5 ? .68 : .42,filter:'blur(1px)'},{opacity:prestige >= 5 ? .42 : .25,filter:'blur(2px)'}],{duration:1300,delay:reveal-80,stagger:110});

    if (scene === 'europe') {
      animate('.flCinemaTunnel i',[{opacity:0,filter:'blur(7px)'},{opacity:.44,filter:'blur(0)'}],{duration:850,delay:reveal-520,stagger:110});
    }

    if (scene === 'worldxi') {
      animate('.flCinemaPitch',[{opacity:0,transform:'scale(.88)'},{opacity:.72,transform:'scale(1)'}],{duration:900,delay:reveal-120});
      animate('.flCinemaSelectionCard',[{opacity:0,transform:'translate(-50%,72px) scale(.86)'},{opacity:1,transform:'translate(-50%,-14px) scale(1.03)',offset:.72},{opacity:1,transform:'translate(-50%,0) scale(1)'}],{duration:1300,delay:reveal});
      animate('.flCinemaSelectionPulse',[{opacity:0,transform:'translate(-50%,-50%) scale(.35)'},{opacity:.75,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.3)'}],{duration:950,delay:reveal+900});
    } else {
      const start = prestige >= 6 ? 'translateY(150px) scale(.76)' : prestige >= 4 ? 'translateY(112px) scale(.84)' : 'translateY(72px) scale(.9)';
      animate('.flCinemaTrophyWrap',[
        {opacity:0,transform:start,filter:'brightness(.12) blur(3px)'},
        {opacity:1,transform:'translateY(-8px) scale(1.035)',filter:'brightness(1.4) blur(0)',offset:.76},
        {opacity:1,transform:'translateY(0) scale(1)',filter:'brightness(1) blur(0)'}
      ],{duration:prestige >= 6 ? 1750 : prestige >= 4 ? 1450 : 1100,delay:reveal,easing:'cubic-bezier(.14,.86,.18,1)'});
      animate('.flCinemaTrophyGleam',[{opacity:0,transform:'translateX(-120%)'},{opacity:.95,offset:.2},{opacity:.7,offset:.7},{opacity:0,transform:'translateX(120%)'}],{duration:prestige >= 5 ? 1050 : 760,delay:reveal+(prestige >= 5 ? 1050 : 760),easing:'ease-in-out'});
    }

    if (prestige >= 4) {
      animate('.flCinemaCameraFlashes i',[{opacity:0},{opacity:1,offset:.18},{opacity:0}],{duration:420,delay:reveal+1250,stagger:230,easing:'ease-out'});
    }
    if (scene === 'world' || scene === 'premier' || scene === 'europe' || scene === 'euros') {
      animate('.flCinemaParticles i',[{opacity:0,transform:'translateY(30px) rotate(0deg)'},{opacity:.65,offset:.22},{opacity:0,transform:'translateY(-130px) rotate(120deg)'}],{duration:1700,delay:reveal+1150,stagger:95,easing:'cubic-bezier(.2,.65,.25,1)'});
    }
    if (scene === 'ballon' || scene === 'global') {
      animate('.flCinemaPlayerFigure',[{opacity:0,transform:'translateY(38px) scale(.94)'},{opacity:.42,transform:'translateY(0) scale(1)'}],{duration:1000,delay:reveal+1150});
    }

    animate('.flCinemaArtRule, .flCinemaArtCaption',[{opacity:0},{opacity:1}],{duration:550,delay:reveal+1150});
    animate('.flCinemaCompetition',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:500,delay:reveal+520});
    animate('.flCinemaTitle span',[{opacity:0,transform:'translateY(28px)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:820,delay:reveal+700,stagger:110});
    animate('.flCinemaNote',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:560,delay:reveal+1200});
    animate('.flCinemaWinner, .flCinemaExtras',[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:650,delay:reveal+1450});
    animate('.flCinemaMemento',[{opacity:0},{opacity:1}],{duration:450,delay:Math.max(reveal+1700,duration-850)});
    animate('.flCinemaContinue',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:420,delay:duration-480});
    animate('.flCinemaProgress i',[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration,easing:'linear'});

    timer = setTimeout(finish,duration);
  }

  function sync() {
    for (const [root, controller] of active) {
      if (!root.isConnected || root.closest('.hidden') || root.closest('#flash:not(.show)')) { controller.dispose(); active.delete(root); }
    }
    document.querySelectorAll('.flCinema:not([data-mounted])').forEach(root => {
      if (!root.closest('.hidden') && !root.closest('#flash:not(.show)')) mount(root);
    });
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
    const entries = names.map(name => ({name,type,season:{...season,club:season.club || state.player.club},player:{name:state.player.name,nationality:state.player.nationality,position:state.player.position}}));
    const current = flashQueues.get(card);
    if (current && host.classList.contains('show') && card.querySelector('.flCinema')) { current.push(...entries); return true; }
    const queue = entries; flashQueues.set(card,queue);
    const next = () => {
      const item = queue.shift();
      if (!item) { host.classList.remove('show'); flashQueues.delete(card); return; }
      card.className = 'flashCard flCinemaFlash';
      card.innerHTML = html({season:item.season,player:item.player,items:[item.name],type:item.type,buttonId:'flashClose',buttonLabel:'Continue'});
      host.classList.add('show');
      card.querySelector('#flashClose').onclick = next;
    };
    next(); return true;
  }

  window.FLCinema = Object.freeze({html,sceneFor,showFlash,primeAudio,finish:root => active.get(root)?.finish()});
  new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();
})();
