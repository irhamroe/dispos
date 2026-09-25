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
  AlertTriangle
} from 'lucide-react';
import { AdminUser, UserRole } from '../types';
import { RombelClass } from '../data/initialData';

interface UserManagementViewProps {
  users: AdminUser[];
  onAddUser: (newUser: AdminUser) => void;
  onUpdateUser: (updatedUser: AdminUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser?: (user: AdminUser) => void;
  currentUser: AdminUser | null;
  classes: RombelClass[];
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  currentUser,
  classes,
}) => {
  // Filters & Search
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'Aktif' | 'Nonaktif'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
          badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
          icon: UserCheck,
          desc: 'Pengampu rombel, absensi & panggilan ortu',
        };
      case 'Guru':
      case 'Guru Piket':
      case 'Guru BK':
        return {
          label: 'Guru',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          icon: GraduationCap,
          desc: 'Piket harian, KBM & input pelanggaran',
        };
      case 'Tendik':
        return {
          label: 'Tendik',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Briefcase,
          desc: 'Tata Usaha, administrasi & persuratan',
        };
      default:
        return {
          label: role,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: User,
          desc: 'Pengguna sistem',
        };
    }
  };

  // Count per role
  const roleCounts = useMemo(() => {
    const counts = {
      all: users.length,
      admin: 0,
      waliKelas: 0,
      guru: 0,
      tendik: 0,
      aktif: 0,
    };

    users.forEach((u) => {
      const r = u.role;
      if (r === 'Admin' || r === 'Administrator') counts.admin++;
      else if (r === 'Wali Kelas') counts.waliKelas++;
      else if (r === 'Guru' || r === 'Guru Piket' || r === 'Guru BK') counts.guru++;
      else if (r === 'Tendik') counts.tendik++;

      if (u.status === 'Aktif') counts.aktif++;
    });

    return counts;
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (selectedRoleFilter !== 'ALL') {
        if (selectedRoleFilter === 'Admin') {
          if (u.role !== 'Admin' && u.role !== 'Administrator') return false;
        } else if (selectedRoleFilter === 'Wali Kelas') {
          if (u.role !== 'Wali Kelas') return false;
        } else if (selectedRoleFilter === 'Guru') {
          if (u.role !== 'Guru' && u.role !== 'Guru Piket' && u.role !== 'Guru BK') return false;
        } else if (selectedRoleFilter === 'Tendik') {
          if (u.role !== 'Tendik') return false;
        }
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
    // Normalize role
    let normalizedRole: UserRole = 'Guru';
    if (user.role === 'Admin' || user.role === 'Administrator') normalizedRole = 'Admin';
    else if (user.role === 'Wali Kelas') normalizedRole = 'Wali Kelas';
    else if (user.role === 'Tendik') normalizedRole = 'Tendik';
    else normalizedRole = 'Guru';
    setEditRole(normalizedRole);

    setEditNip(user.nip || '');
    setEditAssignedClass(user.assignedClass || '');
    setEditDepartment(user.department || '');
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
      name: newName.trim(),
      role: newRole,
      nip: newNip.trim(),
      assignedClass: newRole === 'Wali Kelas' ? newAssignedClass : undefined,
      department: newRole === 'Tendik' 
        ? (newDepartment.trim() || 'Staf Tata Usaha') 
        : newRole === 'Guru' 
          ? (newDepartment.trim() || 'Guru Mata Pelajaran') 
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
      name: editName.trim(),
      role: editRole,
      nip: editNip.trim(),
      assignedClass: editRole === 'Wali Kelas' ? editAssignedClass : undefined,
      department: editDepartment.trim(),
      avatar: initials || editingUser.avatar || 'US',
      photoUrl: editPhotoUrl.trim() || undefined,
      status: editStatus,
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Sistem Pengendalian Akses
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium">SMAN 1 Batu</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-purple-600" />
              <span>Manajemen Pengguna &amp; Multi-Role</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Kelola akun seluruh sivitas sekolah berdasarkan 4 peran utama: 
              <strong className="text-slate-700"> Admin</strong>, 
              <strong className="text-slate-700"> Wali Kelas</strong> (36 Rombel), 
              <strong className="text-slate-700"> Guru</strong> (Piket / Mapel / BK), dan 
              <strong className="text-slate-700"> Tendik</strong> (Tenaga Kependidikan / Tata Usaha).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMatrixModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-300"
            >
              <Info className="w-4 h-4 text-purple-600" />
              <span>Matriks Izin Role</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-300 shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Ekspor Data</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetAddForm();
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </div>

        {/* 4 Role Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          {/* Card 1: Admin */}
          <div 
            onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'Admin' ? 'ALL' : 'Admin')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedRoleFilter === 'Admin'
                ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-200'
                : 'bg-purple-50/40 border-purple-100 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-purple-900">{roleCounts.admin}</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <span>1. Administrator</span>
                {selectedRoleFilter === 'Admin' && <span className="text-[10px] text-purple-600 font-semibold">(Filter Aktif)</span>}
              </div>
              <p className="text-[10.5px] text-purple-700/80 mt-0.5 leading-tight">
                Hak penuh sistem, kelola data master, aturan pelanggaran &amp; akun.
              </p>
            </div>
          </div>

          {/* Card 2: Wali Kelas */}
          <div 
            onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'Wali Kelas' ? 'ALL' : 'Wali Kelas')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedRoleFilter === 'Wali Kelas'
                ? 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-200'
                : 'bg-teal-50/40 border-teal-100 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-teal-900">{roleCounts.waliKelas}</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <span>2. Wali Kelas</span>
                {selectedRoleFilter === 'Wali Kelas' && <span className="text-[10px] text-teal-600 font-semibold">(Filter Aktif)</span>}
              </div>
              <p className="text-[10.5px] text-teal-700/80 mt-0.5 leading-tight">
                Pembina rombel, monitoring presensi siswa &amp; surat panggilan ortu.
              </p>
            </div>
          </div>

          {/* Card 3: Guru */}
          <div 
            onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'Guru' ? 'ALL' : 'Guru')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedRoleFilter === 'Guru'
                ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-200'
                : 'bg-sky-50/40 border-sky-100 hover:border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-sky-900">{roleCounts.guru}</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <span>3. Guru</span>
                {selectedRoleFilter === 'Guru' && <span className="text-[10px] text-sky-600 font-semibold">(Filter Aktif)</span>}
              </div>
              <p className="text-[10.5px] text-sky-700/80 mt-0.5 leading-tight">
                Guru Mapel, Guru Piket presensi gerbang, dan Guru BK disiplin positif.
              </p>
            </div>
          </div>

          {/* Card 4: Tendik */}
          <div 
            onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'Tendik' ? 'ALL' : 'Tendik')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedRoleFilter === 'Tendik'
                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200'
                : 'bg-amber-50/40 border-amber-100 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-amber-900">{roleCounts.tendik}</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>4. Tendik</span>
                {selectedRoleFilter === 'Tendik' && <span className="text-[10px] text-amber-600 font-semibold">(Filter Aktif)</span>}
              </div>
              <p className="text-[10.5px] text-amber-800/80 mt-0.5 leading-tight">
                Tata Usaha, staf kesiswaan, persuratan &amp; verifikasi administrasi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pengguna, username, NIP, rombel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role and Status filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Filter Role:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value="ALL">Semua Role ({users.length})</option>
                <option value="Admin">Admin ({roleCounts.admin})</option>
                <option value="Wali Kelas">Wali Kelas ({roleCounts.waliKelas})</option>
                <option value="Guru">Guru ({roleCounts.guru})</option>
                <option value="Tendik">Tendik ({roleCounts.tendik})</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
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
                className="px-2.5 py-1.5 text-purple-700 hover:bg-purple-50 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Menampilkan <strong className="text-slate-800">{filteredUsers.length}</strong> dari{' '}
            <strong className="text-slate-800">{users.length}</strong> total akun terdaftar
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktif: {roleCounts.aktif}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> Nonaktif: {users.length - roleCounts.aktif}
            </span>
          </div>
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Pengguna / Nama</th>
                <th className="py-3.5 px-4">Role &amp; Akses</th>
                <th className="py-3.5 px-4">Penugasan / Bidang</th>
                <th className="py-3.5 px-4">NIP / Identitas</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">Tidak ada data pengguna yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter role.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const roleMeta = getRoleBadge(user.role);
                  const RoleIcon = roleMeta.icon;
                  const isCurrent = user.id === currentUser?.id;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* 2. Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {user.photoUrl ? (
                            <img
                              src={user.photoUrl}
                              alt={user.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 ring-1 ring-slate-200">
                              {user.avatar || user.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 truncate">
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-600 text-white shadow-2xs">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <span>@{user.username}</span>
                              {user.password && (
                                <span className="text-[10px] text-slate-400">• pass: {user.password}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Role */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[11px] shadow-2xs">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${roleMeta.badgeClass}`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>{roleMeta.label}</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 max-w-[160px] truncate">
                          {roleMeta.desc}
                        </div>
                      </td>

                      {/* 4. Assignment / Department */}
                      <td className="py-3.5 px-4">
                        {user.role === 'Wali Kelas' && user.assignedClass ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[11px] border border-teal-200">
                              Kelas {user.assignedClass}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({user.department || 'Wali Kelas'})
                            </span>
                          </div>
                        ) : user.role === 'Admin' || user.role === 'Administrator' ? (
                          <span className="text-slate-700 font-medium text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            {user.department || 'Manajemen Penuh Sistem'}
                          </span>
                        ) : user.department ? (
                          <span className="text-slate-700 font-medium text-[11px]">
                            {user.department}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">- Belum ada penugasan -</span>
                        )}
                      </td>

                      {/* 5. NIP / Identitas */}
                      <td className="py-3.5 px-4">
                        {user.nip ? (
                          <div className="font-mono text-slate-700 text-[11px]">
                            <span className="font-bold text-slate-800">{user.nip}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          title="Klik untuk ubah status akun"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors border ${
                            user.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{user.status || 'Aktif'}</span>
                        </button>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right">
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
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-purple-200"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}

                          {/* Detail View */}
                          <button
                            type="button"
                            onClick={() => setDetailUser(user)}
                            title="Lihat Detail Profil Pengguna"
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-teal-200"
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
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Data Pengguna"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
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
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent || user.username === 'admin'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer border border-transparent hover:border-rose-200'
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-200" />
                  <span>Tambah Pengguna Baru</span>
                </h3>
                <p className="text-xs text-purple-100/90 mt-0.5">
                  Tentukan peran (Admin, Wali Kelas, Guru, Tendik) dan data kredensial akun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* 1. Pilih Role */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Pilih Peran Akun (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Admin' as UserRole, label: 'Admin', icon: ShieldCheck, color: 'purple' },
                    { id: 'Wali Kelas' as UserRole, label: 'Wali Kelas', icon: UserCheck, color: 'teal' },
                    { id: 'Guru' as UserRole, label: 'Guru', icon: GraduationCap, color: 'sky' },
                    { id: 'Tendik' as UserRole, label: 'Tendik', icon: Briefcase, color: 'amber' },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = newRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setNewRole(r.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-purple-600 text-purple-900 shadow-sm ring-2 ring-purple-400/30 font-extrabold'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white font-medium'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-purple-900/80 bg-white p-2.5 rounded-lg border border-purple-200/60 leading-relaxed">
                  {newRole === 'Admin' && (
                    <>
                      <strong>Hak Akses Admin:</strong> Kelola akun pengguna, konfigurasi profil sekolah, master data siswa &amp; kelas, katalog poin pelanggaran, serta ekspor seluruh rekapitulasi.
                    </>
                  )}
                  {newRole === 'Wali Kelas' && (
                    <>
                      <strong>Hak Akses Wali Kelas:</strong> Pengawasan absensi rombel binaan, tindak lanjut kasus pelanggaran murid binaan, dan pembuatan surat pemanggilan orang tua siswa binaan.
                    </>
                  )}
                  {newRole === 'Guru' && (
                    <>
                      <strong>Hak Akses Guru:</strong> Input absensi harian / tugas piket gerbang, dan pencatatan pelanggaran disiplin siswa saat jam KBM / lingkungan sekolah.
                    </>
                  )}
                  {newRole === 'Tendik' && (
                    <>
                      <strong>Hak Akses Tendik:</strong> Pelayanan administrasi tata usaha, rekapitulasi izin/sakit, cetak bukti surat resmi kesiswaan, dan verifikasi arsip.
                    </>
                  )}
                </div>
              </div>

              {/* 2. Nama & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Lengkap (dengan Gelar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    NIP / NUPTK / NIK
                  </label>
                  <input
                    type="text"
                    placeholder="19750912 200112 1 002"
                    value={newNip}
                    onChange={(e) => setNewNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 3. Username & Password Awal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: mulyadi_guru"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Password Awal
                  </label>
                  <input
                    type="text"
                    placeholder="Default: admin123 / guru123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 4. Role-Specific Field: Kelas Rombel vs Mapel vs Tendik Unit */}
              {newRole === 'Wali Kelas' && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                  <label className="font-bold text-teal-900 block">
                    Pilih Rombel Binaan (36 Kelas SMAN 1 Batu) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newAssignedClass}
                    onChange={(e) => setNewAssignedClass(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-teal-950 font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">-- Pilih Rombel Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Kelas {cls.name} ({cls.grade}) - Wali: {cls.homeroom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newRole === 'Guru' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mata Pelajaran / Tugas Tambahan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Guru Matematika & Piket Harian / Guru BK"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}

              {newRole === 'Tendik' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Unit / Sub-bagian Tenaga Kependidikan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tata Usaha / Kesiswaan / Sarpras / Kepegawaian"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Status Akun */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status Akun
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="new_status"
                      checked={newStatus === 'Aktif'}
                      onChange={() => setNewStatus('Aktif')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-slate-800 font-bold">Aktif (Dapat Login)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="new_status"
                      checked={newStatus === 'Nonaktif'}
                      onChange={() => setNewStatus('Nonaktif')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-slate-600">Nonaktif (Diblokir Sementara)</span>
                  </label>
                </div>
              </div>

              {/* 7. Foto Profil Pengguna (Diletakkan di Bagian Bawah) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-purple-600" />
                    <span>Foto Profil Pengguna (Opsional)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewPhotoMode('upload')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        newPhotoMode === 'upload' ? 'bg-purple-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPhotoMode('url')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        newPhotoMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-600'
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
                          className="w-14 h-14 rounded-xl object-cover border-2 border-purple-500 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewPhotoUrl('');
                            if (addFileInputRef.current) addFileInputRef.current.value = '';
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700"
                          title="Hapus foto"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-5 h-5 text-slate-300" />
                        <span className="text-[9px] mt-0.5 font-medium">Foto</span>
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-purple-600" />
                          <span>Pilih Foto dari Perangkat</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
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
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Masukkan URL gambar profil
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-200" />
                  <span>Edit Data Pengguna: {editingUser.name}</span>
                </h3>
                <p className="text-xs text-blue-100/90 mt-0.5">
                  Perbarui profil, hak akses role, penugasan, dan status akun pengguna.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Role Selection */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Peran Akun (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Admin' as UserRole, label: 'Admin', icon: ShieldCheck },
                    { id: 'Wali Kelas' as UserRole, label: 'Wali Kelas', icon: UserCheck },
                    { id: 'Guru' as UserRole, label: 'Guru', icon: GraduationCap },
                    { id: 'Tendik' as UserRole, label: 'Tendik', icon: Briefcase },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = editRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setEditRole(r.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-blue-600 text-blue-900 shadow-sm ring-2 ring-blue-400/30 font-extrabold'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white font-medium'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nama & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    NIP / NUPTK / NIK
                  </label>
                  <input
                    type="text"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Role specific assignment */}
              {editRole === 'Wali Kelas' && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                  <label className="font-bold text-teal-900 block">
                    Rombel Binaan (36 Kelas SMAN 1 Batu) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editAssignedClass}
                    onChange={(e) => setEditAssignedClass(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-teal-950 font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">-- Pilih Rombel Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Kelas {cls.name} ({cls.grade}) - Wali: {cls.homeroom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(editRole === 'Guru' || editRole === 'Tendik' || editRole === 'Admin') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {editRole === 'Guru'
                      ? 'Mata Pelajaran / Tugas Piket'
                      : editRole === 'Tendik'
                      ? 'Bidang / Unit Kerja Tendik'
                      : 'Jabatan / Deskripsi Penugasan'}
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="Contoh: Guru Matematika / Tata Usaha & Kesiswaan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status Akun
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_status"
                      checked={editStatus === 'Aktif'}
                      onChange={() => setEditStatus('Aktif')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-bold">Aktif (Dapat Login)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_status"
                      checked={editStatus === 'Nonaktif'}
                      onChange={() => setEditStatus('Nonaktif')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-600">Nonaktif</span>
                  </label>
                </div>
              </div>

              {/* Foto Profil Pengguna (Diletakkan di Bagian Bawah) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Foto Profil Pengguna</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEditPhotoMode('upload')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        editPhotoMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPhotoMode('url')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        editPhotoMode === 'url' ? 'bg-blue-600 text-white' : 'text-slate-600'
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
                          className="w-14 h-14 rounded-xl object-cover border-2 border-blue-500 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhotoUrl('');
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700"
                          title="Hapus foto"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-5 h-5 text-slate-300" />
                        <span className="text-[9px] mt-0.5 font-medium">Foto</span>
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Pilih Foto dari Perangkat</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
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
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Masukkan URL gambar profil
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4.5 bg-gradient-to-r from-amber-600 to-orange-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
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
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="font-bold text-sm">{resettingUser.name}</div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Role: <strong>{resettingUser.role}</strong> • Username: <code>{resettingUser.username}</code>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Password Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Preset Passwords */}
              <div className="space-y-1.5">
                <span className="text-slate-400 text-[11px] block">Template Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['sman1batu2026', 'guru123', 'wali123', 'admin123', 'tendik123'].map((pwd) => (
                    <button
                      key={pwd}
                      type="button"
                      onClick={() => setNewPasswordVal(pwd)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono text-[10.5px] cursor-pointer"
                    >
                      {pwd}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Akun Pengguna?</h3>
              <p className="text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun <strong className="text-slate-800">{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username}) dengan role <strong className="text-slate-800">{deleteConfirmUser.role}</strong>?
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 mt-3 font-medium">
                Tindakan ini permanen dan pengguna ini tidak akan dapat login lagi ke dalam sistem.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative">
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                {detailUser.photoUrl ? (
                  <img
                    src={detailUser.photoUrl}
                    alt={detailUser.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center border-2 border-white/40 shadow-md shrink-0">
                    {detailUser.avatar || detailUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-black text-lg text-white leading-tight">{detailUser.name}</h3>
                  <div className="text-xs text-purple-200 font-mono mt-0.5">@{detailUser.username}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                      {detailUser.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      detailUser.status === 'Aktif' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'
                    }`}>
                      {detailUser.status || 'Aktif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 py-2 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10.5px]">NIP / Identitas</span>
                  <span className="font-bold text-slate-800 font-mono">{detailUser.nip || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Password Aktif</span>
                  <span className="font-bold text-slate-800 font-mono">{detailUser.password || 'admin123'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Penugasan / Bidang</span>
                  <span className="font-bold text-slate-800">
                    {detailUser.assignedClass ? `Wali Kelas ${detailUser.assignedClass}` : detailUser.department || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Terdaftar Sejak</span>
                  <span className="font-bold text-slate-800">{detailUser.createdAt || '2026-01-10'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: MATRIKS HAK AKSES ROLE */}
      {/* ========================================================================= */}
      {isMatrixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-200" />
                  <span>Matriks Hak Akses &amp; Kewenangan Multi-Role</span>
                </h3>
                <p className="text-xs text-purple-100/90 mt-0.5">
                  Daftar izin operasional berdasarkan 4 tingkatan peran di SMAN 1 Batu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMatrixModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                    <th className="p-3">Fitur / Modul Aplikasi</th>
                    <th className="p-3 text-center text-purple-800">1. Admin</th>
                    <th className="p-3 text-center text-teal-800">2. Wali Kelas</th>
                    <th className="p-3 text-center text-sky-800">3. Guru</th>
                    <th className="p-3 text-center text-amber-800">4. Tendik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {[
                    {
                      feature: 'Dashboard Statistik & Grafik Kehadiran',
                      admin: 'Penuh (36 Rombel)',
                      wali: 'Penuh (36 Rombel)',
                      guru: 'Penuh (36 Rombel)',
                      tendik: 'Penuh (36 Rombel)',
                    },
                    {
                      feature: 'Input Presensi Harian (H, I, S, A, D)',
                      admin: 'Penuh Semua Kelas',
                      wali: 'Kelas Binaan & Piket',
                      guru: 'Piket Harian & KBM',
                      tendik: 'Verifikasi & Monitoring',
                    },
                    {
                      feature: 'Rekap Presensi & Ekspor Excel/PDF',
                      admin: 'Penuh Semua Kelas',
                      wali: 'Penuh Rombel Sendiri',
                      guru: 'Lihat & Filter',
                      tendik: 'Penuh untuk Arsip TU',
                    },
                    {
                      feature: 'Rekap Surat Izin Sakit / Surat Dokter',
                      admin: 'Penuh',
                      wali: 'Penuh Kelas Binaan',
                      guru: 'Lihat',
                      tendik: 'Penuh (Pelayanan Surat)',
                    },
                    {
                      feature: 'Pencatatan Pelanggaran Siswa & Poin',
                      admin: 'Penuh (Tambah/Edit/Hapus)',
                      wali: 'Penuh (Semua Siswa)',
                      guru: 'Penuh (Input Pelanggaran)',
                      tendik: 'Terbatas (Bantu Catat)',
                    },
                    {
                      feature: 'Tagihan Pembinaan / Restitusi Siswa',
                      admin: 'Penuh & Verifikasi',
                      wali: 'Penuh Kelas Binaan',
                      guru: 'Pendampingan Pembinaan',
                      tendik: 'Arsip Dokumen',
                    },
                    {
                      feature: 'Penerbitan Surat Panggilan Orang Tua',
                      admin: 'Penuh + TTD Digital',
                      wali: 'Penuh Buat & TTD Wali',
                      guru: 'Rekomendasi Kasus',
                      tendik: 'Distribusi & Arsip',
                    },
                    {
                      feature: 'Katalog Aturan & Bobot Poin Pelanggaran',
                      admin: 'Penuh (Kelola Aturan)',
                      wali: 'Lihat Katalog',
                      guru: 'Lihat Katalog',
                      tendik: 'Lihat Katalog',
                    },
                    {
                      feature: 'Master Data Siswa (~1.300 Siswa)',
                      admin: 'Penuh (Tambah/Edit/Hapus)',
                      wali: 'Lihat & Edit Murid Binaan',
                      guru: 'Lihat Data Siswa',
                      tendik: 'Verifikasi Dapodik',
                    },
                    {
                      feature: 'Master Data Kelas (36 Rombel)',
                      admin: 'Penuh (Kelola Rombel)',
                      wali: 'Lihat Data Kelas',
                      guru: 'Lihat Data Kelas',
                      tendik: 'Lihat Data Kelas',
                    },
                    {
                      feature: 'Manajemen Pengguna & Multi-Role',
                      admin: 'Penuh (Kelola Semua User)',
                      wali: 'Nonaktif',
                      guru: 'Nonaktif',
                      tendik: 'Nonaktif',
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{row.feature}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                          {row.admin}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[10px]">
                          {row.wali}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px]">
                          {row.guru}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {row.tendik}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsMatrixModalOpen(false)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Tutup Matriks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
