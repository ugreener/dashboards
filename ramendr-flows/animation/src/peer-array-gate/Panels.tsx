import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES = ['Lose site','Promote','Resync','Gate','Why it matters'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string; monoRows?: number[]}> = {
  '2.4':{title:'What the surviving array still had',rows:['Last completed syncs: 11:35:41 to 11:46:01','Policy: 15 minutes, or 900 seconds','Age at initiate: between 6 and 12 minutes','Inside the objective, so data loss is bounded.'],color:C.green},
  '3.3':{title:'Eight sessions, promoted',rows:['role=Source · state=Failed_Over · error_code=None','hammerdb · 2 disks','hammerdb-win · 2 disks','gitops-vms · 2 disks','gitops-vms-win · 2 disks'],monoRows:[0]},
  '3.4':{title:'Bound to the promoted handles',rows:['hammerdb: csivol-841ca78019 · csivol-3471d7938c','hammerdb-win: csivol-eed36e44ac · csivol-b173a3affa','gitops-vms: csivol-ec5862ac71 · csivol-f756724d1d','gitops-vms-win: csivol-c27a45ef86 · csivol-183da295cc','Driver log: session is already primary'],monoRows:[0,1,2,3],color:C.green},
  '4.4':{title:'VolumeReplication · all eight',rows:['Completed=False (FailedToResync)','Degraded=True (Error)','Resyncing=False (FailedToResync)','Reprotect operation failed because the remote peer','replication session is not in FAILED OVER state yet.'],monoRows:[0,1,2,3,4],color:C.red},
  '4.5':{title:'The second peer-dependent signal',rows:['DestinationInfoAvailable=False (DestinationInfoPending)','volume destination info is pending update','Ramen skips the destination-handle annotation','A step that waits for a peer cannot finish alone.'],monoRows:[0],color:C.amber},
  '5.2':{title:'The message names the symptom',rows:['DataReady=False (Error)','All PVCs of the VolumeReplicationGroup are not ready','Per claim: volume failed to resync','It never mentions the peer array.'],monoRows:[1,2],color:C.red},
  '5.4':{title:'Three conditions, two of them true',rows:['ClusterDataReady=True (Restored)','Restored 0 volsync PVs/PVCs and 4 volrep PVs/PVCs','KubeObjectsReady=True (Unused)','k8s resource restore skipped as Secondary','DataReady=False (Error)'],monoRows:[0,1,2,3,4],color:C.amber},
  '5.6':{title:'DRPC · all four applications',rows:['phase=FailedOver','progression=WaitForReadiness','Available=False (FailingOver)','PeerReady=False (NotStarted)','Protected=True'],monoRows:[0,1,2,3,4],color:C.orange},
  '6.4':{title:'What a control run would settle',rows:['Same four applications, same node suspension','Both arrays left running','Reprotect succeeds, because the peer answers','Earlier runs in this lab are that control in spirit'],color:C.green},
  '6.5':{title:'What the product documentation promises',rows:['Fail over when a managed cluster becomes','unavailable, due to any reason.','Recovering to a replacement cluster:','fail over all protected applications first.'],color:C.blue},
  '6.6':{title:'What this run proves',rows:['Promotion and binding can succeed alone.','The application can still be down.','The reason is visible in two conditions.','Recorded on the real lab, not inferred.'],color:C.green},
  '6.7':{title:'What this run does not prove',rows:['That the stall is permanent','That four concurrent failovers played no part','That the deployed build matches upstream source','There is no run log and no paired control'],color:C.amber},
};

export const CODE_DATA: Record<string, {title: string; file: string; lines: string[]; hl: number[]}> = {
  '6.1':{title:'csi-powerstore · resync path',file:'pkg/controller/csiaddons_replication.go',hl:[2,3,4,5,6],lines:[
    'case gopowerstore.RsStateFailedOver:',
    '  if localIsPrimary {              // promoted side',
    '    ExecuteAction(session, client,',
    '      gopowerstore.RsActionReprotect, nil)',
    '    if err != nil { return nil, err }   // peer gone',
    '    return &ResyncVolumeResponse{Ready: false}, nil',
    '  }',
  ]},
  '6.2':{title:'RamenDR · readiness from completion',file:'internal/controller/vrg_volrep.go',hl:[1,2,3,4],lines:[
    'validateVRStatus -> validateVRCompletedStatus',
    '  completed, _, msg := isVRConditionMet(',
    '    volRep, status, ConditionCompleted, True)',
    '  if !completed {',
    '    updatePVCDataReadyCondition(Error, msg)',
    '    return false',
    '  }',
  ]},
};

