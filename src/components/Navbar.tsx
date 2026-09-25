import React from 'react';
import { 
  School, 
  UserCheck, 
  LogOut, 
  Menu, 
  ShieldCheck, 
  CalendarDays,
  Bell
} from 'lucide-react';
import { AdminUser, SchoolProfile } from '../types';

interface NavbarProps {
  currentUser: AdminUser | null;
  schoolProfile: SchoolProfile;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
  todayStr: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  schoolProfile,
  onLogout,
  onToggleMobileMenu,
  todayStr,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / School Info */}
          <div className="flex items-center space-x-3">
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    {schoolProfile.name}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    NPSN {schoolProfile.npsn}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="font-medium text-slate-700">T.A. {schoolProfile.academicYear} ({schoolProfile.semester})</span>
                  <span className="text-slate-300">•</span>
                  <span className="hidden md:inline">Sistem Presensi & Disiplin Positif</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Section: Today Info & User Account */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Calendar pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>{todayStr}</span>
            </div>

            {/* User Profile Card & Logout */}
            {currentUser ? (
              <div className="flex items-center space-x-3 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="flex items-center space-x-2.5">
                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-purple-100 shadow-2xs">
                      {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {currentUser.name}
                    </p>
                    <div className="flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                      <span className="text-[11px] font-bold text-purple-700">
                        {currentUser.role}
                        {currentUser.role === 'Wali Kelas' && currentUser.assignedClass ? ` (${currentUser.assignedClass})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  title="Keluar dari sistem"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
