import React from 'react';
import {C, sans} from '../theme';
import {prog} from '../lib/anim';

export const PHASES_QA = ['Cast', 'Who creates', 'Ownership', 'Labels', 'Installer', 'Sources', 'Installed', 'Order', 'Hub', 'Recap'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '0.1': {title: 'Dell PowerStore + RamenDR', rows: ['The questions raised while building the second environment', 'Who creates the copy on the array', 'Where the labels and the images come from', 'Whether the hub needs virtualization'], color: C.cyan},
  '2.3': {title: 'So who creates the array objects?', rows: ['The driver, from the class, on behalf of the VRG', 'A policy, a rule, a session, and a replica on the peer', 'A DRPC with no matching class never reaches the array'], color: C.green},
  '3.1': {title: 'Inputs and generated objects', rows: ['You or the console: DRClusters, DRPolicy, DRPC, classes', 'Ramen: the VRG and the replication requests', 'Driver: protection policy, rule and session'], color: C.blue},
  '4.2': {title: 'Same or different', rows: ['storageid: different on the two clusters', 'replicationid and groupreplicationid: same on both', 'The Dell bundle arrived pre-filled', 'Hand-written files: any unique string, same rule'], color: C.amber},
  '6.1': {title: 'Where the list lives', rows: ['Bundle settings.yaml, in the images block', 'Includes the optional images kept switched off', 'Dell offline bundle guide collects the set', 'A bundle is built per cluster'], color: C.cyan},
  '7.2': {title: 'One chart, one separate controller', rows: ['Chart: driver plus the csi-addons sidecar', 'Controller: bare Deployment in csi-addons-system', 'The two builds have to match each other'], color: C.cyan},
  '8.3': {title: 'Prove it with one disk', rows: ['The request reaches Primary and Replicating', 'A matching session appears on the source array', 'Then delete the test disk'], color: C.green},
  '9.2': {title: 'If you skip virtualization', rows: ['Provide another StorageClass for MinIO', 'Or a static hostPath volume', 'The console integration also installs MTV', 'Check hub CPU and memory first'], color: C.amber},
  '10.1': {title: 'The short version', rows: ['You own the policy and the classes', 'Ramen writes the per-cluster requests', 'The driver creates the array objects', 'Labels come with the bundle, nine containers to install', 'Hub virtualization is console and MinIO storage'], color: C.green},
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  const cold = id === '0.1';
  const recap = id === '10.1';
  return (
    <div style={{position: 'absolute', left: cold ? 170 : 900, top: cold ? 290 : recap ? 250 : 220, width: cold ? 1580 : 950, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: `${C.panel}f7`, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
      <div style={{fontSize: cold ? 48 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 24}}>{d.title}</div>
      {d.rows.map((r, i) => (
        <div key={i} style={{marginTop: 18, fontSize: cold ? 34 : 25, lineHeight: 1.35, color: C.text, opacity: prog(f, dur * (0.03 + i * 0.055), dur * (0.03 + i * 0.055) + 22), transform: `translateX(${(1 - prog(f, dur * (0.03 + i * 0.055), dur * (0.03 + i * 0.055) + 22)) * 22}px)`, overflowWrap: 'break-word'}}>{r}</div>
      ))}
    </div>
  );
};
