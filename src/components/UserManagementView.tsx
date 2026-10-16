import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Briefcase, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Download, 
  FileSpreadsheet, 
  Camera, 
  Upload, 
  Layers, 
  Info, 
  Check, 
  HelpCircle, 
  ArrowRightLeft, 
  UserPlus,
  RefreshCw,
  Sparkles,
  Lock,
  Building,
  User,
  AlertTriangle,
  Award,
  Crown,
  HeartHandshake,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { AdminUser, UserRole, RoleMatrixMap } from '../types';
import { RombelClass } from '../data/initialData';
import { sortClasses } from '../utils/sortUtils';
import { formatNameTitleCase } from '../utils/formatUtils';
import { RoleMatrixSettingsView } from './RoleMatrixSettingsView';
import { checkActionPermission, initialRoleMatrix, normalizeRole } from '../data/roleMatrixData';

interface UserManagementViewProps {
  users: AdminUser[];
  onAddUser: (newUser: AdminUser) => void;
  onUpdateUser: (updatedUser: AdminUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser?: (user: AdminUser) => void;
  currentUser: AdminUser | null;
  classes: RombelClass[];
  roleMatrix?: RoleMatrixMap;
  onUpdateRoleMatrix?: (matrix: RoleMatrixMap) => void;
  onResetRoleMatrix?: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  currentUser,
  classes,
  roleMatrix = initialRoleMatrix,
}) => {
  const canManageUsers = checkActionPermission(currentUser?.role, 'users_manage', roleMatrix);
  const canResetPassword = checkActionPermission(currentUser?.role, 'users_reset_password', roleMatrix);
  const canManageMatrix = checkActionPermission(currentUser?.role, 'matrix_manage', roleMatrix);
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Administrator' || canManageUsers;

  // Filters & Search
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'Aktif' | 'Nonaktif'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state (10, 25, 50, or -1 for All)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

  // Add user form state
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Guru');
  const [newNip, setNewNip] = useState('');
  const [newAssignedClass, setNewAssignedClass] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newStatus, setNewStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoMode, setNewPhotoMode] = useState<'upload' | 'url'>('upload');
  const addFileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit user form state
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Guru');
  const [editNip, setEditNip] = useState('');
  const [editAssignedClass, setEditAssignedClass] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoMode, setEditPhotoMode] = useState<'upload' | 'url'>('upload');
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset password state
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Success toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Role metadata helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Administrator':
        return {
          label: 'Admin',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: ShieldCheck,
          desc: 'Akses penuh seluruh sistem & konfigurasi',
        };
      case 'Wali Kelas':
        return {
          label: 'Wali Kelas',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: UserCheck,
          desc: 'Pengampu rombel, absensi & panggilan ortu',
        };
      case 'Guru':
        return {
          label: 'Guru',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          icon: GraduationCap,
          desc: 'Piket harian, KBM & input pelanggaran',
        };
      case 'Wakasek':
      case 'Wakil Kepala Sekolah':
        return {
          label: 'Wakasek',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: Award,
          desc: 'Wakil Kepala Sekolah (Kesiswaan, Kurikulum, Humas, Sarpras)',
        };
      case 'Tendik':
        return {
          label: 'Tendik',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Briefcase,
          desc: 'Tata Usaha, administrasi & persuratan',
        };
      case 'Satpam':
      case 'Security':
        return {
          label: 'Satpam',
          badgeClass: 'bg-slate-900 text-white border-slate-700',
          icon: ShieldCheck,
          desc: 'Petugas satpam pos gerbang & verifikasi izin keluar',
        };
      case 'Kepala Sekolah':
        return {
          label: 'Kepala Sekolah',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: Crown,
          desc: 'Pengawasan eksekutif, rekapitulasi data & laporan',
        };
      case 'Guru BK':
        return {
          label: 'Guru BK',
          badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
          icon: HeartHandshake,
          desc: 'Layanan konseling, disiplin & pemanggilan ortu',
        };
      case 'Guru Piket':
        return {
          label: 'Guru Piket',
          badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          icon: Clock,
          desc: 'Piket gerbang harian, verifikasi izin keluar/masuk',
        };
      default: {
        const cfg = roleMatrix?.[role];
        return {
          label: cfg?.label || role,
          badgeClass: cfg?.badgeClass || 'bg-slate-100 text-slate-800 border-slate-200',
          icon: cfg?.iconName === 'Crown'
            ? Crown
            : cfg?.iconName === 'HeartHandshake'
            ? HeartHandshake
            : cfg?.iconName === 'Clock'
            ? Clock
            : cfg?.iconName === 'UserCheck'
            ? UserCheck
            : cfg?.iconName === 'Award'
            ? Award
            : cfg?.iconName === 'Briefcase'
            ? Briefcase
            : User,
          desc: cfg?.description || 'Pengguna sistem',
        };
      }
    }
  };

  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Administrator':
        return {
          gradient: 'from-[#7C3AED] to-[#A855F7]',
          cardBg: 'from-[#FAF5FF] via-[#F3E8FF]/70 to-[#DDD6FE]/40',
          cardBorder: 'border-[#DDD6FE]/70 hover:border-[#A855F7]',
          activeBorder: 'border-[#7C3AED] bg-gradient-to-br from-[#FAF5FF] via-[#F3E8FF] to-[#DDD6FE]',
          textCount: 'text-[#6D28D9]',
        };
      case 'Wali Kelas':
        return {
          gradient: 'from-[#059669] to-[#10B981]',
          cardBg: 'from-[#ECFDF5] via-[#D1FAE5]/70 to-[#A7F3D0]/40',
          cardBorder: 'border-[#6EE7B7]/70 hover:border-[#10B981]',
          activeBorder: 'border-[#059669] bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]',
          textCount: 'text-[#047857]',
        };
      case 'Guru':
        return {
          gradient: 'from-[#0284C7] to-[#38BDF8]',
          cardBg: 'from-[#F0F9FF] via-[#E0F2FE]/70 to-[#BAE6FD]/40',
          cardBorder: 'border-[#7DD3FC]/70 hover:border-[#38BDF8]',
          activeBorder: 'border-[#0284C7] bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]',
          textCount: 'text-[#0369A1]',
        };
      case 'Wakasek':
      case 'Wakil Kepala Sekolah':
        return {
          gradient: 'from-indigo-600 to-violet-600',
          cardBg: 'from-indigo-50/70 via-indigo-100/50 to-indigo-200/40',
          cardBorder: 'border-indigo-200/80 hover:border-indigo-400',
          activeBorder: 'border-indigo-600 bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200',
          textCount: 'text-indigo-700',
        };
      case 'Tendik':
        return {
          gradient: 'from-[#D97706] to-[#F59E0B]',
          cardBg: 'from-[#FFFBEB] via-[#FEF3C7]/70 to-[#FDE68A]/40',
          cardBorder: 'border-[#FCD34D]/70 hover:border-[#F59E0B]',
          activeBorder: 'border-[#D97706] bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]',
          textCount: 'text-[#B45309]',
        };
      case 'Satpam':
      case 'Security':
        return {
          gradient: 'from-slate-800 to-slate-900',
          cardBg: 'from-slate-50 via-slate-100 to-slate-200/60',
          cardBorder: 'border-slate-300 hover:border-slate-500',
          activeBorder: 'border-slate-800 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300',
          textCount: 'text-slate-900',
        };
      case 'Kepala Sekolah':
        return {
          gradient: 'from-rose-600 to-pink-600',
          cardBg: 'from-rose-50/70 via-rose-100/50 to-pink-100/40',
          cardBorder: 'border-rose-200/80 hover:border-rose-400',
          activeBorder: 'border-rose-600 bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200',
          textCount: 'text-rose-700',
        };
      case 'Guru BK':
        return {
          gradient: 'from-violet-600 to-purple-600',
          cardBg: 'from-purple-50/70 via-violet-100/50 to-purple-100/40',
          cardBorder: 'border-violet-200/80 hover:border-violet-400',
          activeBorder: 'border-violet-600 bg-gradient-to-br from-violet-50 via-violet-100 to-violet-200',
          textCount: 'text-violet-700',
        };
      case 'Guru Piket':
        return {
          gradient: 'from-cyan-600 to-teal-600',
          cardBg: 'from-cyan-50/70 via-cyan-100/50 to-teal-100/40',
          cardBorder: 'border-cyan-200/80 hover:border-cyan-400',
          activeBorder: 'border-cyan-600 bg-gradient-to-br from-cyan-50 via-cyan-100 to-cyan-200',
          textCount: 'text-cyan-700',
        };
      default:
        return {
          gradient: 'from-sky-600 to-indigo-600',
          cardBg: 'from-slate-50 via-sky-50/50 to-indigo-50/40',
          cardBorder: 'border-slate-200 hover:border-sky-400',
          activeBorder: 'border-[#0284C7] bg-gradient-to-br from-white via-sky-50 to-[#E0F2FE]',
          textCount: 'text-sky-800',
        };
    }
  };

  // List of all active roles from roleMatrix
  const availableRolesList = useMemo(() => {
    const keys = Object.keys(roleMatrix);
    const standardOrder = [
      'Admin',
      'Wali Kelas',
      'Guru',
      'Wakasek',
      'Tendik',
      'Satpam',
      'Kepala Sekolah',
      'Guru BK',
      'Guru Piket',
    ];
    const sorted = [...keys].sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sorted.map((r, index) => {
      const meta = getRoleBadge(r);
      const theme = getRoleTheme(r);
      return {
        id: r as UserRole,
        label: meta.label,
        icon: meta.icon,
        desc: meta.desc,
        badgeClass: meta.badgeClass,
        gradient: theme.gradient,
        cardBg: theme.cardBg,
        cardBorder: theme.cardBorder,
        activeBorder: theme.activeBorder,
        textCount: theme.textCount,
        num: index + 1,
      };
    });
  }, [roleMatrix]);

  // Count per role
  const roleCounts = useMemo(() => {
    const counts = {
      all: users.length,
      admin: 0,
      waliKelas: 0,
      guru: 0,
      wakasek: 0,
      tendik: 0,
      satpam: 0,
      aktif: 0,
    };

    users.forEach((u) => {
      const norm = normalizeRole(u.role, roleMatrix);
      if (norm === 'Admin') counts.admin++;
      else if (norm === 'Wali Kelas') counts.waliKelas++;
      else if (norm === 'Wakasek') counts.wakasek++;
      else if (norm === 'Guru') counts.guru++;
      else if (norm === 'Tendik') counts.tendik++;
      else if (norm === 'Satpam') counts.satpam++;

      if (u.status === 'Aktif') counts.aktif++;
    });

    return counts;
  }, [users, roleMatrix]);

  const roleCountsGrouped: Record<string, number> = useMemo(() => {
    const res: Record<string, number> = {};
    Object.keys(roleMatrix).forEach((r) => {
      res[r] = users.filter((u) => normalizeRole(u.role, roleMatrix) === r).length;
    });
    return res;
  }, [users, roleMatrix]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (selectedRoleFilter !== 'ALL') {
        const normUser = normalizeRole(u.role, roleMatrix);
        const normFilter = normalizeRole(selectedRoleFilter, roleMatrix);
        if (normUser !== normFilter) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        if (u.status !== selectedStatusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchUsername = u.username.toLowerCase().includes(q);
        const matchNip = u.nip ? u.nip.toLowerCase().includes(q) : false;
        const matchDept = u.department ? u.department.toLowerCase().includes(q) : false;
        const matchClass = u.assignedClass ? u.assignedClass.toLowerCase().includes(q) : false;
        return matchName || matchUsername || matchNip || matchDept || matchClass;
      }

      return true;
    });
  }, [users, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  // Reset page to 1 when filters or pageSize change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedRoleFilter, selectedStatusFilter, searchQuery, pageSize]);

  // Pagination calculations
  const totalItems = filteredUsers.length;
  const effectivePageSize = pageSize === -1 ? (totalItems || 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === -1 ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedUsers = useMemo(() => {
    if (pageSize === -1) return filteredUsers;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex, pageSize]);

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Handle Photo upload in Add Modal
  const handleAddFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya berkas gambar (JPG, PNG, WEBP) yang diperbolehkan.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Photo upload in Edit Modal
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya berkas gambar (JPG, PNG, WEBP) yang diperbolehkan.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditName(user.name);
    // Normalize role dynamically for all standard and custom roles
    const normalizedRole = (normalizeRole(user.role, roleMatrix) as UserRole) || 'Guru';
    setEditRole(normalizedRole);

    setEditNip(user.nip || '');
    setEditAssignedClass(user.assignedClass || '');
    setEditDepartment(user.department || '');
    setEditPassword('');
    setShowEditPassword(false);
    setEditStatus(user.status || 'Aktif');
    setEditPhotoUrl(user.photoUrl || '');
    setEditPhotoMode(user.photoUrl?.startsWith('data:') ? 'upload' : 'url');
  };

  // Save New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newUsername.trim()) {
      alert('Nama dan Username wajib diisi.');
      return;
    }

    // Check username collision
    if (users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      alert(`Username "${newUsername}" sudah digunakan oleh pengguna lain. Silakan pilih username lain.`);
      return;
    }

    const initials = newName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');

    const newUserObj: AdminUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: newUsername.trim().toLowerCase(),
      name: formatNameTitleCase(newName),
      role: newRole,
      nip: newNip.trim(),
      assignedClass: newRole === 'Wali Kelas' ? newAssignedClass : undefined,
      department: newRole === 'Tendik' 
        ? (newDepartment.trim() || 'Staf Tata Usaha') 
        : newRole === 'Satpam'
          ? (newDepartment.trim() || 'Pos Keamanan Gerbang Utama')
          : newRole === 'Wakasek'
            ? (newDepartment.trim() || 'Wakil Kepala Sekolah')
            : newRole === 'Guru' 
              ? (newDepartment.trim() || 'Guru Mata Pelajaran') 
              : newRole === 'Kepala Sekolah'
                ? (newDepartment.trim() || 'Kepala Sekolah SMAN 1 Batu')
                : newRole === 'Guru BK'
                  ? (newDepartment.trim() || 'Bimbingan Konseling')
                  : newRole === 'Guru Piket'
                    ? (newDepartment.trim() || 'Piket & Ketertiban Gerbang')
                    : newDepartment.trim(),
      avatar: initials || 'US',
      photoUrl: newPhotoUrl.trim() || undefined,
      status: newStatus,
      password: newPassword.trim() || `${newRole.toLowerCase()}123`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddUser(newUserObj);
    setIsAddModalOpen(false);
    resetAddForm();
    showToast(`Pengguna "${newUserObj.name}" dengan role ${newUserObj.role} berhasil ditambahkan!`);
  };

  const resetAddForm = () => {
    setNewUsername('');
    setNewName('');
    setNewRole('Guru');
    setNewNip('');
    setNewAssignedClass('');
    setNewDepartment('');
    setNewPassword('');
    setNewStatus('Aktif');
    setNewPhotoUrl('');
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  // Save Edit User
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editUsername.trim()) {
      alert('Nama dan Username wajib diisi.');
      return;
    }

    // Check username collision with others
    const collision = users.some(
      (u) => u.id !== editingUser.id && u.username.toLowerCase() === editUsername.trim().toLowerCase()
    );
    if (collision) {
      alert(`Username "${editUsername}" sudah dipakai akun lain.`);
      return;
    }

    const initials = editName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');

    const updated: AdminUser = {
      ...editingUser,
      username: editUsername.trim().toLowerCase(),
      name: formatNameTitleCase(editName),
      role: editRole,
      nip: editNip.trim(),
      assignedClass: editRole === 'Wali Kelas' ? editAssignedClass : undefined,
      department: editDepartment.trim(),
      avatar: initials || editingUser.avatar || 'US',
      photoUrl: editPhotoUrl.trim() || undefined,
      status: editStatus,
      ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
    };

    onUpdateUser(updated);
    setEditingUser(null);
    showToast(`Data pengguna "${updated.name}" berhasil diperbarui.`);
  };

  // Quick toggle status (Aktif <-> Nonaktif)
  const handleToggleStatus = (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.');
      return;
    }
    const nextStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated: AdminUser = {
      ...user,
      status: nextStatus,
    };
    onUpdateUser(updated);
    showToast(`Status akun "${user.name}" diubah menjadi ${nextStatus}.`);
  };

  // Handle Reset Password Submit
  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPasswordVal.trim()) {
      alert('Password baru tidak boleh kosong.');
      return;
    }

    const updated: AdminUser = {
      ...resettingUser,
      password: newPasswordVal.trim(),
    };

    onUpdateUser(updated);
    setResettingUser(null);
    setNewPasswordVal('');
    showToast(`Password untuk akun "${resettingUser.name}" berhasil direset.`);
  };

  // Handle Delete User
  const handleConfirmDelete = () => {
    if (!deleteConfirmUser) return;

    if (deleteConfirmUser.id === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    if (deleteConfirmUser.username === 'admin') {
      alert('Akun admin utama sistem tidak boleh dihapus demi keamanan aplikasi.');
      return;
    }

    onDeleteUser(deleteConfirmUser.id);
    showToast(`Pengguna "${deleteConfirmUser.name}" berhasil dihapus.`);
    setDeleteConfirmUser(null);
  };

  // Export CSV / Report
  const handleExportCSV = () => {
    const headers = ['No', 'Nama Lengkap', 'Username', 'Role', 'NIP', 'Penugasan/Rombel', 'Status'];
    const rows = filteredUsers.map((u, i) => [
      i + 1,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.username}"`,
      `"${u.role}"`,
      `"${u.nip || '-'}"`,
      `"${u.assignedClass ? `Wali Kelas ${u.assignedClass}` : u.department || '-'}"`,
      `"${u.status || 'Aktif'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daftar_Pengguna_SMAN1Batu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Daftar pengguna berhasil diekspor ke format CSV.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[32px] sm:rounded-[32px] border border-white/60 p-6 sm:p-8 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="px-3 py-1 rounded-full text-[11px] font-black bg-[#0284C7]/15 text-[#0284C7] border border-[#0284C7]/20 shadow-xs"
                
              >
                Sistem Pengendalian Akses
              </span>
              <span className="text-[#334155]/40 text-xs">•</span>
              <span className="text-[#334155] text-xs font-bold" >SMAN 1 Batu</span>
            </div>
            <h1 
              className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-3"
              
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] text-white flex items-center justify-center shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <span>Manajemen Pengguna &amp; Multi-Role</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#334155] mt-2 max-w-2xl leading-relaxed">
              Kelola akun seluruh sivitas sekolah berdasarkan multi-role: 
              <strong className="text-[#0F172A] font-bold"> Admin</strong>, 
              <strong className="text-[#0F172A] font-bold"> Wali Kelas</strong>, 
              <strong className="text-[#0F172A] font-bold"> Guru</strong>, 
              <strong className="text-[#0F172A] font-bold"> Wakasek</strong>, 
              <strong className="text-[#0F172A] font-bold"> Tendik</strong>, 
              <strong className="text-[#0F172A] font-bold"> Satpam</strong>, 
              <strong className="text-[#0F172A] font-bold"> Kepala Sekolah</strong>, 
              <strong className="text-[#0F172A] font-bold"> Guru BK</strong>, dan 
              <strong className="text-[#0F172A] font-bold"> Guru Piket</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-white text-[#0F172A] font-extrabold text-xs rounded-2xl transition-all duration-200 cursor-pointer border border-white/60 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none"
            >
              <Download className="w-4 h-4 text-[#0EA5E9]" />
              <span>Ekspor Data</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetAddForm();
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#0369A1] hover:to-[#0284C7] text-white font-black text-xs rounded-2xl transition-all duration-200 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </div>

        {/* Dynamic Role Summary Cards */}
        <div className="mt-6 pt-6 border-t border-sky-100/50">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs text-[#0F172A] uppercase tracking-wider">
                Filter Pengguna Berdasarkan Peran ({availableRolesList.length} Role)
              </span>
              <span className="text-[11px] text-[#334155]/60 font-semibold">• Klik kartu peran untuk menyaring daftar</span>
            </div>
            {selectedRoleFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedRoleFilter('ALL')}
                className="text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
              >
                Tampilkan Semua ({users.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {availableRolesList.map((rItem) => {
              const RoleIcon = rItem.icon;
              const isSelected = selectedRoleFilter === rItem.id;
              const count = roleCountsGrouped[rItem.id] || 0;

              return (
                <div
                  key={rItem.id}
                  onClick={() => setSelectedRoleFilter(isSelected ? 'ALL' : rItem.id)}
                  className={`p-4 rounded-[24px] transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                    isSelected
                      ? `${rItem.activeBorder} 2 border shadow-sm -translate-y-1`
                      : `bg-gradient-to-br ${rItem.cardBg} border ${rItem.cardBorder} shadow-xs hover:-translate-y-1`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${rItem.gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <span className={`text-2xl font-black ${rItem.textCount}`}>{count}</span>
                  </div>
                  <div className="mt-3">
                    <div className={`text-xs font-black ${rItem.textCount} flex items-center gap-1.5`}>
                      <span>{rItem.num}. {rItem.label}</span>
                      {isSelected && <span className="text-[10px] font-bold">(Aktif)</span>}
                    </div>
                    <p className={`text-[11px] ${rItem.textCount}/80 mt-1 leading-relaxed line-clamp-2`}>
                      {rItem.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] border border-white/60 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#334155]/60 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pengguna, username, NIP, rombel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#334155]/60 hover:text-[#0F172A] text-xs font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role and Status filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#334155] font-bold" >Role:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-[#E2F1FD] rounded-xl text-[#0F172A] font-extrabold shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 cursor-pointer transition-all"
                
              >
                <option value="ALL">Semua Role ({users.length})</option>
                {availableRolesList.map((r) => {
                  const count = users.filter((u) => normalizeRole(u.role, roleMatrix) === r.id).length;
                  return (
                    <option key={r.id} value={r.id}>
                      {r.label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#334155] font-bold" >Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-3.5 py-2.5 bg-[#E2F1FD] rounded-xl text-[#0F172A] font-extrabold shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 cursor-pointer transition-all"
                
              >
                <option value="ALL">Semua Status</option>
                <option value="Aktif">Aktif ({roleCounts.aktif})</option>
                <option value="Nonaktif">Nonaktif ({users.length - roleCounts.aktif})</option>
              </select>
            </div>

            {(selectedRoleFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-[#0284C7] rounded-xl font-black transition-all shadow-xs cursor-pointer hover:-translate-y-0.5 active:scale-95"
                
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#334155] pt-3 border-t border-sky-100/50">
          <div>
            Menampilkan <strong className="text-[#0F172A] font-extrabold">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> dari{' '}
            <strong className="text-[#0F172A] font-extrabold">{filteredUsers.length}</strong> pengguna
            {filteredUsers.length !== users.length && (
              <span className="text-[#0284C7] font-semibold ml-1">(difilter dari {users.length} total akun)</span>
            )}
          </div>
          <div className="flex items-center gap-3 font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" /> Aktif: {roleCounts.aktif}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E2F1FD] text-[#334155]">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Nonaktif: {users.length - roleCounts.aktif}
            </span>
          </div>
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[32px] sm:rounded-[32px] border border-white/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC]/80 border-b border-sky-100/60 text-[#334155] font-black uppercase tracking-wider text-[11px]" >
              <tr>
                <th className="py-4 px-4 w-12 text-center">No</th>
                <th className="py-4 px-4">Pengguna / Nama</th>
                <th className="py-4 px-4">Role &amp; Akses</th>
                <th className="py-4 px-4">Penugasan / Bidang</th>
                <th className="py-4 px-4">NIP / Identitas</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#334155]">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-sky-50 text-[#0284C7] flex items-center justify-center shadow-xs mb-3">
                      <Users className="w-8 h-8" />
                    </div>
                    <p className="font-extrabold text-[#0F172A] text-sm" >Tidak ada data pengguna yang cocok</p>
                    <p className="text-xs text-[#334155] mt-1">Coba sesuaikan kata kunci pencarian atau filter role.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const roleMeta = getRoleBadge(user.role);
                  const RoleIcon = roleMeta.icon;
                  const isCurrent = user.id === currentUser?.id;
                  const rowNumber = startIndex + idx + 1;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-white/60 transition-all duration-200 ${
                        isCurrent ? 'bg-[#0284C7]/5' : ''
                      }`}
                    >
                      {/* 1. No */}
                      <td className="py-4 px-4 text-center font-mono text-[#334155]/60 font-bold text-[11px]">
                        {rowNumber}
                      </td>

                      {/* 2. Avatar & Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {user.photoUrl ? (
                            <img
                              src={user.photoUrl}
                              alt={user.name}
                              className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0" >
                              {user.avatar || user.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#0F172A] truncate text-sm" >
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-[#0284C7] text-white shadow-xs" >
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#334155] font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-[#0284C7]">@{user.username}</span>
                              {user.password && (
                                <span className="text-[10px] text-[#334155]/70">• pass: {user.password}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Role */}
                      <td className="py-4 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border shadow-xs ${roleMeta.badgeClass}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span className="font-black text-[11px]">
                            {roleMeta.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#334155] mt-1 max-w-[160px] truncate">
                          {roleMeta.desc}
                        </div>
                      </td>

                      {/* 4. Assignment / Department */}
                      <td className="py-4 px-4">
                        {user.role === 'Wali Kelas' && user.assignedClass ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-black text-[11px] border border-emerald-200 shadow-xs">
                              Kelas {user.assignedClass}
                            </span>
                            <span className="text-[11px] text-[#334155]">
                              ({user.department || 'Wali Kelas'})
                            </span>
                          </div>
                        ) : user.role === 'Admin' || user.role === 'Administrator' ? (
                          <span className="text-purple-900 font-bold text-[11px] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            {user.department || 'Manajemen Penuh Sistem'}
                          </span>
                        ) : user.role === 'Kepala Sekolah' ? (
                          <span className="text-rose-900 font-bold text-[11px] flex items-center gap-1.5">
                            <Crown className="w-4 h-4 text-rose-600" />
                            {user.department || 'Pimpinan & Kebijakan Sekolah'}
                          </span>
                        ) : user.role === 'Guru BK' ? (
                          <span className="text-violet-900 font-bold text-[11px] flex items-center gap-1.5">
                            <HeartHandshake className="w-4 h-4 text-violet-600" />
                            {user.department || 'Bimbingan & Konseling Siswa'}
                          </span>
                        ) : user.role === 'Guru Piket' ? (
                          <span className="text-cyan-900 font-bold text-[11px] flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-cyan-600" />
                            {user.department || 'Piket Gerbang & Ketertiban'}
                          </span>
                        ) : user.role === 'Satpam' || user.role === 'Security' ? (
                          <span className="text-slate-900 font-bold text-[11px] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-slate-700" />
                            {user.department || 'Pos Keamanan & Gerbang'}
                          </span>
                        ) : user.role === 'Wakasek' ? (
                          <span className="text-indigo-900 font-bold text-[11px] flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-indigo-600" />
                            {user.department || 'Wakil Kepala Sekolah'}
                          </span>
                        ) : user.department ? (
                          <span className="text-[#0F172A] font-semibold text-[11px]">
                            {user.department}
                          </span>
                        ) : (
                          <span className="text-[#334155]/60 italic text-[11px]">- Belum ada penugasan -</span>
                        )}
                      </td>

                      {/* 5. NIP / Identitas */}
                      <td className="py-4 px-4">
                        {user.nip ? (
                          <div className="font-mono text-[#0F172A] text-[11px]">
                            <span className="font-bold text-[#0F172A] bg-[#E2F1FD] px-2 py-0.5 rounded-lg shadow-none">{user.nip}</span>
                          </div>
                        ) : (
                          <span className="text-[#334155]/60 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          title="Klik untuk ubah status akun"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all duration-200 border shadow-xs hover:-translate-y-0.5 active:scale-95 ${
                            user.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-[#E2F1FD] text-[#334155] border-white/60'
                          }`}
                          
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              user.status === 'Aktif' ? 'bg-emerald-500 shadow-xs' : 'bg-slate-400'
                            }`}
                          />
                          <span>{user.status || 'Aktif'}</span>
                        </button>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Impersonate / Switch User */}
                          {onSwitchUser && !isCurrent && (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchUser(user);
                                showToast(`Berhasil beralih sesi login sebagai ${user.name} (${user.role}).`);
                              }}
                              title={`Uji coba login sebagai ${user.name} (${user.role})`}
                              className="p-2 text-[#334155] hover:text-[#0284C7] bg-white/80 hover:bg-white rounded-xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}

                          {/* Detail View */}
                          <button
                            type="button"
                            onClick={() => setDetailUser(user)}
                            title="Lihat Detail Profil Pengguna"
                            className="p-2 text-[#334155] hover:text-teal-600 bg-white/80 hover:bg-white rounded-xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setResettingUser(user);
                              setNewPasswordVal(user.password || 'sman1batu2026');
                            }}
                            title="Reset Password Pengguna"
                            className="p-2 text-[#334155] hover:text-amber-600 bg-white/80 hover:bg-white rounded-xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Data Pengguna"
                            className="p-2 text-[#334155] hover:text-blue-600 bg-white/80 hover:bg-white rounded-xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(user)}
                            disabled={isCurrent || user.username === 'admin'}
                            title={
                              isCurrent
                                ? 'Tidak bisa menghapus akun Anda sendiri'
                                : user.username === 'admin'
                                ? 'Admin utama tidak bisa dihapus'
                                : 'Hapus Pengguna'
                            }
                            className={`p-2 rounded-xl transition-all ${
                              isCurrent || user.username === 'admin'
                                ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                : 'text-[#334155] hover:text-rose-600 bg-white/80 hover:bg-white shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
        <div className="p-4 sm:p-5 bg-[#F8FAFC]/90 border-t border-sky-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-[#334155]">
            <span>
              Menampilkan <strong className="text-[#0F172A] font-extrabold">{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-[#0F172A] font-extrabold">{endIndex}</strong> dari <strong className="text-[#0F172A] font-extrabold">{totalItems}</strong> pengguna
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#334155]">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-[#E2F1FD] rounded-xl text-[#0F172A] font-extrabold shadow-none focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]/30 cursor-pointer transition-all text-xs"
              >
                <option value={10}>10 / halaman</option>
                <option value={25}>25 / halaman</option>
                <option value={50}>50 / halaman</option>
                <option value={-1}>Semua ({totalItems})</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-center md:self-auto">
              {/* First Page */}
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="Halaman Pertama"
                className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-sky-50 text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
              >
                <ChevronsLeft className="w-4 h-4 text-[#334155]" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Halaman Sebelumnya"
                className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-sky-50 text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-[#334155]" />
              </button>

              {/* Page Number Buttons with Smart Windowing */}
              <div className="flex items-center gap-1 px-1">
                {getPageNumbers(safeCurrentPage, totalPages).map((p, pIdx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${pIdx}`} className="px-2 py-1 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === safeCurrentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => setCurrentPage(Number(p))}
                      className={`min-w-8 h-8 px-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white shadow-xs scale-105'
                          : 'bg-white border border-slate-200/80 text-[#334155] hover:bg-sky-50 hover:text-[#0284C7]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Halaman Berikutnya"
                className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-sky-50 text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
              >
                <ChevronRight className="w-4 h-4 text-[#334155]" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Halaman Terakhir"
                className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-sky-50 text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
              >
                <ChevronsRight className="w-4 h-4 text-[#334155]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[32px] max-w-xl w-full max-h-[92vh] flex flex-col shadow-sm border border-white/80 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-[#E0F2FE] to-[#0284C7] text-white flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2.5" >
                  <UserPlus className="w-5 h-5 text-purple-200" />
                  <span>Tambah Pengguna Baru</span>
                </h3>
                <p className="text-xs text-purple-100 mt-0.5">
                  Pilih dari {availableRolesList.length} peran pengguna yang tersedia dan atur kredensial akun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 sm:p-8 space-y-4 overflow-y-auto text-xs">
              {/* 1. Pilih Role */}
              <div className="p-4 bg-[#F8FAFC] border border-white/80 rounded-[24px] shadow-none space-y-2.5">
                <label className="font-extrabold text-[#0F172A] block text-xs" >
                  Pilih Peran Akun (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {availableRolesList.map((r) => {
                    const Icon = r.icon;
                    const isSelected = newRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setNewRole(r.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] text-white shadow-xs border-transparent font-black -translate-y-0.5'
                            : 'bg-white/80 border-white/60 text-[#0F172A] hover:bg-white shadow-sm font-bold hover:-translate-y-0.5 active:scale-95'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-[#0284C7]'}`} />
                        <span className="text-[11px] leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-[#0F172A] bg-white/90 p-3 rounded-2xl border border-white/80 shadow-xs leading-relaxed">
                  <strong className="text-[#0284C7]">Hak Akses {getRoleBadge(newRole).label}:</strong>{' '}
                  {roleMatrix[newRole]?.description || getRoleBadge(newRole).desc}
                </div>
              </div>

              {/* 2. Nama & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                    Nama Lengkap (dengan Gelar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                    NIP / NUPTK / NIK
                  </label>
                  <input
                    type="text"
                    placeholder="19750912 200112 1 002"
                    value={newNip}
                    onChange={(e) => setNewNip(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 3. Username & Password Awal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: mulyadi_guru"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                    Password Awal
                  </label>
                  <input
                    type="text"
                    placeholder="Default: admin123 / guru123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 4. Role-Specific Field: Kelas Rombel vs Mapel vs Tendik Unit */}
              {newRole === 'Wali Kelas' && (
                <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-[24px] shadow-none space-y-2">
                  <label className="font-extrabold text-teal-900 block text-xs" >
                    Pilih Rombel Binaan (36 Kelas SMAN 1 Batu) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newAssignedClass}
                    onChange={(e) => setNewAssignedClass(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-teal-200 rounded-2xl text-teal-950 font-black text-xs shadow-xs focus:outline-hidden focus:ring-4 focus:ring-teal-500/20"
                    
                  >
                    <option value="">-- Pilih Rombel Kelas --</option>
                    {sortClasses(classes).map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Kelas {cls.name} ({cls.grade}) - Wali: {cls.homeroom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newRole !== 'Wali Kelas' && (
                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5">
                    {newRole === 'Guru'
                      ? 'Mata Pelajaran / Tugas Mengajar'
                      : newRole === 'Wakasek'
                      ? 'Bidang Wakasek (Kesiswaan, Kurikulum, Humas, Sarpras)'
                      : newRole === 'Kepala Sekolah'
                      ? 'Jabatan Pimpinan / Lembaga'
                      : newRole === 'Guru BK'
                      ? 'Bidang Konseling / Penanganan Siswa'
                      : newRole === 'Guru Piket'
                      ? 'Jadwal & Pos Piket Gerbang'
                      : newRole === 'Tendik'
                      ? 'Unit / Sub-bagian Tenaga Kependidikan'
                      : newRole === 'Satpam'
                      ? 'Penugasan / Pos Keamanan Gerbang'
                      : newRole === 'Admin' || newRole === 'Administrator'
                      ? 'Jabatan / Deskripsi Penugasan Admin'
                      : `Bidang / Deskripsi Penugasan (${newRole})`}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      newRole === 'Guru'
                        ? 'Contoh: Guru Matematika / Biologi'
                        : newRole === 'Wakasek'
                        ? 'Contoh: Waka Kesiswaan / Waka Kurikulum / Waka Humas / Waka Sarpras'
                        : newRole === 'Kepala Sekolah'
                        ? 'Contoh: Kepala Sekolah SMAN 1 Batu'
                        : newRole === 'Guru BK'
                        ? 'Contoh: Guru BK Kelas X & Konseling Karir'
                        : newRole === 'Guru Piket'
                        ? 'Contoh: Piket Gerbang Hari Senin & Kamis'
                        : newRole === 'Tendik'
                        ? 'Contoh: Tata Usaha / Kepegawaian / Kesiswaan'
                        : newRole === 'Satpam'
                        ? 'Contoh: Pos Gerbang Utama / Satpam Outsourcing'
                        : newRole === 'Admin' || newRole === 'Administrator'
                        ? 'Contoh: Administrator Utama Sistem'
                        : `Contoh: Penugasan untuk role ${newRole}`
                    }
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all duration-200"
                  />
                </div>
              )}

              {/* Status Akun */}
              <div>
                <label className="font-extrabold text-[#0F172A] block mb-2" >
                  Status Akun
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="new_status"
                      checked={newStatus === 'Aktif'}
                      onChange={() => setNewStatus('Aktif')}
                      className="text-[#0284C7] focus:ring-[#0284C7]"
                    />
                    <span className="text-[#0F172A] font-extrabold text-xs" >Aktif (Dapat Login)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="new_status"
                      checked={newStatus === 'Nonaktif'}
                      onChange={() => setNewStatus('Nonaktif')}
                      className="text-[#0284C7] focus:ring-[#0284C7]"
                    />
                    <span className="text-[#334155] font-bold text-xs" >Nonaktif (Diblokir Sementara)</span>
                  </label>
                </div>
              </div>

              {/* 7. Foto Profil Pengguna */}
              <div className="p-4 bg-[#F8FAFC] border border-white/80 rounded-[24px] shadow-none space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#0F172A] flex items-center gap-2 text-xs" >
                    <Camera className="w-4 h-4 text-[#0284C7]" />
                    <span>Foto Profil Pengguna (Opsional)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewPhotoMode('upload')}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        newPhotoMode === 'upload' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#334155]'
                      }`}
                      
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPhotoMode('url')}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        newPhotoMode === 'url' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#334155]'
                      }`}
                      
                    >
                      Tautan URL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {newPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={newPhotoUrl}
                          alt="Pratinjau Foto"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewPhotoUrl('');
                            if (addFileInputRef.current) addFileInputRef.current.value = '';
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1.5 rounded-full shadow-xs hover:bg-rose-700 cursor-pointer"
                          title="Hapus foto"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-sky-200 bg-white/80 flex flex-col items-center justify-center text-[#334155]/60 shadow-xs">
                        <Camera className="w-6 h-6 text-purple-300" />
                        <span className="text-[9px] mt-0.5 font-bold" >Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {newPhotoMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={addFileInputRef}
                          accept="image/*"
                          onChange={handleAddFileUpload}
                          className="hidden"
                          id="add-user-photo-file"
                        />
                        <label
                          htmlFor="add-user-photo-file"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-[#0F172A] border border-white/60 rounded-2xl font-black text-xs cursor-pointer shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all"
                          
                        >
                          <Upload className="w-4 h-4 text-[#0284C7]" />
                          <span>Pilih Foto dari Perangkat</span>
                        </label>
                        <p className="text-[10px] text-[#334155] mt-1.5">
                          Format JPG, PNG, WEBP (maks. 3 MB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/foto-profil.jpg"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                        />
                        <p className="text-[10px] text-[#334155] mt-1">
                          Masukkan URL gambar profil
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-sky-100/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#334155] rounded-2xl font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-white/60"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#9333EA] hover:to-[#6D28D9] text-white rounded-2xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer flex items-center gap-2 transition-all"
                  
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT PENGGUNA */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[32px] max-w-xl w-full max-h-[92vh] flex flex-col shadow-sm border border-white/80 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2.5" >
                  <Edit3 className="w-5 h-5 text-blue-200" />
                  <span>Edit Data Pengguna: {editingUser.name}</span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Perbarui profil, hak akses role, penugasan, dan status akun pengguna.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-6 sm:p-8 space-y-4 overflow-y-auto text-xs">
              {/* Role Selection */}
              <div className="p-4 bg-[#F8FAFC] border border-white/80 rounded-[24px] shadow-none space-y-2.5">
                <label className="font-extrabold text-[#0F172A] block text-xs" >
                  Peran Akun (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {availableRolesList.map((r) => {
                    const Icon = r.icon;
                    const isSelected = editRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setEditRole(r.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs border-transparent font-black -translate-y-0.5'
                            : 'bg-white/80 border-white/60 text-[#0F172A] hover:bg-white shadow-sm font-bold hover:-translate-y-0.5 active:scale-95'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                        <span className="text-[11px] leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-[#0F172A] bg-white/90 p-3 rounded-2xl border border-white/80 shadow-xs leading-relaxed mt-2.5">
                  <strong className="text-blue-600">Hak Akses {getRoleBadge(editRole).label}:</strong>{' '}
                  {roleMatrix[editRole]?.description || getRoleBadge(editRole).desc}
                </div>
              </div>

              {/* Nama & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                    NIP / NUPTK / NIK
                  </label>
                  <input
                    type="text"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-semibold text-[#0F172A] shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-semibold text-[#0F172A] shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              {/* Role specific assignment */}
              {editRole === 'Wali Kelas' && (
                <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-[24px] shadow-none space-y-2">
                  <label className="font-extrabold text-teal-900 block text-xs" >
                    Rombel Binaan (36 Kelas SMAN 1 Batu) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editAssignedClass}
                    onChange={(e) => setEditAssignedClass(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-teal-200 rounded-2xl text-teal-950 font-black text-xs shadow-xs focus:outline-hidden focus:ring-4 focus:ring-teal-500/20"
                    
                  >
                    <option value="">-- Pilih Rombel Kelas --</option>
                    {sortClasses(classes).map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Kelas {cls.name} ({cls.grade}) - Wali: {cls.homeroom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editRole !== 'Wali Kelas' && (
                <div>
                  <label className="font-extrabold text-[#0F172A] block mb-1.5">
                    {editRole === 'Guru'
                      ? 'Mata Pelajaran / Tugas Mengajar'
                      : editRole === 'Wakasek'
                      ? 'Bidang Wakasek (Kesiswaan, Kurikulum, Humas, Sarpras)'
                      : editRole === 'Kepala Sekolah'
                      ? 'Jabatan Pimpinan / Lembaga'
                      : editRole === 'Guru BK'
                      ? 'Bidang Konseling / Penanganan Siswa'
                      : editRole === 'Guru Piket'
                      ? 'Jadwal & Pos Piket Gerbang'
                      : editRole === 'Tendik'
                      ? 'Bidang / Unit Kerja Tendik'
                      : editRole === 'Satpam'
                      ? 'Penugasan / Pos Keamanan Gerbang'
                      : editRole === 'Admin' || editRole === 'Administrator'
                      ? 'Jabatan / Deskripsi Penugasan Admin'
                      : `Bidang / Deskripsi Penugasan (${editRole})`}
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder={
                      editRole === 'Guru'
                        ? 'Contoh: Guru Matematika / Biologi'
                        : editRole === 'Wakasek'
                        ? 'Contoh: Waka Kesiswaan / Waka Kurikulum / Waka Humas / Waka Sarpras'
                        : editRole === 'Kepala Sekolah'
                        ? 'Contoh: Kepala Sekolah SMAN 1 Batu'
                        : editRole === 'Guru BK'
                        ? 'Contoh: Guru BK Kelas X & Konseling Karir'
                        : editRole === 'Guru Piket'
                        ? 'Contoh: Piket Gerbang Hari Senin & Kamis'
                        : editRole === 'Tendik'
                        ? 'Contoh: Tata Usaha / Kepegawaian / Kesiswaan'
                        : editRole === 'Satpam'
                        ? 'Contoh: Pos Gerbang Utama / Satpam Outsourcing'
                        : editRole === 'Admin' || editRole === 'Administrator'
                        ? 'Contoh: Administrator Utama Sistem'
                        : `Contoh: Penugasan untuk role ${editRole}`
                    }
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              )}

              {/* Password Baru (Opsional) */}
              <div className="p-4 bg-sky-50/70 border border-sky-100/80 rounded-[24px] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#0F172A] text-xs flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Ubah Password Akun (Opsional)</span>
                  </label>
                  <span className="text-[10px] text-[#334155]/70 font-medium">Kosongkan jika tidak ingin diubah</span>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Masukkan password baru untuk mengganti..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-sky-200/80 rounded-2xl text-xs font-mono text-[#0F172A] focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#334155]/60 hover:text-[#0F172A] cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="font-extrabold text-[#0F172A] block mb-2" >
                  Status Akun
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_status"
                      checked={editStatus === 'Aktif'}
                      onChange={() => setEditStatus('Aktif')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[#0F172A] font-extrabold text-xs" >Aktif (Dapat Login)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_status"
                      checked={editStatus === 'Nonaktif'}
                      onChange={() => setEditStatus('Nonaktif')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[#334155] font-bold text-xs" >Nonaktif</span>
                  </label>
                </div>
              </div>

              {/* Foto Profil Pengguna */}
              <div className="p-4 bg-[#F8FAFC] border border-white/80 rounded-[24px] shadow-none space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#0F172A] flex items-center gap-2 text-xs" >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Foto Profil Pengguna</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEditPhotoMode('upload')}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        editPhotoMode === 'upload' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#334155]'
                      }`}
                      
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPhotoMode('url')}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        editPhotoMode === 'url' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#334155]'
                      }`}
                      
                    >
                      Tautan URL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {editPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={editPhotoUrl}
                          alt="Pratinjau Foto"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhotoUrl('');
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1.5 rounded-full shadow-xs hover:bg-rose-700 cursor-pointer"
                          title="Hapus foto"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-blue-200 bg-white/80 flex flex-col items-center justify-center text-[#334155]/60 shadow-xs">
                        <Camera className="w-6 h-6 text-blue-300" />
                        <span className="text-[9px] mt-0.5 font-bold" >Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {editPhotoMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={editFileInputRef}
                          accept="image/*"
                          onChange={handleEditFileUpload}
                          className="hidden"
                          id="edit-user-photo-file"
                        />
                        <label
                          htmlFor="edit-user-photo-file"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-[#0F172A] border border-white/60 rounded-2xl font-black text-xs cursor-pointer shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all"
                          
                        >
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>Pilih Foto dari Perangkat</span>
                        </label>
                        <p className="text-[10px] text-[#334155] mt-1.5">
                          Format JPG, PNG, WEBP (maks. 3 MB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/foto-profil.jpg"
                          value={editPhotoUrl}
                          onChange={(e) => setEditPhotoUrl(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#E2F1FD] rounded-2xl text-xs font-semibold text-[#0F172A] shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all"
                        />
                        <p className="text-[10px] text-[#334155] mt-1">
                          Masukkan URL gambar profil
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-sky-100/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#334155] rounded-2xl font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-white/60"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer flex items-center gap-2 transition-all"
                  
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESET PASSWORD */}
      {/* ========================================================================= */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[32px] max-w-md w-full shadow-sm border border-white/80 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2.5" >
                  <KeyRound className="w-5 h-5 text-amber-200" />
                  <span>Reset Password Pengguna</span>
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Atur ulang kata sandi untuk akun @{resettingUser.username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-6 sm:p-8 space-y-4 text-xs">
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-[24px] shadow-xs text-amber-950">
                <div className="font-black text-base" >{resettingUser.name}</div>
                <div className="text-[11px] text-amber-800 mt-1 font-semibold">
                  Role: <strong className="font-black">{resettingUser.role}</strong> • Username: <code className="bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">{resettingUser.username}</code>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-[#0F172A] block mb-1.5" >
                  Password Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-semibold text-[#0F172A] shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-amber-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#0F172A] p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Preset Passwords */}
              <div className="space-y-2">
                <span className="text-[#334155] font-bold text-[11px] block" >Template Cepat:</span>
                <div className="flex flex-wrap gap-2">
                  {['sman1batu2026', 'guru123', 'wali123', 'admin123', 'tendik123'].map((pwd) => (
                    <button
                      key={pwd}
                      type="button"
                      onClick={() => setNewPasswordVal(pwd)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0F172A] rounded-xl font-mono text-[11px] font-bold shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-white/60"
                    >
                      {pwd}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-sky-100/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#334155] rounded-2xl font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-white/60"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer flex items-center gap-2 transition-all"
                  
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: HAPUS USER KONFIRMASI */}
      {/* ========================================================================= */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[32px] max-w-md w-full shadow-sm border border-white/80 p-6 sm:p-8 space-y-4 text-xs">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-[#0F172A] text-lg" >Hapus Akun Pengguna?</h3>
              <p className="text-[#334155] mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong className="text-[#0F172A] font-extrabold">{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username}) dengan role <strong className="text-[#0F172A] font-extrabold">{deleteConfirmUser.role}</strong>?
              </p>
              <p className="text-[11px] text-rose-700 bg-rose-50 p-3 rounded-2xl border border-rose-200 mt-4 font-bold leading-relaxed shadow-xs">
                Tindakan ini permanen dan pengguna ini tidak akan dapat login lagi ke dalam sistem.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#334155] rounded-2xl font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-white/60"
                
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white rounded-2xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer transition-all"
                
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAIL PROFIL USER */}
      {/* ========================================================================= */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[32px] max-w-lg w-full shadow-sm border border-white/80 overflow-hidden">
            <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0284C7] to-[#4F46E5] text-white relative shadow-sm">
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                {detailUser.photoUrl ? (
                  <img
                    src={detailUser.photoUrl}
                    alt={detailUser.name}
                    className="w-18 h-18 rounded-3xl object-cover border-3 border-white shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-18 h-18 rounded-3xl bg-white/20 text-white font-black text-2xl flex items-center justify-center border-2 border-white/40 shadow-xs shrink-0" >
                    {detailUser.avatar || detailUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-black text-xl text-white leading-tight" >{detailUser.name}</h3>
                  <div className="text-xs text-purple-200 font-mono mt-0.5 font-bold">@{detailUser.username}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-white/20 text-white border border-white/30 shadow-xs" >
                      {detailUser.role}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black shadow-xs ${
                      detailUser.status === 'Aktif' ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'
                    }`} >
                      {detailUser.status || 'Aktif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F8FAFC] rounded-[24px] shadow-none">
                <div>
                  <span className="text-[#334155] block text-[11px] font-bold" >NIP / Identitas</span>
                  <span className="font-black text-[#0F172A] font-mono text-sm">{detailUser.nip || '-'}</span>
                </div>
                <div>
                  <span className="text-[#334155] block text-[11px] font-bold" >Password Aktif</span>
                  <span className="font-black text-[#0F172A] font-mono text-sm">{detailUser.password || 'admin123'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F8FAFC] rounded-[24px] shadow-none">
                <div>
                  <span className="text-[#334155] block text-[11px] font-bold" >Penugasan / Bidang</span>
                  <span className="font-extrabold text-[#0F172A] text-xs">
                    {detailUser.assignedClass ? `Wali Kelas ${detailUser.assignedClass}` : detailUser.department || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[#334155] block text-[11px] font-bold" >Terdaftar Sejak</span>
                  <span className="font-extrabold text-[#0F172A] text-xs">{detailUser.createdAt || '2026-01-10'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-sky-100/50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="px-6 py-2.5 bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#9333EA] hover:to-[#6D28D9] text-white rounded-2xl font-black text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all"
                  
                >
                  Tutup Profil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
