import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Briefcase,
  Check,
  X,
  RotateCcw,
  Save,
  Search,
  Download,
  Upload,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Eye,
  SlidersHorizontal,
  LayoutDashboard,
  ClipboardCheck,
  CalendarRange,
  FileWarning,
  DoorOpen,
  ShieldAlert,
  CalendarDays,
  Mail,
  Users,
  KeyRound,
  Filter
} from 'lucide-react';
import { RoleMatrixMap, UserRole, ActionPermissionKey, RolePermissionConfig } from '../types';
import {
  NAV_TAB_DEFINITIONS,
  ACTION_PERMISSION_DEFINITIONS,
  initialRoleMatrix,
  normalizeRole
} from '../data/roleMatrixData';

interface RoleMatrixSettingsViewProps {
  matrix: RoleMatrixMap;
  onSaveMatrix: (updatedMatrix: RoleMatrixMap) => void;
  onResetMatrix?: () => void;
  currentRole?: string;
  totalUsersPerRole?: Record<UserRole, number>;
}

type ViewMode = 'grid' | 'role_focus' | 'preview';

export const RoleMatrixSettingsView: React.FC<RoleMatrixSettingsViewProps> = ({
  matrix,
  onSaveMatrix,
  onResetMatrix,
  currentRole = 'Admin',
  totalUsersPerRole,
}) => {
  // Local working copy for editing before saving
  const [localMatrix, setLocalMatrix] = useState<RoleMatrixMap>(() => JSON.parse(JSON.stringify(matrix)));
  const [selectedRoleFocus, setSelectedRoleFocus] = useState<UserRole>('Wali Kelas');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync if external matrix prop updates and local hasn't been modified or initially
  const isDirty = useMemo(() => {
    return JSON.stringify(localMatrix) !== JSON.stringify(matrix);
  }, [localMatrix, matrix]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const rolesList: UserRole[] = ['Admin', 'Wali Kelas', 'Guru', 'Tendik'];

  const roleMetaInfo = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return {
          label: 'Administrator',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          gradient: 'from-purple-600 to-indigo-600',
          icon: ShieldCheck,
          desc: 'Pengaturan penuh sistem, data master, aturan, dan semua menu.',
        };
      case 'Wali Kelas':
        return {
          label: 'Wali Kelas',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          gradient: 'from-emerald-600 to-teal-600',
          icon: UserCheck,
          desc: 'Pembina 36 rombel, presensi siswa, pembinaan & surat panggilan.',
        };
      case 'Guru':
        return {
          label: 'Guru',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          gradient: 'from-sky-600 to-blue-600',
          icon: GraduationCap,
          desc: 'Piket harian, input pelanggaran tata tertib & verifikasi izin.',
        };
      case 'Tendik':
        return {
          label: 'Tendik',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          gradient: 'from-amber-600 to-orange-600',
          icon: Briefcase,
          desc: 'Tata Usaha, arsip persuratan, verifikasi data induk & pelaporan.',
        };
    }
  };

  // Toggle Tab Permission for a role
  const handleToggleTab = (role: UserRole, tabId: string) => {
    if (role === 'Admin') return; // Admin has permanent full access

    setLocalMatrix((prev) => {
      const roleConfig = prev[role] || { ...initialRoleMatrix[role] };
      const currentTabs = roleConfig.allowedTabs || [];
      const hasTab = currentTabs.includes(tabId);
      const nextTabs = hasTab
        ? currentTabs.filter((t) => t !== tabId)
        : [...currentTabs, tabId];

      return {
        ...prev,
        [role]: {
          ...roleConfig,
          allowedTabs: nextTabs,
          lastUpdated: new Date().toISOString().split('T')[0],
        },
      };
    });
  };

  // Toggle Action Permission for a role
  const handleToggleAction = (role: UserRole, actionKey: ActionPermissionKey) => {
    if (role === 'Admin') return; // Admin has permanent full actions

    setLocalMatrix((prev) => {
      const roleConfig = prev[role] || { ...initialRoleMatrix[role] };
      const currentActions = { ...roleConfig.actionPermissions };
      currentActions[actionKey] = !currentActions[actionKey];

      return {
        ...prev,
        [role]: {
          ...roleConfig,
          actionPermissions: currentActions,
          lastUpdated: new Date().toISOString().split('T')[0],
        },
      };
    });
  };

  // Quick Preset Actions for selected role focus
  const handleSetRoleAllPermissions = (role: UserRole, enable: boolean) => {
    if (role === 'Admin') return;

    setLocalMatrix((prev) => {
      const allTabIds = NAV_TAB_DEFINITIONS.map((t) => t.id);
      const newActions: Record<ActionPermissionKey, boolean> = {} as any;
      ACTION_PERMISSION_DEFINITIONS.forEach((a) => {
        newActions[a.key] = enable;
      });

      return {
        ...prev,
        [role]: {
          ...prev[role],
          allowedTabs: enable ? allTabIds : ['dashboard'],
          actionPermissions: newActions,
          lastUpdated: new Date().toISOString().split('T')[0],
        },
      };
    });
    showToast(`Hak akses role ${role} diubah menjadi: ${enable ? 'Semua Diaktifkan' : 'Akses Dibatasi'}.`);
  };

  const handleResetSingleRole = (role: UserRole) => {
    setLocalMatrix((prev) => ({
      ...prev,
      [role]: JSON.parse(JSON.stringify(initialRoleMatrix[role])),
    }));
    showToast(`Hak akses role ${role} dikembalikan ke standar awal.`);
  };

  // Commit Save
  const handleSaveAll = () => {
    onSaveMatrix(localMatrix);
    showToast('Konfigurasi matriks hak akses berhasil disimpan dan disinkronkan.');
  };

  // Reset all to default school matrix
  const handleConfirmResetAll = () => {
    const defaultData = JSON.parse(JSON.stringify(initialRoleMatrix));
    setLocalMatrix(defaultData);
    if (onResetMatrix) {
      onResetMatrix();
    } else {
      onSaveMatrix(defaultData);
    }
    setShowResetConfirm(false);
    showToast('Seluruh matriks role berhasil dikembalikan ke standar awal sekolah.');
  };

  // Export matrix config to JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(localMatrix, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Matriks_Hak_Akses_SMAN1Batu_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('File konfigurasi matriks berhasil diunduh.');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed?.Admin && parsed?.['Wali Kelas'] && parsed?.Guru && parsed?.Tendik) {
          setLocalMatrix(parsed);
          showToast('Konfigurasi matriks berhasil dimuat dari file JSON. Silakan klik "Simpan" untuk menerapkan.');
        } else {
          alert('Format berkas JSON tidak sesuai struktur matriks hak akses.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON: ' + err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter definitions by search and category
  const filteredNavTabs = useMemo(() => {
    return NAV_TAB_DEFINITIONS.filter((tab) => {
      if (selectedCategory !== 'ALL' && selectedCategory !== 'nav_menu' && tab.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return tab.label.toLowerCase().includes(q) || tab.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const filteredActionPermissions = useMemo(() => {
    return ACTION_PERMISSION_DEFINITIONS.filter((act) => {
      if (selectedCategory !== 'ALL' && selectedCategory === 'nav_menu') {
        return false;
      }
      if (selectedCategory !== 'ALL' && act.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return act.label.toLowerCase().includes(q) || act.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Group actions by category
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    NAV_TAB_DEFINITIONS.forEach((t) => cats.add(t.category));
    ACTION_PERMISSION_DEFINITIONS.forEach((a) => cats.add(a.category));
    return Array.from(cats);
  }, []);

  return (
    <div className="space-y-6 pb-12 font-roboto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 sm:p-8 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#0284C7]/15 text-[#0284C7] border border-[#0284C7]/20 shadow-xs">
                RBAC • Role-Based Access Control
              </span>
              <span className="text-[#334155]/40 text-xs">•</span>
              <span className="text-[#334155] text-xs font-bold">SMAN 1 Batu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] text-white flex items-center justify-center shadow-xs">
                <Sliders className="w-5 h-5" />
              </div>
              <span>Pengaturan Matriks Hak Akses User</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#334155] mt-2 max-w-2xl leading-relaxed">
              Atur hak akses operasional dan visibilitas menu untuk setiap peran pengguna (
              <strong className="text-[#0F172A]">Administrator</strong>,{' '}
              <strong className="text-[#0F172A]">Wali Kelas</strong>,{' '}
              <strong className="text-[#0F172A]">Guru</strong>, dan{' '}
              <strong className="text-[#0F172A]">Tendik</strong>). Perubahan akan langsung diterapkan ke seluruh sesi pengguna terkait.
            </p>
          </div>

          {/* Action Button Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Ada Perubahan Belum Disimpan</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/90 hover:bg-white text-[#334155] font-extrabold text-xs rounded-2xl transition-all duration-200 cursor-pointer border border-slate-200 shadow-xs hover:-translate-y-0.5 active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset Standar</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              title="Unduh konfigurasi matriks dalam format JSON"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/90 hover:bg-white text-[#0F172A] font-extrabold text-xs rounded-2xl transition-all duration-200 cursor-pointer border border-slate-200 shadow-xs hover:-translate-y-0.5 active:scale-95"
            >
              <Download className="w-4 h-4 text-[#0284C7]" />
              <span>Ekspor JSON</span>
            </button>

            <label className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/90 hover:bg-white text-[#0F172A] font-extrabold text-xs rounded-2xl transition-all duration-200 cursor-pointer border border-slate-200 shadow-xs hover:-translate-y-0.5 active:scale-95">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Impor JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={!isDirty}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-200 shadow-xs cursor-pointer ${
                isDirty
                  ? 'bg-gradient-to-br from-[#0284C7] to-[#4F46E5] hover:from-[#0369A1] hover:to-[#4338CA] text-white hover:-translate-y-0.5 active:scale-95 shadow-md shadow-sky-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Matriks</span>
            </button>
          </div>
        </div>

        {/* 4 Role Highlight Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-sky-100/60">
          {rolesList.map((role) => {
            const meta = roleMetaInfo(role);
            const RoleIcon = meta.icon;
            const isSelected = selectedRoleFocus === role;
            const userCount = totalUsersPerRole?.[role] ?? 0;
            const config = localMatrix[role];
            const activeTabsCount = config?.allowedTabs?.length || 0;
            const activeActionsCount = config?.actionPermissions
              ? Object.values(config.actionPermissions).filter(Boolean).length
              : 0;

            return (
              <div
                key={role}
                onClick={() => {
                  setSelectedRoleFocus(role);
                  if (viewMode === 'grid') setViewMode('role_focus');
                }}
                className={`p-4 rounded-[24px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  isSelected && viewMode === 'role_focus'
                    ? 'bg-gradient-to-br from-white via-sky-50 to-[#E0F2FE] border-2 border-[#0284C7] shadow-sm -translate-y-1'
                    : 'bg-white/80 border border-slate-200/80 hover:border-[#0284C7]/50 shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${meta.gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <RoleIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-[#334155] border border-slate-200">
                    {userCount > 0 ? `${userCount} Akun` : role === 'Admin' ? 'Sistem' : 'Multi-User'}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-black text-[#0F172A] flex items-center justify-between">
                    <span>{meta.label}</span>
                    {role === 'Admin' ? (
                      <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                        Hak Penuh
                      </span>
                    ) : (
                      <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full">
                        {activeTabsCount} Menu • {activeActionsCount} Aksi
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#334155] mt-1 line-clamp-2 leading-relaxed">
                    {meta.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[28px] border border-white/60 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-[#E2F1FD] rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Matriks Semua Role (Grid)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('role_focus')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'role_focus'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Fokus Konfigurasi Per-Role</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulasi &amp; Pratinjau Menu</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#334155]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari izin fitur, menu, atau wewenang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#334155]/60 hover:text-[#0F172A]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[#334155] font-extrabold text-[11px] shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#0284C7]" />
            Kategori:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'bg-white text-[#334155] hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua Modul
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('nav_menu')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'nav_menu'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'bg-white text-[#334155] hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Khusus Menu Navigasi Sidebar
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'bg-white text-[#334155] hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MATRIKS SEMUA ROLE (GRID OVERVIEW TABLE) */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Section A: Hak Akses Menu Navigasi Sidebar */}
          {(selectedCategory === 'ALL' || selectedCategory === 'nav_menu') && (
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 overflow-hidden shadow-sm">
              <div className="p-5 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border-b border-sky-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-[#0F172A] flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-[#0284C7]" />
                    <span>1. Hak Akses Visibilitas Menu Navigasi Sidebar</span>
                  </h3>
                  <p className="text-[11px] text-[#334155] mt-0.5">
                    Menentukan halaman/menu yang muncul pada menu sidebar kiri setiap peran pengguna.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#0284C7] bg-white px-3 py-1 rounded-full border border-sky-200">
                  {filteredNavTabs.length} Menu
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[#334155] font-black text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Menu &amp; Modul Halaman</th>
                      <th className="py-3.5 px-4 min-w-[240px]">Keterangan Fungsi</th>
                      <th className="py-3.5 px-4 text-center w-28 text-purple-900 bg-purple-50/50">1. Admin</th>
                      <th className="py-3.5 px-4 text-center w-32 text-emerald-900 bg-emerald-50/50">2. Wali Kelas</th>
                      <th className="py-3.5 px-4 text-center w-28 text-sky-900 bg-sky-50/50">3. Guru</th>
                      <th className="py-3.5 px-4 text-center w-28 text-amber-900 bg-amber-50/50">4. Tendik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNavTabs.map((tab, idx) => {
                      return (
                        <tr key={tab.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-[#334155]/60 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#E2F1FD] text-[#0284C7] flex items-center justify-center shrink-0">
                                <LayoutDashboard className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-extrabold text-[#0F172A]">{tab.label}</div>
                                <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-bold">
                                  {tab.category}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#334155] text-[11px] leading-relaxed">
                            {tab.description}
                          </td>

                          {/* 1. Admin (Always True) */}
                          <td className="py-3.5 px-4 text-center bg-purple-50/30">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold shadow-xs">
                              <Check className="w-4 h-4" />
                            </span>
                          </td>

                          {/* 2. Wali Kelas */}
                          <td className="py-3.5 px-4 text-center bg-emerald-50/30">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={localMatrix['Wali Kelas']?.allowedTabs?.includes(tab.id) || false}
                                onChange={() => handleToggleTab('Wali Kelas', tab.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                            </label>
                          </td>

                          {/* 3. Guru */}
                          <td className="py-3.5 px-4 text-center bg-sky-50/30">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={localMatrix['Guru']?.allowedTabs?.includes(tab.id) || false}
                                onChange={() => handleToggleTab('Guru', tab.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0284C7] relative"></div>
                            </label>
                          </td>

                          {/* 4. Tendik */}
                          <td className="py-3.5 px-4 text-center bg-amber-50/30">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={localMatrix['Tendik']?.allowedTabs?.includes(tab.id) || false}
                                onChange={() => handleToggleTab('Tendik', tab.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 relative"></div>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section B: Hak Akses Tindakan Operasional (Action Permissions) */}
          {(selectedCategory === 'ALL' || selectedCategory !== 'nav_menu') && (
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 overflow-hidden shadow-sm">
              <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent border-b border-sky-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-[#0F172A] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>2. Hak Akses Tindakan &amp; Operasional Khusus</span>
                  </h3>
                  <p className="text-[11px] text-[#334155] mt-0.5">
                    Wewenang melakukan input, edit, hapus, ekspor data, persetujuan izin, dan cetak dokumen resmi.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200">
                  {filteredActionPermissions.length} Tindakan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[#334155] font-black text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4 min-w-[240px]">Tindakan Operasional</th>
                      <th className="py-3.5 px-4 min-w-[240px]">Keterangan Wewenang</th>
                      <th className="py-3.5 px-4 text-center w-28 text-purple-900 bg-purple-50/50">1. Admin</th>
                      <th className="py-3.5 px-4 text-center w-32 text-emerald-900 bg-emerald-50/50">2. Wali Kelas</th>
                      <th className="py-3.5 px-4 text-center w-28 text-sky-900 bg-sky-50/50">3. Guru</th>
                      <th className="py-3.5 px-4 text-center w-28 text-amber-900 bg-amber-50/50">4. Tendik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActionPermissions.map((act, idx) => {
                      return (
                        <tr key={act.key} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-[#334155]/60 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-[#0F172A]">{act.label}</div>
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                              {act.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#334155] text-[11px] leading-relaxed">
                            {act.description}
                          </td>

                          {/* 1. Admin */}
                          <td className="py-3.5 px-4 text-center bg-purple-50/30">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold shadow-xs">
                              <Check className="w-4 h-4" />
                            </span>
                          </td>

                          {/* 2. Wali Kelas */}
                          <td className="py-3.5 px-4 text-center bg-emerald-50/30">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={localMatrix['Wali Kelas']?.actionPermissions?.[act.key] || false}
                                onChange={() => handleToggleAction('Wali Kelas', act.key)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                            </label>
                          </td>

                          {/* 3. Guru */}
                          <td className="py-3.5 px-4 text-center bg-sky-50/30">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={localMatrix['Guru']?.actionPermissions?.[act.key] || false}
                                onChange={() => handleToggleAction('Guru', act.key)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0284C7] relative"></div>
                            </label>
                          </td>

                          {/* 4. Tendik */}
                          <td className="py-3.5 px-4 text-center bg-amber-50/30">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={localMatrix['Tendik']?.actionPermissions?.[act.key] || false}
                                onChange={() => handleToggleAction('Tendik', act.key)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 relative"></div>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FOKUS KONFIGURASI PER-ROLE (DEDICATED ROLE EDITOR) */}
      {/* ========================================================================= */}
      {viewMode === 'role_focus' && (
        <div className="space-y-6">
          {/* Active Role Selector Tab Bar */}
          <div className="flex items-center gap-2 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xs">
            {rolesList.map((r) => {
              const meta = roleMetaInfo(r);
              const Icon = meta.icon;
              const isSelected = selectedRoleFocus === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRoleFocus(r)}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-r ${meta.gradient} text-white shadow-sm`
                      : 'text-[#334155] hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role Summary & Preset Actions */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black ${roleMetaInfo(selectedRoleFocus).badgeClass}`}>
                  Peran: {selectedRoleFocus}
                </span>
                {selectedRoleFocus === 'Admin' && (
                  <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                    Super Admin • Wewenang Penuh Mutlak
                  </span>
                )}
              </div>
              <p className="text-xs text-[#334155] mt-1.5 leading-relaxed max-w-2xl">
                {roleMetaInfo(selectedRoleFocus).desc}
              </p>
            </div>

            {selectedRoleFocus !== 'Admin' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetRoleAllPermissions(selectedRoleFocus, true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer active:scale-95"
                >
                  Beri Semua Hak
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRoleAllPermissions(selectedRoleFocus, false)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer active:scale-95"
                >
                  Batasi Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleResetSingleRole(selectedRoleFocus)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#334155] text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer active:scale-95"
                >
                  Reset Standar
                </button>
              </div>
            )}
          </div>

          {/* Two-Column Grid: Allowed Tabs & Action Permissions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Allowed Nav Tabs */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <h3 className="font-black text-sm text-[#0F172A] flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-[#0284C7]" />
                  <span>Menu Navigasi Sidebar ({localMatrix[selectedRoleFocus]?.allowedTabs?.length || 0})</span>
                </h3>
                <span className="text-[11px] text-[#334155]">Centang menu yang aktif</span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {NAV_TAB_DEFINITIONS.map((tab) => {
                  const isChecked = selectedRoleFocus === 'Admin' || localMatrix[selectedRoleFocus]?.allowedTabs?.includes(tab.id);
                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleToggleTab(selectedRoleFocus, tab.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-sky-50/70 border-sky-200 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-[#0284C7] text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-extrabold text-xs text-[#0F172A] truncate">{tab.label}</div>
                          <div className="text-[10px] text-[#334155] truncate">{tab.category}</div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {selectedRoleFocus === 'Admin' ? (
                          <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-5 h-5 text-[#0284C7] rounded-lg border-slate-300 focus:ring-[#0284C7] cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Action Permissions */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <h3 className="font-black text-sm text-[#0F172A] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Wewenang Tindakan Khusus</span>
                </h3>
                <span className="text-[11px] text-[#334155]">Operasional &amp; Approval</span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {ACTION_PERMISSION_DEFINITIONS.map((act) => {
                  const isChecked = selectedRoleFocus === 'Admin' || !!localMatrix[selectedRoleFocus]?.actionPermissions?.[act.key];
                  return (
                    <div
                      key={act.key}
                      onClick={() => handleToggleAction(selectedRoleFocus, act.key)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 opacity-70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-[#0F172A]">{act.label}</div>
                        <div className="text-[10px] text-[#334155] leading-relaxed mt-0.5">{act.description}</div>
                      </div>

                      <div className="shrink-0">
                        {selectedRoleFocus === 'Admin' ? (
                          <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                            Penuh
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-5 h-5 text-emerald-600 rounded-lg border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: SIMULASI & PRATINJAU MENU ROLE */}
      {/* ========================================================================= */}
      {viewMode === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sky-100">
              <div>
                <h3 className="font-black text-lg text-[#0F172A] flex items-center gap-2.5">
                  <Eye className="w-5 h-5 text-emerald-600" />
                  <span>Simulasi Pratinjau Tampilan Pengguna Berdasarkan Role</span>
                </h3>
                <p className="text-xs text-[#334155] mt-1">
                  Pilih peran di bawah ini untuk mensimulasikan menu dan wewenang apa saja yang aktif pada antarmuka aplikasi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {rolesList.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRoleFocus(r)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedRoleFocus === r
                        ? 'bg-[#0284C7] text-white shadow-xs'
                        : 'bg-slate-100 text-[#334155] hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Simulated Sidebar Widget */}
              <div className="p-5 bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE]/50 rounded-[28px] border border-[#E0F2FE] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-sky-200/60">
                  <span className="font-black text-xs text-[#0F172A]">Pratinjau Sidebar</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${roleMetaInfo(selectedRoleFocus).badgeClass}`}>
                    {selectedRoleFocus}
                  </span>
                </div>

                <div className="space-y-1.5 font-roboto">
                  {NAV_TAB_DEFINITIONS.filter((tab) =>
                    selectedRoleFocus === 'Admin' || localMatrix[selectedRoleFocus]?.allowedTabs?.includes(tab.id)
                  ).map((tab) => (
                    <div
                      key={tab.id}
                      className="flex items-center gap-2.5 px-3 py-2 bg-white/80 rounded-xl text-xs font-bold text-[#0F172A] shadow-2xs"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span className="truncate">{tab.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allowed Capabilities Summary */}
              <div className="md:col-span-2 p-5 bg-white/90 rounded-[28px] border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <span className="font-black text-xs text-[#0F172A]">
                    Daftar Wewenang Aktif untuk Role {selectedRoleFocus}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {selectedRoleFocus === 'Admin'
                      ? 'Semua Wewenang Penuh'
                      : `${Object.values(localMatrix[selectedRoleFocus]?.actionPermissions || {}).filter(Boolean).length} Tindakan Diizinkan`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {ACTION_PERMISSION_DEFINITIONS.map((act) => {
                    const isGranted =
                      selectedRoleFocus === 'Admin' || !!localMatrix[selectedRoleFocus]?.actionPermissions?.[act.key];

                    return (
                      <div
                        key={act.key}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          isGranted
                            ? 'bg-emerald-50/60 border-emerald-200 text-[#0F172A]'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        {isGranted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-extrabold">{act.label}</div>
                          <div className="text-[10px] mt-0.5 line-clamp-1">{act.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RESET CONFIRMATION */}
      {/* ========================================================================= */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-md w-full shadow-xl border border-white/80 p-6 sm:p-8 space-y-4 text-xs">
            <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <RotateCcw className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-[#0F172A] text-lg">Reset Seluruh Matriks Hak Akses?</h3>
              <p className="text-[#334155] mt-2 leading-relaxed">
                Tindakan ini akan mengembalikan seluruh pengaturan wewenang untuk 4 peran (Admin, Wali Kelas, Guru, Tendik) ke konfigurasi standar awal SMAN 1 Batu.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#334155] rounded-2xl font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAll}
                className="px-6 py-2.5 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all"
              >
                Ya, Reset ke Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
