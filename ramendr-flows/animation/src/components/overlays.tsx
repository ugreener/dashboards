import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, mono, sans} from '../theme';

/** Screen-space YAML panel; lines in `hl` glow, `reveal` 0..1 types lines in. */
export const YamlPanel: React.FC<{
  title: string;
  lines: string[];
  hl?: number[];
  appear: number;
  reveal?: number;
  x?: number;
  y?: number;
  w?: number;
}> = ({title, lines, hl = [], appear, reveal = 1, x = 1240, y = 170, w = 620}) => {
  if (appear <= 0) return null;
  const shown = Math.ceil(lines.length * reveal);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        opacity: appear,
        transform: `translateX(${(1 - appear) * 60}px)`,
        background: `${C.bg}f2`,
        border: `1.5px solid ${C.border}`,
        borderRadius: 14,
        boxShadow: '0 20px 60px #000c',
        overflow: 'hidden',
      }}
    >
      <div style={{padding: '10px 16px', background: C.panel, borderBottom: `1px solid ${C.border}`, fontFamily: mono, fontSize: 16, color: C.dim, display: 'flex', gap: 8, alignItems: 'center'}}>
        <span style={{width: 11, height: 11, borderRadius: 6, background: C.red}} />
        <span style={{width: 11, height: 11, borderRadius: 6, background: C.amber}} />
        <span style={{width: 11, height: 11, borderRadius: 6, background: C.green}} />
        <span style={{marginLeft: 10}}>{title}</span>
      </div>
      <pre style={{margin: 0, padding: '14px 0', fontFamily: mono, fontSize: 19, lineHeight: 1.55}}>
        {lines.slice(0, shown).map((l, i) => {
          const on = hl.includes(i);
          return (
            <div key={i} style={{padding: '0 18px', background: on ? `${C.amber}22` : undefined, borderLeft: `4px solid ${on ? C.amber : 'transparent'}`, color: on ? C.text : C.dim}}>
              {colorize(l)}
            </div>
          );
        })}
      </pre>
    </div>
  );
};

const colorize = (l: string) => {
  const m = l.match(/^(\s*-?\s*)([\w.\/-]+)(:)(.*)$/);
  if (!m) return <span>{l || ' '}</span>;
  return (
    <span>
      {m[1]}
      <span style={{color: C.blue}}>{m[2]}</span>
      {m[3]}
      <span style={{color: '#a5d6ff'}}>{m[4]}</span>
    </span>
  );
};

/** Full-screen chapter title card. */
export const ChapterCard: React.FC<{n: number; title: string; sub?: string; p: number; out: number}> = ({n, title, sub, p, out}) => (
  <AbsoluteFill style={{background: C.bg, justifyContent: 'center', alignItems: 'center', opacity: 1 - out}}>
    <div style={{textAlign: 'center', transform: `translateY(${(1 - p) * 30}px)`, opacity: p}}>
      <div style={{fontFamily: mono, fontSize: 30, color: C.blue, letterSpacing: 6}}>CHAPTER {n}</div>
      <div style={{fontFamily: sans, fontSize: 92, fontWeight: 800, color: C.text, marginTop: 18, letterSpacing: -1}}>{title}</div>
      {sub ? <div style={{fontFamily: sans, fontSize: 32, color: C.dim, marginTop: 18}}>{sub}</div> : null}
      <div style={{margin: '36px auto 0', height: 4, width: 520 * p, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius: 2}} />
    </div>
  </AbsoluteFill>
);

/** Persistent HUD: chapter label (top-left) and run clock (top-right). */
export const Hud: React.FC<{chapter: string; clock?: string | null; clockFlash?: number}> = ({chapter, clock, clockFlash = 0}) => (
  <>
    <div style={{position: 'absolute', left: 36, top: 28, fontFamily: sans, fontSize: 24, color: C.dim, fontWeight: 600, letterSpacing: 0.5, padding: '8px 18px', borderRadius: 10, background: `${C.bg}e6`, border: `1px solid ${C.border}`}}>
      <span style={{color: C.blue}}>VIRTDR-292</span>
      <span style={{margin: '0 14px', color: C.faint}}>/</span>
      {chapter}
    </div>
    {clock ? (
      <div
        style={{
          position: 'absolute',
          right: 48,
          top: 28,
          fontFamily: mono,
          fontSize: 40,
          fontWeight: 600,
          color: C.text,
          padding: '6px 18px',
          borderRadius: 10,
          background: `${C.panel}ee`,
          border: `1.5px solid ${clockFlash > 0 ? C.amber : C.border}`,
          boxShadow: clockFlash > 0 ? `0 0 ${40 * clockFlash}px ${C.amber}` : undefined,
        }}
      >
        {clock} <span style={{fontSize: 22, color: C.dim}}>UTC</span>
      </div>
    ) : null}
  </>
);

/** Small legend explaining arrow kinds, bottom-left. */
export const Legend: React.FC<{appear: number}> = ({appear}) => {
  const items: [string, string, boolean][] = [
    ['references', C.dim, true],
    ['delivers (ManifestWork)', C.cyan, false],
    ['observes (ManagedClusterView)', C.purple, true],
    ['replicates data', C.orange, false],
  ];
  return (
    <div style={{position: 'absolute', left: 36, bottom: 26, display: 'flex', gap: 26, opacity: appear, fontFamily: sans, fontSize: 18, color: C.dim, padding: '8px 18px', borderRadius: 10, background: `${C.bg}e6`, border: `1px solid ${C.border}`}}>
      {items.map(([t, c, d]) => (
        <span key={t} style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <svg width={36} height={10}>
            <line x1={0} y1={5} x2={36} y2={5} stroke={c} strokeWidth={3} strokeDasharray={d ? '5 5' : undefined} />
          </svg>
          {t}
        </span>
      ))}
    </div>
  );
};
