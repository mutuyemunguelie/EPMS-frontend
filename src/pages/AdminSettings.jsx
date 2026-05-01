import React, { useState, useEffect, useCallback } from "react";
import { getSettings, updateSetting } from "../api/settingsAPI";
import { useSocket } from "../context/SocketContext";
import {
  Settings, ToggleLeft, ToggleRight,
  CheckCircle2, AlertCircle, Shield, Info,
} from "lucide-react";

/* All configurable settings */
const SETTINGS_CONFIG = [
  {
    key:         "cross_dept_chat_enabled",
    label:       "Cross-Department Chat",
    description: "Allow employees to message colleagues in other departments.",
    defaultValue: false,
  },
  {
    key:         "employee_view_others_enabled",
    label:       "Employee Profile Viewing",
    description: "Allow employees to view profiles of other employees.",
    defaultValue: true,
  },
  {
    key:         "public_announcements",
    label:       "Public Announcements",
    description: "Allow HR to post announcements visible to all employees.",
    defaultValue: true,
  },
  {
    key:         "employee_suggestions_enabled",
    label:       "Employee Suggestions",
    description: "Allow employees to submit suggestions to HR and Admin.",
    defaultValue: true,
  },
];

const AdminSettings = () => {
  const { socket } = useSocket();

  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState({});
  const [success,  setSuccess]  = useState("");
  const [error,    setError]    = useState("");

  /* Fetch settings on mount */
  const fetchSettings = useCallback(async () => {
    try {
      const res = await getSettings();
      setSettings(res.data.data || {});
    } catch (e) {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  /* Auto-dismiss alerts */
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error)   { const t = setTimeout(() => setError(""),   4000); return () => clearTimeout(t); }
  }, [error]);

  /* Real-time settings update from socket */
  useEffect(() => {
    if (!socket) return;
    const handler = ({ key, value }) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    };
    socket.on("settings_updated", handler);
    return () => socket.off("settings_updated", handler);
  }, [socket]);

  /* Toggle a setting */
  const handleToggle = async (key, currentValue) => {
    const newValue = !currentValue;

    /* Optimistic update */
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSaving((prev) => ({ ...prev, [key]: true }));

    try {
      await updateSetting(key, newValue);
      setSuccess(`Setting updated successfully.`);
    } catch (e) {
      /* Revert on failure */
      setSettings((prev) => ({ ...prev, [key]: currentValue }));
      setError(e.response?.data?.message || "Failed to update setting.");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  /* Get current value — fallback to default */
  const getValue = (key, defaultValue) => {
    if (key in settings) return settings[key];
    return defaultValue;
  };

  return (
    <div className="space-y-5 stagger">
      {/* Header */}
      <div>
        <h1 className="page-title"><Settings size={22} /> System Settings</h1>
        <p className="page-subtitle">
          Control system-wide features and permissions for all users
        </p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="alert-success">
          <CheckCircle2 size={14} /> {success}
        </div>
      )}
      {error && (
        <div className="alert-error">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="card p-4 flex items-start gap-3 border-l-4 border-l-blue-400 bg-blue-50/30">
        <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-panel-800">
            Changes apply instantly
          </p>
          <p className="text-xs text-panel-500 mt-0.5">
            When you toggle a setting, all online users are notified and affected
            features are enabled or disabled in real time.
          </p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title mb-0 flex items-center gap-1.5">
            <Shield size={14} /> Permission Controls
          </h2>
        </div>

        <div className="divide-y divide-panel-100">
          {loading ? (
            /* Skeleton */
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-5 gap-4">
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-3 w-72" />
                </div>
                <div className="skeleton h-8 w-24 rounded-full" />
              </div>
            ))
          ) : (
            SETTINGS_CONFIG.map((cfg) => {
              const value    = getValue(cfg.key, cfg.defaultValue);
              const isSaving = saving[cfg.key];

              return (
                <div
                  key={cfg.key}
                  className="flex items-center justify-between gap-4 p-5
                             hover:bg-panel-50 transition-colors duration-100"
                >
                  {/* Label + description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-panel-900">
                        {cfg.label}
                      </p>
                      <span className={`badge ${value ? "badge-green" : "badge-gray"}`}>
                        {value ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-panel-500 mt-0.5">
                      {cfg.description}
                    </p>
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() => handleToggle(cfg.key, value)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm
                                font-semibold transition-all duration-200 flex-shrink-0
                                focus:outline-none focus:ring-2 focus:ring-offset-1
                                ${value
                                  ? "bg-brand-100 text-brand-700 hover:bg-brand-200 focus:ring-brand-400"
                                  : "bg-panel-200 text-panel-600 hover:bg-panel-300 focus:ring-panel-400"
                                }
                                disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? (
                      /* Spinner */
                      <span className="w-5 h-5 border-2 border-current/30
                                       border-t-current rounded-full animate-spin" />
                    ) : value ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                    <span className="hidden sm:inline">
                      {isSaving ? "Saving..." : value ? "On" : "Off"}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;