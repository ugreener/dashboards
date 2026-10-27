import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter={n:number;title:string;sub?:string};
export const CHAPTERS:Chapter[]=[
  {n:0,title:'Cold open',sub:'A failover that stopped at step two'},
  {n:1,title:'Cast of characters',sub:'One job for every resource in the restore chain'},
  {n:2,title:'The promise',sub:'Four VMs, eight claims, one consistency group'},
  {n:3,title:'The click',sub:'One instruction from the hub, three gates'},
  {n:4,title:'Restore the records',sub:'PVs, PVCs, then the group objects'},
  {n:5,title:'The count that never reaches eight',sub:'One unbound claim keeps the whole app not ready'},
  {n:6,title:'What Kubernetes does with those objects',sub:'Ownership is not identity'},
  {n:7,title:'Why it never finishes',sub:'A loop with no error and no timeout'},
  {n:8,title:'Causes, fix and what remains',sub:'The archive, the branch, and the next run'},
];
export const PHASES_307=['Promise','Click','Restore','Count','Bind','Gate','Causes'];
export type Segment={type:'chapter';chapter:Chapter;from:number;dur:number}|{type:'beat';id:string;chapter:Chapter;from:number;dur:number;audio:number;afterChapter:boolean};
export const PAD_BEFORE=sec(.35);
export const buildTimeline=(chapters:number[])=>{
  const t=timing as Record<string,{seconds:number;pause?:number}>;
  const ids=Object.keys(t).filter(id=>chapters.includes(Number(id.split('.')[0]))).sort((a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);return x[0]-y[0]||x[1]-y[1];});
  const segs:Segment[]=[];let f=0,last=-1;
  for(const id of ids){const ch=CHAPTERS[Number(id.split('.')[0])];const afterChapter=ch.n!==last&&ch.n>0;
    if(afterChapter){segs.push({type:'chapter',chapter:ch,from:f,dur:sec(2.6)});f+=sec(2.6);}
    last=ch.n;const audio=Math.ceil(t[id].seconds*FPS);const dur=PAD_BEFORE+audio+sec(t[id].pause??.8);
    segs.push({type:'beat',id,chapter:ch,from:f,dur,audio,afterChapter});f+=dur;
  }
  return{segs,total:f,beatOrder:ids};
};
