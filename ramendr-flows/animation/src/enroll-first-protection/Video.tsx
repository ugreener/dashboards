import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, mono, sans} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud} from '../components/overlays';
import {Def, DefinitionPanel, PhaseTracker} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT, REGIONS, REGION_OF} from './World';
import {BeatPanel, ColdOpen, GlossaryScene, LegendEF, PANEL_BEATS, PANEL_ONLY, PANEL_DATA, PHASES_EF} from './Panels';
import BEATS from './beats.json';

type Meta = {define?: {term: string; text: string}; card?: {kind: string; name: string; role: string}; def?: Def};
const META = BEATS as Record<string, Meta>;

const GLOSSARY_IDS = new Set(['1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '1.10']);

type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {
  // The class beat sits on the spoke cards. Push the hub row out of frame
  // instead of leaving sliced status lines at the top edge.
  '2.4': {z: 1.35, y: 520, sy: 555},
};

const fit = (id: string): Cam => {
  const keys = FOCUS[id] ?? Object.keys(RECT);
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const key of keys) {
    const r = RECT[key];
    if (!r) continue;
    x0 = Math.min(x0, r[0]);
    y0 = Math.min(y0, r[1]);
    x1 = Math.max(x1, r[0] + r[2]);
    y1 = Math.max(y1, r[1] + r[3]);
    const rk = REGION_OF[key];
    if (rk) {
      const reg = REGIONS.find((g) => g.key === rk)!;
      y0 = Math.min(y0, reg.b.y - 30);
      x0 = Math.min(x0, reg.b.x + 20);
    }
  }
  if (!Number.isFinite(x0) || !Number.isFinite(x1)) {
    return fit('__all__');
  }
  x0 -= 60;
  x1 += 60;
  y1 += 70;
  const left = 35,
    right = 1880,
    top = 210,
    bottom = 900;
  const z = Math.min(1.2, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};

const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[0.05, 'type', 0.2], [0.62, 'pop', 0.15]],
  '0.2': [[0.3, 'pop', 0.16]],
  '0.3': [[0.4, 'tick', 0.16]],
  '1.3': [[0.05, 'pop', 0.14]],
  '1.4': [[0.05, 'pop', 0.14]],
  '1.5': [[0.05, 'pop', 0.14]],
  '1.6': [[0.05, 'pop', 0.14]],
  '1.7': [[0.05, 'pop', 0.14]],
  '1.8': [[0.05, 'pop', 0.14]],
  '1.9': [[0.05, 'pop', 0.14]],
  '1.10': [[0.05, 'pop', 0.14]],
  '2.2': [[0.2, 'whoosh', 0.16]],
  '3.1': [[0.3, 'whoosh', 0.18]],
  '3.2': [[0.2, 'pop', 0.16]],
  '4.1': [[0.25, 'whoosh', 0.18]],
  '4.2': [[0.3, 'pop', 0.16]],
  '4.3': [[0.3, 'pop', 0.16]],
  '5.1': [[0.2, 'whoosh', 0.18]],
  '5.3': [[0.3, 'land', 0.18]],
  '5.5': [[0.3, 'chime', 0.18]],
  '6.2': [[0.3, 'chime', 0.2]],
  '6.5': [[0.25, 'alert', 0.16]],
  '7.3': [[0.2, 'tick', 0.18]],
  '7.6': [[0.4, 'chime', 0.2]],
};

export const EnrollFirstProtection: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');
  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  if (!seg) return <AbsoluteFill style={{background: C.bg}} />;
  const b = seg.type === 'beat' ? seg : beats.find((v) => v.from >= seg.from) ?? beats[beats.length - 1];
  const i = beats.indexOf(b),
    prev = i > 0 && !b.afterChapter ? beats[i - 1].id : b.id;
  const f = seg.type === 'beat' ? frame - b.from - PAD_BEFORE : -PAD_BEFORE;
  const target = fit(b.id),
    old = fit(prev);
  const p = progIO(f, -PAD_BEFORE, sec(1.6));
  const cam = {x: lerp(old.x, target.x, p), y: lerp(old.y, target.y, p), z: lerp(old.z, target.z, p), sx: lerp(old.sx, target.sx, p), sy: lerp(old.sy, target.sy, p)};
  const ch = b.chapter.n,
    m = META[b.id] ?? {};
  const win = (a: number, z: number) => Math.min(prog(f, b.audio * a, b.audio * a + 22), 1 - prog(f, b.audio * z - 22, b.audio));
  const glossary = GLOSSARY_IDS.has(b.id);
  const cold = ch === 0;
  const panelOnly = PANEL_ONLY.has(b.id);
  const showWorld = ch >= 1 && !glossary && b.id !== '1.1' && !panelOnly;
  const cues = beats.flatMap((beat) => {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    if (META[beat.id]?.card) list.push([0.04, 'pop', 0.16]);
    return list.map(([frac, name, v]) => ({at: base + Math.round(frac * beat.audio), name, v}));
  });
  const legendFrom = ch >= 3 && ch <= 6 && !PANEL_BEATS.has(b.id);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
      {showWorld ? (
        <div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}>
          <World c={{id: b.id, f, dur: b.audio, zoom: cam.z, panel: false}} />
        </div>
      ) : null}
      {showWorld ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 213, background: `linear-gradient(to bottom, ${C.bg} 0px, ${C.bg} 190px, transparent 212px)`}} />
      ) : null}
      {seg.type === 'beat' && cold ? <ColdOpen id={b.id} f={f} dur={b.audio} /> : null}
      {seg.type === 'beat' && (glossary || b.id === '1.1') ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def} /> : null}
      {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={null} ticket="DR ENROLLMENT" /> : null}
      {seg.type === 'beat' && ch >= 1 ? <PhaseTracker current={ch} phases={PHASES_EF} /> : null}
      {seg.type === 'beat' && legendFrom ? <LegendEF appear={win(0.04, 0.96)} /> : null}
      {seg.type === 'beat' && b.id === '7.6' ? (
        <div
          style={{
            position: 'absolute',
            left: 560,
            bottom: 40,
            width: 800,
            padding: '18px 26px',
            border: `3px solid ${C.green}`,
            borderRadius: 16,
            background: `${C.bg}f2`,
            boxShadow: `0 0 60px ${C.green}66`,
            textAlign: 'center',
            opacity: prog(f, b.audio * 0.55, b.audio * 0.55 + 22),
            transform: `scale(${0.92 + 0.08 * prog(f, b.audio * 0.55, b.audio * 0.55 + 22)})`,
          }}
        >
          <div style={{fontFamily: mono, fontSize: 34, color: C.green, fontWeight: 700, letterSpacing: 2}}>PROTECTED = TRUE</div>
          <div style={{fontFamily: sans, fontSize: 21, color: C.dim, marginTop: 6}}>the chain is complete</div>
        </div>
      ) : null}
      {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio} /> : null}
      {seg.type === 'beat' && m.define ? <DefinitionPanel term={m.define.term} text={m.define.text} a={win(0.05, 0.97)} bottom={150} /> : null}
      {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
      {beats.map((beat) => (
        <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}>
          <Audio src={staticFile(`audio/enroll-first-protection/${beat.id}.wav`)} volume={0.72} />
        </Sequence>
      ))}
      {cues.map((cue, k) => (
        <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}>
          <Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
