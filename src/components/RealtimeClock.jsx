import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const RealtimeClock = ({ variant = "admin" }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Africa/Kigali",
    timeZoneName: "short",
  });

  const dateStr = time.toLocaleDateString([], {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Africa/Kigali",
  });

  if (variant === "admin") {
    return (
      <div className="card p-4 border-l-4 border-l-brand-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
            <Clock size={20} className="text-brand-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-panel-900 font-mono tracking-tight">{timeStr}</p>
            <p className="text-xs text-panel-500">{dateStr}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "hr") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
        <Clock size={14} className="text-blue-600" />
        <span className="text-sm font-mono font-semibold text-blue-800">{timeStr}</span>
        <span className="text-xs text-blue-500 hidden sm:inline">· {dateStr}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-panel-100 border border-panel-200">
      <Clock size={12} className="text-panel-500" />
      <span className="text-xs font-mono text-panel-700">{timeStr}</span>
    </div>
  );
};

export default RealtimeClock;