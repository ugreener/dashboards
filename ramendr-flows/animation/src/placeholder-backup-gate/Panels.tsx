import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES = ['Move','The archive','The refusal','Compare','The fix','Prove'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string; monoRows?: number[]}> = {
  '2.5':{title:'The disk records came back',rows:['ClusterDataReady=True (Restored)','Restored 4 volrep PVs/PVCs','It names which array volume each claim uses.','This is the storage half, and it finished.'],monoRows:[0,1],color:C.green},
  '2.8':{title:'The target namespace, as recorded',rows:['PVC rootdisk · Bound · csivol-841ca78019 · 35Gi','PVC datadisk · Bound · csivol-3471d7938c · 20Gi','Secret cloudinit-hammerdb · present','VirtualMachine · none','DataVolume · none'],monoRows:[0,1,2,3,4],color:C.amber},
  '3.1':{title:'The archive is complete',rows:['Capture group 0 was selected.','Its metadata file in the bucket says Completed.','Bucket ramen-metadata, under the application prefix.','The workload definition is safe. That is not the problem.'],color:C.green},
  '3.14':{title:'Four records, one chain',rows:['Archive in the bucket · Completed','Backup in the cluster · Failed','Restore in the cluster · references the Failed record','VirtualMachine on the target · absent'],color:C.amber},
  '5.6':{title:'The dates, in order',rows:['19 Oct · the same application restored (VIRTDR-342)','28 Oct 08:10 · new Velero image on spoke-1','29 Oct · first recorded failure','5 Nov · reproduced on the current build'],monoRows:[],color:C.blue},
  '6.1':{title:'The obvious repair',rows:['Import the Backup record from the bucket.','Then there is no duplicate.','Then the phase would be Completed.','That is exactly what someone tried.'],color:C.green},
  '7.2':{title:'What the record proves',rows:['The storage half completed.','The object half did not.','Ramen created the duplicate with the archive name.','Velero failed it, and refused the Restore on phase.'],color:C.green},
  '7.3':{title:'What stays unverified',rows:['Which commit built the running controllers','Which change alone moved the outcome','Whether the image upgrade explains the regression','What the fix will be'],color:C.amber},
};

export const CODE_DATA: Record<string, {title: string; file: string; lines: string[]; hl: number[]; note?: string}> = {
  '3.6':{title:'Ramen · how the name is built',file:'internal/controller/vrg_kubeobjects.go:54',hl:[1],lines:[
    'func kubeObjectsCaptureName(prefix, groupName,',
    '        s3ProfileName string) string {',
    '    return prefix + "--" + groupName + "--" + s3ProfileName',
    '}',
  ],note:'Prefix, group, profile. The double hyphens come from the join.'},
  '3.7':{title:'Ramen · no record, so create one',file:'internal/controller/kubeobjects/velero/requests.go:226',hl:[2,3,4,5],lines:[
    'backupRequest, ok := captureRequest.(BackupRequest)',
    'if !ok {',
    '    _, _, err := backupRequestCreate(',
    '        w, ..., backupName, labels, annotations)',
    '    if err != nil { return nil, err }',
    '    return nil, err',
    '}',
  ],note:'No local Backup record means the create path runs, with the archive name.'},
  '3.8':{title:'Ramen · the create is real',file:'internal/controller/kubeobjects/velero/requests.go:514',hl:[2,3,4],lines:[
    'backupSpec.StorageLocation = requestName',
    'backupSpec.SnapshotVolumes = new(bool)',
    'backupRequest := backupRequest(requestName, backupSpec)',
    'return backupLocation, backupRequest,',
    '    w.Create(w.ctx, backupRequest)',
  ],note:'A Velero Backup object is created. Nothing reads the archive at this point.'},
  '3.12':{title:'Ramen · Failed is treated as usable',file:'internal/controller/kubeobjects/velero/requests.go:268',hl:[0,1,2,4],lines:[
    'switch backup.Status.Phase {',
    'case velero.BackupPhaseCompleted,',
    '     velero.BackupPhasePartiallyFailed,',
    '     velero.BackupPhaseFailed:',
    '    return backupRestore(backup, w, ...)',
    '...',
  ],note:'The placeholder was meant as a handle. The bytes come from the bucket.'},
  '4.2':{title:'Velero · which phases may be restored',file:'pkg/controller/restore_controller.go:422',hl:[0,3,4],lines:[
    'case api.BackupPhaseCompleted,',
    '     api.BackupPhasePartiallyFailed:',
    '    // proceed with the restore',
    'default:',
    '    ValidationErrors = append(...,',
    '      "backup %q is in phase %q and cannot',
    '       be used as a restore source")',
  ],note:'Two phases accepted, every other phase refused.'},
};