export const PANEL_BEATS = new Set([...Object.keys(PANEL_DATA), ...Object.keys(CODE_DATA)]);

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const code = CODE_DATA[id];
  if (code) {
    const a = prog(f, 0, 24);
    return <div style={{position:'absolute', left:900, top:210, width:960, padding:0, border:`2px solid ${C.purple}`, borderRadius:16, background:`${C.bg}f7`, opacity:a, fontFamily:mono, boxShadow:'0 20px 70px #000c', overflow:'hidden'}}>
      <div style={{padding:'12px 22px', background:C.panel, borderBottom:`1px solid ${C.border}`, fontSize:15, color:C.dim}}>{code.file}</div>
      <div style={{padding:'18px 22px 10px', fontSize:24, color:C.purple, fontFamily:sans, fontWeight:700}}>{code.title}</div>
      {code.lines.map((l,i)=><div key={i} style={{padding:'3px 22px', fontSize:19, lineHeight:1.45, whiteSpace:'pre', color:code.hl.includes(i)?C.text:C.faint, background:code.hl.includes(i)?`${C.amber}18`:undefined, borderLeft:`4px solid ${code.hl.includes(i)?C.amber:'transparent'}`, opacity:prog(f,dur*(.03+i*.045),dur*(.03+i*.045)+18)}}>{l}</div>)}
      <div style={{padding:'14px 22px 20px', fontFamily:sans, fontSize:19, color:C.dim}}>Upstream main. The deployed build is not recorded in the ticket.</div>
    </div>;
  }
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  return <div style={{position:'absolute', left:900, top:220, width:950, padding:30, border:`2px solid ${d.color ?? C.blue}`, borderRadius:20, background:`${C.bg}f5`, opacity:a, fontFamily:sans, boxShadow:'0 20px 70px #000c'}}>
    <div style={{fontSize:29, fontWeight:700, color:d.color ?? C.blue, marginBottom:22}}>{d.title}</div>
    {d.rows.map((r,i)=><div key={i} style={{marginTop:16, fontSize:24, lineHeight:1.35, color:C.text, opacity:prog(f,dur*(.03+i*.05),dur*(.03+i*.05)+22), transform:`translateX(${(1-prog(f,dur*(.03+i*.05),dur*(.03+i*.05)+22))*20}px)`, fontFamily:(d.monoRows??[]).includes(i)?mono:sans, overflowWrap:'break-word'}}>{r}</div>)}
  </div>;
};

