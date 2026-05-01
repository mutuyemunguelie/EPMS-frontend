import React, { useState, useEffect, useCallback } from "react";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../api/announcementAPI";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { formatDistanceToNow } from "date-fns";
import {
  Megaphone, Plus, Trash2, AlertCircle, CheckCircle2,
  X, Shield, Users, Globe, AlertTriangle,
} from "lucide-react";

const PRIORITY_STYLES = {
  normal:    { badge: "badge-gray",   icon: Globe,         label: "Normal" },
  important: { badge: "badge-blue",   icon: AlertCircle,   label: "Important" },
  urgent:    { badge: "badge-red",    icon: AlertTriangle, label: "Urgent" },
};

const TARGET_STYLES = {
  all:      { badge: "badge-green", label: "Everyone" },
  hr:       { badge: "badge-blue",  label: "HR Staff" },
  employee: { badge: "badge-gray",  label: "Employees" },
};

const Announcements = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const canPost = ["admin", "hr"].includes(user?.role);

  const [list,      setList]      = useState([]);
  const [fetching,  setFetching]  = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [deleteId,  setDeleteId]  = useState(null);
  const [form, setForm] = useState({
    title: "", content: "", target: "all", priority: "normal",
  });

  const fetchList = useCallback(async () => {
    try {
      const res = await getAnnouncements();
      setList(res.data.data || []);
    } catch {}
    finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (!socket) return;
    const handler = (ann) => {
      setList((p) => [ann, ...p]);
    };
    socket.on("new_announcement", handler);
    return () => socket.off("new_announcement", handler);
  }, [socket]);

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content required.");
      return;
    }
    setLoading(true);
    try {
      await createAnnouncement(form);
      setSuccess("Announcement posted.");
      setForm({ title: "", content: "", target: "all", priority: "normal" });
      setShowForm(false);
      fetchList();
    } catch (e) {
      setError(e.response?.data?.message || "Failed.");
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteAnnouncement(deleteId);
      setSuccess("Deleted.");
      setDeleteId(null);
      fetchList();
    } catch { setError("Failed."); setDeleteId(null); }
  };

  return (
    <div className="space-y-5 stagger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title"><Megaphone size={22} /> Announcements</h1>
          <p className="page-subtitle">Company-wide communications and updates</p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
          >
            {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Post</>}
          </button>
        )}
      </div>

      {error && <div className="alert-error"><AlertCircle size={14} />{error}</div>}
      {success && <div className="alert-success"><CheckCircle2 size={14} />{success}</div>}

      {/* Post Form */}
      {showForm && canPost && (
        <div className="card animate-slide-down">
          <div className="card-header">
            <h2 className="section-title mb-0">New Announcement</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">Title</label>
                <input
                  name="title" value={form.title} onChange={handleChange}
                  placeholder="Announcement title..."
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Target Audience</label>
                  <select name="target" value={form.target}
                          onChange={handleChange} className="input-field">
                    <option value="all">Everyone</option>
                    <option value="hr">HR Staff Only</option>
                    <option value="employee">Employees Only</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select name="priority" value={form.priority}
                          onChange={handleChange} className="input-field">
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Content</label>
                <textarea
                  name="content" value={form.content} onChange={handleChange}
                  placeholder="Write your announcement..."
                  rows={4} className="input-field resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Posting..." : "Post Announcement"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement List */}
      {fetching ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card card-body skeleton h-32" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Megaphone size={40} className="mx-auto text-panel-300 mb-3" />
            <p className="text-sm font-medium text-panel-600">No announcements yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((ann, i) => {
            const priority = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.normal;
            const target = TARGET_STYLES[ann.target] || TARGET_STYLES.all;
            const PIcon = priority.icon;

            return (
              <div
                key={ann._id}
                className={`card p-5 transition-all duration-200 hover:shadow-card-md
                            border-l-4 ${
                              ann.priority === "urgent"
                                ? "border-l-red-500"
                                : ann.priority === "important"
                                ? "border-l-blue-500"
                                : "border-l-brand-400"
                            } animate-slide-up`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      ann.priority === "urgent"
                        ? "bg-red-100 text-red-600"
                        : ann.priority === "important"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-brand-100 text-brand-600"
                    }`}>
                      <PIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-panel-900">{ann.title}</h3>
                        <span className={priority.badge}>{priority.label}</span>
                        <span className={target.badge}>{target.label}</span>
                      </div>
                      <p className="text-sm text-panel-600 whitespace-pre-wrap">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-panel-400">
                        <span className="flex items-center gap-1">
                          {ann.postedByRole === "admin"
                            ? <Shield size={11} className="text-brand-500" />
                            : <Users size={11} className="text-blue-500" />}
                          {ann.postedBy}
                        </span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  {canPost && (ann.postedBy === user?.username || user?.role === "admin") && (
                    <button onClick={() => setDeleteId(ann._id)}
                            className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-panel-900">Delete Announcement</h3>
                <p className="text-sm text-panel-500 mt-1">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;