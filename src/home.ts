export const homePage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Echo Music · Lossless</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,75..125,300..700&display=swap">
<style>
/* ─── M3 TOKENS ──────────────────────────────── */
:root {
  --bg:               #0f0d13;
  --surface:          #1c1b20;
  --surface-container:#26232d;
  --surface-high:     #312e38;
  --on-surface:       #e6e1e8;
  --on-surface-var:   #c8c3d0;
  --outline:          #948f9e;
  --outline-var:      #49454f;
  --primary:          #cfbcff;
  --primary-cont:     #4a3780;
  --on-primary-cont:  #ecdcff;
  --shape-xs: 4px; --shape-sm: 8px; --shape-md: 12px;
  --shape-lg: 16px; --shape-xl: 28px; --shape-full: 9999px;
  --player-h: 76px;
}

*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

html { background: var(--bg); color: var(--on-surface); min-height: 100%; }

body {
  font-family: "Roboto Flex", Roboto, system-ui, sans-serif;
  font-size: 16px; line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  padding-bottom: calc(var(--player-h) + 20px);
}

/* ─── LAYOUT ─────────────────────────────────── */
main {
  min-height: 100dvh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
main.searching { justify-content: flex-start; padding-top: 24px; }
main.searching .hero { padding-bottom: 6px; }

/* ─── HERO ───────────────────────────────────── */
.hero {
  width: 100%; max-width: 600px;
  padding: 0 20px 16px;
  text-align: center;
}
.hero h1 {
  font-size: clamp(26px, 6vw, 44px);
  font-weight: 600; letter-spacing: -.5px; line-height: 1.12;
  margin-bottom: 10px;
}
.hero-sub {
  font-size: 15px; color: var(--on-surface-var);
  line-height: 1.6; max-width: 380px; margin: 0 auto 20px;
}

/* ─── M3 SEARCH BAR ──────────────────────────── */
.search-bar {
  position: relative;
  display: flex; align-items: center;
  max-width: 540px; margin: 0 auto;
  height: 56px;
  background: var(--surface-container);
  border-radius: var(--shape-full);
  padding: 0 8px 0 0;
  /* M3 elevation 0 → shadow on focus */
  box-shadow: 0 1px 2px rgba(0,0,0,.4);
  transition: box-shadow .25s;
}
.search-bar:focus-within {
  box-shadow: 0 0 0 2px var(--primary), 0 3px 12px rgba(0,0,0,.45);
}
/* leading icon — perfectly centred in 56px bar */
.search-lead {
  width: 54px; height: 56px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--on-surface-var); pointer-events: none;
}
#query {
  flex: 1; background: transparent; border: none; outline: none;
  font-family: inherit; font-size: 16px;
  color: var(--on-surface); caret-color: var(--primary);
  min-width: 0; padding: 0;
}
#query::placeholder { color: var(--on-surface-var); }

/* remove native cancel / clear cross icon */
#query::-webkit-search-cancel-button,
#query::-webkit-search-decoration,
#query::-webkit-search-results-button,
#query::-webkit-search-results-decoration,
#query::-webkit-clear-button {
  -webkit-appearance: none !important;
  appearance: none !important;
  display: none !important;
}

/* trailing search FAB — M3 tonal button */
.search-fab {
  flex-shrink: 0;
  height: 40px; padding: 0 20px;
  background: var(--primary-cont); color: var(--on-primary-cont);
  border: none; border-radius: var(--shape-full);
  font-family: inherit; font-size: 14px; font-weight: 500;
  letter-spacing: .1px; cursor: pointer;
  transition: background .15s, transform .1s;
  display: flex; align-items: center; gap: 6px;
}
.search-fab:hover  { background: color-mix(in srgb, var(--primary-cont) 88%, white); }
.search-fab:active { transform: scale(.96); }
.fab-label { /* hide on narrow screens */ }

/* ─── STATUS ─────────────────────────────────── */
#status {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; font-size: 14px; color: var(--on-surface-var);
}
#status:empty { display: none; }
#status:not(:empty) { padding: 12px 0; }

