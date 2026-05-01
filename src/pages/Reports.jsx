import React, { useState } from "react";
import { getPayrollReport } from "../api/salaryAPI";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const Reports = () => {
  const [month, setMonth] = useState("");
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const generate = async () => {
    if (!month) { setError("Select a month."); return; }
    setLoading(true); setError(""); setSearched(false);
    try {
      const res = await getPayrollReport(month);
      setReport(res.data.data || []);
      setSearched(true);
    } catch (e) { setError(e.response?.data?.message || "Failed."); }
    finally { setLoading(false); }
  };

  const totalGross = report.reduce((s, r) => s + (r.grossSalary || 0), 0);
  const totalDed = report.reduce((s, r) => s + (r.totalDeduction || 0), 0);
  const totalNet = report.reduce((s, r) => s + (r.netSalary || 0), 0);

  /* Group by department */
  const deptGroups = {};
  report.forEach((r) => {
    const key = r.departmentCode || "Unknown";
    if (!deptGroups[key]) deptGroups[key] = { name: r.departmentName || key, total: 0, count: 0 };
    deptGroups[key].total += r.netSalary || 0;
    deptGroups[key].count += 1;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">📈 Payroll Reports</h1>
        <p className="page-subtitle">Generate and analyze monthly payroll data</p>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={month} onChange={(e) => { setMonth(e.target.value); setError(""); }}
                    className="input-field sm:w-56">
              <option value="">Select Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={generate} disabled={loading} className="btn-primary">
              {loading ? "Generating..." : "Generate Report"}
            </button>
            {report.length > 0 && (
              <button onClick={() => window.print()} className="btn-secondary">🖨️ Print</button>
            )}
          </div>
          {error && <p className="mt-2 text-red-600 text-sm">⚠️ {error}</p>}
        </div>
      </div>

      {/* Summary */}
      {searched && report.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Gross", val: totalGross, icon: "💼", cls: "bg-brand-50 text-brand-600" },
              { label: "Total Deductions", val: totalDed, icon: "➖", cls: "bg-red-50 text-red-600" },
              { label: "Total Net Salary", val: totalNet, icon: "✅", cls: "bg-blue-50 text-blue-600" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div>
                  <p className="text-xl font-bold text-panel-900">{s.val.toLocaleString()} RWF</p>
                  <p className="text-xs text-panel-500">{s.label} · {month}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Per-Department Breakdown */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title mb-0">Department Breakdown</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(deptGroups).map(([code, data]) => (
                  <div key={code} className="bg-panel-50 rounded-lg p-3">
                    <p className="text-xs text-panel-500">{data.name}</p>
                    <p className="text-lg font-bold text-panel-900 mt-0.5">
                      {data.total.toLocaleString()} <span className="text-xs text-panel-400 font-normal">RWF</span>
                    </p>
                    <p className="text-[10px] text-brand-600">{data.count} employee{data.count !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Report Table */}
      {searched && (
        <div className="card">
          <div className="card-header bg-brand-50/50">
            <div>
              <h2 className="text-sm font-bold text-panel-900">Payroll — {month}</h2>
              <p className="text-xs text-panel-500">SmartPark EPMS · {new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Kigali' })}</p>
            </div>
            <span className="badge-green">{report.length}</span>
          </div>

          {report.length === 0 ? (
            <div className="empty-state">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No records for <strong>{month}</strong></p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-head">
                    {["#","First Name","Last Name","Position","Department",
                      "Gross (RWF)","Deduction (RWF)","Net Salary (RWF)"].map(h => (
                      <th key={h} className="table-cell">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.map((r, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell text-panel-400">{i + 1}</td>
                      <td className="table-cell font-medium text-panel-900">{r.firstName}</td>
                      <td className="table-cell font-medium text-panel-900">{r.lastName}</td>
                      <td className="table-cell">{r.position}</td>
                      <td className="table-cell">
                        <span className="badge-green">
                          {r.departmentCode}{r.departmentName ? ` — ${r.departmentName}` : ""}
                        </span>
                      </td>
                      <td className="table-cell">{Number(r.grossSalary).toLocaleString()}</td>
                      <td className="table-cell text-red-600">-{Number(r.totalDeduction).toLocaleString()}</td>
                      <td className="table-cell font-bold text-brand-700">{Number(r.netSalary).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-panel-50 border-t-2 border-brand-200">
                    <td colSpan={5} className="table-cell font-bold text-right text-panel-700">TOTALS</td>
                    <td className="table-cell font-bold">{totalGross.toLocaleString()}</td>
                    <td className="table-cell font-bold text-red-600">-{totalDed.toLocaleString()}</td>
                    <td className="table-cell font-bold text-brand-700">{totalNet.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;