import { $, $$, api, escape, action, share, storage } from '/locales/es/shared/ui.js';
export async function mount(){
  let state=await api('/api/minute'),started=state.game?.started??null,timer=null;
  function result(game){
    const elapsed=game.finished-game.started;
    const records=storage.get('daily-results',{});records[state.day]={attempts:game.attempts,elapsed};
    const keys=Object.keys(records).sort().slice(-60);storage.set('daily-results',Object.fromEntries(keys.map(k=>[k,records[k]])));
    $('#app').innerHTML=`<div class="narrow panel stack"><p class="eyebrow">${escape(state.day)} / RESUELTO</p><h2>¡Lo encontraste! Buena vista.</h2><p class="big-result counter">${(elapsed/1000).toFixed(1)} <span class="muted">s</span></p><p>Intentos: ${game.attempts}. Lo han resuelto hoy ${Math.max(1,state.completed)} visitantes.</p><button id="share">Comparar con amigos ↗</button><p class="small muted">El siguiente reto llega a medianoche de Moscú. No hay límite de tiempo.</p>${keys.length?`<div class="divider"></div><h3>Tus resultados recientes</h3>${keys.slice(-7).reverse().map(k=>`<div class="row between small"><span>${escape(k)}</span><span>${(records[k].elapsed/1000).toFixed(1)} s · ${records[k].attempts} intentos</span></div>`).join('')}<p class="small muted">El historial se guarda solo en este navegador.</p>`:''}</div>`;
    action($('#share'),()=>share(`${location.origin}/minute/`,'Minuto diario',`Minuto diario · ${state.day}\nEncontré la palabra diferente en ${(elapsed/1000).toFixed(1)} s, intentos: ${game.attempts}. ¿Lo intentas?`));
  }
  function board(cells){
    $('#app').innerHTML=`<div class="narrow"><div class="row between"><p class="small muted">${escape(state.day)} · encuentra la palabra diferente</p><strong id="elapsed" class="timer counter">0.0 s</strong></div><div class="minute-board">${cells.map((word,i)=>`<button class="minute-cell" data-index="${i}" aria-label="${escape(word)}, casilla ${i+1}">${escape(word)}</button>`).join('')}</div><p id="hint" class="small muted">Sin prisas. Pulsa la palabra diferente.</p></div>`;
    timer=setInterval(()=>{if($('#elapsed'))$('#elapsed').textContent=`${Math.max(0,(Date.now()-started)/1000).toFixed(1)} s`;},100);
    let pending=false;
    $$('.minute-cell').forEach(button=>action(button,async()=>{if(pending)return;pending=true;try{const response=await api('/api/minute/guess',{index:Number(button.dataset.index),day:state.day});if(response.correct){clearInterval(timer);state=await api('/api/minute');result(state.game);}else{button.classList.add('wrong');$('#hint').textContent=`Esa no. Intentos: ${response.attempts}. Mira otra vez.`;}}finally{pending=false;}}));
  }
  if(state.game?.finished)result(state.game);
  else if(state.game){board(state.cells);}
  else{
    $('#app').innerHTML=`<div class="narrow panel stack"><p class="eyebrow">UN RETO DIARIO PARA TODOS</p><h2>Veinticinco palabras.<br>Una es diferente.</h2><p class="muted">Hoy buscamos «${escape(state.odd)}» entre «${escape(state.word)}». El tiempo empieza cuando abres el tablero.</p><button id="start">Empezar ↗</button><p class="small muted">Resuelto hoy: ${state.completed}. Las respuestas y los intentos se guardan para esta sesión del navegador.</p></div>`;
    action($('#start'),async()=>{const data=await api('/api/minute/start',{});state=await api('/api/minute');started=state.game.started;board(data.cells);});
  }
  window.addEventListener('pagehide',()=>clearInterval(timer));
}
