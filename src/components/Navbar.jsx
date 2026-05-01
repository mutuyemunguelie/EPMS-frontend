import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  BarChart3,
  LogOut,
  Menu,
  X,
  MessageCircle,
  Shield,
  Megaphone,
  User,
  Lightbulb,
  Settings,
  Activity,
  UserCircle,
  ChevronDown,
} from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreMenuOpen]);

  const adminLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/department", label: "Departments", icon: Building2 },
    { to: "/activity", label: "Timeline", icon: Activity },
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/employee", label: "Employees", icon: Users },
    { to: "/salary", label: "Salary", icon: Wallet },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/suggestions", label: "Suggestions", icon: Lightbulb },
    { to: "/announcements", label: "Announce", icon: Megaphone },
    { to: "/messages", label: "Messages", icon: MessageCircle },
    { to: "/users", label: "Users", icon: Shield },
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/permissions", label: "Permissions", icon: Shield },
  ];

  const hrLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/department", label: "Departments", icon: Building2 },
    { to: "/employee", label: "Employees", icon: Users },
    { to: "/salary", label: "Salary", icon: Wallet },
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/suggestions", label: "Suggestions", icon: Lightbulb },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/announcements", label: "Announce", icon: Megaphone },
    { to: "/permissions", label: "Permissions", icon: Shield },
    { to: "/messages", label: "Messages", icon: MessageCircle },
  ];

  const employeeLinks = [
    { to: "/dashboard", label: "My Portal", icon: User },
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/announcements", label: "Announcements", icon: Megaphone },
    { to: "/messages", label: "Messages", icon: MessageCircle },
    { to: "/suggestions", label: "Suggestions", icon: Lightbulb },
  ];

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "hr"
        ? hrLinks
        : employeeLinks;

  const visibleLinks = links.slice(0, 5);
  const moreLinks = links.slice(5);

  const roleColor =
    user?.role === "admin"
      ? "text-brand-600"
      : user?.role === "hr"
        ? "text-blue-600"
        : "text-purple-600";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm
                    border-b border-panel-200 shadow-nav"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div
              className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center
                            group-hover:bg-brand-700 transition-colors"
            >
              <span className="text-white font-bold text-xs">EP</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-panel-900 font-bold text-sm leading-none">
                EPMS
              </p>
              <p className="text-panel-400 text-[10px] leading-none mt-0.5">
                SmartPark
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {visibleLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm
                                font-medium transition-all duration-150 whitespace-nowrap
                                ${
                                  isActive(to)
                                    ? "bg-brand-50 text-brand-700 shadow-sm"
                                    : "text-panel-500 hover:text-panel-800 hover:bg-panel-50"
                                }`}
              >
                <Icon size={16} strokeWidth={isActive(to) ? 2.2 : 1.8} />
                {label}
              </Link>
            ))}

            {/* More dropdown */}
            {moreLinks.length > 0 && (
              <div
                ref={moreMenuRef}
                className="relative"
                onMouseEnter={() => setMoreMenuOpen(true)}
                onMouseLeave={() => setMoreMenuOpen(false)}
              >
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm
                              font-medium transition-all duration-150 whitespace-nowrap
                              ${
                                moreMenuOpen
                                  ? "bg-brand-50 text-brand-700 shadow-sm"
                                  : "text-panel-500 hover:text-panel-800 hover:bg-panel-50"
                              }`}
                >
                  More
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${moreMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {moreMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-panel-200 rounded-lg shadow-lg z-40 min-w-max">
                    {moreLinks.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMoreMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                                    transition-all duration-150 whitespace-nowrap
                                    first:rounded-t-md last:rounded-b-md
                                    ${
                                      isActive(to)
                                        ? "bg-brand-50 text-brand-700"
                                        : "text-panel-500 hover:bg-panel-50"
                                    }`}
                      >
                        <Icon size={16} />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <NotificationBell />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel-50 border border-panel-100">
              <div
                className="w-6 h-6 rounded-full bg-brand-100 border border-brand-200
                              flex items-center justify-center"
              >
                <span className="text-brand-700 text-[10px] font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-panel-600 font-medium">
                  {user?.username}
                </span>
                <span
                  className={`ml-1.5 uppercase text-[10px] font-semibold ${roleColor}`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-sm btn-danger-outline"
            >
              <LogOut size={13} />
            </button>
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-1">
            <NotificationBell />
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-icon">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-panel-100 animate-slide-down">
          <div className="px-4 py-3 space-y-0.5">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium
                                transition-all duration-150
                                ${
                                  isActive(to)
                                    ? "bg-brand-50 text-brand-700"
                                    : "text-panel-500 hover:bg-panel-50"
                                }`}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-panel-100 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-panel-600 font-medium">
                  {user?.username}
                </span>
                <span
                  className={`ml-1.5 uppercase text-[10px] font-semibold ${roleColor}`}
                >
                  · {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-sm btn-danger-outline"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
