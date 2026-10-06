import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  FileText,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  ClaimPilot
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Agentic AI
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Multi-Agent Health Claim Review
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/dashboard')
                    ? 'bg-slate-800 text-brand-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>

              <Link
                to="/claims"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/claims')
                    ? 'bg-slate-800 text-brand-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Claims</span>
              </Link>

              <Link
                to="/claims/new"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive('/claims/new')
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'bg-brand-600 hover:bg-brand-500 text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Claim</span>
              </Link>

              {/* User Dropdown / Info */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-800">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
                  <span className="text-[10px] text-brand-400 capitalize">{user?.role || 'Reviewer'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg transition shadow-md shadow-brand-500/20"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
