import {createHash} from 'node:crypto';
import {dailyPuzzle} from './content.mjs';
import {transaction} from './store.mjs';
import {validDay} from './validation.mjs';
// Frozen legacy rule for pre-snapshot games: do not reorder.
function legacyPuzzle(day){const n=Math.floor(Date.parse(day+'T00:00:00Z')/86400000),pairs=[['кот','кит'],['сон','сом'],['мир','миг'],['лук','люк'],['чай','май'],['дом','дым'],['лес','лис']];const [word,odd]=pairs[((n%7)+7)%7];return {word,odd,answer:((n*17+11)%25+25)%25};}
export function puzzleSnapshots(db,resolver=dailyPuzzle){
 db.exec('CREATE TABLE IF NOT EXISTS daily_puzzles(day TEXT PRIMARY KEY,id TEXT NOT NULL,payload TEXT NOT NULL)');
 return day=>{
  validDay(day);
  return transaction(db,()=>{
   const saved=db.prepare('SELECT id,payload FROM daily_puzzles WHERE day=?').get(day);
   if(saved)return {...JSON.parse(saved.payload),id:saved.id};
   // Existing attempts predate snapshots: retain the frozen legacy rule for those days.
   const legacy=db.prepare('SELECT 1 FROM games WHERE day=? LIMIT 1').get(day);
   const p=(legacy?legacyPuzzle:resolver)(day);
   if(!p||!['word','odd'].every(k=>typeof p[k]==='string'&&p[k].trim()&&p[k].length<=80)||p.word===p.odd||!Number.isInteger(p.answer)||p.answer<0||p.answer>24)throw new Error('Invalid daily puzzle');
   const payload=JSON.stringify({word:p.word,odd:p.odd,answer:p.answer});
   const id=createHash('sha256').update(day+'\n'+payload).digest('hex');
   db.prepare('INSERT INTO daily_puzzles VALUES(?,?,?)').run(day,id,payload);
   return {...JSON.parse(payload),id};
  });
 };
}
