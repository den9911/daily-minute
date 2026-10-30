import { $, $$, api, escape, action, share, storage } from '/shared/ui.js';
export async function mount(){
  let state=await api('/api/minute'),started=state.game?.started??null,timer=null;
  function result(game){
    const elapsed=game.finished-game.started;
    const records=storage.get('daily-results',{});records[state.day]={attempts:game.attempts,elapsed};
    const keys=Object.keys(records).sort().slice(-60);storage.set('daily-results',Object.fromEntries(keys.map(k=>[k,records[k]])));
    $('#app').innerHTML=`<div class="narrow panel stack"><p class="eyebrow">${escape(state.day)} / ГОТОВО</p><h2>Есть! Глаз — алмаз.</h2><p class="big-result counter">${(elapsed/1000).toFixed(1)} <span class="muted">с</span></p><p>Попыток: ${game.attempts}. Сегодня задачу решили ${Math.max(1,state.completed)} посетителей.</p><button id="share">Сравнить с друзьями ↗</button><button id="practice" class="secondary">Тренировка ↗</button><p class="small muted">Следующее задание — после полуночи по Москве. Таймер не ограничивает игру.</p>${keys.length?`<div class="divider"></div><h3>Твои последние результаты</h3>${keys.slice(-7).reverse().map(k=>`<div class="row between small"><span>${escape(k)}</span><span>${(records[k].elapsed/1000).toFixed(1)} с · ${records[k].attempts} попыток</span></div>`).join('')}<p class="small muted">История хранится только в этом браузере.</p>`:''}</div>`;
    action($('#practice'),practice);
    action($('#share'),()=>share(`${location.origin}/minute/`,'Минута',`Минута · ${state.day}\nНашёл лишнее за ${(elapsed/1000).toFixed(1)} с, попыток: ${game.attempts}. Попробуешь?`));
  }
  function practice(){
    clearInterval(timer);
    const pairs=[['кот','кит'],['сон','сом'],['мир','миг'],['лук','люк'],['чай','май'],['дом','дым'],['лес','лис']];
    const [word,odd]=pairs[Math.floor(Math.random()*pairs.length)],answer=Math.floor(Math.random()*25),cells=Array.from({length:25},(_,i)=>i===answer?odd:word);
    let attempts=0,done=false;const start=performance.now();
    $('#app').innerHTML=`<div class="narrow"><div class="row between"><p class="small muted">ТРЕНИРОВКА · результат не сохраняется</p><strong id="practice-time" class="timer counter">0.0 с</strong></div><div class="minute-board">${cells.map((item,i)=>`<button class="minute-cell practice-cell" data-index="${i}" aria-label="${escape(item)}, ячейка ${i+1}">${escape(item)}</button>`).join('')}</div><p id="practice-hint" class="small muted">Найди другое слово. Тренировка не влияет на ежедневный результат.</p><div class="row"><button id="again" class="secondary">Новое задание</button><button id="back" class="text-button">К заданию дня</button></div></div>`;
    timer=setInterval(()=>{if($('#practice-time'))$('#practice-time').textContent=`${((performance.now()-start)/1000).toFixed(1)} с`;},100);
    $$('.practice-cell').forEach(button=>action(button,()=>{if(done)return;attempts++;if(Number(button.dataset.index)===answer){done=true;clearInterval(timer);button.classList.add('correct');$('#practice-hint').textContent=`Найдено! Попыток: ${attempts}.`; }else button.classList.add('wrong');}));
    action($('#again'),practice);action($('#back'),()=>location.reload());
  }
  function board(cells){
    $('#app').innerHTML=`<div class="narrow"><div class="row between"><p class="small muted">${escape(state.day)} · найди другое слово</p><strong id="elapsed" class="timer counter">0.0 с</strong></div><div class="minute-board">${cells.map((word,i)=>`<button class="minute-cell" data-index="${i}" aria-label="${escape(word)}, ячейка ${i+1}">${escape(word)}</button>`).join('')}</div><p id="hint" class="small muted">Спешить необязательно. Нажми на слово, которое отличается от остальных.</p></div>`;
    timer=setInterval(()=>{if($('#elapsed'))$('#elapsed').textContent=`${Math.max(0,(Date.now()-started)/1000).toFixed(1)} с`;},100);
    let pending=false;
    $$('.minute-cell').forEach(button=>action(button,async()=>{if(pending)return;pending=true;try{const response=await api('/api/minute/guess',{index:Number(button.dataset.index),day:state.day});if(response.correct){clearInterval(timer);state=await api('/api/minute');result(state.game);}else{button.classList.add('wrong');$('#hint').textContent=`Не оно. Уже попыток: ${response.attempts}. Присмотрись ещё.`;}}finally{pending=false;}}));
  }
  if(state.game?.finished)result(state.game);
  else if(state.game){board(state.cells);}
  else{
    $('#app').innerHTML=`<div class="narrow panel stack"><p class="eyebrow">ОДНО ЗАДАНИЕ НА ВЕСЬ ДЕНЬ</p><h2>Двадцать пять слов.<br>Одно отличается.</h2><p class="muted">Сегодня ищем «${escape(state.odd)}» среди «${escape(state.word)}». Время пойдёт, когда откроешь поле.</p><div class="row"><button id="start">Начать ↗</button><button id="practice" class="secondary">Тренировка ↗</button></div><p class="small muted">Решили сегодня: ${state.completed}. Ответы и попытки сохраняются на сервере за этой сессией браузера.</p></div>`;
    action($('#practice'),practice);
    action($('#start'),async()=>{const data=await api('/api/minute/start',{});state=await api('/api/minute');started=state.game.started;board(data.cells);});
  }
  window.addEventListener('pagehide',()=>clearInterval(timer));
}
