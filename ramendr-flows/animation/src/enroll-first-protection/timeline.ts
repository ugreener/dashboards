import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter = {n: number; title: string; sub?: string};
export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'Cold open'},
  {n: 1, title: 'Cast of characters', sub: 'The objects that make a Protected application'},
  {n: 2, title: 'The policy pairs the sites', sub: 'Two clusters, one interval'},
  {n: 3, title: 'Enrollment', sub: 'The application enters the record'},
  {n: 4, title: 'The hub hands over', sub: 'One VRG per site, one work order per disk'},
  {n: 5, title: 'The array takes the order', sub: 'Rule, session, first copy'},
  {n: 6, title: 'First Protected', sub: 'What the conditions prove'},
  {n: 7, title: 'What the record proves', sub: 'Evidence, checks and the rule'},
];
export type Segment =
  | {type: 'chapter'; chapter: Chapter; from: number; dur: number}
  | {type: 'beat'; id: string; chapter: Chapter; from: number; dur: number; audio: number; afterChapter: boolean};
export const PAD_BEFORE = sec(0.35);
export const buildTimeline = (chapters: number[]) => {
  const t = timing as Record<string, {seconds: number; pause?: number}>;
  const ids = Object.keys(t)
    .filter((id) => chapters.includes(Number(id.split('.')[0])))
    .sort((a, b) => {
      const x = a.split('.').map(Number);
      const y = b.split('.').map(Number);
      return x[0] - y[0] || x[1] - y[1];
    });
  const segs: Segment[] = [];
  let f = 0,
    last = -1;
  for (const id of ids) {
    const ch = CHAPTERS[Number(id.split('.')[0])];
    const afterChapter = ch.n !== last && ch.n > 0;
    if (afterChapter) {
      segs.push({type: 'chapter', chapter: ch, from: f, dur: sec(2.6)});
      f += sec(2.6);
    }
    last = ch.n;
    const audio = Math.ceil(t[id].seconds * FPS);
    const dur = PAD_BEFORE + audio + sec(t[id].pause ?? 0.8);
    segs.push({type: 'beat', id, chapter: ch, from: f, dur, audio, afterChapter});
    f += dur;
  }
  return {segs, total: f, beatOrder: ids};
};
