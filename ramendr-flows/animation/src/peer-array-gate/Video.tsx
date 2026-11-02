import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp,prog,progIO,sec} from '../lib/anim';
import {ChapterCard,Hud,TimelineBar,TEvent} from '../components/overlays';
import {DefinitionPanel,Def,PhaseTracker,Screenshot} from '../components/newcomer';
import {buildTimeline,PAD_BEFORE,Segment} from './timeline';
import {World,FOCUS,RECT,CH} from './World';
import {BeatPanel,GlossaryScene,PANEL_BEATS,PHASES,ColdOpen} from './Panels';
import BEATS from './beats.json';
type Meta={t?:string;screenshot?:string;focus?:{x:number;y:number;w:number;h:number};caption?:string;define?:{term:string;text:string};card?:{kind:string;name:string;role:string};def?:Def};
const META=BEATS as Record<string,Meta>;
type Cam={x:number;y:number;z:number;sx:number;sy:number};
const CAMS:Record<string,Partial<Cam>>={};
const fit=(id:string):Cam=>{
  const side=!!META[id]?.screenshot||PANEL_BEATS.has(id);
  const keys=FOCUS[id]??Object.keys(RECT);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const key of keys){const r=RECT[key];if(!r)continue;x0=Math.min(x0,r[0]);y0=Math.min(y0,r[1]);x1=Math.max(x1,r[0]+r[2]);y1=Math.max(y1,r[1]+r[3]);}
  if(!Number.isFinite(x0)){x0=70;y0=45;x1=2410;y1=1620;}
  // Include the enclosing region header so a focused card never floats without its site label.
  if(y0>=1310)y0=1240;else if(y0>=1010)y0=955;else if(y0>=750)y0=700;else if(y0>=490)y0=425;else y0=0;
  x0-=40;x1+=40;y1+=65;
  const left=35,right=side?825:1880,top=210,bottom=META[id]?.define?735:900;
  const z=Math.min(1.2,(right-left)/(x1-x0),(bottom-top)/(y1-y0));
  return{x:(x0+x1)/2,y:(y0+y1)/2,z,sx:(left+right)/2,sy:(top+bottom)/2,...CAMS[id]};
};
export const CLOCK:Record<string,string>={
  '2.2':'11:46:58','2.3':'11:47:36','2.4':'11:46:01','2.5':'11:48:26',
  '3.1':'11:48:26','3.2':'11:48:26','3.3':'11:48:26','3.4':'11:48:26','3.5':'11:48:26','3.6':'11:48:26',
  '4.1':'11:48:26','4.2':'11:48:26','4.3':'11:48:26','4.4':'11:48:26','4.5':'11:48:26','4.6':'11:48:26','4.7':'11:48:26',
  '5.1':'11:48:26','5.2':'11:48:26','5.3':'11:48:26','5.4':'11:48:26','5.5':'11:48:26','5.6':'11:48:26','5.7':'11:48:26','5.8':'11:48:26',
  '6.1':'11:48:26','6.2':'11:48:26','6.3':'11:48:26','6.4':'11:48:26','6.5':'11:48:26','6.6':'11:48:26','6.7':'11:48:26','6.8':'11:48:26',
};
const CLOCK_LABELS:Record<string,string>={
  '3.1':'after 11:48:26','3.2':'after 11:48:26','3.3':'after 11:48:26','3.4':'after 11:48:26','3.5':'after 11:48:26','3.6':'after 11:48:26',
  '4.1':'after 11:48:26','4.2':'after 11:48:26','4.3':'after 11:48:26','4.4':'after 11:48:26','4.5':'after 11:48:26','4.6':'after 11:48:26','4.7':'after 11:48:26',
  '5.1':'after 11:48:26','5.2':'after 11:48:26','5.3':'after 11:48:26','5.4':'after 11:48:26','5.5':'after 11:48:26','5.6':'after 11:48:26','5.7':'after 11:48:26','5.8':'after 11:48:26',
  '6.1':'after 11:48:26','6.2':'after 11:48:26','6.3':'after 11:48:26','6.4':'not this run','6.5':'not this run','6.6':'after 11:48:26','6.7':'after 11:48:26','6.8':'after 11:48:26',
};
const EVENTS_PAG:TEvent[]=[
  ['11:35:41','oldest last sync',C.amber],
  ['11:46:01','newest last sync',C.amber],
  ['11:46:58','VSA-B powered off',C.red],
  ['11:47:36','initiate 1',C.blue],
  ['11:47:52','initiate 2',C.blue],
  ['11:48:11','initiate 3',C.blue],
  ['11:48:26','initiate 4',C.blue],
];
const SFX:Record<string,[number,string,number][]>={'0.1':[[.05,'type',.2],[.5,'whoosh',.2]],'0.3':[[.4,'land',.2]],'2.2':[[.3,'alert',.28]],'2.3':[[.2,'click',.25]],'3.2':[[.4,'chime',.18]],'4.3':[[.35,'alert',.2]],'5.6':[[.4,'flip',.18]],'5.7':[[.2,'tick',.16]],'6.8':[[.3,'chime',.2]]};
export const PeerArrayGate:React.FC<{chapters:number[]}>=({chapters})=>{
  const frame=useCurrentFrame();const {segs}=buildTimeline(chapters);
  const beats=segs.filter((s):s is Extract<Segment,{type:'beat'}>=>s.type==='beat');
  const seg=segs.find(s=>frame>=s.from&&frame<s.from+s.dur)??segs[segs.length-1];
  if(!seg)return <AbsoluteFill style={{background:C.bg}}/>;
  const b=seg.type==='beat'?seg:beats.find(v=>v.from>=seg.from)??beats[beats.length-1];
  const i=beats.indexOf(b),prev=i>0&&!b.afterChapter?beats[i-1].id:b.id;
  const f=seg.type==='beat'?frame-b.from-PAD_BEFORE:-PAD_BEFORE;
  const target=fit(b.id),old=fit(prev);const p=progIO(f,-PAD_BEFORE,sec(1.6));
  const cam={x:lerp(old.x,target.x,p),y:lerp(old.y,target.y,p),z:lerp(old.z,target.z,p),sx:lerp(old.sx,target.sx,p),sy:lerp(old.sy,target.sy,p)};
  const ch=b.chapter.n,m=META[b.id]??{};
  const win=(a:number,z:number)=>Math.min(prog(f,b.audio*a,b.audio*a+22),1-prog(f,b.audio*z-22,b.audio*z));
  const seen=new Map<string,{at:number;name:string;v:number}>();
  for(const beat of beats){
    const base=beat.from+PAD_BEFORE;const list:[number,string,number][]=[...(SFX[beat.id]??[])];
    for(const [id,frac]of CH)if(id===beat.id)list.push([frac,'flip',.18]);
    if(META[beat.id]?.screenshot)list.push([.14,'whoosh',.16]);
    if(META[beat.id]?.card)list.push([.04,'pop',.17]);
    for(const [frac,name,v]of list){const at=base+Math.round(frac*beat.audio);const k=`${at}-${name}`;const cur=seen.get(k);if(!cur||cur.v<v)seen.set(k,{at,name,v});}
  }
  const cues=[...seen.values()];
  return <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`,overflow:'hidden'}}>
    {ch>=2?<div style={{position:'absolute',transformOrigin:'0 0',transform:`translate(${cam.sx-cam.x*cam.z}px,${cam.sy-cam.y*cam.z}px) scale(${cam.z})`}}><World c={{id:b.id,f,dur:b.audio,zoom:cam.z}}/></div>:null}
    {seg.type==='beat'&&ch===0?<ColdOpen id={b.id} f={f} dur={b.audio}/>:null}
    {seg.type==='beat'&&ch===1?<GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def}/>:null}
    {seg.type==='beat'?<Hud chapter={b.chapter.title} clock={CLOCK_LABELS[b.id]??CLOCK[b.id]??null} ticket="DFBUGS-12519"/>:null}
    {seg.type==='beat'&&ch>=2?<PhaseTracker current={ch-2} phases={PHASES}/>:null}
    {seg.type==='beat'&&ch>=3?<TimelineBar now={CLOCK[b.id]??null} events={EVENTS_PAG}/>:null}
    {seg.type==='beat'?<BeatPanel id={b.id} f={f} dur={b.audio}/>:null}
    {seg.type==='beat'&&m.screenshot?<Screenshot src={`evidence/peer-array-gate/${m.screenshot}`} date="2026-10-29" caption={m.caption??''} focus={m.focus} a={win(.14,.98)} z={progIO(f,b.audio*.2,b.audio*.65)} y={215} x={865} w={1010} sourceLabel="hub console · historical capture"/>:null}
    {seg.type==='beat'&&m.define?<DefinitionPanel term={m.define.term} text={m.define.text} a={win(.05,.97)} bottom={150}/>:null}
    {seg.type==='chapter'?<ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame-seg.from,0,30)} out={prog(frame-seg.from,seg.dur-30,seg.dur)}/>:null}
    {beats.map(beat=><Sequence key={beat.id} from={beat.from+PAD_BEFORE} durationInFrames={beat.audio+10}><Audio src={staticFile(`audio/peer-array-gate/${beat.id}.wav`)} volume={.72}/></Sequence>)}
    {cues.map((cue,k)=><Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v}/></Sequence>)}
  </AbsoluteFill>;
};
