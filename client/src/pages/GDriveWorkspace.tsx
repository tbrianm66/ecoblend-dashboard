/**
 * Sprint 72 — G Drive Workspace Automation
 * 11-folder taxonomy + permission matrix per V4 Architecture Brief Section 1
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FolderOpen, Plus, Shield, CheckCircle, Clock, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

const MODULE_COLORS: Record<string, string> = {
  "00": "#1a2332", "01": "#3A97D3", "02": "#51AF37", "03": "#F49C13",
  "04": "#8B5CF6", "05": "#06B6D4", "06": "#EC4899", "07": "#10B981",
  "08": "#EF4444", "09": "#F59E0B", "10": "#6B7280",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active:    <CheckCircle size={14} className="text-green-500" />,
  pending:   <Clock size={14} className="text-amber-500" />,
  creating:  <RefreshCw size={14} className="text-blue-500 animate-spin" />,
  archived:  <AlertCircle size={14} className="text-gray-400" />,
};

const ACCESS_COLORS: Record<string, string> = {
  owner:     "bg-green-100 text-green-800",
  editor:    "bg-blue-100 text-blue-800",
  commenter: "bg-amber-100 text-amber-800",
  viewer:    "bg-gray-100 text-gray-600",
  no_access: "bg-red-50 text-red-400",
};

export default function GDriveWorkspace() {
  const [selectedVentureId, setSelectedVentureId] = useState("ECB-001");
  const [createForm, setCreateForm] = useState({ ventureId: "", ventureCode: "", ventureName: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview"|"folders"|"permissions">("overview");

  const workspaces = trpc.gdriveWorkspace.listWorkspaces.useQuery();
  const workspace  = trpc.gdriveWorkspace.getWorkspace.useQuery({ ventureId: selectedVentureId }, { enabled: !!selectedVentureId });
  const taxonomy   = trpc.gdriveWorkspace.getModuleTaxonomy.useQuery();
  const matrix     = trpc.gdriveWorkspace.getPermissionMatrix.useQuery();
  const permissions = trpc.gdriveWorkspace.getPermissions.useQuery({ ventureId: selectedVentureId }, { enabled: !!selectedVentureId });

  const createMutation = trpc.gdriveWorkspace.createWorkspace.useMutation({
    onSuccess: (data) => {
      toast.success(`Workspace created: ${data.foldersCreated} folders provisioned`);
      workspaces.refetch();
      workspace.refetch();
      setShowCreate(false);
      setCreateForm({ ventureId: "", ventureCode: "", ventureName: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const topLevelFolders = workspace.data?.topLevelFolders ?? [];
  const allFolders      = workspace.data?.allFolders ?? [];
  const ws              = workspace.data?.workspace;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>Sprint 72</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">V4 Architecture Brief — Section 1</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>G Drive Workspace Automation</h1>
            <p className="text-sm text-gray-500 max-w-xl">11-folder taxonomy per V4 spec. Automated provisioning of venture workspaces with role-based permission matrix across all 6 lead roles.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowCreate(!showCreate)} style={{ borderColor: "#51AF37", color: "#51AF37" }}>
              <Plus size={13} /> New Workspace
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Create Form */}
        {showCreate && (
          <Card className="mb-6 border-2" style={{ borderColor: "#51AF37" }}>
            <CardHeader><CardTitle className="text-base">Provision New Venture Workspace</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><Label className="text-xs mb-1 block">Venture ID</Label><Input placeholder="ECB-005" value={createForm.ventureId} onChange={e => setCreateForm(f => ({ ...f, ventureId: e.target.value }))} /></div>
                <div><Label className="text-xs mb-1 block">Venture Code</Label><Input placeholder="AQUA" value={createForm.ventureCode} onChange={e => setCreateForm(f => ({ ...f, ventureCode: e.target.value }))} /></div>
                <div><Label className="text-xs mb-1 block">Venture Name</Label><Input placeholder="AquaBlend Solutions" value={createForm.ventureName} onChange={e => setCreateForm(f => ({ ...f, ventureName: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createMutation.mutate(createForm)} disabled={!createForm.ventureId || !createForm.ventureCode || !createForm.ventureName || createMutation.isPending}>
                  {createMutation.isPending ? "Provisioning…" : "Provision Workspace"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar: workspace list */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Venture Workspaces</h3>
              {workspaces.isLoading ? (
                <div className="text-xs text-gray-400">Loading…</div>
              ) : (workspaces.data ?? []).length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">No workspaces yet.<br />Create one above.</div>
              ) : (
                <div className="space-y-2">
                  {(workspaces.data ?? []).map(w => (
                    <button key={w.id} onClick={() => setSelectedVentureId(w.ventureId)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedVentureId === w.ventureId ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{w.ventureCode}</span>
                        {STATUS_ICONS[w.status]}
                      </div>
                      <div className="text-xs opacity-70 truncate">{w.ventureName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main panel */}
          <div className="xl:col-span-3">
            {/* Tabs */}
            <div className="flex gap-1 mb-4">
              {(["overview","folders","permissions"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50 border"}`}
                  style={activeTab !== tab ? { borderColor: "#e5e7eb" } : {}}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                {ws ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FolderOpen size={18} className="text-amber-500" />
                            <span className="font-bold text-gray-900">{ws.ventureCode} — {ws.ventureName}</span>
                            <Badge variant="outline" className="text-xs capitalize">{ws.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-400">Venture ID: {ws.ventureId} · {ws.totalFolders} modules provisioned</p>
                        </div>
                        {ws.driveUrl && (
                          <a href={ws.driveUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs"><ExternalLink size={12} /> Open Drive</Button>
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3 text-center" style={{ background: "#f9fafb" }}>
                          <div className="text-2xl font-bold text-gray-900">{ws.totalFolders}</div>
                          <div className="text-xs text-gray-400">Top-level Modules</div>
                        </div>
                        <div className="rounded-lg p-3 text-center" style={{ background: "#f9fafb" }}>
                          <div className="text-2xl font-bold text-gray-900">{allFolders.length}</div>
                          <div className="text-xs text-gray-400">Total Folders</div>
                        </div>
                      </div>
                    </div>
                    {/* Module grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {topLevelFolders.map(folder => (
                        <div key={folder.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${MODULE_COLORS[folder.moduleNumber] ?? "#6B7280"}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold" style={{ color: MODULE_COLORS[folder.moduleNumber] ?? "#6B7280" }}>{folder.moduleNumber}</span>
                            <FolderOpen size={14} className="text-gray-400" />
                          </div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">{folder.folderName.replace(`${folder.moduleNumber}_`, "").replace(/_/g, " ")}</div>
                          <div className="text-xs text-gray-400">{allFolders.filter(f => f.parentFolderId === folder.id).length} sub-folders</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5e7eb" }}>
                    <FolderOpen size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Select a venture workspace or create a new one.</p>
                  </div>
                )}
              </div>
            )}

            {/* Folders Tab */}
            {activeTab === "folders" && (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
                  <h3 className="text-sm font-semibold text-gray-900">11-Folder Taxonomy — V4 Architecture Brief</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Standard folder structure provisioned for every venture workspace</p>
                </div>
                <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                  {(taxonomy.data ?? []).map(mod => (
                    <div key={mod.number} className="px-5 py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: MODULE_COLORS[mod.number] ?? "#6B7280" }}>{mod.number}</span>
                        <span className="text-sm font-semibold text-gray-900">{mod.name.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-11">
                        {mod.subFolders.map(sub => (
                          <span key={sub} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{sub.replace(/_/g, " ")}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === "permissions" && (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Permission Matrix — 6 Roles × 11 Modules</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Role-based access control per V4 Architecture Brief Section 1.3</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2 font-semibold text-gray-500 w-36">Role</th>
                        {Array.from({ length: 11 }, (_, i) => String(i).padStart(2, "0")).map(n => (
                          <th key={n} className="px-2 py-2 font-semibold text-center" style={{ color: MODULE_COLORS[n] ?? "#6B7280" }}>{n}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(matrix.data ?? {}).map(([role, modules]) => (
                        <tr key={role} className="border-t" style={{ borderColor: "#f3f4f6" }}>
                          <td className="px-4 py-2 font-medium text-gray-700 capitalize">{role.replace(/_/g, " ")}</td>
                          {Array.from({ length: 11 }, (_, i) => String(i).padStart(2, "0")).map(n => {
                            const access = (modules as Record<string, string>)[n] ?? "no_access";
                            return (
                              <td key={n} className="px-2 py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ACCESS_COLORS[access] ?? "bg-gray-100 text-gray-400"}`}>
                                  {access === "no_access" ? "—" : access.charAt(0).toUpperCase()}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t flex gap-4 flex-wrap" style={{ borderColor: "#e5e7eb" }}>
                  {Object.entries(ACCESS_COLORS).map(([level, cls]) => (
                    <span key={level} className="flex items-center gap-1 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${cls}`}>{level === "no_access" ? "—" : level.charAt(0).toUpperCase()}</span>
                      <span className="text-gray-500 capitalize">{level.replace(/_/g, " ")}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
