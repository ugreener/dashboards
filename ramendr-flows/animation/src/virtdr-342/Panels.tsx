import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_342 = ['Protect','Gate','Suspend','Recover','Verify data','Resume','Converge','Recap'];
export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '0.1':{title:'A whole site disappears',rows:['VIRTDR-342 · recorded unplanned failover','spoke-1 / VSA-B to spoke-0 / VSA-A','Recovery first. Source cleanup later.'],color:C.cyan},
  '2.2':{title:'Discovered, not ApplicationSet-managed',rows:['Hub DRPC + Placement: openshift-dr-ops','Spoke VRGs: openshift-dr-ops','VM + disks: hammerdb','No Argo CD source pruning in this scenario.']},
  '2.5':{title:'The chain before the disaster',rows:['Ramen coordinates the two clusters.','Dell CSI asks PowerStore to copy the disks.','MinIO keeps metadata and workload definitions.','The arrays stay online when spoke-1 freezes.']},
  '3.2':{title:'Per-disk sync history · source VSA-B',rows:['hammerdb-rhel9-datadisk','07:48:46 and 08:00:46 UTC · 720s maximum gap','hammerdb-rhel9-rootdisk','07:46:06 and 07:58:06 UTC · 719s maximum gap','Policy: 900s. Initial copies do not count.']},
  '3.3':{title:'The syncs carried actual writes',rows:['Data disk intervals: 30,950 and 31,309 history rows','Root disk intervals: 31,720 and 30,989 history rows','Order-sequence sum: 8,633,679 to 8,634,676 in 20s','This sum is not an exact transaction count.']},
  '3.4':{title:'Initiate deadline checked against the click',rows:['Preflight starts: 08:03:40 UTC','Oldest completed disk sync: 07:58:06 UTC','Initiate before: 08:12:06 UTC','Actual Initiate: 08:10:02 UTC','About 2m04s of margin.'],color:C.green},
  '4.1':{title:'Freeze the cluster, not its storage',rows:['Source: spoke-1 on edge97','3 master node VMs + 3 worker node VMs','Suspend guest execution mid-write.','Hub, target cluster and both arrays stay running.'],color:C.red},
  '4.2':{title:'Historical action · 08:07:38 UTC',rows:['virsh suspend on all six source node VMs','No graceful guest shutdown. No final workload sync.','Source remains frozen during all Phase A checks.'],color:C.red},
  '4.6':{title:'So far: the disaster is real for the cluster',rows:['Writer frozen with all source nodes.','Hub later loses the source heartbeat.','Both arrays still have the last replicated copies.','Initiate happened before the printed deadline.']},
  '5.2':{title:'Promotion is a storage handoff',rows:['Primary: this cluster can use writable copies.','Secondary: this cluster keeps recovery copies.','A target VRG asks VolumeReplication to promote.','The csi-addons controller calls Dell CSI.']},
  '5.3':{title:'Exact promoted VSA-A volume identities',rows:['hammerdb-rhel9-datadisk','ac6dcaf0-52fb-4ba9-b99c-e263b32f52cf','hammerdb-rhel9-rootdisk','b78834ea-f1ba-4e08-9770-335a626c708a','Array: PS3b37452a6e0f'],color:C.green},
  '5.5':{title:'Recovered guest · source still suspended',rows:['hammerdb/hammerdb-rhel9: Running','ramendr-postgresql.service: active','ramendr-dr-hammerdb.service: active','Auto-start, not a manual reinstall.'],color:C.green},
  '6.1':{title:'Phase A checks without source-cluster access',rows:['dell_dr_check.py postcheck --source-down','Saved preflight + array jobs + recovered guest','Source removal and Completed deferred to Phase B.']},
  '6.2':{title:'Actual last sync age at Initiate',rows:['hammerdb-rhel9-datadisk: 555s < 900s','hammerdb-rhel9-rootdisk: 715s < 900s','Both disks: last two scheduled syncs carried writes.'],color:C.green},
  '6.3':{title:'Measured data verdict',rows:['PASS: data loss within RPO','556s measured loss window < 900s objective','PASS: all source rows before last sync recovered','55 complete source minutes checked. None missing.','Within RPO does not mean zero data loss.'],color:C.green},
  '6.4':{title:'Do not erase the original result',rows:['Original postcheck: OVERALL FAIL · 11/14','Expected two-entry PlacementDecision rejected.','Target VRG queried in the wrong namespace.','Stopped-writer exit code mistaken for host failure.'],color:C.amber},
  '6.5':{title:'Separate the report from the follow-up',rows:['Original FAIL preserved. No clean PASS rerun claimed.','Target VRG verified in openshift-dr-ops.','RetainedForFailover explained the source decision.','Corrected dry run saw the already-stopped writer.'],color:C.amber},
  '6.6':{title:'Writer-stop follow-up evidence',rows:['Writer: inactive and disabled','PostgreSQL: active','SUM(d_next_o_id): 8,650,932','Same sum across 41 seconds.','Target writes after recovery explain growth.'],color:C.green},
  '6.7':{title:'Phase A ends with the source still down',rows:['Recovered VM and database remain available.','HammerDB writer stopped and disabled.','Core data verdicts recorded before source resume.','Cleaning Up is the expected source-down boundary.'],color:C.green},
  '6.8':{title:'So far: recovery does not depend on source cleanup',rows:['Target promotion and guest recovery verified.','Reported loss stayed within the 15-minute RPO.','Original checker FAIL and follow-up remain distinct.','Next: return the old site and restore protection.']},
  '7.1':{title:'Phase B is a different job',rows:['Phase A: recover while the source is gone.','Phase B: restore the old site as a recovery peer.','Resume and deletion each need authorization.','The source stayed down for 1h47m30s.']},
  '7.2':{title:'Source resumes · 09:55:08 UTC',rows:['All six source node VMs resumed.','Nodes Ready within about two minutes.','Old guest: PausedIOError after promotion.','A write rejection is not permanent fencing.']},
  '7.3':{title:'WaitOnUserToCleanUp',rows:['Ramen does not own this discovered application.','It will not automatically delete the old VM.','Check the promoted target before deleting source.','This is not the managed Argo CD cleanup path.'],color:C.amber},
  '7.7':{title:'So far: source cleanup is complete',rows:['Old source VM, VMI, DataVolumes and PVCs absent.','Source VRG transitions to Secondary.','Promoted target handles remain unchanged.','Now the controller can finish the DR lifecycle.']},
  '8.1':{title:'Completion and reprotection are separate handoffs',rows:['Target promotion made the recovery disks writable.','Source demotion makes the old site the peer.','Reprotection reverses storage replication.','Fresh reverse syncs are evidence of the new copy.']},
  '8.6':{title:'Nodes Ready does not prove hub availability',rows:['ManagedCluster spoke-1: Available=Unknown','ManagedClusterLeaseUpdateStopped','A resumed node clock was about 6,394s slow.','The agent refused status updates on clock skew.'],color:C.amber},
  '8.7':{title:'Recorded limit after convergence',rows:['The work-delivery path still demoted the source.','DRPC completed despite stale hub availability.','Clock stepping recommended in the attachment.','That attachment does not record the clock repair.','Fresh two-sync readiness is a separate future gate.'],color:C.amber},
  '9.1':{title:'The whole chain, in order',rows:['Prove syncs carried writes, then freeze the source.','Use the hub console to request recovery.','Promote copies and restore the guest on spoke-0.','Measure recovery with the source still suspended.','Resume and clean only the old source application.','Demote, complete and verify reversed replication.']},
  '9.2':{title:'What this run proves',rows:['Discovered RHEL recovery while source stayed down.','Recorded within-RPO history checks passed.','Separate cleanup reached FailedOver/Completed.','Original 11/14 automated FAIL stays visible.'],color:C.green},
  '9.3':{title:'What it does not prove',rows:['Not zero data loss. Not an exact lost-row count.','Not Relocate, Windows or managed-app coverage.','Not permanent automatic source fencing.','Not a current live-health inventory.','Controller source trace is not deployed-build proof.'],color:C.amber},
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));
export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id,f,dur}) => {
  const d=PANEL_DATA[id];if(!d)return null;
  const a=prog(f,0,24); const cold=id==='0.1';
  return <div style={{position:'absolute',left:cold?170:900,top:cold?290:220,width:cold?1580:950,padding:32,border:`2px solid ${d.color??C.blue}`,borderRadius:20,background:`${C.bg}f5`,opacity:a,fontFamily:sans,boxShadow:'0 20px 70px #000c'}}>
    <div style={{fontSize:cold?48:29,fontWeight:700,color:d.color??C.blue,marginBottom:24}}>{d.title}</div>
    {d.rows.map((r,i)=><div key={r} style={{marginTop:18,fontSize:cold?34:25,lineHeight:1.35,color:C.text,opacity:prog(f,dur*(.03+i*.055),dur*(.03+i*.055)+22),transform:`translateX(${(1-prog(f,dur*(.03+i*.055),dur*(.03+i*.055)+22))*22}px)`,fontFamily:/^[a-f0-9]{8}-/.test(r)?mono:sans,overflowWrap:'break-word'}}>{r}</div>)}
  </div>;
};
export const GlossaryScene: React.FC<{id:string;f:number;dur:number;card?:{kind:string;name:string;role:string};def?:Def}> = ({id,f,dur,card,def}) => {
  if(!card||!def)return <div style={{position:'absolute',left:180,top:350,right:180,color:C.text,fontFamily:sans,fontSize:44,textAlign:'center'}}>Every piece has one job. Follow the handoffs, not just the names.</div>;
  return <div style={{position:'absolute',inset:0,opacity:prog(f,-20,24)}}>
    <div style={{position:'absolute',left:100,top:170,color:C.purple,fontFamily:mono,fontSize:21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={29} appear={prog(f,-10,24)} color={C.cyan}/>
    <GlossaryPanel d={def} p={prog(f,dur*.03,dur*.75)} x={850} y={230} w={990}/>
  </div>;
};
