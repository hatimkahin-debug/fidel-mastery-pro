// app.js — Fidel Mastery Pro
// Organized in five sections: STORE, AUDIO ENGINE, NAVIGATION, SCREEN LOGIC, INIT.

/* =========================================================
   1. STORE — localStorage-backed persistence
   ========================================================= */
const Store = (function(){
  const KEY = 'fidelMasteryPro.v1';
  let data = { favorites: [], mastered: [], quiz: { correct: 0, total: 0 }, streak: { count: 0, last: null } };

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (raw) data = Object.assign(data, JSON.parse(raw));
    }catch(e){ /* localStorage unavailable — app still works, just won't persist */ }
    touchStreak();
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){}
  }
  function todayStr(){ return new Date().toISOString().slice(0,10); }
  function touchStreak(){
    const today = todayStr();
    if (data.streak.last === today) return;
    const y = new Date(); y.setDate(y.getDate()-1);
    const yesterday = y.toISOString().slice(0,10);
    data.streak.count = (data.streak.last === yesterday) ? (data.streak.count + 1) : 1;
    data.streak.last = today;
    save();
  }
  function toggleFavorite(id){
    const i = data.favorites.indexOf(id);
    if (i === -1) data.favorites.push(id); else data.favorites.splice(i,1);
    save();
  }
  function isFavorite(id){ return data.favorites.indexOf(id) !== -1; }
  function toggleMastered(id){
    const i = data.mastered.indexOf(id);
    if (i === -1) data.mastered.push(id); else data.mastered.splice(i,1);
    save();
  }
  function isMastered(id){ return data.mastered.indexOf(id) !== -1; }
  function recordQuiz(correct){
    data.quiz.total++; if (correct) data.quiz.correct++;
    save();
  }
  function getCloudKey(){ return data.cloudApiKey || ''; }
  function setCloudKey(key){ data.cloudApiKey = key.trim(); save(); }
  function resetAll(){
    data = { favorites: [], mastered: [], quiz: { correct: 0, total: 0 }, streak: { count: 0, last: null }, cloudApiKey: data.cloudApiKey };
    save(); touchStreak();
  }
  return { load, save, toggleFavorite, isFavorite, toggleMastered, isMastered, recordQuiz,
    getCloudKey, setCloudKey, resetAll, data: () => data };
})();

/* =========================================================
   2. AUDIO ENGINE
   Preference order per sound: local recording -> Google Translate
   TTS (best-effort, unofficial endpoint) -> device speech synthesis.
   Drop real recordings into audio/letters/{id}.mp3 and
   audio/words/{id}.mp3 (id = "{rowIdx}_{orderIdx}", e.g. "0_0" for ሀ)
   and they'll be used automatically — no code changes needed.
   ========================================================= */
