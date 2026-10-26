import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter={n:number;title:string;sub?:string};
export const CHAPTERS:Chapter[]=[
  {n:0,title:'Relocate: the return and the next copy',sub:'A recorded handoff and its independent storage checks'},
  {n:1,title:'Cast of characters',sub:'One job for every object in the return'},
  {n:2,title:'The starting state',sub:'Application on spoke-0, preferred site spoke-1'},
  {n:3,title:'The planned move',sub:'Progress labels, source removal, and the safety gates'},
  {n:4,title:'Home again',sub:'Promote, bind the original handles, boot the guest'},
  {n:5,title:'The old site',sub:'Automatic cleanup and the reversed arrays'},
  {n:6,title:'Verify continuing protection',sub:'Missing future timestamps, manual syncs, and later jobs'},
  {n:7,title:'Verify and recap',sub:'What the run proves, and what it does not'},
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
