import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllEmployees } from "../api/employeeAPI";
import { getAllSalaries } from "../api/salaryAPI";
import { getAllDepartments } from "../api/departmentAPI";
import RealtimeClock from "../components/RealtimeClock";
import { formatDistanceToNow } from "date-fns";
import {
  User, Wallet, Building2, Calendar, Phone, MapPin,
  Hash, ArrowRight, TrendingUp,
} from "lucide-react";

const EmployeePortal = () => {
  const { user } = useAuth();
  const [profile,     setProfile]     = useState(null);
  const [salaries,    setSalaries]    = useState([]);
  const [department,  setDepartment]  = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empNo = user?.username;
        const [empRes, salRes, depRes] = await Promise.all([
          getAllEmployees(),
          getAllSalaries(),
          getAllDepartments(),
        ]);

        const employees = empRes.data.data || [];
        const me = employees.find(
          (e) => e.employeeNumber === empNo?.toUpperCase()
        );
        setProfile(me || null);

        if (me) {
          const mySals = (salRes.data.data || []).filter(
            (s) => s.employeeNumber === me.employeeNumber
          );
          setSalaries(mySals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

          const dept = (depRes.data.data || []).find(
            (d) => d.departmentCode === me.departmentCode
          );
          setDepartment(dept || null);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [user?.username]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card">
        <div className="empty-state">
          <User size={40} className="mx-auto text-panel-300 mb-3" />
          <p className="text-sm font-medium text-panel-600">Profile not found</p>
          <p className="text-xs text-panel-400 mt-1">
            Contact HR to set up your account
          </p>
        </div>
      </div>
    );
  }

  const totalNet = salaries.reduce((s, r) => s + (r.netSalary || 0), 0);

  return (
    <div className="space-y-5 stagger">
      {/* Header with clock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="card p-5 border-l-4 border-l-brand-500 h-full flex flex-col justify-center">
            <p className="text-xs text-brand-600 font-semibold uppercase mb-1">Employee Portal</p>
            <h1 className="text-xl font-bold text-panel-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-panel-500 text-sm mt-0.5">
              {profile.position} · {profile.departmentCode}
            </p>
            <span className="badge-green mt-2 w-fit">{profile.employeeNumber}</span>
          </div>
        </div>
        <RealtimeClock variant="employee" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Salary Records", value: salaries.length,
            Icon: Wallet, iconBg: "bg-amber-100 text-amber-600",
          },
          {
            label: "Total Earned", value: `${totalNet.toLocaleString()} RWF`,
            Icon: TrendingUp, iconBg: "bg-brand-100 text-brand-600",
          },
          {
            label: "Department",
            value: department?.departmentName || profile.departmentCode,
            Icon: Building2, iconBg: "bg-blue-100 text-blue-600",
          },
        ].map((c) => (
          <div key={c.label} className="stat-card">
            <div className={`stat-icon ${c.iconBg}`}><c.Icon size={20} /></div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-panel-900 truncate">{c.value}</p>
              <p className="text-xs text-panel-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Profile */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="section-title mb-0 flex items-center gap-1.5">
                <User size={14} /> My Profile
              </h2>
            </div>
            <div className="card-body space-y-3">
              {/* Avatar */}
              <div className="flex items-center gap-3 pb-3 border-b border-panel-100">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center
                                 text-xl font-bold ${
                                   profile.gender === "Male"
                                     ? "bg-blue-100 text-blue-700"
                                     : "bg-pink-100 text-pink-700"
                                 }`}>
                  {profile.firstName[0]}{profile.lastName[0]}
                </div>
                <div>
                  <p className="font-bold text-panel-900">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-sm text-panel-500">{profile.position}</p>
                </div>
              </div>

              {/* Details */}
              {[
                { Icon: Hash,      label: "Employee No",  value: profile.employeeNumber },
                { Icon: Building2, label: "Department",   value: `${profile.departmentCode} — ${department?.departmentName || ""}` },
                { Icon: Phone,     label: "Telephone",    value: profile.telephone },
                { Icon: MapPin,    label: "Address",      value: profile.address },
                { Icon: User,      label: "Gender",       value: profile.gender },
                { Icon: Calendar,  label: "Hired Date",   value: profile.hiredDate?.slice(0, 10) },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-panel-100 flex items-center
                                  justify-center flex-shrink-0">
                    <item.Icon size={14} className="text-panel-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-panel-400">{item.label}</p>
                    <p className="font-medium text-panel-800 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Salary History */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-header">
              <h2 className="section-title mb-0 flex items-center gap-1.5">
                <Wallet size={14} /> Salary History
              </h2>
              <span className="badge-green">{salaries.length} records</span>
            </div>

            {salaries.length === 0 ? (
              <div className="empty-state">
                <Wallet size={30} className="mx-auto text-panel-300 mb-2" />
                <p className="text-sm text-panel-500">No salary records yet</p>
              </div>
            ) : (
              <div className="divide-y divide-panel-100">
                {salaries.map((sal) => (
                  <div key={sal._id}
                       className="flex items-center justify-between px-5 py-3
                                  hover:bg-panel-50 transition-colors duration-100">
                    <div>
                      <p className="text-sm font-semibold text-panel-900">{sal.month} {sal.year}</p>
                      <div className="flex items-center gap-2 text-xs text-panel-500 mt-0.5">
                        <span>Gross: {Number(sal.grossSalary).toLocaleString()}</span>
                        <span>·</span>
                        <span className="text-red-500">-{Number(sal.totalDeduction).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-700">
                        {Number(sal.netSalary).toLocaleString()} RWF
                      </p>
                      <p className="text-[10px] text-panel-400">
                        {formatDistanceToNow(new Date(sal.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;