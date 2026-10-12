import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, mono, sans} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, Legend, TimelineBar, TEvent} from '../components/overlays';
import {DefinitionPanel, PhaseTracker, Screenshot, Def} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {CH, Ctx, FOCUS, RECT, World} from './World';
import {BeatPanel, GlossaryScene, PANEL_BEATS, PHASES_291, ResultCard} from './Panels';
import BEATS from './beats.json';

type BeatMeta = {
  chapter: string;
  t?: string;
  screenshot?: string;
  focus?: {x: number; y: number; w: number; h: number};
  caption?: string;
  define?: {term: string; text: string};
  card?: {kind: string; name: string; role: string};
  def?: Def;
};
const META = BEATS as unknown as Record<string, BeatMeta>;

// ---------------- camera ----------------
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const WORLD: [number, number, number, number] = [0, 30, 2400, 1470];
/** Manual overrides (world centre + zoom) where the auto-fit is not ideal. */
const CAMS: Record<string, Partial<Cam>> = {
  '0.1': {x: 1200, y: 770, z: 0.62},
  '2.1': {x: 1200, y: 760, z: 0.62},
};

const fit = (id: string): Cam => {
  const ch = Number(id.split('.')[0]);
  const side = !!META[id]?.screenshot || PANEL_BEATS.has(id);
  const def = !!META[id]?.define;
  const top = ch >= 3 ? 205 : 100;
  const bottom = ch >= 5 && ch <= 12 ? 905 : 1050;
  const areaX0 = side ? 30 : 40;
  const areaX1 = side ? 845 : 1880;
  const y1 = def ? Math.min(bottom, 770) : bottom;
  const keys = FOCUS[id];
  let [x0, y0, x1, yb] = [WORLD[0], WORLD[1], WORLD[2], WORLD[3]];
  if (keys && keys.length) {
    x0 = Infinity;
    y0 = Infinity;
    x1 = -Infinity;
    yb = -Infinity;
    for (const k of keys) {
      const r = RECT[k];
      if (!r) continue;
      x0 = Math.min(x0, r[0]);
      y0 = Math.min(y0, r[1]);
      x1 = Math.max(x1, r[0] + r[2]);
      yb = Math.max(yb, r[1] + r[3]);
    }
    const pad = 60;
    x0 -= pad;
    y0 -= pad + 40;
    if (y0 > 690 && y0 < 900) y0 = 690; // keep spoke region headers clear of the HUD
    x1 += pad;
    yb += pad;
  }
  const z = Math.max(0.36, Math.min(1.3, (areaX1 - areaX0) / (x1 - x0), (y1 - top) / (yb - y0)));
  const cam: Cam = {x: (x0 + x1) / 2, y: (y0 + yb) / 2, z, sx: (areaX0 + areaX1) / 2, sy: (top + y1) / 2};
  return {...cam, ...CAMS[id]};
};

const camAt = (id: string, prevId: string | null, f: number): Cam => {
  const to = fit(id);
  const from = prevId ? fit(prevId) : to;
  const t = progIO(f, -PAD_BEFORE, sec(1.6));
  return {x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), z: lerp(from.z, to.z, t), sx: lerp(from.sx, to.sx, t), sy: lerp(from.sy, to.sy, t)};
};

