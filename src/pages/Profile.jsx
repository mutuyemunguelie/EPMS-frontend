import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/authAPI";
import { getAllEmployees } from "../api/employeeAPI";
import { getAllSalaries } from "../api/salaryAPI";
import { getAllDepartments } from "../api/departmentAPI";
import RealtimeClock from "../components/RealtimeClock";
import { formatDistanceToNow } from "date-fns";
import {
  User, Shield, Users, Wallet, Building2, Phone,
  MapPin, Calendar, Hash, CheckCircle2, Clock,
  TrendingUp, Briefcase,
} from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [empData, setEmpData] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const meRes = await getMe();
        setProfile(meRes.data.data);

        /* If employee, also get employee record */
        if (user?.role === "employee" || meRes.data.data?.employeeNumber) {
          const empNo = user?.employeeNumber || meRes.data.data?.employeeNumber;
          if (empNo) {
            const [empRes, salRes, depRes] = await Promise.all([
              getAllEmployees(),
              getAllSalaries(),
              getAllDepartments(),
            ]);
            const emp = (empRes.data.data || []).find(
              (e) => e.employeeNumber === empNo.toUpperCase()
            );
            setEmpData(emp || null);

            if (emp) {
              const mySals = (salRes.data.data || []).filter(
                (s) => s.employeeNumber === emp.employeeNumber
              );
              setSalaries(mySals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

              const dept = (depRes.data.data || []).find(
                (d) => d.departmentCode === emp.departmentCode
              );
              setDepartment(dept || null);
            }
          }
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [user?.role, user?.employeeNumber]);

  const clockVariant =
    user?.role === "admin" ? "admin"
    : user?.role === "hr" ? "hr"
    : "employee";

  const roleConfig = {
    admin: { icon: Shield, color: "bg-brand-100 text-brand-700", label: "Administrator" },
    hr:    { icon: Users, color: "bg-blue-100 text-blue-700",    label: "HR Staff" },
    employee: { icon: Briefcase, color: "bg-purple-100 text-purple-700", label: "Employee" },
  };

  const rc = roleConfig[user?.role] || roleConfig.employee;
  const RIcon = rc.icon;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 stagger">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="card p-5 border-l-4 border-l-brand-500 h-full">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                               text-2xl font-bold flex-shrink-0 ${rc.color}`}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-panel-900">
                    {empData
                      ? `${empData.firstName} ${empData.lastName}`
                      : user?.username}
                  </h1>
                  <span className={`badge ${rc.color} border-0`}>
                    <RIcon size={11} /> {rc.label}
                  </span>
                </div>
                <p className="text-panel-500 text-sm">
                  @{user?.username}
                  {user?.employeeNumber && (
                    <span className="ml-2 font-mono text-brand-600">
                      #{user.employeeNumber}
                    </span>
                  )}
                </p>
                <p className="text-xs text-panel-400 mt-1">
                  Member since{" "}
                  {profile?.createdAt
                    ? formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <RealtimeClock variant={clockVariant} />
      </div>

      {/* System Account Info */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title mb-0 flex items-center gap-1.5">
            <User size={14} /> Account Information
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: User, label: "Username", value: user?.username },
              { icon: Shield, label: "Role", value: rc.label },
              {
                icon: CheckCircle2,
                label: "Status",
                value: profile?.isActive ? "Active" : "Inactive",
              },
              {
                icon: Clock,
                label: "Last Seen",
                value: profile?.lastSeen
                  ? formatDistanceToNow(new Date(profile.lastSeen), { addSuffix: true })
                  : "N/A",
              },
              ...(user?.employeeNumber
                ? [{ icon: Hash, label: "Employee No.", value: user.employeeNumber }]
                : []),
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-panel-100 flex items-center
                                justify-center flex-shrink-0">
                  <item.icon size={14} className="text-panel-500" />
                </div>
                <div>
                  <p className="text-xs text-panel-400">{item.label}</p>
                  <p className="font-medium text-panel-800 text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions */}
          {profile?.permissions && (
            <div className="mt-4 pt-4 border-t border-panel-100">
              <p className="text-xs font-semibold text-panel-500 uppercase mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "canViewOtherDepts", label: "View Other Depts" },
                  { key: "canViewAllEmployees", label: "View All Employees" },
                  { key: "canCrossDeptChat", label: "Cross-Dept Chat" },
                ].map((p) => (
                  <span key={p.key}
                        className={profile.permissions[p.key] ? "badge-green" : "badge-gray"}>
                    {profile.permissions[p.key] ? "✓" : "✗"} {p.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Info — only for employees */}
      {empData && (
        <div className="card">
          <div className="card-header">
            <h2 className="section-title mb-0 flex items-center gap-1.5">
              <Briefcase size={14} /> Employee Record
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Hash,      label: "Employee No",  value: empData.employeeNumber },
                { icon: Briefcase, label: "Position",     value: empData.position },
                { icon: Building2, label: "Department",   value: `${empData.departmentCode}${department ? ` — ${department.departmentName}` : ""}` },
                { icon: Phone,     label: "Telephone",    value: empData.telephone },
                { icon: MapPin,    label: "Address",      value: empData.address },
                { icon: User,      label: "Gender",       value: empData.gender },
                { icon: Calendar,  label: "Hired Date",   value: empData.hiredDate?.slice(0, 10) },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-panel-100 flex items-center
                                  justify-center flex-shrink-0">
                    <item.icon size={14} className="text-panel-500" />
                  </div>
                  <div>
                    <p className="text-xs text-panel-400">{item.label}</p>
                    <p className="font-medium text-panel-800 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Department Salary Info */}
            {department && (
              <div className="mt-4 pt-4 border-t border-panel-100">
                <p className="text-xs font-semibold text-panel-500 uppercase mb-2">
                  Department Salary Structure
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Gross", value: department.grossSalary, color: "text-panel-900" },
                    { label: "Deduction", value: department.totalDeduction, color: "text-red-600" },
                    { label: "Net", value: department.netSalary, color: "text-brand-700" },
                  ].map((s) => (
                    <div key={s.label} className="bg-panel-50 rounded-lg p-3">
                      <p className="text-xs text-panel-400">{s.label}</p>
                      <p className={`font-bold text-sm ${s.color}`}>
                        {Number(s.value).toLocaleString()} RWF
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salary History — employees only */}
      {salaries.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="section-title mb-0 flex items-center gap-1.5">
              <Wallet size={14} /> Salary History
            </h2>
            <span className="badge-green">{salaries.length} records</span>
          </div>
          <div className="divide-y divide-panel-100">
            {salaries.map((sal) => (
              <div key={sal._id}
                   className="flex items-center justify-between px-5 py-3
                              hover:bg-panel-50 transition-colors duration-100">
                <div>
                  <p className="text-sm font-semibold text-panel-900">
                    {sal.month} {sal.year}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-panel-500 mt-0.5">
                    <span>Gross: {Number(sal.grossSalary).toLocaleString()}</span>
                    <span>·</span>
                    <span className="text-red-500">
                      -{Number(sal.totalDeduction).toLocaleString()}
                    </span>
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
          <div className="px-5 py-3 border-t border-panel-100 bg-panel-50 flex justify-between">
            <span className="text-xs text-panel-500 font-medium">Total Earned</span>
            <span className="text-sm font-bold text-brand-700">
              {salaries.reduce((s, r) => s + (r.netSalary || 0), 0).toLocaleString()} RWF
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;