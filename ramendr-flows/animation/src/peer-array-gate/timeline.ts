import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter={n:number;title:string;sub?:string};
export const CHAPTERS:Chapter[]=[
  {n:0,title:'A whole source site disappears',sub:'Eight writable disks, zero running applications'},
  {n:1,title:'Cast of characters',sub:'One job for every object in the recovery chain'},
  {n:2,title:'The loss on the clock',sub:'Suspend the nodes, then power off the array'},
  {n:3,title:'Promotion succeeded alone',sub:'Writable disks and bound claims on the target'},
  {n:4,title:'The resync that needs the dead peer',sub:'Reprotect asks an array that is gone'},
  {n:5,title:'One condition closes the gate',sub:'DataReady withholds the object restore'},
  {n:6,title:'Why the peer matters',sub:'Source, documentation, and what stays unproven'},
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
