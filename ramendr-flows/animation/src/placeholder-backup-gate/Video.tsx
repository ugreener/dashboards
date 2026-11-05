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
  if(!Number.isFinite(x0)){x0=70;y0=45;x1=2410;y1=1850;}
  // Include the enclosing region header so a focused card never floats without its site label.
  if(y0>=1540)y0=1490;else if(y0>=1250)y0=1190;else if(y0>=990)y0=930;else if(y0>=730)y0=670;else if(y0>=470)y0=410;else y0=0;
  x0-=40;x1+=40;y1+=65;
  const left=35,right=side?825:1880,top=210,bottom=META[id]?.define?735:900;
  const z=Math.min(1.2,(right-left)/(x1-x0),(bottom-top)/(y1-y0));
  return{x:(x0+x1)/2,y:(y0+y1)/2,z,sx:(left+right)/2,sy:(top+bottom)/2,...CAMS[id]};
};
export const CLOCK:Record<string,string>={
  '2.2':'07:54:07','2.3':'08:01:13','2.4':'08:03:00','2.5':'08:03:00','2.6':'08:03:00','2.7':'08:03:00','2.8':'08:03:00','2.9':'08:10:00',
  '2.10':'08:03:00','2.11':'08:03:00','2.12':'08:03:00',
  '3.1':'08:03:00','3.2':'08:03:00','3.3':'08:03:00','3.4':'08:03:00','3.5':'08:03:00','3.6':'08:03:00','3.7':'08:03:00','3.8':'08:03:00',
  '3.9':'08:03:00','3.10':'08:03:00','3.11':'08:03:52','3.12':'08:03:52','3.13':'08:03:52','3.14':'08:03:52','3.15':'08:03:52','3.16':'08:03:52',
  '4.1':'08:03:52','4.2':'08:03:52','4.3':'08:03:52','4.4':'08:03:52','4.5':'08:05:57','4.6':'08:05:57','4.7':'08:05:57',
  '4.8':'08:03:40','4.9':'08:03:40','4.10':'08:03:40','4.11':'08:10:00',
  '7.1':'08:05:57',
};
const CLOCK_LABELS:Record<string,string>={
  '4.12':'not this run','4.13':'not this run','4.14':'not this run',
  '5.1':'19 October','5.2':'19 October','5.3':'19 October','5.4':'28 October','5.5':'29 October','5.6':'not this run','5.7':'not this run',
  '5.8':'not this run','5.9':'not this run','5.10':'not this run','5.11':'not this run',
  '6.1':'not this run','6.2':'not this run','6.3':'4 November','6.4':'not this run','6.5':'not this run','6.6':'not this run',
  '6.7':'not this run','6.8':'not this run','6.9':'not this run','6.10':'not this run','6.11':'not this run','6.12':'not this run',
};
const EVENTS: TEvent[]=[
  ['07:49','object sync stops',C.amber],
  ['07:54:07','Relocate',C.blue],
  ['08:01:13','source VM deleted',C.orange],
  ['08:03:20','source claims gone',C.orange],
  ['08:03:52','restore refused',C.red],
  ['08:05:57','retry logged',C.red],
  ['08:10','PVCs synced',C.green],
];
const SHOT_DATE:Record<string,string>={
  '2.9':'2026-11-05','3.11':'2026-10-29','4.11':'2026-11-05',
};
const SFX:Record<string,[number,string,number][]>={
  '0.1':[[.05,'type',.2],[.55,'whoosh',.2]],
  '0.3':[[.45,'land',.22]],
  '2.2':[[.2,'click',.25]],
  '2.4':[[.35,'chime',.18]],
  '2.7':[[.3,'alert',.22]],
  '2.9':[[.2,'whoosh',.16],[.55,'flip',.16]],
  '3.10':[[.3,'alert',.24]],
  '3.11':[[.15,'whoosh',.16]],
  '3.16':[[.4,'land',.2]],
  '4.4':[[.3,'alert',.26]],
  '4.11':[[.2,'whoosh',.16]],
  '6.3':[[.3,'flip',.18]],
  '6.6':[[.35,'alert',.2]],
  '7.12':[[.3,'chime',.22]],
};
export const PlaceholderBackupGate:React.FC<{chapters:number[]}>=({chapters})=>{
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
    {ch>=2?<div style={{position:'absolute',transformOrigin:'0 0',transform:`translate(${cam.sx-cam.x*cam.z}px,${cam.sy-cam.y*cam.z}px) scale(${cam.z})`}}><World c={{id:b.id,f,dur:b.audio,zoom:cam.z}} panel={!!META[b.id]?.screenshot||PANEL_BEATS.has(b.id)}/></div>:null}
    {ch>=2?<div style={{position:'absolute', left:0, top:0, width:1920, height:250, background:`linear-gradient(to bottom, ${C.bg} 0%, ${C.bg}e6 42%, ${C.bg}00 100%)`}}/>:null}
    {seg.type==='beat'&&ch===0?<ColdOpen id={b.id} f={f} dur={b.audio}/>:null}
    {seg.type==='beat'&&ch===1?<GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def}/>:null}
    {seg.type==='beat'?<Hud chapter={b.chapter.title} clock={CLOCK_LABELS[b.id]??CLOCK[b.id]??null} ticket="DFBUGS-12505"/>:null}
    {seg.type==='beat'&&ch>=2?<PhaseTracker current={ch-2} phases={PHASES}/>:null}
    {seg.type==='beat'&&ch>=3?<TimelineBar now={CLOCK[b.id]??null} events={EVENTS}/>:null}
    {seg.type==='beat'?<BeatPanel id={b.id} f={f} dur={b.audio}/>:null}
    {seg.type==='beat'&&m.screenshot?<Screenshot src={`evidence/placeholder-backup-gate/${m.screenshot}`} date={SHOT_DATE[b.id]??'2026-11-05'} caption={m.caption??''} focus={m.focus} a={win(.14,.98)} z={progIO(f,b.audio*.2,b.audio*.65)} y={215} x={865} w={1010} sourceLabel="lab evidence · attached to the defect"/>:null}
    {seg.type==='beat'&&m.define?<DefinitionPanel term={m.define.term} text={m.define.text} a={win(.05,.97)} bottom={150}/>:null}
    {seg.type==='chapter'?<ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame-seg.from,0,30)} out={prog(frame-seg.from,seg.dur-30,seg.dur)}/>:null}
    {beats.map(beat=><Sequence key={beat.id} from={beat.from+PAD_BEFORE} durationInFrames={beat.audio+10}><Audio src={staticFile(`audio/placeholder-backup-gate/${beat.id}.wav`)} volume={.72}/></Sequence>)}
    {cues.map((cue,k)=><Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v}/></Sequence>)}
  </AbsoluteFill>;
};