export const PANEL_BEATS = new Set([...Object.keys(PANEL_DATA), ...Object.keys(CODE_DATA)]);

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const code = CODE_DATA[id];
  if (code) {
    const a = prog(f, 0, 24);
    return <div style={{position:'absolute', left:900, top:210, width:980, padding:0, border:`2px solid ${C.purple}`, borderRadius:16, background:`${C.bg}f7`, opacity:a, fontFamily:mono, boxShadow:'0 20px 70px #000c', overflow:'hidden'}}>
      <div style={{padding:'12px 22px', background:C.panel, borderBottom:`1px solid ${C.border}`, fontSize:15, color:C.dim}}>{code.file}</div>
      <div style={{padding:'18px 22px 10px', fontSize:24, color:C.purple, fontFamily:sans, fontWeight:700}}>{code.title}</div>
      {code.lines.map((l,i)=><div key={i} style={{padding:'3px 22px', fontSize:18, lineHeight:1.45, whiteSpace:'pre', color:code.hl.includes(i)?C.text:C.faint, background:code.hl.includes(i)?`${C.amber}18`:undefined, borderLeft:`4px solid ${code.hl.includes(i)?C.amber:'transparent'}`, opacity:prog(f,dur*(.03+i*.045),dur*(.03+i*.045)+18)}}>{l}</div>)}
      <div style={{padding:'14px 22px 20px', fontFamily:sans, fontSize:19, color:C.dim}}>{code.note ?? ''}</div>
    </div>;
  }
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  return <div style={{position:'absolute', left:900, top:220, width:960, padding:30, border:`2px solid ${d.color ?? C.blue}`, borderRadius:20, background:`${C.bg}f5`, opacity:a, fontFamily:sans, boxShadow:'0 20px 70px #000c'}}>
    <div style={{fontSize:29, fontWeight:700, color:d.color ?? C.blue, marginBottom:20}}>{d.title}</div>
    {d.rows.map((r,i)=><div key={i} style={{marginTop:14, fontSize:23, lineHeight:1.35, color:C.text, opacity:prog(f,dur*(.03+i*.05),dur*(.03+i*.05)+22), transform:`translateX(${(1-prog(f,dur*(.03+i*.05),dur*(.03+i*.05)+22))*20}px)`, fontFamily:(d.monoRows??[]).includes(i)?mono:sans, overflowWrap:'break-word'}}>{r}</div>)}
  </div>;
};

