'use strict';
(() => {
  const id=document.body.dataset.flow, managed=['292','294'].includes(id), pending=id==='294';
  const ns=({291:'hammerdb',292:'gitops-vms',293:'hammerdb-win',294:'TBD'})[id];
  const vm=id==='293'?'hammerdb-win':pending?'TBD':'hammerdb-rhel9';
  const drpc=({291:'hammerdb-drpc',292:'dell-vm-drpc',293:'hammerdb-win-drpc',294:'TBD'})[id];
  const placement=({291:'hammerdb-placement',292:'dell-vm-placement',293:'hammerdb-win-placement',294:'TBD'})[id];
  const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const why={
    ManagedCluster:'ACM needs an imported, reachable cluster identity to select a site and deliver work to it.',
    DRCluster:'Ramen needs each site’s DR configuration and validation before using it for recovery.',
    DRPolicy:'Provides the site pair and replication schedule shared by the protected applications.',
    DRPlacementControl:'Connects one application to its policy, placement and selected disks so recovery can be coordinated.',
    Placement:'Provides the named cluster-selection object that Ramen controls for this application.',
    PlacementDecision:'Publishes the selected site to consumers; preferredCluster alone does not tell them where to deploy.',
    ProtectedApplicationView:'Makes correlated protection/application information available to the console; it is not a storage or deployment controller.',
    ManifestWork:'Carries hub-generated desired resources to a spoke through ACM instead of requiring direct hub-side creation there.',
    VolumeReplicationGroup:'Coordinates the application’s protected PVCs, storage metadata and Primary/Secondary state as a unit.',
    ManagedClusterView:'Lets hub reconciliation observe remote resource state when this flow uses a view.',
    VolumeReplication:'Expresses the replication role of an individual protected disk for the csi-addons controller.',
    VolumeReplicationClass:'Supplies driver-specific replication settings; a matching schedule and provisioner are needed for class selection.',
    'CSI + csi-addons':'Bridges Kubernetes storage/replication requests to Dell array operations and worker disk access.',
    'Array replica volumes':'Hold the recoverable database and OS blocks at the other site; Git and object backups cannot replace this data.',
    VirtualMachine:'Preserves guest hardware, boot and disk references so the recovered disks can run as the intended VM.',
    DataVolume:'Automates initial disk creation/population. During recovery, it must not overwrite a promoted disk with a fresh clone or blank disk.',
    PersistentVolumeClaim:'Gives the workload a namespaced disk reference and Ramen a selectable storage object.',
    PersistentVolume:'Records the backing CSI disk handle and binding needed to reconnect the correct recovered array volume.',
    VolumeAttachment:'Tracks the PV-to-worker CSI attachment required for a launcher to access its disk.',
    DataProtectionApplication:'Configures the Velero runtime/plugins used to protect and restore Kubernetes objects separately from block replication.',
    'Backup / Restore':'Capture and recreate workload configuration/dependencies; replicating VM disks alone does not recreate Kubernetes objects.',
    BackupStorageLocation:'Tells Velero where object archives are stored and how that location is referenced.',
    'MinIO / S3':'Retains DR metadata and object archives outside the protected workload site for recovery.',
    ApplicationSet:'In the managed flow, turns the selected cluster decision into a destination Application; a console marker alone is insufficient.',
    Application:'Tells Argo CD which revision/path to synchronize and to which cluster/namespace.',
    'ManagedClusterSet / Binding':'Makes the selected cluster set available to a namespaced Placement; cluster import alone does not establish that selection scope.',
    GitOpsCluster:'Connects ACM-selected clusters to Argo CD destination registration for the intended managed handoff.',
    ArgoCD:'Provides the running reconciliation controllers that apply generated Applications, with the required watch scope and permissions.',
    HyperConverged:'Configures the OpenShift Virtualization installation that supplies guest and disk-import capabilities.',
    'KubeVirt / CDI':'Provide the controllers implementing VM execution and DataVolume provisioning underneath virtualization.',
    VirtualMachineInstance:'Represents the executing guest whose readiness and disk access must be verified after recovery.',
    CatalogSource:'Makes operator bundles discoverable for OLM installation; it does not prove a particular installed version.',
    Subscription:'Requests an operator package/channel in the OLM install mechanism; this recorded RHDR snapshot does not establish an active Subscription.',
    InstallPlan:'Records the resolved OLM installation steps when that installation mechanism is used.',
    ClusterServiceVersion:'Describes the installed operator bundle, its APIs and controller deployment, distinct from a catalog update.',
    Recipe:'Can describe an object-protection workflow. Here its API was an operator dependency; an application-specific Recipe is not established.',
    VolumeGroupReplication:'Provides group replication when explicitly configured; two individually protected disks do not establish use of this API.',
    VolumeGroupReplicationClass:'Supplies settings for the conditional group-replication branch; the initial 5m class is not the selected 15m per-disk policy.',
    VolumeGroupSnapshotClass:'Configures a group-snapshot driver when that branch is used. Installed CRD presence does not establish a snapshot instance.'
  };
  const palette={
    'openshift-dr-ops':'#bc8cff','openshift-gitops':'#ff8fb3',
    hammerdb:'#3fb950','gitops-vms':'#39d2c0','hammerdb-win':'#e3b341',
    'openshift-adp':'#58a6ff','openshift-cnv':'#f69d50',
    'openshift-marketplace':'#a5d6ff','openshift-dr-system':'#d2a8ff',
    powerstore:'#ffa657','csi-addons-system':'#ff7b72',minio:'#a5d675',
    'cluster-scoped':'#c9d1d9',external:'#8b949e',
    'unverified / TBD':'#9ba7b4','mixed scope':'#9ba7b4',
    'managed-cluster namespace (name unverified)':'#9ba7b4'
  };
  function namespaces(scope){
    const location=scope.split(' / ').slice(1).join(' / ');
    if(scope.startsWith('External')) return ['external'];
    if(location==='cluster-scoped') return ['cluster-scoped'];
    if(location==='spoke-0 or spoke-1') return ['spoke-0','spoke-1'];
    if(location==='managed-cluster namespace') return ['managed-cluster namespace (name unverified)'];
    if(location.includes('cluster-scoped;')) return ['mixed scope'];
    const keys=location.split(' + ');
    return keys.every(key=>Object.hasOwn(palette,key))?keys:['unverified / TBD'];
  }
  palette['spoke-0']='#79c0ff';palette['spoke-1']='#f778ba';
  const n=(kind,name,scope,detail,type='cr')=>({kind,name,scope,detail,type});
  const hub='Hub / openshift-dr-ops', spoke=`Each spoke / ${ns}`;
  const d=n('DRPlacementControl',drpc,hub,'References DRPolicy, Placement, protectedNamespaces and PVC selector.');
  const v=n('VolumeReplicationGroup','Generated application VRG','Each spoke / namespace from DRPC + ManifestWork (verify)','Ramen reconciles selected PVCs and desired role. VRG namespace is not necessarily the protected workload namespace; inspect DRPC app-namespace annotation and delivered ManifestWork.');
  const m=n('VirtualMachine',vm,spoke,'VM configuration references root/data disks; starts a VirtualMachineInstance and launcher Pod.');
  const lanes=[
    ['Policy and DR site eligibility',[
      n('ManagedCluster','spoke-0 / spoke-1','Hub / cluster-scoped','ACM import/availability is distinct from DR validation.'),
      n('DRCluster','spoke-0 / spoke-1','Hub / cluster-scoped','Ramen site identity, validation and S3 profile.'),
      n('DRPolicy','dr-policy-15m','Hub / cluster-scoped','Pairs DRClusters; recorded schedule 15m.'),d
    ],['same site identity','drClusters[]','drPolicyRef']],
    ['DR placement and console observation',[
      d,n('Placement',placement,hub,'DRPC placementRef; DR controls the decision instead of ordinary scheduling.'),
      n('PlacementDecision','Controller-generated name',hub,'status.decisions selects the active spoke.'),
      n('ProtectedApplicationView','Discover instance / namespace','Hub / namespace unverified','Orchestrator correlates DRPC/application state for the UI. Observation, not deployment.')
    ],['placementRef','decision status','UI correlates decision + DRPC']],
    ['Cross-cluster delivery and status',[
      d,n('ManifestWork','Generated per spoke','Hub / spoke-0 or spoke-1','ACM agent delivers VRG and related control resources.'),v,
      n('ManagedClusterView','Generated where used','Hub / managed-cluster namespace','Observes spoke resource status for hub reconciliation; does not own the VRG.')
    ],['Ramen reconciles','delivers VRG','observes status']],
    ['Protected disk replication',[
      v,n('VolumeReplication','One per selected PVC',spoke,'dataSource references PVC; desired role drives Dell replication.'),
      n('VolumeReplicationClass','powerstore-vrc-15m','Spokes / cluster-scoped','Matched by CSI provisioner and schedule; mirrored A-to-B / B-to-A parameters.'),
      n('CSI + csi-addons','Dell controllers','Spokes / powerstore + csi-addons-system','Translate replication requests into PowerStore API operations.','external'),
      n('Array replica volumes','VSA-A / VSA-B','External / no namespace','Array-native block replication, separate from S3 and Git.','external')
    ],['creates for PVC','class reference','controller interprets','array API']],
    ['VM disk provisioning and binding',[
      m,n('DataVolume',pending?'Root/data names TBD':`${vm}-rootdisk / ${vm}-datadisk`,spoke,'CDI provisions initial disks and owns corresponding PVCs. Recovery must reuse promoted disks.'),
      n('PersistentVolumeClaim',pending?'Root/data names TBD':`${vm}-rootdisk / ${vm}-datadisk`,spoke,'VRG selects protected disks; excludes unlabeled CDI temporary claims.','builtin'),
      n('PersistentVolume','Dynamic / restored name','Spokes / cluster-scoped','PVC binding; CSI volume handle identifies the actual array disk.','builtin'),
      n('VolumeAttachment','Generated attachment','Spokes / cluster-scoped','References PV + worker; CSI publishes disk to the VM launcher.','builtin')
    ],['references disk','owns initial PVC','volumeName binding','PV + worker']],
    ['Kubernetes object protection (not block data)',[
      v,n('DataProtectionApplication','Discover configured instance','Spokes / openshift-adp','Runs Velero/plugins. Ramen requests capture/restore via kubeObjectProtection.'),
      n('Backup / Restore','Run-generated instances','Spokes / openshift-adp','Selected Kubernetes objects, including VM configuration and dependencies.'),
      n('BackupStorageLocation','Ramen-selected location','Spokes / openshift-adp','S3 endpoint and credential reference; inspect actual location name.'),
      n('MinIO / S3','ramen-metadata','Hub / minio','Metadata and object archives; not VM disk writes.','external')
    ],['requests via Velero','executes backup / restore','storageLocation','S3 archive']]
  ];
  if(managed) lanes.push(
    ['GitOps workload handoff (intended; acceptance must be demonstrated)',[
      n('PlacementDecision',pending?'TBD':placement+' decision',hub,'Selects a registered destination cluster.'),
      n('ApplicationSet',pending?'TBD':'dell-vm-workload',hub,'clusterDecisionResource reads decision using built-in ConfigMap acm-placement.'),
      n('Application',pending?'TBD':'dell-vm-workload-{{name}}','Hub / generated namespace to verify','Source: upstream ocp-4.22-rhdr-dell, clusters/dell-s4/workloads (RHEL reference).'),m
    ],['generator reads','generates','Argo CD syncs']],
    ['GitOps registration (separate from DR Placement)',[
      n('ManagedClusterSet / Binding','Discover set / binding','Hub / set cluster-scoped; binding namespaced','Binding makes the set available to Placement in the binding namespace.'),
      n('Placement','all-openshift-clusters','Hub / openshift-gitops','Registration selection, not the DR workload decision.'),
      n('GitOpsCluster','argo-acm-clusters','Hub / openshift-gitops','Uses registration Placement and supplies Argo CD cluster-registration Secrets.'),
      n('ArgoCD','Discover actual instance','Hub / openshift-gitops','Requires registered destinations, watch scope and RBAC to reconcile Applications.')
    ],['exposes clusters','placementRef','registers for']]
  );
  lanes.push(
    ['Virtualization installation and execution',[
      n('HyperConverged','kubevirt-hyperconverged','Spokes / openshift-cnv','Installation CR enables virtualization.'),
      n('KubeVirt / CDI','Discover child instance names','Spokes / inspect child scopes','HCO reconciles virtualization and disk import controllers.'),m,
      n('VirtualMachineInstance',vm,spoke,'Running guest instance; launcher Pod attaches the selected disks.')
    ],['reconciles','controllers implement','starts instance']],
    ['Operator installation (recorded mechanism, not an active upgrade)',[
      n('CatalogSource','rhdr-staging-catalog','All clusters / openshift-marketplace','Supplies RHDR bundles; catalog readiness does not prove an upgrade.'),
      n('Subscription','No active RHDR instance in later snapshot','RHDR / openshift-dr-system','Historical installation mechanism; inspect current selection.'),
      n('InstallPlan','Generated when subscribed','Operator installation namespace','Resolves selected bundle and install steps.'),
      n('ClusterServiceVersion','Installed staging CSV','RHDR / openshift-dr-system','Defines installed operator and its controller workload.')
    ],['bundle catalog','resolves bundle','installs CSV']],
    ['Conditional API dependencies (not established workload instances)',[
      n('Recipe','Instance usage unverified','Spokes / namespace unverified','CRD installed for controller API dependency; selected workload recipeRef must be inspected.'),
      n('VolumeGroupReplication','Instance usage unverified','Spokes / protected namespace if used','Group-replication branch, not inferred from two individual VM disks.'),
      n('VolumeGroupReplicationClass','powerstore-vgrc-5m (initial setup)','Spokes / cluster-scoped','Class for the optional group replication branch.'),
      n('VolumeGroupSnapshotClass','CRD installed; instance unverified','Spokes / cluster-scoped','Separate snapshot branch/API dependency, not proof of a configured snapshot class.')
    ],[null,'class if group API used',null]]
  );
  const section=document.createElement('section');section.id='resource-dependencies';
  const used=[...new Set(lanes.flatMap(([,nodes])=>nodes.flatMap(a=>namespaces(a.scope))))];
  const badges=a=>namespaces(a.scope).map(key=>`<span class="namespace-badge" style="--ns-color:${palette[key]}">${esc(key)}</span>`).join('');
  section.innerHTML=`<h2>CRD dependency diagram and namespaces</h2><p>A CRD is a cluster-scoped API definition. These cards show <b>custom-resource instances</b> and their cluster/namespace, plus the built-in resources and services they depend on. Card stripes and badges identify namespace/scope; resource type is labeled separately. Connections describe references, reconciliation or observation, not universal ownership. Open <b>Use and why needed</b> on any card for an explanation (click, tap or keyboard).</p>
    <div class="notice">Recorded configuration and intended architecture, not live state. Repeated cards represent the same object in different dependency paths; each spoke has separate instances. Generated names and unverified namespaces are explicit. ${pending?'Windows managed workload names and namespace are TBD; shared infrastructure is a reference model, not an observed Windows deployment.':`Protected namespace: <b>${ns}</b>. Hub DR enrollment: <b>openshift-dr-ops</b>.`} ${managed?'The fixed-spoke bootstrap Application is not part of the Placement-driven handoff.':'GitOps workload reconciliation is N/A here; ArgoCD APIs remain an orchestrator installation prerequisite.'}</div>
    <div class="namespace-legend" aria-label="Namespace color legend">${used.map(key=>`<span class="namespace-badge" style="--ns-color:${palette[key]}">${esc(key)}</span>`).join('')}</div>
    <div class="toolbar"><button id="resource-fit">Fit dependencies</button><button id="resource-reset">100%</button><button id="resource-expand">Expand explanations</button><button id="resource-collapse">Collapse explanations</button><span class="muted">Scroll horizontally at full scale. Each row traces a labeled dependency path.</span></div>
    <div class="wrap" id="resource-wrap"><div class="sizer" id="resource-sizer"><div id="resource-dia"><svg id="resource-svg" aria-hidden="true"></svg>${lanes.map(([title,nodes],row)=>`<div class="resource-lane-title" data-row="${row}">${esc(title)}</div>${nodes.map((a,col)=>`<article class="resource-node" data-row="${row}" data-col="${col}" data-type="${a.type}" style="--ns-color:${namespaces(a.scope).length===1?palette[namespaces(a.scope)[0]]:palette['mixed scope']}"><small>${esc(a.scope)}</small><div class="namespace-badges">${badges(a)}</div><small class="resource-type">${a.type==='cr'?'Custom resource':a.type==='builtin'?'Built-in resource':'Controller / external service'}</small><h3>${esc(a.kind)}</h3><b>${esc(a.name)}</b><details><summary>Use and why needed<span class="sr-only">: ${esc(a.kind)}</span></summary><p><strong>Used for:</strong> ${esc(a.detail)}</p><p><strong>Why needed:</strong> ${esc(why[a.kind])}</p></details></article>`).join('')}`).join('')}</div></div></div>
    <h3>Supporting configuration and conditional custom resources</h3><div class="table-wrap"><table><thead><tr><th>Kind / resource</th><th>Cluster / namespace or scope</th><th>Relationship and applicability</th></tr></thead><tbody>
    <tr><td>DRClusterConfig</td><td>Spokes / cluster-scoped; discover instance name</td><td>Cluster controller configuration. Setup records its controller startup; inspect delivered configuration.</td></tr>
    <tr><td>HyperConverged; KubeVirt; CDI</td><td>Spokes / kubevirt-hyperconverged in openshift-cnv; inspect child scopes</td><td>Virtualization installation provides VM/VMI and CDI DataVolume controllers.</td></tr>
    <tr><td>DataSource</td><td>RHEL: openshift-virtualization-os-images/rhel9</td><td>Initial RHEL rootdisk sourceRef. Windows discovered uses golden PVC windows-golden-images/windows-server-2022-standard (built-in). Fresh cloning is not recovery.</td></tr>
    <tr><td>StorageClass; CSIDriver</td><td>Spokes / cluster-scoped (built-in)</td><td>PVC powerstore-sc selects csi-powerstore.dellemc.com; PV holds disk handle. Controllers run in powerstore.</td></tr>
    <tr><td>Recipe; VolumeGroupReplication; VolumeGroupReplicationClass; VolumeGroupSnapshotClass</td><td>Spokes / Recipe and group replication namespaced; classes cluster-scoped</td><td>Recipe/group-snapshot APIs were installed to satisfy controller dependencies. powerstore-vgrc-5m is initial provider setup, not proof a selected workload uses group replication. Group/snapshot instance names and usage are unverified.</td></tr>
    <tr><td>CatalogSource; Subscription; InstallPlan; ClusterServiceVersion</td><td>Catalog: openshift-marketplace; RHDR: openshift-dr-system; GitOps/orchestrator: inspect openshift-operators</td><td>OLM installation: catalog supplies bundle, Subscription requests version, InstallPlan installs CSV/controller. Later Setup snapshot has staging CSVs with no active Subscriptions; do not assume an active upgrade chain.</td></tr>
    <tr><td>ManagedClusterSet / Binding; Klusterlet; MultiClusterHub / MultiClusterEngine</td><td>Hub set and spoke Klusterlet cluster-scoped; binding in Placement namespace; discover ACM/MCE installation namespaces</td><td>Cluster selection, agent delivery and ACM/MCE installation underpin the DR chain. Binding exposes a set to Placement; agent applies ManifestWork.</td></tr>
    <tr><td>Secret; ConfigMap; Service; Route; Deployment; Pod</td><td>Built-in, namespace of consuming controller or workload</td><td>Ramen S3 profiles/CA and ramen-s3-secret; RHEL cloudinit-hammerdb in VM namespace; managed acm-placement in openshift-dr-ops and cluster-registration Secrets in openshift-gitops; CSI array configuration and MinIO routing. No credential values shown.</td></tr>
    <tr><td>MirrorPeer; Submariner; DellCSIReplicationGroup</td><td>Not in this active Dell recovery path</td><td>ODF networking/replication and retired Dell CSM configuration must not be confused with csi-addons VolumeReplication.</td></tr>
    </tbody></table></div><p><b>How to trace a failure:</b> DRPC reference/validation, PlacementDecision, ManifestWork delivery, VRG/PVC selection, per-disk replication, target PV/attachment, object restore or GitOps destination reconciliation, then VM/VMI and guest. Follow actual owner references to distinguish ownership from a selector or status view.</p>
    <p>Sources: <a href="https://docs.google.com/document/d/1npumTvaf2SRj2wdEUoBBuYLZXwqXxJNUvY3SNqrLfe0/edit">Setup Doc, installation/transition and Step 11</a> · <a href="https://github.com/elsapassaro/ramendr-starter-kit/tree/ocp-4.22-rhdr-dell/clusters/dell-s4/hub-dr">Verified upstream DRPC / Placement / ApplicationSet</a>. Read live references before treating recorded names as current state.</p>`;
  const anchor=[...document.querySelectorAll('h2')].find(el=>el.textContent==='Start-to-finish flow');anchor.before(section);
  const supporting={
    DRClusterConfig:['Spoke-side DR cluster configuration.','Provides cluster-specific settings used by the Ramen cluster controller; discover the actual instance.'],
    DataSource:['CDI reference to an image source such as rhel9.','Decouples initial rootdisk population from the underlying image PVC. It is not the failover disk source.'],
    Klusterlet:['ACM agent configuration on an imported spoke.','Enables the agents that receive hub work and report managed-cluster state.'],
    MultiClusterHub:['ACM installation configuration.','Provides the hub management services behind cluster import, selection and observation; not a per-workload failover trigger.'],
    MultiClusterEngine:['MCE installation configuration.','Provides cluster lifecycle/registration infrastructure supporting ACM delivery; inspect its actual installation namespace.'],
    MirrorPeer:['ODF multicluster storage relationship.','Not needed by this Dell array-native path; shown only to distinguish the ODF architecture.'],
    Submariner:['Cross-cluster networking configuration.','Not part of the current Dell path; array replication does not use an ODF pod-network tunnel.'],
    DellCSIReplicationGroup:['Resource from the retired Dell CSM replication path.','Not needed by the active Ramen/csi-addons VolumeReplication workflow.']
  };
  const support=document.createElement('div');support.className='support-explanations';
  support.innerHTML='<h3>Other custom resources: use and why needed</h3>'+Object.entries(supporting).map(([kind,[use,reason]])=>`<details><summary>${esc(kind)}</summary><p><strong>Used for:</strong> ${esc(use)}</p><p><strong>Why needed / applicability:</strong> ${esc(reason)}</p></details>`).join('');
  section.querySelector('.table-wrap').after(support);
  const dia=document.getElementById('resource-dia'),svg=document.getElementById('resource-svg'),sizer=document.getElementById('resource-sizer'),wrap=document.getElementById('resource-wrap');
  const width=1700;let zoom=1,height=0;
  function scale(){dia.style.transform=`scale(${zoom})`;sizer.style.width=width*zoom+'px';sizer.style.height=height*zoom+'px';}
  function draw(){
    let top=20;const edges=[];
    lanes.forEach(([,nodes,links],row)=>{
      dia.querySelector(`.resource-lane-title[data-row="${row}"]`).style.top=top+'px';top+=38;
      const cards=[...dia.querySelectorAll(`.resource-node[data-row="${row}"]`)];
      cards.forEach((el,col)=>{el.style.left=20+col*340+'px';el.style.top=top+'px';});
      cards.slice(0,-1).forEach((a,col)=>{
        if(!links[col]) return;
        const b=cards[col+1],x1=a.offsetLeft+a.offsetWidth,x2=b.offsetLeft,y=top+Math.min(a.offsetHeight,b.offsetHeight)/2;
        const lines=[];let line='';links[col].split(' ').forEach(word=>{if((line+' '+word).trim().length>15){if(line)lines.push(line);line=word;}else line=(line+' '+word).trim();});if(line)lines.push(line);
        edges.push(`<path d="M${x1} ${y} C${x1+35} ${y},${x2-35} ${y},${x2} ${y}" fill="none" stroke="#58a6ff" stroke-width="2"/><circle cx="${x1}" cy="${y}" r="3" fill="#58a6ff"/><circle cx="${x2}" cy="${y}" r="4" fill="#58a6ff"/><text x="${(x1+x2)/2}" y="${y+22}" text-anchor="middle" fill="#c9d1d9" font-size="11">${lines.map((l,i)=>`<tspan x="${(x1+x2)/2}" dy="${i?14:0}">${esc(l)}</tspan>`).join('')}</text>`);
      });top+=Math.max(...cards.map(el=>el.offsetHeight))+35;
    });height=top;dia.style.width=width+'px';dia.style.height=height+'px';svg.setAttribute('width',width);svg.setAttribute('height',height);svg.innerHTML=edges.join('');scale();
  }
  document.getElementById('resource-fit').onclick=()=>{zoom=Math.min(1,wrap.clientWidth/width);scale();};
  document.getElementById('resource-reset').onclick=()=>{zoom=1;scale();};
  dia.addEventListener('toggle',draw,true);
  document.getElementById('resource-expand').onclick=()=>{dia.querySelectorAll('details').forEach(el=>{el.open=true;});draw();};
  document.getElementById('resource-collapse').onclick=()=>{dia.querySelectorAll('details').forEach(el=>{el.open=false;});draw();};
  window.addEventListener('resize',draw);document.fonts.ready.then(draw);
})();