/** Run clock (UTC) held at the latest recorded milestone, chapter 5 onward. */
const CLOCK: Record<string, string> = {
  '4.2': '13:53:45', '4.3': '13:53:45', '4.4': '13:53:45',
  '5.1': '13:53:45', '5.2': '13:57:26', '5.3': '13:57:26',
  '6.1': '13:57:26', '6.2': '13:57:26', '6.3': '13:57:38', '6.4': '13:57:38',
  '7.1': '13:57:38', '7.2': '13:57:38', '7.3': '13:57:38', '7.4': '13:57:38', '7.5': '13:57:38',
  '8.1': '13:57:38', '8.2': '13:57:38', '8.3': '13:57:38', '8.4': '13:58:28', '8.5': '14:01:16',
  '9.1': '13:57:26', '9.2': '13:57:36', '9.3': '13:57:36', '9.4': '13:57:36', '9.5': '13:57:36', '9.6': '13:57:36',
  '10.1': '13:58:28', '10.2': '13:58:28', '10.3': '13:58:28', '10.4': '13:58:28', '10.5': '14:08:59',
  '11.1': '15:30:00', '11.2': '15:30:00', '11.3': '15:36:53', '11.4': '15:41:56', '11.5': '15:41:56',
  '12.1': '15:41:56', '12.2': '15:42:17', '12.3': '15:42:17', '12.4': '15:42:17', '12.5': '15:42:17',
  '13.1': '15:44:53',
};

const EVENTS_291: TEvent[] = [
  ['13:50:26', 'oldest last sync', C.amber],
  ['13:57:26', 'Initiate', C.blue],
  ['13:57:36', 'source paused', C.red],
  ['13:57:38', 'WaitingForResourceRestore', C.orange],
  ['13:58:28', 'target VM Running', C.green],
  ['15:36:53', 'manual cleanup', C.orange],
  ['15:42:17', 'Completed', C.green],
];

/** Chapter to phase index in the tracker. */
const PHASE_OF: Record<number, number> = {3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6, 10: 7, 11: 8, 12: 9, 13: 10};

// ---------------- sound effects ----------------
type Sfx = 'click' | 'type' | 'pop' | 'tick' | 'whoosh' | 'land' | 'flip' | 'chime' | 'alert';
/** Manual cues [fraction, sound, volume]; state flips, screenshots and definitions are added automatically. */
const SFX: Record<string, [number, Sfx, number][]> = {
  '0.1': [[0.3, 'whoosh', 0.35], [0.46, 'flip', 0.3], [0.55, 'alert', 0.25]],
  '2.1': [[0.2, 'pop', 0.25], [0.4, 'pop', 0.22], [0.5, 'pop', 0.22], [0.6, 'pop', 0.22], [0.8, 'whoosh', 0.25]],
  '2.2': [[0.05, 'pop', 0.25], [0.18, 'pop', 0.22], [0.25, 'pop', 0.25]],
  '2.3': [[0.3, 'pop', 0.2], [0.4, 'pop', 0.2], [0.5, 'pop', 0.2], [0.75, 'pop', 0.2]],
  '2.4': [[0.2, 'flip', 0.28], [0.36, 'tick', 0.22]],
  '3.2': [[0.2, 'whoosh', 0.28], [0.32, 'whoosh', 0.22], [0.36, 'land', 0.28], [0.48, 'land', 0.25], [0.75, 'tick', 0.2]],
  '3.3': [[0.08, 'tick', 0.22], [0.62, 'pop', 0.25]],
  '3.4': [[0.05, 'tick', 0.22], [0.22, 'whoosh', 0.22]],
  '3.5': [[0.4, 'whoosh', 0.28], [0.62, 'land', 0.28]],
  '3.6': [[0.4, 'whoosh', 0.28], [0.62, 'land', 0.28]],
  '4.3': [[0.78, 'alert', 0.2]],
  '5.2': [[0.05, 'click', 0.5], [0.3, 'type', 0.25], [0.4, 'type', 0.25]],
  '6.3': [[0.15, 'whoosh', 0.28], [0.4, 'land', 0.28]],
  '7.2': [[0.27, 'whoosh', 0.28], [0.45, 'land', 0.25]],
  '7.3': [[0.45, 'whoosh', 0.22]],
  '8.2': [[0.17, 'whoosh', 0.28], [0.4, 'land', 0.28]],
  '8.4': [[0.1, 'chime', 0.25]],
  '9.2': [[0.5, 'alert', 0.3]],
  '10.2': [[0.78, 'alert', 0.22]],
  '11.3': [[0.3, 'tick', 0.25]],
  '11.4': [[0.4, 'tick', 0.25]],
  '12.1': [[0.15, 'click', 0.3]],
  '12.2': [[0.55, 'chime', 0.3]],
  '13.6': [[0.08, 'pop', 0.25], [0.2, 'pop', 0.25], [0.32, 'pop', 0.25], [0.44, 'pop', 0.25], [0.6, 'chime', 0.3]],
};

