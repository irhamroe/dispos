import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  DoorOpen, 
  ShieldAlert, 
  Menu
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { RoleMatrixMap } from '../types';
import { checkTabAccess, initialRoleMatrix } from '../data/roleMatrixData';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMenu: () => void;
  totalPendingPermits?: number;
  userRole?: string;
  roleMatrix?: RoleMatrixMap;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMenu,
  totalPendingPermits = 0,
  userRole = 'Admin',
  roleMatrix = initialRoleMatrix,
}) => {
  // Check permission for each primary mobile tab
  const canDashboard = checkTabAccess(userRole, 'dashboard', roleMatrix);
  const canAttendance = checkTabAccess(userRole, 'attendance', roleMatrix);
  const canPermits = checkTabAccess(userRole, 'layanan-izin-siswa', roleMatrix);
  const canDiscipline = checkTabAccess(userRole, 'discipline', roleMatrix);

  // List of tabs that are explicitly mapped to bottom buttons
  const isDirectTab = 
    currentTab === 'dashboard' || 
    currentTab === 'attendance' || 
    currentTab === 'layanan-izin-siswa' || 
    currentTab === 'discipline';

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navigasi Bawah Ponsel"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E0F2FE] shadow-[0_-8px_30px_rgba(2,132,199,0.08)] pb-safe lg:hidden transition-transform duration-300 print:hidden"
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {/* Tab 1: Dashboard */}
        {canDashboard && (
          <button
            type="button"
            id="mobile-tab-dashboard"
            onClick={() => onSelectTab('dashboard')}
            className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
              currentTab === 'dashboard'
                ? 'text-[#0284C7]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <div
              className={`w-10 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
                currentTab === 'dashboard'
                  ? 'bg-[#E0F2FE] text-[#0284C7] shadow-xs scale-105'
                  : 'bg-transparent text-current'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-none transition-all ${
                currentTab === 'dashboard' ? 'font-bold text-[#0284C7]' : 'font-medium text-[#64748B]'
              }`}
            >
              Beranda
            </span>
          </button>
        )}

        {/* Tab 2: Daily Attendance */}
        {canAttendance && (
          <button
            type="button"
            id="mobile-tab-attendance"
            onClick={() => onSelectTab('attendance')}
            className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
              currentTab === 'attendance'
                ? 'text-[#10B981]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <div
              className={`w-10 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
                currentTab === 'attendance'
                  ? 'bg-[#D1FAE5] text-[#059669] shadow-xs scale-105'
                  : 'bg-transparent text-current'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-none transition-all ${
                currentTab === 'attendance' ? 'font-bold text-[#059669]' : 'font-medium text-[#64748B]'
              }`}
            >
              Presensi
            </span>
          </button>
        )}

        {/* Tab 3: Izin Siswa */}
        {canPermits && (
          <button
            type="button"
            id="mobile-tab-permits"
            onClick={() => onSelectTab('layanan-izin-siswa')}
            className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 cursor-pointer relative active:scale-95 ${
              currentTab === 'layanan-izin-siswa'
                ? 'text-[#F59E0B]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <div
              className={`w-10 h-7 flex items-center justify-center rounded-full relative transition-all duration-200 ${
                currentTab === 'layanan-izin-siswa'
                  ? 'bg-[#FEF3C7] text-[#D97706] shadow-xs scale-105'
                  : 'bg-transparent text-current'
              }`}
            >
              <DoorOpen className="w-4 h-4" />
              {totalPendingPermits > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                  {totalPendingPermits > 9 ? '9+' : totalPendingPermits}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] tracking-tight leading-none transition-all ${
                currentTab === 'layanan-izin-siswa' ? 'font-bold text-[#D97706]' : 'font-medium text-[#64748B]'
              }`}
            >
              Izin Siswa
            </span>
          </button>
        )}

        {/* Tab 4: Disiplin */}
        {canDiscipline && (
          <button
            type="button"
            id="mobile-tab-discipline"
            onClick={() => onSelectTab('discipline')}
            className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
              currentTab === 'discipline'
                ? 'text-[#F97316]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <div
              className={`w-10 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
                currentTab === 'discipline'
                  ? 'bg-[#FFEDD5] text-[#EA580C] shadow-xs scale-105'
                  : 'bg-transparent text-current'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-none transition-all ${
                currentTab === 'discipline' ? 'font-bold text-[#EA580C]' : 'font-medium text-[#64748B]'
              }`}
            >
              Disiplin
            </span>
          </button>
        )}

        {/* Tab 5: Menu / Drawer (Opens complete side drawer) */}
        <button
          type="button"
          id="mobile-tab-menu"
          onClick={onOpenMenu}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 cursor-pointer relative active:scale-95 ${
            !isDirectTab
              ? 'text-[#0284C7]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-full relative transition-all duration-200 ${
              !isDirectTab
                ? 'bg-[#E0F2FE] text-[#0284C7] shadow-xs scale-105'
                : 'bg-transparent text-current'
            }`}
          >
            <Menu className="w-4 h-4" />
            {!isDirectTab && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#0284C7] ring-1 ring-white" />
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight leading-none transition-all ${
              !isDirectTab ? 'font-bold text-[#0284C7]' : 'font-medium text-[#64748B]'
            }`}
          >
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};