.m3-spin {
  width: 22px; height: 22px; flex-shrink: 0;
  border: 2.5px solid var(--outline-var);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .85s cubic-bezier(.4,0,.2,1) infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── CONTENT ────────────────────────────────── */
.content { width: 100%; max-width: 600px; padding: 0 12px; }

/* ─── TRACK LIST ─────────────────────────────── */
#results { display: flex; flex-direction: column; }

/* staggered fade-slide-in */
@keyframes card-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card {
  display: flex; align-items: center; gap: 14px;
  padding: 8px 12px; border-radius: var(--shape-lg);
  cursor: default; position: relative;
  /* no background by default — pure M3 list style */
  animation: card-in .3s cubic-bezier(.2,0,0,1) both;
  transition: background .12s;
}
.card:hover  { background: rgba(208,188,255,.06); }
.card.playing { background: rgba(208,188,255,.1); }
.card.playing .track-title { color: var(--primary); }

/* number / play icon */
.num-wrap {
  width: 28px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  position: relative; height: 28px;
}
.card-num {
  font-size: 13px; color: var(--on-surface-var);
  position: absolute; transition: opacity .15s;
}
.card-play {
  position: absolute;
  width: 28px; height: 28px;
  border: none; border-radius: 50%; background: transparent;
  color: var(--on-surface); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .15s, color .15s; padding: 0;
}
.card:hover .card-num, .card.playing .card-num { opacity: 0; }
.card:hover .card-play, .card.playing .card-play { opacity: 1; }
.card.playing .card-play { color: var(--primary); }
.card.playing .card-play svg { display: none; }

/* waveform */
.wave { display: none; align-items: flex-end; gap: 2px; height: 13px; }
.card.playing .wave { display: flex; }
.wave i {
  display: block; width: 3px; background: var(--primary);
  border-radius: 2px; font-style: normal;
  animation: wv .75s ease-in-out infinite alternate;
}
.wave i:nth-child(1) { height: 5px;  animation-delay: 0s; }
.wave i:nth-child(2) { height: 12px; animation-delay: .13s; }
.wave i:nth-child(3) { height: 7px;  animation-delay: .26s; }
@keyframes wv { from { transform: scaleY(.3); } to { transform: scaleY(1); } }

/* artwork */
.cover {
  width: 46px; height: 46px; flex-shrink: 0;
  border-radius: var(--shape-sm);
  background: var(--surface-high); object-fit: cover;
}

/* text */
.meta { flex: 1; min-width: 0; }
.track-title {
  font-size: 14px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--on-surface); transition: color .15s;
}
.track-artist {
  font-size: 13px; color: var(--on-surface-var); margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* M3 assist chip */
.q-chip {
  font-size: 10px; font-weight: 600; letter-spacing: .4px;
  text-transform: uppercase;
  color: var(--primary);
  border: 1px solid rgba(207,188,255,.3);
  padding: 3px 9px; border-radius: var(--shape-full);
  flex-shrink: 0; white-space: nowrap;
}

/* ─── MINI PLAYER ────────────────────────────── */
.player-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  height: var(--player-h);
  background: color-mix(in srgb, var(--surface-container) 94%, transparent);
  backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
  border-top: 1px solid var(--outline-var);
  display: flex; align-items: center; padding: 0 20px;
  transform: translateY(100%);
  transition: transform .42s cubic-bezier(.2,0,0,1);
}
.player-bar.active { transform: translateY(0); }