export const ColdOpen: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const a = prog(f, 0, 22);
  if (id === '0.1') return <div style={{position:'absolute', inset:0, opacity:a, fontFamily:sans}}>
    <div style={{position:'absolute', left:160, top:200, width:1620}}>
      <div style={{fontFamily:mono, fontSize:24, color:C.amber, letterSpacing:4}}>DFBUGS-12505 · RECORDED 5 NOVEMBER 2026</div>
      <div style={{fontSize:86, fontWeight:800, color:C.text, lineHeight:1.05, marginTop:22}}>Relocated. Completed.<br/>No machine.</div>
      <div style={{fontSize:38, color:C.dim, marginTop:26, lineHeight:1.35}}>Two disks bound on the target site, and nothing to boot from them.</div>
      <div style={{display:'flex', gap:26, marginTop:54}}>
        <div style={{padding:'20px 30px', border:`2px solid ${C.green}`, borderRadius:14, background:`${C.green}14`, fontSize:30, color:C.green, fontWeight:700}}>storage half: bound</div>
        <div style={{padding:'20px 30px', border:`2px solid ${C.red}`, borderRadius:14, background:`${C.red}14`, fontSize:30, color:C.red, fontWeight:700}}>workload half: absent</div>
      </div>
    </div>
  </div>;
  if (id === '0.2') return <div style={{position:'absolute', inset:0, opacity:a, fontFamily:sans}}>
    <div style={{position:'absolute', left:150, top:190, fontSize:52, fontWeight:800, color:C.text}}>What the control record said</div>
    {[['phase','Relocated',C.green],['progression','Completed',C.green],['PeerReady','true',C.green],['Protected','false',C.red]].map(([k,v,col],i)=>
      <div key={k} style={{position:'absolute', left:150+i*420, top:330, width:380, padding:'28px 22px', border:`2px solid ${col}`, borderRadius:16, background:C.panel, opacity:prog(f,dur*(.04+i*.09),dur*(.04+i*.09)+22)}}>
        <div style={{fontFamily:mono, fontSize:22, color:C.dim}}>{k}</div>
        <div style={{fontFamily:mono, fontSize:38, color:col, marginTop:12}}>{v}</div>
      </div>)}
    <div style={{position:'absolute', left:150, top:560, width:700, padding:28, border:`2px solid ${C.green}`, borderRadius:16, background:C.panel}}>
      <div style={{fontSize:25, color:C.green, fontWeight:700}}>IN THE TARGET NAMESPACE</div>
      <div style={{fontSize:27, color:C.text, marginTop:14, lineHeight:1.4}}>two bound claims, one cloud-init secret</div>
    </div>
    <div style={{position:'absolute', left:900, top:560, width:700, padding:28, border:`2px solid ${C.red}`, borderRadius:16, background:C.panel}}>
      <div style={{fontSize:25, color:C.red, fontWeight:700}}>AND</div>
      <div style={{fontSize:27, color:C.text, marginTop:14, lineHeight:1.4}}>no VirtualMachine, no DataVolume</div>
    </div>
  </div>;
  if (id === '0.3') return <div style={{position:'absolute', inset:0, opacity:a, fontFamily:sans}}>
    <div style={{position:'absolute', left:150, top:200, fontSize:46, fontWeight:800, color:C.text}}>One word Velero will not accept</div>
    <div style={{position:'absolute', left:150, top:330, width:620, padding:'26px 30px', border:`2px solid ${C.green}`, borderRadius:16, background:C.panel}}>
      <div style={{fontFamily:mono, fontSize:22, color:C.dim}}>ACCEPTED AS A RESTORE SOURCE</div>
      <div style={{fontFamily:mono, fontSize:30, color:C.green, marginTop:16}}>Completed</div>
      <div style={{fontFamily:mono, fontSize:30, color:C.green, marginTop:10}}>PartiallyFailed</div>
    </div>
    <div style={{position:'absolute', left:900, top:330, width:760, padding:'26px 30px', border:`2px solid ${C.red}`, borderRadius:16, background:C.panel}}>
      <div style={{fontFamily:mono, fontSize:22, color:C.dim}}>THE ONE IN THIS RUN</div>
      <div style={{fontFamily:mono, fontSize:44, color:C.red, marginTop:16, textDecoration:'line-through'}}>Failed</div>
      <div style={{fontSize:24, color:C.dim, marginTop:14}}>rejected before a single object is read</div>
    </div>
    <div style={{position:'absolute', left:150, top:640, width:1510, fontSize:28, color:C.dim, lineHeight:1.5}}>The backup was already in the bucket. The record about it was failed.</div>
  </div>;
  return <div style={{position:'absolute', inset:0, opacity:a, fontFamily:sans}}>
    <div style={{position:'absolute', left:180, top:250, width:1560, padding:44, border:`2px solid ${C.amber}`, borderRadius:20, background:C.panel}}>
      <div style={{fontFamily:mono, fontSize:22, color:C.amber, letterSpacing:3}}>THE RECORD THIS VIDEO FOLLOWS</div>
      <div style={{fontSize:46, fontWeight:800, color:C.text, marginTop:18}}>DFBUGS-12505</div>
      <div style={{fontSize:28, color:C.text, marginTop:22, lineHeight:1.45}}>Discovered-app Relocate fails kube-object restore on OADP 1.6.2</div>
      <div style={{fontSize:23, color:C.dim, marginTop:24, lineHeight:1.5}}>Hub ocp-edge36 · source spoke-0 ocp-edge95 / VSA-A · target spoke-1 ocp-edge97 / VSA-B</div>
      <div style={{fontSize:23, color:C.dim, marginTop:10}}>First recorded 29 October 2026 · reproduced 5 November 2026</div>
    </div>
  </div>;
};

