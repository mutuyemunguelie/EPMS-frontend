import React, { useState, useEffect, useCallback } from "react";
import { getActivityLogs } from "../api/activityAPI";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity, Users, Wallet, Building2, Settings,
  Shield, MessageCircle, RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  { key: "", label: "All", Icon: Activity },
  { key: "employee", label: "Employee", Icon: Users },
  { key: "salary", label: "Salary", Icon: Wallet },
  { key: "department", label: "Department", Icon: Building2 },
  { key: "setting", label: "Settings", Icon: Settings },
  { key: "permission", label: "Permissions", Icon: Shield },
  { key: "message", label: "Messages", Icon: MessageCircle },
];

const ROLE_STYLE = {
  admin: "bg-brand-100 text-brand-700",
  hr: "bg-blue-100 text-blue-700",
  employee: "bg-purple-100 text-purple-700",
};

const ActivityTimeline = () => {
  const [logs, setLogs] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [category, setCategory] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await getActivityLogs({ category: category || undefined, limit: 150 });
      setLogs(res.data.data || []);
    } catch {}
    finally { setFetching(false); }
  }, [category]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /* Auto-refresh every 15s */
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  /* Group by date */
  const grouped = logs.reduce((acc, log) => {
    const date = format(new Date(log.createdAt), "MMMM d, yyyy");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const CATEGORY_ICONS = {
    employee: Users, salary: Wallet, department: Building2,
    setting: Settings, permission: Shield, message: MessageCircle,
    user: Shield, system: Activity,
  };

  return (
    <div className="space-y-5 stagger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title"><Activity size={22} /> Activity Timeline</h1>
          <p className="page-subtitle">
            Real-time log of all actions performed in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn-sm flex items-center gap-1.5 ${
              autoRefresh ? "btn-primary" : "btn-secondary"}`}
          >
            <RefreshCw size={13} className={autoRefresh ? "animate-spin" : ""} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button onClick={fetchLogs} className="btn-secondary btn-sm">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        transition-all duration-150 border
                        ${category === key
                          ? "bg-brand-50 text-brand-700 border-brand-300 shadow-sm"
                          : "bg-white text-panel-500 border-panel-200 hover:border-panel-300"}`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {fetching ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Activity size={36} className="mx-auto text-panel-300 mb-2" />
            <p className="text-sm text-panel-600">No activity recorded yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-panel-500 uppercase tracking-wider">
                  {date}
                </span>
                <div className="flex-1 h-px bg-panel-200" />
                <span className="text-[10px] text-panel-400 font-medium">
                  {items.length} action{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((log, i) => {
                  const LogIcon = CATEGORY_ICONS[log.category] || Activity;
                  return (
                    <div
                      key={log._id}
                      className="card p-4 flex items-start gap-3
                                 hover:shadow-card-md transition-shadow duration-200
                                 animate-slide-up"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-panel-100 flex items-center
                                      justify-center flex-shrink-0">
                        <LogIcon size={15} className="text-panel-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md
                                           ${ROLE_STYLE[log.actorRole] || "bg-panel-100 text-panel-600"}`}>
                            {log.actor}
                          </span>
                          <span className="text-sm font-medium text-panel-800">{log.action}</span>
                          {log.target && (
                            <span className="text-xs text-brand-600 font-mono">{log.target}</span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-xs text-panel-500 mt-0.5">{log.details}</p>
                        )}
                        <p className="text-[10px] text-panel-400 mt-1">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          {" · "}
                          {format(new Date(log.createdAt), "HH:mm:ss")}
                        </p>
                      </div>

                      {/* Category badge */}
                      <span className="badge-gray text-[10px] flex-shrink-0">{log.category}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;