const AudioEngine = (function(){
  let token = 0;
  let currentAudio = null;

  function stopAll(){
    token++;
    if (currentAudio){ try{ currentAudio.pause(); }catch(e){} currentAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function unlock(){
    try{
      const s = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
      s.play().catch(function(){});
    }catch(e){}
    try{
      if (window.speechSynthesis){
        const u = new SpeechSynthesisUtterance(''); u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    }catch(e){}
  }

  function tryAudioURL(url, myToken, onDone){
    const audio = new Audio();
    currentAudio = audio;
    let started = false, done = false;
    function finish(ok){
      if (done) return; done = true; clearTimeout(watchdog);
      if (myToken !== token) return;
      onDone(ok);
    }
    const watchdog = setTimeout(function(){ if (!started) finish(false); }, 1100);
    audio.addEventListener('playing', function(){ started = true; clearTimeout(watchdog); });
    audio.addEventListener('ended', function(){ finish(true); });
    audio.addEventListener('error', function(){ finish(false); });
    audio.addEventListener('stalled', function(){ if (!started) finish(false); });
    audio.src = url;
    const p = audio.play();
    if (p && p.catch) p.catch(function(){ finish(false); });
  }

  function speakDevice(text, myToken, onDone){
    if (!window.speechSynthesis){ onDone(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.85;
    u.onend = function(){ if (myToken === token) onDone(); };
    u.onerror = function(){ if (myToken === token) onDone(); };
    window.speechSynthesis.speak(u);
  }

  function googleURL(text){
    return 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=am&client=tw-ob';
  }

  // Official Google Cloud Text-to-Speech — genuine am-ET (Amharic) voices,
  // used only if the person has added their own API key in Progress > Audio
  // Settings. Falls through cleanly if there's no key, the request fails,
  // or the account/region doesn't have Amharic enabled.
  function playCloudTTS(text, apiKey, myToken, onDone){
    fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: text },
        voice: { languageCode: 'am-ET' },
        audioConfig: { audioEncoding: 'MP3' }
      })
    }).then(function(resp){ return resp.ok ? resp.json() : null; })
      .then(function(json){
        if (myToken !== token) return;
        if (!json || !json.audioContent){ onDone(false); return; }
        const audio = new Audio('data:audio/mp3;base64,' + json.audioContent);
        currentAudio = audio;
        audio.addEventListener('ended', function(){ if (myToken === token) onDone(true); });
        audio.addEventListener('error', function(){ if (myToken === token) onDone(false); });
        const p = audio.play();
        if (p && p.catch) p.catch(function(){ if (myToken === token) onDone(false); });
      })
      .catch(function(){ if (myToken === token) onDone(false); });
  }

  // Tries: local file (.mp3, then .wav) -> Cloud TTS (if a key is configured)
  // -> Google's translate.com trick -> device voice (reading `fallbackText`).
  function playOne(localBase, ttsText, fallbackText, myToken, onDone){
    tryAudioURL(localBase + '.mp3', myToken, function(okMp3){
      if (myToken !== token) return;
      if (okMp3){ onDone(); return; }
      tryAudioURL(localBase + '.wav', myToken, function(okWav){
        if (myToken !== token) return;
        if (okWav){ onDone(); return; }
        afterLocalFailed();
      });
    });
    function afterLocalFailed(){
      const cloudKey = Store.getCloudKey();
      function tryGoogleThenDevice(){
        tryAudioURL(googleURL(ttsText), myToken, function(okG){
          if (myToken !== token) return;
          if (okG){ onDone(); return; }
          speakDevice(fallbackText, myToken, onDone);
        });
      }
      if (cloudKey){
        playCloudTTS(ttsText, cloudKey, myToken, function(okC){
          if (myToken !== token) return;
          if (okC){ onDone(); return; }
          tryGoogleThenDevice();
        });
      } else {
        tryGoogleThenDevice();
      }
    }
  }

  // Plays the letter sound, then (after a short beat) the example word, if any.
  function playEntry(entry){
    stopAll();
    const myToken = token;
    playOne('audio/letters/' + entry.id, entry.char, entry.ttsFallback, myToken, function(){
      if (myToken !== token || !entry.word) return;
      setTimeout(function(){
        if (myToken !== token) return;
        playOne('audio/words/' + entry.id, entry.word.aw, entry.word.ph, myToken, function(){});
      }, 260);
    });
  }

  return { playEntry, stopAll, unlock };
})();

/* =========================================================
   3. NAVIGATION
   ========================================================= */
function switchTab(tab){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + tab).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'favorites') renderFavorites();
  if (tab === 'progress') renderProgress();
  if (tab === 'study') Study.pause();
}
document.querySelectorAll('.tab-btn').forEach(function(btn){
  btn.addEventListener('click', function(){ switchTab(btn.dataset.tab); });
});

/* =========================================================
   4. STUDY SCREEN
   ========================================================= */
