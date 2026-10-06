import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  CalendarRange, 
  ShieldAlert, 
  Users, 
  Clock, 
  Sparkles, 
  Database, 
  Layers, 
  UserCheck, 
  ChevronDown, 
  ChevronRight, 
  FileWarning, 
  SlidersHorizontal, 
  CalendarDays, 
  Mail, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'attendance' 
  | 'recap' 
  | 'rekap-surat-izin'
  | 'discipline' 
  | 'rekap-pelanggaran'
  | 'tagihan-pembinaan'
  | 'surat-panggilan'
  | 'aturan-pelanggaran'
  | 'students' 
  | 'data-siswa' 
  | 'data-kelas' 
  | 'data-walikelas'
  | 'manajemen-user';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  todayCount: {
    total: number;
    hadir: number;
    alpa: number;
  };
  totalDisciplineCases: number;
  totalPendingDebt?: number;
  totalPendingLetters?: number;
  totalUsers?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  todayCount,
  totalDisciplineCases,
  totalPendingDebt = 0,
  totalPendingLetters = 0,
  totalUsers = 0,
}) => {
  const isManagementTab = 
    currentTab === 'data-siswa' || 
    currentTab === 'data-kelas' || 
    currentTab === 'data-walikelas' ||
    currentTab === 'manajemen-user' ||
    currentTab === 'students';

  const isRecapTab = currentTab === 'recap' || currentTab === 'rekap-surat-izin';

  const [isManagementOpen, setIsManagementOpen] = useState(true);
  const [isRecapOpen, setIsRecapOpen] = useState(true);

  useEffect(() => {
    if (isManagementTab) setIsManagementOpen(true);
  }, [isManagementTab]);

  useEffect(() => {
    if (isRecapTab) setIsRecapOpen(true);
  }, [isRecapTab]);

  const primaryAttendanceNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard Statistik',
      sublabel: 'Pantauan kehadiran hari ini',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'attendance' as NavTab,
      label: 'Presensi Harian',
      sublabel: 'Input & pembaruan absensi',
      icon: ClipboardCheck,
      badge: `${todayCount.hadir}/${todayCount.total}`,
      badgeBg: 'bg-[#C8E6C9] text-[#1B5E20]',
    },
  ];

  const recapSubItems = [
    {
      id: 'recap' as NavTab,
      label: 'Rekap Presensi',
      sublabel: 'Rentang tanggal & ekspor',
      icon: CalendarRange,
      badge: 'Excel/PDF',
      badgeBg: 'bg-[#E1F5FE] text-[#0277BD]',
    },
    {
      id: 'rekap-surat-izin' as NavTab,
      label: 'Rekap Surat Izin',
      sublabel: 'Siswa belum kumpul surat',
      icon: FileWarning,
      badge: totalPendingLetters > 0 ? `${totalPendingLetters} Siswa` : 'Lengkap',
      badgeBg: totalPendingLetters > 0 ? 'bg-[#FFDAD6] text-[#410002]' : 'bg-[#C8E6C9] text-[#1B5E20]',
    },
  ];

  const disciplineNavItems = [
    {
      id: 'discipline' as NavTab,
      label: 'Input Pelanggaran',
      sublabel: 'Catat pelanggaran & riwayat',
      icon: ShieldAlert,
      badge: `${totalDisciplineCases} Data`,
      badgeBg: 'bg-[#FFE0B2] text-[#E65100]',
    },
    {
      id: 'rekap-pelanggaran' as NavTab,
      label: 'Rekap Pelanggaran',
      sublabel: 'Rentang tanggal & ekspor',
      icon: CalendarDays,
      badge: 'Laporan',
      badgeBg: 'bg-[#E0F2F1] text-[#00695C]',
    },
    {
      id: 'tagihan-pembinaan' as NavTab,
      label: 'Tagihan Pembinaan',
      sublabel: 'Belum selesai pembinaan',
      icon: FileWarning,
      badge: `${totalPendingDebt} Siswa`,
      badgeBg: totalPendingDebt > 0 ? 'bg-[#FFDAD6] text-[#410002]' : 'bg-[#C8E6C9] text-[#1B5E20]',
    },
    {
      id: 'surat-panggilan' as NavTab,
      label: 'Surat Panggilan Ortu',
      sublabel: 'Format resmi & rekap kasus',
      icon: Mail,
      badge: 'Resmi',
      badgeBg: 'bg-[#E0F2FE] text-[#0369A1]',
    },
    {
      id: 'aturan-pelanggaran' as NavTab,
      label: 'Manajemen Aturan',
      sublabel: 'Katalog bobot poin & aturan',
      icon: SlidersHorizontal,
      badge: '40 Aturan',
      badgeBg: 'bg-[#E0F2FE] text-[#0369A1]',
    },
  ];

  const managementSubItems = [
    {
      id: 'data-siswa' as NavTab,
      label: 'Data Siswa',
      sublabel: 'Master 1.274 siswa',
      icon: Users,
      badge: `${todayCount.total}`,
    },
    {
      id: 'data-kelas' as NavTab,
      label: 'Data Kelas',
      sublabel: '36 Rombel X, XI, XII',
      icon: Layers,
      badge: '36 Rombel',
    },
    {
      id: 'data-walikelas' as NavTab,
      label: 'Data Wali Kelas',
      sublabel: '36 Guru pembina rombel',
      icon: UserCheck,
      badge: '36 Guru',
    },
    {
      id: 'manajemen-user' as NavTab,
      label: 'Manajemen User',
      sublabel: 'Role: Admin, Wali, Guru',
      icon: ShieldCheck,
      badge: totalUsers > 0 ? `${totalUsers} Akun` : 'Multi-Role',
    },
  ];

  const handleNavClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    if (isOpenMobile) onCloseMobile();
  };

  const attendancePercent = todayCount.total > 0 
    ? Math.round((todayCount.hadir / todayCount.total) * 100) 
    : 0;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpenMobile && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#0F172A]/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container with Material You */}
      <aside
        id="app-sidebar"
        className={`fixed top-20 bottom-4 left-3 z-40 w-72 bg-[#F0F9FF]/95 backdrop-blur-md rounded-[32px] shadow-sm border border-[#E0F2FE] flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 top-3 bottom-3 left-3 shadow-lg' : '-translate-x-[110%]'
        }`}
      >
        {/* Mobile Close Button Header */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-4 pb-2 border-b border-[#E0F2FE]">
          <span className="font-medium text-sm text-[#0F172A]">Navigasi Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-full bg-[#E0F2FE] text-[#0369A1] active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 font-roboto">
          {/* Section 1: Presensi & Kehadiran */}
          <div>
            <div className="mb-2 px-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#0284C7]">
                Presensi &amp; Kehadiran
              </span>
            </div>

            <nav className="space-y-1" aria-label="Presensi Navigation">
              {primaryAttendanceNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-left transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] group cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-[#E0F2FE] text-[#0369A1] font-medium shadow-xs'
                        : 'text-[#334155] hover:bg-[#0284C7]/10 hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-[#0284C7] text-white shadow-xs'
                            : 'bg-[#E2F1FD] text-[#334155] group-hover:bg-[#0284C7] group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium truncate leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-[#334155] truncate mt-0.5">
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2.5 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${item.badgeBg}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Sub Menu: Rekap Kehadiran (Accordion) */}
              <div className="pt-0.5">
                <button
                  type="button"
                  id="nav-btn-rekap-kehadiran-toggle"
                  onClick={() => setIsRecapOpen(!isRecapOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-left transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] group cursor-pointer active:scale-95 ${
                    isRecapTab && !isRecapOpen
                      ? 'bg-[#E0F2FE] text-[#0369A1] font-medium'
                      : 'text-[#334155] hover:bg-[#0284C7]/10 hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#E2F1FD] text-[#334155] group-hover:bg-[#0284C7] group-hover:text-white flex items-center justify-center transition-all">
                      <CalendarRange className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-medium truncate">
                        Rekap Kehadiran
                      </div>
                      <div className="text-[10px] text-[#334155] truncate mt-0.5">
                        Presensi &amp; surat izin
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 ml-2">
                    {totalPendingLetters > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#FFDAD6] text-[#410002]">
                        {totalPendingLetters}
                      </span>
                    )}
                    {isRecapOpen ? (
                      <ChevronDown className="w-4 h-4 text-[#64748B]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#64748B]" />
                    )}
                  </div>
                </button>

                {isRecapOpen && (
                  <div className="mt-1 ml-3 p-1.5 bg-[#E2F1FD]/60 rounded-2xl space-y-1">
                    {recapSubItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = currentTab === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          id={`nav-sub-${subItem.id}`}
                          onClick={() => handleNavClick(subItem.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-left transition-all cursor-pointer active:scale-95 ${
                            isSubActive
                              ? 'bg-[#0284C7] text-white font-medium shadow-xs'
                              : 'text-[#334155] hover:bg-[#0284C7]/10'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive ? 'text-white' : 'text-[#0284C7]'
                              }`}
                            />
                            <div className="truncate text-xs leading-tight">
                              {subItem.label}
                            </div>
                          </div>

                          {subItem.badge && (
                            <span
                              className={`ml-1 px-2 py-0.5 text-[9.5px] font-medium rounded-full ${
                                isSubActive ? 'bg-white/20 text-white' : subItem.badgeBg
                              }`}
                            >
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Section 2: Disiplin Positif */}
          <div>
            <div className="mb-2 px-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#0284C7]">
                Disiplin Positif
              </span>
            </div>

            <nav className="space-y-1" aria-label="Disiplin Positif Navigation">
              {disciplineNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-left transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] group cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-[#E0F2FE] text-[#0369A1] font-medium shadow-xs'
                        : 'text-[#334155] hover:bg-[#0284C7]/10 hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-[#0284C7] text-white shadow-xs'
                            : 'bg-[#E2F1FD] text-[#334155] group-hover:bg-[#0284C7] group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium truncate leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-[#334155] truncate mt-0.5">
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2.5 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${item.badgeBg}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 3: Master Data */}
          <div>
            <div className="mb-2 px-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#0284C7]">
                Master Data
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-[#E2F1FD]/40 border border-[#E0F2FE]">
              <button
                type="button"
                id="nav-btn-manajemen-data"
                onClick={() => setIsManagementOpen(!isManagementOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                  isManagementTab
                    ? 'bg-[#E0F2FE] text-[#0369A1] font-medium'
                    : 'text-[#334155] hover:bg-[#0284C7]/10 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-xs">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium leading-tight">Master Data</div>
                    <div className="text-[10px] text-[#334155]">Siswa, Kelas, Wali & User</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isManagementOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#64748B]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#64748B]" />
                  )}
                </div>
              </button>

              {isManagementOpen && (
                <div className="p-1.5 space-y-1 bg-[#E2F1FD]/60">
                  {managementSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive =
                      currentTab === sub.id || (sub.id === 'data-siswa' && currentTab === 'students');

                    return (
                      <button
                        key={sub.id}
                        id={`nav-sub-${sub.id}`}
                        onClick={() => handleNavClick(sub.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-left transition-all cursor-pointer active:scale-95 ${
                          isSubActive
                            ? 'bg-[#0284C7] text-white font-medium shadow-xs'
                            : 'text-[#334155] hover:bg-[#0284C7]/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSubActive ? 'text-white' : 'text-[#0284C7]'
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-xs truncate leading-tight font-medium">{sub.label}</div>
                            <div className={`text-[9.5px] truncate ${isSubActive ? 'text-[#E0F2FE]' : 'text-[#334155]'}`}>
                              {sub.sublabel}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSubActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#F8FAFC] text-[#334155]'
                          }`}
                        >
                          {sub.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Attendance Widget in Sidebar */}
          <div className="p-4 rounded-2xl bg-[#E0F2FE]/60 border border-[#E0F2FE]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#0F172A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                Presensi Hari Ini
              </span>
              <span className="text-xs font-bold text-[#0284C7]">
                {attendancePercent}%
              </span>
            </div>

            {/* Material You Progress Bar */}
            <div className="w-full bg-[#E2F1FD] rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-[#0284C7] h-full rounded-full transition-all duration-300"
                style={{ width: `${attendancePercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[#F8FAFC]">
                <div className="text-[10px] text-[#334155]">Hadir</div>
                <div className="text-xs font-bold text-[#1B5E20]">{todayCount.hadir}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#F8FAFC]">
                <div className="text-[10px] text-[#334155]">Alpa</div>
                <div className="text-xs font-bold text-[#B71C1C]">{todayCount.alpa}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-[#E0F2FE] bg-[#E0F2FE]/30 rounded-b-[32px]">
          <div className="flex items-start space-x-2.5 text-xs text-[#334155]">
            <Sparkles className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#0F172A] text-[11px]">SMAN 1 Batu • Presensi</p>
              <p className="text-[10px] text-[#334155] mt-0.5 leading-tight">
                36 Rombel dengan integrasi disiplin positif.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
