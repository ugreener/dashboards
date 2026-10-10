import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, mono, sans} from '../theme';
import {lerp} from '../lib/anim';

export type Rect = {x: number; y: number; w: number; h: number};

/**
 * Historical run screenshot in a browser-style frame on the right half of the screen.
 * `a` 0..1 slide-in/out, `z` 0..1 slow zoom toward `focus` (image pixels, 1920x1080 source).
 */
export const Screenshot: React.FC<{src: string; focus?: Rect; caption: string; a: number; z: number; x?: number; y?: number; w?: number}> = ({
  src,
  focus,
  caption,
  a,
  z,
  x = 860,
  y = 150,
  w = 1040,
}) => {
  if (a <= 0) return null;
  const IW = 1920;
  const IH = 1080;
  const h = (w * IH) / IW;
  // zoom so the focus box fills at most ~70% of the frame width
  const f = focus ?? {x: 0, y: 0, w: IW, h: IH};
  const maxZ = Math.max(1, Math.min(2.4, (IW * 0.96) / f.w, (IH * 0.9) / f.h));
  const s = lerp(1, maxZ, z);
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2;
  // translate so the focus centre moves toward the frame centre, clamped to the image edges
  const tx = Math.min(0, Math.max(IW - IW * s, IW / 2 - cx * s));
  const ty = Math.min(0, Math.max(IH - IH * s, IH / 2 - cy * s));
  const k = w / IW;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        opacity: Math.min(1, a * 1.4),
        transform: `translateX(${(1 - a) * 80}px)`,
        borderRadius: 14,
        overflow: 'hidden',
        border: `1.5px solid ${C.border}`,
        background: C.bg,
        boxShadow: '0 24px 70px #000d',
      }}
    >
      <div style={{height: 34, background: C.panel, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px'}}>
        <span style={{width: 11, height: 11, borderRadius: 6, background: C.red}} />
        <span style={{width: 11, height: 11, borderRadius: 6, background: C.amber}} />
        <span style={{width: 11, height: 11, borderRadius: 6, background: C.green}} />
        <span style={{marginLeft: 14, fontFamily: mono, fontSize: 15, color: C.faint}}>hub console · historical capture</span>
      </div>
      <div style={{position: 'relative', width: w, height: h, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: IW, height: IH, transformOrigin: '0 0', transform: `scale(${k}) translate(${tx}px, ${ty}px) scale(${s})`}}>
          <Img src={staticFile(src)} style={{width: IW, height: IH, display: 'block'}} />
          {focus ? (
            <div
              style={{
                position: 'absolute',
                left: focus.x - 8,
                top: focus.y - 8,
                width: focus.w + 16,
                height: focus.h + 16,
                border: `${4 / s}px solid ${C.amber}`,
                borderRadius: 10 / s,
                boxShadow: `0 0 ${24 / s}px ${C.amber}, inset 0 0 ${18 / s}px ${C.amber}55`,
                opacity: Math.min(1, z * 3),
              }}
            />
          ) : null}
        </div>
      </div>
      <div style={{padding: '12px 18px', background: C.panel, borderTop: `1px solid ${C.border}`, fontFamily: sans, fontSize: 20, color: C.text, lineHeight: 1.35}}>
        <span style={{color: C.amber, fontWeight: 700}}>Captured during the run</span>
        <span style={{color: C.faint}}> · 2026-10-07 · </span>
        {caption}
      </div>
    </div>
  );
};

export const PHASES = ['Protect', 'Gate', 'Initiate', 'Validate', 'Promote', 'Switch placement', 'Redeploy', 'Clean up', 'Complete', 'Verify data'];

/** Persistent phase tracker, top centre under the HUD. `current` index into PHASES (-1 hides highlight). */
export const PhaseTracker: React.FC<{current: number; appear?: number}> = ({current, appear = 1}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center', opacity: appear}}>
    <div style={{display: 'flex', gap: 6, padding: '6px 10px', borderRadius: 12, background: `${C.bg}e6`, border: `1px solid ${C.border}`, fontFamily: sans}}>
      {PHASES.map((p, i) => {
        const on = i === current;
        const done = i < current;
        return (
          <div
            key={p}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              fontSize: 17,
              fontWeight: on ? 700 : 500,
              color: on ? C.bg : done ? C.text : C.faint,
              background: on ? C.blue : done ? `${C.blue}22` : 'transparent',
              border: `1px solid ${on ? C.blue : done ? `${C.blue}55` : C.border}`,
              whiteSpace: 'nowrap',
            }}
          >
            {i + 1}. {p}
          </div>
        );
      })}
    </div>
  </div>
);

/** Short definition of a status word or concept, bottom-left above the timeline. */
export const DefinitionPanel: React.FC<{term: string; text: string; a: number; x?: number; bottom?: number}> = ({term, text, a, x = 40, bottom = 150}) =>
  a > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: x,
        bottom,
        width: 620,
        opacity: a,
        transform: `translateY(${(1 - a) * 24}px)`,
        background: `${C.bg}f4`,
        border: `1.5px solid ${C.purple}`,
        borderLeft: `6px solid ${C.purple}`,
        borderRadius: 12,
        padding: '14px 20px',
        fontFamily: sans,
        boxShadow: '0 16px 50px #000c',
      }}
    >
      <div style={{fontSize: 15, letterSpacing: 2, color: C.purple, fontWeight: 700}}>NEW TERM</div>
      <div style={{fontFamily: mono, fontSize: 26, color: C.text, fontWeight: 600, marginTop: 4}}>{term}</div>
      <div style={{fontSize: 21, color: C.dim, marginTop: 6, lineHeight: 1.35}}>{text}</div>
    </div>
  ) : null;

export type Def = {what: string; creator: string; reader: string; where: string; analogy: string};

/** Glossary definition panel: what / who creates / who reads / where / analogy, rows revealed by `p` 0..1. */
export const GlossaryPanel: React.FC<{d: Def; p: number; x?: number; y?: number; w?: number}> = ({d, p, x = 860, y = 210, w = 1000}) => {
  const rows: [string, string, string][] = [
    ['What it is', d.what, C.text],
    ['Created by', d.creator, C.dim],
    ['Read by', d.reader, C.dim],
    ['Lives on', d.where, C.dim],
    ['Like', d.analogy, C.amber],
  ];
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: sans}}>
      {rows.map(([k, v, col], i) => {
        const a = Math.min(1, Math.max(0, p * 6 - i));
        return (
          <div key={k} style={{display: 'flex', gap: 22, marginBottom: 22, opacity: a, transform: `translateX(${(1 - a) * 30}px)`}}>
            <div style={{flex: 'none', width: 150, fontSize: 18, letterSpacing: 1.5, textTransform: 'uppercase', color: C.purple, fontWeight: 700, paddingTop: 5}}>{k}</div>
            <div style={{fontSize: i === 0 ? 30 : 27, lineHeight: 1.35, color: col, fontStyle: i === 4 ? 'italic' : undefined}}>{v}</div>
          </div>
        );
      })}
    </div>
  );
};
