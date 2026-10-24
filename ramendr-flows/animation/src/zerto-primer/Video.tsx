import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, mono, sans} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud} from '../components/overlays';
import {DefinitionPanel, PhaseTracker, Screenshot, Def} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {Ctx, FOCUS, RECT, World} from './World';
import {BeatPanel, BlueprintScene, ClosingCard, CompareScene, GlossaryScene, PANEL_BEATS} from './Panels';
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
const WORLD: [number, number, number, number] = [0, 20, 2600, 1700];

const fit = (id: string): Cam => {
  const ch = Number(id.split('.')[0]);
  const side = !!META[id]?.screenshot || PANEL_BEATS.has(id);
  const top = ch >= 2 ? 175 : 90;
  const bottom = 1045;
  const areaX0 = side ? 30 : 40;
  const areaX1 = side ? 845 : 1880;
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
    const pad = 70;
    x0 -= pad;
    y0 -= pad + 55;
    x1 += pad;
    yb += pad;
  }
  const z = Math.max(0.3, Math.min(1.25, (areaX1 - areaX0) / (x1 - x0), (bottom - top) / (yb - y0)));
  const cam: Cam = {x: (x0 + x1) / 2, y: (y0 + yb) / 2, z, sx: (areaX0 + areaX1) / 2, sy: (top + bottom) / 2};
  return cam;
};

const camAt = (id: string, prevId: string | null, f: number): Cam => {
  const to = fit(id);
  const from = prevId ? fit(prevId) : to;
  const t = progIO(f, -PAD_BEFORE, sec(1.6));
  return {x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), z: lerp(from.z, to.z, t), sx: lerp(from.sx, to.sx, t), sy: lerp(from.sy, to.sy, t)};
};

/** Chapter to phase index in the tracker. */
const PHASES = ['VM', 'Storage', 'Network', 'DR basics', 'Replicate', 'Orchestrate', 'Fail over', 'GitOps', 'Recap'];
const PHASE_OF: Record<number, number> = {2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 12: 8};

// ---------------- sound effects ----------------
type Sfx = 'click' | 'type' | 'pop' | 'tick' | 'whoosh' | 'land' | 'flip' | 'chime' | 'alert';
const SFX: Record<string, [number, Sfx, number][]> = {
  '0.1': [[0.15, 'whoosh', 0.3], [0.4, 'pop', 0.25], [0.62, 'land', 0.28], [0.8, 'chime', 0.25]],
  '2.1': [[0.1, 'pop', 0.22], [0.22, 'pop', 0.22], [0.34, 'pop', 0.2], [0.48, 'pop', 0.2], [0.62, 'pop', 0.2], [0.78, 'land', 0.25]],
  '3.1': [[0.1, 'pop', 0.22], [0.25, 'pop', 0.2], [0.4, 'pop', 0.2], [0.55, 'pop', 0.2], [0.7, 'tick', 0.2]],
  '3.6': [[0.3, 'tick', 0.2], [0.55, 'tick', 0.2], [0.8, 'tick', 0.2]],
  '5.3': [[0.05, 'pop', 0.22], [0.22, 'pop', 0.22], [0.38, 'pop', 0.22]],
  '6.6': [[0.35, 'flip', 0.3]],
  '7.1': [[0.1, 'pop', 0.2], [0.25, 'pop', 0.2], [0.4, 'pop', 0.2], [0.55, 'pop', 0.2], [0.7, 'pop', 0.2], [0.85, 'land', 0.22]],
  '7.6': [[0.2, 'whoosh', 0.28], [0.55, 'land', 0.28]],
  '8.4': [[0.4, 'flip', 0.32]],
  '8.7': [[0.55, 'chime', 0.28]],
  '9.2': [[0.3, 'whoosh', 0.22], [0.55, 'land', 0.22]],
  '10.5': [[0.15, 'tick', 0.2], [0.35, 'tick', 0.2], [0.55, 'tick', 0.2], [0.75, 'tick', 0.2]],
  '11.2': [[0.1, 'pop', 0.2]],
  '11.3': [[0.1, 'pop', 0.2]],
  '11.4': [[0.1, 'pop', 0.2]],
  '11.5': [[0.1, 'pop', 0.2]],
  '11.6': [[0.1, 'pop', 0.2]],
  '11.7': [[0.1, 'pop', 0.2]],
  '11.8': [[0.1, 'pop', 0.2]],
  '11.9': [[0.3, 'alert', 0.2]],
  '12.5': [[0.05, 'chime', 0.28]],
};

