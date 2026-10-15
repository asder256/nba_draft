(function(root){
'use strict';
const cats=['PTS','REB','AST','STL','BLK','3PM','FG%','FT%'];
const complete=p=>cats.every(c=>typeof p.stats[c]==='number'&&Number.isFinite(p.stats[c]));
const slots=['PG','SG','SF','PF','C','G','F','UTIL','UTIL','UTIL','BENCH','BENCH','BENCH'];
const owner=i=>Math.floor(i/9)%2===0?i%9+1:9-i%9;
const eligible=(p,s)=>s==='UTIL'||s==='BENCH'||p.pos.split('/').some(x=>x===s||(s==='G'&&['PG','SG'].includes(x))||(s==='F'&&['SF','PF'].includes(x)));
function assign(roster){
 let matched=Array(13).fill(null);
 function visit(p,seen){for(let s=0;s<13;s++){if(seen.has(s)||!eligible(p,slots[s]))continue;seen.add(s);if(!matched[s]||visit(matched[s],seen)){matched[s]=p;return true;}}return false;}
 return roster.every(p=>visit(p,new Set()))?matched:null;
}
function legal(roster,p,cap){return roster.length<13&&(!cap||roster.filter(x=>x.pos.split('/').includes('C')).length+Number(p.pos.split('/').includes('C'))<=cap)&&!!assign([...roster,p]);}
function model(players){
 const base=players.filter(complete).sort((a,b)=>a.sourceRank-b.sourceRank).slice(0,117);
 return Object.fromEntries(cats.map(c=>{let mean=base.reduce((s,p)=>s+p.stats[c],0)/base.length;let sd=Math.sqrt(base.reduce((s,p)=>s+(p.stats[c]-mean)**2,0)/base.length)||1;return[c,{mean,sd}];}));
}
const z=(p,c,m)=>(p.stats[c]-m[c].mean)/m[c].sd;
function profile(roster,m){roster=roster.filter(complete);return Object.fromEntries(cats.map(c=>[c,roster.length?roster.reduce((s,p)=>s+z(p,c,m),0)/roster.length:0]));}
function weight(c,punts,percent){return punts.includes(c)?0:c.includes('%')?(percent?.35:0):1;}
function rank(players,roster,m,punts,percent,fit=true){let prof=profile(roster,m);return players.map(p=>{if(!complete(p))return{...p,value:null,score:null};let value=0,score=0;for(const c of cats){let w=weight(c,punts,percent);value+=w*z(p,c,m);score+=w*z(p,c,m)*(fit&&roster.length?1+.3*Math.max(0,Math.min(1.5,-prof[c])):1);}return{...p,value,score};}).sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)||a.sourceRank-b.sourceRank);}
const band=z=>!Number.isFinite(z)?'missing':z<=-1?'dark-red':z<0?'light-red':z<1?'light-green':'dark-green';
function restore(s,pool){
 const has=id=>Number.isInteger(id)&&pool.some(p=>p.id===id);
 if(!s||![1,2].includes(s.version))throw Error('Unsupported draft backup.');
 if(s.version===1){
  if(!Number.isInteger(s.slot)||s.slot<1||s.slot>9||!Array.isArray(s.picks)||s.picks.length>117||!s.picks.every(has))throw Error('Invalid legacy picks.');
  s={...s,version:2,picks:s.picks.map((id,i)=>({id,kind:owner(i)===s.slot?'mine':'taken'}))};delete s.slot;
 }
 if(![0,2,3,4].includes(s.cap)||typeof s.percent!=='boolean'||!Array.isArray(s.picks)||s.picks.length>pool.length||s.picks.some(p=>!p||!has(p.id)||!['mine','taken'].includes(p.kind))||new Set(s.picks.map(p=>p.id)).size!==s.picks.length||s.picks.filter(p=>p.kind==='mine').length>13||!Array.isArray(s.punts)||!s.punts.every(c=>cats.includes(c))||!Array.isArray(s.watch)||!s.watch.every(has)||!s.positions||typeof s.positions!=='object'||Array.isArray(s.positions)||!Object.entries(s.positions).every(([id,pos])=>pool.some(p=>String(p.id)===id)&&typeof pos==='string'&&pos.split('/').every(p=>['PG','SG','SF','PF','C'].includes(p))))throw Error('Invalid draft backup.');
 return s;
}
root.DraftEngine={cats,slots,owner,eligible,assign,legal,model,z,profile,rank,complete,band,restore};
if(typeof module!=='undefined')module.exports=root.DraftEngine;
})(globalThis);
