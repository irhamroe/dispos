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
  Filter,
  Award,
  Crown,
  HeartHandshake,
  Clock,
  Plus,
  Trash2,
  BookOpen,
  Palette,
  CheckCircle,
  HelpCircle,
  Sparkle
} from 'lucide-react';
import { RoleMatrixMap, UserRole, ActionPermissionKey, RolePermissionConfig } from '../types';
import {
  NAV_TAB_DEFINITIONS,
  ACTION_PERMISSION_DEFINITIONS,
  initialRoleMatrix,
  normalizeRole,
  createDefaultActionPermissions
} from '../data/roleMatrixData';

interface RoleMatrixSettingsViewProps {
  matrix: RoleMatrixMap;
  onSaveMatrix: (updatedMatrix: RoleMatrixMap) => void;
  onResetMatrix?: () => void;
  currentRole?: string;
  totalUsersPerRole?: Record<string, number>;
}

type ViewMode = 'grid' | 'role_focus' | 'preview';

interface ThemeColorOption {
  key: string;
  name: string;
  badgeClass: string;
  gradient: string;
  textClass: string;
  bgHeader: string;
}

const THEME_OPTIONS: ThemeColorOption[] = [
  {
    key: 'purple',
    name: 'Ungu / Royal',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    gradient: 'from-purple-600 to-indigo-600',
    textClass: 'text-purple-900',
    bgHeader: 'bg-purple-50/50',
  },
  {
    key: 'emerald',
    name: 'Hijau / Emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    gradient: 'from-emerald-600 to-teal-600',
    textClass: 'text-emerald-900',
    bgHeader: 'bg-emerald-50/50',
  },
  {
    key: 'sky',
    name: 'Biru / Sky',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    gradient: 'from-sky-600 to-blue-600',
    textClass: 'text-sky-900',
    bgHeader: 'bg-sky-50/50',
  },
  {
    key: 'indigo',
    name: 'Indigo / Deep',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    gradient: 'from-indigo-600 to-violet-600',
    textClass: 'text-indigo-900',
    bgHeader: 'bg-indigo-50/50',
  },
  {
    key: 'amber',
    name: 'Kuning / Amber',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    gradient: 'from-amber-600 to-orange-600',
    textClass: 'text-amber-900',
    bgHeader: 'bg-amber-50/50',
  },
  {
    key: 'rose',
    name: 'Merah / Rose',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    gradient: 'from-rose-600 to-pink-600',
    textClass: 'text-rose-900',
    bgHeader: 'bg-rose-50/50',
  },
  {
    key: 'violet',
    name: 'Violet / Lavender',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    gradient: 'from-violet-600 to-purple-600',
    textClass: 'text-violet-900',
    bgHeader: 'bg-violet-50/50',
  },
  {
    key: 'cyan',
    name: 'Cyan / Tosca',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    gradient: 'from-cyan-600 to-teal-600',
    textClass: 'text-cyan-900',
    bgHeader: 'bg-cyan-50/50',
  },
  {
    key: 'slate',
    name: 'Gelap / Slate',
    badgeClass: 'bg-slate-800 text-white border-slate-700',
    gradient: 'from-slate-700 to-slate-900',
    textClass: 'text-slate-900',
    bgHeader: 'bg-slate-100/50',
  },
  {
    key: 'teal',
    name: 'Teal / Pirus',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    gradient: 'from-teal-600 to-emerald-600',
    textClass: 'text-teal-900',
    bgHeader: 'bg-teal-50/50',
  },
];

const AVAILABLE_ICONS = [
  { id: 'Crown', label: 'Mahkota / Pimpinan', icon: Crown },
  { id: 'HeartHandshake', label: 'Konseling / BK', icon: HeartHandshake },
  { id: 'Clock', label: 'Jam / Piket', icon: Clock },
  { id: 'GraduationCap', label: 'Toga / Guru', icon: GraduationCap },
  { id: 'Award', label: 'Lencana / Waka', icon: Award },
  { id: 'UserCheck', label: 'Verifikasi / Wali', icon: UserCheck },
  { id: 'ShieldCheck', label: 'Keamanan / Admin', icon: ShieldCheck },
  { id: 'Briefcase', label: 'Koper / Tendik', icon: Briefcase },
  { id: 'BookOpen', label: 'Buku / Perpustakaan', icon: BookOpen },
  { id: 'Users', label: 'Kelompok / Kesiswaan', icon: Users },
  { id: 'Sliders', label: 'Pengaturan / Teknis', icon: Sliders },
];

