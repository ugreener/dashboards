import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, mono, sans} from '../theme';
import {prog} from '../lib/anim';

/** Full-frame plain-language term card for the primer and recap chapters. */
export const TermCard: React.FC<{term: string; text: string; f: number; dur: number}> = ({term, text, f, dur}) => {
  const a = prog(f, 0, 26);
  const out = prog(f, dur - 20, dur);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: a * (1 - out)}}>
      <div style={{width: 1320, padding: '54px 64px', borderRadius: 22, background: `linear-gradient(160deg, ${C.panel2}, ${C.panel})`, border: `1.5px solid ${C.border}`, borderLeft: `10px solid ${C.purple}`, boxShadow: '0 30px 90px #000a'}}>
        <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 4, color: C.purple, fontWeight: 700}}>PLAIN WORDS</div>
        <div style={{fontFamily: sans, fontSize: 62, fontWeight: 800, color: C.text, marginTop: 14, letterSpacing: -0.5}}>{term}</div>
        <div style={{fontFamily: sans, fontSize: 34, lineHeight: 1.45, color: C.dim, marginTop: 22}}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Cold open: the two appliances, one red and one green. */
export const ColdOpen: React.FC<{f: number; dur: number; settled?: boolean}> = ({f, dur, settled}) => {
  const t1 = settled ? 1 : prog(f, 0, 40);
  const t2 = settled ? 1 : prog(f, 45, 95);
  const t3 = settled ? 1 : prog(f, 100, 150);
  const out = settled ? 1 : 1 - prog(f, dur * 0.95, dur * 1.05);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #0b1320, ${C.bg} 70%)`, opacity: out}}>
      <div style={{position: 'absolute', width: '100%', top: 200, textAlign: 'center', opacity: t1}}>
        <div style={{fontFamily: mono, fontSize: 24, color: C.blue, letterSpacing: 6}}>POWERSTORE VSA · DEPLOYMENT RECONSTRUCTION</div>
        <div style={{fontFamily: sans, fontSize: 74, fontWeight: 800, color: C.text, marginTop: 16, letterSpacing: -1.5}}>
          When two halves cannot hear each other
        </div>
        <div style={{fontFamily: sans, fontSize: 30, color: C.dim, marginTop: 12}}>
          A failed install, the evidence, and the one network change that fixed it
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', gap: 60, opacity: t2}}>
        <div style={{width: 560, padding: '28px 34px', borderRadius: 18, border: `2px solid ${C.red}`, background: `${C.red}10`, boxShadow: `0 0 60px ${C.red}33`}}>
          <div style={{fontFamily: mono, fontSize: 20, color: C.red, letterSpacing: 3}}>FIRST APPLIANCE</div>
          <div style={{fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.text, marginTop: 8}}>Failed twice</div>
          <div style={{fontFamily: sans, fontSize: 24, color: C.dim, marginTop: 8}}>same point, same error, both nodes at a login prompt</div>
        </div>
        <div style={{width: 560, padding: '28px 34px', borderRadius: 18, border: `2px solid ${C.green}`, background: `${C.green}10`, boxShadow: `0 0 60px ${C.green}33`}}>
          <div style={{fontFamily: mono, fontSize: 20, color: C.green, letterSpacing: 3}}>SECOND APPLIANCE</div>
          <div style={{fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.text, marginTop: 8}}>Worked</div>
          <div style={{fontFamily: sans, fontSize: 24, color: C.dim, marginTop: 8}}>same kit, same day, same platform, same hardware</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', opacity: t3}}>
        <div style={{display: 'inline-flex', gap: 16, padding: '12px 22px', borderRadius: 12, border: `1px solid ${C.amber}`, background: `${C.amber}12`, fontFamily: mono, fontSize: 20, color: C.amber}}>
          RECONSTRUCTION · LIVE VCENTER CAPTURES · NOT A RECORDED TEST RUN
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Small on-screen honesty badge for beats that infer the mechanism. */
export const InferenceBadge: React.FC<{a: number}> = ({a}) =>
  a > 0 ? (
    <div style={{position: 'absolute', left: 40, bottom: 34, padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${C.amber}`, background: `${C.bg}e6`, fontFamily: sans, fontSize: 20, color: C.amber, opacity: a}}>
      INFERENCE · the internal error is not readable
    </div>
  ) : null;

/** Persistent reminder that this is a reconstruction, not a recorded run. */
export const HonestyBadge: React.FC = () => (
  <div style={{position: 'absolute', right: 34, top: 30, padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: `${C.bg}cc`, fontFamily: mono, fontSize: 15, color: C.faint}}>
    RECONSTRUCTION · NOT A RECORDED TEST RUN
  </div>
);
