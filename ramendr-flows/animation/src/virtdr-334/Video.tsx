import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, sans} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, TimelineBar, TEvent} from '../components/overlays';
import {DefinitionPanel, Def, PhaseTracker, Screenshot} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT, CH} from './World';
import {BeatPanel, GlossaryScene, PANEL_BEATS, PHASES_334} from './Panels';
import BEATS from './beats.json';
type Meta = {t?: string; screenshot?: string; focus?: {x: number; y: number; w: number; h: number}; caption?: string; define?: {term: string; text: string}; card?: {kind: string; name: string; role: string}; def?: Def; unverified?: string};
const META = BEATS as Record<string, Meta>;
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {
  '2.1': {x: 1240, y: 1120, z: .74, sx: 960, sy: 552},
  '2.2': {x: 1240, y: 1150, z: .78, sx: 960, sy: 552},
  '2.5': {x: 1240, y: 1120, z: .74, sx: 960, sy: 552},
  '3.2': {x: 1250},
  '3.3': {x: 1245, y: 545, z: .76, sx: 960, sy: 552},
  '3.4': {x: 700, y: 1200, z: 1.1, sx: 960, sy: 552},
  '3.5': {x: 700, y: 1200, z: 1.1, sx: 960, sy: 552},
  '3.7': {x: 900, y: 1150, z: .95, sx: 960, sy: 552},
  '4.2': {x: 980, y: 1260, z: 1.05, sx: 960, sy: 552},
  '4.3': {x: 1120, y: 1270, z: 1.25, sx: 960, sy: 552},
  '4.5': {x: 1290, y: 1270, z: 1.25, sx: 960, sy: 552},
  '4.6': {x: 1650, y: 1270, z: 1.05, sx: 960, sy: 552},
  '4.7': {x: 1250, y: 1180, z: .82, sx: 960, sy: 552},
  '5.1': {x: 1450, y: 220, z: 1.0, sx: 430, sy: 552},
  '5.3': {x: 1290, y: 1270, z: 1.0, sx: 960, sy: 552},
  '5.4': {x: 1290, y: 1270, z: 1.0, sx: 960, sy: 552},
  '5.5': {x: 1290, y: 1270, z: 1.0, sx: 960, sy: 552},
  '6.2': {x: 900, y: 950, z: .95, sx: 960, sy: 552},
  '6.4': {x: 900, y: 950, z: .95, sx: 960, sy: 552},
  '7.4': {x: 1450, y: 220, z: 1.05, sx: 960, sy: 552},
  '7.6': {x: 1250, y: 1180, z: .82, sx: 960, sy: 552},
  '7.7': {x: 1250, y: 1180, z: .82, sx: 960, sy: 552},
};
const fit = (id: string): Cam => {
  const side = !!META[id]?.screenshot || PANEL_BEATS.has(id);
  const keys = FOCUS[id] ?? Object.keys(RECT);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const key of keys) {const r = RECT[key]; if (!r) continue; x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[0] + r[2]); y1 = Math.max(y1, r[1] + r[3]);}
  if (!Number.isFinite(x0)) {x0 = 70; y0 = 45; x1 = 2410; y1 = 1385;}
  if (y0 >= 1000) y0 = 930; else if (y0 >= 735) y0 = 700; else if (y0 >= 335) y0 = 300; else y0 = 0;
  x0 -= 40; x1 += 40; y1 += 55;
  const left = 35, right = side ? 825 : 1880, top = 210, bottom = 895;
  const z = Math.min(1.2, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};
