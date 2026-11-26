import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter={n:number;title:string;sub?:string};
export const CHAPTERS:Chapter[]=[
  {n:0,title:'Cold open'},
  {n:1,title:'The cast',sub:'Hub, spokes and the object chain'},
  {n:2,title:'Who creates the copy',sub:'The driver, not the DRPC'},
  {n:3,title:'Who creates what',sub:'Inputs and generated objects'},
  {n:4,title:'The three labels',sub:'Same or different'},
  {n:5,title:'The installer kit',sub:'Eight images, nine containers'},
  {n:6,title:'Where the pieces come from',sub:'Bundle, settings file, offline guide'},
  {n:7,title:'What we installed',sub:'Not the official Dell image'},
  {n:8,title:'The order that works',sub:'Once per cluster'},
  {n:9,title:'The hub question',sub:'Console and storage class'},
  {n:10,title:'Recap',sub:'One sentence per answer'},
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
