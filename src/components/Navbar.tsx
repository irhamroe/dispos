import React from 'react';
import { 
  Menu, 
  ShieldCheck, 
  CalendarDays,
  LogOut,
  Bell
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
  totalPendingPermits?: number;
  onNavigatePermits?: () => void;
  onEditProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  schoolProfile,
  onLogout,
  onToggleMobileMenu,
  todayStr,
  isFirebaseConnected = false,
  onOpenFirebaseModal,
  totalPendingPermits = 0,
  onNavigatePermits,
  onEditProfile,
}) => {
  return (
    <header 
      id="main-header" 
      className="sticky top-0 z-30 px-2 sm:px-6 pt-2 sm:pt-3 pb-1 print:hidden"
    >
      <div className="max-w-7xl mx-auto bg-[#F0F9FF]/95 backdrop-blur-md rounded-[24px] sm:rounded-[32px] shadow-sm border border-[#E0F2FE] px-3 sm:px-6 py-2 sm:py-3 transition-all duration-300">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Mobile Menu + School Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-full bg-[#E0F2FE] text-[#0369A1] hover:bg-[#DFD3F3] active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
              aria-label="Toggle menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              {/* MD3 Logo Circle */}
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white shadow-xs flex items-center justify-center p-1 sm:p-1.5 shrink-0 border border-[#E0F2FE]">
                <img 
                  src="/logo.png" 
                  alt={schoolProfile.name} 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h1 className="text-xs sm:text-base font-bold text-[#0F172A] tracking-tight leading-tight truncate">
                    {schoolProfile.name}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#E0F2FE] text-[#0369A1]">
                    NPSN {schoolProfile.npsn}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-[#334155] flex items-center gap-1 sm:gap-1.5 mt-0.5 truncate">
                  <span className="font-medium text-[#0F172A]">T.A. {schoolProfile.academicYear}</span>
                  <span className="text-[#64748B]">•</span>
                  <span>{schoolProfile.semester}</span>
                  <span className="hidden md:inline text-[#64748B]">•</span>
                  <span className="hidden md:inline">Sistem Presensi & Disiplin</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Section: Cloud Sync, Notifications, Date & User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Notification for Pending Student Permits */}
            {totalPendingPermits > 0 && onNavigatePermits && (
              <button
                type="button"
                id="navbar-pending-permits-btn"
                onClick={onNavigatePermits}
                title={`${totalPendingPermits} Permohonan Izin Siswa Menunggu Persetujuan`}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-[11px] sm:text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 animate-pulse"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{totalPendingPermits} Izin Baru</span>
                <span className="sm:hidden">{totalPendingPermits}</span>
              </button>
            )}

            {/* Calendar pill (Desktop only) */}
            <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#E2F1FD] text-[#0F172A] text-xs font-medium">
              <CalendarDays className="w-4 h-4 text-[#0284C7]" />
              <span>{todayStr}</span>
            </div>

            {/* User Profile Card & Logout */}
            {currentUser ? (
              <div className="flex items-center space-x-1.5 sm:space-x-2.5 pl-1.5 sm:pl-3 border-l border-[#CBD5E1]">
                <button
                  type="button"
                  id="navbar-profile-btn"
                  onClick={onEditProfile}
                  title="Klik untuk melihat dan melengkapi Profil Saya"
                  className="flex items-center space-x-1.5 sm:space-x-2.5 p-0.5 sm:p-1 pr-1 sm:pr-2 rounded-full hover:bg-sky-100/70 active:scale-95 transition-all duration-200 cursor-pointer text-left group"
                >
                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-xs border-2 border-white group-hover:border-[#0284C7] transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0284C7] group-hover:bg-[#0369A1] text-white flex items-center justify-center font-bold text-xs shadow-xs transition-colors">
                      {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-[#0F172A] leading-tight group-hover:text-[#0284C7] transition-colors truncate max-w-[130px]">
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
                </button>

                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  title="Keluar dari sistem"
                  className="p-2 sm:p-2.5 rounded-full bg-[#FFDAD6] text-[#410002] hover:bg-[#FFCDD2] active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
