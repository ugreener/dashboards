import timing from './timing.json';
import {FPS, sec} from '../lib/anim';

export type Chapter = {n: number; title: string; sub?: string};

export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'Cold open'},
  {n: 1, title: 'Cast of characters', sub: 'Every object in this story, in plain words'},
  {n: 2, title: 'A VM is a pod', sub: 'There is no hypervisor to log into'},
  {n: 3, title: 'The storage path', sub: 'PVC, PV, CSI driver, array volume'},
  {n: 4, title: 'The network path', sub: 'The guest IP is cluster-local'},
  {n: 5, title: 'What DR must rebuild', sub: 'Disk, objects, guest'},
  {n: 6, title: 'The replication layer', sub: 'VolumeReplication to array session'},
  {n: 7, title: 'The orchestration layer', sub: 'Placement, DRPC, VRG, S3'},
  {n: 8, title: 'Failover walkthrough', sub: 'Promote, restore, place, boot'},
  {n: 9, title: 'Managed GitOps apps', sub: 'ApplicationSet and Argo CD'},
  {n: 10, title: 'Zerto versus this model', sub: 'Where the write stream lives'},
  {n: 11, title: 'A blueprint for Zerto', sub: 'Discover, copy, store, place, restore'},
  {n: 12, title: 'Recap and readiness', sub: 'The chain in one page'},
];

export type Segment =
  | {type: 'chapter'; chapter: Chapter; from: number; dur: number}
  | {type: 'beat'; id: string; chapter: Chapter; from: number; dur: number; audio: number; afterChapter: boolean};

const PAD_BEFORE = sec(0.35);
const PAD_AFTER = sec(0.9);
const CHAPTER_CARD = sec(2.6);

const T = timing as Record<string, {seconds: number; pause?: number}>;

/** Build the ordered segment list for the given chapters (beats with generated audio only). */
export const buildTimeline = (chapters: number[]) => {
  const ids = Object.keys(T).filter((id) => chapters.includes(Number(id.split('.')[0])));
  const segs: Segment[] = [];
  let f = 0;
  let lastCh = -1;
  for (const id of ids) {
    const ch = CHAPTERS[Number(id.split('.')[0])];
    if (ch.n !== lastCh && ch.n > 0) {
      segs.push({type: 'chapter', chapter: ch, from: f, dur: CHAPTER_CARD});
      f += CHAPTER_CARD;
    }
    lastCh = ch.n;
    const audio = Math.ceil(T[id].seconds * FPS);
    const dur = PAD_BEFORE + audio + (T[id].pause !== undefined ? sec(T[id].pause as number) : PAD_AFTER);
    segs.push({type: 'beat', id, chapter: ch, from: f, dur, audio, afterChapter: segs.length > 0 && segs[segs.length - 1].type === 'chapter'});
    f += dur;
  }
  return {segs, total: f, beatOrder: ids};
};

export {PAD_BEFORE};