// ---------------- cold open ----------------
const TYPED = '13:57:26';
const typedCount = (f: number) => Math.floor(prog(f, 10, 70) * TYPED.length);

const ColdOpenDiagram: React.FC<{f: number; dur: number; appear: number; move: number; freeze: number}> = ({f, dur, appear, move, freeze}) => {
  if (appear <= 0) return null;
  const out = 1 - prog(f, dur * 0.94, dur);
  const box = (x: number, label: string, col: string) => (
    <g>
      <rect x={x} y={400} width={560} height={300} rx={22} fill={`${col}10`} stroke={col} strokeWidth={3} />
      <text x={x + 28} y={452} fill={col} fontFamily={sans} fontSize={36} fontWeight={700}>
        {label}
      </text>
    </g>
  );
  const arr = (x: number, label: string, role: string, rc: string) => (
    <g>
      <rect x={x + 80} y={780} width={400} height={120} rx={16} fill={`${C.array}10`} stroke={C.array} strokeWidth={2.5} />
      <text x={x + 110} y={830} fill={C.array} fontFamily={mono} fontSize={28} fontWeight={600}>
        {label}
      </text>
      <text x={x + 110} y={874} fill={rc} fontFamily={mono} fontSize={24}>
        {role}
      </text>
    </g>
  );
  const vmX = lerp(560, 1360, move);
  const flip = move > 0.25;
  const pulse = (f % 90) / 90;
  const px = flip ? lerp(1150, 770, pulse) : lerp(770, 1150, pulse);
  const vm = (x: number, col: string, label: string, op: number) => (
    <g transform={`translate(${x}, 560)`} opacity={op}>
      <rect x={-120} y={-62} width={240} height={124} rx={16} fill={C.panel2} stroke={col} strokeWidth={3} style={{filter: `drop-shadow(0 0 18px ${col}88)`}} />
      <text x={0} y={-10} textAnchor="middle" fill={col} fontFamily={sans} fontSize={24} fontWeight={700}>
        {label}
      </text>
      <text x={0} y={26} textAnchor="middle" fill={C.text} fontFamily={mono} fontSize={22}>
        hammerdb-rhel9
      </text>
    </g>
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', opacity: appear * out}}>
      {box(280, 'spoke-0', C.spoke0)}
      {box(1080, 'spoke-1', C.spoke1)}
      {arr(280, 'VSA-A', flip ? 'read-only' : 'source', flip ? C.red : C.green)}
      {arr(1080, 'VSA-B', flip ? 'source' : 'destination', flip ? C.green : C.amber)}
      <line x1={760} y1={840} x2={1160} y2={840} stroke={C.array} strokeWidth={4} />
      <polygon points={flip ? '760,828 736,840 760,852' : '1160,828 1184,840 1160,852'} fill={C.array} />
      <circle cx={px} cy={840} r={9} fill={C.array} style={{filter: `drop-shadow(0 0 10px ${C.array})`}} />
      {freeze > 0 ? vm(560, C.red, 'VM · Paused', freeze) : null}
      {vm(vmX, C.green, 'VM', move > 0.05 && move < 0.6 ? 0.35 + 0.65 * Math.abs(Math.cos(move * 6)) : 1)}
      {freeze > 0 ? (
        <text x={560} y={680} textAnchor="middle" fill={C.red} fontFamily={sans} fontSize={24} fontWeight={600} opacity={freeze}>
          needs manual cleanup
        </text>
      ) : null}
      <text x={960} y={1000} textAnchor="middle" fill={C.faint} fontFamily={sans} fontSize={22}>
        Recorded run direction: spoke-0 (home cluster) to spoke-1
      </text>
    </svg>
  );
};