const CLOCK: Record<string, string> = {
  '2.1': '13:22:27', '2.2': '13:22:27', '2.3': '13:15:58', '2.4': '13:20:00', '2.5': '13:22:27',
  '3.1': '13:26:40', '3.2': '13:26:42', '3.3': '13:26:43', '3.4': '13:26:44', '3.5': '13:26:45', '3.6': '13:27:00', '3.7': '13:26:45',
  '4.1': '13:26:45', '4.2': '13:36:57', '4.3': '13:41:45', '4.4': '13:42:28', '4.5': '13:44:17', '4.6': '13:56:17', '4.7': '14:00:00',
  '5.1': '14:04:00', '5.2': '13:44:00', '5.3': '13:44:00', '5.4': '13:26:45', '5.5': '14:04:00',
  '6.1': '19:09:53', '6.2': '19:24:53', '6.3': '19:29:41', '6.4': '19:29:41',
  '7.1': '13:56:00', '7.2': '13:56:00', '7.3': '13:56:00', '7.4': '13:56:00', '7.5': '13:56:00', '7.6': '14:00:00', '7.7': '14:00:00',
};
const CLOCK_LABELS: Record<string, string> = {
  '6.1': '2026-10-06 19:09:53', '6.2': '2026-10-06 19:24:53', '6.3': '2026-10-06 19:29:41', '6.4': '2026-10-06 19:29:41',
};
const EVENTS: TEvent[] = [
  ['13:15:58', 'preflight', C.amber], ['13:22:27', 'last sync', C.cyan], ['13:26:40', 'Initiate', C.blue],
  ['13:26:45', 'reprotect', C.green], ['13:36:57', 'root copy', C.cyan], ['13:41:45', 'RPO deadline', C.red],
  ['13:44:17', 'data copy', C.orange], ['13:56:17', 'cadence', C.green],
];
const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[.05, 'type', .2], [.5, 'whoosh', .2]],
  '0.2': [[.35, 'pop', .16]],
  '0.3': [[.3, 'pop', .16]],
  '2.4': [[.2, 'pop', .15]],
  '3.1': [[.25, 'click', .3]],
  '3.2': [[.4, 'flip', .2]],
  '3.3': [[.3, 'tick', .16]],
  '3.4': [[.3, 'flip', .18], [.62, 'flip', .18]],
  '3.5': [[.4, 'tick', .2]],
  '4.2': [[.35, 'pop', .17]],
  '4.3': [[.4, 'tick', .2]],
  '4.5': [[.4, 'land', .22]],
  '4.6': [[.5, 'chime', .2]],
  '5.1': [[.35, 'tick', .16]],
  '7.6': [[.4, 'chime', .2]],
  '7.7': [[.5, 'chime', .22]],
};
const sourceLabel = () => 'hub console · VIRTDR-292 run · same failover';
export const ReprotectWindow: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');
  const seg = segs.find(s => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  if (!seg) return <AbsoluteFill style={{background: C.bg}}/>;
  const b = seg.type === 'beat' ? seg : beats.find(v => v.from >= seg.from) ?? beats[beats.length - 1];
  const i = beats.indexOf(b), prev = i > 0 && !b.afterChapter ? beats[i - 1].id : b.id;
  const f = seg.type === 'beat' ? frame - b.from - PAD_BEFORE : -PAD_BEFORE;
  const target = fit(b.id), old = fit(prev);
  const p = progIO(f, -PAD_BEFORE, sec(1.6));
  const cam = {x: lerp(old.x, target.x, p), y: lerp(old.y, target.y, p), z: lerp(old.z, target.z, p), sx: lerp(old.sx, target.sx, p), sy: lerp(old.sy, target.sy, p)};
  const ch = b.chapter.n, m = META[b.id] ?? {};
  const win = (a: number, z: number) => Math.min(prog(f, b.audio * a, b.audio * a + 22), 1 - prog(f, b.audio * z - 22, b.audio * z));
  const allCues = beats.flatMap(beat => {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    for (const [id, frac] of CH) if (id === beat.id) list.push([frac, 'flip', .18]);
    if (META[beat.id]?.screenshot) list.push([.14, 'whoosh', .16]);
    if (META[beat.id]?.card) list.push([.04, 'pop', .17]);
    return list.map(([frac, name, v]) => ({at: base + Math.round(frac * beat.audio), name, v}));
  });
  const cueMap = new Map<string, {at: number; name: string; v: number}>();
  for (const c of allCues) {
    const key = `${c.at}|${c.name}`;
    const prevCue = cueMap.get(key);
    if (!prevCue || c.v > prevCue.v) cueMap.set(key, c);
  }
  const cues = [...cueMap.values()];
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {ch >= 2 ? <div style={{position: 'absolute', left: 20, top: 205, width: m.screenshot || PANEL_BEATS.has(b.id) ? 820 : 1880, height: 690, overflow: 'hidden'}}>
      <div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z - 20}px,${cam.sy - cam.y * cam.z - 205}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}}/></div>
    </div> : null}
    {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def}/> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={CLOCK_LABELS[b.id] ?? CLOCK[b.id] ?? null} ticket="VIRTDR-334"/> : null}
    {seg.type === 'beat' && ch >= 2 ? <PhaseTracker current={ch - 2} phases={PHASES_334}/> : null}
    {seg.type === 'beat' && m.unverified ? <div style={{position: 'absolute', left: 40, right: 40, top: 165, padding: '6px 12px', fontFamily: sans, fontSize: 17, lineHeight: 1.25, color: C.amber, background: `${C.bg}f5`, borderLeft: `3px solid ${C.amber}`}}>UNVERIFIED: {m.unverified}</div> : null}
    {seg.type === 'beat' && ch >= 3 && ch !== 6 ? <TimelineBar now={CLOCK[b.id] ?? null} events={EVENTS}/> : null}
    {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio}/> : null}
    {seg.type === 'beat' && m.screenshot ? <Screenshot src={`evidence/virtdr-334/${m.screenshot}`} date="2026-10-07" caption={m.caption ?? ''} focus={m.focus} a={win(.14, .98)} z={progIO(f, b.audio * .2, b.audio * .65)} y={215} x={865} w={1010} sourceLabel={sourceLabel()}/> : null}
    {seg.type === 'beat' && m.define ? <DefinitionPanel term={m.define.term} text={m.define.text} a={win(.05, .97)} bottom={150}/> : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)}/> : null}
    {beats.map(beat => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/virtdr-334/${beat.id}.wav`)} volume={.72}/></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v}/></Sequence>)}
  </AbsoluteFill>;
};