.player-inner {
  width: 100%; max-width: 600px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr;
  align-items: center; gap: 16px;
}
.player-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
#playerArt {
  width: 42px; height: 42px; border-radius: var(--shape-sm);
  object-fit: cover; flex-shrink: 0;
  background: var(--surface-high);
  box-shadow: 0 2px 8px rgba(0,0,0,.5);
}
.player-meta { flex: 1; min-width: 0; }
.player-title {
  font-size: 13px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.player-artist {
  font-size: 12px; color: var(--on-surface-var); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.player-chip {
  font-size: 9px; font-weight: 700; letter-spacing: .5px;
  text-transform: uppercase; color: var(--primary);
  border: 1px solid rgba(207,188,255,.28);
  padding: 2px 7px; border-radius: var(--shape-full); flex-shrink: 0;
}
.player-right { min-width: 0; }
#audio { width: 100%; height: 32px; accent-color: var(--primary); }

/* ─── FOOTER ─────────────────────────────────── */
footer {
  width: 100%; max-width: 600px; margin: 24px auto 0;
  padding: 20px 12px 32px;
  border-top: 1px solid var(--outline-var);
}
.footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; margin-bottom: 16px; }
.footer-col h3 {
  font-size: 11px; font-weight: 600; letter-spacing: .7px;
  text-transform: uppercase; color: var(--on-surface-var); margin-bottom: 6px;
}
.footer-col p { font-size: 12px; color: var(--outline); line-height: 1.65; }
.footer-col a { color: var(--on-surface-var); text-decoration: none; }
.footer-col a:hover { color: var(--on-surface); }
.footer-bottom {
  font-size: 11px; color: var(--outline);
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;
}
.f-kbd {
  font-family: inherit; font-size: 11px;
  background: var(--surface-high); border: 1px solid var(--outline-var);
  border-radius: var(--shape-xs); padding: 1px 6px; color: var(--on-surface-var);
}

/* ─── RESPONSIVE ─────────────────────────────── */
@media (max-width: 560px) {
  .hero h1 { font-size: 26px; }
  .hero-sub { font-size: 14px; }
  .fab-label { display: none; }
  .search-fab { padding: 0 14px; }
  .player-inner { grid-template-columns: 1fr; gap: 4px; }
  .player-bar { height: auto; padding: 10px 16px 14px; }
  .footer-grid { grid-template-columns: 1fr; gap: 16px; }
  .footer-bottom { flex-direction: column; align-items: flex-start; }
  .cover { width: 42px; height: 42px; }
}
</style>
</head>
<body>
<main id="main">

  <!-- Hero -->
  <section class="hero">
    <h1>Your music,<br>without compromise.</h1>
    <p class="hero-sub">Lossless FLAC audio streamed in real time — no storage, no sign-in, six providers racing for the best result.</p>

    <form id="searchForm" onsubmit="return doSearch();">
      <div class="search-bar">
        <span class="search-lead" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </span>
        <input id="query" type="text" placeholder="Artists, songs, albums\u2026" autocomplete="off" spellcheck="false">
        <button class="search-fab" type="submit" aria-label="Search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span class="fab-label">Search</span>
        </button>
      </div>
    </form>
  </section>

  <!-- Results -->
  <div class="content">
    <div id="status"></div>
    <div id="results"></div>

    <!-- Footer -->
    <footer>
      <div class="footer-grid">
        <div class="footer-col">
          <h3>Open Source</h3>
          <p>Fully open source under GPL-3.0. Source available on <a href="https://github.com/EchoMusicApp/lossless-extension" target="_blank" rel="noopener">GitHub</a>. Inspect, fork, and self-host freely.</p>
        </div>
        <div class="footer-col">
          <h3>How It Works</h3>
          <p>No music is stored on this server. Every request fetches a real-time stream URL from third-party providers and passes it directly to your player. Nothing is cached or redistributed.</p>
        </div>
        <div class="footer-col">
          <h3>Your Responsibility</h3>
          <p>By hosting this server you — not the software author — are solely responsible for compliance with applicable laws and third-party terms of service. The author accepts no liability for any misuse or unlawful conduct.</p>
        </div>
        <div class="footer-col">
          <h3>Disclaimer</h3>
          <p>Unofficial community-built addon. Not affiliated with Qobuz, Deezer, or any music service. All trademarks belong to their respective owners.</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>Echo Music \u00b7 Lossless \u2014 GPL-3.0</span>
        <span>Press <kbd class="f-kbd">/</kbd> to search</span>
      </div>
    </footer>
  </div>
</main>

<!-- Mini Player -->
<div id="player-bar" class="player-bar">
  <div class="player-inner">
    <div class="player-left">
      <img id="playerArt" src="" alt="" style="display:none">
      <div class="player-meta">
        <div id="nowPlaying" class="player-title">Nothing playing</div>
        <div id="nowArtist" class="player-artist"></div>
      </div>
      <span id="nowQuality" class="player-chip"></span>
    </div>
    <div class="player-right">
      <audio id="audio" controls preload="none"></audio>
    </div>
  </div>
</div>

<script>
(function(){
  var lastTracks = [];

  function el(id){ return document.getElementById(id); }

  function xhr(url, done){
    var x = new XMLHttpRequest();
    x.onreadystatechange = function(){
      if(x.readyState === 4){
        if(x.status >= 200 && x.status < 300){
          try{ done(null, JSON.parse(x.responseText)); } catch(e){ done(e); }
        } else { done(new Error('HTTP ' + x.status)); }
      }
    };
    x.open('GET', url, true);
    x.send();
  }

  function setStatus(html){ el('status').innerHTML = html; }

  function clearPlaying(){
    document.querySelectorAll('.card.playing').forEach(function(c){ c.classList.remove('playing'); });
  }

  function setPlaying(index){
    clearPlaying();
    var cards = document.querySelectorAll('.card');
    if(cards[index]) cards[index].classList.add('playing');
  }

  function buildCard(t, i){
    var card = document.createElement('div');
    card.className = 'card';
    /* stagger delay via inline style */
    card.style.animationDelay = (i * 40) + 'ms';

    /* num / play wrapper */
    var nw = document.createElement('div'); nw.className = 'num-wrap';
    var num = document.createElement('span'); num.className = 'card-num'; num.textContent = String(i + 1);
    var btn = document.createElement('button'); btn.className = 'card-play'; btn.title = 'Play';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span class="wave"><i></i><i></i><i></i></span>';
    btn.addEventListener('click', function(){ playTrack(i); });
    nw.appendChild(num); nw.appendChild(btn);

    /* artwork */
    var img = document.createElement('img'); img.className = 'cover'; img.alt = '';
    if(t.artworkURL) img.src = t.artworkURL;
    img.onerror = function(){ this.style.opacity = '0'; };

    /* meta */
    var meta = document.createElement('div'); meta.className = 'meta';
    var title = document.createElement('div'); title.className = 'track-title'; title.textContent = t.title || 'Unknown';
    var artist = document.createElement('div'); artist.className = 'track-artist'; artist.textContent = t.artist || t.album || '';
    meta.appendChild(title); meta.appendChild(artist);

    /* chip */
    var chip = document.createElement('span'); chip.className = 'q-chip';
    chip.textContent = t.audioQuality || t.format || 'FLAC';

    card.appendChild(nw); card.appendChild(img); card.appendChild(meta); card.appendChild(chip);
    return card;
  }

  window.doSearch = function(){
    var q = (el('query').value || '').trim();
    if(!q) return false;

    el('main').classList.add('searching');
    setStatus('<div class="m3-spin"></div>');
    el('results').innerHTML = '';

    xhr('/search?q=' + encodeURIComponent(q) + '&quality=LOSSLESS&atmos=auto', function(err, data){
      setStatus('');
      if(err || !data){ setStatus('<span>Search unavailable \u2014 try again.</span>'); return; }
      lastTracks = data.tracks || [];
      if(!lastTracks.length){ setStatus('<span>No results for \u201c' + q.replace(/</g,'&lt;') + '\u201d</span>'); return; }
      /* no result count — just render cards */
      var frag = document.createDocumentFragment();
      for(var i = 0; i < lastTracks.length; i++) frag.appendChild(buildCard(lastTracks[i], i));
      el('results').appendChild(frag);
    });
    return false;
  };

  window.playTrack = function(index){
    var t = lastTracks[index];
    if(!t) return;
    setPlaying(index);
    el('player-bar').classList.add('active');
    el('nowPlaying').textContent = t.title || 'Loading\u2026';
    el('nowArtist').textContent = t.artist || '';
    el('nowQuality').textContent = t.audioQuality || t.format || 'FLAC';
    var art = el('playerArt');
    if(t.artworkURL){ art.src = t.artworkURL; art.style.display = 'block'; }
    else { art.style.display = 'none'; }
    xhr('/stream/' + encodeURIComponent(t.id) + '?quality=LOSSLESS&atmos=auto', function(err, data){
      if(err || !data || !data.url){
        el('nowPlaying').textContent = 'Track unavailable';
        el('nowArtist').textContent = '';
        clearPlaying(); return;
      }
      var audio = el('audio');
      audio.src = data.url; audio.load(); audio.play().catch(function(){});
    });
  };

  /* "/" shortcut */
  document.addEventListener('keydown', function(e){
    if(e.key === '/' && document.activeElement !== el('query')){
      e.preventDefault(); el('query').focus();
    }
  });
})();
</script>
</body>
</html>`;
