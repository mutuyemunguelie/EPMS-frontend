import React, { useState, useEffect, useCallback } from "react";
import { getSuggestions, createSuggestion, reviewSuggestion } from "../api/suggestionAPI";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import Modal from "../components/Modal";
import {
  Lightbulb, Plus, X, AlertCircle, CheckCircle2, Clock,
  XCircle, Eye, Send, MessageSquare,
} from "lucide-react";

const STATUS = {
  pending:  { badge: "badge-yellow", icon: Clock,         label: "Pending" },
  reviewed: { badge: "badge-blue",   icon: Eye,           label: "Reviewed" },
  accepted: { badge: "badge-green",  icon: CheckCircle2,  label: "Accepted" },
  rejected: { badge: "badge-red",    icon: XCircle,       label: "Rejected" },
};

const Suggestions = () => {
  const { user } = useAuth();
  const canReview = ["admin", "hr"].includes(user?.role);

  const [list, setList] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewData, setReviewData] = useState({ status: "accepted", reviewNote: "" });
  const [form, setForm] = useState({ title: "", content: "", target: "admin" });

  const fetch = useCallback(async () => {
    try {
      const res = await getSuggestions();
      setList(res.data.data || []);
    } catch {}
    finally { setFetching(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(t); }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setError("All fields required."); return; }
    setLoading(true);
    try {
      await createSuggestion(form);
      setSuccess("Suggestion submitted.");
      setForm({ title: "", content: "", target: "admin" });
      setShowForm(false);
      fetch();
    } catch (e) { setError(e.response?.data?.message || "Failed."); }
    finally { setLoading(false); }
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    try {
      await reviewSuggestion(reviewModal, reviewData);
      setSuccess("Suggestion reviewed.");
      setReviewModal(null);
      setReviewData({ status: "accepted", reviewNote: "" });
      fetch();
    } catch { setError("Review failed."); }
  };

  return (
    <div className="space-y-5 stagger">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title"><Lightbulb size={22} /> Suggestions</h1>
          <p className="page-subtitle">
            {canReview ? "Review employee suggestions" : "Submit suggestions to admin or HR"}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
                className={showForm ? "btn-secondary btn-sm" : "btn-primary btn-sm"}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Suggestion</>}
        </button>
      </div>

      {error && <div className="alert-error"><AlertCircle size={14} />{error}</div>}
      {success && <div className="alert-success"><CheckCircle2 size={14} />{success}</div>}

      {showForm && (
        <div className="card animate-slide-down">
          <div className="card-header">
            <h2 className="section-title mb-0"><Send size={13} /> Submit Suggestion</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">Title</label>
                <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                       placeholder="Brief title..." className="input-field" />
              </div>
              <div>
                <label className="label">Send To</label>
                <select value={form.target} onChange={(e) => setForm(p => ({ ...p, target: e.target.value }))}
                        className="input-field">
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="label">Details</label>
                <textarea value={form.content}
                          onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))}
                          rows={4} placeholder="Describe your suggestion..."
                          className="input-field resize-none" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Submitting..." : "Submit Suggestion"}
              </button>
            </form>
          </div>
        </div>
      )}

      {fetching ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 w-full rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Lightbulb size={40} className="mx-auto text-panel-300 mb-3" />
            <p className="text-sm font-medium text-panel-600">No suggestions yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((s) => {
            const st = STATUS[s.status] || STATUS.pending;
            const StIcon = st.icon;
            return (
              <div key={s._id} className="card p-4 hover:shadow-card-md transition-shadow duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb size={18} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-panel-900">{s.title}</h3>
                        <span className={st.badge}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </div>
                      <p className="text-sm text-panel-600 whitespace-pre-wrap">{s.content}</p>
                      {s.reviewNote && (
                        <div className="mt-2 px-3 py-2 rounded-lg bg-panel-50 border border-panel-200">
                          <p className="text-xs text-panel-500">
                            <span className="font-semibold">Review by {s.reviewedBy}:</span> {s.reviewNote}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-panel-400">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={11} /> {s.author} ({s.authorRole})
                        </span>
                        <span>{formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  {canReview && s.status === "pending" && (
                    <button onClick={() => setReviewModal(s._id)}
                            className="btn-secondary btn-sm flex-shrink-0">
                      <Eye size={13} /> Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)}>
        <h3 className="text-base font-bold text-panel-900 mb-4">Review Suggestion</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Decision</label>
            <select value={reviewData.status}
                    onChange={(e) => setReviewData(p => ({ ...p, status: e.target.value }))}
                    className="input-field">
              <option value="accepted">Accept</option>
              <option value="reviewed">Mark as Reviewed</option>
              <option value="rejected">Reject</option>
            </select>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <textarea value={reviewData.reviewNote}
                      onChange={(e) => setReviewData(p => ({ ...p, reviewNote: e.target.value }))}
                      rows={3} className="input-field resize-none"
                      placeholder="Add a note..." />
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={() => setReviewModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleReview} className="btn-primary">Submit Review</button>
        </div>
      </Modal>
    </div>
  );
};

export default Suggestions;