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

  // Automatically keep sub-menus open if an internal tab is active
  useEffect(() => {
    if (isManagementTab) {
      setIsManagementOpen(true);
    }
  }, [isManagementTab]);

  useEffect(() => {
    if (isRecapTab) {
      setIsRecapOpen(true);
    }
  }, [isRecapTab]);

  const primaryAttendanceNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard Statistik',
      sublabel: 'Pantauan kehadiran hari ini',
      icon: LayoutDashboard,
      badge: null,
      iconGradient: 'from-violet-500 to-indigo-600',
    },
    {
      id: 'attendance' as NavTab,
      label: 'Presensi Harian',
      sublabel: 'Input & pembaruan absensi',
      icon: ClipboardCheck,
      badge: `${todayCount.hadir}/${todayCount.total}`,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      iconGradient: 'from-emerald-400 to-teal-600',
    },
  ];

  const recapSubItems = [
    {
      id: 'recap' as NavTab,
      label: 'Rekap Presensi',
      sublabel: 'Rentang tanggal & ekspor',
      icon: CalendarRange,
      badge: 'Excel / PDF',
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'rekap-surat-izin' as NavTab,
      label: 'Rekap Surat Izin',
      sublabel: 'Siswa belum kumpul surat',
      icon: FileWarning,
      badge: totalPendingLetters > 0 ? `${totalPendingLetters} Siswa` : 'Lengkap',
      badgeColor: totalPendingLetters > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
    },
  ];

  const disciplineNavItems = [
    {
      id: 'discipline' as NavTab,
      label: 'Input Pelanggaran',
      sublabel: 'Catat pelanggaran & riwayat',
      icon: ShieldAlert,
      badge: `${totalDisciplineCases} Data`,
      badgeColor: 'bg-amber-100 text-amber-800',
      iconGradient: 'from-amber-400 to-orange-500',
    },
    {
      id: 'rekap-pelanggaran' as NavTab,
      label: 'Rekap Pelanggaran',
      sublabel: 'Rentang tanggal & ekspor',
      icon: CalendarDays,
      badge: 'Laporan',
      badgeColor: 'bg-teal-100 text-teal-800',
      iconGradient: 'from-teal-400 to-emerald-600',
    },
    {
      id: 'tagihan-pembinaan' as NavTab,
      label: 'Tagihan Pembinaan',
      sublabel: 'Belum selesai pembinaan',
      icon: FileWarning,
      badge: `${totalPendingDebt} Siswa`,
      badgeColor: totalPendingDebt > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
      iconGradient: 'from-rose-400 to-pink-600',
    },
    {
      id: 'surat-panggilan' as NavTab,
      label: 'Surat Panggilan Ortu',
      sublabel: 'Format resmi & rekap kasus',
      icon: Mail,
      badge: 'Resmi',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      iconGradient: 'from-indigo-400 to-purple-600',
    },
    {
      id: 'aturan-pelanggaran' as NavTab,
      label: 'Manajemen Aturan',
      sublabel: 'Katalog bobot poin & aturan',
      icon: SlidersHorizontal,
      badge: '40 Aturan',
      badgeColor: 'bg-purple-100 text-purple-800',
      iconGradient: 'from-purple-400 to-violet-600',
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
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const handleToggleRecap = () => {
    if (!isRecapOpen) {
      setIsRecapOpen(true);
      if (!isRecapTab) {
        handleNavClick('recap');
      }
    } else {
      setIsRecapOpen(!isRecapOpen);
    }
  };

  const handleToggleManagement = () => {
    if (!isManagementOpen) {
      setIsManagementOpen(true);
      if (!isManagementTab) {
        handleNavClick('data-siswa');
      }
    } else {
      setIsManagementOpen(!isManagementOpen);
    }
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
          className="fixed inset-0 z-40 bg-clay-foreground/40 backdrop-blur-md lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container with Claymorphism */}
      <aside
        id="app-sidebar"
        className={`fixed top-20 bottom-4 left-3 z-40 w-72 bg-white/80 backdrop-blur-2xl rounded-[36px] shadow-clay-card border border-white/80 flex flex-col justify-between transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 top-3 bottom-3 left-3 shadow-2xl' : '-translate-x-[110%]'
        }`}
      >
        {/* Mobile Close Button Header */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-4 pb-2 border-b border-violet-100">
          <span className="font-nunito font-extrabold text-sm text-clay-foreground">Navigasi Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl bg-white text-clay-muted hover:text-clay-foreground shadow-clay-button active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 clay-custom-scrollbar">
          {/* Section 1: Presensi & Kehadiran */}
          <div>
            <div className="mb-2 px-3">
              <span className="text-[11px] font-nunito font-black uppercase tracking-wider text-violet-400">
                Presensi &amp; Kehadiran
              </span>
            </div>

            <nav className="space-y-1.5" aria-label="Presensi Navigation">
              {primaryAttendanceNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[22px] text-left transition-all duration-200 group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-700 text-white shadow-clay-button -translate-y-0.5'
                        : 'text-clay-foreground hover:bg-white/90 hover:shadow-clay-card hover:-translate-y-0.5 active:scale-[0.95] active:shadow-clay-pressed'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-white/20 text-white shadow-inner'
                            : `bg-gradient-to-br ${item.iconGradient} text-white shadow-clay-orb group-hover:scale-105`
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-nunito font-extrabold truncate leading-tight">
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] truncate mt-0.5 font-medium ${
                            isActive ? 'text-violet-200' : 'text-clay-muted'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2.5 py-0.5 text-[10px] font-nunito font-black rounded-full whitespace-nowrap shadow-clay-pill ${
                          isActive
                            ? 'bg-white/30 text-white'
                            : item.badgeColor
                        }`}
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
                  onClick={handleToggleRecap}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[22px] text-left transition-all duration-200 group cursor-pointer ${
                    isRecapTab && !isRecapOpen
                      ? 'bg-violet-100/70 text-violet-900 font-bold shadow-clay-pressed'
                      : 'text-clay-foreground hover:bg-white/90 hover:shadow-clay-card hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                        isRecapTab
                          ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-clay-orb'
                          : 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-clay-orb'
                      }`}
                    >
                      <CalendarRange className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-nunito font-extrabold truncate text-clay-foreground">
                        Rekap Kehadiran
                      </div>
                      <div className="text-[10px] text-clay-muted truncate mt-0.5 font-medium">
                        Presensi &amp; surat izin
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 ml-2">
                    {totalPendingLetters > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-nunito font-extrabold rounded-full bg-rose-100 text-rose-700 shadow-clay-pill">
                        {totalPendingLetters}
                      </span>
                    )}
                    {isRecapOpen ? (
                      <ChevronDown className="w-4 h-4 text-violet-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-violet-400" />
                    )}
                  </div>
                </button>

                {/* Rekap Kehadiran Sub-items in Recessed Box */}
                {isRecapOpen && (
                  <div className="mt-1.5 ml-2 p-1.5 bg-[#EFEBF5]/70 rounded-2xl shadow-clay-pressed space-y-1">
                    {recapSubItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = currentTab === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          id={`nav-sub-${subItem.id}`}
                          onClick={() => handleNavClick(subItem.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-clay-button -translate-y-0.5 font-nunito font-extrabold'
                              : 'text-clay-foreground hover:bg-white hover:shadow-xs font-medium'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive ? 'text-white' : 'text-violet-500'
                              }`}
                            />
                            <div className="truncate">
                              <div className="text-xs truncate leading-tight">
                                {subItem.label}
                              </div>
                            </div>
                          </div>

                          {subItem.badge && (
                            <span
                              className={`ml-1 px-2 py-0.5 text-[9.5px] font-nunito font-extrabold rounded-full shadow-clay-pill ${
                                isSubActive
                                  ? 'bg-white/30 text-white'
                                  : subItem.badgeColor
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
              <span className="text-[11px] font-nunito font-black uppercase tracking-wider text-violet-400">
                Disiplin Positif
              </span>
            </div>

            <nav className="space-y-1.5" aria-label="Disiplin Positif Navigation">
              {disciplineNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[22px] text-left transition-all duration-200 group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-700 text-white shadow-clay-button -translate-y-0.5'
                        : 'text-clay-foreground hover:bg-white/90 hover:shadow-clay-card hover:-translate-y-0.5 active:scale-[0.95] active:shadow-clay-pressed'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-white/20 text-white shadow-inner'
                            : `bg-gradient-to-br ${item.iconGradient} text-white shadow-clay-orb group-hover:scale-105`
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-nunito font-extrabold truncate leading-tight">
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] truncate mt-0.5 font-medium ${
                            isActive ? 'text-violet-200' : 'text-clay-muted'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2.5 py-0.5 text-[10px] font-nunito font-black rounded-full whitespace-nowrap shadow-clay-pill ${
                          isActive
                            ? 'bg-white/30 text-white'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 3: Master Data dengan Sub Menu */}
          <div>
            <div className="mb-2 px-3">
              <span className="text-[11px] font-nunito font-black uppercase tracking-wider text-violet-400">
                Master Data
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-white/70 shadow-clay-card border border-white/80">
              {/* Parent Accordion Button */}
              <button
                type="button"
                id="nav-btn-manajemen-data"
                onClick={handleToggleManagement}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                  isManagementTab
                    ? 'bg-violet-50 text-violet-900 font-nunito font-extrabold border-b border-violet-100'
                    : 'text-clay-foreground hover:bg-white font-nunito font-extrabold'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-clay-orb">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-nunito font-extrabold leading-tight">Master Data</div>
                    <div className="text-[10px] text-clay-muted font-medium">Siswa, Kelas, Wali & User</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isManagementTab && (
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                  )}
                  {isManagementOpen ? (
                    <ChevronDown className="w-4 h-4 text-violet-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-violet-400" />
                  )}
                </div>
              </button>

              {/* Sub Menus: Data Siswa, Data Kelas, Data Wali Kelas, User */}
              {isManagementOpen && (
                <div className="p-1.5 space-y-1 bg-[#EFEBF5]/50">
                  {managementSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive =
                      currentTab === sub.id || (sub.id === 'data-siswa' && currentTab === 'students');

                    return (
                      <button
                        key={sub.id}
                        id={`nav-sub-${sub.id}`}
                        onClick={() => handleNavClick(sub.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-nunito font-extrabold shadow-clay-button -translate-y-0.5'
                            : 'text-clay-foreground hover:bg-white hover:shadow-xs font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <SubIcon
                            className={`w-4 h-4 shrink-0 ${
                              isSubActive ? 'text-white' : 'text-violet-500'
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-xs truncate leading-tight font-semibold">{sub.label}</div>
                            <div
                              className={`text-[9.5px] truncate font-medium ${
                                isSubActive ? 'text-violet-200' : 'text-clay-muted'
                              }`}
                            >
                              {sub.sublabel}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-nunito font-extrabold shadow-clay-pill ${
                            isSubActive
                              ? 'bg-white/30 text-white'
                              : 'bg-white text-clay-foreground'
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
          <div className="p-4 rounded-[26px] bg-white/90 shadow-clay-card border border-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-nunito font-extrabold text-clay-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-600" />
                Presensi Hari Ini
              </span>
              <span className="text-xs font-nunito font-black text-violet-600">
                {attendancePercent}%
              </span>
            </div>

            {/* Clay Progress Bar (Recessed Track + Convex Fill) */}
            <div className="w-full bg-[#EFEBF5] rounded-full h-2.5 overflow-hidden mb-3 shadow-clay-pressed p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${attendancePercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-2xl bg-[#EFEBF5]/70 shadow-clay-pressed">
                <div className="text-[10px] text-clay-muted font-bold">Hadir</div>
                <div className="text-xs font-nunito font-black text-emerald-600">{todayCount.hadir}</div>
              </div>
              <div className="p-2 rounded-2xl bg-[#EFEBF5]/70 shadow-clay-pressed">
                <div className="text-[10px] text-clay-muted font-bold">Alpa</div>
                <div className="text-xs font-nunito font-black text-rose-500">{todayCount.alpa}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Positif Discipline Motto */}
        <div className="p-3.5 border-t border-violet-100 bg-white/40 rounded-b-[36px]">
          <div className="flex items-start space-x-2.5 text-xs text-clay-muted">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-nunito font-extrabold text-clay-foreground text-[11px]">SMAN 1 Batu • Presensi</p>
              <p className="text-[10px] text-clay-muted mt-0.5 leading-tight font-medium">
                36 Rombel dengan integrasi disiplin positif.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