const Study = (function(){
  let deck = FIDEL_DECK.slice();
  let idx = 0, playing = false, timer = null, isFlashcard = false;
  const speeds = [1, 1.5, 2, 0.6]; let speedIdx = 0;
  const BASE_INTERVAL = 4200;

  const els = {};
  ['bigLetter','orderStrip','wordCard','wChars','wPhon','wMean','progressBarFill','cornerInfo',
   'playBtn','speedBtn','favBtn','masterBtn'].forEach(id => els[id] = document.getElementById(id));

  let lastRowIdx = -1;
  function buildOrderStrip(rowIdx){
    const row = FIDEL_ROWS[rowIdx];
    els.orderStrip.innerHTML = '';
    row.chars.forEach(function(ch, i){
      const d = document.createElement('div');
      d.className = 'ord';
      d.innerHTML = '<div class="oc amh">'+ch+'</div><div class="op">'+ (row.base + PHON_SUFFIX[i]) +'</div>';
      els.orderStrip.appendChild(d);
    });
  }
  function highlightOrder(orderIdx){
    els.orderStrip.querySelectorAll('.ord').forEach((n,i) => n.classList.toggle('active', i === orderIdx));
  }
  function renderWordCard(entry){
    if (entry.word){
      els.wChars.textContent = entry.word.aw;
      els.wPhon.textContent = '"' + entry.word.ph + '"';
      els.wMean.textContent = entry.word.en;
    } else {
      els.wChars.textContent = FIDEL_ROWS[entry.rowIdx].name + ' · ' + VOWEL_ORDER[entry.orderIdx] + ' order';
      els.wPhon.textContent = '';
      els.wMean.textContent = 'no common example word for this exact form';
    }
  }
  function updateIconButtons(entry){
    els.favBtn.textContent = Store.isFavorite(entry.id) ? '★' : '☆';
    els.favBtn.classList.toggle('on', Store.isFavorite(entry.id));
    els.masterBtn.classList.toggle('on', Store.isMastered(entry.id));
  }

  function render(){
    if (deck.length === 0) return;
    if (idx >= deck.length) idx = 0;
    const entry = deck[idx];

    if (entry.rowIdx !== lastRowIdx){ buildOrderStrip(entry.rowIdx); lastRowIdx = entry.rowIdx; }
    highlightOrder(entry.orderIdx);
    renderWordCard(entry);
    updateIconButtons(entry);

    els.bigLetter.classList.remove('show');
    els.wordCard && els.wordCard.classList.remove('show');
    void els.bigLetter.offsetWidth;
    els.bigLetter.textContent = entry.char;
    requestAnimationFrame(() => { els.bigLetter.classList.add('show'); });

    els.cornerInfo.textContent = (idx+1) + ' / ' + deck.length;
    els.progressBarFill.style.width = (((idx+1)/deck.length)*100) + '%';

    if (!isFlashcard) AudioEngine.playEntry(entry);
  }

  function scheduleNext(){
    clearTimeout(timer);
    if (!playing || isFlashcard) return;
    timer = setTimeout(function(){ idx = (idx+1) % deck.length; render(); scheduleNext(); }, BASE_INTERVAL / speeds[speedIdx]);
  }
  function play(){ playing = true; els.playBtn.innerHTML = '❚❚'; scheduleNext(); }
  function pause(){ playing = false; els.playBtn.innerHTML = '▶'; clearTimeout(timer); AudioEngine.stopAll(); }
  function goto(n){ idx = ((n % deck.length) + deck.length) % deck.length; render(); if (playing) scheduleNext(); }

  function setFilter(val){
    if (val === 'all') deck = FIDEL_DECK.slice();
    else if (val === 'base') deck = FIDEL_DECK.filter(c => c.orderIdx === 0);
    else if (val === 'favorites') deck = FIDEL_DECK.filter(c => Store.isFavorite(c.id));
    else deck = FIDEL_DECK.filter(c => c.type === val);
    if (deck.length === 0) deck = FIDEL_DECK.slice(); // never show an empty study screen
    idx = 0; lastRowIdx = -1; render();
  }

  function jumpToId(id){
    deck = FIDEL_DECK.slice();
    document.querySelectorAll('#filterSeg button').forEach(b => b.classList.toggle('active', b.dataset.f === 'all'));
    idx = deck.findIndex(e => e.id === id);
    if (idx < 0) idx = 0;
    lastRowIdx = -1; render();
    switchTab('study');
  }

  document.getElementById('prevBtn').addEventListener('click', () => goto(idx-1));
  document.getElementById('nextBtn').addEventListener('click', () => goto(idx+1));
  els.playBtn.addEventListener('click', () => playing ? pause() : play());
  els.speedBtn.addEventListener('click', function(){
    speedIdx = (speedIdx+1) % speeds.length;
    els.speedBtn.textContent = speeds[speedIdx] + '×';
    if (playing) scheduleNext();
  });
  els.favBtn.addEventListener('click', function(){ Store.toggleFavorite(deck[idx].id); updateIconButtons(deck[idx]); });
  els.masterBtn.addEventListener('click', function(){ Store.toggleMastered(deck[idx].id); updateIconButtons(deck[idx]); });
  els.bigLetter.addEventListener('click', function(){
    if (!isFlashcard) return;
    document.body.classList.remove('flashcard');
    AudioEngine.playEntry(deck[idx]);
    setTimeout(function(){ document.body.classList.add('flashcard'); goto(idx+1); }, 2200);
  });
  document.getElementById('fcToggleLabel').addEventListener('click', function(){
    isFlashcard = !isFlashcard;
    document.body.classList.toggle('flashcard', isFlashcard);
    this.style.background = isFlashcard ? 'var(--gold)' : '';
    this.style.color = isFlashcard ? '#221a13' : '';
    if (isFlashcard) pause();
    render();
  });
  document.querySelectorAll('#filterSeg button').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('#filterSeg button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setFilter(btn.dataset.f);
    });
  });

  return { render, play, pause, jumpToId };
})();

/* =========================================================
   5. QUIZ SCREEN
   ========================================================= */
