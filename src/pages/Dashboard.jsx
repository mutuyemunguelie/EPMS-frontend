import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEmployees } from "../api/employeeAPI";
import { getAllDepartments } from "../api/departmentAPI";
import { getAllSalaries } from "../api/salaryAPI";
import { useAuth } from "../context/AuthContext";
import RealtimeClock from "../components/RealtimeClock";
import {
  Building2, Users, Wallet, BarChart3, UserPlus, CreditCard,
  TrendingUp, ArrowRight, MessageCircle, Activity,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ employees: 0, departments: 0, salaries: 0 });
  const [recentEmps, setRecentEmps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [emp, dep, sal] = await Promise.all([
          getAllEmployees(), getAllDepartments(), getAllSalaries(),
        ]);
        const emps = emp.data.data || [];
        setStats({
          employees: emps.length,
          departments: dep.data.data?.length || 0,
          salaries: sal.data.data?.length || 0,
        });
        setRecentEmps(emps.slice(0, 5));
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const clockVariant = user?.role === "admin" ? "admin" : user?.role === "hr" ? "hr" : "employee";

  const statCards = [
    { label: "Departments", value: stats.departments, Icon: Building2,
      iconBg: "bg-brand-100 text-brand-600", to: "/department" },
    { label: "Employees", value: stats.employees, Icon: Users,
      iconBg: "bg-blue-100 text-blue-600", to: "/employee" },
    { label: "Salary Records", value: stats.salaries, Icon: Wallet,
      iconBg: "bg-amber-100 text-amber-600", to: "/salary" },
    { label: "Reports", value: "→", Icon: BarChart3,
      iconBg: "bg-purple-100 text-purple-600", to: "/reports" },
  ];

  const quickActions = [
    { to: "/employee", label: "Register Employee", Icon: UserPlus,
      desc: "Add new staff", color: "text-brand-600 bg-brand-50" },
    { to: "/salary", label: "Record Salary", Icon: CreditCard,
      desc: "Process pay", color: "text-amber-600 bg-amber-50" },
    { to: "/reports", label: "Payroll Report", Icon: TrendingUp,
      desc: "Generate report", color: "text-purple-600 bg-purple-50" },
    { to: "/messages", label: "Messages", Icon: MessageCircle,
      desc: "Send message", color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="space-y-6 stagger">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="card p-5 border-l-4 border-l-brand-500 h-full flex flex-col justify-center">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={16} className="text-brand-500" />
                  <span className="text-xs text-brand-600 font-semibold uppercase">Dashboard</span>
                </div>
                <h1 className="text-xl font-bold text-panel-900">
                  Welcome back, {user?.username}
                </h1>
                <p className="text-panel-500 text-sm mt-0.5">
                  SmartPark Employee Payroll Management System
                </p>
              </div>
              <Link to="/employee" className="btn-primary btn-sm">
                <UserPlus size={14} /> Add Employee
              </Link>
            </div>
          </div>
        </div>
        <RealtimeClock variant={clockVariant} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((c) => (
          <Link key={c.label} to={c.to} className="group">
            <div className="stat-card group-hover:shadow-card-md transition-all duration-200
                            group-hover:border-brand-200">
              <div className={`stat-icon ${c.iconBg}`}><c.Icon size={20} /></div>
              <div className="flex-1 min-w-0">
                {loading
                  ? <div className="skeleton h-7 w-12 mb-1" />
                  : <p className="text-2xl font-bold text-panel-900">{c.value}</p>}
                <p className="text-xs text-panel-500 font-medium truncate">{c.label}</p>
              </div>
              <ArrowRight size={14} className="text-panel-300 group-hover:text-brand-500
                                               group-hover:translate-x-0.5 transition-all duration-200
                                               hidden sm:block" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="card-header">
              <h2 className="section-title mb-0">Quick Actions</h2>
            </div>
            <div className="card-body space-y-2">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.to}
                      className="flex items-center gap-3 p-3 rounded-lg border border-panel-100
                                 hover:border-brand-200 hover:bg-brand-50/20
                                 transition-all duration-150 group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                                   flex-shrink-0 ${a.color}`}>
                    <a.Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-panel-800
                                  group-hover:text-brand-700 transition-colors">{a.label}</p>
                    <p className="text-xs text-panel-400">{a.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-panel-300 flex-shrink-0
                                                   group-hover:text-brand-500
                                                   group-hover:translate-x-0.5 transition-all duration-150" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Employees */}
        <div className="lg:col-span-3">
          <div className="card h-full">
            <div className="card-header">
              <h2 className="section-title mb-0">Recent Employees</h2>
              <Link to="/employee" className="text-xs text-brand-600 hover:text-brand-700 font-medium
                                              flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="card-body space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
              </div>
            ) : recentEmps.length === 0 ? (
              <div className="card-body">
                <div className="empty-state py-8">
                  <Users size={30} className="mx-auto text-panel-300 mb-2" />
                  <p className="text-sm text-panel-500">No employees yet</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-panel-100">
                {recentEmps.map((emp) => (
                  <div key={emp._id} className="flex items-center gap-3 px-5 py-3
                                                hover:bg-panel-50 transition-colors duration-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                    ${emp.gender === "Male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-panel-900 truncate">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-panel-500">{emp.position}</p>
                    </div>
                    <span className="badge-green text-[10px] hidden sm:inline-flex">{emp.departmentCode}</span>
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

export default Dashboard;