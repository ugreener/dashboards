'use strict';
// Authored narration. Dashboard facts are explained, never serialized from DOM text.
window.buildDellPodcast = (id, view) => {
  const scenarios = {
    '291': {name:'the discovered RHEL application',guest:'RHEL nine',database:'PostgreSQL sixteen',hammer:'four point twelve',namespace:'hammerdb',vm:'hammerdb-rhel9',drpc:'hammerdb-drpc',placement:'hammerdb-placement',managed:false,windows:false},
    '292': {name:'the GitOps-managed RHEL application',guest:'RHEL nine',database:'PostgreSQL sixteen',hammer:'five point zero',namespace:'gitops-vms',vm:'hammerdb-rhel9',drpc:'dell-vm-drpc',placement:'dell-vm-placement',managed:true,windows:false},
    '293': {name:'the discovered Windows application',guest:'Windows Server twenty twenty-two',database:'SQL Server twenty twenty-two Express',hammer:'five point zero',namespace:'hammerdb-win',vm:'hammerdb-win',drpc:'hammerdb-win-drpc',placement:'hammerdb-win-placement',managed:false,windows:true},
    '294': {name:'the proposed GitOps-managed Windows application',guest:'Windows Server twenty twenty-two',database:'SQL Server twenty twenty-two Express',hammer:'five point zero',managed:true,windows:true}
  };
  const c = scenarios[id], pending = id === '294';
  const chapter = (title, text) => ({title, text: text.trim()});
  const guest = c.windows ? `Inside Windows, two independent things must happen. SQL Server Express must start and make the T P C C database available. The scheduled task called RamenDR-HammerDB must then generate transactions against that database.

That distinction matters because a running task is not proof that the database is ready. The recorded recovery behavior allows SQL Server to come up a minute or two later than the task. We inspect the actual service and task states, then confirm that queries succeed and transactions advance.

Windows also brings its own boot configuration. The discovered VM uses E F I and Hyper-V enlightenments, rather than Linux cloud initialization. A recovery must preserve those settings and the actual namespace-local dependencies, not substitute the RHEL configuration.

For the discovered Windows deployment, a golden image is cached in the windows-golden-images namespace. Its PVC is called windows-server-2022-standard. That local clone makes initial deployment easier, but it is not the source of recovered data: during failover, both disks must come from the promoted replicas.` : `Inside RHEL, PostgreSQL and HammerDB have different jobs. The PostgreSQL service owns the database. The RamenDR HammerDB service supplies the load, repeatedly exercising the T P C C transaction workload.

That workload keeps data changing while replication is asynchronous. It gives us a meaningful recovery test, because a target that merely boots from an old disk is not enough. We need to understand which writes survived and when writes resumed.

The database lives on the separate data disk under the mounted RamenDR data directory. The root disk carries the guest operating system. Recovering only one of those disks could leave us with either data that cannot boot or a booted machine without the intended database.

Initial RHEL provisioning can reference the rhel9 DataSource in the OpenShift virtualization image namespace. The cloudinit-hammerdb Secret supplies guest initialization in the workload namespace. Neither a fresh image clone nor an absent initialization dependency should be mistaken for a successful recovery of the protected VM.`;
  const identity = pending ? `For this episode, the unresolved setup is part of the story. The reviewed sources do not establish a Windows managed namespace, VM definition, disk names, disaster recovery placement control, Placement, ApplicationSet, or remote desktop access service.

We know the intended operating system and database. We also know the shared hub, spokes and storage. But knowing the infrastructure does not establish a Windows managed application. The RHEL manifests in the Dell workload directory are a reference for the integration, not Windows definitions.` : `The application has a concrete identity. Its VM is ${c.vm}, and its protected namespace is ${c.namespace}. Its disaster recovery placement control is ${c.drpc}, paired with the Placement called ${c.placement}.

Those names are useful because recovery crosses several controllers. When we follow a delivery object or a remote status view, we need to establish that it belongs to this application, not another VM or another test. The root and data disk objects are named after the VM, with rootdisk and datadisk endings.`;
  const boundary = `One boundary belongs at the beginning of this conversation. The diagrams contain a resource inventory recorded on October fourth, twenty twenty-six, and task-status references from October first. They are not a live monitoring system.

In that inventory, all three configured VM workloads were on spoke zero. Their PlacementDecisions also selected spoke zero. Earlier recovery records describe RHEL running on spoke one, so a historical success must not be confused with current placement.

There is a subtle example in the discovered controls. The snapshot recorded a completed failed-over phase, a preferred-cluster field naming spoke one, and a failover-cluster field naming spoke zero. Yet the current PlacementDecision and running VM were on spoke zero.

Those fields are describing different parts of the recovery history, not four independent location instructions. To find where to inspect the workload, follow the current decision and the actual running VM instance, not one historical field in isolation.`;
  const runner = `There is a separate bootstrap problem to distinguish from that Argo CD generator error. The shared guest-installation helper recognizes cluster names called O C P primary and O C P secondary. The Dell decisions name spoke zero and spoke one, so that helper rejects the selected cluster before it can resolve the spoke kubeconfig.

Changing the directory holding the kubeconfig does not fix an unsupported cluster name. The setup records an earlier host-only workaround, but repeatable bootstrap needs reviewed support in the shared script repository and the actual tested revision recorded. Keep environment paths and credentials external rather than relying on undocumented symlinks.

The installer also initializes the guest data disk. Do not rerun installation on a recovered application to prove that failover worked. That could replace the very database we are trying to validate; installation and recovery validation are different operations.`;
  const history = `Before we close, let us put the troubleshooting history in its proper place. Earlier work encountered problems resolving a source-array volume handle, a discovered-app cleanup stall, and promoted-volume device discovery. The dashboard references these through the two seventy-four, two eighty-seven and two ninety Jira issues; the recorded references mark them closed.

That does not mean every old workaround belongs in a new run. The cleanup stall was later understood as the discovered workflow waiting for source removal. The device-discovery issue was classified as infrastructure-related. Those distinctions change what we investigate and prevent us from attributing every storage symptom to Ramen.

The parent task also tracks UI discrepancies: stale recovery timestamps, a disappearing Overview tab, missing topology clusters, unreadable popover text, broken word wrapping, an invalid help link, a completion title inconsistent with its step count, and an empty cluster list in policy creation. Treat these as reasons to check the current UI carefully, not as a declaration that all defects reproduce today.

The historical Dell investigation notes include early appliance experiments and tentative transport descriptions. The later setup uses NVMe over T C P for this block-storage path. If an incident appears, reconcile the actual array state, replication session, worker controller identity and CSI logs before blaming the recovery operator.`;
  const protection = c.managed ? `For a managed application, the central question is whether GitOps actually follows the recovery decision. GitOps means that a controller continually reconciles a declared application from Git. A green synchronization result by itself only tells us about the destination that controller was already given.

The intended chain starts with a PlacementDecision. An ApplicationSet uses that decision to generate an Argo CD Application for the selected cluster. Argo CD then applies the workload definitions to that destination. When recovery changes the selected site, the managed acceptance test requires the whole handoff to change with it.

For the RHEL reference, the ApplicationSet is called dell-vm-workload, and it lives in the OpenShift GitOps namespace together with the D R Placement, dell-vm-placement, and the D R placement control, dell-vm-drpc. They share that namespace for two reasons. The Argo CD generator only reads placement decisions from its own namespace, and Ramen insists that a placement control and its Placement sit side by side. The generator uses the acm-placement ConfigMap to read the decision, and it creates an Application named after the selected cluster. This is a pull-model ApplicationSet, so that Application is handed to the Argo CD instance running on the chosen spoke, which applies the workload locally.

Its source is Elsa Passaro's ramendr-starter-kit repository, on the ocp-4.22-rhdr-dell branch. The relevant definitions are in the Dell s four directories for GitOps registration, hub D R resources, spoke permissions and workloads. That is the authoritative source, not a personal fork. The manifest requests automated pruning and self-healing, which express reconciliation intent; they do not demonstrate that a destination switch succeeded.

The history explains why this layout matters. A first attempt kept these objects in the D R operations namespace, and the ApplicationSet could not find any decision, because Argo CD was looking in its own namespace. That was a placement mistake rather than a true conflict: the D R operations namespace is meant for discovered applications. A later run moved everything into the GitOps namespace, and the ApplicationSet then generated Applications and followed the failover decision to spoke one.

That run still stalled, and the reason is a lesson worth keeping. Its workload folder included a Namespace definition, so Argo CD owned the gitops-vms namespace. When the decision moved, Argo CD deleted the source Application and, with it, the whole namespace. The source VRG lived in that namespace, so it was deleted before it could step down to Secondary. Ramen removed its own finalizer but left a protection finalizer on the source data disk claim, and the namespace has been stuck terminating ever since, with the placement control waiting in Cleaning Up. The repository now leaves the Namespace definition out: Argo CD creates the namespace when needed but never deletes it. A fresh deployment from the corrected repository is still needed before the acceptance test.

Two more configuration details matter. The managed placement control selects disks by the drprotection label, which both the root and database disks carry; an earlier selector based on the app label missed the root disk, because the disk importer overwrites that label. And it does not enable Kubernetes object protection: the workload objects come back from Git through Argo CD, so the recovery evidence to look for is disk protection and generated Application delivery rather than a Velero archive.

Finally, target credentials need a real provisioning path. For RHEL, the cloud initialization Secret must be available in the target workload namespace. For a Windows managed workload, the initialization and credential mechanism must be defined independently. Never assume the Linux Secret solves Windows setup.` : `A discovered application is a workload that already exists independently of GitOps deployment. Ramen protects it, but a Git controller is not responsible for moving its definitions to another cluster.

That creates a second recovery problem beyond disk replication. The target needs to know what machine to start: its CPU and memory configuration, boot settings, disk references, DataVolumes and required namespace-local dependencies. Those definitions are protected as Kubernetes objects.

OpenShift API for Data Protection, usually called O A D P, supplies the Velero backup and restore engine. In this lab, its DataProtectionApplication is named velero in the OpenShift A D P namespace on each spoke. That configuration sets up the engine and its plugins; it is not itself a completed application archive.

Ramen coordinates the capture of required objects and stores the recovery paperwork in the hub's MinIO object store. This is separate from the array holding the guest disk blocks. A correct disk replica cannot recreate a VM definition that was never captured, and a perfect object archive cannot replace lost database blocks.

Before a test, look for protection on the disaster recovery placement control, Kubernetes object readiness and cluster-data protection on the source volume group, a ready data-protection runtime, and an available backup storage location. Then establish terminal backup success or a verified archive read-back that contains the required VM and dependencies.

Why go beyond checking whether the engine is ready? Because a healthy engine can still fail a particular backup. And an empty list of Backup or Restore objects does not prove the stored archive is absent: the transient Kubernetes record and the archived data are different things.

For Windows, preserve its actual E F I and Hyper-V boot settings and its separate initialization dependencies. Do not substitute the Linux cloud-init approach. ${c.windows ? 'The setup document records Windows deployment and protection. A closed task is not, by itself, evidence of a completed Windows failover.' : 'The setup records RHEL recovery and resumed writes, but count growth alone does not establish an exact data-loss result.'}`;
  const replica = `Now imagine the source database acknowledges a transaction a few seconds before the latest replica is ready. That is the essential tension in asynchronous disaster recovery. The recovery point objective, or R P O, expresses the tolerated age of recoverable data, not a promise that every acknowledged write is already on the other array.

The recorded baseline uses a fifteen-minute DR policy and the corresponding PowerStore per-volume replication class. The class tells the storage controller which driver and schedule to use. Each spoke has the matching direction toward the other array. The original setup also mentions five-minute classes, so the number in an old example is not permission to assume the current test uses that interval.

For every VM backing disk, correlate the Kubernetes replication object with the source and destination array volume identifiers. Then inspect the actual PowerStore replication session: its role, healthy state, error information and last successful synchronization time. Both root and database disks must pass.

Do not stop at a reassuring group status. A group can obscure a problem affecting one disk. Conversely, a volume group reporting that it is still replicating does not automatically prove an S three metadata failure. Compare its per-disk conditions, the array's timestamps, cluster-data protection and the placement control's protection condition.

The worker-to-array connection also needs more than two apparently live transport paths. The configured host N Q N, which is the worker's NVMe initiator identity, must match the identity actually used by its connected kernel controllers and the array registration. A corrected file does not retroactively change an already-connected controller.

Check assigned-array sessions, mapped volumes, visible NVMe namespaces, mount events, and CSI readiness. If a target disk cannot actually be mounted, a successful promotion is not a usable recovery. Array alert checks must include active alerts whether they are acknowledged or not, because the default filter can hide acknowledged problems.

One more trap: an unmapped destination replica may legitimately have no Kubernetes persistent volume before promotion. Missing from the persistent-volume list does not make it an orphan. Use replication destination identifiers and array-session resource identifiers, together with claims and mappings, to establish which copy it is.`;
  const writes = `To make the later recovery measurement meaningful, we need a source-side baseline before the site switch. Record the source VM instance, guest database identity, service states and an exact capture time. Verify the intended source is actually spoke zero rather than assuming the home preference determines live placement.

HammerDB is the workload generator here, using its T P C C benchmark to make transaction activity observable. ${pending ? 'The intended Windows managed workload uses HammerDB version ' : 'This scenario records HammerDB version '}${c.hammer}. ${c.managed ? 'The managed RHEL bootstrap left its writers stopped; restarting a writer requires test authorization and sustained transaction growth must be demonstrated.' : 'The discovered workload still needs a current writer check; a historic deployment record does not establish that it is writing now.'}

The sum of the district order counters gives us a convenient activity snapshot. It helps show that the load is alive before initiation. But it is not the final integrity measurement, because HammerDB can restart on the target and add new orders immediately.

Also record the database timezone and the range of history timestamps. A UTC screenshot and a database timestamp in another timezone can appear to contradict each other even when they describe the same moment. Keep source-side evidence that can later establish the last source write and the number of writes awaiting replication.

There is no assumption that the source is automatically stopped or fenced just because failover is requested. The test is crash-consistent recovery from asynchronously replicated state. Stopping the database is not a required readiness step, and changing workload state is not part of a read-only inspection.`;
  const freezer = `For the RHEL object archive, also verify the VM freezer's freeze and unfreeze hooks. The data mount needs the correct SELinux security labels, because a permissions problem can prevent object capture even while PostgreSQL runs and disk replication is healthy. Establish successful backup or archive evidence before initiation; do not infer it from the guest's availability.`;
  const inspection = `Let us translate the inspection examples into questions rather than read command syntax. On the hub, ask the placement control which policy and Placement it references, what action it wants, and what its latest conditions say. Ask the ProtectedApplicationView how the application state is being correlated for the console.

Then ask the PlacementDecision which cluster it selects now. Inspect the policy to establish the schedule and the two disaster recovery clusters to establish their validation. These checks connect application identity, site eligibility and desired recovery behavior.

On each spoke, inspect the volume replication group in the D R operations namespace. The protected VM's claims remain in its workload namespace; the group does not have to share that namespace. Examine each replication object beside its selected claim, and compare the source and target roles.

Follow the VM, running VM instance, DataVolumes and claims together. The persistent volume identifies the actual CSI disk handle, while the VolumeAttachment identifies the worker attachment. Mount events reveal when the launcher cannot access a disk, even if the desired state looks correct.

For a managed scenario, also inspect the ApplicationSet, any generated Applications, the GitOpsCluster registration and the decision selected by the workload Placement. A correct repository entry, a correct live source field and a working generator are three separate claims to verify.

The example context names stand for the real hub, source and target kubeconfigs; they are not guaranteed names on your workstation. The YAML output is valuable because it exposes conditions, observed generations, reasons and messages. We use those fields to explain reconciliation, not merely to count existing resources.`;
  if (view === 'configuration') return [
    chapter('A machine is more than its disks', `Welcome. Today we are preparing ${c.name} for Dell PowerStore disaster recovery. ${pending ? `The intended guest is ${c.guest}, with ${c.database} and HammerDB planned to supply a transaction workload. Its managed deployment still needs to be defined.` : `Our guest is ${c.guest}, running ${c.database}, with HammerDB providing the transaction workload when its writer is enabled.`}

Here is the question that guides the episode: if the source site became unavailable, what would the other site actually need to run this application again? A copy of the disk is necessary, but so are the VM definition, usable storage connections, a selected destination and the controllers that turn that decision into a running machine.

We will build that picture in layers. First the sites and networks, then the controllers and storage, then the application-specific delivery path. Finally we will put the readiness evidence together, so that the failover episode starts from something stronger than a green dashboard tile.

${identity}

${boundary}

${pending ? 'This is a preparation episode for a not-yet-configured scenario. We will explain the complete intended chain and identify where Windows-specific setup must be supplied, without pretending that an existing RHEL deployment already satisfies it.' : c.managed ? 'This managed scenario is still an acceptance test to be demonstrated. Its configuration has been corrected, but it needs a fresh deployment before a clean run, and we will unpack why.' : 'The task-status snapshot marks this discovered scenario closed. That tells us about tracking, not the freshness or completeness of every piece of evidence for a new run.'}`),
    chapter('Three sites, four kinds of traffic', `Picture a hub and two application sites. The hub lives on edge thirty-six. Spoke zero, our home and intended source, lives on edge ninety-five. Spoke one, the recovery destination, lives on edge ninety-seven.

The hub coordinates the process through Red Hat Advanced Cluster Management and its multicluster engine. Ramen supplies the disaster recovery controllers. The Data Services console comes through the multicluster orchestration layer, and MinIO on the hub holds recovery metadata and object archives.

The guest disks are elsewhere. PowerStore V S A A serves the home site, and V S A B serves the recovery site. Their management consoles are on the management network with address endings twenty and thirty. The two storage endpoints on A end in one and two; on B they end in four and three.

Those separate storage addresses give workers paths to both array nodes using NVMe over T C P. The transport port is four four two zero. Management access to the array and actual block access to a volume are different paths, so one can appear healthy while the other is broken.

The cluster-local subnets are separate as well. The hub uses the recorded subnet ending one twenty-six, the home spoke one thirty, and the recovery spoke one twenty-seven. These are host-local networks. They should not be interpreted as a direct pod-network bridge between the two sites.

Management connectivity lets spoke agents reach the hub and its routes. The object-storage route carries metadata and backup traffic. Array-to-array replication carries guest disk changes. Worker-to-array NVMe carries the actual workload's block I O.

That separation explains why the current Dell path is not an O D F MirrorPeer or Submariner design. The array performs native asynchronous replication; a cross-cluster pod tunnel is not the mechanism moving these VM disks. Shared or overlapping pod addresses do not establish any direct network path on this diagram.

For the metadata route, trust the configured private certificate authority through the appropriate system trust. A successful array session does not prove a spoke can read its recovery paperwork from MinIO. We need evidence for each dependency rather than one generic connectivity verdict.`),
    chapter('Who decides where the application belongs?', `Start at the hub with the difference between a cluster that exists and a cluster that is eligible for disaster recovery. A ManagedCluster represents ACM's imported cluster identity and availability. A DRCluster supplies Ramen's site configuration and validation, including its object-store profile.

The DRPolicy pairs the two sites and supplies the replication schedule. These cluster and policy objects are cluster-scoped, which means they do not belong to the protected VM's namespace. They are shared prerequisites for choosing a recovery site.

The application's Disaster Recovery Placement Control, which we will call the D R P C, connects that policy to a particular workload. It refers to a Placement, protected namespaces and the selector identifying the disks to protect. The policy answers which sites and schedule; the application control answers which workload participates.

The Placement is the named selection object, and its PlacementDecision publishes the currently selected cluster. That published decision is what other controllers can consume. A preferred-cluster field alone is not a deployment instruction to every application controller.

${c.managed ? 'For this managed scenario, the hub placement control and Placement live in the OpenShift GitOps namespace, next to the ApplicationSet that reads the decision, and the spoke VRG lives in the gitops-vms workload namespace.' : 'For configured scenarios, the hub placement control and Placement live in the OpenShift D R operations namespace.'} The recorded decision is controller-generated, with the Placement name and a decision-one ending. Treat that exact suffix as an inventory observation, not a naming rule that all future controllers must follow.

The ProtectedApplicationView is another hub object in the same namespace as the placement control. Think of it as the console's correlated observation of the protected application. It helps present the relationship, but it neither promotes disks nor deploys a guest.

This also explains the color and scope distinction in the dependency diagram. A custom resource definition introduces an API type; an instance is the particular policy, control or configuration using it. A built-in claim or attachment is not a custom resource merely because an operator works with it.

When we inspect a connection, ask what it means. A policy reference is not ownership. A selector is not ownership. A view observing a remote object is not its creator. Those distinctions are especially important when tracing a cleanup problem: deleting the wrong kind of related object is not the same as resolving its owning controller's work.`),
    chapter('How the hub reaches a controller on the spoke', `The hub cannot demonstrate recovery just by updating its own desired state. That intent must reach the appropriate spoke, and observed state must come back.

ACM's ManifestWork carries desired resources to a managed cluster. In this flow, the hub has one relevant delivery instance in each spoke's hub namespace. Its recorded name combines the application control identity with the D R operations namespace and a volume-group-work ending.

The delivered VolumeReplicationGroup lives on the spoke in the D R operations namespace. In the configured scenarios its name matches the application control. That group coordinates selected claims, their protection metadata and whether the site should act as primary or secondary.

A ManagedClusterView lets the hub observe the remote group's state when this flow uses a view. The recorded view names follow the same application identity with a view ending. A view reporting a status is not proof that it owns the remote object, and delivery being available is not proof that the guest is running.

Follow that chain in both directions. On the way out, inspect what the hub asked for and whether delivery succeeded. On the way back, inspect whether the remote group accepted the desired generation and what its conditions actually say.

The spoke's DRClusterConfig supplies local disaster recovery configuration and is cluster-scoped. The imported cluster's Klusterlet and agents support management delivery and reporting. On the hub, the MultiClusterHub and MultiClusterEngine installation objects supply the management platform; they are not application-specific failover buttons.

${pending ? 'The shared delivery mechanism is established infrastructure, but this Windows managed scenario still lacks its own application control and resulting workload delivery objects. We cannot manufacture those identities from the RHEL example.' : `For ${c.drpc}, correlate the hub work and view instances with the group on each spoke. Its protected claims are still in ${c.namespace}. That separation is the practical reason the inspection examples query the group and the disks in different namespaces.`}

This is why an empty list in the hub's resource browser says little about spoke-local health. The hub and spoke are different API servers. To see a VM, volume group, data-protection runtime or attachment on the destination, inspect the destination cluster itself.`),
    chapter('Following a guest write all the way to the array', `Let us trace a database write outward from the guest. The VM describes the machine and references its root and data disks. Its VirtualMachineInstance is the executing guest, backed by a launcher pod on a worker.

A PersistentVolumeClaim is the workload's named request for a disk. A PersistentVolume supplies the binding and the actual CSI volume handle. A VolumeAttachment links that volume to the worker where the launcher needs it. The Container Storage Interface driver, or C S I driver, handles the platform-to-array disk operations.

DataVolumes add the initial provisioning and population step through the Containerized Data Importer, known as C D I. They may create and own the initial claims. That is useful during deployment, but dangerous if blindly repeated during recovery: a golden-image clone or blank data disk is not the promoted database replica.

Ramen's volume group selects the protected claims. The managed RHEL reference marks the intended disks with the D R protection label and selects the true value. That keeps temporary CDI prime or scratch claims out of the application's protected disk set; selecting every incidental claim would protect the wrong things.

A VolumeReplication object represents the role requested for each selected disk, and it references a matching VolumeReplicationClass. The class supplies provider-specific settings, including the relevant schedule and direction.

The csi-addons controller and Dell storage controllers interpret those requests into array operations. Their runtimes are on the spokes, in the powerstore and csi-addons-system namespaces. The external array replica volumes hold the operating-system and database blocks at the other site.

The active design is not the retired Dell CSM replication-controller path. DellCSIReplicationGroup belongs to that older architecture. The present per-disk VolumeReplication chain is the one to inspect for these workloads.

${replica}

The lesson is that protection and attachment solve different problems. Replication can preserve blocks at the target while attachment still fails on its worker. We need both a recoverable copy and a usable path into the launcher.`),
    chapter('Recovery paperwork is not database storage', `Return for a moment to MinIO on the hub. It speaks the S three object-storage interface and holds the ramen-metadata bucket. These stored objects are recovery metadata and Kubernetes object archives, not the guest's ongoing database block writes.

The group, data-protection engine and object store therefore form a separate recovery path. The engine needs a DataProtectionApplication configuration. Each Backup or Restore object records a particular operation, and its BackupStorageLocation supplies the storage destination and references required to reach it.

The recorded backup-storage locations encode the operations namespace, application control identity and rotating archive slot. For the discovered workloads, two slots were observed on both spokes. For the RHEL managed application, its locations were seen on spoke zero but not spoke one in that inventory.

The difference is an observation to explain, not proof that a target archive is lost. Likewise, there were no current Backup or Restore custom-resource instances in the inventory. We cannot infer stored archive presence or absence from that list alone.

${protection}

${!c.windows ? freezer : ''}

That is the readiness standard: an available location and healthy MinIO are necessary dependencies, while successful capture or read-back establishes the actual application archive. If archive-content evidence is missing, say it is unverified and keep the gate closed.`),
    ...(c.managed ? [chapter('The GitOps registration path and the workload path', `There are two Placements in this conversation, and confusing them hides integration problems. One is the application's D R Placement. The other selects clusters for GitOps registration.

The registration Placement is all-openshift-clusters in the OpenShift GitOps namespace. It now tolerates unreachable and unavailable clusters, so a failed spoke is not unregistered at the moment recovery needs it. The GitOpsCluster called argo-acm-clusters uses that selection to register destinations with Argo CD. Argo CD runs on the hub and on both spokes, and each spoke has a gitops-admin binding that lets its local Argo CD create the workload.

ManagedClusterSets define selection scope, and their namespace bindings make that scope available to Placements. The inventory includes the default set and default bindings in the GitOps and D R operations namespaces. Being imported into ACM does not, by itself, prove a cluster is available to the relevant namespaced Placement or registered as an Argo CD destination.

Now return to the application-specific Placement. Its decision belongs with the D R P C, and both sit in the GitOps namespace where the ApplicationSet generator can read the decision, generate the Application and use the registered destination.

So there are several checks before declaring the managed path ready. The controller must watch the namespace. Its service account needs the appropriate permissions. The generator must actually find the correctly labeled decision. The destination must be registered, and the generated Application must show the expected source, target, synchronization and health.

The RHEL reference polls its decision generator at a recorded interval of one hundred and eighty seconds. That is a reconciliation setting, not a guaranteed failover duration. The source branch and directory, selected server and target namespace must all match the tested configuration.

${id === '292' ? runner : 'The RHEL bootstrap scripts are references for this pending Windows scenario. Their Dell cluster-name support must not be assumed, and a Windows-specific guest installation and access path still needs to be established.'}

${pending ? 'For Windows managed recovery, this is shared infrastructure and an intended contract. There is no verified Windows ApplicationSet, generated Application, namespace or workload path to narrate as a completed setup. Those definitions must be supplied and tested before initiation.' : 'For this RHEL managed scenario, the recorded generator error and absence of Applications prevent us from claiming that the contract works. The fixed-spoke bootstrap is historical deployment evidence only.'}

During a real managed recovery, source cleanup must come through the application-management controller and target deployment must reuse the promoted disks. If a competing fixed-destination Application recreates the source, ownership is still wrong even if another controller claims success.`)] : []),
    chapter('What must be installed, and what is only an optional API', `There is a second kind of dependency diagram hidden inside the first: the operator installation chain. A CatalogSource supplies discoverable bundles. A Subscription requests a package and channel. An InstallPlan records resolved installation work, and a ClusterServiceVersion describes the installed bundle and its controllers.

These answer different questions. A ready catalog is not proof of an upgrade. An installed CSV is not proof of a running protected VM. The recorded absence of active RHDR Subscriptions does not mean its installed controllers disappeared.

The staging catalog is in the marketplace namespace. The recorded spoke RHDR CSV is in the D R system namespace, with the four point twenty-two stable eighty-six build identity. Hub RHDR and GitOps controllers have their own installation placement, including the operators namespace; inspect actual deployments rather than assuming every operator exists on every cluster.

On each spoke, OpenShift Virtualization has a HyperConverged installation instance in the virtualization namespace. It configures the KubeVirt and CDI capabilities underneath. The KubeVirt instance is namespaced there, while the CDI instance is cluster-scoped.

StorageClass is worth pausing on because it sounds like a custom resource, but it is built into Kubernetes. Think of it as a menu entry for requesting a disk. In this lab the claims name powerstore-sc. Kubernetes looks up that class and asks the Dell PowerStore CSI driver to supply the disk. Each spoke has its own cluster-wide class, even when both use the same name. The CSIDriver object is the driver registration; the actual controller and node pods carry out the work.

Do not confuse that storage menu with VolumeReplicationClass. The first tells Kubernetes how to supply storage. The second tells the replication controller which driver-specific replication settings and schedule to use. Neither one contains the database, and neither proves that the recovered VM is using the promoted copy rather than a freshly provisioned disk. The configuration diagram now shows claims, StorageClass, driver registration and the running implementation as their own dependency row.

Secrets and ConfigMaps provide credentials, array settings, object-store profiles, trusted certificates and generator configuration; services, routes, deployments and pods provide the running endpoints.

We inspect readiness and references without exposing secret contents. A secret name in a diagram is a dependency, not an invitation to read a password aloud or capture it in a screenshot.

There are also conditional APIs. Recipe can describe an object-protection workflow, but no application-specific Recipe was established by this inventory. VolumeGroupReplication and its class describe a group-based replication option, distinct from the selected per-disk path.

The inventory's only group-replication instance was an unrelated busybox example in the test namespace on spoke zero. The initial five-minute group class does not establish that our two VM disks use it. The group-snapshot API definition also does not prove an actual group snapshot class or snapshot operation exists.

This is the practical discipline: distinguish installed API capability from a selected workload dependency. Keep the conditional branches visible for investigation, but do not turn them into imaginary acceptance requirements.`),
    chapter('Inside the guest, where the experiment becomes measurable', `${guest}

${writes}

The database and load generator are separate health checks. The VM can be Running without the database being queryable. The database can be active without any new HammerDB writes. A useful baseline verifies all three layers and records evidence before the target is selected.`),
    chapter('Building a baseline that a later result can be compared with', `Now the configuration comes together as five questions. Do we know exactly which application and disks are protected? Can its configuration be recovered or correctly delivered? Is the source guest doing the intended work? Are both disk replicas within the actual recovery point objective? And have we recorded the UI and controller state before the test?

${inspection}

In the hub's Data Services interface, inspect Overview, Topology, Policies and Protected applications. Topology should identify the relevant clusters and their relationship. Policies should establish the active policy. Expand the application's inline details and open its disaster recovery status popover.

Check what those surfaces actually communicate. Is the text readable? Do step labels wrap correctly? Does the title agree with the displayed progression? Do the explanatory links open valid documentation? Capture a discrepancy while it exists and report it before proceeding to another action.

The baseline also spans Fleet management and Core platform. Record managed-cluster availability, application placement, policy and application controls, delivery and observation objects, installed controller readiness and the spoke-local storage and guest resources.

For managed recovery, include the GitOps operator, actual ArgoCD instance, cluster registration, ApplicationSet conditions and generated Application tree. For discovered recovery, GitOps is ordinarily not a workload owner, so do not invent a GitOps handoff merely because those APIs are installed.

Use one evidence index with capture time, cluster, scope, namespace, object and observed state. The purpose is to make a later change explainable. An image of a running controller cannot substitute for a database query, and terminal guest state cannot substitute for what a failover confirmation actually showed.

Use a nineteen-twenty by ten-eighty browser viewport for the baseline console captures. Keep the session's images together, and use ordered filenames identifying the step, cluster, scope, resource and tab. Consistent framing helps us compare the same surface before and after an action without confusing a changed layout with a changed recovery state.

When these questions have supported answers, we have a baseline. We still have not initiated failover, reset a workload, repaired storage, or demonstrated failback. Those are different actions and require their own scope and authorization.`),
    chapter('Reading history without importing its mistakes', history),
    chapter('The handoff to the recovery episode', `Let us bring the preparation back to the original question. The target needs recoverable blocks, the right machine definition, a selected site and controllers that can turn all of that into an executing guest. Our evidence must establish every link, not simply the existence of each resource.

For ${c.name}, the acceptance gates are ownership and scope, a meaningful source workload baseline, ${c.managed ? 'a generated Application that follows the recovery decision' : 'a recoverable VM object archive'}, healthy replicas for both disks, and the complete baseline UI and controller evidence.

${pending ? 'For this Windows managed scenario, those workload-specific gates cannot pass until its definitions and access path are established. The shared lab is a starting point, not a finished Windows deployment.' : c.managed ? 'For this RHEL managed scenario, the corrected layout must be deployed fresh, with the stuck first attempt cleared, before the managed handoff can be tested. A generated Application for spoke zero and protection of both disks are the starting gates.' : 'For this discovered scenario, successful disk replication does not bypass the object archive gate. A future cleanup action will also need separate authorization after target promotion is proven.'}

The setup document holds configuration and procedure evidence. The Dell notes supply troubleshooting history. The upstream Dell branch supplies workload manifests, and the Ramen usage guide explains the recovery model. The dashboard keeps those references available without making us listen to their URLs.

In the paired failover episode, we will follow the decision through target promotion, application recovery and database continuity. That is where preparation becomes a measured result.`)
  ];
  return [
    chapter('What we mean by recovering this application', `Welcome to the recovery episode for ${c.name}. ${pending ? `The intended test is a ${c.guest} VM with ${c.database} and HammerDB version ${c.hammer}. This is a proposed recovery scenario; no Windows managed workload is established by the reviewed sources.` : `We are following the recovery procedure for a ${c.guest} VM running ${c.database}, with HammerDB version ${c.hammer} supplying the transaction workload when enabled for the test.`}

Imagine the source site stops being a dependable place to run the application. The recovery site has replicas, but those replicas are not yet the whole application. We need a selected destination, promoted disks, the correct VM configuration, usable worker attachments and a database that can resume.

This episode follows those handoffs and explains what each piece of evidence means. It is a procedure, not a claim that a new test has already succeeded. Listening to it performs no failover, deletion or service change.

${identity}

${boundary}

Our intended direction is spoke zero on edge ninety-five to spoke one on edge ninety-seven. PowerStore A is the source array and PowerStore B is the recovery array for that direction. The hub on edge thirty-six provides the Data Services console and the recovery coordination.

${pending ? 'This Windows managed application is not yet configured in the reviewed sources. Treat the following as the intended acceptance story, with setup blockers that must be resolved before any action.' : c.managed ? 'This RHEL managed test now has a corrected configuration, but the first attempt is still stuck in cleanup and the corrected layout has not been redeployed. We will describe the intended flow without claiming that it has already passed.' : 'The discovered task is recorded as closed, but a new run still needs fresh readiness evidence and an independently supported continuity result.'}`),
    chapter('Before the button: make the baseline real', `The most important part of a failover often happens before the button is pressed. Open the paired configuration page and establish its gates for this specific run. A dated inventory is useful context, but it cannot prove that today's replicas, object archive or guest are ready.

Confirm the application's control, protected namespace, PlacementDecision, source VM instance and both backing claims. Trace owners and selectors so the recovery test does not accidentally include another workload. Verify the actual current source, rather than treating a preferred cluster as proof of placement.

${writes}

${replica}

${c.managed ? pending ? 'For the future Windows managed scenario, require a real registration-to-decision-to-generated-Application chain and its own target credential provisioning. Establish which object-protection dependencies its actual recovery control selects; do not assume the RHEL reference already defines Windows recovery.' : 'For this managed RHEL scenario, require the real registration-to-decision-to-generated-Application chain, the spoke permission binding and target credential provisioning. Object protection is not configured for it; the workload objects come from Git.' : 'For this discovered scenario, require protection on the application control, source Kubernetes object readiness and cluster-data protection, a ready OADP runtime and available backup location. Establish completed backup or archive read-back, including the VM, both DataVolumes and the required dependencies.'}

${id === '292' ? `The corrected RHEL managed control does not enable Kubernetes object protection, so no per-application backup storage locations are expected for it. That is a deliberate difference from the discovered workloads, not a missing archive.

${runner}` : ''}

${!c.windows ? freezer : ''}

Before pressing Failover, retain the source history evidence and the verified synchronization timestamps together. They establish what existed before the switch, so the later recovered-row count can be compared with an expected source population rather than simply interpreted as a growing target workload.

If one disk's synchronization or the VM restore evidence is unverified, stop here. This is not excessive paperwork: deleting the source later becomes destructive, and we must know that the target has a recoverable application before crossing that gate.`),
    chapter('The console moment, and the evidence around it', `Now we are at the hub console. In Fleet management, Data Services exposes disaster recovery through Overview, Topology, Policies and Protected applications. Before initiation, capture the active policy and the source-to-target cluster relationship, then expand the affected application's inline details.

Open the disaster recovery status popover and read it, rather than relying on its color. Check its title, step count, progression, readable text and label wrapping. Follow explanatory links to confirm they are valid. These read-only checks repeat at meaningful states, because a UI that becomes misleading during recovery can hide the very transition we need to understand.

On the application's action menu, an enabled Failover option establishes availability, not authorization. Capture it before selecting it. When the user explicitly authorizes the test, open the flow, choose spoke one, inspect the latest available recovery timestamp and any warnings, and capture the destination and confirmation before submitting.

The action must be initiated through that web-console confirmation. Directly patching or annotating the recovery control through a command line bypasses the required flow and loses the corresponding UI evidence. If the browser cannot reach the hub, resolve access rather than switching initiation methods.

Capture the immediate post-initiation state. The application control describes the desired recovery action, but its phase, progression, reasons, conditions and observed generation tell us what reconciliation has actually reached. Do not assume every run emits an identical sequence of intermediate labels.

At the same time, follow the relevant Fleet application and cluster views and the Core platform controller and custom-resource views. A hub status change should be explainable through the downstream delivery, storage and application-controller state, not treated as an isolated banner.`),
    chapter('When the target copy becomes the working copy', `The next handoff is from recovery intent to usable target storage. The hub coordinates a spoke volume replication group, that group coordinates individual replication objects, and the Dell CSI and csi-addons path turns the desired roles into PowerStore operations.

We need the target group to be primary. We also need the replication object for each backing disk to be primary. Then both target claims must be bound to the expected destination volume handles on PowerStore B for this test direction.

Why insist on the handles? Because a claim can be Bound to a perfectly healthy disk that is not the recovered disk. A fresh blank data volume or a new golden-image root disk would make the infrastructure appear successful while losing the point of the recovery test.

Next inspect the worker side. The persistent-volume topology must allow the target worker, and the attachment must publish the correct disk to it. Examine launcher mount events, CSI controller and node readiness, and actual NVMe namespace visibility.

Two live transport connections are not proof of access to the needed volume. The worker could be connected under a stale initiator identity or have no usable namespace for that mapping. Compare configured and live controller identities with the array's initiator and mapping evidence.

Leave the source objects intact until this target-copy gate passes. If promotion, binding or usable storage access is wrong, removing the source only reduces the recovery options. Also remember that a replica without a persistent-volume object before promotion is not automatically orphaned storage.

At this gate, capture the target role, each disk binding and handle, attachment and controller evidence, and the hub's updated progression. Repeat the blocking read-only Data Services checks before proceeding. The next chapter is where discovered and managed applications take different paths.`),
    chapter(c.managed ? 'The managed handoff must happen without a human deleting the source' : 'Why Cleaning Up is not the finish line', c.managed ? `For a managed application, the acceptance story is controller-driven. The PlacementDecision must select spoke one, and an actively reconciled ApplicationSet must generate an Application whose registered destination is that site.

Argo CD must then remove the source workload resources and deploy the target configuration. We inspect ApplicationSet conditions, generated Application ownership, source revision and path, destination, operation results and the resource tree. A console classification is not a substitute for that handoff.

Manual deletion of the source VM, DataVolumes or claims would not satisfy this managed test. It could make recovery appear to finish while concealing that the application controller never reacted to placement. The source must terminate through the intended ownership path, and its volume group must become secondary. Argo CD should remove the VM, disks and Service but leave the gitops-vms namespace in place, because the source VRG lives there and must survive long enough to become secondary.

Watch for a competing fixed-destination Application. If it keeps reconciling spoke zero, it may recreate resources the recovery workflow is trying to remove. That ownership conflict is an unresolved readiness problem, not a reason to keep deleting the source by hand.

On the target, verify that the workload binds the already-promoted disks. Initial provisioning manifests may describe cloning a boot image and creating a blank database disk. Those actions are appropriate for a new deployment, not a recovered application. A successful target sync must not overwrite the replica's purpose with fresh storage.

If the handoff stalls, capture the namespace-watch, registration, generator and ownership errors before proposing a repair. The recorded RHEL generator problem explains why no generated Applications were available in the inventory. Repair is a separately authorized change, and it must be demonstrated before a new managed failover is initiated.

${pending ? 'Windows has an additional setup gap: its managed workload resources, namespace, ApplicationSet, manifest path and access service are unspecified in the reviewed source. The RHEL example demonstrates intended integration concepts, not a Windows recovery implementation.' : 'For this RHEL scenario, retain the configured object-backup evidence alongside the GitOps evidence. Argo CD proving workload delivery does not remove a Kubernetes object-protection dependency that the application control explicitly enables.'}` : `A discovered application can report a failed-over phase while its progression still says Cleaning Up. That is an intermediate state. The target may have been promoted, but the source workload objects can still prevent its group from settling as secondary.

Do not interpret the word failed-over as permission to delete anything. First verify the target group and both disk replication objects are primary, both target claims are bound to the expected replica handles, and the target-copy evidence is complete. Then obtain separate explicit authorization for source cleanup.

After that authorization, confirm the cluster context is the source before each destructive action. Delete the source VM gracefully first, and wait for its running VM instance to terminate. The order matters because a live guest can still have its storage in use.

Next delete the source root and data DataVolumes before the claims they own. This avoids an owner continuing to reconcile a claim that we are trying to remove. Then handle the source claims as authorized, while allowing their configured reclaim policy to manage the underlying volume lifecycle.

Do not manually delete persistent volumes or array volumes as a shortcut. Do not touch target VM resources, promoted replication objects or destination disks. After every action, verify the context and confirm that the target copy remains intact.

Capture immediately before and after each VM, DataVolume and claim deletion. Retain timestamped command output alongside the matching console observations. A shell command being accepted is not proof that the corresponding source resource is gone.

Force-deleting a stuck launcher or removing a claim finalizer needs its own exact-object investigation and explicit authorization. A missing-PV detach error, absent backing source volume and mapping, and failure of normal deletion must be established where the procedure requires them. None of those exceptions is a routine recovery step.

The gate closes only when source VM, VM instance, DataVolumes and claims are gone, the source group is secondary, and the application control reports failed-over with completed progression. This is the discovered cleanup contract, not a template for the managed flow.`),
    chapter('The guest boots, but the experiment is not finished', `Now look at the recovered VM on spoke one. Its executing instance should be Running and its launcher ready. Both recovered disks need to be accessible, and the final PlacementDecision should agree with the target.

${guest}

${c.windows ? 'If SQL Server is still stopped after the expected startup interval, investigate its service and event logs before an authorized manual intervention. Do not silently start it and then claim that automatic startup was verified.' : 'Verify both systemd services automatically started. If either failed, inspect its status and a bounded journal before intervention. PostgreSQL recovery should make the intended database queryable from the recovered data disk; a process merely existing is weaker evidence.'}

Crash-consistent recovery means the database may need its normal crash-recovery work. For PostgreSQL, this involves its write-ahead log. For SQL Server, confirm its recovery completed sufficiently for the T P C C database to answer queries. We are not treating guest startup as proof of transaction continuity yet.

Recheck the control chain at the same time. Source workload termination, a secondary source group, a primary target group and disk roles, completed recovery progression, and placement on spoke one should tell a consistent story. A Running VM with an incomplete cleanup gate is not the final result.

The writer is expected to resume with the guest configuration. That is useful proof of service recovery, but it creates the measurement problem we will address next: a higher transaction count now contains both recovered data and brand-new target writes.`),
    chapter('Measuring the actual write gap', `Suppose the source order count was large and the target count is even larger. It is tempting to call that zero loss. But the target writer may have been running long enough to hide missing source transactions with new ones.

Failover is unplanned recovery from the latest replicated state. It does not promise a final synchronization from the source, even if that source remains reachable in a lab test. Planned relocation is a different operation; do not import its final-sync assumption into this measurement.

We therefore examine the history table by time. First establish the guest database timezone and latest history timestamp. Select a window around the failover and group rows by minute. PostgreSQL truncates each timestamp to its minute; SQL Server converts the timestamp to a minute-level value for the same grouping purpose.

The minute distribution reveals where writes stop and where they resume. Then locate the last row attributable to the source and the first row attributable to the recovered target. The distance between them describes the observed write gap, which is not the same quantity as the replication age.

Now bring in the storage evidence. Record the last verified group or array synchronization timestamp. The interval between that sync and the last source write is the outstanding-write window we care about for R P O analysis.

Count the recovered history rows in that interval and compare them with the source-side evidence retained before and during the handoff. That comparison supports a continuity conclusion. Merely finding some rows in the recovered window cannot prove that all source writes survived unless we know what should have been there.

Report the configured R P O, actual sync age, last source write, first target write, gap duration, recovered window count and the supported data-loss verdict. If source-side evidence cannot establish the exact missing-write count, mark exact loss unverified rather than substituting an aggregate-counter success claim.

Use the guest's authenticated database client without exposing credentials. The SQL Server examples use a query input file to avoid nested shell quoting problems. The placeholders in the example queries are real measurement choices: substitute the established timezone and actual boundaries, not convenient approximate times.

An optional quiet-write test can produce a simpler comparison by stopping source writes before initiation and comparing the recovered data before target writes resume. But that is a separately scoped test. Do not retrofit its assumptions onto this active-write crash-consistent flow.

The important result is an explained evidence chain. Storage says which replica was available; source observations say which writes existed; recovered history says which of those writes are present; target timestamps say when service resumed.`),
    ...(c.windows ? [chapter('The Windows desktop is a separate recovery check', `Before calling Windows recovery complete, there is one more observation that a service query cannot replace. Ask the user to open the recovered desktop through the remote desktop protocol, or R D P, and confirm the guest booted without a blue screen of death.

For the recorded discovered workload, the existing HammerDB Windows remote desktop helper targets the selected spoke. The user runs it for spoke one; the assistant should not run it on the user's behalf. ${pending ? 'For the managed Windows variant, first establish or adapt the actual namespace, access service and script path. The discovered access helper is not proof that those managed resources exist.' : 'That access check is separate from the SQL Server and scheduled-task checks already collected.'}

An unplanned-shutdown dialog can appear after crash-consistent recovery. The Windows Shutdown Event Tracker is expected in that situation; it is not a blue-screen failure. The user can dismiss it or identify the shutdown as unplanned, then confirm a usable desktop.

Wait for that confirmation. A guest answering SSH, a Running VM instance and an active database service are useful evidence, but they do not establish the requested desktop and no-BSOD result. Record this as its own acceptance observation after the history-gap analysis.`)] : []),
    chapter('Stop the load, keep the database', `After continuity validation ${c.windows ? 'and desktop confirmation from the user' : 'and the completed recovery checks'}, stop and disable the HammerDB writer on the target. This preserves the result without letting continued load fill the data disk.

${c.windows ? 'For Windows, stop the RamenDR-HammerDB scheduled task and disable its future triggers. Stopping the running instance and disabling the schedule are different actions; the result needs both. Leave SQL Server Express running so the database remains queryable.' : 'For RHEL, stop and disable the RamenDR HammerDB systemd service. The immediate stop ends the current load, and disabling it prevents automatic restart. Leave the PostgreSQL service running so the recovered database remains queryable.'}

Verify the writer is stopped and disabled, then compare the transaction counter across two observations. It should no longer advance from HammerDB activity. The database and VM remain available for examination.

This step is not a rollback. The recovered workload stays on spoke one at the end of this flow. Relocation or failback is a separate test, and the dashboard should restore the home-site depiction only after an authorized return is actually verified.

We can now seal the evidence instead of letting the system keep changing underneath the report. The final result should include the actual placement, completed control state, storage roles, guest-service behavior, database continuity and the state of the stopped writer.`),
    chapter('The evidence has to connect across operators', `Let us reconstruct the run as an observer who was not in the room. In the hub Data Services view, that observer needs the baseline policy and topology, the expanded application state, status popovers, enabled action, selected target and submitted confirmation. At each meaningful progression change, capture the updated state and any warning or error.

In Fleet management, the source and target managed-cluster availability, application topology and PlacementDecision explain where the workload should go. ManifestWork delivery and ManagedClusterView observations connect the hub's request to the spoke's actual group state.

In Core platform, the relevant operator or controller readiness and versions establish the running implementation. Inspect the recovery control, policy and disaster recovery clusters with their conditions, reasons, messages and observed generation. Add bounded events and logs when they explain a stall, rather than collecting unlimited noise.

${c.managed ? 'For this managed application, the GitOps chain is mandatory evidence: operator and ArgoCD readiness, cluster registration, ApplicationSet generator and conditions, generated Application source and destination, synchronization and health, operation results and resource tree. Capture the automatic source cleanup and target reuse of promoted disks.' : 'For this discovered application, GitOps ownership is normally not applicable. Do not capture an installed GitOps API and imply it delivered the workload. Capture the actual OADP and Velero recovery dependencies and their status instead.'}

At each spoke, inspect the local volume group, both disk replication objects, VM and running instance, DataVolumes, claims, persistent-volume handles and attachments. Add the CSI, csi-addons, virtualization and CDI readiness that explains the handoff. The hub's empty list is not a replacement for opening the correct managed-cluster view.

PowerStore evidence connects Kubernetes handles with replicas, mappings, sessions, sync timestamps and active alerts. Include both acknowledged and unacknowledged active alerts. MinIO readiness and backup-location status describe metadata dependencies, while terminal success or archive read-back describes the actual object archive.

Guest service commands and database queries need timestamped terminal evidence. They cannot be proved by a console image of the VM. Conversely, terminal output cannot prove which destination a confirmation dialog displayed. Pair each kind with the other where the claim spans them.

Use a single session evidence folder and an index naming the time, workload, step, cluster, scope, namespace, object, tab and observed state. Set the browser viewport to nineteen-twenty by ten-eighty, and name the images in step order with their cluster, scope, resource and tab. Keep the captures clean and exclude credentials or cluster-registration Secret contents.

Capture immediately before and after authorized mutations. Repeat changed handoffs at transitions and the relevant readiness and placement chain at completion; unchanged operator version pages still need baseline and completion readiness coverage, without being duplicated at every poll.

When a view is unavailable, mark that evidence unverified and explain why. Do not invoke sync, prune, rollback, edit, restart or delete just to exercise a control. If the UI misbehaves, capture the discrepancy immediately, compare it with the baseline and report it before the next action.`),
    chapter('What earlier runs teach us, and what they do not', history),
    chapter('What a completed recovery actually proves', `We began with the question of what the target needs to run the application again. A completed result now needs more than the word completed on a banner: the target disk copies are the intended replicas, the source and target roles agree, the application configuration follows the correct ownership path, and the recovered guest services work.

For ${c.name}, the acceptance story includes a supported source baseline, both disk replication gates, ${c.managed ? 'a real generated-Application handoff and automatic source cleanup' : 'verified object recovery and separately authorized source cleanup'}, target placement on spoke one, and a completed recovery control. It also includes the history-gap measurement ${c.windows ? 'and the user-confirmed healthy Windows desktop' : 'and database crash-recovery evidence'}.

Afterward, the writer is stopped and disabled, while the database remains queryable. The final UI and cross-controller evidence should confirm the placement, storage and protection state and record whether the active DRPolicy changed during the run.

${pending ? 'For this proposed Windows managed test, this is the acceptance contract, not an achieved result. Workload definitions, access and the functioning GitOps decision path must be established first.' : c.managed ? 'For this RHEL managed test, the corrected layout must be redeployed before the contract can be demonstrated. A manual source deletion or fixed-spoke Application cannot stand in for the controller handoff, and Argo CD must remove the source workload without deleting its namespace.' : 'For this discovered test, a closed Jira status and a booted target do not remove the need for measured continuity and the completed cleanup chain.'}

The comparison with an AWS or O D F baseline should be about applicable behavior. Do not import its cleanup script, networking checks, mirrored-storage resources, R P O thresholds or relocate sequence without verifying that they apply to Dell.

That is the full recovery story: a deliberate site decision, usable promoted storage, correct application ownership, a recovered guest, measured database continuity and evidence that another person can follow. The separate setup and investigation references remain on the dashboard for the exact technical details.`)
  ];
};