const GROUPS: [string, string][] = [
  ['Hub','the instruction and the promise'],
  ['Site manager','one per site, one readiness answer'],
  ['Restore engine','Velero, packaged as OADP'],
  ['Records','Backup, Restore, storage location'],
  ['Object store','the archive of the workload'],
];

export const GlossaryScene: React.FC<{id:string;f:number;dur:number;card?:{kind:string;name:string;role:string};def?:Def}> = ({id,f,dur,card,def}) => {
  if (id === '1.1') return <div style={{position:'absolute', inset:0, fontFamily:sans}}>
    <div style={{position:'absolute', left:110, top:160, fontSize:40, color:C.text, fontWeight:700}}>Three places, eight objects</div>
    {GROUPS.map(([name,role],i)=><div key={name} style={{position:'absolute', left:110+(i%3)*590, top:290+Math.floor(i/3)*250, width:540, minHeight:180, padding:28, border:`2px solid ${C.cyan}`, borderRadius:18, background:C.panel, opacity:prog(f,dur*(.03+i*.09),dur*(.03+i*.09)+24)}}>
      <div style={{fontSize:30, color:C.cyan, fontWeight:700}}>{name}</div>
      <div style={{fontSize:24, color:C.text, lineHeight:1.4, marginTop:18}}>{role}</div>
    </div>)}
  </div>;
  if (id === '1.12') return <div style={{position:'absolute', inset:0, fontFamily:sans}}>
    <div style={{position:'absolute', left:130, top:200, fontSize:44, color:C.text, fontWeight:700}}>Three conditions, three questions</div>
    {[
      ['DataReady','Can the protected claims be used?'],
      ['ClusterDataReady','Were the saved disk records rebuilt?'],
      ['KubeObjectsReady','Were the workload definitions restored?'],
    ].map(([w,q],i)=><div key={w} style={{position:'absolute', left:130, top:340+i*180, width:1600, padding:'24px 30px', border:`2px solid ${i===2?C.orange:C.border}`, borderRadius:16, background:C.panel, opacity:prog(f,dur*(.04+i*.1),dur*(.04+i*.1)+22)}}>
      <span style={{display:'inline-block', width:420, fontFamily:mono, fontSize:29, color:i===2?C.orange:C.dim}}>{w}</span>
      <span style={{fontSize:27, color:C.text}}>{q}</span>
    </div>)}
    <div style={{position:'absolute', left:130, top:900, fontSize:25, color:C.amber}}>Only the third one answers whether the machine is back.</div>
  </div>;
  if(!card||!def)return null;
  return <div style={{position:'absolute', inset:0, opacity:prog(f,-20,24)}}>
    <div style={{position:'absolute', left:100, top:170, color:C.purple, fontFamily:mono, fontSize:21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={26} appear={prog(f,-10,24)} color={C.cyan}/>
    <GlossaryPanel d={def} p={prog(f,dur*.03,dur*.75)} x={850} y={210} w={990}/>
  </div>;
};