const Quiz = (function(){
  const letterEl = document.getElementById('quizLetter');
  const optsEl = document.getElementById('quizOptions');
  const statsEl = document.getElementById('quizStats');
  const nextBtn = document.getElementById('quizNextBtn');
  let current = null, answered = false;

  function pickDistinct(n, excludeEntry){
    const pool = FIDEL_DECK.filter(e => e.phon !== excludeEntry.phon);
    const out = [];
    while (out.length < n && pool.length){
      const i = Math.floor(Math.random()*pool.length);
      const cand = pool.splice(i,1)[0];
      if (!out.some(o => o.phon === cand.phon)) out.push(cand);
    }
    return out;
  }

  function newQuestion(){
    answered = false;
    nextBtn.style.display = 'none';
    current = FIDEL_DECK[Math.floor(Math.random()*FIDEL_DECK.length)];
    letterEl.classList.remove('show'); letterEl.textContent = current.char;
    void letterEl.offsetWidth; letterEl.classList.add('show');

    const distractors = pickDistinct(3, current);
    const options = distractors.concat([current]).sort(() => Math.random()-0.5);
    optsEl.innerHTML = '';
    options.forEach(function(opt){
      const b = document.createElement('button');
      b.className = 'quizOpt tap';
      b.textContent = opt.phon;
      b.addEventListener('click', function(){ selectAnswer(opt, b); });
      optsEl.appendChild(b);
    });
    updateStats();
  }

  function selectAnswer(opt, btnEl){
    if (answered) return;
    answered = true;
    const correct = opt.id === current.id;
    Store.recordQuiz(correct);
    document.querySelectorAll('.quizOpt').forEach(function(b){
      if (b === btnEl) b.classList.add(correct ? 'correct' : 'wrong');
      else if (b.textContent === current.phon) b.classList.add('correct');
      else b.classList.add('dim');
    });
    nextBtn.style.display = 'block';
    updateStats();
  }

  function updateStats(){
    const q = Store.data().quiz;
    statsEl.textContent = q.total > 0
      ? q.correct + ' / ' + q.total + ' correct (' + Math.round(100*q.correct/q.total) + '%)'
      : 'Answer to start tracking your accuracy';
  }

  nextBtn.addEventListener('click', newQuestion);
  return { newQuestion };
})();

/* =========================================================
   6. SEARCH SCREEN
   ========================================================= */
const Search = (function(){
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');

  function rowHTML(entry){
    const label = entry.word ? entry.word.en : (FIDEL_ROWS[entry.rowIdx].name + ' · ' + VOWEL_ORDER[entry.orderIdx]);
    const star = Store.isFavorite(entry.id) ? 'on' : '';
    return '<div class="resultRow" data-id="'+entry.id+'">'
      + '<div class="rc amh">'+entry.char+'</div>'
      + '<div class="ri"><div class="rp">'+entry.phon+(entry.word ? ' · "'+entry.word.aw+'"' : '')+'</div>'
      + '<div class="rw">'+label+'</div></div>'
      + '<button class="rstar '+star+'" data-star="'+entry.id+'">'+(star ? '★' : '☆')+'</button>'
      + '</div>';
  }

  function run(query){
    const q = query.trim().toLowerCase();
    if (!q){ results.innerHTML = '<div class="emptyState">Start typing to search all 231 forms.</div>'; return; }
    const matches = FIDEL_DECK.filter(function(e){
      return e.phon.toLowerCase().includes(q)
        || e.char.includes(query.trim())
        || (e.word && (e.word.aw.includes(query.trim()) || e.word.en.toLowerCase().includes(q) || e.word.ph.toLowerCase().includes(q)));
    }).slice(0, 40);
    results.innerHTML = matches.length
      ? matches.map(rowHTML).join('')
      : '<div class="emptyState">No matches. Try a romanized sound, an Amharic letter, or a word meaning.</div>';
  }

  results.addEventListener('click', function(e){
    const starBtn = e.target.closest('[data-star]');
    if (starBtn){ Store.toggleFavorite(starBtn.dataset.star); run(input.value); return; }
    const row = e.target.closest('.resultRow');
    if (row){
      const entry = FIDEL_DECK.find(x => x.id === row.dataset.id);
      Study.jumpToId(row.dataset.id);
      AudioEngine.playEntry(entry);
    }
  });
  input.addEventListener('input', () => run(input.value));
  run('');
  return { run };
})();

/* =========================================================
   7. FAVORITES SCREEN
   ========================================================= */