const ColdOpen: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const n = typedCount(f);
  const click = prog(f, 90, 120);
  const fade = prog(f, dur * 0.3, dur * 0.42);
  const timer = prog(f, dur * 0.36, dur * 0.52);
  const secs = Math.round(62 * timer);
  const caretOn = n < TYPED.length || Math.floor(f / 30) % 2 === 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', background: C.bg}}>
      <div style={{position: 'absolute', width: '100%', top: 380 - fade * 310, textAlign: 'center', transform: `scale(${1 - fade * 0.45})`}}>
        <div style={{fontFamily: mono, fontSize: 150, color: C.text, fontWeight: 600, letterSpacing: 4}}>
          {TYPED.slice(0, n)}
          <span style={{display: 'inline-block', width: 18, height: 120, marginLeft: 10, verticalAlign: -10, background: C.blue, opacity: caretOn && fade < 0.5 ? 1 : 0}} />
        </div>
        <div style={{fontFamily: sans, fontSize: 34, color: C.dim, marginTop: 6, opacity: prog(f, 60, 90)}}>UTC · October 5 · one click in the hub console</div>
        {click > 0 && click < 1 ? (
          <div style={{position: 'absolute', left: '50%', top: 260, width: 0, height: 0}}>
            <div style={{position: 'absolute', left: -120 * click, top: -120 * click, width: 240 * click, height: 240 * click, borderRadius: '50%', border: `4px solid ${C.blue}`, opacity: 1 - click}} />
          </div>
        ) : null}
      </div>
      <ColdOpenDiagram f={f} dur={dur} appear={fade} move={prog(f, dur * 0.36, dur * 0.52)} freeze={prog(f, dur * 0.55, dur * 0.62)} />
      {timer > 0 ? (
        <div style={{position: 'absolute', right: 60, top: 50, fontFamily: mono, fontSize: 56, fontWeight: 600, color: timer >= 1 ? C.green : C.text, padding: '8px 24px', background: `${C.panel}ee`, borderRadius: 14, border: `2px solid ${timer >= 1 ? C.green : C.border}`, opacity: 1 - prog(f, dur * 0.94, dur)}}>
          +{Math.floor(secs / 60)}m {String(secs % 60).padStart(2, '0')}s
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const LEGEND_BEATS = ['3.2'];
const SHOT_WIN: [number, number] = [0.14, 0.97];

export const VirtDr291: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs, beatOrder} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');

  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  const beat = seg.type === 'beat' ? seg : beats.find((b) => b.from >= seg.from) ?? beats[beats.length - 1];
  const bIdx = beats.indexOf(beat);
  const prevId = bIdx > 0 && !beat.afterChapter ? beats[bIdx - 1].id : null;
  const f = seg.type === 'beat' ? frame - beat.from - PAD_BEFORE : -PAD_BEFORE;
  const ch = beat.chapter.n;
  const meta = META[beat.id] ?? {chapter: ''};
  const cam0 = camAt(beat.id, seg.type === 'chapter' ? null : prevId, f);
  let push = 1;
  if (seg.type === 'chapter') push = lerp(0.86, 0.9, prog(frame - seg.from, seg.dur - 30, seg.dur));
  else if (beat.afterChapter) push = lerp(0.9, 1, progIO(f, -PAD_BEFORE, sec(1.2)));
  const cam = {...cam0, z: cam0.z * push};
  const ctx: Ctx = {order: beatOrder, id: beat.id, f, dur: beat.audio, g: frame, zoom: cam.z};
  const legendA = LEGEND_BEATS.includes(beat.id) ? Math.min(prog(f, 30, 60), 1 - prog(f, beat.audio - 30, beat.audio)) : 0;
  const winA = (a: number, b: number) => Math.min(prog(f, beat.audio * a, beat.audio * a + 24), 1 - prog(f, beat.audio * b - 24, beat.audio * b));

  // SFX schedule (absolute frames)
  const sfx: {at: number; s: Sfx; v: number}[] = [];
  for (const b of beats) {
    const base = b.from + PAD_BEFORE;
    const add = (frac: number, s: Sfx, v: number) => sfx.push({at: base + Math.round(frac * b.audio), s, v});
    for (const [frac, s, v] of SFX[b.id] ?? []) add(frac, s, v);
    for (const [cb, frac] of CH) if (cb === b.id) add(frac, 'flip', 0.22);
    const m = META[b.id];
    if (m?.screenshot) {
      add(SHOT_WIN[0], 'whoosh', 0.2);
      add(SHOT_WIN[0] + 0.03, 'land', 0.18);
    }
    if (m?.define) add(0.05, 'pop', 0.2);
    if (m?.card) {
      add(0.0, 'pop', 0.25);
      for (const fr of [0.05, 0.2, 0.36, 0.5, 0.65]) add(fr, 'tick', 0.12);
    }
    if (b.id === '0.1') {
      for (let fr = 1; fr < 80; fr++) if (typedCount(fr) > typedCount(fr - 1)) sfx.push({at: base + fr, s: 'type', v: 0.35});
      sfx.push({at: base + 90, s: 'click', v: 0.5});
    }
  }
  for (const s of segs) if (s.type === 'chapter') sfx.push({at: s.from + 4, s: 'chime', v: 0.18});

  const showWorld = ch >= 2;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #0b1320, ${C.bg} 70%)`, overflow: 'hidden'}}>
      {showWorld ? (
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px, ${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}>
          <World c={ctx} />
        </div>
      ) : null}
      {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={beat.id} f={f} dur={beat.audio} card={meta.card} def={meta.def} /> : null}
      {seg.type === 'beat' && beat.id !== '0.1' ? <Hud chapter={beat.chapter.title} clock={CLOCK[beat.id] ?? null} ticket="VIRTDR-291" /> : null}
      {seg.type === 'beat' && ch >= 3 ? <PhaseTracker current={PHASE_OF[ch] ?? -1} phases={PHASES_291} /> : null}
      {seg.type === 'beat' && legendA > 0 ? <Legend appear={legendA} /> : null}
      {seg.type === 'beat' && ch >= 5 && ch <= 12 ? <TimelineBar now={CLOCK[beat.id] ?? null} events={EVENTS_291} /> : null}
      {seg.type === 'beat' && beat.id === '0.1' ? <ColdOpen f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' ? <BeatPanel id={beat.id} f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' && beat.id === '13.6' ? <ResultCard f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' && meta.screenshot ? (
        <Screenshot src={`evidence/virtdr-291/${meta.screenshot}`} focus={meta.focus} caption={meta.caption ?? ''} a={winA(SHOT_WIN[0], SHOT_WIN[1])} z={progIO(f, beat.audio * 0.25, beat.audio * 0.6)} y={178} date="2026-10-05" />
      ) : null}
      {seg.type === 'beat' && meta.define ? <DefinitionPanel term={meta.define.term} text={meta.define.text} a={winA(0.03, 0.98)} bottom={ch >= 5 && ch <= 12 ? 140 : 40} /> : null}
      {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
      {beats.map((b) => (
        <Sequence key={b.id} from={b.from + PAD_BEFORE} durationInFrames={b.audio + 10}>
          <Audio src={staticFile(`audio/virtdr-291/${b.id}.wav`)} volume={0.72} />
        </Sequence>
      ))}
      {sfx.map((x, i) => (
        <Sequence key={`sfx${i}`} from={x.at} durationInFrames={sec(1.6)}>
          <Audio src={staticFile(`sfx/${x.s}.wav`)} volume={x.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
