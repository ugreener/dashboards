import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter={n:number;title:string;sub?:string};
export const CHAPTERS:Chapter[]=[
  {n:0,title:'A whole source site disappears'},
  {n:1,title:'Cast of characters',sub:'One job for every resource in the recovery chain'},
  {n:2,title:'Protect the workload',sub:'Discovered application, replicated disks and saved definitions'},
  {n:3,title:'Prove the copy is recent',sub:'Both disks, two scheduled syncs, real writes'},
  {n:4,title:'Freeze the source site',sub:'Keep the hub and arrays running, then initiate in the console'},
  {n:5,title:'Recover while the source is down',sub:'Promote the replicas and restore the guest'},
  {n:6,title:'Measure recovery before source return',sub:'Data verdicts, checker defects and writer shutdown'},
  {n:7,title:'Resume and clean the old source',sub:'A separately authorized post-disaster phase'},
  {n:8,title:'Complete and reverse protection',sub:'Demotion, reprotection and the clock-skew limitation'},
  {n:9,title:'What the test established',sub:'Recovery evidence without overstating the original report'},
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
