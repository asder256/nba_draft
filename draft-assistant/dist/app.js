'use strict';
const E=DraftEngine,$=id=>document.getElementById(id),KEY='on-the-clock-v1';
const fresh=()=>({version:2,cap:3,percent:true,picks:[],punts:[],watch:[],positions:{}});
let state=fresh(),editId=null;
try{const raw=localStorage.getItem(KEY);if(raw)state=E.restore(JSON.parse(raw),PLAYER_POOL);}catch{$('notice').textContent='Saved draft could not be loaded. Restore a backup or export regularly if storage is unavailable.';}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('save-status').textContent='· saved';}catch{$('save-status').textContent='· storage unavailable: export a backup';}}
function players(){return PLAYER_POOL.map(p=>({...p,pos:state.positions[p.id]||p.pos}));}
function roster(ps=players()){return state.picks.filter(p=>p.kind==='mine').map(p=>ps.find(x=>x.id===p.id));}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function note(s){$('notice').textContent=s;}
function pick(id,kind){if(state.picks.some(p=>p.id===id))return;const ps=players(),p=ps.find(p=>p.id===id);if(!p)return;if(kind==='mine'&&!E.legal(roster(ps),p,state.cap)){note('This player exceeds your center cap or cannot fit your roster. Check ESPN eligibility or the cap.');return;}state.picks.push({id,kind});note(`${p.name} ${kind==='mine'?'added to your team':'marked drafted by someone else'}.`);save();render();}
const definitions={'PTS':'Points per game','REB':'Rebounds per game','AST':'Assists per game','STL':'Steals per game','BLK':'Blocks per game','3PM':'Three-pointers made per game','FG%':'Field-goal percentage: share of field-goal attempts made','FT%':'Free-throw percentage: share of free-throw attempts made'};
const bandNames={'dark-red':'Well below baseline','light-red':'Below baseline','light-green':'At or above baseline','dark-green':'Well above baseline',missing:'No projection'};
const fmt=(n,c)=>n===null?'—':n.toFixed(1)+(c.includes('%')?'%':'');
const category=c=>`<abbr tabindex="0" data-tip="${esc(definitions[c])}">${c}</abbr>`;
function stat(p,c,m,compact=false){const band=E.band(p.stats[c]===null?NaN:E.z(p,c,m));return `<span tabindex="0" class="stat ${band}" data-tip="${esc(definitions[c]+'. '+bandNames[band]+'. Baseline: '+fmt(m[c].mean,c)+'.'+(c.includes('%')?' Percentage only; shooting volume is unavailable.':''))}">${compact?`<small>${c}</small>`:''}${fmt(p.stats[c],c)}</span>`;}
function buttons(p,mine){return `<div class="pick-actions"><button class="small" data-pick="${p.id}" aria-label="Draft ${esc(p.name)} to my team" ${E.legal(mine,p,state.cap)?'':'disabled'}>Draft</button><button class="small taken" data-taken="${p.id}" aria-label="Mark ${esc(p.name)} drafted by someone else">Drafted</button></div>`;}
function watch(id){state.watch=state.watch.includes(id)?state.watch.filter(x=>x!==id):[...state.watch,id];save();render();}
function render(){
 const ps=players(),m=E.model(ps),mine=roster(ps),available=ps.filter(p=>!state.picks.some(x=>x.id===p.id)),ranked=E.rank(available,mine,m,state.punts,state.percent),prof=E.profile(mine,m);
 $('cap').value=state.cap;$('percent').checked=state.percent;$('undo').disabled=!state.picks.length;
 $('clock').innerHTML=`<span>YOUR TEAM</span><strong>${mine.length} / 13 drafted</strong>`;
 $('next').textContent=mine.length===13?'Your roster is complete':'Ranked for your team';
 const top=ranked.filter(p=>E.complete(p)&&E.legal(mine,p,state.cap)).slice(0,5);
 $('shortlist').innerHTML=top.map((p,i)=>{const active=E.cats.filter(c=>!state.punts.includes(c)&&(state.percent||!c.includes('%'))),strengths=active.slice().sort((a,b)=>E.z(p,b,m)-E.z(p,a,m)).slice(0,2),weak=active.slice().sort((a,b)=>E.z(p,a,m)-E.z(p,b,m))[0],need=active.filter(c=>prof[c]<-.25&&E.z(p,c,m)>0).sort((a,b)=>prof[a]-prof[b])[0];return `<article class="pick-card"><span class="pick-number">0${i+1}</span><div><h3>${esc(p.name)}</h3><p class="meta">${esc(p.pos)} · ${esc(p.team)} · source #${p.sourceRank}</p><p>Best contributions: <b>${strengths.map(category).join(' + ')}</b>. ${need?`Helps your ${category(need)} gap.`:mine.length?'Strong available value for your selected categories.':'Keeps your opening focused on value.'}</p><p class="tradeoff">${weak&&E.z(p,weak,m)<0?`Tradeoff: below baseline in ${category(weak)}.`:'No below-baseline category in this model.'}</p></div>${buttons(p,mine)}<div class="card-stats">${E.cats.map(c=>stat(p,c,m,true)).join('')}</div></article>`;}).join('')||'<p class="empty">No eligible picks remain for your roster. Check positions or the center cap.</p>';
 let list=ranked.filter(p=>(p.name+' '+p.team).toLowerCase().includes($('search').value.toLowerCase())&&(!$('position').value||p.pos.split('/').includes($('position').value))&&(!$('watchonly').checked||state.watch.includes(p.id)));
 if($('sort').value==='source')list.sort((a,b)=>a.sourceRank-b.sourceRank);if($('sort').value==='value')list.sort((a,b)=>(b.value??-Infinity)-(a.value??-Infinity));
 $('count').textContent=`${list.length} shown · ${available.length} available`;
 $('baseline').innerHTML=`<td></td><td><b>Baseline</b><small>Fixed comparison average</small></td><td colspan="2">Top 117*</td>${E.cats.map(c=>`<td>${fmt(m[c].mean,c)}</td>`).join('')}<td></td>`;
 $('board').innerHTML=list.map(p=>`<tr><td><button class="star ${state.watch.includes(p.id)?'active':''}" data-watch="${p.id}" aria-label="${state.watch.includes(p.id)?'Unwatch':'Watch'} ${esc(p.name)}">${state.watch.includes(p.id)?'★':'☆'}</button></td><td><b>${esc(p.name)}</b><small><button class="text" data-edit="${p.id}" title="Edit ESPN eligibility">${esc(p.pos)}</button> · ${esc(p.team)}${E.complete(p)?'':' · Missing projections'}</small></td><td>${p.sourceRank}</td><td class="score">${p.score===null?'Unscored':p.score.toFixed(1)}</td>${E.cats.map(c=>`<td>${stat(p,c,m)}</td>`).join('')}<td>${buttons(p,mine)}</td></tr>`).join('')||'<tr><td colspan="13">No matching players.</td></tr>';
 $('punts').innerHTML=E.cats.map(c=>`<button class="chip ${state.punts.includes(c)?'selected':''}" aria-pressed="${state.punts.includes(c)}" data-punt="${c}" data-tip="${esc(definitions[c])}. Toggle punting this category.">${c}</button>`).join('');
 const active=E.cats.filter(c=>!state.punts.includes(c)&&(state.percent||!c.includes('%'))),weak=active.slice().sort((a,b)=>prof[a]-prof[b])[0];
 let advice=mine.length<3?'Stay flexible. Review category direction after your third pick.':weak&&prof[weak]<-.65?`Consider reviewing ${weak}: your roster is below the draft-pool baseline. ${available.filter(p=>E.complete(p)&&E.z(p,weak,m)>.75&&E.legal(mine,p,state.cap)).length} eligible available players are strong in it. Compare repairing it against a punt before deciding.`:'Stay balanced in your remaining categories. There is no clear punt signal from this roster profile.';
 if(state.punts.length>=3)advice='Three or more punts leave at most five categories to win. This is a very narrow route to a weekly victory. '+advice;
 if(weak?.includes('%')&&mine.length>=3)advice+=' Percentage advice has low confidence because attempts are missing.';
 const known=mine.filter(E.complete);
 $('advice').textContent=known.length<mine.length?'Roster analysis is incomplete: a drafted player has no projections. Missing players are excluded from category averages.':advice;
 $('profile').innerHTML=E.cats.map(c=>{let avg=known.length?known.reduce((s,p)=>s+p.stats[c],0)/known.length:0;let label=state.punts.includes(c)?'Punt':!known.length?'No data':prof[c]>.4?'Strength':prof[c]<-.4?'Needs help':'Competitive';return `<div class="category"><span><b>${category(c)}</b><small>${label}${c.includes('%')?' · estimate':''}</small></span><div class="meter"><i style="width:${Math.max(3,Math.min(100,50+prof[c]*22))}%" class="${state.punts.includes(c)?'off':prof[c]<-.4?'low':''}"></i></div><span>${known.length?avg.toFixed(1):'—'}</span></div>`;}).join('')+'<p class="muted tiny">Average per player/game; percentages are unweighted. Strength labels compare with the source top 117, not opponent win odds.</p>';
 const selected=mine,assigned=E.assign(selected);$('roster-count').textContent=`${selected.length}/13 players · ${selected.filter(p=>p.pos.split('/').includes('C')).length}${state.cap?'/'+state.cap:''} centers`;
 $('roster').innerHTML=assigned?assigned.map((p,i)=>`<div class="roster-row"><span>${E.slots[i]}</span>${p?`<b>${esc(p.name)}</b><button class="text" data-edit="${p.id}">${esc(p.pos)}</button>`:'<em>Open</em>'}</div>`).join(''):'<p>Positions do not fit. Edit eligibility to match ESPN.</p>';
 if(state.cap&&selected.filter(p=>p.pos.split('/').includes('C')).length>state.cap)$('roster-count').textContent+=' · OVER CAP';
 $('history').innerHTML=state.picks.slice(-12).reverse().map(({id,kind})=>`<li><span>${kind==='mine'?'Your team':'Drafted'}</span> ${esc(ps.find(p=>p.id===id).name)}</li>`).join('')||'<p class="muted">Your draft starts here.</p>';
}
$('cap').onchange=()=>{state.cap=+$('cap').value;save();render();};$('percent').onchange=()=>{state.percent=$('percent').checked;save();render();};
for(const id of ['search','position','sort','watchonly'])$(id).addEventListener('input',render);
$('undo').onclick=()=>{state.picks.pop();save();note('Last pick undone.');render();};
$('balanced').onclick=()=>{state.punts=[];save();render();};
$('reset').onclick=()=>{if(confirm('Clear all drafted picks and punts? Your watchlist and position edits will be kept.')){state.picks=[];state.punts=[];save();note('Draft reset.');render();}};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.pick!==undefined)pick(+b.dataset.pick,'mine');if(b.dataset.taken!==undefined)pick(+b.dataset.taken,'taken');if(b.dataset.watch!==undefined)watch(+b.dataset.watch);if(b.dataset.punt){let c=b.dataset.punt;state.punts=state.punts.includes(c)?state.punts.filter(x=>x!==c):[...state.punts,c];save();render();}if(b.dataset.edit!==undefined){editId=+b.dataset.edit;const p=players().find(p=>p.id===editId);$('edit-name').textContent=p.name;$('edit-options').innerHTML=['PG','SG','SF','PF','C'].map(pos=>`<label class="check"><input type="checkbox" value="${pos}" ${p.pos.split('/').includes(pos)?'checked':''}>${pos}</label>`).join('');$('edit').showModal();}});
$('save-pos').onclick=e=>{const pos=[...$('edit-options').querySelectorAll('input:checked')].map(x=>x.value);if(!pos.length){e.preventDefault();return;}state.positions[editId]=pos.join('/');save();render();};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nba-draft-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('restore').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const s=E.restore(JSON.parse(await file.text()),PLAYER_POOL);if(state.picks.length&&!confirm('Replace the current draft with this backup?'))return;state=s;save();render();note('Draft restored.');}catch(err){note('Restore failed: '+err.message);}finally{e.target.value='';}};
render();

const tooltip=$('tooltip');
function showTip(target){const el=target.closest('[data-tip]');if(!el)return;tooltip.textContent=el.dataset.tip;tooltip.hidden=false;el.setAttribute('aria-describedby','tooltip');const box=el.getBoundingClientRect();tooltip.style.left=Math.max(8,Math.min(box.left,innerWidth-tooltip.offsetWidth-8))+'px';tooltip.style.top=Math.max(8,box.top-tooltip.offsetHeight-8)+'px';}
function hideTip(){tooltip.hidden=true;document.querySelectorAll('[aria-describedby="tooltip"]').forEach(el=>el.removeAttribute('aria-describedby'));}
document.addEventListener('mouseover',e=>{hideTip();showTip(e.target);});
document.addEventListener('focusin',e=>{hideTip();showTip(e.target);});
document.addEventListener('mouseout',hideTip);document.addEventListener('focusout',hideTip);document.addEventListener('scroll',hideTip,true);document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();});
document.querySelectorAll('th[data-category]').forEach(th=>th.innerHTML=category(th.dataset.category));
