'use strict';
(() => {
  const id=document.body.dataset.flow, managed=['292','294'].includes(id), pending=id==='294';
  const ns=({291:'hammerdb',292:'gitops-vms',293:'hammerdb-win',294:'Not configured'})[id];
  const vm=id==='293'?'hammerdb-win':pending?'Not configured':'hammerdb-rhel9';
  const drpc=({291:'hammerdb-drpc',292:'dell-vm-drpc',293:'hammerdb-win-drpc',294:'Not configured'})[id];
  const placement=({291:'hammerdb-placement',292:'dell-vm-placement',293:'hammerdb-win-placement',294:'Not configured'})[id];
  const decision=pending?'Not configured':placement+'-decision-1';
  // Managed ApplicationSet DRPCs live with their Placement in openshift-gitops; their VRG lives in the app namespace.
  const hubNs=managed?'openshift-gitops':'openshift-dr-ops', vrgNs=managed&&!pending?ns:'openshift-dr-ops';
  const bsl=pending?'Not configured':managed?'Not used (no kubeObjectProtection)':`openshift-dr-ops--${drpc}--0----minio-on-hub / openshift-dr-ops--${drpc}--1----minio-on-hub`;
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
    StorageClass:'Connects a disk request to the provisioner and its storage settings; each spoke needs the appropriate local configuration.',
    CSIDriver:'Registers the storage implementation and capabilities Kubernetes uses to work with the Dell driver.',
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
    ClusterRoleBinding:'Grants the spoke Argo CD application controller permission to create the workload resources delivered by the pull model.',
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
  // Explain the job in plain language, then its handoff in this environment.
  const explain={
    ManagedCluster:['The hub’s address-book entry for a cluster it manages. Importing a spoke gives ACM a way to identify it and communicate with its agents.','Ramen uses the same spoke identity, but ACM availability and disaster-recovery readiness are separate checks. A reachable cluster can still have an unhealthy storage replica.'],
    DRCluster:['The disaster-recovery profile for one spoke, kept on the hub. It tells Ramen which site it is coordinating and which storage-metadata profile that site uses.','The two profiles let Ramen validate the recovery sites before moving an application. They do not contain the VM’s disks or replace the ACM cluster registration.'],
    DRPolicy:['A shared recovery agreement: which two sites participate and how often asynchronous replication is scheduled. RPO means the allowed age of recoverable data.','The recorded dr-policy-15m pairs spoke-0 and spoke-1. Each application points to this policy; the selected per-disk replication class must support its schedule.'],
    DRPlacementControl:['The application’s recovery coordinator, often shortened to DRPC. Think of it as the instruction sheet that joins the application, eligible sites and recovery policy.',managed?'For a GitOps-managed application it lives next to its Placement in openshift-gitops and selects disk claims by label; it does not list protected namespaces, because Ramen reserves that field for discovered applications in openshift-dr-ops. Ramen reads it on the hub and asks spoke controllers to protect or recover the workload.':'It references a Placement in openshift-dr-ops, identifies protected namespaces and selects disk claims by labels. Ramen reads this object on the hub and asks spoke controllers to protect or recover that particular workload.'],
    Placement:['A named cluster-selection request. It is the place where controllers agree which cluster should host an application.','For these DR placements, ordinary scheduling is disabled so Ramen can control the recovery decision. The separate registration Placement selects clusters for Argo CD access; it is not the application’s DR destination.'],
    PlacementDecision:['The published answer to a Placement: the selected cluster name. Consumers read this answer to find the intended destination.','In the managed design, an ApplicationSet consumes this decision and creates an Application for that cluster. Merely changing the answer does not prove that Argo CD has acted on it.'],
    ProtectedApplicationView:['A console-facing summary that correlates a protected application with its disaster-recovery information. It helps the UI show the right application and status.','The orchestrator supplies this view on the hub. It observes and presents information; it does not copy disks, start a guest or deploy an application.'],
    ManifestWork:['A delivery envelope sent from the hub to a managed cluster. Its payload contains Kubernetes resource definitions that the spoke’s ACM agent applies.',managed?'Here Ramen creates two pieces of work in each spoke’s hub namespace: one delivers the gitops-vms namespace and one delivers the VolumeReplicationGroup into it. Delivery is distinct from the later storage operation.':'Here Ramen creates work in the hub namespace named for each spoke, and that work delivers the VolumeReplicationGroup to openshift-dr-ops on that spoke. Delivery is distinct from the later storage operation.'],
    VolumeReplicationGroup:['The spoke-side protection plan for one application, commonly called a VRG. It groups the selected disk claims and their recovery metadata under one recovery state.',managed?'For the managed application the VRG lives in gitops-vms beside the disk claims it protects. That is why the namespace must never be deleted by Argo CD during failover: deleting it removes the VRG before it can step down to Secondary.':'The VRG lives in openshift-dr-ops, while its protected disk claims remain in the workload namespace. It coordinates per-disk replication and configured Kubernetes-object protection, and records Primary or Secondary state.'],
    ManagedClusterView:['A remote observation request: it lets a hub controller learn what a resource on a spoke currently looks like. Think of it as a status window, not a delivery envelope.','These views inspect the remote VRG after ManifestWork has delivered it. Ramen can then compare the requested state with the state reported by the spoke.'],
    VolumeReplication:['A replication instruction for one disk, not the whole VM. It refers to the disk’s PVC and asks for a Primary or Secondary role.','The VRG creates this resource for each selected claim. The csi-addons controller passes the requested role and selected class settings to the Dell driver, which operates on the array copy.'],
    VolumeReplicationClass:['A reusable recipe for replicating disks with a particular driver and schedule. It is a custom resource, despite having Class in its name.','The recorded powerstore-vrc-15m supplies Dell replication settings that match the 15-minute DRPolicy. Each spoke’s parameters describe its appropriate remote array direction.'],
    StorageClass:['A menu entry for requesting storage, built into Kubernetes. A claim names this class so Kubernetes knows which driver and provisioning settings to use.','Both workload disks request powerstore-sc. Its provisioner is csi-powerstore.dellemc.com; the Dell CSI driver creates the array disk and Kubernetes binds a PV to the claim. The class is cluster-scoped, so each spoke has its own configuration.'],
    CSIDriver:['Kubernetes’ built-in registration record for a storage driver. CSI stands for Container Storage Interface, the standard contract used to request and attach storage.','The name csi-powerstore.dellemc.com connects Kubernetes storage resources with the installed Dell implementation. The record describes driver capabilities; the actual controller and node pods do the work.'],
    'CSI + csi-addons':['The working controllers behind the storage objects. CSI handles creating, attaching and exposing disks; csi-addons adds the replication control path used here.','The Dell driver translates requests into PowerStore operations. Its node components make the correct array volume available to the worker over NVMe/TCP so the VM launcher can use it.'],
    'Array replica volumes':['The actual copies of disk contents on the second PowerStore array. They contain the operating-system and database blocks needed for recovery.','Asynchronous replication copies changes from the source array to its partner. Recovery promotes the destination copy and reconnects Kubernetes to that copy rather than creating an empty replacement.'],
    VirtualMachine:['The saved definition of a virtual computer: CPU, memory, boot settings, network and disk references. It is configuration, not the running guest itself.','OpenShift Virtualization uses this definition to create a VirtualMachineInstance. Recovery needs both this definition and the correct promoted root/data disks; neither can replace the other.'],
    DataVolume:['A disk-preparation request managed by CDI, the virtualization disk-import controller. It can populate a boot disk from an image or create a blank data disk during initial setup.','The RHEL reference clones the rhel9 DataSource for its root disk and starts with a blank database disk. The discovered Windows setup can clone its local golden-image PVC. These are bootstrap operations, not sources of recovered database data.'],
    PersistentVolumeClaim:['The application’s request for a disk, usually shortened to PVC. It specifies capacity, access requirements and a StorageClass, and gives the VM a namespaced disk name to reference.','The rootdisk and datadisk claims are the objects Ramen selects for protection. A bound claim points to one PV; labels determine protection, so an unrelated or temporary CDI claim is not automatically included.'],
    PersistentVolume:['The cluster-wide record of a disk supplied to a claim, usually shortened to PV. It records capacity, the claim binding and the CSI volume handle for the real array disk.','The claim is the workload-facing name; the PV identifies the backing storage. On recovery the handle must resolve to the promoted destination copy, not the old source-array disk.'],
    VolumeAttachment:['The cluster-wide record of a request to attach a PV to a particular worker. This connects a disk binding with the node where the workload runs.','The CSI attachment controller and node components carry out the request so the launcher pod can access its disks. It tracks attachment, not replication or the guest filesystem.'],
    DataProtectionApplication:['OADP’s configuration for the Velero backup/restore service. It sets up the runtime and plugins used to save Kubernetes objects.','Disk replication preserves bytes, but the target also needs VM definitions and dependencies. Ramen’s configured object-protection path asks Velero to capture and restore those objects.'],
    'Backup / Restore':['A Backup is a request and record of saving Kubernetes objects; a Restore asks Velero to recreate saved objects. These complement storage replication.','The archive must preserve required workload definitions and dependencies. Replicated database disks do not recreate a missing VM definition or its required Secret.'],
    BackupStorageLocation:['Velero’s address-book entry for an object archive destination. It identifies the S3 endpoint, bucket and credential references used by backup/restore jobs.','The per-application locations connect object protection to the hub MinIO service. They are configuration references, not the archive contents themselves.'],
    'MinIO / S3':['The object-storage service on the hub. S3 is its access protocol; it stores Ramen recovery metadata and Kubernetes-object archives separately from array disk copies.','This is the configuration and metadata recovery path. The database’s disk writes are copied by PowerStore replication, not by uploading every transaction to MinIO.'],
    ApplicationSet:['A template-driven factory for Argo CD Applications. In the intended managed flow it reads a cluster decision and generates the deployment instruction for that destination.','The RHEL reference is a pull-model ApplicationSet in openshift-gitops. The acm-placement ConfigMap tells it how to read the DR PlacementDecision, and it generates dell-vm-workload-spoke-0 or spoke-1. It must sit in the Argo CD namespace because the generator only reads decisions there.'],
    Application:['Argo CD’s deployment instruction: which Git repository, revision and folder to apply, and which cluster/namespace should receive them.','A generated Application is the handoff from placement to deployment. The authoritative Dell source is elsapassaro/ramendr-starter-kit, branch ocp-4.22-rhdr-dell; the RHEL workload folder is clusters/dell-s4/workloads.'],
    'ManagedClusterSet / Binding':['A cluster set groups managed clusters; its binding makes that group available to a Placement in a namespace. Import and selection permission are different concerns.','The default bindings expose cluster selection in openshift-dr-ops for discovered applications and in openshift-gitops for the managed application and Argo CD registration. Registration and DR placements still have different jobs.'],
    GitOpsCluster:['The ACM-to-Argo CD registration bridge. It makes selected managed clusters available as Argo CD deployment destinations.','argo-acm-clusters uses the registration Placement all-openshift-clusters. This supplies destination registrations; the separate DR Placement decides where the protected workload should run.'],
    ClusterRoleBinding:['A built-in grant that gives an identity a set of permissions across the whole cluster.','In the pull model each spoke runs its own Argo CD, which applies the workload locally. The gitops-admin binding gives that spoke controller the permissions to create the VM, disks and Service; without it, generated Applications cannot sync.'],
    ArgoCD:['The configuration of the running GitOps service. Its controllers compare desired Git definitions with tracked cluster resources and reconcile differences.','The openshift-gitops instance must have permission, namespace watch scope and destination registration for this managed path. Applications and ApplicationSets are instructions to those controllers, not substitutes for them.'],
    HyperConverged:['The main installation configuration for OpenShift Virtualization. Its operator coordinates the components needed to run guests and prepare their disks.','kubevirt-hyperconverged configures virtualization on each spoke. It supplies infrastructure for all the VM scenarios, not a per-application failover instruction.'],
    'KubeVirt / CDI':['The controllers underneath OpenShift Virtualization. KubeVirt runs virtual machines; CDI prepares and imports their disk contents.','The HyperConverged operator configures these components. KubeVirt is observed in openshift-cnv; the CDI configuration instance is cluster-scoped. Their scope must not be confused with the workload’s namespace.'],
    VirtualMachineInstance:['The actual execution of a VM, usually called a VMI. It records guest runtime state and the worker running the launcher pod.','The VM definition starts this instance. During recovery inspect the target VMI and its disks, then check services inside the guest to establish that the recovered database is usable.'],
    CatalogSource:['An operator-bundle catalog used by OLM, the Operator Lifecycle Manager. It makes installable operator versions discoverable.','The staging catalog provides RHDR bundles. Changing its image changes what is offered; it does not by itself install or upgrade the controllers already running.'],
    Subscription:['An OLM request to follow an operator package and channel. It controls how a catalog’s offered bundles are selected for installation.','OLM resolves this request through an InstallPlan. The recorded snapshot did not establish an active RHDR Subscription even though installed CSVs/controllers existed.'],
    InstallPlan:['OLM’s resolved installation task list for an operator bundle and dependencies. It belongs to operator installation, not guest recovery.','A Subscription can lead to this plan, then installed APIs and a ClusterServiceVersion. Approval and completion states explain whether an offered update actually proceeded.'],
    ClusterServiceVersion:['The installed operator bundle description, commonly called a CSV. It describes the bundle’s APIs and controller deployment.','The recorded spoke RHDR CSV is distinct from hub operators and from a catalog image. The deployment/pod is the executing controller; the CSV is its installation record.'],
    Recipe:['An optional custom workflow definition for Kubernetes-object capture and restore. It can describe which resources and steps belong in protection.','The Recipe API was an installation dependency here, but no application-specific Recipe instance was established in the recorded inventory. Ordinary object-protection evidence should not be replaced with an invented Recipe.'],
    VolumeGroupReplication:['An optional request to coordinate replication at a group level. It is a different API from the per-PVC VolumeReplication path shown above.','Two disks in one VM do not prove group replication is in use. The recorded group instance belongs to an unrelated busybox test, not these protected workloads.'],
    VolumeGroupReplicationClass:['Settings for the optional group-replication API. Like VolumeReplicationClass, it is a custom resource with cluster-wide scope.','powerstore-vgrc-5m belongs to the initial group-provider configuration. It is not the selected 15-minute per-disk policy used in these scenario references.'],
    VolumeGroupSnapshotClass:['Settings for a driver capable of snapshots across a volume group. A snapshot is a point-in-time copy, distinct from the ongoing cross-array replication path.','The recorded inventory had the API definition but no class instances. This is a conditional capability, not evidence that these VMs use group snapshots.'],
    DRClusterConfig:['The spoke controller’s cluster-specific configuration object. It gives that controller settings for its own DR site.','This complements the hub DRCluster: one configures the local controller, while the other represents the site to hub orchestration. The recorded instances are cluster-scoped.'],
    DataSource:['A named pointer to an image that CDI can use for initial disk population. It separates the boot-image reference from a changing underlying image PVC.','The RHEL rootdisk references rhel9 in openshift-virtualization-os-images. A new clone starts from that image, not from the protected VM’s most recent operating-system disk.'],
    Klusterlet:['The ACM agent configuration on an imported spoke. Its agents connect that cluster with the hub.','Those agents receive ManifestWork and report managed-cluster state. They are the delivery infrastructure under the DR controller chain, not a disk-replication implementation.'],
    MultiClusterHub:['The ACM installation configuration on the hub. It provides the management services behind cluster import, application views and multi-cluster coordination.','The recorded instance is rhacm/multiclusterhub. It enables the platform used by DR workflows but does not select a particular application’s failover target.'],
    MultiClusterEngine:['The cluster-lifecycle and registration infrastructure used with ACM. Its configuration object is cluster-scoped.','The operator runs in multicluster-engine. The object’s scope and the operator’s namespace are different concepts; neither is the namespace of a protected VM.'],
    MirrorPeer:['An ODF multi-cluster storage relationship used in a different recovery architecture. It is not the PowerStore array pairing in this lab.','This Dell path uses array-native replication controlled through csi-addons VolumeReplication. Copying an ODF MirrorPeer requirement into this flow would describe the wrong storage implementation.'],
    Submariner:['A cross-cluster networking system used to connect cluster networks in architectures that require it. It does not mean all DR paths require a pod-network tunnel.','The recorded Dell disks replicate between arrays; this active path does not use the ODF/Submariner networking branch. Metadata and management traffic still need their configured connectivity.'],
    DellCSIReplicationGroup:['A resource from the older Dell CSM replication integration. It belongs to a different control API than the active csi-addons implementation.','The current path uses VRG and per-disk VolumeReplication. This historical resource is shown to prevent confusion, not as an additional required controller step.']
  };
  const explanation=kind=>explain[kind].map((text,i)=>`<p><strong>${['In simple terms:','How it fits here:'][i]}</strong> ${esc(pending&&i===1?'Shared infrastructure / reference behavior only; this Windows managed workload is not configured. '+text:text)}</p>`).join('');
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
  const hub=`Hub / ${hubNs}`, spoke=pending?'Spokes / not configured':`Active spoke (follows DR placement) / ${ns}`;
  const d=n('DRPlacementControl',drpc,hub,managed?'References DRPolicy, Placement and PVC selector drprotection=true; no protectedNamespaces for a managed app.':'References DRPolicy, Placement, protectedNamespaces and PVC selector.');
  const v=n('VolumeReplicationGroup',drpc,`Each spoke / ${vrgNs}`,pending?'Windows managed VRG is not configured.':managed?'Configured in Git: VRG name matches DRPC and lives in gitops-vms with the protected PVCs. The namespace must not be Argo CD-owned.':'Live inventory: VRG name matches DRPC, in openshift-dr-ops on both spokes. Protected PVCs remain in the workload namespace.');
  const m=n('VirtualMachine',vm,spoke,'VM configuration references root/data disks; starts a VirtualMachineInstance and launcher Pod.');
  const lanes=[
    ['Policy and DR site eligibility',[
      n('ManagedCluster','spoke-0 / spoke-1','Hub / cluster-scoped','ACM import/availability is distinct from DR validation.'),
      n('DRCluster','spoke-0 / spoke-1','Hub / cluster-scoped','Ramen site identity, validation and S3 profile.'),
      n('DRPolicy','dr-policy-15m','Hub / cluster-scoped','Pairs DRClusters; recorded schedule 15m.'),d
    ],['same site identity','drClusters[]','drPolicyRef']],
    ['DR placement and console observation',[
      d,n('Placement',placement,hub,'DRPC placementRef; DR controls the decision instead of ordinary scheduling.'),
      n('PlacementDecision',decision,hub,'Observed controller-generated instance; status.decisions selects the active spoke. Names are a snapshot, not a universal naming guarantee.'),
      n('ProtectedApplicationView',drpc,hub,pending?'Windows managed view is not configured.':managed?'Per-DRPC view in openshift-gitops, type ApplicationSet (observed for the earlier managed run). Observation, not deployment.':'Live hub inventory verifies this per-DRPC view in openshift-dr-ops. Orchestrator correlates DRPC/application state for the UI. Observation, not deployment.')
    ],['placementRef','decision status','UI correlates decision + DRPC']],
    ['Cross-cluster delivery and status',[
      d,n('ManifestWork',pending?'Not configured':managed?`${drpc}-${vrgNs}-vrg-mw / ${drpc}-${vrgNs}-ns-mw`:drpc+'-openshift-dr-ops-vrg-mw','Hub / spoke-0 + spoke-1',managed?'One VRG work and one namespace work per hub spoke namespace (pattern observed for the earlier managed run). ACM agent delivers them to gitops-vms on that spoke.':'One observed instance in each hub spoke namespace. ACM agent delivers the VRG to openshift-dr-ops on that spoke.'),v,
      n('ManagedClusterView',pending?'Not configured':`${drpc}-${vrgNs}-vrg-mcv`,'Hub / spoke-0 + spoke-1','One observed instance in each hub spoke namespace. Observes remote VRG status; does not own the VRG.')
    ],['Ramen reconciles','delivers VRG','observes status']],
    ['Protected disk replication',[
      v,n('VolumeReplication','One per selected PVC',spoke,'dataSource references PVC; desired role drives Dell replication.'),
      n('VolumeReplicationClass','powerstore-vrc-15m','Spokes / cluster-scoped','Matched by CSI provisioner and schedule; mirrored A-to-B / B-to-A parameters.'),
      n('CSI + csi-addons','Dell controllers','Spokes / powerstore + csi-addons-system','Translate replication requests into PowerStore API operations.','external'),
      n('Array replica volumes','VSA-A / VSA-B','External / no namespace','Array-native block replication, separate from S3 and Git.','external')
    ],['creates for PVC','class reference','controller interprets','array API']],
    ['Storage provisioning: claims, class and driver',[
      n('PersistentVolumeClaim',pending?'Not configured':`${vm}-rootdisk / ${vm}-datadisk`,spoke,pending?'Windows managed claims and their storage choice are not configured. The RHEL reference uses powerstore-sc; that does not establish Windows managed definitions.':'Both disks request storageClassName: powerstore-sc; the RHEL upstream DataVolume definitions verify that provisioning choice.','builtin'),
      n('StorageClass','powerstore-sc','Spokes / cluster-scoped','Recorded workload provisioning class; distinct from powerstore-vrc-15m replication settings.','builtin'),
      n('CSIDriver','csi-powerstore.dellemc.com','Spokes / cluster-scoped','Kubernetes driver registration for Dell PowerStore storage.','builtin'),
      n('CSI + csi-addons','Dell controllers','Spokes / powerstore + csi-addons-system','Controller/node implementation behind provisioning, attachment and replication.','external')
    ],['storageClassName','provisioner identity','driver implementation']],
    ['VM disk provisioning and binding',[
      m,n('DataVolume',pending?'Not configured':`${vm}-rootdisk / ${vm}-datadisk`,spoke,'CDI provisions initial disks and owns corresponding PVCs. Recovery must reuse promoted disks.'),
      n('PersistentVolumeClaim',pending?'Not configured':`${vm}-rootdisk / ${vm}-datadisk`,spoke,'VRG selects protected disks; excludes unlabeled CDI temporary claims.','builtin'),
      n('PersistentVolume','Dynamic / restored name','Spokes / cluster-scoped','PVC binding; CSI volume handle identifies the actual array disk.','builtin'),
      n('VolumeAttachment','Generated attachment','Spokes / cluster-scoped','References PV + worker; CSI publishes disk to the VM launcher.','builtin')
    ],['references disk','owns initial PVC','volumeName binding','PV + worker']],
    ['Kubernetes object protection (not block data)',[
      v,n('DataProtectionApplication','velero','Spokes / openshift-adp','Observed on both spokes. Runs Velero/plugins; Ramen requests capture/restore via kubeObjectProtection.'),
      n('Backup / Restore','No current CR instances','Spokes / openshift-adp','Read-only inventory returned no Backup or Restore CRs. Run-generated names are transient; absence of a CR does not establish absence of a stored S3 archive.'),
      n('BackupStorageLocation',bsl,'Spokes / openshift-adp',pending?'Windows managed location is not configured.':managed?'The managed DRPC does not enable kubeObjectProtection: Git and Argo CD recreate the workload objects, so no per-application location is created.':'Observed locations for slots 0 and 1, present on both spokes. S3 endpoint/credential references, not proof of archive completion.'),
      n('MinIO / S3','ramen-metadata','Hub / minio','Metadata and object archives; not VM disk writes.','external')
    ],['requests via Velero','executes backup / restore','storageLocation','S3 archive']]
  ];
  if(managed) lanes.push(
    ['GitOps workload handoff (configured; acceptance must be demonstrated)',[
      n('PlacementDecision',decision,hub,'Selects a registered destination cluster.'),
      n('ApplicationSet',pending?'Not configured':'dell-vm-workload',hub,'Pull-model ApplicationSet in openshift-gitops (commit e6237ef). Generator reads acm-placement and the dell-vm-placement decision in the same namespace.'),
      n('Application',pending?'Not configured':'dell-vm-workload-{{name}} (generated)',hub,'Generated per selected spoke and pulled to that spoke’s Argo CD. Source: upstream ocp-4.22-rhdr-dell, clusters/dell-s4/workloads, which has no Namespace manifest. Not yet redeployed from the corrected repo.'),m
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
    'DR placement and console observation':'This row decides which spoke the workload should run on right now. The DRPC points to a Placement, and during failover or relocate Ramen (not the normal ACM scheduler) writes the chosen spoke into the PlacementDecision. The ProtectedApplicationView only gathers that decision and the DRPC status so the Data Services console can show it; it reports state and never moves anything.',
    'Cross-cluster delivery and status':'The hub cannot create objects directly on a spoke, so it uses ACM as a courier. Ramen packs the per-application protection plan (the VRG) into a ManifestWork, the ACM agent on each spoke unpacks and applies it, and a ManagedClusterView carries the VRG\u2019s status back to the hub. This is how a click in the hub console turns into Primary or Secondary instructions on each spoke.',
    'Protected disk replication':'This is the path that actually copies the VM\u2019s disk blocks between sites. On each spoke the VRG creates one VolumeReplication per protected disk, the VolumeReplicationClass says which Dell driver and schedule to use, and the Dell CSI/csi-addons controllers ask the PowerStore arrays to replicate VSA-A to VSA-B (or the reverse). During failover the same objects flip the target copy to Primary so it can be used.',
    'Storage provisioning: claims, class and driver':(pending?'The Windows managed disk claims are not configured yet; the powerstore-sc example comes from the RHEL reference. ':'')+'This row explains how a disk request becomes a real PowerStore volume. The PVC asks for storage by naming the powerstore-sc StorageClass, the StorageClass names the Dell CSI driver, and the driver creates the volume on the local array. It is plain Kubernetes storage and is separate from replication, which is configured by the VolumeReplicationClass in the row above.',
    'VM disk provisioning and binding':'This row follows the VM down to the physical disk it boots from. The VirtualMachine refers to its root and data disks, CDI DataVolumes create and fill the matching PVCs, each PVC is bound to a PersistentVolume holding the array volume handle, and a VolumeAttachment connects that volume to the worker running the VM. After failover the same chain must point at the promoted replica disks, not freshly created ones.',
    'Kubernetes object protection (not block data)':pending?'Disk replication copies data, but not the Kubernetes definitions that say how to run the VM. Discovered apps back those definitions up through OADP/Velero to MinIO S3; the RHEL managed reference relies on Git and Argo CD instead. Whether the Windows managed app needs object protection is not decided yet, because its DR resources are not configured.':managed?'Disk replication copies data, but not the Kubernetes definitions that say how to run the VM. For discovered apps Ramen backs those definitions up through OADP/Velero to MinIO S3. In this managed scenario Git and Argo CD recreate the definitions instead, so this path is shown for comparison and no per-application backup location is used.':'Disk replication copies data, but not the Kubernetes definitions that say how to run the VM (its CPU, memory, boot settings and disk references). The VRG asks OADP/Velero to back those definitions up to MinIO S3 on a schedule, and on the target site Velero restores them so the VM can be recreated on top of the promoted disks.',
    'GitOps workload handoff (configured; acceptance must be demonstrated)':pending?'Intended path for a GitOps-managed app: the DR decision tells an ApplicationSet which spoke to deploy to, and Argo CD on that spoke creates the VM. The Windows managed objects for this path are not configured yet, so the names here are placeholders and not an observed deployment.':'For a GitOps-managed app, Git is where the VM definition lives. When the DR decision moves to another spoke, the ApplicationSet reads it, generates an Argo CD Application for the new spoke, and that spoke\u2019s Argo CD creates the VM there while the source copy is removed. This replaces the Velero restore used by discovered apps.',
    'GitOps registration (separate from DR Placement)':'Before Argo CD can deploy anywhere, the spokes must be registered as Argo CD destinations. A separate registration Placement selects all OpenShift clusters, the GitOpsCluster turns that selection into Argo CD cluster entries, and each spoke runs its own Argo CD with permission to create the workload. This is set up once and is different from the DR Placement that picks the active site.',
    'Virtualization installation and execution':'This row shows what makes a VM actually run on a spoke. The HyperConverged object installs OpenShift Virtualization, which brings the KubeVirt (runs VMs) and CDI (prepares disks) controllers. They turn the VirtualMachine definition into a running VirtualMachineInstance on a worker.',
    'Operator installation (recorded mechanism, not an active upgrade)':'This row is about how the RHDR (Ramen) operator itself got installed, not about the workload. OLM reads bundles from the staging CatalogSource, a Subscription and InstallPlan pick a version, and the ClusterServiceVersion is the installed operator. It matters when testing a new staging build, not during a failover.',
    'Conditional API dependencies (not established workload instances)':'These APIs are installed and could be used for more advanced protection, such as Recipes for ordered capture or replicating several disks as one consistency group. The protected VMs in this lab do not use them today; they are shown so their presence is not mistaken for part of the active recovery path.'
  };
  const section=document.createElement('section');section.id='resource-dependencies';
  const used=[...new Set(lanes.flatMap(([,nodes])=>nodes.flatMap(a=>namespaces(a.scope))))];
  const badges=a=>namespaces(a.scope).map(key=>`<span class="namespace-badge" style="--ns-color:${palette[key]}">${esc(key)}</span>`).join('');
  section.innerHTML=`<h2>CRD dependency diagram and namespaces</h2><p>A CustomResourceDefinition (CRD) itself is always cluster-scoped. The custom resources it defines can be namespaced or cluster-scoped, according to the CRD's <code>spec.scope</code>. These cards show <b>custom-resource instances</b> and their cluster/namespace, plus the built-in resources and services they depend on. Card stripes and badges identify namespace/scope; resource type is labeled separately. Connections describe references, reconciliation or observation, not universal ownership. Open <b>Use and why needed</b> on any card for an explanation (click, tap or keyboard).</p>
    <div class="notice"><b>Resource identity snapshot: 2026-10-04, read-only inventory of hub edge36 and spokes edge95/edge97.</b> Concrete names/scopes below were observed; recovery connections remain intended handoffs, not a completed test or continuous monitoring. Repeated cards represent the same object. The spoke running each VM changes with DR operations and is not shown; check the live PlacementDecision. ${pending?'Windows managed workload resources are not configured; shared infrastructure is verified, but it is not an observed Windows managed deployment.':managed?`Protected namespace: <b>${ns}</b>. Configured in Git: hub DRPC <b>openshift-gitops/${drpc}</b>; spoke VRGs in <b>${ns}</b>. The live managed app (dell-vm-workload-placement-drpc, from a temporary fork) is stuck in FailedOver/Cleaning Up as of 2026-10-06 and has not been redeployed from the corrected repository.`:`Protected namespace: <b>${ns}</b>. Hub DRPC/PAV and both spoke VRGs: <b>openshift-dr-ops/${drpc}</b>.`} ${managed?'':'GitOps workload reconciliation is N/A here; ArgoCD APIs remain an orchestrator installation prerequisite.'}</div>
    <div class="namespace-legend" aria-label="Namespace color legend">${used.map(key=>`<span class="namespace-badge" style="--ns-color:${palette[key]}">${esc(key)}</span>`).join('')}</div>
    <div class="toolbar"><button id="resource-fit">Fit dependencies</button><button id="resource-reset">100%</button><button id="resource-expand">Expand explanations</button><button id="resource-collapse">Collapse explanations</button><span class="muted">Scroll horizontally at full scale. Each row traces a labeled dependency path.</span></div>
    <div class="wrap" id="resource-wrap"><div class="sizer" id="resource-sizer"><div id="resource-dia"><svg id="resource-svg" aria-hidden="true"></svg>${lanes.map(([title,nodes],row)=>`<div class="resource-lane-title" data-row="${row}">${esc(title)}</div><p class="resource-lane-intro" data-row="${row}">${esc(intros[title])}</p>${nodes.map((a,col)=>`<article class="resource-node" data-row="${row}" data-col="${col}" data-type="${a.type}" style="--ns-color:${namespaces(a.scope).length===1?palette[namespaces(a.scope)[0]]:palette['mixed scope']}"><small title="${esc(a.scope)}">${esc(clusterLabel(a.scope))}</small><div class="namespace-badges">${badges(a)}</div><small class="resource-type">${a.type==='cr'?'Custom resource':a.type==='builtin'?'Built-in resource':'Controller / external service'}</small><h3>${esc(a.kind)}</h3><b>${esc(a.name)}</b><details><summary>Use and why needed<span class="sr-only">: ${esc(a.kind)}</span></summary><p><strong>Used for:</strong> ${esc(a.detail)}</p><p><strong>Why needed:</strong> ${esc(why[a.kind])}</p></details></article>`).join('')}`).join('')}</div></div></div>
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
  dia.querySelectorAll('.resource-node').forEach(card=>card.querySelector('summary').insertAdjacentHTML('afterend',explanation(card.querySelector('h3').textContent)));
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
