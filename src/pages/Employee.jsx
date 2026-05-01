import React, { useState, useEffect, useMemo } from "react";
import {
  getAllEmployees, createEmployee, updateEmployee, deleteEmployee,
} from "../api/employeeAPI";
import Modal from "../components/Modal";
import { getAllDepartments } from "../api/departmentAPI";
import { useSocket } from "../context/SocketContext";
import {
  Users, Plus, X, Search, LayoutGrid, List, Eye, Pencil, Trash2,
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Phone,
  MapPin, Calendar, UserCircle, Building2, Hash, Filter,
} from "lucide-react";

const INITIAL = {
  employeeNumber: "", firstName: "", lastName: "",
  position: "", address: "", telephone: "", gender: "",
  hiredDate: "", departmentCode: "",
};

const Employee = () => {
  const [form, setForm] = useState(INITIAL);
  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const [filterDept, setFilterDept] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [detailEmp, setDetailEmp] = useState(null);

  const { socket } = useSocket();

useEffect(() => {
  if (!socket) return;

  const handler = ({ employeeNumber }) => {
    setSuccess(
      `✅ Admin approved deletion of ${employeeNumber}. You can now delete this employee.`
    );
    /* Refresh list so delete button works */
    fetchData();
  };

  socket.on("delete_permission_approved", handler);
  return () => socket.off("delete_permission_approved", handler);
}, [socket]);

  const fetchData = async () => {
    try {
      const [empR, depR] = await Promise.all([getAllEmployees(), getAllDepartments()]);
      setList(empR.data.data || []);
      setDepartments(depR.data.data || []);
    } catch { setList([]); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(""), 5000); return () => clearTimeout(t); } }, [error]);

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!form.employeeNumber.trim()) return "Employee number required.";
      if (!form.firstName.trim()) return "First name required.";
      if (!form.lastName.trim()) return "Last name required.";
    }
    if (s === 2) {
      if (!form.position.trim()) return "Position required.";
      if (!form.address.trim()) return "Address required.";
      if (!form.telephone.trim()) return "Telephone required.";
      if (!/^\d{10}$/.test(form.telephone)) return "Telephone: 10 digits.";
    }
    if (s === 3) {
      if (!form.gender) return "Gender required.";
      if (!form.hiredDate) return "Hired date required.";
      if (!form.departmentCode) return "Department required.";
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(""); setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => { setError(""); setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep(3);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      if (editId) {
        await updateEmployee(editId, form);
        setSuccess("Employee updated."); setEditId(null);
      } else {
        await createEmployee(form);
        setSuccess("Employee registered.");
      }
      setForm(INITIAL); setShowForm(false); setStep(1); fetchData();
    } catch (e) { setError(e.response?.data?.message || "Failed."); }
    finally { setLoading(false); }
  };

  const handleEdit = (emp) => {
    setEditId(emp._id);
    setForm({
      employeeNumber: emp.employeeNumber, firstName: emp.firstName,
      lastName: emp.lastName, position: emp.position, address: emp.address,
      telephone: emp.telephone, gender: emp.gender,
      hiredDate: emp.hiredDate?.slice(0, 10) || "", departmentCode: emp.departmentCode,
    });
    setShowForm(true); setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee(deleteId);
      setSuccess("Employee deleted."); setDeleteId(null);
      if (detailEmp?._id === deleteId) setDetailEmp(null);
      fetchData();
    } catch { setError("Delete failed."); setDeleteId(null); }
  };

  const cancelEdit = () => {
    setEditId(null); setForm(INITIAL); setShowForm(false); setStep(1); setError("");
  };

  const filtered = useMemo(() => {
    return list.filter((e) => {
      const ms = `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.position}`
        .toLowerCase().includes(search.toLowerCase());
      const md = !filterDept || e.departmentCode === filterDept;
      const mg = !filterGender || e.gender === filterGender;
      return ms && md && mg;
    });
  }, [list, search, filterDept, filterGender]);

  const deptCounts = useMemo(() => {
    const c = {};
    list.forEach(e => { c[e.departmentCode] = (c[e.departmentCode] || 0) + 1; });
    return c;
  }, [list]);

  const getDeptName = (code) => departments.find(d => d.departmentCode === code)?.departmentName || code;

  const stepLabels = ["Personal Info", "Contact & Role", "Assignment"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title"><Users size={22} /> Employees</h1>
          <p className="page-subtitle">
            {list.length} employees · {departments.length} departments
          </p>
        </div>
        <button
          onClick={() => { if (showForm) cancelEdit(); else setShowForm(true); }}
          className={showForm ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
        >
          {showForm ? <><X size={14} /> Close</> : <><Plus size={14} /> New Employee</>}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-error">
          <AlertCircle size={14} />{error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}
      {success && <div className="alert-success"><CheckCircle2 size={14} />{success}</div>}

      {/* Department Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <button onClick={() => setFilterDept("")}
                className={`card p-3 text-left transition-all duration-150 hover:shadow-card-md ${
                  !filterDept ? "border-brand-500 bg-brand-50 shadow-card-md" : ""}`}>
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-panel-400" />
            <p className="text-xs text-panel-500 font-medium">All</p>
          </div>
          <p className="text-lg font-bold text-panel-900 mt-1">{list.length}</p>
        </button>
        {departments.map((d) => (
          <button key={d._id}
                  onClick={() => setFilterDept(filterDept === d.departmentCode ? "" : d.departmentCode)}
                  className={`card p-3 text-left transition-all duration-150 hover:shadow-card-md ${
                    filterDept === d.departmentCode ? "border-brand-500 bg-brand-50 shadow-card-md" : ""}`}>
            <div className="flex items-center gap-2">
              <Building2 size={12} className="text-brand-500" />
              <p className="text-xs text-panel-500 font-medium truncate">{d.departmentName}</p>
            </div>
            <p className="text-lg font-bold text-panel-900 mt-1">{deptCounts[d.departmentCode] || 0}</p>
            <p className="text-[10px] text-brand-600 font-mono">{d.departmentCode}</p>
          </button>
        ))}
      </div>

      {/* Multi-Step Form */}
      {showForm && (
        <div className="card animate-slide-down">
          <div className="card-header">
            <h2 className="section-title mb-0 flex items-center gap-1.5">
              {editId ? <><Pencil size={13} /> Edit Employee</> : <><Plus size={13} /> Register Employee</>}
            </h2>
            {editId && <button onClick={cancelEdit} className="btn-ghost btn-sm"><X size={14} /></button>}
          </div>

          {/* Stepper */}
          <div className="px-5 pt-4">
            <div className="flex items-center gap-1">
              {stepLabels.map((label, i) => {
                const num = i + 1;
                const active = step === num;
                const done = step > num;
                return (
                  <React.Fragment key={num}>
                    <button
                      type="button"
                      onClick={() => { if (done) setStep(num); }}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                       transition-all duration-200
                                       ${done ? "bg-brand-600 text-white"
                                         : active ? "bg-brand-100 text-brand-700 border-2 border-brand-500 shadow-sm"
                                         : "bg-panel-100 text-panel-400 border border-panel-200"}`}>
                        {done ? <CheckCircle2 size={14} /> : num}
                      </div>
                      <span className={`text-xs font-medium hidden sm:inline transition-colors duration-150 ${
                        active ? "text-brand-700" : done ? "text-brand-600" : "text-panel-400"
                      }`}>{label}</span>
                    </button>
                    {num < 3 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded transition-colors duration-200 ${
                        done ? "bg-brand-500" : "bg-panel-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="animate-fade-in" key={step}>
                {step === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Employee Number</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                        <input name="employeeNumber" value={form.employeeNumber}
                               onChange={handleChange} placeholder="EMP005"
                               className="input-field pl-10" disabled={!!editId} />
                      </div>
                    </div>
                    <div>
                      <label className="label">First Name</label>
                      <div className="relative">
                        <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                        <input name="firstName" value={form.firstName}
                               onChange={handleChange} placeholder="John"
                               className="input-field pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Last Name</label>
                      <div className="relative">
                        <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                        <input name="lastName" value={form.lastName}
                               onChange={handleChange} placeholder="Doe"
                               className="input-field pl-10" />
                      </div>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Position</label>
                      <input name="position" value={form.position}
                             onChange={handleChange} placeholder="Manager"
                             className="input-field" />
                    </div>
                    <div>
                      <label className="label">Address</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                        <input name="address" value={form.address}
                               onChange={handleChange} placeholder="Kigali"
                               className="input-field pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Telephone</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                        <input type="tel" name="telephone" value={form.telephone}
                               onChange={handleChange} placeholder="0781234567"
                               className="input-field pl-10" />
                      </div>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Gender</label>
                      <select name="gender" value={form.gender}
                              onChange={handleChange} className="input-field">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Hired Date</label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                        <input type="date" name="hiredDate" value={form.hiredDate}
                               onChange={handleChange} className="input-field pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Department</label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                        <select name="departmentCode" value={form.departmentCode}
                                onChange={handleChange} className="input-field pl-10">
                          <option value="">Select</option>
                          {departments.map(d => (
                            <option key={d._id} value={d.departmentCode}>
                              {d.departmentCode} — {d.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-panel-100">
                <button type="button" onClick={prevStep} disabled={step === 1}
                        className="btn-secondary btn-sm">
                  <ChevronLeft size={14} /> Previous
                </button>
                <div className="flex gap-1">
                  {[1, 2, 3].map(n => (
                    <div key={n} className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      step === n ? "bg-brand-600" : step > n ? "bg-brand-300" : "bg-panel-200"
                    }`} />
                  ))}
                </div>
                {step < 3 ? (
                  <button type="button" onClick={nextStep} className="btn-primary btn-sm">
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="btn-primary btn-sm">
                    {loading ? "Saving..." : editId ? "Update" : "Register"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="card">
        <div className="card-body py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                <input type="search" placeholder="Search employees..."
                       value={search} onChange={(e) => setSearch(e.target.value)}
                       className="input-field pl-10 text-sm" />
              </div>
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
                      className="input-field w-auto text-sm">
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="flex items-center gap-0.5 bg-panel-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode("list")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium
                                  transition-all duration-150
                                  ${viewMode === "list"
                                    ? "bg-white shadow-sm text-panel-900"
                                    : "text-panel-500 hover:text-panel-700"}`}>
                <List size={13} /> List
              </button>
              <button onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium
                                  transition-all duration-150
                                  ${viewMode === "grid"
                                    ? "bg-white shadow-sm text-panel-900"
                                    : "text-panel-500 hover:text-panel-700"}`}>
                <LayoutGrid size={13} /> Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {fetching ? (
        <div className="card card-body space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={40} className="mx-auto text-panel-300 mb-3" />
            <p className="text-sm font-medium text-panel-600">
              {search || filterDept || filterGender ? "No employees match" : "No employees yet"}
            </p>
            <p className="text-xs text-panel-400 mt-1">
              {search || filterDept || filterGender
                ? "Try adjusting filters" : "Click \"+ New Employee\" to start"}
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((emp) => (
            <div key={emp._id}
                 className={`card hover:shadow-card-md transition-all duration-200 ${
                   editId === emp._id ? "border-brand-400" : ""}`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                    text-sm font-bold ${emp.gender === "Male"
                                      ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-panel-900 text-sm">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-panel-500">{emp.position}</p>
                    </div>
                  </div>
                  <span className="badge-green text-[10px]">{emp.departmentCode}</span>
                </div>

                <div className="space-y-1.5 text-xs text-panel-500 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Hash size={11} /> ID</span>
                    <span className="font-mono text-brand-700">{emp.employeeNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Phone size={11} /> Phone</span>
                    <span className="text-panel-700">{emp.telephone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><MapPin size={11} /> Address</span>
                    <span className="text-panel-700">{emp.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Calendar size={11} /> Hired</span>
                    <span className="text-panel-700">{emp.hiredDate?.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-panel-100">
                  <button onClick={() => setDetailEmp(emp)}
                          className="btn-ghost btn-sm flex-1 text-xs"><Eye size={12} /> View</button>
                  <button onClick={() => handleEdit(emp)}
                          className="btn-secondary btn-sm flex-1 text-xs"><Pencil size={12} /> Edit</button>
                  <button onClick={() => setDeleteId(emp._id)}
                          className="btn-danger-outline btn-sm flex-1 text-xs"><Trash2 size={12} /> Del</button>
                </div>
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
                  {["Emp No","Name","Position","Tel","Gender","Dept","Hired","Actions"].map(h => (
                    <th key={h} className="table-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp._id}
                      className={`table-row ${editId === emp._id ? "bg-brand-50" : ""}`}>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-brand-700 font-medium">{emp.employeeNumber}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                                        ${emp.gender === "Male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <span className="font-medium text-panel-900 text-sm">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-panel-600">{emp.position}</td>
                    <td className="table-cell text-panel-500 text-xs">{emp.telephone}</td>
                    <td className="table-cell">
                      <span className={emp.gender === "Male" ? "badge-blue" : "badge-pink"}>{emp.gender}</span>
                    </td>
                    <td className="table-cell"><span className="badge-green">{emp.departmentCode}</span></td>
                    <td className="table-cell text-panel-400 text-xs">{emp.hiredDate?.slice(0, 10)}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => setDetailEmp(emp)} className="btn-icon"><Eye size={14} /></button>
                        <button onClick={() => handleEdit(emp)} className="btn-icon"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteId(emp._id)}
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
            Showing {filtered.length} of {list.length} employees
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEmp && (
        <div className="modal-overlay" onClick={() => setDetailEmp(null)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                                ${detailEmp.gender === "Male"
                                  ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                  {detailEmp.firstName[0]}{detailEmp.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-panel-900">
                    {detailEmp.firstName} {detailEmp.lastName}
                  </h3>
                  <p className="text-sm text-panel-500">{detailEmp.position}</p>
                </div>
              </div>
              <button onClick={() => setDetailEmp(null)} className="btn-icon"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: Hash, label: "Employee No", value: detailEmp.employeeNumber },
                { icon: Building2, label: "Department", value: `${detailEmp.departmentCode} — ${getDeptName(detailEmp.departmentCode)}` },
                { icon: Phone, label: "Telephone", value: detailEmp.telephone },
                { icon: MapPin, label: "Address", value: detailEmp.address },
                { icon: UserCircle, label: "Gender", value: detailEmp.gender },
                { icon: Calendar, label: "Hired Date", value: detailEmp.hiredDate?.slice(0, 10) },
              ].map((item) => (
                <div key={item.label} className="bg-panel-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <item.icon size={12} className="text-panel-400" />
                    <p className="text-xs text-panel-400">{item.label}</p>
                  </div>
                  <p className="font-medium text-panel-800">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { handleEdit(detailEmp); setDetailEmp(null); }}
                      className="btn-primary btn-sm flex-1">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => { setDeleteId(detailEmp._id); setDetailEmp(null); }}
                      className="btn-danger-outline btn-sm flex-1">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

{/* Delete Modal — replace old one */}
<Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center
                    justify-center flex-shrink-0">
      <AlertCircle className="text-red-600" size={20} />
    </div>
    <div>
      <h3 className="text-base font-bold text-panel-900">Delete Employee</h3>
      <p className="text-sm text-panel-500 mt-1">
        This action cannot be undone. All related salary records may be affected.
      </p>
    </div>
  </div>
  <div className="flex gap-3 mt-5 justify-end">
    <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
    <button onClick={handleDelete} className="btn-danger">
      <Trash2 size={14} /> Delete Permanently
    </button>
  </div>
</Modal>


    </div>
  );
};

export default Employee;