export const RoleMatrixSettingsView: React.FC<RoleMatrixSettingsViewProps> = ({
  matrix,
  onSaveMatrix,
  onResetMatrix,
  currentRole = 'Admin',
  totalUsersPerRole,
}) => {
  // Local working copy for editing before saving
  const [localMatrix, setLocalMatrix] = useState<RoleMatrixMap>(() => JSON.parse(JSON.stringify(matrix)));
  const [selectedRoleFocus, setSelectedRoleFocus] = useState<string>('Wali Kelas');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Add Role Modal states
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleTheme, setNewRoleTheme] = useState('sky');
  const [newRoleIcon, setNewRoleIcon] = useState('GraduationCap');
  const [cloneFromRole, setCloneFromRole] = useState('Guru');
  const [addRoleError, setAddRoleError] = useState<string | null>(null);

  // Delete Role confirmation state
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Sync if external matrix prop updates and local hasn't been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(localMatrix) !== JSON.stringify(matrix);
  }, [localMatrix, matrix]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Dynamically sorted roles list: standard roles first, then custom roles
  const rolesList: string[] = useMemo(() => {
    const keys = Object.keys(localMatrix);
    const standardOrder = [
      'Admin',
      'Wali Kelas',
      'Guru',
      'Wakasek',
      'Tendik',
      'Satpam',
      'Kepala Sekolah',
      'Guru BK',
      'Guru Piket'
    ];
    return [...keys].sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [localMatrix]);

  const getRoleIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'Crown':
        return Crown;
      case 'HeartHandshake':
        return HeartHandshake;
      case 'Clock':
        return Clock;
      case 'GraduationCap':
        return GraduationCap;
      case 'Award':
        return Award;
      case 'UserCheck':
        return UserCheck;
      case 'Briefcase':
        return Briefcase;
      case 'BookOpen':
        return BookOpen;
      case 'Users':
        return Users;
      case 'Sliders':
        return Sliders;
      case 'ShieldAlert':
        return ShieldAlert;
      case 'ShieldCheck':
      default:
        return ShieldCheck;
    }
  };

  const roleMetaInfo = (role: string) => {
    const config = localMatrix[role];
    switch (role) {
      case 'Admin':
        return {
          label: 'Administrator',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          gradient: 'from-purple-600 to-indigo-600',
          textClass: 'text-purple-900',
          bgHeader: 'bg-purple-50/50',
          icon: ShieldCheck,
          desc: 'Pengaturan penuh sistem, data master, aturan, dan semua menu.',
        };
      case 'Wali Kelas':
        return {
          label: 'Wali Kelas',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          gradient: 'from-emerald-600 to-teal-600',
          textClass: 'text-emerald-900',
          bgHeader: 'bg-emerald-50/50',
          icon: UserCheck,
          desc: 'Pembina 36 rombel, presensi siswa, pembinaan & surat panggilan.',
        };
      case 'Guru':
        return {
          label: 'Guru',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          gradient: 'from-sky-600 to-blue-600',
          textClass: 'text-sky-900',
          bgHeader: 'bg-sky-50/50',
          icon: GraduationCap,
          desc: 'Piket harian, input pelanggaran tata tertib & verifikasi izin.',
        };
      case 'Wakasek':
        return {
          label: 'Wakil Kepala Sekolah',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          gradient: 'from-indigo-600 to-violet-600',
          textClass: 'text-indigo-900',
          bgHeader: 'bg-indigo-50/50',
          icon: Award,
          desc: 'Persetujuan izin keluar sekolah tahap 3, Kesiswaan, Kurikulum, Humas, Sarpras.',
        };
      case 'Tendik':
        return {
          label: 'Tendik',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          gradient: 'from-amber-600 to-orange-600',
          textClass: 'text-amber-900',
          bgHeader: 'bg-amber-50/50',
          icon: Briefcase,
          desc: 'Tata Usaha, arsip persuratan, verifikasi data induk & pelaporan.',
        };
      case 'Satpam':
        return {
          label: 'Satpam / Security',
          badgeClass: 'bg-slate-800 text-white border-slate-700',
          gradient: 'from-slate-700 to-slate-900',
          textClass: 'text-slate-900',
          bgHeader: 'bg-slate-100/50',
          icon: ShieldCheck,
          desc: 'Petugas keamanan gerbang & pemeriksaan e-surat izin keluar sekolah.',
        };
      case 'Kepala Sekolah':
        return {
          label: 'Kepala Sekolah',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          gradient: 'from-rose-600 to-pink-600',
          textClass: 'text-rose-900',
          bgHeader: 'bg-rose-50/50',
          icon: Crown,
          desc: 'Pengawasan eksekutif, rekapitulasi data kehadiran, kedisiplinan dan pelaporan.',
        };
      case 'Guru BK':
        return {
          label: 'Guru BK',
          badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
          gradient: 'from-violet-600 to-purple-600',
          textClass: 'text-violet-900',
          bgHeader: 'bg-violet-50/50',
          icon: HeartHandshake,
          desc: 'Layanan bimbingan konseling, penanganan disiplin & restitusi positif siswa.',
        };
      case 'Guru Piket':
        return {
          label: 'Guru Piket',
          badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          gradient: 'from-cyan-600 to-teal-600',
          textClass: 'text-cyan-900',
          bgHeader: 'bg-cyan-50/50',
          icon: Clock,
          desc: 'Piket gerbang harian, verifikasi izin keluar/masuk dan keterlambatan.',
        };
      default: {
        const theme = THEME_OPTIONS.find((t) => t.badgeClass === config?.badgeClass) || THEME_OPTIONS[2];
        return {
          label: config?.label || role,
          badgeClass: config?.badgeClass || 'bg-slate-100 text-slate-800 border-slate-200',
          gradient: theme.gradient,
          textClass: theme.textClass,
          bgHeader: theme.bgHeader,
          icon: getRoleIconComponent(config?.iconName),
          desc: config?.description || `Peran kustom ${role} dalam sistem perizinan & absensi.`,
        };
      }
    }
  };

  // Toggle Tab Permission for a role
  const handleToggleTab = (role: string, tabId: string) => {
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
  const handleToggleAction = (role: string, actionKey: ActionPermissionKey) => {
    if (role === 'Admin') return; // Admin has permanent full actions

    setLocalMatrix((prev) => {
      const roleConfig = prev[role] || { ...initialRoleMatrix[role] };
      const currentActions = { ...(roleConfig.actionPermissions || {}) };
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
  const handleSetRoleAllPermissions = (role: string, enable: boolean) => {
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

  const handleResetSingleRole = (role: string) => {
    if (initialRoleMatrix[role]) {
      setLocalMatrix((prev) => ({
        ...prev,
        [role]: JSON.parse(JSON.stringify(initialRoleMatrix[role])),
      }));
      showToast(`Hak akses role ${role} dikembalikan ke standar awal.`);
    } else {
      showToast(`Role ${role} adalah role kustom, tidak ada preset default.`);
    }
  };

  // Add New Role Handler
  const handleCreateNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    setAddRoleError(null);

    const trimmedId = newRoleId.trim();
    const trimmedLabel = newRoleLabel.trim() || trimmedId;

    if (!trimmedId) {
      setAddRoleError('Nama/Kode Role wajib diisi.');
      return;
    }

    if (localMatrix[trimmedId]) {
      setAddRoleError(`Role dengan nama "${trimmedId}" sudah terdaftar dalam sistem.`);
      return;
    }

    const theme = THEME_OPTIONS.find((t) => t.key === newRoleTheme) || THEME_OPTIONS[2];
    const sourceConfig = cloneFromRole && localMatrix[cloneFromRole] ? localMatrix[cloneFromRole] : null;

    const newConfig: RolePermissionConfig = {
      role: trimmedId as UserRole,
      label: trimmedLabel,
      description:
        newRoleDescription.trim() ||
        `Peran wewenang ${trimmedLabel} untuk akses menu dan tindakan operasional SMAN 1 Batu.`,
      badgeClass: theme.badgeClass,
      iconName: newRoleIcon,
      isSystemRole: false,
      allowedTabs: sourceConfig ? [...sourceConfig.allowedTabs] : ['dashboard'],
      actionPermissions: sourceConfig
        ? { ...sourceConfig.actionPermissions }
        : createDefaultActionPermissions(false),
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedBy: 'Administrator',
    };

    setLocalMatrix((prev) => ({
      ...prev,
      [trimmedId]: newConfig,
    }));

    setSelectedRoleFocus(trimmedId);
    setIsAddRoleModalOpen(false);
    setNewRoleId('');
    setNewRoleLabel('');
    setNewRoleDescription('');
    showToast(`Role baru "${trimmedLabel}" berhasil ditambahkan ke matriks hak akses.`);
  };

  // Delete Role Handler
  const handleConfirmDeleteRole = () => {
    if (!roleToDelete) return;

    if (localMatrix[roleToDelete]?.isSystemRole) {
      alert('Role sistem bawaan (Admin, Wali Kelas, Guru, dll) tidak dapat dihapus.');
      setRoleToDelete(null);
      return;
    }

    setLocalMatrix((prev) => {
      const copy = { ...prev };
      delete copy[roleToDelete];
      return copy;
    });

    if (selectedRoleFocus === roleToDelete) {
      setSelectedRoleFocus('Wali Kelas');
    }

    showToast(`Role "${roleToDelete}" telah dihapus dari matriks hak akses.`);
    setRoleToDelete(null);
  };

  // Preset Template selector for quick add
  const handleApplyQuickPreset = (presetName: string) => {
    switch (presetName) {
      case 'Kepala Sekolah':
        setNewRoleId('Kepala Sekolah');
        setNewRoleLabel('Kepala Sekolah (Kepsek)');
        setNewRoleDescription('Pimpinan satuan pendidikan: pengawasan eksekutif, rekapitulasi data & laporan.');
        setNewRoleTheme('rose');
        setNewRoleIcon('Crown');
        setCloneFromRole('Wakasek');
        break;
      case 'Guru BK':
        setNewRoleId('Guru BK');
        setNewRoleLabel('Guru Bimbingan Konseling (BK)');
        setNewRoleDescription('Layanan bimbingan konseling, penanganan kasus disiplin, pembinaan & surat panggilan.');
        setNewRoleTheme('violet');
        setNewRoleIcon('HeartHandshake');
        setCloneFromRole('Guru');
        break;
      case 'Guru Piket':
        setNewRoleId('Guru Piket');
        setNewRoleLabel('Guru Piket (Piket Harian)');
        setNewRoleDescription('Piket harian gerbang & ketertiban sekolah, verifikasi izin keluar/masuk Tahap 1.');
        setNewRoleTheme('cyan');
        setNewRoleIcon('Clock');
        setCloneFromRole('Guru');
        break;
      case 'Koordinator Kesiswaan':
        setNewRoleId('Koordinator Kesiswaan');
        setNewRoleLabel('Koordinator Kesiswaan / Disiplin');
        setNewRoleDescription('Koordinasi tata tertib siswa, penegakan pembinaan poin dan pengesahan surat.');
        setNewRoleTheme('indigo');
        setNewRoleIcon('Award');
        setCloneFromRole('Wakasek');
        break;
      case 'Pembina OSIS':
        setNewRoleId('Pembina OSIS');
        setNewRoleLabel('Pembina OSIS & Ekstrakurikuler');
        setNewRoleDescription('Pembinaan organisasi kesiswaan, perizinan dispensasi kegiatan dan absensi khusus.');
        setNewRoleTheme('amber');
        setNewRoleIcon('Users');
        setCloneFromRole('Guru');
        break;
      case 'Pustakawan':
        setNewRoleId('Pustakawan');
        setNewRoleLabel('Pustakawan / Staf Perpustakaan');
        setNewRoleDescription('Pelayanan administrasi literasi perpustakaan dan verifikasi dispensasi jam baca.');
        setNewRoleTheme('teal');
        setNewRoleIcon('BookOpen');
        setCloneFromRole('Tendik');
        break;
      default:
        break;
    }
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
              <span className="text-[#334155]/40 text-xs">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                {rolesList.length} Role Terdaftar
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] text-white flex items-center justify-center shadow-xs">
                <Sliders className="w-5 h-5" />
              </div>
              <span>Pengaturan Matriks Hak Akses User</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#334155] mt-2 max-w-2xl leading-relaxed">
              Atur hak akses operasional, wewenang tindakan, dan visibilitas menu navigasi untuk seluruh peran pengguna sekolah. Anda dapat menambah role baru, mengubah hak akses tiap peran, atau mengekspor konfigurasi.
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
              onClick={() => setIsAddRoleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#0284C7] to-cyan-600 hover:from-[#0369A1] hover:to-cyan-700 text-white font-black text-xs rounded-2xl transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Role Baru</span>
            </button>

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

        {/* Dynamic Role Highlight Selector Cards */}
        <div className="mt-6 pt-6 border-t border-sky-100/60">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs text-[#0F172A] uppercase tracking-wider">
                Daftar Peran Terdaftar ({rolesList.length} Role)
              </span>
              <span className="text-[11px] text-[#334155]/60 font-semibold">• Klik role untuk fokus konfigurasi</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284C7]/10 hover:bg-[#0284C7]/20 text-[#0284C7] text-xs font-black transition-all cursor-pointer border border-[#0284C7]/20 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Role Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
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
              const isSystem = config?.isSystemRole;

              return (
                <div
                  key={role}
                  onClick={() => {
                    setSelectedRoleFocus(role);
                    if (viewMode === 'grid') setViewMode('role_focus');
                  }}
                  className={`p-3.5 rounded-[22px] transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                    isSelected && viewMode === 'role_focus'
                      ? 'bg-gradient-to-br from-white via-sky-50 to-[#E0F2FE] border-2 border-[#0284C7] shadow-sm -translate-y-1'
                      : 'bg-white/80 border border-slate-200/80 hover:border-[#0284C7]/50 shadow-xs hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${meta.gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-[#334155] border border-slate-200">
                        {userCount > 0 ? `${userCount} Akun` : role === 'Admin' ? 'Sistem' : '0 Akun'}
                      </span>
                      {!isSystem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleToDelete(role);
                          }}
                          title={`Hapus role ${role}`}
                          className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer border border-rose-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <div className="text-xs font-black text-[#0F172A] flex items-center justify-between gap-1">
                      <span className="truncate">{meta.label}</span>
                      {role === 'Admin' ? (
                        <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded-full shrink-0">
                          Hak Penuh
                        </span>
                      ) : (
                        <span className="text-[9px] text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded-full shrink-0">
                          {activeTabsCount} Menu
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#334155] mt-1 line-clamp-2 leading-relaxed">
                      {meta.desc}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Role Card */}
            <div
              onClick={() => setIsAddRoleModalOpen(true)}
              className="p-3.5 rounded-[22px] border-2 border-dashed border-sky-300 hover:border-[#0284C7] bg-[#F0F9FF]/60 hover:bg-[#E0F2FE]/60 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group min-h-[110px]"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-1.5">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-[#0284C7]">Tambah Role Baru</span>
              <span className="text-[10px] text-[#334155]/70 mt-0.5">Kustom wewenang sistem</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Mode Toggle & Search & Filter */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] border border-white/60 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'role_focus'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#334155] hover:text-[#0F172A]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fokus Edit Per-Role</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#334155] hover:text-[#0F172A]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>Pratinjau Hak Akses</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl justify-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari izin menu atau tindakan operasional..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]/20 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]/20 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="nav_menu">Khusus Menu Navigasi</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
                      <th className="py-3.5 px-4 w-12 text-center sticky left-0 bg-[#F8FAFC] z-10 shadow-xs">No</th>
                      <th className="py-3.5 px-4 min-w-[220px] sticky left-12 bg-[#F8FAFC] z-10 shadow-xs">Menu &amp; Modul Halaman</th>
                      <th className="py-3.5 px-4 min-w-[240px]">Keterangan Fungsi</th>
                      {rolesList.map((r, idx) => {
                        const meta = roleMetaInfo(r);
                        return (
                          <th
                            key={r}
                            className={`py-3.5 px-3 text-center min-w-[110px] ${meta.textClass} ${meta.bgHeader}`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] text-slate-400 font-mono font-normal">#{idx + 1}</span>
                              <span className="truncate max-w-[120px]">{meta.label}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNavTabs.map((tab, idx) => {
                      return (
                        <tr key={tab.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-[#334155]/60 font-bold sticky left-0 bg-white/95">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 sticky left-12 bg-white/95">
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

                          {/* Dynamic column for each role */}
                          {rolesList.map((r) => {
                            const meta = roleMetaInfo(r);
                            const isAllowed = localMatrix[r]?.allowedTabs?.includes(tab.id) || false;
                            const isAdminRole = r === 'Admin';

                            return (
                              <td key={r} className={`py-3.5 px-3 text-center ${meta.bgHeader}`}>
                                {isAdminRole ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold shadow-xs">
                                    <Check className="w-4 h-4" />
                                  </span>
                                ) : (
                                  <label className="inline-flex items-center justify-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isAllowed}
                                      onChange={() => handleToggleTab(r, tab.id)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0284C7] relative"></div>
                                  </label>
                                )}
                              </td>
                            );
                          })}
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
                      <th className="py-3.5 px-4 w-12 text-center sticky left-0 bg-[#F8FAFC] z-10 shadow-xs">No</th>
                      <th className="py-3.5 px-4 min-w-[240px] sticky left-12 bg-[#F8FAFC] z-10 shadow-xs">Tindakan Operasional</th>
                      <th className="py-3.5 px-4 min-w-[240px]">Keterangan Wewenang</th>
                      {rolesList.map((r, idx) => {
                        const meta = roleMetaInfo(r);
                        return (
                          <th
                            key={r}
                            className={`py-3.5 px-3 text-center min-w-[110px] ${meta.textClass} ${meta.bgHeader}`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] text-slate-400 font-mono font-normal">#{idx + 1}</span>
                              <span className="truncate max-w-[120px]">{meta.label}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActionPermissions.map((act, idx) => {
                      return (
                        <tr key={act.key} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-[#334155]/60 font-bold sticky left-0 bg-white/95">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 sticky left-12 bg-white/95">
                            <div className="font-extrabold text-[#0F172A]">{act.label}</div>
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                              {act.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#334155] text-[11px] leading-relaxed">
                            {act.description}
                          </td>

                          {/* Dynamic column for each role */}
                          {rolesList.map((r) => {
                            const meta = roleMetaInfo(r);
                            const isAllowed = !!localMatrix[r]?.actionPermissions?.[act.key];
                            const isAdminRole = r === 'Admin';

                            return (
                              <td key={r} className={`py-3.5 px-3 text-center ${meta.bgHeader}`}>
                                {isAdminRole ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold shadow-xs">
                                    <Check className="w-4 h-4" />
                                  </span>
                                ) : (
                                  <label className="inline-flex items-center justify-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isAllowed}
                                      onChange={() => handleToggleAction(r, act.key)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                                  </label>
                                )}
                              </td>
                            );
                          })}
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
          <div className="flex items-center gap-2 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            {rolesList.map((r) => {
              const meta = roleMetaInfo(r);
              const Icon = meta.icon;
              const isSelected = selectedRoleFocus === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRoleFocus(r)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
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
                {selectedRoleFocus === 'Admin' ? (
                  <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                    Super Admin • Wewenang Penuh Mutlak
                  </span>
                ) : (
                  <span className="text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-bold">
                    {localMatrix[selectedRoleFocus]?.allowedTabs?.length || 0} Menu Aktif •{' '}
                    {Object.values(localMatrix[selectedRoleFocus]?.actionPermissions || {}).filter(Boolean).length} Tindakan Diizinkan
                  </span>
                )}
              </div>
              <p className="text-xs text-[#334155] mt-1.5 leading-relaxed max-w-2xl">
                {roleMetaInfo(selectedRoleFocus).desc}
              </p>
            </div>

            {selectedRoleFocus !== 'Admin' && (
              <div className="flex flex-wrap items-center gap-2">
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
                {initialRoleMatrix[selectedRoleFocus] && (
                  <button
                    type="button"
                    onClick={() => handleResetSingleRole(selectedRoleFocus)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#334155] text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer active:scale-95"
                  >
                    Reset Standar
                  </button>
                )}
                {!localMatrix[selectedRoleFocus]?.isSystemRole && (
                  <button
                    type="button"
                    onClick={() => setRoleToDelete(selectedRoleFocus)}
                    className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl border border-rose-300 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Role</span>
                  </button>
                )}
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

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {NAV_TAB_DEFINITIONS.map((tab) => {
                  const isChecked = selectedRoleFocus === 'Admin' || (localMatrix[selectedRoleFocus]?.allowedTabs?.includes(tab.id) ?? false);
                  const isAdminRole = selectedRoleFocus === 'Admin';

                  return (
                    <label
                      key={tab.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                        isChecked
                          ? 'bg-sky-50/70 border-sky-200 text-[#0F172A]'
                          : 'bg-slate-50/50 border-slate-200/60 text-[#334155] opacity-70 hover:opacity-100'
                      } ${isAdminRole ? 'cursor-not-allowed' : 'cursor-pointer hover:border-[#0284C7]/50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isAdminRole}
                        onChange={() => handleToggleTab(selectedRoleFocus, tab.id)}
                        className="mt-0.5 w-4 h-4 rounded-md text-[#0284C7] focus:ring-[#0284C7]/30 border-slate-300"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{tab.label}</span>
                          <span className="text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md font-bold">
                            {tab.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#334155] mt-0.5 leading-relaxed">
                          {tab.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Action Permissions */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <h3 className="font-black text-sm text-[#0F172A] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>
                    Hak Akses Tindakan Operasional (
                    {Object.values(localMatrix[selectedRoleFocus]?.actionPermissions || {}).filter(Boolean).length}
                    )
                  </span>
                </h3>
                <span className="text-[11px] text-[#334155]">Wewenang fungsi khusus</span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {ACTION_PERMISSION_DEFINITIONS.map((act) => {
                  const isChecked = selectedRoleFocus === 'Admin' || (localMatrix[selectedRoleFocus]?.actionPermissions?.[act.key] ?? false);
                  const isAdminRole = selectedRoleFocus === 'Admin';

                  return (
                    <label
                      key={act.key}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-200 text-[#0F172A]'
                          : 'bg-slate-50/50 border-slate-200/60 text-[#334155] opacity-70 hover:opacity-100'
                      } ${isAdminRole ? 'cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isAdminRole}
                        onChange={() => handleToggleAction(selectedRoleFocus, act.key)}
                        className="mt-0.5 w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500/30 border-slate-300"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{act.label}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                            {act.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#334155] mt-0.5 leading-relaxed">
                          {act.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: PRATINJAU HAK AKSES ROLE (SIMULATED PREVIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sky-100">
              <div>
                <h3 className="font-black text-base text-[#0F172A] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span>Simulasi Tampilan Hak Akses: {selectedRoleFocus}</span>
                </h3>
                <p className="text-xs text-[#334155] mt-1">
                  Pilih peran di bawah ini untuk mensimulasikan menu dan wewenang apa saja yang aktif pada antarmuka aplikasi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {rolesList.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRoleFocus(r)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/90 text-xs font-bold text-[#0F172A] border border-white/60 shadow-xs"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{tab.label}</span>
                    </div>
                  ))}
                  {NAV_TAB_DEFINITIONS.filter((tab) =>
                    selectedRoleFocus === 'Admin' || localMatrix[selectedRoleFocus]?.allowedTabs?.includes(tab.id)
                  ).length === 0 && (
                    <div className="p-4 text-center text-xs text-rose-500 font-bold bg-rose-50 rounded-2xl">
                      Tidak ada menu navigasi yang diaktifkan untuk role ini.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Permissions Summary Widget */}
              <div className="md:col-span-2 p-5 bg-white rounded-[28px] border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="font-black text-xs text-[#0F172A]">
                    Tindakan yang Diizinkan (
                    {
                      ACTION_PERMISSION_DEFINITIONS.filter((act) =>
                        selectedRoleFocus === 'Admin' || localMatrix[selectedRoleFocus]?.actionPermissions?.[act.key]
                      ).length
                    }{' '}
                    Tindakan)
                  </span>
                  <span className="text-[11px] text-[#334155]/60 font-semibold">
                    Role: {selectedRoleFocus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ACTION_PERMISSION_DEFINITIONS.map((act) => {
                    const isAllowed = selectedRoleFocus === 'Admin' || (localMatrix[selectedRoleFocus]?.actionPermissions?.[act.key] ?? false);
                    return (
                      <div
                        key={act.key}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs ${
                          isAllowed
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                        }`}
                      >
                        {isAllowed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
      {/* MODAL TAMBAH ROLE BARU */}
      {/* ========================================================================= */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-xl w-full shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0284C7] via-sky-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Tambah Role Baru ke Matriks</h3>
                  <p className="text-xs text-sky-100">
                    Definisikan peran baru, pilih tema warna, ikon, dan atur wewenang hak akses RBAC.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateNewRole} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Quick Template Presets */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pilihan Cepat Template Sekolah</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Klik untuk isi otomatis</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Kepala Sekolah',
                    'Guru BK',
                    'Guru Piket',
                    'Koordinator Kesiswaan',
                    'Pembina OSIS',
                    'Pustakawan'
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => handleApplyQuickPreset(tpl)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E0F2FE] hover:text-[#0284C7] text-slate-700 font-bold text-[11px] border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {addRoleError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{addRoleError}</span>
                </div>
              )}

              {/* Input Nama Role & Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-black text-[#0F172A] block mb-1">
                    Nama / ID Role (Unik) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Guru BK / Pembina OSIS"
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nama pengenal unik dalam sistem data.</p>
                </div>

                <div>
                  <label className="font-black text-[#0F172A] block mb-1">
                    Label Tampilan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Guru Bimbingan Konseling"
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Label nama yang tampil pada menu &amp; badge.</p>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="font-black text-[#0F172A] block mb-1">
                  Deskripsi Tanggung Jawab Peran
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan ruang lingkup wewenang dan tugas operasional peran ini..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0284C7]/20 leading-relaxed"
                />
              </div>

              {/* Salin Hak Akses dari Role Lain */}
              <div>
                <label className="font-black text-[#0F172A] block mb-1">
                  Salin Hak Akses Awal Dari
                </label>
                <select
                  value={cloneFromRole}
                  onChange={(e) => setCloneFromRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0284C7]/20 cursor-pointer"
                >
                  <option value="">Kosong (Mulai dari 0 menu &amp; wewenang)</option>
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      Duplikasi hak akses dari {roleMetaInfo(r).label} ({r})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Menu dan izin tindakan akan langsung disalin dari role yang dipilih agar lebih cepat dikonfigurasi.
                </p>
              </div>

              {/* Pilihan Warna / Tema Badge */}
              <div>
                <label className="font-black text-[#0F172A] block mb-1.5">
                  Pilih Tema Warna Badge &amp; Kartu
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = newRoleTheme === theme.key;
                    return (
                      <button
                        key={theme.key}
                        type="button"
                        onClick={() => setNewRoleTheme(theme.key)}
                        title={theme.name}
                        className={`h-8 rounded-xl bg-gradient-to-tr ${theme.gradient} flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-3 ring-sky-500 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100 hover:scale-105'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Ikon */}
              <div>
                <label className="font-black text-[#0F172A] block mb-1.5">
                  Pilih Ikon Representasi
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((iconItem) => {
                    const IconComp = iconItem.icon;
                    const isSelected = newRoleIcon === iconItem.id;
                    return (
                      <button
                        key={iconItem.id}
                        type="button"
                        onClick={() => setNewRoleIcon(iconItem.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold truncate max-w-full">{iconItem.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#334155] rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-br from-[#0284C7] to-indigo-600 hover:from-[#0369A1] hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  Simpan &amp; Tambah Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL HAPUS ROLE CONFIRMATION */}
      {/* ========================================================================= */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-md w-full shadow-xl border border-white/80 p-6 sm:p-8 space-y-4 text-xs">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-[#0F172A] text-lg">Hapus Role &ldquo;{roleToDelete}&rdquo;?</h3>
              <p className="text-[#334155] mt-2 leading-relaxed">
                Role ini akan dihapus dari konfigurasi matriks wewenang. Pastikan tidak ada akun aktif yang masih bergantung pada role ini sebelum menghapus.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#334155] rounded-2xl font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRole}
                className="px-6 py-2.5 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-2xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all"
              >
                Ya, Hapus Role Ini
              </button>
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
                Tindakan ini akan mengembalikan seluruh pengaturan wewenang hak akses ke konfigurasi standar awal sekolah SMAN 1 Batu.
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
