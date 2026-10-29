import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter={n:number;title:string;sub?:string};
export const CHAPTERS:Chapter[]=[
  {n:0,title:'The reprotection window',sub:'One disk waits past the promise'},
  {n:1,title:'Cast of characters',sub:'Two disks, two sessions, one rule'},
  {n:2,title:'The steady state',sub:'Twelve-minute copies before the reversal'},
  {n:3,title:'The reversal',sub:'Failover and reprotect, then the clock restarts'},
  {n:4,title:'The wait',sub:'One disk inside the promise, one outside'},
  {n:5,title:'Why nothing alerted',sub:'A grace period, not a guarantee'},
  {n:6,title:'The same window, another day',sub:'Twice on the same volume'},
  {n:7,title:'The gate and what stays open',sub:'Measure the first copy, not the badge'},
];
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
