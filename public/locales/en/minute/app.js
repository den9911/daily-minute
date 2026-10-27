import { $, $$, api, escape, action, share, storage } from '/locales/en/shared/ui.js';
export async function mount(){
  let state=await api('/api/minute'),started=state.game?.started??null,timer=null;
  function result(game){
    const elapsed=game.finished-game.started;
    const records=storage.get('daily-results',{});records[state.day]={attempts:game.attempts,elapsed};
    const keys=Object.keys(records).sort().slice(-60);storage.set('daily-results',Object.fromEntries(keys.map(k=>[k,records[k]])));
    $('#app').innerHTML=`<div class="narrow panel stack"><p class="eyebrow">${escape(state.day)} / DONE</p><h2>Found it! Sharp eyes.</h2><p class="big-result counter">${(elapsed/1000).toFixed(1)} <span class="muted">s</span></p><p>Attempts: ${game.attempts}. Solved today by ${Math.max(1,state.completed)} visitors.</p><button id="share">Compare with friends ↗</button><p class="small muted">The next puzzle arrives at midnight Moscow time. There is no time limit.</p>${keys.length?`<div class="divider"></div><h3>Your recent results</h3>${keys.slice(-7).reverse().map(k=>`<div class="row between small"><span>${escape(k)}</span><span>${(records[k].elapsed/1000).toFixed(1)} s · ${records[k].attempts} attempts</span></div>`).join('')}<p class="small muted">Your history stays in this browser.</p>`:''}</div>`;
    action($('#share'),()=>share(`${location.origin}/minute/`,'Daily Minute',`Daily Minute · ${state.day}\nFound the odd word in ${(elapsed/1000).toFixed(1)} s, attempts: ${game.attempts}. Your turn?`));
  }
  function board(cells){
    $('#app').innerHTML=`<div class="narrow"><div class="row between"><p class="small muted">${escape(state.day)} · find the different word</p><strong id="elapsed" class="timer counter">0.0 s</strong></div><div class="minute-board">${cells.map((word,i)=>`<button class="minute-cell" data-index="${i}" aria-label="${escape(word)}, cell ${i+1}">${escape(word)}</button>`).join('')}</div><p id="hint" class="small muted">Take your time. Tap the word that is different.</p></div>`;
    timer=setInterval(()=>{if($('#elapsed'))$('#elapsed').textContent=`${Math.max(0,(Date.now()-started)/1000).toFixed(1)} s`;},100);
    let pending=false;
    $$('.minute-cell').forEach(button=>action(button,async()=>{if(pending)return;pending=true;try{const response=await api('/api/minute/guess',{index:Number(button.dataset.index),day:state.day});if(response.correct){clearInterval(timer);state=await api('/api/minute');result(state.game);}else{button.classList.add('wrong');$('#hint').textContent=`Not that one. Attempts so far: ${response.attempts}. Take another look.`;}}finally{pending=false;}}));
  }
  if(state.game?.finished)result(state.game);
  else if(state.game){board(state.cells);}
  else{
    $('#app').innerHTML=`<div class="narrow panel stack"><p class="eyebrow">ONE SHARED DAILY CHALLENGE</p><h2>Twenty-five words.<br>One is different.</h2><p class="muted">Today, find ‘${escape(state.odd)}» among ‘${escape(state.word)}». The timer starts when you open the board.</p><button id="start">Start ↗</button><p class="small muted">Solved today: ${state.completed}. Answers and attempts are saved on the server for this browser session.</p></div>`;
    action($('#start'),async()=>{const data=await api('/api/minute/start',{});state=await api('/api/minute');started=state.game.started;board(data.cells);});
  }
  window.addEventListener('pagehide',()=>clearInterval(timer));
}