export const ColdOpen: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const a = prog(f, 0, 22);
  if (id === '0.1') return <div style={{position:'absolute', inset:0, opacity:a, fontFamily:sans}}>
    <div style={{position:'absolute', left:160, top:210, width:1600}}>
      <div style={{fontFamily:mono, fontSize:24, color:C.amber, letterSpacing:4}}>DFBUGS-12519 · RECORDED 29 OCTOBER 2026</div>
      <div style={{fontSize:92, fontWeight:800, color:C.text, lineHeight:1.05, marginTop:22}}>Promotion is not recovery</div>
      <div style={{fontSize:38, color:C.dim, marginTop:24, lineHeight:1.35}}>Eight writable disks. Four applications. Not one of them running.</div>
      <div style={{display:'flex', gap:26, marginTop:56}}>
        <div style={{padding:'20px 30px', border:`2px solid ${C.green}`, borderRadius:14, background:`${C.green}14`, fontSize:31, color:C.green, fontWeight:700}}>storage half: promoted</div>
        <div style={{padding:'20px 30px', border:`2px solid ${C.red}`, borderRadius:14, background:`${C.red}14`, fontSize:31, color:C.red, fontWeight:700}}>workload half: absent</div>
      </div>
    </div>
  </div>;
  if (id === '0.2') return <div style={{position:'absolute', inset:0, opacity:a, fontFamily:sans}}>
    <div style={{position:'absolute', left:160, top:190, fontSize:52, fontWeight:800, color:C.text}}>One application, two halves</div>
    <div style={{position:'absolute', left:160, top:330, width:740, padding:34, border:`2px solid ${C.green}`, borderRadius:18, background:C.panel}}>
      <div style={{fontSize:26, color:C.green, fontWeight:700}}>THE STORAGE HALF</div>
      <div style={{fontSize:30, color:C.text, marginTop:16, lineHeight:1.4}}>The target array makes its copy writable, and the claim binds to it.</div>
    </div>
    <div style={{position:'absolute', left:1000, top:330, width:740, padding:34, border:`2px solid ${C.red}`, borderRadius:18, background:C.panel}}>
      <div style={{fontSize:26, color:C.red, fontWeight:700}}>THE WORKLOAD HALF</div>
      <div style={{fontSize:30, color:C.text, marginTop:16, lineHeight:1.4}}>The blueprint returns, the guest starts, and the database serves again.</div>
    </div>
    <div style={{position:'absolute', left:160, top:640, width:1580, fontSize:28, color:C.dim, lineHeight:1.5}}>This run finished the first half and never began the second.</div>
  </div>;
  return <div style={{position:'absolute', inset:0, opacity:a, fontFamily:sans}}>
    <div style={{position:'absolute', left:180, top:250, width:1560, padding:44, border:`2px solid ${C.amber}`, borderRadius:20, background:C.panel}}>
      <div style={{fontFamily:mono, fontSize:22, color:C.amber, letterSpacing:3}}>THE RECORD THIS VIDEO FOLLOWS</div>
      <div style={{fontSize:46, fontWeight:800, color:C.text, marginTop:18}}>DFBUGS-12519</div>
      <div style={{fontSize:30, color:C.text, marginTop:22, lineHeight:1.45}}>Regional-DR failover never completes when the source storage array is down</div>
      <div style={{fontSize:24, color:C.dim, marginTop:26, lineHeight:1.5}}>Hub ocp-edge36 · spoke-0 ocp-edge95 / VSA-A · spoke-1 ocp-edge97 / VSA-B</div>
      <div style={{fontSize:24, color:C.dim, marginTop:10}}>Recorded 29 October 2026 · conditions dump and console capture attached</div>
    </div>
  </div>;
};

const GROUPS: [string, string][] = [
  ['Ramen on the hub','request, policy, placement and the view into each site'],
  ['Site manager','one per site, owning a work order per disk'],
  ['Storage driver','csi-addons, csi-powerstore and the array session'],
  ['Array copy','source, destination and the reprotect handshake'],
  ['Workload','the blueprint, the guest, and the restore engine'],
];

