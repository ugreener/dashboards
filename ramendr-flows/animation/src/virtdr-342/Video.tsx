import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp,prog,progIO,sec} from '../lib/anim';
import {ChapterCard,Hud,Legend,TimelineBar,TEvent} from '../components/overlays';
import {DefinitionPanel,Def,PhaseTracker,Screenshot} from '../components/newcomer';
import {buildTimeline,PAD_BEFORE,Segment} from './timeline';
import {World,FOCUS,RECT,CH} from './World';
import {BeatPanel,GlossaryScene,PANEL_BEATS,PHASES_342} from './Panels';
import BEATS from './beats.json';
type Meta={t?:string;screenshot?:string;focus?:{x:number;y:number;w:number;h:number};caption?:string;define?:{term:string;text:string};card?:{kind:string;name:string;role:string};def?:Def};
const META=BEATS as Record<string,Meta>;
type Cam={x:number;y:number;z:number;sx:number;sy:number};
const CAMS:Record<string,Partial<Cam>>={};
const fit=(id:string):Cam=>{
  const side=!!META[id]?.screenshot||PANEL_BEATS.has(id);
  const keys=FOCUS[id]??Object.keys(RECT);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const key of keys){const r=RECT[key];if(!r)continue;x0=Math.min(x0,r[0]);y0=Math.min(y0,r[1]);x1=Math.max(x1,r[0]+r[2]);y1=Math.max(y1,r[1]+r[3]);}
  // Include the enclosing region header for every spoke and array focus.
  if(y0>=1100)y0=1000;else if(y0>=490)y0=385;else y0=0;
  x0-=40;x1+=40;y1+=65;
  const left=35,right=side?825:1880,top=210,bottom=META[id]?.define?740:895;
  const z=Math.min(1.2,(right-left)/(x1-x0),(bottom-top)/(y1-y0));
  return{x:(x0+x1)/2,y:(y0+y1)/2,z,sx:(left+right)/2,sy:(top+bottom)/2,...CAMS[id]};
};
export const CLOCK:Record<string,string>={
  '3.1':'08:03:40','3.2':'08:03:40','3.3':'08:03:40','3.4':'08:03:40','3.5':'08:03:40',
  '4.1':'08:07:38','4.2':'08:07:38','4.3':'08:10:02','4.4':'08:10:02','4.5':'08:12:34','4.6':'08:12:34',
  '5.1':'08:10:02','5.2':'08:10:02','5.3':'08:10:02','5.4':'08:10:02','5.5':'08:21:59','5.6':'08:21:59',
  '6.1':'08:21:59','6.2':'08:21:59','6.3':'08:21:59','6.4':'08:21:59','6.5':'08:26:29','6.6':'08:26:29','6.7':'08:26:29','6.8':'08:26:29',
  '7.1':'09:55:08','7.2':'09:55:08','7.3':'09:57:00','7.4':'10:00:00','7.5':'10:09:25','7.6':'10:12:29','7.7':'10:13:00',
  '8.1':'10:13:00','8.2':'10:14:00','8.3':'10:14:00','8.4':'10:15:47','8.5':'10:15:47','8.6':'10:18:54','8.7':'10:19:00',
  '9.1':'10:19:00','9.2':'10:19:00','9.3':'10:19:00',
};
const EVENTS_342:TEvent[]=[['07:58:06','oldest sync',C.amber],['08:07:38','suspend',C.red],['08:10:02','Initiate',C.blue],['08:21:59','Phase A checks',C.green],['09:55:08','resume',C.amber],['10:12:29','source disks removed',C.orange],['10:14:00','~Completed',C.green]];
const SFX:Record<string,[number,string,number][]>={'0.1':[[.05,'type',.2],[.45,'whoosh',.2]],'3.4':[[.3,'tick',.18]],'4.2':[[.2,'alert',.2]],'4.4':[[.25,'click',.3]],'6.3':[[.5,'chime',.2]],'7.6':[[.4,'flip',.2]],'8.2':[[.4,'chime',.2]]};
export const VirtDr342:React.FC<{chapters:number[]}>=({chapters})=>{
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
  const cues=beats.flatMap(beat=>{
    const base=beat.from+PAD_BEFORE;const list:[number,string,number][]=[...(SFX[beat.id]??[])];
    for(const [id,frac]of CH)if(id===beat.id)list.push([frac,'flip',.18]);
    if(META[beat.id]?.screenshot)list.push([.14,'whoosh',.16]);
    if(META[beat.id]?.card)list.push([.04,'pop',.17]);
    return list.map(([frac,name,v])=>({at:base+Math.round(frac*beat.audio),name,v}));
  });
  return <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`,overflow:'hidden'}}>
    {ch>=2?<div style={{position:'absolute',transformOrigin:'0 0',transform:`translate(${cam.sx-cam.x*cam.z}px,${cam.sy-cam.y*cam.z}px) scale(${cam.z})`}}><World c={{id:b.id,f,dur:b.audio,zoom:cam.z}}/></div>:null}
    {seg.type==='beat'&&ch===1?<GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def}/>:null}
    {seg.type==='beat'?<Hud chapter={b.chapter.title} clock={CLOCK[b.id]??null} ticket="VIRTDR-342"/>:null}
    {seg.type==='beat'&&ch>=2?<PhaseTracker current={ch-2} phases={PHASES_342}/>:null}
    {seg.type==='beat'&&b.id==='2.3'?<Legend appear={win(.04,.96)}/>:null}
    {seg.type==='beat'&&ch>=3?<TimelineBar now={CLOCK[b.id]??null} events={EVENTS_342}/>:null}
    {seg.type==='beat'?<BeatPanel id={b.id} f={f} dur={b.audio}/>:null}
    {seg.type==='beat'&&m.screenshot?<Screenshot src={`evidence/virtdr-342/${m.screenshot}`} date="2026-10-19" caption={m.caption??''} focus={m.focus} a={win(.14,.98)} z={progIO(f,b.audio*.2,b.audio*.65)} y={215} x={865} w={1010} sourceLabel={m.screenshot.includes('vsa-')?'PowerStore console · historical capture':'hub console · historical capture'}/>:null}
    {seg.type==='beat'&&m.define?<DefinitionPanel term={m.define.term} text={m.define.text} a={win(.05,.97)} bottom={150}/>:null}
    {seg.type==='chapter'?<ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame-seg.from,0,30)} out={prog(frame-seg.from,seg.dur-30,seg.dur)}/>:null}
    {beats.map(beat=><Sequence key={beat.id} from={beat.from+PAD_BEFORE} durationInFrames={beat.audio+10}><Audio src={staticFile(`audio/virtdr-342/${beat.id}.wav`)} volume={.72}/></Sequence>)}
    {cues.map((cue,k)=><Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v}/></Sequence>)}
  </AbsoluteFill>;
};
