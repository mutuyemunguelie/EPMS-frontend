import React, { useState, useEffect, useCallback } from "react";
import {
  getPermissionRequests,
  reviewPermissionRequest,
  deletePermissionRequest,
} from "../api/permissionAPI";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { formatDistanceToNow } from "date-fns";
import Modal from "../components/Modal";
import {
  Shield, Clock, CheckCircle2, XCircle, AlertCircle,
  Trash2, Filter, RefreshCw, User,
  Check, X, Eye,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:  { badge: "badge-yellow", Icon: Clock,        label: "Pending" },
  approved: { badge: "badge-green",  Icon: CheckCircle2, label: "Approved" },
  rejected: { badge: "badge-red",    Icon: XCircle,      label: "Rejected" },
};

const TYPE_LABELS = {
  delete_user:          "Delete Employee",
  role_change:          "Role Change",
  view_other_depts:     "View Other Departments",
  cross_dept_chat:      "Cross-Department Chat",
  view_all_employees:   "View All Employees",
};

const PermissionPortal = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const isAdmin = user?.role === "admin";

  const [requests,    setRequests]    = useState([]);
  const [fetching,    setFetching]    = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewData,  setReviewData]  = useState({ status: "approved", reviewNote: "" });
  const [success,     setSuccess]     = useState("");
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [detailItem,  setDetailItem]  = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await getPermissionRequests(filterStatus || undefined);
      setRequests(res.data.data || []);
    } catch {}
    finally { setFetching(false); }
  }, [filterStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(t); }
  }, [success]);

  /* Real-time updates */
  useEffect(() => {
    if (!socket) return;

    const onNew = (perm) => {
      setRequests((prev) => {
        const exists = prev.find((r) => r._id === perm._id);
        return exists ? prev : [perm, ...prev];
      });
    };

    const onReviewed = (perm) => {
      setRequests((prev) =>
        prev.map((r) => r._id === perm._id ? perm : r)
      );
    };

    socket.on("permission_request_new", onNew);
    socket.on("permission_reviewed", onReviewed);

    return () => {
      socket.off("permission_request_new", onNew);
      socket.off("permission_reviewed", onReviewed);
    };
  }, [socket]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await reviewPermissionRequest(reviewModal._id, {
        status: reviewData.status,
        reviewNote: reviewData.reviewNote,
      });
      setSuccess(
        `Request ${reviewData.status === "approved" ? "approved" : "declined"} successfully.`
      );
      setReviewModal(null);
      setReviewData({ status: "approved", reviewNote: "" });
      fetchRequests();
    } catch (e) {
      setError(e.response?.data?.message || "Review failed.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deletePermissionRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setSuccess("Request deleted.");
    } catch { setError("Delete failed."); }
  };

  const filtered = requests.filter((r) =>
    !filterStatus || r.status === filterStatus
  );

  const counts = {
    all:      requests.length,
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-5 stagger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title"><Shield size={22} /> Permission Portal</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Review and manage permission requests from HR and employees"
              : "Track your permission requests and their status"}
          </p>
        </div>
        <button onClick={fetchRequests} className="btn-secondary btn-sm">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && <div className="alert-error"><AlertCircle size={14} />{error}</div>}
      {success && <div className="alert-success"><CheckCircle2 size={14} />{success}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "",         label: "All Requests", count: counts.all,      color: "border-l-panel-400" },
          { key: "pending",  label: "Pending",      count: counts.pending,  color: "border-l-yellow-400" },
          { key: "approved", label: "Approved",     count: counts.approved, color: "border-l-brand-500" },
          { key: "rejected", label: "Rejected",     count: counts.rejected, color: "border-l-red-400" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`card p-4 text-left border-l-4 ${s.color}
                        hover:shadow-card-md transition-all duration-150
                        ${filterStatus === s.key ? "shadow-card-md bg-panel-50" : ""}`}
          >
            <p className="text-2xl font-bold text-panel-900">{s.count}</p>
            <p className="text-xs text-panel-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card">
        <div className="card-body py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-panel-400" />
            <span className="text-xs text-panel-500 font-medium">Filter:</span>
            {["", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150
                            ${filterStatus === s
                              ? "bg-brand-600 text-white"
                              : "bg-panel-100 text-panel-600 hover:bg-panel-200"}`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      {fetching ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Shield size={40} className="mx-auto text-panel-300 mb-3" />
            <p className="text-sm font-medium text-panel-600">
              No {filterStatus || ""} requests found
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => {
            const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StatusIcon = sc.Icon;
            const typeLabel = TYPE_LABELS[req.type] || req.type;

            return (
              <div
                key={req._id}
                className={`card p-4 hover:shadow-card-md transition-shadow duration-200
                            animate-slide-up border-l-4
                            ${req.status === "pending"
                              ? "border-l-yellow-400"
                              : req.status === "approved"
                              ? "border-l-brand-400"
                              : "border-l-red-400"}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start
                                justify-between gap-3">
                  {/* Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${req.status === "pending"
                                      ? "bg-yellow-100 text-yellow-600"
                                      : req.status === "approved"
                                      ? "bg-brand-100 text-brand-600"
                                      : "bg-red-100 text-red-600"}`}>
                      <Shield size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-panel-900">{typeLabel}</p>
                        <span className={sc.badge}>
                          <StatusIcon size={10} /> {sc.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-panel-500">
                        <span className="flex items-center gap-1">
                          <User size={11} /> {req.requestedBy}
                          <span className="text-panel-300">({req.requestedByRole})</span>
                        </span>
                        {req.targetUser && (
                          <span>→ Target: <strong>{req.targetUser}</strong></span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {req.details && (
                        <p className="text-xs text-panel-600 mt-1.5 bg-panel-50
                                      px-2 py-1 rounded border border-panel-100">
                          {req.details}
                        </p>
                      )}

                      {req.reviewNote && (
                        <div className="mt-2 px-2 py-1.5 rounded bg-brand-50
                                        border border-brand-100 text-xs text-brand-700">
                          <span className="font-semibold">Admin note:</span> {req.reviewNote}
                        </div>
                      )}

                      {req.reviewedBy && (
                        <p className="text-xs text-panel-400 mt-1">
                          Reviewed by <strong>{req.reviewedBy}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <button onClick={() => setDetailItem(req)}
                            className="btn-ghost btn-sm text-xs">
                      <Eye size={13} /> Details
                    </button>

                    {isAdmin && req.status === "pending" && (
                      <>
                        <button
                          onClick={() => {
                            setReviewModal(req);
                            setReviewData({ status: "approved", reviewNote: "" });
                          }}
                          className="btn-primary btn-sm text-xs"
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setReviewModal(req);
                            setReviewData({ status: "rejected", reviewNote: "" });
                          }}
                          className="btn-danger-outline btn-sm text-xs"
                        >
                          <X size={13} /> Decline
                        </button>
                      </>
                    )}

                    {(isAdmin || req.status !== "pending") && (
                      <button
                        onClick={() => handleDelete(req._id)}
                        className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)}>
        <h3 className="text-base font-bold text-panel-900 mb-1 flex items-center gap-2">
          <Shield size={16} className="text-brand-600" />
          Review Permission Request
        </h3>
        <p className="text-xs text-panel-500 mb-4">
          {reviewModal && TYPE_LABELS[reviewModal.type]} · from {reviewModal?.requestedBy}
          {reviewModal?.targetUser && ` · target: ${reviewModal.targetUser}`}
        </p>

        {reviewModal?.details && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-panel-50 border border-panel-200">
            <p className="text-xs text-panel-500 font-medium mb-0.5">Request Reason</p>
            <p className="text-sm text-panel-700">{reviewModal.details}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Decision</label>
            <div className="flex gap-3">
              <button
                onClick={() => setReviewData((p) => ({ ...p, status: "approved" }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                            text-sm font-medium border-2 transition-all duration-150
                            ${reviewData.status === "approved"
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-panel-200 text-panel-500 hover:border-brand-300"}`}
              >
                <CheckCircle2 size={16} /> Approve
              </button>
              <button
                onClick={() => setReviewData((p) => ({ ...p, status: "rejected" }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                            text-sm font-medium border-2 transition-all duration-150
                            ${reviewData.status === "rejected"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-panel-200 text-panel-500 hover:border-red-300"}`}
              >
                <XCircle size={16} /> Decline
              </button>
            </div>
          </div>

          <div>
            <label className="label">
              Note <span className="text-panel-400 font-normal">(required for decline)</span>
            </label>
            <textarea
              value={reviewData.reviewNote}
              onChange={(e) => setReviewData((p) => ({ ...p, reviewNote: e.target.value }))}
              placeholder={
                reviewData.status === "rejected"
                  ? "Explain why this request is declined..."
                  : "Optional note to the requester..."
              }
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={() => setReviewModal(null)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleReview}
            disabled={
              submitting ||
              (reviewData.status === "rejected" && !reviewData.reviewNote.trim())
            }
            className={reviewData.status === "approved" ? "btn-primary" : "btn-danger"}
          >
            {submitting
              ? "Processing..."
              : reviewData.status === "approved"
              ? <><Check size={14} /> Approve Request</>
              : <><X size={14} /> Decline Request</>}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)}>
        <h3 className="text-base font-bold text-panel-900 mb-4 flex items-center gap-2">
          <Eye size={16} className="text-brand-600" /> Request Details
        </h3>
        {detailItem && (
          <div className="space-y-3">
            {[
              { label: "Type", value: TYPE_LABELS[detailItem.type] || detailItem.type },
              { label: "Requested by", value: `${detailItem.requestedBy} (${detailItem.requestedByRole})` },
              { label: "Target", value: detailItem.targetUser || "N/A" },
              { label: "Status", value: detailItem.status },
              { label: "Created", value: new Date(detailItem.createdAt).toLocaleString() },
              ...(detailItem.reviewedBy ? [
                { label: "Reviewed by", value: detailItem.reviewedBy },
                { label: "Review note", value: detailItem.reviewNote || "None" },
              ] : []),
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-xs text-panel-400 w-28 flex-shrink-0">{item.label}</span>
                <span className="text-sm text-panel-800 font-medium">{item.value}</span>
              </div>
            ))}
            {detailItem.details && (
              <div>
                <p className="text-xs text-panel-400 mb-1">Full Details</p>
                <div className="bg-panel-50 rounded-lg p-3 text-sm text-panel-700">
                  {detailItem.details}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <button onClick={() => setDetailItem(null)} className="btn-secondary btn-sm">
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PermissionPortal;