import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter={n:number;title:string;sub?:string};
export const CHAPTERS:Chapter[]=[
  {n:0,title:'Cold open',sub:'A scheduled move that stopped halfway'},
  {n:1,title:'The words you need',sub:'One concept at a time, before any resource name'},
  {n:2,title:'What protection looked like',sub:'Four machines, eight claims, one copy every two minutes'},
  {n:3,title:'The move order',sub:'One object on the hub, three gates on the target'},
  {n:4,title:'Rebuilding the paperwork',sub:'The disks are there, the labels are not'},
  {n:5,title:'The count that never reaches eight',sub:'Eight requests, six records, one counted as restored'},
  {n:6,title:'Why Kubernetes says Lost',sub:'Ownership is not identity'},
  {n:7,title:'Why it never finishes',sub:'A loop with no error and no timeout'},
  {n:8,title:'Causes, fix and the checklist',sub:'Two independent faults and what each one proves'},
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
