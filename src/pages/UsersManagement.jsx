import React, { useState, useEffect } from "react";
import { getAllUsers, toggleUserStatus, deleteUser, updateUserPermissions } from "../api/authAPI";
import { getPermissionRequests, reviewPermissionRequest } from "../api/permissionAPI";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import {
  Shield, List, LayoutGrid, Search, ToggleLeft, ToggleRight,
  Circle, AlertCircle, CheckCircle2, Trash2, Settings2,
  Lock, X, Check, Clock,
} from "lucide-react";

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [permRequests, setPermRequests] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [permModal, setPermModal] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [activeTab, setActiveTab] = useState("users");
  const { onlineUsers, socket } = useSocket();

  const fetchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([getAllUsers(), getPermissionRequests()]);
      setUsers(uRes.data.data || []);
      setPermRequests(pRes.data.data || []);
    } catch {}
    finally { setFetching(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new_notification", fetchData);
    return () => socket.off("new_notification", fetchData);
  }, [socket]);

  const handleToggle = async (id, username) => {
    if (username === currentUser?.username && currentUser?.role === "admin") {
      setError("Cannot modify your own admin account.");
      return;
    }
    try {
      const res = await toggleUserStatus(id);
      setSuccess(`${username} ${res.data.data.isActive ? "activated" : "deactivated"}.`);
      fetchData();
    } catch { setError("Failed."); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    if (deleteModal.username === currentUser?.username && currentUser?.role === "admin") {
      setError("Cannot delete your own admin account.");
      setDeleteModal(null);
      return;
    }
    try {
      await deleteUser(deleteModal._id);
      setSuccess(`${deleteModal.username} deleted permanently.`);
      setDeleteModal(null);
      fetchData();
    } catch { setError("Delete failed."); setDeleteModal(null); }
  };

  const openPermModal = (u) => {
    if (u.username === currentUser?.username && currentUser?.role === "admin") {
      setError("Cannot modify permissions for your own admin account.");
      return;
    }
    setPermModal(u);
    setEditPerms(u.permissions || {
      canViewOtherDepts: false,
      canViewAllEmployees: false,
      canCrossDeptChat: false,
    });
  };

  const handleSavePerms = async () => {
    if (!permModal) return;
    if (permModal.username === currentUser?.username && currentUser?.role === "admin") {
      setError("Cannot modify permissions for your own admin account.");
      setPermModal(null);
      return;
    }
    try {
      await updateUserPermissions(permModal._id, editPerms);
      setSuccess("Permissions updated.");
      setPermModal(null);
      fetchData();
    } catch { setError("Failed."); }
  };

  const handleReviewPerm = async (id, status) => {
    try {
      await reviewPermissionRequest(id, { status, reviewNote: `${status} by admin.` });
      setSuccess(`Request ${status}.`);
      fetchData();
    } catch { setError("Failed."); }
  };

  const isOnline = (u) => onlineUsers.includes(u?.toLowerCase());

  const isCurrentAdmin = (u) => u.username === currentUser?.username && u.role === "admin";

  const filtered = users.filter((u) => {
    if (isCurrentAdmin(u)) return false;
    const ms = u.username.toLowerCase().includes(search.toLowerCase());
    const mr = !filterRole || u.role === filterRole;
    return ms && mr;
  });

  const pendingPerms = permRequests.filter((p) => p.status === "pending");

  const RoleTag = ({ role }) => (
    <span className={`badge ${
      role === "admin" ? "badge-green"
      : role === "hr" ? "badge-blue"
      : "badge-gray"}`}>
      {role}
    </span>
  );

  const PermToggle = ({ label, pKey }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-panel-700">{label}</span>
      <button
        onClick={() => setEditPerms((p) => ({ ...p, [pKey]: !p[pKey] }))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                    transition-all duration-150
                    ${editPerms[pKey]
                      ? "bg-brand-100 text-brand-700"
                      : "bg-panel-100 text-panel-500"}`}
      >
        {editPerms[pKey] ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
        {editPerms[pKey] ? "Granted" : "Denied"}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title"><Shield size={22} /> User Management</h1>
          <p className="page-subtitle">{filtered.length} manageable users · {pendingPerms.length} pending requests</p>
        </div>
      </div>

      {success && <div className="alert-success"><CheckCircle2 size={14} />{success}</div>}
      {error && <div className="alert-error"><AlertCircle size={14} />{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-panel-200">
        {[
          { key: "users", label: "Users", count: filtered.length },
          { key: "permissions", label: "Permission Requests", count: pendingPerms.length },
        ].map((tab) => (
          <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                              border-b-2 transition-all duration-150
                              ${activeTab === tab.key
                                ? "border-brand-500 text-brand-700"
                                : "border-transparent text-panel-500 hover:text-panel-800"}`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                               ${tab.key === "permissions" && tab.count > 0
                                 ? "bg-red-100 text-red-600"
                                 : "bg-panel-100 text-panel-600"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <>
          {/* Toolbar */}
          <div className="card">
            <div className="card-body py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                    <input type="search" placeholder="Search users..."
                           value={search} onChange={(e) => setSearch(e.target.value)}
                           className="input-field pl-10 text-sm" />
                  </div>
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                          className="input-field w-auto text-sm">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                <div className="flex items-center gap-0.5 bg-panel-100 rounded-lg p-0.5">
                  {[
                    { mode: "list", Icon: List },
                    { mode: "grid", Icon: LayoutGrid },
                  ].map(({ mode, Icon }) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium
                                        transition-all duration-150
                                        ${viewMode === mode
                                          ? "bg-white shadow-sm text-panel-900"
                                          : "text-panel-500 hover:text-panel-700"}`}>
                      <Icon size={13} />
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="card card-body space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
              {filtered.map((u) => (
                <div key={u._id} className="card hover:shadow-card-md transition-all duration-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center
                                       text-sm font-bold
                                       ${u.role === "admin"
                                         ? "bg-brand-100 text-brand-700"
                                         : u.role === "hr"
                                         ? "bg-blue-100 text-blue-700"
                                         : "bg-purple-100 text-purple-700"}`}>
                        {u.username[0].toUpperCase()}
                      </div>
                      {isOnline(u.username) && (
                        <Circle size={9} className="absolute -bottom-0 -right-0 text-green-500
                                                    fill-green-500 stroke-white" strokeWidth={3} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-panel-900 text-sm truncate">{u.username}</p>
                      <RoleTag role={u.role} />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-panel-500 mb-3">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className={u.isActive ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Online</span>
                      <span>{isOnline(u.username) ? "🟢 Now" : "⚫ Offline"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-panel-100">
                    <button onClick={() => handleToggle(u._id, u.username)}
                            className="btn-ghost btn-sm text-[11px] flex-1">
                      {u.isActive
                        ? <><ToggleRight size={12} className="text-brand-600" /> Deactivate</>
                        : <><ToggleLeft size={12} className="text-green-600" /> Activate</>}
                    </button>
                    <button onClick={() => openPermModal(u)}
                            className="btn-secondary btn-sm text-[11px]">
                      <Settings2 size={12} />
                    </button>
                    <button onClick={() => setDeleteModal(u)}
                            className="btn-danger-outline btn-sm text-[11px]">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-head">
                      {["User","Role","Status","Online","Permissions","Actions"].map(h => (
                        <th key={h} className="table-cell">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u._id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                               text-[11px] font-bold
                                               ${u.role === "admin"
                                                 ? "bg-brand-100 text-brand-700"
                                                 : u.role === "hr"
                                                 ? "bg-blue-100 text-blue-700"
                                                 : "bg-purple-100 text-purple-700"}`}>
                                {u.username[0].toUpperCase()}
                              </div>
                              {isOnline(u.username) && (
                                <Circle size={7} className="absolute -bottom-0 -right-0 text-green-500
                                                            fill-green-500 stroke-white" strokeWidth={3} />
                              )}
                            </div>
                            <span className="font-medium text-panel-900 text-sm">{u.username}</span>
                          </div>
                        </td>
                        <td className="table-cell"><RoleTag role={u.role} /></td>
                        <td className="table-cell">
                          <span className={u.isActive ? "badge-green" : "badge-red"}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="table-cell text-xs">
                          {isOnline(u.username) ? "🟢 Online" : "⚫ Offline"}
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-wrap gap-1">
                            {u.permissions?.canViewOtherDepts && (
                              <span className="badge-blue text-[10px]">Depts</span>
                            )}
                            {u.permissions?.canCrossDeptChat && (
                              <span className="badge-green text-[10px]">Chat+</span>
                            )}
                            {u.permissions?.canViewAllEmployees && (
                              <span className="badge-gray text-[10px]">AllEmp</span>
                            )}
                            {!u.permissions?.canViewOtherDepts &&
                              !u.permissions?.canCrossDeptChat &&
                              !u.permissions?.canViewAllEmployees && (
                              <span className="text-xs text-panel-400">Default</span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <button onClick={() => handleToggle(u._id, u.username)}
                                    className="btn-ghost btn-sm text-xs">
                              {u.isActive
                                ? <ToggleRight size={13} className="text-brand-600" />
                                : <ToggleLeft size={13} className="text-green-600" />}
                            </button>
                            <button onClick={() => openPermModal(u)} className="btn-secondary btn-sm text-xs">
                              <Settings2 size={13} />
                            </button>
                            <button onClick={() => setDeleteModal(u)}
                                    className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-panel-100 text-xs text-panel-400">
                {filtered.length} of {users.length} users
              </div>
            </div>
          )}
        </>
      )}

      {/* Permission Requests Tab */}
      {activeTab === "permissions" && (
        <div className="space-y-3">
          {permRequests.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Lock size={36} className="mx-auto text-panel-300 mb-2" />
                <p className="text-sm text-panel-600">No permission requests</p>
              </div>
            </div>
          ) : (
            permRequests.map((p) => (
              <div key={p._id} className="card p-4 hover:shadow-card-md transition-shadow duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Lock size={17} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-panel-900">
                          {p.requestedBy} →{" "}
                          <span className="text-brand-600">{p.type.replace(/_/g, " ")}</span>
                        </p>
                        <span className={
                          p.status === "pending" ? "badge-yellow"
                          : p.status === "approved" ? "badge-green"
                          : "badge-red"
                        }>
                          {p.status === "pending" ? <Clock size={10} />
                           : p.status === "approved" ? <Check size={10} />
                           : <X size={10} />}
                          {p.status}
                        </span>
                      </div>
                      {p.targetUser && (
                        <p className="text-xs text-panel-500">Target: {p.targetUser}</p>
                      )}
                      {p.details && (
                        <p className="text-xs text-panel-500">Details: {p.details}</p>
                      )}
                      {p.reviewNote && (
                        <p className="text-xs text-panel-400 mt-1 italic">Note: {p.reviewNote}</p>
                      )}
                    </div>
                  </div>

                  {p.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleReviewPerm(p._id, "approved")}
                              className="btn-primary btn-sm text-xs">
                        <Check size={12} /> Approve
                      </button>
                      <button onClick={() => handleReviewPerm(p._id, "rejected")}
                              className="btn-danger-outline btn-sm text-xs">
                        <X size={12} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete User Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-panel-900">
              Delete {deleteModal?.username}?
            </h3>
            <p className="text-sm text-panel-500 mt-1">
              This is permanent. The user will be instantly logged out if online.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={() => setDeleteModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 size={14} /> Delete Permanently
          </button>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal open={!!permModal} onClose={() => setPermModal(null)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-panel-900 flex items-center gap-2">
            <Settings2 size={16} className="text-brand-600" />
            Permissions — {permModal?.username}
          </h3>
          <button onClick={() => setPermModal(null)} className="btn-icon p-1">
            <X size={15} />
          </button>
        </div>

        <div className="divide-y divide-panel-100">
          <PermToggle label="View Other Departments" pKey="canViewOtherDepts" />
          <PermToggle label="View All Employees" pKey="canViewAllEmployees" />
          <PermToggle label="Cross-Department Chat" pKey="canCrossDeptChat" />
        </div>

        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={() => setPermModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleSavePerms} className="btn-primary">Save Permissions</button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersManagement;