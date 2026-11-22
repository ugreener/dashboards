import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, TimelineBar, TEvent} from '../components/overlays';
import {PhaseTracker, Screenshot} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT, CH} from './World';
import {BeatPanel, ColdOpen, GlossaryScene, Outcome, PANEL_BEATS, PHASES_499} from './Panels';
import BEATS from './beats.json';

type Meta = {
  t?: string;
  screenshot?: string;
  focus?: {x: number; y: number; w: number; h: number};
  caption?: string;
  shot?: {w?: number; x?: number; y?: number};
  iw?: number;
  ih?: number;
  card?: {kind: string; name: string; role: string};
  def?: {what: string; creator: string; reader: string; where: string; analogy: string};
};
const META = BEATS as Record<string, Meta>;
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {
  '4.3': {y: 1254, z: 0.468},
  '5.3': {y: 435},
};

const BAND_OF: Record<string, string> = {
  appset: 'hub', placement: 'hub', decision: 'hub', drpc: 'hub', policy: 'hub',
  app1: 'spoke1', vrg1: 'spoke1', vm1: 'spoke1', pvcRoot1: 'spoke1', pvcData1: 'spoke1', dvRoot1: 'spoke1', dvData1: 'spoke1', argo1: 'spoke1',
  app0: 'spoke0', vrg0: 'spoke0', vm0: 'spoke0', pvcRoot0: 'spoke0', pvcData0: 'spoke0', dvRoot0: 'spoke0', dvData0: 'spoke0', argo0: 'spoke0',
  groupA: 'arrayA', groupB: 'arrayB', driver0: 'spoke0', driver1: 'spoke1',
};

const BANDS: Record<string, [number, number, number]> = {
  hub: [70, 2410, 45],
  spoke1: [70, 1240, 560],
  spoke0: [1235, 2410, 560],
  arrayB: [70, 1240, 1620],
  arrayA: [1235, 2410, 1620],
};

const fit = (id: string): Cam => {
  const side = !!META[id]?.screenshot || PANEL_BEATS.has(id);
  const keys = FOCUS[id] ?? Object.keys(RECT);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const key of keys) {
    const r = RECT[key];
    if (!r) continue;
    x0 = Math.min(x0, r[0]);
    y0 = Math.min(y0, r[1]);
    x1 = Math.max(x1, r[0] + r[2]);
    y1 = Math.max(y1, r[1] + r[3]);
  }
  if (!Number.isFinite(x0)) {
    x0 = 0; y0 = 0; x1 = 2480; y1 = 2000;
  }
  const bands = new Set(keys.map((k) => BAND_OF[k]).filter(Boolean));
  const singleBand = bands.size === 1 ? BANDS[[...bands][0]] : undefined;
  if (singleBand) {
    x0 = Math.min(x0, singleBand[0]);
    y0 = Math.min(y0, singleBand[2] - 25);
  }
  x0 -= 40;
  x1 += 40;
  y1 += 60;
  const left = 35, right = side ? 825 : 1880, top = 215, bottom = 895;
  const z = Math.min(1.35, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  let cx = (x0 + x1) / 2;
  if (singleBand) {
    const vw = (right - left) / z;
    const lo = singleBand[0] - 20 + vw / 2;
    const hi = singleBand[1] + 20 - vw / 2;
    if (lo <= hi) cx = Math.min(hi, Math.max(lo, cx));
  }
  return {x: cx, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};

const CLOCK: Record<string, string> = {
  '3.1': '10:55:51', '3.2': '10:55:55', '3.3': '10:55:55', '3.4': '10:56:29', '3.5': '10:56:29',
  '4.1': '10:56:29', '4.2': '10:56:29', '4.3': '10:56:29', '4.4': '11:01:03', '4.5': '11:00:55',
  '5.1': '11:01:03', '5.2': '11:01:03', '5.3': '11:02:00', '5.4': '11:05:00', '5.5': '11:15:45', '5.6': '11:15:45', '5.7': '11:00:10',
  '6.1': '10:55:55', '6.2': '11:00:10', '6.3': '11:24:06', '6.4': '11:24:06',
  '7.1': '11:12:00', '7.2': '11:16:23', '7.3': '11:16:58', '7.4': '11:24:06', '7.5': '11:24:06',
  '8.1': '11:24:06', '8.2': '11:24:06',
};
const CLOCK_LABELS: Record<string, string> = {
  '4.1': '~10:56', '4.2': '~10:56', '4.3': '~10:56', '4.4': '~11:01',
  '5.2': '~11:01', '5.3': '~11:02', '5.4': '~11:05', '5.5': '~11:15', '5.6': '~11:15',
};

const EVENTS_499: TEvent[] = [
  ['10:49:50', 'last sync', C.amber],
  ['10:53:30', 'gate', C.green],
  ['10:55:55', 'Initiate', C.blue],
  ['11:01:03', 'Completed', C.green],
  ['11:09:17', 'reverse sync', C.orange],
];

const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[0.05, 'type', 0.2], [0.45, 'alert', 0.2]],
  '0.2': [[0.25, 'chime', 0.2]],
  '1.1': [[0.2, 'pop', 0.16]],
  '1.2': [[0.2, 'pop', 0.16]],
  '1.3': [[0.2, 'pop', 0.16]],
  '1.6': [[0.3, 'pop', 0.16]],
  '2.5': [[0.3, 'tick', 0.18]],
  '2.7': [[0.5, 'click', 0.3]],
  '3.4': [[0.4, 'flip', 0.2]],
  '3.5': [[0.3, 'alert', 0.2]],
  '4.3': [[0.4, 'flip', 0.22]],
  '4.5': [[0.4, 'tick', 0.18]],
  '5.3': [[0.4, 'flip', 0.22]],
  '5.4': [[0.3, 'pop', 0.18]],
  '5.7': [[0.4, 'chime', 0.2]],
  '6.2': [[0.4, 'tick', 0.18]],
  '6.4': [[0.5, 'chime', 0.22]],
  '7.3': [[0.4, 'tick', 0.18]],
  '8.2': [[0.5, 'chime', 0.22]],
};