function renderFavorites(){
  const el = document.getElementById('favResults');
  const favs = Store.data().favorites;
  if (!favs.length){ el.innerHTML = '<div class="emptyState">No favorites yet — tap ☆ in Study or Search to add some.</div>'; return; }
  const entries = favs.map(id => FIDEL_DECK.find(e => e.id === id)).filter(Boolean);
  el.innerHTML = entries.map(function(entry){
    const label = entry.word ? entry.word.en : (FIDEL_ROWS[entry.rowIdx].name + ' · ' + VOWEL_ORDER[entry.orderIdx]);
    return '<div class="resultRow" data-id="'+entry.id+'">'
      + '<div class="rc amh">'+entry.char+'</div>'
      + '<div class="ri"><div class="rp">'+entry.phon+(entry.word ? ' · "'+entry.word.aw+'"' : '')+'</div>'
      + '<div class="rw">'+label+'</div></div>'
      + '<button class="rstar on" data-star="'+entry.id+'">★</button>'
      + '</div>';
  }).join('');
  el.querySelectorAll('[data-star]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation(); Store.toggleFavorite(btn.dataset.star); renderFavorites();
    });
  });
  el.querySelectorAll('.resultRow').forEach(function(row){
    row.addEventListener('click', function(){
      const entry = FIDEL_DECK.find(x => x.id === row.dataset.id);
      Study.jumpToId(row.dataset.id);
      AudioEngine.playEntry(entry);
    });
  });
}

/* =========================================================
   8. PROGRESS SCREEN
   ========================================================= */
function renderProgress(){
  const d = Store.data();
  document.getElementById('statMastered').textContent = d.mastered.length;
  document.getElementById('statFav').textContent = d.favorites.length;
  document.getElementById('statQuiz').textContent = d.quiz.total ? Math.round(100*d.quiz.correct/d.quiz.total) + '%' : '—';
  document.getElementById('statStreak').textContent = d.streak.count;
  updateCloudStatus();

  const masteredSet = new Set(d.mastered);
  function catStats(filterFn){
    const items = FIDEL_DECK.filter(filterFn);
    const done = items.filter(e => masteredSet.has(e.id)).length;
    return { done, total: items.length };
  }
  const all = catStats(() => true);
  const base = catStats(e => e.orderIdx === 0);
  const look = catStats(e => e.type === 'lookalike');
  const arab = catStats(e => e.type === 'arabic');

  function setBar(prefix, stat){
    document.getElementById(prefix+'Txt').textContent = stat.done + '/' + stat.total;
    document.getElementById(prefix+'Bar').style.width = (stat.total ? (100*stat.done/stat.total) : 0) + '%';
  }
  setBar('catAll', all); setBar('catBase', base); setBar('catLook', look); setBar('catArab', arab);
}
document.getElementById('resetBtn').addEventListener('click', function(){
  if (confirm('Reset all favorites, mastered letters, and quiz stats? This cannot be undone.')){
    Store.resetAll(); renderProgress(); renderFavorites(); Study.render();
  }
});

function updateCloudStatus(){
  const key = Store.getCloudKey();
  const statusEl = document.getElementById('cloudStatus');
  const inputEl = document.getElementById('cloudKeyInput');
  if (statusEl) statusEl.textContent = key ? 'Cloud TTS: active (using your key)' : 'Cloud TTS: not configured — using the fallback voice chain';
  if (inputEl && !inputEl.value) inputEl.placeholder = key ? '•'.repeat(Math.min(key.length,24)) : 'Paste your Google Cloud API key';
}
const cloudSaveBtn = document.getElementById('cloudSaveBtn');
if (cloudSaveBtn){
  cloudSaveBtn.addEventListener('click', function(){
    const val = document.getElementById('cloudKeyInput').value;
    Store.setCloudKey(val);
    document.getElementById('cloudKeyInput').value = '';
    updateCloudStatus();
  });
}
const cloudClearBtn = document.getElementById('cloudClearBtn');
if (cloudClearBtn){
  cloudClearBtn.addEventListener('click', function(){
    Store.setCloudKey('');
    updateCloudStatus();
  });
}

/* =========================================================
   9. INIT
   ========================================================= */
Store.load();
document.getElementById('introStart').addEventListener('click', function(){
  AudioEngine.unlock();
  document.getElementById('intro').style.display = 'none';
  Study.render();
  Study.play();
  Quiz.newQuestion();
});

if ('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    // Fails silently when opened as a local file or in a sandboxed preview —
    // only takes effect once this is hosted on a real https:// origin.
    navigator.serviceWorker.register('sw.js').catch(function(){});
  });
}
