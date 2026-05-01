import React, { useState, useEffect, useCallback } from "react";
import {
  getAllDepartments, createDepartment,
  updateDepartment, deleteDepartment,
} from "../api/departmentAPI";
import Modal from "../components/Modal";
import {
  Building2, Plus, AlertCircle, CheckCircle2,
  Hash, Type, DollarSign, TrendingDown, Pencil,
  Trash2, X, Save,
} from "lucide-react";

const INITIAL = {
  departmentCode: "", departmentName: "",
  grossSalary: "", totalDeduction: "",
};

const Department = () => {
  const [form,     setForm]     = useState(INITIAL);
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [editId,   setEditId]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchDepts = useCallback(async () => {
    try {
      const r = await getAllDepartments();
      setList(r.data.data || []);
    } catch { setList([]); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.departmentCode.trim()) return "Code required.";
    if (!form.departmentName.trim()) return "Name required.";
    if (!form.grossSalary || +form.grossSalary <= 0) return "Valid gross salary required.";
    if (form.totalDeduction === "" || +form.totalDeduction < 0) return "Valid deduction required.";
    if (+form.totalDeduction >= +form.grossSalary) return "Deduction must be less than gross.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const payload = {
        departmentCode: form.departmentCode.toUpperCase().trim(),
        departmentName: form.departmentName.trim(),
        grossSalary: parseFloat(form.grossSalary),
        totalDeduction: parseFloat(form.totalDeduction),
      };
      if (editId) {
        await updateDepartment(editId, payload);
        setSuccess("Department updated successfully.");
      } else {
        await createDepartment(payload);
        setSuccess("Department created successfully.");
      }
      setForm(INITIAL);
      setEditId(null);
      setShowForm(false);
      fetchDepts();
    } catch (e) {
      setError(e.response?.data?.message || "Operation failed.");
    } finally { setLoading(false); }
  };

  const handleEdit = (dept) => {
    setEditId(dept._id);
    setForm({
      departmentCode: dept.departmentCode,
      departmentName: dept.departmentName,
      grossSalary:    String(dept.grossSalary),
      totalDeduction: String(dept.totalDeduction),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    try {
      await deleteDepartment(deleteId);
      setSuccess("Department deleted.");
      setDeleteId(null);
      fetchDepts();
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed.");
      setDeleteId(null);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(INITIAL);
    setShowForm(false);
    setError("");
  };

  const net = form.grossSalary && form.totalDeduction
    ? (parseFloat(form.grossSalary) - parseFloat(form.totalDeduction)).toLocaleString()
    : null;

  return (
    <div className="space-y-6 stagger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title"><Building2 size={22} /> Departments</h1>
          <p className="page-subtitle">Manage company departments and salary structures</p>
        </div>
        <button
          onClick={() => { if (showForm) cancelEdit(); else setShowForm(true); }}
          className={showForm ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
        >
          {showForm
            ? <><X size={14} /> Close</>
            : <><Plus size={14} /> New Department</>}
        </button>
      </div>

      {error && (
        <div className="alert-error">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={13} /></button>
        </div>
      )}
      {success && (
        <div className="alert-success">
          <CheckCircle2 size={14} /> {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className={`card animate-slide-down ${editId ? "border-brand-300" : ""}`}>
          <div className="card-header">
            <h2 className="section-title mb-0 flex items-center gap-1.5">
              {editId
                ? <><Pencil size={13} /> Edit Department</>
                : <><Plus size={13} /> Add Department</>}
            </h2>
            {editId && (
              <button onClick={cancelEdit} className="btn-ghost btn-sm">
                <X size={14} /> Cancel
              </button>
            )}
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Department Code</label>
                  <div className="relative">
                    <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                    <input name="departmentCode" value={form.departmentCode}
                           onChange={handleChange} placeholder="e.g. CW"
                           className="input-field pl-10"
                           disabled={!!editId} />
                  </div>
                  {editId && (
                    <p className="text-xs text-panel-400 mt-1">Code cannot be changed</p>
                  )}
                </div>
                <div>
                  <label className="label">Department Name</label>
                  <div className="relative">
                    <Type size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                    <input name="departmentName" value={form.departmentName}
                           onChange={handleChange} placeholder="e.g. Carwash"
                           className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label">Gross Salary (RWF)</label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                    <input type="number" name="grossSalary" value={form.grossSalary}
                           onChange={handleChange} placeholder="300000"
                           className="input-field pl-10" min="0" />
                  </div>
                </div>
                <div>
                  <label className="label">Total Deduction (RWF)</label>
                  <div className="relative">
                    <TrendingDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                    <input type="number" name="totalDeduction" value={form.totalDeduction}
                           onChange={handleChange} placeholder="20000"
                           className="input-field pl-10" min="0" />
                  </div>
                </div>
              </div>

              {net && (
                <div className="flex items-center justify-between px-4 py-3 rounded-lg
                                bg-brand-50 border border-brand-200 animate-fade-in">
                  <span className="text-xs text-panel-600 font-medium">Net Salary</span>
                  <span className="text-brand-700 font-bold">RWF {net}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Saving..." : (
                    <><Save size={14} /> {editId ? "Update Department" : "Create Department"}</>
                  )}
                </button>
                {editId && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      {fetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building2 size={40} className="mx-auto text-panel-300 mb-3" />
            <p className="text-sm font-medium text-panel-600">No departments yet</p>
            <p className="text-xs text-panel-400 mt-1">Click "New Department" to get started</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {list.map((d, i) => (
              <div key={d._id}
                   className={`card p-4 border-l-4 animate-slide-up
                               ${editId === d._id ? "border-l-brand-500 bg-brand-50/30" : "border-l-brand-300"}`}
                   style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="badge-green text-[10px] font-mono">{d.departmentCode}</span>
                    <p className="text-sm font-bold text-panel-900 mt-1 truncate">{d.departmentName}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-panel-500">Gross</span>
                    <span className="font-medium">{Number(d.grossSalary).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-panel-500">Deduction</span>
                    <span className="text-red-500">-{Number(d.totalDeduction).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-panel-100">
                    <span className="text-panel-600 font-semibold">Net</span>
                    <span className="font-bold text-brand-700">
                      {(d.grossSalary - d.totalDeduction).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3 pt-2 border-t border-panel-100">
                  <button onClick={() => handleEdit(d)}
                          className="btn-secondary btn-sm text-xs flex-1">
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(d._id)}
                          className="btn-danger-outline btn-sm text-xs flex-1">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table View */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title mb-0">Department Summary</h2>
              <span className="badge-green">{list.length} departments</span>
            </div>
            <div className="table-wrapper">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-head">
                    {["Code","Name","Gross (RWF)","Deduction","Net Salary","Actions"].map(h => (
                      <th key={h} className="table-cell">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((d, i) => (
                    <tr key={d._id}
                        className={`table-row ${editId === d._id ? "bg-brand-50" : ""}`}>
                      <td className="table-cell">
                        <span className="badge-green font-mono">{d.departmentCode}</span>
                      </td>
                      <td className="table-cell font-medium text-panel-900">{d.departmentName}</td>
                      <td className="table-cell">{Number(d.grossSalary).toLocaleString()}</td>
                      <td className="table-cell text-red-600">
                        -{Number(d.totalDeduction).toLocaleString()}
                      </td>
                      <td className="table-cell font-semibold text-brand-700">
                        {(d.grossSalary - d.totalDeduction).toLocaleString()} RWF
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(d)} className="btn-icon">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(d._id)}
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
          </div>
        </>
      )}

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center
                          justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-panel-900">Delete Department</h3>
            <p className="text-sm text-panel-500 mt-1">
              This cannot be undone. All employees in this department must be
              reassigned first.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Department;