const win = (f: number, audio: number, a: number, z: number) =>
  Math.min(prog(f, audio * a, audio * a + 22), 1 - prog(f, audio * z - 22, audio * z));

const sourceFor = (file: string) =>
  file.includes('vsa-') ? 'PowerStore console · historical capture' :
  file.includes('generated-application') || file.includes('target-application') ? 'Argo CD · historical capture' :
  'hub console · historical capture';

export const VirtDr499: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');
  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  if (!seg) return <AbsoluteFill style={{background: C.bg}} />;
  const b = seg.type === 'beat' ? seg : beats.find((v) => v.from >= seg.from) ?? beats[beats.length - 1];
  const i = beats.indexOf(b);
  const prev = i > 0 && !b.afterChapter ? beats[i - 1].id : b.id;
  const f = seg.type === 'beat' ? frame - b.from - PAD_BEFORE : -PAD_BEFORE;
  const target = fit(b.id);
  const old = fit(prev);
  const p = progIO(f, -PAD_BEFORE, sec(1.6));
  const cam = {x: lerp(old.x, target.x, p), y: lerp(old.y, target.y, p), z: lerp(old.z, target.z, p), sx: lerp(old.sx, target.sx, p), sy: lerp(old.sy, target.sy, p)};
  const ch = b.chapter.n;
  const m = META[b.id] ?? {};
  const cues: {at: number; name: string; v: number}[] = [];
  const seen = new Set<string>();
  for (const beat of beats) {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    for (const [id, frac, key] of CH) if (id === beat.id && (FOCUS[beat.id] ?? []).includes(key)) list.push([frac, 'flip', 0.18]);
    if (META[beat.id]?.screenshot) list.push([0.14, 'whoosh', 0.16]);
    if (META[beat.id]?.card) list.push([0.04, 'pop', 0.17]);
    for (const [frac, name, v] of list) {
      const at = base + Math.round(frac * beat.audio);
      const key = `${at}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cues.push({at, name, v});
    }
  }
  const showWorld = ch >= 2;
  const cast = ch === 1;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {showWorld ? <div style={{position: 'absolute', inset: 0, clipPath: (!!m.screenshot || PANEL_BEATS.has(b.id)) ? 'inset(210px 1095px 175px 0px)' : 'inset(210px 0px 175px 0px)'}}><div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}} panel={!!m.screenshot || PANEL_BEATS.has(b.id)} /></div></div> : null}
    {seg.type === 'beat' && b.id === '0.1' ? <ColdOpen f={f} dur={b.audio} /> : null}
    {seg.type === 'beat' && b.id === '0.2' ? <Outcome f={f} dur={b.audio} /> : null}
    {seg.type === 'beat' && cast ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def} /> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={ch >= 3 ? CLOCK_LABELS[b.id] ?? CLOCK[b.id] ?? null : null} ticket="VIRTDR-499" /> : null}
    {seg.type === 'beat' && ch >= 2 ? <PhaseTracker current={Math.max(0, Math.min(PHASES_499.length - 1, ch - 2))} phases={PHASES_499} /> : null}
    {seg.type === 'beat' && ch >= 3 ? <TimelineBar now={CLOCK[b.id] ?? null} events={EVENTS_499} /> : null}
    {seg.type === 'beat' && PANEL_BEATS.has(b.id) && !m.screenshot ? <BeatPanel id={b.id} f={f} dur={b.audio} /> : null}
    {seg.type === 'beat' && m.screenshot ? <Screenshot src={`evidence/virtdr-499/${m.screenshot}`} date="2026-11-22" caption={m.caption ?? ''} focus={m.focus} a={win(f, b.audio, 0.14, 0.98)} z={progIO(f, b.audio * 0.12, b.audio * 0.5)} x={m.shot?.x ?? 865} y={m.shot?.y ?? 215} w={m.shot?.w ?? 1010} iw={m.iw ?? 1920} ih={m.ih ?? 1080} sourceLabel={sourceFor(m.screenshot)} /> : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
    {beats.map((beat) => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/virtdr-499/${beat.id}.wav`)} volume={0.72} /></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v} /></Sequence>)}
  </AbsoluteFill>;
};
