'use strict';
(() => {
  const id=document.body.dataset.flow, managed=['292','294'].includes(id), win=id==='294';
  const ns=({291:'hammerdb',292:'gitops-vms',293:'hammerdb-win',294:'gitops-vms-win'})[id];
  const vm=({291:'hammerdb-rhel9',292:'hammerdb-rhel9',293:'hammerdb-win',294:'windows-hammerdb'})[id];
  const disk=win?'hammerdb-win':vm;
  const drpc=({291:'hammerdb-drpc',292:'dell-vm-drpc',293:'hammerdb-win-drpc',294:'dell-win-drpc'})[id];
  const placement=({291:'hammerdb-placement',292:'dell-vm-placement',293:'hammerdb-win-placement',294:'dell-win-placement'})[id];
  const appset=win?'dell-win-workload':'dell-vm-workload', wpath=win?'workloads-win':'workloads', wsha=win?'ebfa8ac':'e6237ef';
  const decision=placement+'-decision-1';
  // Managed ApplicationSet DRPCs live with their Placement in openshift-gitops; their VRG lives in the app namespace.
  const hubNs=managed?'openshift-gitops':'openshift-dr-ops', vrgNs=managed?ns:'openshift-dr-ops';
  const bsl=managed?'Not used (no kubeObjectProtection)':`openshift-dr-ops--${drpc}--0----minio-on-hub / openshift-dr-ops--${drpc}--1----minio-on-hub`;
  const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  // Why it matters, in one plain sentence a newcomer can follow.
  const why={
    ManagedCluster:"Without this entry the hub does not know the spoke exists, so it cannot send it anything or move an app there.",
    DRCluster:"Ramen only fails over to a site it has checked and approved, and this is where that check is recorded.",
    DRPolicy:"It sets the two sites that back each other up and how often the copy is refreshed, which decides how much recent data you could lose.",
    DRPlacementControl:"It is the single object that ties one app to its backup plan; the Failover button in the console works on this object.",
    Placement:"It gives every tool one shared place to read where the app should run, so they never disagree.",
    PlacementDecision:"Other tools read this answer to know where to act; without it nothing knows which spoke is active.",
    ProtectedApplicationView:"It lets the console show the protected app and its status; it only displays information and never moves anything.",
    ManifestWork:"The hub cannot create things directly on a spoke, so this is the only way the hub's instructions reach the spoke.",
    VolumeReplicationGroup:"It keeps all of one app's disks in the same role (in use or backup copy) and switches them together during failover.",
    ManagedClusterView:"It lets the hub see what is happening on a spoke, so the console can show progress.",
    VolumeReplication:"Each disk needs its own instruction telling the storage whether this side is the live copy or the backup copy.",
    VolumeReplicationClass:"It tells the storage driver how and how often to copy disks to the other array.",
    StorageClass:"Without it a disk request has no way to say which storage system should create the disk.",
    CSIDriver:"It tells Kubernetes that the Dell storage driver is installed and what it can do.",
    "CSI + csi-addons":"These are the programs that actually talk to the Dell arrays; every disk action goes through them.",
    "Array replica volumes":"This is the real data at the second site. If these copies are missing or old, there is nothing current to recover.",
    VirtualMachine:"Disks alone cannot run; this definition says how to build the computer that uses them.",
    DataVolume:"It creates and fills disks the first time; during recovery it must not replace the copied disks with new empty ones.",
    PersistentVolumeClaim:"It is the disk name the VM uses, and the thing Ramen picks out to protect.",
    PersistentVolume:"It records exactly which disk on the array belongs to the request, so the VM gets the right data.",
    VolumeAttachment:"A disk must be connected to the server running the VM before the VM can read it.",
    DataProtectionApplication:"It sets up the backup tool that saves the app's settings, which disk copying alone does not save.",
    "Backup / Restore":"Copied disks do not include the VM's settings; these save and rebuild them.",
    BackupStorageLocation:"The backup tool needs to know where to save and find its backups.",
    "MinIO / S3":"It keeps recovery information and settings backups in a place separate from the storage arrays.",
    ApplicationSet:"In the GitOps setup it is what makes the deployment follow the app to its new site.",
    Application:"It is the exact instruction Argo CD follows to create the app on a cluster.",
    "ManagedClusterSet / Binding":"A Placement may only choose from clusters that have been made available to its folder, and this does that.",
    GitOpsCluster:"Argo CD can only deploy to clusters it knows about, and this introduces the spokes to it.",
    ClusterRoleBinding:"Without this permission Argo CD on the spoke would be refused when it tries to create the VM.",
    ArgoCD:"These are the running programs that actually read Git and create the app.",
    HyperConverged:"It switches on the ability to run VMs at all on the spoke.",
    "KubeVirt / CDI":"These programs actually run the VMs and prepare their disks.",
    VirtualMachineInstance:"It is the VM actually running; checking it shows whether recovery really brought the computer back.",
    CatalogSource:"It is where software installs are found; changing it does not by itself upgrade anything.",
    Subscription:"It tells the installer which software and which update stream to follow.",
    InstallPlan:"It shows whether a software install or update actually happened.",
    ClusterServiceVersion:"It confirms which version of the DR software is installed.",
    Recipe:"Optional; available if a custom backup sequence is ever needed, but not used by these VMs.",
    VolumeGroupReplication:"Optional; would copy several disks as one group, but these VMs copy each disk on its own.",
    VolumeGroupReplicationClass:"Optional settings for group copying; not the settings these VMs use.",
    VolumeGroupSnapshotClass:"Optional; installed but not set up or used here."
  };
  // Explain each kind assuming no prior knowledge: what it is (with an everyday comparison), then what it does in this lab.
  const explain={
    ManagedCluster:["ACM (Advanced Cluster Management) is a management tool that runs on one central cluster, called the hub, and controls other clusters, called spokes. A ManagedCluster is the hub's contact card for one spoke: its name, whether it is connected, and how to reach the small helper program installed on it.","This lab has two cards, spoke-0 and spoke-1. Everything the hub does to a spoke, including moving an app during failover, starts from this card. Note that \"connected\" only means the hub can talk to the spoke; it does not mean the spoke's backup storage is healthy."],
    DRCluster:["DR means disaster recovery: keeping an app able to restart at another site if its first site fails. Ramen is the DR software in this lab. A DRCluster is Ramen's record for one site, saying \"this cluster is a recovery site, and here is where its recovery notes are stored.\"","There is one record each for spoke-0 and spoke-1. Ramen checks each site (for example, that it can reach the storage where recovery notes are kept) before it will use it. The record holds no VM data; the data is on the storage arrays."],
    DRPolicy:["A DRPolicy is the backup agreement between two sites: which two clusters protect each other, and how often data is copied from one to the other. That interval is linked to RPO (Recovery Point Objective): the most recent work you could lose if a site suddenly fails. Copying every 15 minutes means you could lose up to about 15 minutes of changes.","Here the policy dr-policy-15m pairs spoke-0 and spoke-1 with a 15-minute copy interval. Each protected app is linked to this one policy, so they all share the same pair of sites and the same schedule."],
    DRPlacementControl:["Usually called DRPC. It is the control panel for one protected app. It links three things: the app's backup agreement (DRPolicy), the record of which cluster runs the app (Placement), and a label that picks out which of the app's disks to protect. When you press Failover in the console, the console writes your request into this object, and Ramen carries it out.",managed?"For this GitOps-managed app, the DRPC is kept in the openshift-gitops folder (namespace) on the hub, beside its Placement. It picks disks by the label drprotection=true. Ramen reads it on the hub and sends the matching instructions to the spokes.":"For this app the DRPC is kept in the openshift-dr-ops folder (namespace) on the hub. It names the app's folder on the spokes (the protected namespace) and a label that picks its disks. Ramen reads it on the hub and sends the matching instructions to the spokes."],
    Placement:["A Placement is a general ACM object, not something invented for DR. It asks one question: \"Which cluster or clusters should this go to?\" It holds the rules for which clusters are allowed, and the answer is written into a companion object called a PlacementDecision. ACM uses Placements for many things, such as deciding where to apply security policies or where to deploy apps.","Normally ACM works out the answer by itself and can change it whenever clusters change. For a protected VM that is unsafe, because ACM might move the VM on its own. So when Ramen takes charge of this Placement, ACM's automatic choosing is switched off and only Ramen writes the answer: spoke-0 normally, spoke-1 after you confirm a failover."+(managed?" A second, unrelated Placement, all-openshift-clusters, keeps ACM's automatic choosing; it only lists which clusters Argo CD may deploy to and never decides where this VM runs.":"")],
    PlacementDecision:["The answer sheet for a Placement. It simply lists the name of the chosen cluster. Programs that need to know where the app should run read this sheet instead of working it out themselves.",managed?"Here, the ApplicationSet (the GitOps piece described further down) reads this sheet and deploys the VM to whichever spoke it names. Changing the answer is only the first step: you still have to check that the VM really appeared on that spoke.":"For this app no deployment tool follows the sheet: the VM is already on its spoke or is rebuilt from backup. The sheet is mainly Ramen's record of the active site, which the console also shows."],
    ProtectedApplicationView:["A display-only summary that matches a protected app with its DR status, so the web console can show them together on one row.","It lives on the hub and is kept up to date automatically. It never copies disks, starts a VM or deploys anything; it only reports."],
    ManifestWork:["The hub cannot reach into a spoke and create things there directly. Instead it puts the things it wants created into a sealed envelope, a ManifestWork, and the ACM helper program on the spoke opens it and creates the contents locally. Think of it as sending a package by courier.",managed?"For this app Ramen sends two envelopes to each spoke: one creates the "+ns+" folder, and one creates the app's protection plan (the VolumeReplicationGroup) inside it. Delivering the envelope is separate from the storage work that follows.":"For this app Ramen sends one envelope to each spoke. It creates the app's protection plan (the VolumeReplicationGroup) in the openshift-dr-ops folder there. Delivering the envelope is separate from the storage work that follows."],
    VolumeReplicationGroup:["Usually called VRG. It is the protection plan for one app on one spoke. It gathers all of the app's protected disks and gives them one shared role: Primary (this is the live copy the VM uses) or Secondary (this is the backup copy receiving updates). It also saves the notes needed to rebuild the app elsewhere.",managed?"For this app the VRG is in the "+ns+" folder, next to the disks it protects. That is why Argo CD must never delete that folder during failover: deleting it would delete the VRG before it can switch the old site to Secondary.":"For this app the VRG is in the openshift-dr-ops folder, while the disks stay in the app's own folder. During failover the VRG on the new site becomes Primary and the one on the old site becomes Secondary."],
    ManagedClusterView:["A window from the hub into a spoke. It asks the spoke \"what does this object look like right now?\" and brings the answer back. Unlike a ManifestWork, it only looks; it never changes anything.","Here it lets Ramen see the spoke's VRG status, so it can tell whether each failover step has finished and the console can show progress."],
    VolumeReplication:["An instruction for one single disk (not the whole VM). It points at one disk request and says whether this side's copy should be Primary (in use) or Secondary (receiving updates).","The VRG creates one of these for each protected disk, so this VM gets one for its system disk and one for its database disk. A storage helper program passes the instruction to the Dell driver, which tells the array what to do."],
    VolumeReplicationClass:["A reusable settings sheet for copying disks: which storage driver to use, which other array to copy to, and how often. Despite the word \"Class\", it was added by an extra component and is not built into Kubernetes.","Here powerstore-vrc-15m copies every 15 minutes, matching the DRPolicy. Each spoke has its own sheet pointing to its partner array (VSA-A copies to VSA-B and the reverse)."],
    StorageClass:["Kubernetes is the system that runs workloads on these clusters. When a workload needs a disk, it fills in a request form, and the form names a StorageClass. The StorageClass is like an entry in a catalog: it says which storage system makes the disk and with what settings. It is built into Kubernetes.","Both of this VM's disks name powerstore-sc, which points to the Dell PowerStore driver. Each spoke has its own copy of this catalog entry, pointing to its local array. Creating disks is a separate job from copying them to the other site."],
    CSIDriver:["CSI (Container Storage Interface) is a standard plug that lets Kubernetes work with storage from any vendor. A CSIDriver is Kubernetes' record that a particular vendor's plug is installed and what it supports. It is built into Kubernetes.","The name csi-powerstore.dellemc.com is the Dell PowerStore plug. This record only announces that the plug exists; the Dell programs described next do the actual work."],
    "CSI + csi-addons":["These are the running programs behind the storage records. The Dell CSI driver creates disks and connects them to servers. csi-addons is an extra piece that adds the ability to control copying between arrays.","They turn Kubernetes requests into commands for the PowerStore arrays, and they connect the right array disk to the server running the VM over the storage network (NVMe/TCP)."],
    "Array replica volumes":["The actual copies of the VM's disks stored on the second storage array (PowerStore is Dell's storage system; VSA-A and VSA-B are the two arrays in this lab). They hold the operating system and the database.","The arrays copy changes from one to the other on a schedule. During failover, the copy on the target array is switched to be the live copy, and the VM is reconnected to it instead of getting new empty disks."],
    VirtualMachine:["A VirtualMachine (VM) is a computer simulated in software. This object is its saved definition: how many processors, how much memory, how it boots, its network and which disks it uses. It is like a blueprint, not the running computer.","OpenShift Virtualization (the feature that runs VMs on these clusters) starts the running VM from this blueprint. To recover you need both: the blueprint and the copied disks. One cannot replace the other."],
    DataVolume:["A request to create and fill a disk the first time, handled by CDI (Containerized Data Importer), the part of OpenShift Virtualization that prepares disks. It can copy an operating-system image onto a new disk or make an empty disk.","For the RHEL VM, the system disk is copied from a standard RHEL 9 image and the database disk starts empty. The Windows VMs copy their system disk from the golden PVC windows-golden-images/windows-server-2022-standard, which exists only on spoke-0; after failover the managed Windows DataVolume must adopt the restored PVC (CDI DataVolumeClaimAdoption) instead of cloning. This only happens at first setup; it is not how data is recovered."],
    PersistentVolumeClaim:["Usually called PVC. A request for a disk: how big it should be, how it can be used, and which StorageClass should make it. The VM refers to its disks by these request names, much like a ticket you hand in to collect your luggage.","This VM has two: rootdisk (operating system) and datadisk (database). Ramen chooses which disks to protect by a label on these requests, so a temporary disk without the label is not protected."],
    PersistentVolume:["Usually called PV. The record of the real disk given in answer to a request (PVC). It notes the size, which request it belongs to, and an ID that points to the exact disk on the storage array.","The request is the name the VM uses; this record says which physical disk that is. After failover, the ID must point to the copied disk on the target array, not the old disk on the failed site."],
    VolumeAttachment:["A record that a disk is plugged into a specific server (worker node) in the cluster. A VM can only read a disk that is attached to the server it is running on.","The Dell driver carries out the attachment. This record only tracks the connection; it has nothing to do with copying data between sites."],
    DataProtectionApplication:["OADP (OpenShift API for Data Protection) provides Velero, a tool that backs up Kubernetes settings (not disk contents). This object switches Velero on and sets it up.","Copying disks saves the data, but the target site also needs the VM's blueprint and related settings. Ramen asks Velero to save those settings and to restore them during failover."],
    "Backup / Restore":["A Backup is a saved copy of an app's Kubernetes settings, such as its VM blueprint and disk requests. A Restore rebuilds those settings from a Backup.","They work alongside disk copying: the copied disks contain the database, but without a restored blueprint there is no VM to attach them to."],
    BackupStorageLocation:["Velero's note of where backups are kept: the storage address and folder (bucket), plus a reference to the login details.","Here the locations point to the MinIO storage on the hub. They are only directions to the backups; they are not the backups themselves."],
    "MinIO / S3":["MinIO is a file-storage service running on the hub. S3 is the common way programs talk to it. It is kept apart from the storage arrays, so it survives if a spoke's array fails.","It stores Ramen's recovery notes and the Velero settings backups. The database itself is copied by the arrays, not uploaded to MinIO."],
    ApplicationSet:["Git is a version-controlled store of files; GitOps means the definitions of your apps are kept in Git and a tool, Argo CD, makes the clusters match them. An ApplicationSet is a template that automatically produces Argo CD deployment instructions, one per cluster, based on a list such as a PlacementDecision.","Here the ApplicationSet "+appset+", in the openshift-gitops folder on the hub, reads the DR PlacementDecision and produces an instruction for whichever spoke it names ("+appset+"-spoke-0 or -spoke-1). It must be in the same folder as the decision, because that is the only place it looks."],
    Application:["An Argo CD deployment instruction: which Git repository, which version and folder to use, and which cluster and folder to create the app in.","When the active site changes, a new instruction is produced for the new spoke. Here it uses the elsapassaro/ramendr-starter-kit repository, branch ocp-4.22-rhdr-dell, folder clusters/dell-s4/workloads."],
    "ManagedClusterSet / Binding":["A ManagedClusterSet is a named group of clusters. A Binding makes that group available inside one folder (namespace), so Placements in that folder are allowed to choose from it. Adding a cluster to ACM and allowing it to be chosen are separate steps.","The default group is made available in openshift-dr-ops (for discovered apps) and in openshift-gitops (for the GitOps app and Argo CD)."],
    GitOpsCluster:["A connector between ACM and Argo CD. It takes the clusters picked by a Placement and introduces them to Argo CD as places it may deploy to.","Here argo-acm-clusters uses the Placement all-openshift-clusters, so both spokes become Argo CD destinations. A different Placement, the DR one, decides where the VM actually runs."],
    ClusterRoleBinding:["A permission grant that lets a particular program do certain things across a whole cluster. It is built into Kubernetes.","In this setup each spoke runs its own Argo CD, which creates the VM locally. The gitops-admin grant gives that Argo CD permission to create the VM, its disks and its network service; without it Argo CD would be refused."],
    ArgoCD:["The settings for a running Argo CD service. Argo CD keeps comparing what Git says should exist with what exists on the cluster, and fixes any difference.","Here there is one on the hub and one on each spoke. The spoke ones create the VM. The ApplicationSet and Application are only instructions; Argo CD is the program that follows them."],
    HyperConverged:["The main on-switch and settings for OpenShift Virtualization, the feature that lets these clusters run VMs.","kubevirt-hyperconverged turns on VM support on each spoke. It is shared by all VMs; it is not specific to one app or to failover."],
    "KubeVirt / CDI":["The working parts of OpenShift Virtualization. KubeVirt runs VMs. CDI prepares their disks.","They are set up automatically by the HyperConverged switch. KubeVirt's settings live in openshift-cnv; CDI's settings apply to the whole cluster rather than one folder."],
    VirtualMachineInstance:["Usually called VMI. The VM while it is actually running: which server it runs on and whether it is ready.","After failover, check that this exists on the target spoke, and then check inside the VM that the database and the load generator started, to confirm the recovered VM is really usable."],
    CatalogSource:["OLM (Operator Lifecycle Manager) is the cluster's software installer, a bit like an app store. A CatalogSource is one shop in that store, listing software versions you can install.","The staging shop offers versions of the DR software (RHDR). Pointing it at a newer list only makes new versions available; it does not install or upgrade anything by itself."],
    Subscription:["A standing order with the installer: \"install this software and follow this update stream.\"","The installer turns the order into an install plan. The recorded snapshot found no active order for the DR software, even though the software was installed and running."],
    InstallPlan:["The installer's step-by-step list for installing one software version and anything it needs.","It is part of installing software, not recovering apps. Its status shows whether an offered update actually went through."],
    ClusterServiceVersion:["Usually called CSV. The receipt for an installed piece of software: its version and what it added to the cluster.","The recorded receipt on the spokes is for the DR software version 4.22.0-86. The running program is the real thing; the CSV is the record of installing it."],
    Recipe:["An optional, custom step-by-step plan for backing up and restoring an app's settings in a particular order.","The ability to use Recipes is installed, but these VMs do not have one. They use Ramen's standard backup instead."],
    VolumeGroupReplication:["An optional way to copy several disks as one group, so they always match each other to the exact same moment.","These VMs copy each disk separately. The only group found belongs to an unrelated test app."],
    VolumeGroupReplicationClass:["The settings sheet for group copying, similar to the VolumeReplicationClass but for groups.","powerstore-vgrc-5m was created during first setup. It is not the 15-minute per-disk setting these VMs use."],
    VolumeGroupSnapshotClass:["Settings for taking a snapshot (a frozen point-in-time copy) of several disks at once. That is different from the ongoing copying between arrays.","The ability is installed, but no settings were created and these VMs do not use snapshots."],
    DRClusterConfig:["The settings the DR software on a spoke uses for its own site.","It is the spoke-side partner of the hub's DRCluster record: one sets up the local program, the other describes the site to the hub."],
    DataSource:["A named pointer to an operating-system image that can be used to fill a new disk.","The RHEL system disk was first filled from the rhel9 image. A new copy from it is a fresh install, not the VM's latest data."],
    Klusterlet:["The settings for ACM's helper program on a spoke. That helper connects the spoke to the hub.","It is the helper that opens ManifestWork envelopes and reports the spoke's status. It does not copy disks."],
    MultiClusterHub:["The installation settings for ACM itself on the hub.","It makes the management features possible, but it does not choose where any app runs."],
    MultiClusterEngine:["The installation settings for the part of ACM that adds and manages clusters.","Its program runs in the multicluster-engine folder; its settings apply to the whole hub."],
    MirrorPeer:["Part of a different storage product (OpenShift Data Foundation) used in other DR setups. It is not used here.","This lab copies disks using the Dell arrays' own replication, so this piece does not apply."],
    Submariner:["A tool that connects the internal networks of two clusters, needed by some other DR setups.","It is not used here: the Dell arrays copy the disks directly between themselves."],
    DellCSIReplicationGroup:["Part of Dell's older copying method, which this lab no longer uses.","Shown only to avoid confusion; the current method uses the VRG and VolumeReplication objects."]
  };
  // The registration Placement keeps ACM's automatic choosing, unlike the DR Placement that shares its kind.
  const byName={'all-openshift-clusters':[explain.Placement[0],"This Placement is not used for disaster recovery. ACM keeps choosing for it automatically: it selects every OpenShift cluster, and the GitOpsCluster uses that list to tell Argo CD which clusters it may deploy to. It is set to keep clusters on the list even when they are temporarily unreachable, so a failed site is not removed in the middle of a recovery. It never decides where the protected VM runs; the DR Placement does that."]};
  const explanation=(kind,name)=>(byName[name]||explain[kind]).map((text,i)=>`<p><strong>${['What it is:','In this lab:'][i]}</strong> ${esc(text)}</p>`).join('');
  const palette={
    'openshift-dr-ops':'#bc8cff','openshift-gitops':'#ff8fb3',
    hammerdb:'#3fb950','gitops-vms':'#39d2c0','hammerdb-win':'#e3b341',
    'openshift-adp':'#58a6ff','openshift-cnv':'#f69d50',
    'openshift-marketplace':'#a5d6ff','openshift-dr-system':'#d2a8ff',
    powerstore:'#ffa657','csi-addons-system':'#ff7b72',minio:'#a5d675',
    'cluster-scoped':'#c9d1d9',external:'#8b949e',
    'not configured':'#9ba7b4','namespaced (no instances)':'#9ba7b4',test:'#9ba7b4','mixed scope':'#9ba7b4'
  };
  function namespaces(scope){
    const location=scope.split(' / ').slice(1).join(' / ');
    if(scope.startsWith('External')) return ['external'];
    if(location==='cluster-scoped') return ['cluster-scoped'];
    if(location.includes('cluster-scoped;')) return ['mixed scope'];
    const keys=location.split(' + ');
    return keys.every(key=>Object.hasOwn(palette,key))?keys:['mixed scope'];
  }
  // Show only the cluster part when the badges already carry the full namespace/scope;
  // keep the full string when the badge is a fallback (mixed scope) that would lose detail.
  function clusterLabel(scope){
    const keys=namespaces(scope);
    if(keys.length===1&&keys[0]==='mixed scope') return scope;
    return scope.split(' / ')[0];
  }
  palette['spoke-0']='#79c0ff';palette['spoke-1']='#f778ba';
  const n=(kind,name,scope,detail,type='cr')=>({kind,name,scope,detail,type});
  const hub=`Hub / ${hubNs}`, spoke=`Active spoke (follows DR placement) / ${ns}`;
  const d=n('DRPlacementControl',drpc,hub,managed?'References DRPolicy, Placement and PVC selector drprotection=true; no protectedNamespaces for a managed app.':'References DRPolicy, Placement, protectedNamespaces and PVC selector.');
  const v=n('VolumeReplicationGroup',drpc,`Each spoke / ${vrgNs}`,managed?`Configured in Git: VRG name matches DRPC and lives in ${ns} with the protected PVCs. The namespace must not be Argo CD-owned.`:'Live inventory: VRG name matches DRPC, in openshift-dr-ops on both spokes. Protected PVCs remain in the workload namespace.');
  const m=n('VirtualMachine',vm,spoke,'VM configuration references root/data disks; starts a VirtualMachineInstance and launcher Pod.');
  const lanes=[
    ['Policy and DR site eligibility',[
      n('ManagedCluster','spoke-0 / spoke-1','Hub / cluster-scoped','ACM import/availability is distinct from DR validation.'),
      n('DRCluster','spoke-0 / spoke-1','Hub / cluster-scoped','Ramen site identity, validation and S3 profile.'),
      n('DRPolicy','dr-policy-15m','Hub / cluster-scoped','Pairs DRClusters; recorded schedule 15m.'),d
    ],['same site identity','drClusters[]','drPolicyRef']],
    ['DR placement and console observation',[
      d,n('Placement',placement,hub,'The DRPC points to this Placement. ACM\u2019s automatic cluster picking is switched off here, so only Ramen decides which spoke runs the VM.'),
      n('PlacementDecision',decision,hub,'Observed controller-generated instance; status.decisions selects the active spoke. Names are a snapshot, not a universal naming guarantee.'),
      n('ProtectedApplicationView',drpc,hub,managed?'Per-DRPC view in openshift-gitops, type ApplicationSet (observed for the earlier managed run). Observation, not deployment.':'Live hub inventory verifies this per-DRPC view in openshift-dr-ops. Orchestrator correlates DRPC/application state for the UI. Observation, not deployment.')
    ],['placementRef','decision status','UI correlates decision + DRPC']],
    ['Cross-cluster delivery and status',[
      d,n('ManifestWork',managed?`${drpc}-${vrgNs}-vrg-mw / ${drpc}-${vrgNs}-ns-mw`:drpc+'-openshift-dr-ops-vrg-mw','Hub / spoke-0 + spoke-1',managed?'One VRG work and one namespace work per hub spoke namespace (pattern observed for the earlier managed run). ACM agent delivers them to '+ns+' on that spoke.':'One observed instance in each hub spoke namespace. ACM agent delivers the VRG to openshift-dr-ops on that spoke.'),v,
      n('ManagedClusterView',`${drpc}-${vrgNs}-vrg-mcv`,'Hub / spoke-0 + spoke-1','One observed instance in each hub spoke namespace. Observes remote VRG status; does not own the VRG.')
    ],['Ramen reconciles','delivers VRG','observes status']],
    ['Protected disk replication',[
      v,n('VolumeReplication','One per selected PVC',spoke,'dataSource references PVC; desired role drives Dell replication.'),
      n('VolumeReplicationClass','powerstore-vrc-15m','Spokes / cluster-scoped','Matched by CSI provisioner and schedule; mirrored A-to-B / B-to-A parameters.'),
      n('CSI + csi-addons','Dell controllers','Spokes / powerstore + csi-addons-system','Translate replication requests into PowerStore API operations.','external'),
      n('Array replica volumes','VSA-A / VSA-B','External / no namespace','Array-native block replication, separate from S3 and Git.','external')
    ],['creates for PVC','class reference','controller interprets','array API']],
    ['Storage provisioning: claims, class and driver',[
      n('PersistentVolumeClaim',`${disk}-rootdisk / ${disk}-datadisk`,spoke,'Both disks request storageClassName: powerstore-sc; the RHEL upstream DataVolume definitions verify that provisioning choice.','builtin'),
      n('StorageClass','powerstore-sc','Spokes / cluster-scoped','Recorded workload provisioning class; distinct from powerstore-vrc-15m replication settings.','builtin'),
      n('CSIDriver','csi-powerstore.dellemc.com','Spokes / cluster-scoped','Kubernetes driver registration for Dell PowerStore storage.','builtin'),
      n('CSI + csi-addons','Dell controllers','Spokes / powerstore + csi-addons-system','Controller/node implementation behind provisioning, attachment and replication.','external')
    ],['storageClassName','provisioner identity','driver implementation']],
    ['VM disk provisioning and binding',[
      m,n('DataVolume',`${disk}-rootdisk / ${disk}-datadisk`,spoke,'CDI provisions initial disks and owns corresponding PVCs. Recovery must reuse promoted disks.'),
      n('PersistentVolumeClaim',`${disk}-rootdisk / ${disk}-datadisk`,spoke,'VRG selects protected disks; excludes unlabeled CDI temporary claims.','builtin'),
      n('PersistentVolume','Dynamic / restored name','Spokes / cluster-scoped','PVC binding; CSI volume handle identifies the actual array disk.','builtin'),
      n('VolumeAttachment','Generated attachment','Spokes / cluster-scoped','References PV + worker; CSI publishes disk to the VM launcher.','builtin')
    ],['references disk','owns initial PVC','volumeName binding','PV + worker']],
    ['Kubernetes object protection (not block data)',[
      v,n('DataProtectionApplication','velero','Spokes / openshift-adp','Observed on both spokes. Runs Velero/plugins; Ramen requests capture/restore via kubeObjectProtection.'),
      n('Backup / Restore','No current CR instances','Spokes / openshift-adp','Read-only inventory returned no Backup or Restore CRs. Run-generated names are transient; absence of a CR does not establish absence of a stored S3 archive.'),
      n('BackupStorageLocation',bsl,'Spokes / openshift-adp',managed?'The managed DRPC does not enable kubeObjectProtection: Git and Argo CD recreate the workload objects, so no per-application location is created.':'Observed locations for slots 0 and 1, present on both spokes. S3 endpoint/credential references, not proof of archive completion.'),
      n('MinIO / S3','ramen-metadata','Hub / minio','Metadata and object archives; not VM disk writes.','external')
    ],['requests via Velero','executes backup / restore','storageLocation','S3 archive']]
  ];
  if(managed) lanes.push(
    ['GitOps workload handoff (configured; acceptance must be demonstrated)',[
      n('PlacementDecision',decision,hub,'Selects a registered destination cluster.'),
      n('ApplicationSet',appset,hub,'Pull-model ApplicationSet in openshift-gitops (commit '+wsha+'). Generator reads acm-placement and the '+placement+' decision in the same namespace.'),
      n('Application',appset+'-{{name}} (generated)',hub,'Generated per selected spoke and pulled to that spoke’s Argo CD. Source: upstream ocp-4.22-rhdr-dell, clusters/dell-s4/'+wpath+', which has no Namespace manifest. Deployed from the corrected repo on '+(win?'2026-10-08':'2026-10-06')+'.'),m
    ],['generator reads','generates','spoke Argo CD syncs']],
    ['GitOps registration (separate from DR Placement)',[
      n('ManagedClusterSet / Binding','default / default','Hub / cluster-scoped; openshift-gitops + openshift-dr-ops','Observed default ManagedClusterSet and default bindings in openshift-gitops and openshift-dr-ops. Registration Placement remains separate from DR Placement.'),
      n('Placement','all-openshift-clusters','Hub / openshift-gitops','Registration selection with unreachable/unavailable tolerations (applied 2026-10-06), not the DR workload decision.'),
      n('GitOpsCluster','argo-acm-clusters','Hub / openshift-gitops','Uses registration Placement and supplies Argo CD cluster-registration Secrets.'),
      n('ArgoCD','openshift-gitops','Hub + spokes / openshift-gitops','Instances on the hub and both spokes (GitOps 1.22). Spoke instances apply pull-model Applications.'),
      n('ClusterRoleBinding','gitops-admin','Spokes / cluster-scoped','cluster-admin for openshift-gitops-argocd-application-controller on both spokes; RHACM pull-model prerequisite, stored under spoke-rbac.','builtin')
    ],['exposes clusters','placementRef','registers for','spoke controller permission']]
  );
  lanes.push(
    ['Virtualization installation and execution',[
      n('HyperConverged','kubevirt-hyperconverged','Spokes / openshift-cnv','Installation CR enables virtualization.'),
      n('KubeVirt / CDI','kubevirt-kubevirt-hyperconverged / cdi-kubevirt-hyperconverged','Spokes / openshift-cnv + cluster-scoped','Observed KubeVirt in openshift-cnv and cluster-scoped CDI on both spokes. HCO reconciles virtualization and disk import controllers.'),m,
      n('VirtualMachineInstance',vm,spoke,'Running guest instance; launcher Pod attaches the selected disks.')
    ],['reconciles','controllers implement','starts instance']],
    ['Operator installation (recorded mechanism, not an active upgrade)',[
      n('CatalogSource','rhdr-staging-catalog','All clusters / openshift-marketplace','Supplies RHDR bundles; catalog readiness does not prove an upgrade.'),
      n('Subscription','No active RHDR instance in recorded snapshot','RHDR spokes / openshift-dr-system','Historical installation mechanism; absence of a Subscription does not mean the installed CSV/controller is absent.'),
      n('InstallPlan','Run-generated installation record','RHDR spokes / openshift-dr-system','Historical OLM installation dependency; not an active workload-recovery resource.'),
      n('ClusterServiceVersion','rhdr-cluster-operator.v4.22.0-86.stable','RHDR spokes / openshift-dr-system','Observed spoke CSV. Hub hub/multicluster CSVs are separate from this spoke controller.')
    ],['bundle catalog','resolves bundle','installs CSV']],
    ['Conditional API dependencies (not established workload instances)',[
      n('Recipe','No current instances','Spokes / namespaced (no instances)','Namespaced CRD present, but no Recipe instances returned on either spoke. No active Recipe namespace to label.'),
      n('VolumeGroupReplication','No selected-workload instances','Unrelated spoke-0 example / test','Only observed instance is vgr-4251c970ec7af885d6ec79c1d2c40661-busybox in spoke-0/test, unrelated to these workloads. No instance on spoke-1.'),
      n('VolumeGroupReplicationClass','powerstore-vgrc-5m (initial setup)','Spokes / cluster-scoped','Class for the optional group replication branch.'),
      n('VolumeGroupSnapshotClass','No current instances','Spokes / cluster-scoped','CRD installed; no configured class instances returned on either spoke. Separate, conditional snapshot branch.')
    ],[null,'class if group API used',null]]
  );
  // Plain-language context for each chain: what problem the row solves and what it is used for in this lab.
  const intros={
    'Policy and DR site eligibility':'Before anything can fail over, Ramen must know which two sites are allowed to protect each other and how often to copy data. ACM first imports spoke-0 and spoke-1 as managed clusters; Ramen then describes each one as a DR site (DRCluster), and the DRPolicy pairs the two sites and sets the 15-minute replication schedule. The application\u2019s DRPC simply points at that policy, so this row answers \u201cwhere may this workload run, and on what schedule is it protected?\u201d',
    'DR placement and console observation':'This row decides which spoke the workload should run on right now. The DRPC points to a Placement, and during failover or relocate Ramen writes the chosen spoke into the PlacementDecision; ACM\u2019s usual automatic cluster picking is switched off so it cannot move the VM by itself. The ProtectedApplicationView only gathers that decision and the DRPC status so the Data Services console can show it; it reports state and never moves anything.',
    'Cross-cluster delivery and status':'The hub cannot create objects directly on a spoke, so it uses ACM as a courier. Ramen packs the per-application protection plan (the VRG) into a ManifestWork, the ACM agent on each spoke unpacks and applies it, and a ManagedClusterView carries the VRG\u2019s status back to the hub. This is how a click in the hub console turns into Primary or Secondary instructions on each spoke.',
    'Protected disk replication':'This is the path that actually copies the VM\u2019s disk blocks between sites. On each spoke the VRG creates one VolumeReplication per protected disk, the VolumeReplicationClass says which Dell driver and schedule to use, and the Dell CSI/csi-addons controllers ask the PowerStore arrays to replicate VSA-A to VSA-B (or the reverse). During failover the same objects flip the target copy to Primary so it can be used.',
    'Storage provisioning: claims, class and driver':'This row explains how a disk request becomes a real PowerStore volume. The PVC asks for storage by naming the powerstore-sc StorageClass, the StorageClass names the Dell CSI driver, and the driver creates the volume on the local array. It is plain Kubernetes storage and is separate from replication, which is configured by the VolumeReplicationClass in the row above.',
    'VM disk provisioning and binding':'This row follows the VM down to the physical disk it boots from. The VirtualMachine refers to its root and data disks, CDI DataVolumes create and fill the matching PVCs, each PVC is bound to a PersistentVolume holding the array volume handle, and a VolumeAttachment connects that volume to the worker running the VM. After failover the same chain must point at the promoted replica disks, not freshly created ones.',
    'Kubernetes object protection (not block data)':managed?'Disk replication copies data, but not the Kubernetes definitions that say how to run the VM. For discovered apps Ramen backs those definitions up through OADP/Velero to MinIO S3. In this managed scenario Git and Argo CD recreate the definitions instead, so this path is shown for comparison and no per-application backup location is used.':'Disk replication copies data, but not the Kubernetes definitions that say how to run the VM (its CPU, memory, boot settings and disk references). The VRG asks OADP/Velero to back those definitions up to MinIO S3 on a schedule, and on the target site Velero restores them so the VM can be recreated on top of the promoted disks.',
    'GitOps workload handoff (configured; acceptance must be demonstrated)':'For a GitOps-managed app, Git is where the VM definition lives. When the DR decision moves to another spoke, the ApplicationSet reads it, generates an Argo CD Application for the new spoke, and that spoke\u2019s Argo CD creates the VM there while the source copy is removed. This replaces the Velero restore used by discovered apps.',
    'GitOps registration (separate from DR Placement)':'Before Argo CD can deploy anywhere, the spokes must be registered as Argo CD destinations. A separate registration Placement selects all OpenShift clusters, the GitOpsCluster turns that selection into Argo CD cluster entries, and each spoke runs its own Argo CD with permission to create the workload. This is set up once and is different from the DR Placement that picks the active site.',
    'Virtualization installation and execution':'This row shows what makes a VM actually run on a spoke. The HyperConverged object installs OpenShift Virtualization, which brings the KubeVirt (runs VMs) and CDI (prepares disks) controllers. They turn the VirtualMachine definition into a running VirtualMachineInstance on a worker.',
    'Operator installation (recorded mechanism, not an active upgrade)':'This row is about how the RHDR (Ramen) operator itself got installed, not about the workload. OLM reads bundles from the staging CatalogSource, a Subscription and InstallPlan pick a version, and the ClusterServiceVersion is the installed operator. It matters when testing a new staging build, not during a failover.',
    'Conditional API dependencies (not established workload instances)':'These APIs are installed and could be used for more advanced protection, such as Recipes for ordered capture or replicating several disks as one consistency group. The protected VMs in this lab do not use them today; they are shown so their presence is not mistaken for part of the active recovery path.'
  };
  // Per-chain analogy, what changes when Failover runs, and the consequence if the chain is missing or broken.
  const extra={
    'Policy and DR site eligibility':['the insurance contract: which two sites cover each other, and how often the copy is refreshed.',
      'Nothing in this row changes. The policy and both DR sites stay the same; Failover uses them to confirm that the target is a valid, validated peer.',
      'If a DRCluster fails validation (for example its S3 metadata store is unreachable) or the DRPolicy is not validated, the application cannot reach a protected state and recovery cannot be trusted.'],
    'DR placement and console observation':['the application\u2019s current address.',
      'When you confirm Failover to the peer cluster, Ramen records the action on the DRPC and moves the PlacementDecision from the source cluster to the target (for example spoke-0 to spoke-1, or the reverse). The console view then shows the new site and the progression steps.',
      'Without a Placement and its decision, nothing tells the rest of the system where the application should run'+(managed?', and the ApplicationSet has no destination to deploy to.':'.')],
    'Cross-cluster delivery and status':['a courier envelope with a return receipt.',
      'Ramen updates the delivered VRG instructions: the target spoke\u2019s VRG becomes Primary and the source spoke\u2019s VRG is asked to become Secondary. The views report each step back, which drives the DRPC progression you see in the console.',
      'If a spoke\u2019s ACM agent cannot apply the ManifestWork, that spoke never learns its new role and the DRPC stalls mid-progression.'],
    'Protected disk replication':['a scheduled photocopier that sends each disk to the other site.',
      'The target VolumeReplications are promoted to Primary from the latest replicated copy on the target array. Failover does not wait for a final sync from the source, so anything written after the last sync is the RPO exposure.',
      'If replication is degraded or the last sync is older than the RPO, the promoted disks are stale or promotion fails.'],
    'Storage provisioning: claims, class and driver':['an order form (PVC), a catalog entry (StorageClass) and a supplier (CSI driver).',
      'The target does not create blank disks for the VM. Its claims are bound to the promoted replica volumes, still through the same class and Dell driver.',
      'If the StorageClass or CSI driver is missing or unhealthy on the target, the promoted volumes cannot be bound or attached.'],
    'VM disk provisioning and binding':['following the cable from the VM down to the physical disk.',
      'On the target, the VM\u2019s claims bind to PersistentVolumes that hold the promoted replica handles, and a VolumeAttachment connects them to the target worker so the guest boots from the replicated data.',
      'If the target worker cannot attach the volume (for example an NVMe path or initiator problem), the VM stays pending with mount errors even though promotion succeeded.'],
    'Kubernetes object protection (not block data)':managed?['the VM blueprint, kept separately from its contents.',
      'Not used in this managed scenario: Argo CD recreates the definitions from Git instead of Velero restoring them.',
      'Not applicable here; for discovered apps a missing or incomplete backup leaves recovered disks with no VM definition to start.']:['the VM blueprint, kept separately from its contents.',
      'Velero restores the VM, DataVolume and claim definitions on the target from the S3 archive, and those claims bind to the promoted disks.',
      'If the latest backup did not complete or S3 is unreachable, the disks exist on the target but there is no VM definition to start.'],
    'GitOps workload handoff (configured; acceptance must be demonstrated)':['a delivery order that automatically follows the current address.',
      'The ApplicationSet sees the new PlacementDecision, generates the Application for spoke-1 and removes the one for spoke-0. Spoke-1\u2019s Argo CD creates the VM on the promoted disks; spoke-0\u2019s Argo CD removes the source VM but leaves the namespace, so the source VRG can step down to Secondary.',
      'If the generator cannot read the decision, no Application reaches the target and the source is never cleaned up, so the DRPC stays in Cleaning Up.'],
    'GitOps registration (separate from DR Placement)':['Argo CD\u2019s address book.',
      'Nothing changes; the target must already be registered. The registration Placement tolerates unavailable clusters, so a failed source is not unregistered in the middle of recovery.',
      'If the target spoke is not a registered Argo CD destination, the generated Application has nowhere to go.'],
    'Virtualization installation and execution':['the engine that actually runs the VM.',
      'On the target, KubeVirt starts a new VirtualMachineInstance from the recovered VM definition; on the source, the instance stops.',
      'If virtualization is unhealthy on the target, the disks and definitions are recovered but the guest never boots.'],
    'Operator installation (recorded mechanism, not an active upgrade)':['the installer for the DR software itself.',
      'Not involved in a failover.',
      'A missing or failed operator means the Ramen controllers that drive every other row are not running.'],
    'Conditional API dependencies (not established workload instances)':['optional add-ons that are installed but not switched on.',
      'Not involved today.',
      'Nothing currently depends on them; they matter only if these features are adopted later.']
  };
  const rowOf=t=>lanes.findIndex(([title])=>title===t);
  const laneLink=t=>{const r=rowOf(t);return r<0?'':`<a href="#chain-${r}">${esc(t)}</a>`;};
  const step=(label,titles,sep=true)=>{const links=titles.map(laneLink).filter(Boolean);return links.length?`<div class="chain-step${sep?' sep':''}"><b>${esc(label)}</b>${links.join('')}</div>`:'';};
  const chainMap=`<nav class="chain-map" aria-label="How the chains fit together"><h3>How the chains fit together</h3><p>Read the rows below in this order. A failover starts at the left: the policy says which sites are eligible, the placement picks one, ACM delivers the instructions, and then two things must arrive on the target together, the disk data and the VM definition, before the VM can run. The foundation rows are installed once and used by all of these.</p><div class="chain-flow">
    ${step('1. Which sites may protect it',['Policy and DR site eligibility'])}
    ${step('2. Which site runs it now',['DR placement and console observation'])}
    ${step('3. Instructions to each spoke',['Cross-cluster delivery and status'])}
    ${step('4. Disk data reaches the target',['Protected disk replication'])}
    ${step(managed?'5. VM definition reaches the target (Git)':'5. VM definition reaches the target (backup)',managed?['GitOps workload handoff (configured; acceptance must be demonstrated)']:['Kubernetes object protection (not block data)'])}
    ${step('6. VM runs on the target disks',['VM disk provisioning and binding','Virtualization installation and execution'],false)}
    </div><div class="chain-foundation"><b>Foundation:</b> ${['Storage provisioning: claims, class and driver',...(managed?['GitOps registration (separate from DR Placement)','Kubernetes object protection (not block data)']:[]),'Operator installation (recorded mechanism, not an active upgrade)','Conditional API dependencies (not established workload instances)'].map(laneLink).join('')}</div></nav>`;
  const primer=`<details class="primer" open><summary>Start here: the basic words in plain language</summary><dl>
    <dt>Cluster</dt><dd>A group of servers managed together as one system. This lab has three: one hub and two spokes.</dd>
    <dt>Hub and spokes</dt><dd>The hub is the central cluster that manages the others. The spokes (spoke-0 and spoke-1) are the clusters where the VMs actually run. They are at different sites so one can take over if the other fails.</dd>
    <dt>Kubernetes / OpenShift</dt><dd>Kubernetes is the system that runs workloads on a cluster. OpenShift is Red Hat's version of it.</dd>
    <dt>Resource (object)</dt><dd>A small saved record that describes something you want, such as \u201ca 100 GB disk\u201d or \u201ca VM with 4 processors\u201d. Each card below is one record.</dd>
    <dt>Built-in vs custom resource</dt><dd>Built-in records come with Kubernetes. Custom records are new types added by extra software (for example, the DR software adds DRPolicy).</dd>
    <dt>Controller / operator</dt><dd>A program that keeps reading records and makes the real world match them. Records only describe; controllers do the work.</dd>
    <dt>Namespace</dt><dd>A folder inside a cluster that keeps related records together. Some records are \u201ccluster-scoped\u201d: they are not in any folder and apply to the whole cluster.</dd>
    <dt>VM</dt><dd>A virtual machine: a computer simulated in software. Here the VMs run a database plus a load generator (HammerDB) that keeps writing to it.</dd>
    <dt>Disk request, disk and storage array</dt><dd>The VM asks for disks with a request (PVC). The real disks live on a Dell PowerStore storage array; each spoke has its own array (VSA-A and VSA-B).</dd>
    <dt>Replication</dt><dd>Automatically copying disk changes from one array to the other on a schedule, so the other site has a recent copy.</dd>
    <dt>Disaster recovery (DR) and failover</dt><dd>DR is the plan for restarting an app at the other site if its site fails. Failover is doing it: the copy at the other site becomes the live copy and the VM starts there.</dd>
    <dt>Primary and Secondary</dt><dd>Primary is the copy currently in use. Secondary is the copy that only receives updates.</dd>
    <dt>RPO</dt><dd>Recovery Point Objective: how much recent work you could lose. Copying every 15 minutes means up to about 15 minutes.</dd>
    <dt>ACM, Ramen, Argo CD</dt><dd>ACM manages the spokes from the hub. Ramen is the DR software that coordinates failover. Argo CD deploys apps from definitions kept in Git (a version-controlled file store).</dd>
    <dt>Discovered vs GitOps-managed app</dt><dd>A discovered app was created directly on the cluster; its settings are backed up and restored by a backup tool. A GitOps-managed app is defined in Git, and Argo CD recreates it at the new site.</dd>
  </dl></details>`;
  const legend=`<div class="chain-legend"><div><b>Card stripe and badge</b>The color and badge show the namespace (or cluster-scoped / external). The line above the badge says which cluster the object lives on.</div><div><b>Card type</b><i>Custom resource</i>: defined by an operator CRD (Ramen, ACM, OADP\u2026). <i>Built-in resource</i>: standard Kubernetes. <i>Controller / external service</i>: software or hardware that acts on the resources.</div><div><b>Connection labels</b>A field name such as <code>drPolicyRef</code> or <code>placementRef</code> means one object points to another in its spec. A verb such as <i>delivers</i>, <i>generates</i> or <i>reconciles</i> means a controller acts. <i>Observes</i> or <i>correlates</i> means read-only status reporting.</div><div><b>Repeated cards</b>The same object can join several chains. \u201cAlso in\u201d on a card links to the other rows where it appears.</div></div>`;
  const keyOf=a=>a.kind+'|'+a.name;
  const appearances={};lanes.forEach(([title,nodes])=>nodes.forEach(a=>{(appearances[keyOf(a)]??=new Set()).add(title);}));
  const alsoIn=(a,title)=>{const others=[...appearances[keyOf(a)]].filter(t=>t!==title);return others.length?`<div class="also-in">Also in: ${others.map(laneLink).join(', ')}</div>`:'';};
  const introHtml=title=>{const [analogy,fo,br]=extra[title];return `<p><span class="analogy">Think of it as ${esc(analogy)}</span> ${esc(intros[title])}</p><p class="lane-failover"><b>During failover:</b> ${esc(fo)}</p><p class="lane-breaks"><b>If it is missing or broken:</b> ${esc(br)}</p>`;};
  const section=document.createElement('section');section.id='resource-dependencies';
  const used=[...new Set(lanes.flatMap(([,nodes])=>nodes.flatMap(a=>namespaces(a.scope))))];
  const badges=a=>namespaces(a.scope).map(key=>`<span class="namespace-badge" style="--ns-color:${palette[key]}">${esc(key)}</span>`).join('');
  section.innerHTML=`<h2>CRD dependency diagram and namespaces</h2><p>A CustomResourceDefinition (CRD) itself is always cluster-scoped. The custom resources it defines can be namespaced or cluster-scoped, according to the CRD's <code>spec.scope</code>. These cards show <b>custom-resource instances</b> and their cluster/namespace, plus the built-in resources and services they depend on. Card stripes and badges identify namespace/scope; resource type is labeled separately. Connections describe references, reconciliation or observation, not universal ownership. Open <b>What is this?</b> on any card for an explanation (click, tap or keyboard).</p>
    ${primer}${chainMap}${legend}
    <div class="namespace-legend" aria-label="Namespace color legend">${used.map(key=>`<span class="namespace-badge" style="--ns-color:${palette[key]}">${esc(key)}</span>`).join('')}</div>
    <div class="toolbar"><button id="resource-fit">Fit dependencies</button><button id="resource-reset">100%</button><button id="resource-expand">Expand explanations</button><button id="resource-collapse">Collapse explanations</button><span class="muted">Scroll horizontally at full scale. Each row traces a labeled dependency path.</span></div>
    <div class="wrap" id="resource-wrap"><div class="sizer" id="resource-sizer"><div id="resource-dia"><svg id="resource-svg" aria-hidden="true"></svg>${lanes.map(([title,nodes],row)=>`<div class="resource-lane-title" id="chain-${row}" data-row="${row}"><a href="#chain-${row}">${esc(title)}</a></div><div class="resource-lane-intro" data-row="${row}">${introHtml(title)}</div>${nodes.map((a,col)=>`<article class="resource-node" data-row="${row}" data-col="${col}" data-type="${a.type}" style="--ns-color:${namespaces(a.scope).length===1?palette[namespaces(a.scope)[0]]:palette['mixed scope']}"><small title="${esc(a.scope)}">${esc(clusterLabel(a.scope))}</small><div class="namespace-badges">${badges(a)}</div><small class="resource-type">${a.type==='cr'?'Custom resource':a.type==='builtin'?'Built-in resource':'Controller / external service'}</small><h3>${esc(a.kind)}</h3><b>${esc(a.name)}</b>${alsoIn(a,title)}<details><summary>What is this?<span class="sr-only">: ${esc(a.kind)}</span></summary><p><strong>Why it matters:</strong> ${esc(why[a.kind])}</p><p class="tech-detail"><strong>Technical detail (optional):</strong> ${esc(a.detail)}</p></details></article>`).join('')}`).join('')}</div></div></div>
    <h3>Supporting configuration and conditional custom resources</h3><div class="table-wrap"><table><thead><tr><th>Kind / resource</th><th>Cluster / namespace or scope</th><th>Relationship and applicability</th></tr></thead><tbody>
    <tr><td>DRClusterConfig</td><td>Cluster-scoped: spoke-0 on edge95; spoke-1 on edge97</td><td>Observed cluster controller configuration instances.</td></tr>
    <tr><td>HyperConverged; KubeVirt; CDI</td><td>Each spoke: openshift-cnv/kubevirt-hyperconverged; openshift-cnv/kubevirt-kubevirt-hyperconverged; cluster-scoped cdi-kubevirt-hyperconverged</td><td>Observed virtualization and disk-import configuration instances. CDI is cluster-scoped, not in openshift-cnv.</td></tr>
    <tr><td>DataSource</td><td>RHEL: openshift-virtualization-os-images/rhel9</td><td>Initial RHEL rootdisk sourceRef. Windows discovered uses golden PVC windows-golden-images/windows-server-2022-standard (built-in). Fresh cloning is not recovery.</td></tr>
    <tr><td>StorageClass; CSIDriver</td><td>Spokes / cluster-scoped (built-in)</td><td>Shown as expandable cards in the storage-provisioning row above. PVC storageClassName powerstore-sc selects provisioner csi-powerstore.dellemc.com; the PV holds the actual disk handle. StorageClass provisions storage; VolumeReplicationClass configures replication.</td></tr>
    <tr><td>Recipe; VolumeGroupReplication; VolumeGroupReplicationClass; VolumeGroupSnapshotClass</td><td>Spokes / Recipe and group replication namespaced; classes cluster-scoped</td><td>No Recipe or VolumeGroupSnapshotClass instances observed. Group replication exists only in unrelated spoke-0/test. powerstore-vgrc-5m is initial provider setup, not evidence these workloads use group replication.</td></tr>
    <tr><td>CatalogSource; Subscription; InstallPlan; ClusterServiceVersion</td><td>Catalog: openshift-marketplace; spoke RHDR CSV: openshift-dr-system; hub GitOps/RHDR controllers: openshift-operators</td><td>OLM installation path, distinct from workload recovery. Recorded absence of active RHDR Subscriptions does not remove installed CSV/controller instances.</td></tr>
    <tr><td>ManagedClusterSet / Binding; Klusterlet; MultiClusterHub / MultiClusterEngine</td><td>Hub default/global sets: cluster-scoped; default bindings: openshift-dr-ops and openshift-gitops; spoke Klusterlet: cluster-scoped klusterlet; hub MCH: rhacm/multiclusterhub; MCE: cluster-scoped multiclusterengine</td><td>Observed identities for cluster selection, agent delivery and management installation. MCE operator namespace is multicluster-engine; its CR is cluster-scoped.</td></tr>
    <tr><td>Secret; ConfigMap; Service; Route; Deployment; Pod</td><td>Built-in, namespace of consuming controller or workload</td><td>Ramen S3 profiles/CA and ramen-s3-secret; RHEL cloudinit-hammerdb in VM namespace; managed acm-placement in openshift-gitops and cluster-registration Secrets in openshift-gitops; CSI array configuration and MinIO routing. No credential values shown.</td></tr>
    <tr><td>MirrorPeer; Submariner; DellCSIReplicationGroup</td><td>Not in this active Dell recovery path</td><td>ODF networking/replication and retired Dell CSM configuration must not be confused with csi-addons VolumeReplication.</td></tr>
    </tbody></table></div><p><b>How to trace a failure:</b> DRPC reference/validation, PlacementDecision, ManifestWork delivery, VRG/PVC selection, per-disk replication, target PV/attachment, object restore or GitOps destination reconciliation, then VM/VMI and guest. Follow actual owner references to distinguish ownership from a selector or status view.</p>
    <p>Sources: <a href="https://docs.google.com/document/d/1npumTvaf2SRj2wdEUoBBuYLZXwqXxJNUvY3SNqrLfe0/edit">Setup Doc, installation/transition and Step 11</a> · <a href="https://github.com/elsapassaro/ramendr-starter-kit/tree/ocp-4.22-rhdr-dell/clusters/dell-s4/hub-dr">Verified upstream DRPC / Placement / ApplicationSet</a>. Read live references before treating recorded names as current state.</p>`;
  const anchor=[...document.querySelectorAll('h2')].find(el=>el.textContent==='Pre-failover readiness gates');anchor.before(section);
  const supporting={
    DRClusterConfig:['Spoke-side DR cluster configuration: spoke-0 and spoke-1.','Provides cluster-specific settings used by the Ramen cluster controller; both instances are cluster-scoped.'],
    DataSource:['CDI reference to an image source such as rhel9.','Decouples initial rootdisk population from the underlying image PVC. It is not the failover disk source.'],
    Klusterlet:['ACM agent configuration on an imported spoke.','Enables the agents that receive hub work and report managed-cluster state.'],
    MultiClusterHub:['ACM installation configuration: rhacm/multiclusterhub.','Provides hub management services behind cluster import, selection and observation; not a per-workload failover trigger.'],
    MultiClusterEngine:['MCE installation configuration: cluster-scoped multiclusterengine.','Provides cluster lifecycle/registration infrastructure; operator runs in multicluster-engine.'],
    MirrorPeer:['ODF multicluster storage relationship.','Not needed by this Dell array-native path; shown only to distinguish the ODF architecture.'],
    Submariner:['Cross-cluster networking configuration.','Not part of the current Dell path; array replication does not use an ODF pod-network tunnel.'],
    DellCSIReplicationGroup:['Resource from the retired Dell CSM replication path.','Not needed by the active Ramen/csi-addons VolumeReplication workflow.']
  };
  const support=document.createElement('div');support.className='support-explanations';
  support.innerHTML='<h3>Other custom resources: use and why needed</h3>'+Object.entries(supporting).map(([kind,[use,reason]])=>`<details><summary>${esc(kind)}</summary>${explanation(kind)}<p><strong>Recorded configuration:</strong> ${esc(use)}</p><p><strong>Why needed / applicability:</strong> ${esc(reason)}</p></details>`).join('');
  section.querySelector('.table-wrap').after(support);
  const dia=document.getElementById('resource-dia'),svg=document.getElementById('resource-svg'),sizer=document.getElementById('resource-sizer'),wrap=document.getElementById('resource-wrap');
  dia.querySelectorAll('.resource-node').forEach(card=>card.querySelector('summary').insertAdjacentHTML('afterend',explanation(card.querySelector('h3').textContent,card.querySelector('h3 + b').textContent)));
  const width=2180;let zoom=1,height=0;
  function scale(){dia.style.transform=`scale(${zoom})`;sizer.style.width=width*zoom+'px';sizer.style.height=height*zoom+'px';}
  function draw(){
    let top=20;const edges=[];
    lanes.forEach(([,nodes,links],row)=>{
      dia.querySelector(`.resource-lane-title[data-row="${row}"]`).style.top=top+'px';top+=32;
      const intro=dia.querySelector(`.resource-lane-intro[data-row="${row}"]`);intro.style.top=top+'px';top+=intro.offsetHeight+16;
      const cards=[...dia.querySelectorAll(`.resource-node[data-row="${row}"]`)];
       cards.forEach((el,col)=>{el.style.left=20+col*435+'px';el.style.top=top+'px';});
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
  document.getElementById('resource-expand').onclick=()=>{section.querySelectorAll('details').forEach(el=>{el.open=true;});draw();};
  document.getElementById('resource-collapse').onclick=()=>{section.querySelectorAll('details').forEach(el=>{el.open=false;});draw();};
  window.addEventListener('resize',draw);document.fonts.ready.then(draw);
})();
