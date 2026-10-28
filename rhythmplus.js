/* Rhythm.play arcade services — no frameworks or third-party runtime. */
(() => {
  'use strict';

  const STORAGE_KEY = 'rhythm-play-arcade-v1';
  const TRACK = 'Neon Side Street';
  const skins = [
    { id:'pulse', name:'Pulse Original', cost:0, tier:'STARTER', caption:'The classic ultraviolet arcade signal.', colors:['#8c85ff','#b47bff','#ff73bb','#76f5ca'], accent:'#bf83ff', glow:'#a569ff' },
    { id:'afterglow', name:'Afterglow', cost:450, tier:'RARE', caption:'Magenta, rose, and late-night electricity.', colors:['#ff6a9c','#fc83e7','#ffb07b','#ffc9e7'], accent:'#ff7cb6', glow:'#ed429a' },
    { id:'aquawave', name:'Aquawave', cost:700, tier:'RARE', caption:'Ice blue circuitry with mint highlights.', colors:['#5ef3df','#60b4ff','#86ebfa','#b1fcf1'], accent:'#6cf3e0', glow:'#30c4e1' },
    { id:'solar', name:'Solar Flare', cost:1100, tier:'EPIC', caption:'A golden-hour rush of heat and speed.', colors:['#ffc75e','#ff8c5a','#ffe58d','#ff647c'], accent:'#ffc46a', glow:'#ff9950' },
    { id:'toxic', name:'Cyberlime', cost:1500, tier:'EPIC', caption:'Acid-green notes over the midnight grid.', colors:['#d4fa77','#6efc94','#a6f37e','#e8ffb3'], accent:'#b9f46d', glow:'#85e44b' },
    { id:'prism', name:'Prism Shift', cost:2400, tier:'LEGENDARY', caption:'An electric spectrum worthy of a high score.', colors:['#a49fff','#ff85d3','#64e9ff','#ffe987'], accent:'#df9cff', glow:'#ab68ff' }
  ];
  const defaultData = () => ({ coins:0, owned:['pulse'], equipped:'pulse', username:'GUEST PLAYER', scores:[], runs:0, lifetime:0 });
  const $ = id => document.getElementById(id);
  const dialog = $('arcadeDialog');
  const content = $('arcadeContent');
  const title = $('arcadeTitle');
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const cap = (n, low, high) => Math.min(high, Math.max(low, Number(n) || 0));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const cloud = window.RHYTHM_CONFIG || {};
  const cloudReady = typeof cloud.supabaseUrl === 'string' && /^https:\/\//i.test(cloud.supabaseUrl) &&
      typeof cloud.supabaseAnonKey === 'string' && cloud.supabaseAnonKey.length > 15;
  let currentView = 'play';
  let boardScope = 'local';
  let state = readData();
  let toastTimer;

  function readData() {
    const fallback = defaultData();
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data || typeof data !== 'object') return fallback;
      return {
        coins:Math.floor(cap(data.coins,0,10000000)),
        owned:Array.isArray(data.owned) ? [...new Set(['pulse', ...data.owned.filter(id => skins.some(s => s.id === id))])] : ['pulse'],
        equipped:skins.some(s => s.id === data.equipped) ? data.equipped : 'pulse',
        username:validName(data.username) || fallback.username,
        scores:Array.isArray(data.scores) ? data.scores.filter(s => s && Number.isFinite(s.score) && s.score >= 0).slice(0,100) : [],
        runs:Math.floor(cap(data.runs,0,1000000)),
        lifetime:Math.floor(cap(data.lifetime,0,100000000))
      };
    } catch (_) { return fallback; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (_) { notify('Could not save progress. Check browser storage settings.'); }
    renderHeader();
  }
  function validName(value) {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g,' ').slice(0,18).replace(/[^\p{L}\p{N} _.-]/gu,'').trim();
  }
  function notify(message) {
    const toast = $('rhToast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
  }
  function renderHeader() {
    $('walletBalance').textContent = fmt(state.coins);
    $('profileShortcut').innerHTML = escapeHtml(state.username) + ' <span aria-hidden="true">↗</span>';
  }
  function equippedSkin() { return skins.find(s => s.id === state.equipped) || skins[0]; }
  function applySkin() {
    if (!state.owned.includes(state.equipped)) state.equipped = 'pulse';
    const selected = equippedSkin();
    document.documentElement.style.setProperty('--rh-accent',selected.accent);
    document.documentElement.style.setProperty('--rh-glow',selected.glow);
    document.body.dataset.skin = selected.id;
    if (window.rhythmCore) window.rhythmCore.setPalette(selected.colors);
  }
  function modalHead(view) {
    const names = {shop:'SKIN SHOP',leaderboard:'THE LEADERBOARD',profile:'PLAYER PROFILE'};
    title.textContent = names[view] || 'ARCADE';
    document.querySelectorAll('.rh-nav-button').forEach(btn => btn.classList.toggle('selected', btn.dataset.view === view));
  }
  function openView(view) {
    if (view === 'play') { if (dialog.open) dialog.close(); return; }
    if (window.rhythmCore?.getStatus() === 'playing') $('pauseBtn').click();
    currentView = view;
    modalHead(view);
    renderView();
    if (!dialog.open) dialog.showModal();
  }
  function closeView() {
    if (dialog.open) dialog.close();
    currentView = 'play';
    modalHead('play');
  }
  function renderView() {
    if (currentView === 'shop') renderShop();
    else if (currentView === 'leaderboard') renderLeaderboard();
    else if (currentView === 'profile') renderProfile();
  }
  function skinCard(skin) {
    const owned = state.owned.includes(skin.id);
    const selected = skin.id === state.equipped;
    const action = selected ? 'EQUIPPED' : owned ? 'EQUIP' : 'UNLOCK';
    return '<article class="rh-skin-card '+(selected?'rh-equipped':'')+'">' +
      '<div class="rh-skin-art" style="--s1:'+skin.colors[0]+';--s2:'+skin.colors[1]+';--s3:'+skin.colors[2]+';--s4:'+skin.colors[3]+'"><span class="rh-skin-geometry"></span><span class="rh-skin-shine"></span><span class="rh-skin-chip">'+skin.tier+'</span></div>'+
      '<div class="rh-skin-info"><h3>'+escapeHtml(skin.name)+'</h3><p>'+escapeHtml(skin.caption)+'</p>'+
      '<div class="rh-skin-bottom"><strong>'+(owned ? (selected?'ACTIVE':'OWNED') : '✦ '+fmt(skin.cost))+'</strong>'+
      '<button type="button" class="rh-card-btn" data-skin="'+skin.id+'" '+(selected?'disabled':'')+'>'+action+'</button></div></div></article>';
  }
  function renderShop() {
    content.innerHTML = '<div class="rh-section-intro"><div><div class="rh-eyebrow">CUSTOMIZE YOUR PLAYFIELD</div><p>Unlock palettes with Pulse Coins earned from completed tracks. All cosmetics are permanent; no purchases required.</p></div><div class="rh-coin-pill">✦ '+fmt(state.coins)+' COINS</div></div>'+
      '<div class="rh-skin-grid">'+skins.map(skinCard).join('')+'</div>'+
      '<p class="rh-disclaimer">Cosmetic effects only. Every player has identical scoring and hit windows.</p>';
  }
  function handleSkin(id) {
    const skin = skins.find(item => item.id === id);
    if (!skin) return;
    if (!state.owned.includes(id)) {
      if (state.coins < skin.cost) { notify('Not enough Pulse Coins. Play more tracks to earn them.'); return; }
      state.coins -= skin.cost;
      state.owned.push(id);
      notify(skin.name + ' unlocked!');
    } else notify(skin.name + ' equipped.');
    state.equipped = id;
    applySkin();
    save();
    renderShop();
  }
  function makeRows(scores, empty) {
    if (!scores.length) return '<div class="rh-empty"><span class="rh-empty-icon">◇</span><strong>'+escapeHtml(empty)+'</strong><p>Finish a track to post your first score.</p></div>';
    return '<div class="rh-score-table"><div class="rh-score-tr rh-score-heading"><span>RANK</span><span>PLAYER</span><span>GRADE</span><span>COMBO</span><span>SCORE</span></div>'+
      scores.slice(0,20).map((s,i)=>'<div class="rh-score-tr"><span class="rh-rank '+(i<3?'rh-top-rank':'')+'">'+String(i+1).padStart(2,'0')+'</span><span class="rh-score-name">'+escapeHtml(s.username || s.player_name || 'PLAYER')+'</span><span class="rh-score-grade">'+escapeHtml(s.grade||'—')+'</span><span>'+fmt(s.maxCombo ?? s.max_combo)+'</span><strong>'+fmt(s.score)+'</strong></div>').join('')+'</div>';
  }
  function renderLeaderboard() {
    const scores = [...state.scores].sort((a,b) => b.score-a.score || b.accuracy-a.accuracy);
    content.innerHTML = '<div class="rh-section-intro"><div><div class="rh-eyebrow">CHASE THE PERFECT RUN</div><p>Real performances. No fabricated scores or bots.</p></div><div class="rh-coin-pill">'+fmt(state.runs)+' COMPLETED RUNS</div></div>'+
      '<div class="rh-board-tabs"><button type="button" data-board="local" class="'+(boardScope==='local'?'active':'')+'">MY DEVICE</button><button type="button" data-board="global" class="'+(boardScope==='global'?'active':'')+'">WORLDWIDE '+(cloudReady?'●':'◇')+'</button></div>'+
      '<div id="rhBoardBody">'+(boardScope === 'local' ? makeRows(scores,'No scores yet') : '<div class="rh-empty">Checking the community leaderboard…</div>')+'</div>'+
      '<p class="rh-disclaimer">'+(boardScope==='local'?'Scores are saved in this browser.':'Worldwide scores are player-submitted and are not independently verified.')+'</p>';
    if (boardScope === 'global') void loadGlobal();
  }
  function cloudHeaders(extra={}) {
    return {'apikey':cloud.supabaseAnonKey,'Authorization':'Bearer '+cloud.supabaseAnonKey,...extra};
  }
  function cloudEndpoint() { return cloud.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rhythm_scores'; }
  async function loadGlobal() {
    const target = $('rhBoardBody');
    if (!cloudReady) {
      target.innerHTML = '<div class="rh-empty"><span class="rh-empty-icon">◎</span><strong>Worldwide rankings are not connected</strong><p>Device scores work now. To enable the shared leaderboard, configure Supabase using the repository setup guide.</p></div>';
      return;
    }
    try {
      const response = await fetch(cloudEndpoint()+'?select=player_name,score,accuracy,max_combo,grade,played_at&order=score.desc&limit=20',{headers:cloudHeaders()});
      if (!response.ok) throw new Error('Leaderboard request failed');
      const rows = await response.json();
      if (boardScope === 'global' && currentView === 'leaderboard' && target.isConnected) target.innerHTML = makeRows(Array.isArray(rows)?rows:[],'No worldwide scores yet');
    } catch (_) {
      if (target.isConnected) target.innerHTML = '<div class="rh-empty"><strong>Worldwide leaderboard unavailable</strong><p>Your local scores are safe. Check the Supabase configuration and connection.</p></div>';
    }
  }
  async function postGlobal(entry) {
    if (!cloudReady) return;
    try {
      const response = await fetch(cloudEndpoint(), {
        method:'POST',
        headers:cloudHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
        body:JSON.stringify({player_name:entry.username,score:entry.score,accuracy:entry.accuracy,max_combo:entry.maxCombo,grade:entry.grade,track:TRACK})
      });
      if (!response.ok) notify('Score saved locally; worldwide sync did not succeed.');
    } catch (_) { notify('Score saved locally; worldwide sync is offline.'); }
  }
  function renderProfile() {
    const best = state.scores.reduce((value,s) => Math.max(value,s.score),0);
    content.innerHTML = '<div class="rh-profile-layout"><div class="rh-profile-crest">R<span>✦</span></div><div><span class="rh-eyebrow">YOUR ARCADE IDENTITY</span>'+
      '<form id="rhProfileForm"><label class="rh-field-label" for="rhUsername">DISPLAY NAME</label><div class="rh-field-row"><input required minlength="2" maxlength="18" id="rhUsername" type="text" value="'+escapeHtml(state.username)+'" autocomplete="nickname" /><button type="submit" class="rh-card-btn">SAVE NAME</button></div></form>'+
      '<p class="rh-disclaimer">Only your display name is shared with the global leaderboard when online sync is enabled. Avoid using personal details.</p></div></div>'+
      '<div class="rh-profile-stats"><div><small>PULSE COINS</small><strong>✦ '+fmt(state.coins)+'</strong></div><div><small>BEST SCORE</small><strong>'+fmt(best)+'</strong></div><div><small>RUNS CLEARED</small><strong>'+fmt(state.runs)+'</strong></div><div><small>OWNED SKINS</small><strong>'+state.owned.length+' / '+skins.length+'</strong></div></div>';
  }
  function saveProfile(e) {
    e.preventDefault();
    const value = validName($('rhUsername').value);
    if (value.length < 2) { notify('Display name must be at least 2 characters.'); return; }
    state.username = value;
    save();
    notify('Display name updated.');
    renderProfile();
  }
  function onComplete(e) {
    const run = e.detail || {};
    const score = Math.floor(cap(run.score,0,10000000));
    const accuracy = cap(run.accuracy,0,100);
    const maxCombo = Math.floor(cap(run.maxCombo,0,10000));
    const grade = /^[SABCD]$/.test(run.grade) ? run.grade : 'D';
    const earned = Math.min(1500,Math.max(25,Math.round(score / 150)));
    state.coins = Math.min(10000000,state.coins + earned);
    state.lifetime += earned;
    state.runs += 1;
    const entry = {username:state.username,score,accuracy,maxCombo,grade,playedAt:new Date().toISOString()};
    state.scores.unshift(entry);
    state.scores.sort((a,b)=>b.score-a.score);
    state.scores = state.scores.slice(0,100);
    save();
    notify('TRACK COMPLETE  ·  +'+fmt(earned)+' PULSE COINS');
    const results = $('resultsOverlay');
    if (results && !$('rh-earned')) {
      const el = document.createElement('p');
      el.id = 'rh-earned';
      el.className = 'rh-earned';
      results.querySelector('.results-grid')?.after(el);
    }
    if ($('rh-earned')) $('rh-earned').textContent = '+ '+fmt(earned)+' PULSE COINS EARNED';
    void postGlobal(entry);
  }

  document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click',()=>openView(btn.dataset.view)));
  $('profileShortcut').addEventListener('click',()=>openView('profile'));
  $('arcadeClose').addEventListener('click',closeView);
  dialog.addEventListener('close',()=>{currentView='play';modalHead('play');});
  dialog.addEventListener('click', e=>{if(e.target===dialog) closeView();});
  content.addEventListener('click', e=>{
    const skin = e.target.closest('[data-skin]');
    if (skin) handleSkin(skin.dataset.skin);
    const board = e.target.closest('[data-board]');
    if (board) {boardScope=board.dataset.board;renderLeaderboard();}
  });
  content.addEventListener('submit',e=>{if(e.target.id==='rhProfileForm') saveProfile(e);});
  window.addEventListener('rhythm:completed',onComplete);
  renderHeader();
  applySkin();
})();