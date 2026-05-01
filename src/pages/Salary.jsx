import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Trash2, Plus, X, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getAllSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
} from "../api/salaryAPI";
import { getAllEmployees } from "../api/employeeAPI";
import { getAllDepartments } from "../api/departmentAPI";
import Modal from "../components/Modal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const INITIAL_FORM_STATE = {
  employeeNumber: "",
  departmentCode: "",
  grossSalary: "",
  totalDeduction: "",
  month: "",
};

const Salary = () => {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showForm, setShowForm] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const [salariesRes, employeesRes, departmentsRes] = await Promise.all([
        getAllSalaries(),
        getAllEmployees(),
        getAllDepartments(),
      ]);
      setSalaries(salariesRes.data?.data || []);
      setEmployees(employeesRes.data?.data || []);
      setDepartments(departmentsRes.data?.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load data");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-fill salary fields when department is selected
  useEffect(() => {
    if (form.departmentCode && !editId) {
      const department = departments.find(d => d.departmentCode === form.departmentCode);
      if (department) {
        setForm(prev => ({
          ...prev,
          grossSalary: String(department.grossSalary || ""),
          totalDeduction: String(department.totalDeduction || ""),
        }));
      }
    }
  }, [form.departmentCode, departments, editId]);

  const handleChange = (e) => {
    setError("");
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!form.employeeNumber) return "Please select an employee";
      if (!form.departmentCode) return "Please select a department";
      return null;
    }
    if (step === 2) {
      if (!form.grossSalary || parseFloat(form.grossSalary) <= 0) {
        return "Gross salary must be greater than 0";
      }
      if (!form.totalDeduction || parseFloat(form.totalDeduction) < 0) {
        return "Total deduction cannot be negative";
      }
      if (parseFloat(form.totalDeduction) >= parseFloat(form.grossSalary)) {
        return "Deduction must be less than gross salary";
      }
      if (!form.month) return "Please select a month";
      return null;
    }
    return null;
  };

  const nextStep = () => {
    const errorMsg = validateStep(1);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setError("");
    setCurrentStep(2);
  };

  const previousStep = () => {
    setCurrentStep(1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateStep(2);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    const gross = parseFloat(form.grossSalary);
    const deduction = parseFloat(form.totalDeduction);
    const payload = {
      ...form,
      grossSalary: gross,
      totalDeduction: deduction,
      netSalary: gross - deduction,
    };

    setLoading(true);
    try {
      if (editId) {
        await updateSalary(editId, payload);
        setSuccess("Salary record updated successfully!");
        setEditId(null);
      } else {
        await createSalary(payload);
        setSuccess("Salary record created successfully!");
      }
      resetForm();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (salary) => {
    setEditId(salary._id);
    setForm({
      employeeNumber: salary.employeeNumber,
      departmentCode: salary.departmentCode,
      grossSalary: String(salary.grossSalary),
      totalDeduction: String(salary.totalDeduction),
      month: salary.month,
    });
    setShowForm(true);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    try {
      await deleteSalary(deleteId);
      setSuccess("Salary record deleted successfully!");
      setDeleteId(null);
      await fetchData();
    } catch (err) {
      setError("Failed to delete record. Please try again.");
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM_STATE);
    setEditId(null);
    setShowForm(false);
    setCurrentStep(1);
    setError("");
  };

  const cancelEdit = () => {
    resetForm();
  };

  const netSalary = useMemo(() => {
    if (form.grossSalary && form.totalDeduction) {
      const gross = parseFloat(form.grossSalary);
      const deduction = parseFloat(form.totalDeduction);
      if (!isNaN(gross) && !isNaN(deduction)) {
        return (gross - deduction).toLocaleString();
      }
    }
    return null;
  }, [form.grossSalary, form.totalDeduction]);

  const getEmployeeName = useCallback(
    (employeeNumber) => {
      const employee = employees.find(emp => emp.employeeNumber === employeeNumber);
      return employee ? `${employee.firstName} ${employee.lastName}` : employeeNumber;
    },
    [employees]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-panel-900">💰 Salary Management</h1>
          <p className="text-sm text-panel-500 mt-1">Process and manage employee salary records</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              cancelEdit();
            } else {
              setShowForm(true);
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            showForm
              ? "bg-panel-100 text-panel-700 hover:bg-panel-200"
              : "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
          }`}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close Form" : "New Record"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
          <span className="text-lg">✅</span>
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Multi-Step Form */}
      {showForm && (
        <div className={`bg-white rounded-xl shadow-sm border ${editId ? "border-brand-300 shadow-md" : "border-panel-200"}`}>
          <div className="flex items-center justify-between p-5 border-b border-panel-200">
            <h2 className="text-lg font-semibold text-panel-900">
              {editId ? "✏️ Edit Salary Record" : "➕ Add New Salary Record"}
            </h2>
            {editId && (
              <button onClick={cancelEdit} className="text-panel-400 hover:text-panel-600 transition">
                <X size={20} />
              </button>
            )}
          </div>

          {/* Steps Indicator */}
          <div className="px-5 pt-5">
            <div className="flex items-center">
              {[
                { number: 1, label: "Select Employee" },
                { number: 2, label: "Salary Details" },
              ].map((step, idx) => (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        currentStep === step.number
                          ? "bg-brand-600 text-white ring-4 ring-brand-100"
                          : currentStep > step.number
                          ? "bg-brand-100 text-brand-700"
                          : "bg-panel-100 text-panel-400"
                      }`}
                    >
                      {currentStep > step.number ? "✓" : step.number}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${
                      currentStep === step.number ? "text-brand-700" : "text-panel-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < 1 && (
                    <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all ${
                      currentStep > step.number ? "bg-brand-500" : "bg-panel-200"
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-panel-700 mb-2">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="employeeNumber"
                    value={form.employeeNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-panel-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp.employeeNumber}>
                        {emp.employeeNumber} — {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-panel-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="departmentCode"
                    value={form.departmentCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-panel-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept.departmentCode}>
                        {dept.departmentCode} — {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-panel-700 mb-2">
                      Gross Salary (RWF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="grossSalary"
                      value={form.grossSalary}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-panel-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-panel-700 mb-2">
                      Total Deduction (RWF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="totalDeduction"
                      value={form.totalDeduction}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-panel-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-panel-700 mb-2">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="month"
                      value={form.month}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-panel-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                      required
                    >
                      <option value="">Select Month</option>
                      {MONTHS.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {netSalary && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200">
                    <p className="text-xs text-panel-600 uppercase tracking-wide">Net Salary</p>
                    <p className="text-2xl font-bold text-brand-700">
                      RWF {netSalary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Form Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-panel-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={previousStep}
                  className="inline-flex items-center gap-2 px-4 py-2 text-panel-700 bg-panel-100 rounded-lg hover:bg-panel-200 transition font-medium"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
              ) : (
                <div />
              )}
              
              <span className="text-xs text-panel-400">Step {currentStep} of 2</span>
              
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : editId ? "Update Record" : "Create Record"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-panel-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-panel-200">
          <h2 className="text-lg font-semibold text-panel-900">Salary Records</h2>
          <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
            {salaries.length} Records
          </span>
        </div>
        
        {fetching ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-panel-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">💰</div>
            <p className="text-panel-500">No salary records found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-brand-600 hover:text-brand-700 font-medium"
            >
              Create your first record →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-panel-50 border-b border-panel-200">
                <tr>
                  {["Employee ID", "Name", "Dept", "Gross", "Deduction", "Net", "Month", "Actions"].map(header => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-panel-600 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-200">
                {salaries.map((salary) => (
                  <tr key={salary._id} className={`hover:bg-panel-50 transition ${editId === salary._id ? "bg-brand-50" : ""}`}>
                    <td className="px-4 py-3 text-sm font-mono text-brand-700">
                      {salary.employeeNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-panel-900">
                      {getEmployeeName(salary.employeeNumber)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-panel-100 text-panel-700 rounded">
                        {salary.departmentCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">RWF {salary.grossSalary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-red-600">-RWF {salary.totalDeduction.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-700">
                      RWF {salary.netSalary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-panel-600">{salary.month}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(salary)}
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(salary._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-panel-900 mb-1">Delete Salary Record</h3>
            <p className="text-sm text-panel-500">
              Are you sure you want to delete this salary record? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-panel-700 bg-panel-100 rounded-lg hover:bg-panel-200 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Salary;