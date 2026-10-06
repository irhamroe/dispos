import React from 'react';
import { 
  Menu, 
  ShieldCheck, 
  CalendarDays,
  LogOut,
  CloudCheck,
  CloudOff
} from 'lucide-react';
import { AdminUser, SchoolProfile } from '../types';
import { MdBadge, MdButton } from './md3';

interface NavbarProps {
  currentUser: AdminUser | null;
  schoolProfile: SchoolProfile;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
  todayStr: string;
  isFirebaseConnected?: boolean;
  onOpenFirebaseModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  schoolProfile,
  onLogout,
  onToggleMobileMenu,
  todayStr,
  isFirebaseConnected = false,
  onOpenFirebaseModal,
}) => {
  return (
    <header 
      id="main-header" 
      className="sticky top-0 z-30 px-3 sm:px-6 pt-3 pb-1"
    >
      <div className="max-w-7xl mx-auto bg-[#F0F9FF]/95 backdrop-blur-md rounded-[32px] shadow-sm border border-[#E0F2FE] px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          {/* Left: Mobile Menu + School Logo & Title */}
          <div className="flex items-center space-x-3">
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-full bg-[#E0F2FE] text-[#0369A1] hover:bg-[#DFD3F3] active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Toggle menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              {/* MD3 Logo Circle */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white shadow-xs flex items-center justify-center p-1.5 shrink-0 border border-[#E0F2FE]">
                <img 
                  src="/logo.png" 
                  alt={schoolProfile.name} 
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm sm:text-base font-medium text-[#0F172A] tracking-tight leading-tight">
                    {schoolProfile.name}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E0F2FE] text-[#0369A1]">
                    NPSN {schoolProfile.npsn}
                  </span>
                </div>
                <p className="text-xs text-[#334155] flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium text-[#0F172A]">T.A. {schoolProfile.academicYear} ({schoolProfile.semester})</span>
                  <span className="text-[#64748B]">•</span>
                  <span className="hidden md:inline">Sistem Presensi & Disiplin Positif</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Section: Cloud Sync, Date & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cloud Sync Status Pill */}
            {onOpenFirebaseModal && (
              <button
                type="button"
                onClick={onOpenFirebaseModal}
                title={isFirebaseConnected ? 'Cloud Firestore Terhubung' : 'Konfigurasi Cloud Firestore'}
                className={`hidden md:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                  isFirebaseConnected
                    ? 'bg-[#C8E6C9] text-[#1B5E20] hover:bg-[#B9E0BA]'
                    : 'bg-[#FFE0B2] text-[#E65100] hover:bg-[#FFD599]'
                }`}
              >
                {isFirebaseConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse" />
                    <span>Cloud Sync Aktif</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#E65100]" />
                    <span>Offline Mode</span>
                  </>
                )}
              </button>
            )}

            {/* Calendar pill */}
            <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#E2F1FD] text-[#0F172A] text-xs font-medium">
              <CalendarDays className="w-4 h-4 text-[#0284C7]" />
              <span>{todayStr}</span>
            </div>

            {/* User Profile Card & Logout */}
            {currentUser ? (
              <div className="flex items-center space-x-2.5 sm:space-x-3 pl-2 sm:pl-3 border-l border-[#CBD5E1]">
                <div className="flex items-center space-x-2 sm:space-x-2.5">
                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover shadow-xs border border-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-medium text-xs shadow-xs">
                      {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-[#0F172A] leading-tight">
                      {currentUser.name}
                    </p>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span className="text-[11px] font-medium text-[#0284C7]">
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
                  className="p-2.5 rounded-full bg-[#FFDAD6] text-[#410002] hover:bg-[#FFCDD2] active:scale-95 transition-all duration-200 cursor-pointer"
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
