import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  CalendarRange, 
  ShieldAlert, 
  Users,
  Award,
  Clock,
  Sparkles,
  Database,
  Layers,
  UserCheck,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  FileWarning,
  SlidersHorizontal,
  CalendarDays,
  Mail,
  ShieldCheck,
  UserCog
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
    },
    {
      id: 'attendance' as NavTab,
      label: 'Presensi Harian',
      sublabel: 'Input & pembaruan absensi',
      icon: ClipboardCheck,
      badge: `${todayCount.hadir}/${todayCount.total}`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const recapSubItems = [
    {
      id: 'recap' as NavTab,
      label: 'Rekap Presensi',
      sublabel: 'Rentang tanggal & ekspor',
      icon: CalendarRange,
      badge: 'Excel / PDF',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'rekap-surat-izin' as NavTab,
      label: 'Rekap Surat Izin',
      sublabel: 'Siswa belum kumpul surat',
      icon: FileWarning,
      badge: totalPendingLetters > 0 ? `${totalPendingLetters} Siswa` : 'Lengkap',
      badgeColor: totalPendingLetters > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const disciplineNavItems = [
    {
      id: 'discipline' as NavTab,
      label: 'Input Data Pelanggaran',
      sublabel: 'Catat pelanggaran & riwayat',
      icon: ShieldAlert,
      badge: `${totalDisciplineCases} Data`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'rekap-pelanggaran' as NavTab,
      label: 'Rekap Pelanggaran',
      sublabel: 'Rentang tanggal & ekspor laporan',
      icon: CalendarDays,
      badge: 'Excel / PDF',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'tagihan-pembinaan' as NavTab,
      label: 'Tagihan Pembinaan',
      sublabel: 'Siswa belum selesai pembinaan',
      icon: FileWarning,
      badge: `${totalPendingDebt} Siswa`,
      badgeColor: totalPendingDebt > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'surat-panggilan' as NavTab,
      label: 'Surat Panggilan Orang Tua',
      sublabel: 'Panggilan wali & riwayat pelanggaran',
      icon: Mail,
      badge: 'Resmi',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'aturan-pelanggaran' as NavTab,
      label: 'Manajemen Aturan',
      sublabel: 'Input, edit & hapus jenis pelanggaran',
      icon: SlidersHorizontal,
      badge: 'Katalog',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  const managementSubItems = [
    {
      id: 'data-siswa' as NavTab,
      label: 'Data Siswa',
      sublabel: 'Master 1.300 siswa',
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
      sublabel: 'Role: Admin, Wali, Guru, Tendik',
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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* Section: Presensi & Kehadiran */}
          <div>
            <div className="mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-teal-500/30 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate leading-tight">{item.label}</div>
                        <div
                          className={`text-[10.5px] truncate mt-0.5 ${
                            isActive ? 'text-teal-100' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full border whitespace-nowrap ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
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
              <div className="pt-1">
                <button
                  type="button"
                  id="nav-btn-rekap-kehadiran-toggle"
                  onClick={handleToggleRecap}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                    isRecapTab && !isRecapOpen
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isRecapTab
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      <CalendarRange className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate text-slate-900">Rekap Kehadiran</div>
                      <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                        Rekap presensi &amp; surat izin
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 ml-2">
                    {totalPendingLetters > 0 && (
                      <span className="px-1.5 py-0.5 text-[9.5px] font-bold rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                        {totalPendingLetters}
                      </span>
                    )}
                    {isRecapOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Rekap Kehadiran Sub-items */}
                {isRecapOpen && (
                  <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-1 mt-1 animate-in fade-in duration-150">
                    {recapSubItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = currentTab === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          id={`nav-sub-${subItem.id}`}
                          onClick={() => handleNavClick(subItem.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all group cursor-pointer ${
                            isSubActive
                              ? 'bg-teal-600 text-white shadow-2xs font-semibold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive
                                  ? 'text-white'
                                  : 'text-slate-400 group-hover:text-slate-600'
                              }`}
                            />
                            <div className="truncate">
                              <div className="text-xs font-semibold truncate leading-tight">
                                {subItem.label}
                              </div>
                              <div
                                className={`text-[10px] truncate ${
                                  isSubActive ? 'text-teal-100' : 'text-slate-400'
                                }`}
                              >
                                {subItem.sublabel}
                              </div>
                            </div>
                          </div>

                          {subItem.badge && (
                            <span
                              className={`ml-1 px-1.5 py-0.5 text-[9.5px] font-semibold rounded-md border whitespace-nowrap ${
                                isSubActive
                                  ? 'bg-white/20 text-white border-white/30'
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

          {/* Section: Disiplin Positif */}
          <div>
            <div className="mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-teal-500/30 text-white'
                            : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate leading-tight">{item.label}</div>
                        <div
                          className={`text-[10.5px] truncate mt-0.5 ${
                            isActive ? 'text-teal-100' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full border whitespace-nowrap ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
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

          {/* Section: Manajemen Data dengan Sub Menu */}
          <div>
            <div className="mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Master Data
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
              {/* Parent Accordion Button */}
              <button
                type="button"
                id="nav-btn-manajemen-data"
                onClick={handleToggleManagement}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  isManagementTab
                    ? 'bg-teal-50 text-teal-900 font-bold border-b border-teal-200/60'
                    : 'text-slate-800 hover:bg-slate-100 font-semibold'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isManagementTab
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">Manajemen Data</div>
                    <div className="text-[10px] text-slate-500 font-normal">Siswa, Kelas & Wali</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isManagementTab && (
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                  )}
                  {isManagementOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Sub Menus: Data Siswa, Data Kelas, Data Wali Kelas */}
              {isManagementOpen && (
                <div className="p-1.5 space-y-1 bg-white">
                  {managementSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive =
                      currentTab === sub.id || (sub.id === 'data-siswa' && currentTab === 'students');

                    return (
                      <button
                        key={sub.id}
                        id={`nav-sub-${sub.id}`}
                        onClick={() => handleNavClick(sub.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-teal-600 text-white font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <SubIcon
                            className={`w-4 h-4 shrink-0 ${
                              isSubActive ? 'text-white' : 'text-slate-400'
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-xs truncate">{sub.label}</div>
                            <div
                              className={`text-[10px] truncate ${
                                isSubActive ? 'text-teal-100' : 'text-slate-400'
                              }`}
                            >
                              {sub.sublabel}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isSubActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600'
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Presensi Hari Ini
              </span>
              <span className="text-xs font-extrabold text-teal-600">
                {attendancePercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2.5">
              <div
                className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${attendancePercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-medium">Hadir</div>
                <div className="text-xs font-bold text-teal-700">{todayCount.hadir}</div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-medium">Alpa</div>
                <div className="text-xs font-bold text-rose-600">{todayCount.alpa}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Positif Discipline Motto */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-start space-x-2.5 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 text-[11px]">SMAN 1 Batu • Presensi</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                36 Rombel (X-1 s/d XII-12) dengan integrasi disiplin positif.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

