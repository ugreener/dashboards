import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, TimelineBar, TEvent} from '../components/overlays';
import {DefinitionPanel, Def, PhaseTracker, Screenshot} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment, PHASES_307} from './timeline';
import {World, RECT, CH, focusFor} from './World';
import {BeatPanel, GlossaryScene, PANEL_BEATS} from './Panels';
import BEATS from './beats.json';
type Meta = {t?: string; screenshot?: string; focus?: {x: number; y: number; w: number; h: number}; caption?: string; define?: {term: string; text: string}; card?: {kind: string; name: string; role: string}; def?: Def};
const META = BEATS as Record<string, Meta>;
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {
  '0.1': {x: 1200, z: 0.72},

};
const fit = (id: string): Cam => {
  const side = !!META[id]?.screenshot || PANEL_BEATS.has(id);
  const keys = focusFor(id); const targetOn = keys.some(k => ['vrg1','vgrc1','pv1','pvc1','pvctl','vm1','odf1'].includes(k)); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const key of keys) { const r = RECT[key]; if (!r) continue; x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[0] + r[2]); y1 = Math.max(y1, r[1] + r[3]); }
  if (y0 >= 1180) y0 = 1150; else if (y0 >= 420) y0 = 385; else y0 = 0;
  if (targetOn) x0 = Math.min(x0, 1210);
  x0 -= 40; x1 += 40; y1 += 65;
  const left = 35, right = META[id]?.screenshot ? 1090 : side ? 825 : 1880, top = 210, bottom = META[id]?.define ? 740 : 895;
  const z = Math.min(1.15, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};
const CLOCK: Record<string, string> = {
  '2.1': '20:08:00', '2.2': '20:08:00', '2.3': '20:08:00', '2.4': '20:08:00', '2.5': '20:08:00', '2.6': '20:08:00', '2.7': '20:08:00', '2.8': '20:08:00',
  '3.1': '20:10:43', '3.2': '20:10:43', '3.3': '20:10:43', '3.4': '20:10:43', '3.5': '20:22:14', '3.6': '20:22:14', '3.7': '20:22:14',
  '4.1': '20:11:08', '4.2': '20:11:08', '4.3': '20:11:08', '4.4': '20:11:08', '4.5': '20:11:08', '4.6': '20:11:08', '4.7': '20:11:08', '4.8': '20:11:08',
  '5.1': '20:11:18', '5.2': '20:11:18', '5.3': '20:11:18', '5.4': '20:11:18', '5.5': '20:11:18', '5.6': '20:11:18', '5.7': '20:11:18',
  '6.1': '20:11:30', '6.2': '20:11:30', '6.3': '20:11:30', '6.4': '20:11:30', '6.5': '20:11:30', '6.6': '20:11:30', '6.7': '20:11:30', '6.8': '20:11:30', '6.9': '20:11:30',
  '7.1': '21:23:13', '7.2': '21:23:13', '7.3': '21:23:13', '7.4': '21:23:13', '7.5': '21:51:28', '7.6': '21:51:28', '7.7': '21:51:28', '7.8': '21:51:28',
  '8.1': '21:51:28', '8.2': '21:51:28', '8.3': '21:51:28', '8.4': '21:51:28', '8.5': '21:51:28', '8.6': '21:51:28', '8.7': '21:51:28', '8.8': '21:51:28', '8.9': '21:51:28',
};
const CLOCK_LABELS: Record<string, string> = {
  '6.1': '~20:11:30', '6.2': '~20:11:30', '6.3': '~20:11:30', '6.4': '~20:11:30', '6.5': '~20:11:30', '6.6': '~20:11:30', '6.7': '~20:11:30', '6.8': '~20:11:30', '6.9': '~20:11:30',
  '7.1': '21:23:13 (VGR completion)', '7.2': '21:23:13 (VGR completion)', '7.3': '21:23:13 (VGR completion)', '7.4': '21:23:13 (VGR completion)',
};
const EVENTS_307: TEvent[] = [['20:08:00', 'last group sync', C.amber], ['20:10:43', 'Initiate', C.blue], ['20:11:08', 'VGR Unknown', C.red], ['20:11:18', 'restore 8/1', C.orange], ['20:22:14', 'DRPC FailedOver', C.amber], ['21:23:13', 'VGR last completion', C.purple], ['21:51:28', 'console capture', C.green]];
const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[.05, 'type', .2], [.45, 'whoosh', .2]],
  '3.2': [[.25, 'click', .3]],
  '4.6': [[.35, 'flip', .2]],
  '5.4': [[.3, 'alert', .2]],
  '6.5': [[.4, 'flip', .2]],
  '7.2': [[.3, 'alert', .2]],
  '8.3': [[.3, 'alert', .2]],
};
export const VirtDr307: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame(); const {segs} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');
  const seg = segs.find(s => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  if (!seg) return <AbsoluteFill style={{background: C.bg}}/>;
  const b = seg.type === 'beat' ? seg : beats.find(v => v.from >= seg.from) ?? beats[beats.length - 1];
  const i = beats.indexOf(b), prev = i > 0 && !b.afterChapter ? beats[i - 1].id : b.id;
  const f = seg.type === 'beat' ? frame - b.from - PAD_BEFORE : -PAD_BEFORE;
  const target = fit(b.id), old = fit(prev); const p = progIO(f, -PAD_BEFORE, sec(1.6));
  const cam = {x: lerp(old.x, target.x, p), y: lerp(old.y, target.y, p), z: lerp(old.z, target.z, p), sx: lerp(old.sx, target.sx, p), sy: lerp(old.sy, target.sy, p)};
  const ch = b.chapter.n, m = META[b.id] ?? {};
  const win = (a: number, z: number) => Math.min(prog(f, b.audio * a, b.audio * a + 22), 1 - prog(f, b.audio * z - 22, b.audio * z));
  const cues = beats.flatMap(beat => {
    const base = beat.from + PAD_BEFORE; const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    for (const [id, frac] of CH) if (id === beat.id) list.push([frac, 'flip', .18]);
    if (META[beat.id]?.screenshot) list.push([.14, 'whoosh', .16]);
    if (META[beat.id]?.card) list.push([.04, 'pop', .17]);
    return list.map(([frac, name, v]) => ({at: base + Math.round(frac * beat.audio), name, v}));
  });
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {ch >= 2 ? <div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}}/></div> : null}
    {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def}/> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={CLOCK_LABELS[b.id] ?? CLOCK[b.id] ?? null} ticket="VIRTDR-307"/> : null}
    {seg.type === 'beat' && ch >= 2 ? <PhaseTracker current={ch - 2} phases={PHASES_307}/> : null}
    {seg.type === 'beat' && ch >= 3 ? <TimelineBar now={CLOCK[b.id] ?? null} events={EVENTS_307}/> : null}
    {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio}/> : null}
    {seg.type === 'beat' && m.screenshot ? <Screenshot src={`evidence/virtdr-307/${m.screenshot}`} date="2026-09-26" caption={m.caption ?? ''} focus={m.focus} a={win(.12, .98)} z={progIO(f, b.audio * .2, b.audio * .65)} y={215} x={1320} w={560} iw={693} ih={775} sourceLabel="hub console · historical capture"/> : null}
    {seg.type === 'beat' && m.define ? <DefinitionPanel term={m.define.term} text={m.define.text} a={win(.05, .97)} x={1240} bottom={150}/> : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)}/> : null}
    {beats.map(beat => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/virtdr-307/${beat.id}.wav`)} volume={.72}/></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v}/></Sequence>)}
  </AbsoluteFill>;
};