// ---------------- cold open ----------------
const ColdOpen: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const t1 = prog(f, 0, 40);
  const t2 = prog(f, 40, 80);
  const t3 = prog(f, 90, 150);
  const pulse = (f % 120) / 120;
  const out = 1 - prog(f, dur * 0.95, dur * 1.05);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #0b1320, ${C.bg} 70%)`, opacity: out}}>
      <div style={{position: 'absolute', width: '100%', top: 210, textAlign: 'center', opacity: t1}}>
        <div style={{fontFamily: mono, fontSize: 26, color: C.blue, letterSpacing: 6}}>OPENSHIFT VIRTUALIZATION · DISASTER RECOVERY</div>
        <div style={{fontFamily: sans, fontSize: 78, fontWeight: 800, color: C.text, marginTop: 14, letterSpacing: -1}}>A primer for the Zerto team</div>
        <div style={{fontFamily: sans, fontSize: 30, color: C.dim, marginTop: 10}}>How a VM runs as a pod, and what it takes to recover it</div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: t2}}>
        <rect x={330} y={520} width={520} height={230} rx={18} fill={`${C.spoke0}12`} stroke={C.spoke0} strokeWidth={2.5} strokeDasharray="10 8" />
        <text x={350} y={505} fill={C.spoke0} fontFamily={sans} fontSize={22} fontWeight={700}>virt-launcher pod</text>
        <rect x={380} y={570} width={230} height={120} rx={14} fill={C.panel2} stroke={C.green} strokeWidth={3} />
        <text x={495} y={615} textAnchor="middle" fill={C.green} fontFamily={sans} fontSize={24} fontWeight={700}>VM</text>
        <text x={495} y={648} textAnchor="middle" fill={C.text} fontFamily={mono} fontSize={19}>hammerdb-rhel9</text>
        <rect x={650} y={570} width={170} height={120} rx={14} fill={C.panel} stroke={C.border} strokeWidth={2} />
        <text x={735} y={615} textAnchor="middle" fill={C.amber} fontFamily={mono} fontSize={18}>QEMU</text>
        <text x={735} y={645} textAnchor="middle" fill={C.dim} fontFamily={mono} fontSize={16}>libvirt</text>
        <rect x={980} y={560} width={230} height={120} rx={14} fill={`${C.array}14`} stroke={C.array} strokeWidth={2.5} />
        <text x={1095} y={605} textAnchor="middle" fill={C.array} fontFamily={mono} fontSize={22} fontWeight={600}>VSA-A</text>
        <text x={1095} y={638} textAnchor="middle" fill={C.dim} fontFamily={mono} fontSize={17}>array volume</text>
        <rect x={1330} y={560} width={230} height={120} rx={14} fill={`${C.array}14`} stroke={C.array} strokeWidth={2.5} />
        <text x={1445} y={605} textAnchor="middle" fill={C.array} fontFamily={mono} fontSize={22} fontWeight={600}>VSA-B</text>
        <text x={1445} y={638} textAnchor="middle" fill={C.dim} fontFamily={mono} fontSize={17}>replica copy</text>
        <line x1={1210} y1={620} x2={1330} y2={620} stroke={C.array} strokeWidth={4} />
        <circle cx={1210 + 120 * pulse} cy={620} r={8} fill={C.array} style={{filter: `drop-shadow(0 0 10px ${C.array})`}} />
        <text x={1270} y={705} textAnchor="middle" fill={C.amber} fontFamily={mono} fontSize={16}>15m async</text>
        <line x1={610} y1={630} x2={650} y2={630} stroke={C.green} strokeWidth={3} />
        <line x1={820} y1={630} x2={980} y2={620} stroke={C.amber} strokeWidth={3} strokeDasharray="8 6" />
        <text x={900} y={600} textAnchor="middle" fill={C.amber} fontFamily={mono} fontSize={16}>PVC</text>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 870, display: 'flex', justifyContent: 'center', gap: 34, opacity: t3}}>
        {[
          ['VM', 'a Kubernetes object'],
          ['Disk', 'a CSI volume on the array'],
          ['DR', 'blocks + objects + placement'],
        ].map(([a, b], i) => (
          <div key={a} style={{padding: '14px 26px', border: `1.5px solid ${C.border}`, borderRadius: 12, background: `${C.panel}cc`, opacity: prog(f, 100 + i * 15, 115 + i * 15)}}>
            <div style={{fontFamily: mono, fontSize: 26, color: C.text}}>{a}</div>
            <div style={{fontFamily: sans, fontSize: 18, color: C.dim}}>{b}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const SHOT_WIN: [number, number] = [0.12, 0.95];

export const ZertoPrimer: React.FC<{chapters: number[]}> = ({chapters}) => {
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
  const winA = (a: number, b: number) => Math.min(prog(f, beat.audio * a, beat.audio * a + 24), 1 - prog(f, beat.audio * b - 24, beat.audio * b));

  // SFX schedule (absolute frames)
  const sfx: {at: number; s: Sfx; v: number}[] = [];
  for (const b of beats) {
    const base = b.from + PAD_BEFORE;
    const add = (frac: number, s: Sfx, v: number) => sfx.push({at: base + Math.round(frac * b.audio), s, v});
    for (const [frac, s, v] of SFX[b.id] ?? []) add(frac, s, v);
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
    if (b.id === '0.1') for (let fr = 1; fr < 40; fr += 2) sfx.push({at: base + fr, s: 'type', v: 0.18});
  }
  for (const s of segs) if (s.type === 'chapter') sfx.push({at: s.from + 4, s: 'chime', v: 0.18});

  const showWorld = (ch >= 2 && ch <= 9) || ch === 12;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #0b1320, ${C.bg} 70%)`, overflow: 'hidden'}}>
      {showWorld ? (
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px, ${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}>
          <World c={ctx} />
        </div>
      ) : null}
      {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={beat.id} f={f} dur={beat.audio} card={meta.card} def={meta.def} /> : null}
      {seg.type === 'beat' && ch === 10 ? <CompareScene id={beat.id} f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' && ch === 11 ? <BlueprintScene id={beat.id} f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' && beat.id !== '0.1' ? <Hud chapter={beat.chapter.title} ticket="ZERTO PRIMER" /> : null}
      {seg.type === 'beat' && PHASE_OF[ch] !== undefined ? <PhaseTracker current={PHASE_OF[ch]} phases={PHASES} /> : null}
      {seg.type === 'beat' && beat.id === '0.1' ? <ColdOpen f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' ? <BeatPanel id={beat.id} f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' && beat.id === '12.5' ? <ClosingCard f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' && meta.screenshot ? (
        <Screenshot
          src={`evidence/zerto-primer/${meta.screenshot}`}
          focus={meta.focus}
          caption={meta.caption ?? ''}
          a={winA(SHOT_WIN[0], SHOT_WIN[1])}
          z={progIO(f, beat.audio * 0.25, beat.audio * 0.6)}
          y={168}
          date="2026-10-24"
          sourceLabel="hub console · live capture"
        />
      ) : null}
      {seg.type === 'beat' && meta.define ? <DefinitionPanel term={meta.define.term} text={meta.define.text} a={winA(0.03, 0.98)} bottom={60} /> : null}
      {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
      {beats.map((b) => (
        <Sequence key={b.id} from={b.from + PAD_BEFORE} durationInFrames={b.audio + 10}>
          <Audio src={staticFile(`audio/zerto-primer/${b.id}.wav`)} volume={0.72} />
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