export const GlossaryScene: React.FC<{id:string;f:number;dur:number;card?:{kind:string;name:string;role:string};def?:Def}> = ({id,f,dur,card,def}) => {
  if (id === '1.1') return <div style={{position:'absolute', inset:0, fontFamily:sans}}>
    <div style={{position:'absolute', left:110, top:160, fontSize:40, color:C.text, fontWeight:700}}>Four groups of objects, one recovery</div>
    {GROUPS.map(([name,role],i)=><div key={name} style={{position:'absolute', left:110+(i%3)*585, top:280+Math.floor(i/3)*270, width:540, minHeight:200, padding:28, border:`2px solid ${C.cyan}`, borderRadius:18, background:C.panel, opacity:prog(f,dur*(.03+i*.09),dur*(.03+i*.09)+24)}}>
      <div style={{fontSize:30, color:C.cyan, fontWeight:700}}>{name}</div>
      <div style={{fontSize:24, color:C.text, lineHeight:1.4, marginTop:18}}>{role}</div>
    </div>)}
  </div>;
  if (id === '1.10') return <div style={{position:'absolute', inset:0, fontFamily:sans}}>
    <div style={{position:'absolute', left:130, top:210, fontSize:44, color:C.text, fontWeight:700}}>Two array state words</div>
    <div style={{position:'absolute', left:130, top:350, width:760, padding:32, border:`2px solid ${C.amber}`, borderRadius:18, background:C.panel}}>
      <div style={{fontFamily:mono, fontSize:34, color:C.amber}}>Failed_Over</div>
      <div style={{fontSize:26, color:C.text, marginTop:16, lineHeight:1.45}}>This side was promoted and is waiting to be reversed. Until then the arrays copy nothing.</div>
    </div>
    <div style={{position:'absolute', left:960, top:350, width:760, padding:32, border:`2px solid ${C.red}`, borderRadius:18, background:C.panel}}>
      <div style={{fontFamily:mono, fontSize:34, color:C.red}}>Complete_Data_Connection_Loss</div>
      <div style={{fontSize:26, color:C.text, marginTop:16, lineHeight:1.45}}>The array cannot reach its peer at all. No session state can be read from the other side.</div>
    </div>
  </div>;
  if (id === '1.11') return <div style={{position:'absolute', inset:0, fontFamily:sans}}>
    <div style={{position:'absolute', left:130, top:200, fontSize:44, color:C.text, fontWeight:700}}>Three conditions, three questions</div>
    {[
      ['DataReady','Is every protected claim ready for use?'],
      ['ClusterDataReady','Were the saved disk records restored?'],
      ['KubeObjectsReady','Were the workload definitions restored?'],
    ].map(([w,q],i)=><div key={w} style={{position:'absolute', left:130, top:340+i*180, width:1600, padding:'24px 30px', border:`2px solid ${C.orange}`, borderRadius:16, background:C.panel, opacity:prog(f,dur*(.04+i*.1),dur*(.04+i*.1)+22)}}>
      <span style={{display:'inline-block', width:360, fontFamily:mono, fontSize:30, color:C.orange}}>{w}</span>
      <span style={{fontSize:28, color:C.text}}>{q}</span>
    </div>)}
  </div>;
  if (id === '1.12') return <div style={{position:'absolute', inset:0, fontFamily:sans}}>
    <div style={{position:'absolute', left:130, top:200, fontSize:44, color:C.text, fontWeight:700}}>The hub reports three fields</div>
    {[
      ['progression = WaitForReadiness','the target has not proved itself yet'],
      ['Available = False','the application is not usable'],
      ['PeerReady = False','the other site is not ready for the next action'],
    ].map(([w,q],i)=><div key={w} style={{position:'absolute', left:130, top:340+i*180, width:1600, padding:'24px 30px', border:`2px solid ${C.blue}`, borderRadius:16, background:C.panel, opacity:prog(f,dur*(.04+i*.1),dur*(.04+i*.1)+22)}}>
      <div style={{fontFamily:mono, fontSize:29, color:C.blue}}>{w}</div>
      <div style={{fontSize:26, color:C.dim, marginTop:8}}>{q}</div>
    </div>)}
  </div>;
  if (id === '1.13') return <div style={{position:'absolute', inset:0, fontFamily:sans}}>
    <div style={{position:'absolute', left:130, top:190, fontSize:44, color:C.text, fontWeight:700}}>The cast, in the order it acts</div>
    {['DRPC · the instruction','DRPolicy · the promise','VRG · the site manager','VolumeReplication · one per disk','Claim and volume · the real disk','VirtualMachine · the blueprint','Velero · the restore engine','Session · the array copy'].map((t,i)=>
      <div key={t} style={{position:'absolute', left:130+(i%2)*790, top:320+Math.floor(i/2)*160, width:740, padding:'20px 26px', borderLeft:`7px solid ${C.cyan}`, background:C.panel, fontSize:27, color:C.text, opacity:prog(f,dur*(.03+i*.06),dur*(.03+i*.06)+20)}}>{t}</div>)}
  </div>;
  if(!card||!def)return null;
  return <div style={{position:'absolute', inset:0, opacity:prog(f,-20,24)}}>
    <div style={{position:'absolute', left:100, top:170, color:C.purple, fontFamily:mono, fontSize:21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={29} appear={prog(f,-10,24)} color={C.cyan}/>
    <GlossaryPanel d={def} p={prog(f,dur*.03,dur*.75)} x={850} y={210} w={990}/>
  </div>;
};
