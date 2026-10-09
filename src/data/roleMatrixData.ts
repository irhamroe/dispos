import { RoleMatrixMap, RolePermissionConfig, UserRole, ActionPermissionKey } from '../types';

export interface NavTabPermissionMeta {
  id: string;
  label: string;
  category: string;
  description: string;
  iconName: string;
}

export interface ActionPermissionMeta {
  key: ActionPermissionKey;
  label: string;
  category: string;
  description: string;
}

export const NAV_TAB_DEFINITIONS: NavTabPermissionMeta[] = [
  // Presensi & Kehadiran
  {
    id: 'dashboard',
    label: 'Dashboard Statistik',
    category: 'Presensi & Kehadiran',
    description: 'Akses ringkasan statistik kehadiran, rasio harian & grafik persentase',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'attendance',
    label: 'Presensi Harian',
    category: 'Presensi & Kehadiran',
    description: 'Input dan edit absensi harian kelas (H, I, S, A, D)',
    iconName: 'ClipboardCheck',
  },
  {
    id: 'recap',
    label: 'Rekap Presensi',
    category: 'Presensi & Kehadiran',
    description: 'Lihat rekapitulasi kehadiran berdasarkan rentang tanggal & ekspor laporan',
    iconName: 'CalendarRange',
  },
  {
    id: 'rekap-surat-izin',
    label: 'Rekap Surat Izin',
    category: 'Presensi & Kehadiran',
    description: 'Pantau dan kelola surat keterangan sakit / izin yang belum diserahkan',
    iconName: 'FileWarning',
  },

  // Disiplin Positif
  {
    id: 'discipline',
    label: 'Input Pelanggaran',
    category: 'Disiplin Positif',
    description: 'Catat poin dan pelanggaran tata tertib siswa',
    iconName: 'ShieldAlert',
  },
  {
    id: 'rekap-pelanggaran',
    label: 'Rekap Pelanggaran',
    category: 'Disiplin Positif',
    description: 'Laporan dan rekapitulasi riwayat pelanggaran tata tertib',
    iconName: 'CalendarDays',
  },
  {
    id: 'tagihan-pembinaan',
    label: 'Tagihan Pembinaan',
    category: 'Disiplin Positif',
    description: 'Kelola tindak lanjut restitusi, pembinaan positif, dan unggah berkas bukti',
    iconName: 'FileWarning',
  },
  {
    id: 'surat-panggilan',
    label: 'Surat Panggilan Ortu',
    category: 'Disiplin Positif',
    description: 'Penerbitan format resmi surat pemanggilan orang tua & berita acara',
    iconName: 'Mail',
  },
  {
    id: 'layanan-izin-siswa',
    label: 'Layanan Izin Siswa',
    category: 'Disiplin Positif',
    description: 'Verifikasi izin keluar gerbang, keluar kelas, dan dispensasi atribut/seragam',
    iconName: 'DoorOpen',
  },
  {
    id: 'aturan-pelanggaran',
    label: 'Manajemen Aturan',
    category: 'Disiplin Positif',
    description: 'Katalog bobot poin & pasal-pasal tata tertib sekolah',
    iconName: 'SlidersHorizontal',
  },

  // Master Data
  {
    id: 'data-siswa',
    label: 'Data Siswa',
    category: 'Master Data',
    description: 'Akses basis data induk siswa, pencarian NISN & profil lengkap',
    iconName: 'Users',
  },
  {
    id: 'data-kelas',
    label: 'Data Kelas',
    category: 'Master Data',
    description: 'Struktur 36 rombel rombongan belajar jenjang X, XI, XII',
    iconName: 'Layers',
  },
  {
    id: 'data-walikelas',
    label: 'Data Wali Kelas',
    category: 'Master Data',
    description: 'Daftar 36 guru pembina rombel kelas dan kontak',
    iconName: 'UserCheck',
  },
  {
    id: 'manajemen-user',
    label: 'Manajemen Pengguna',
    category: 'Master Data',
    description: 'Kelola akun multi-role seluruh sivitas sekolah (Admin, Wali Kelas, Guru, Tendik)',
    iconName: 'Users',
  },
  {
    id: 'matriks-role',
    label: 'Matriks Hak Akses User',
    category: 'Master Data',
    description: 'Pengaturan matriks hak akses dan wewenang fitur sesuai peran pengguna (RBAC)',
    iconName: 'ShieldCheck',
  },
];

export const ACTION_PERMISSION_DEFINITIONS: ActionPermissionMeta[] = [
  // Presensi
  {
    key: 'attendance_input_all',
    label: 'Input Presensi Semua Kelas',
    category: 'Presensi & Kehadiran',
    description: 'Dapat menginput dan mengubah presensi untuk 36 rombel kelas',
  },
  {
    key: 'attendance_input_own',
    label: 'Input Presensi Rombel Binaan Sendiri',
    category: 'Presensi & Kehadiran',
    description: 'Hanya dapat menginput presensi pada kelas binaannya sendiri',
  },
  {
    key: 'attendance_export',
    label: 'Ekspor Rekap Kehadiran (Excel/PDF)',
    category: 'Presensi & Kehadiran',
    description: 'Mengunduh berkas laporan kehadiran resmi ke komputer/HP',
  },
  {
    key: 'attendance_verify_letter',
    label: 'Verifikasi Status Surat Izin / Sakit',
    category: 'Presensi & Kehadiran',
    description: 'Menandai siswa sudah menyerahkan surat dokter / surat izin',
  },

  // Disiplin Positif
  {
    key: 'discipline_create',
    label: 'Catat Pelanggaran Baru',
    category: 'Disiplin Positif',
    description: 'Menginput catatan pelanggaran dan penambahan poin tata tertib',
  },
  {
    key: 'discipline_edit',
    label: 'Edit Catatan Pelanggaran',
    category: 'Disiplin Positif',
    description: 'Mengubah data pelanggaran, poin, atau keterangan kejadian',
  },
  {
    key: 'discipline_delete',
    label: 'Hapus Catatan Pelanggaran',
    category: 'Disiplin Positif',
    description: 'Menghapus data riwayat pelanggaran dari basis data',
  },
  {
    key: 'discipline_coaching',
    label: 'Selesaikan Pembinaan & Unggah Bukti',
    category: 'Disiplin Positif',
    description: 'Menyelesaikan tagihan pembinaan serta melampirkan foto/surat pembinaan',
  },
  {
    key: 'discipline_export',
    label: 'Ekspor Rekap Pelanggaran & Poin',
    category: 'Disiplin Positif',
    description: 'Mengunduh rekapitulasi poin pelanggaran dalam format Excel / PDF',
  },

  // Layanan Izin Siswa
  {
    key: 'permit_approve',
    label: 'Verifikasi & Setujui Izin Siswa',
    category: 'Layanan Izin Siswa',
    description: 'Menyetujui atau menolak pengajuan izin keluar kelas/sekolah/seragam',
  },
  {
    key: 'permit_create_manual',
    label: 'Buat Surat Izin Manual',
    category: 'Layanan Izin Siswa',
    description: 'Membuatkan surat izin keluar langsung untuk siswa',
  },
  {
    key: 'permit_delete',
    label: 'Hapus Riwayat Izin Siswa',
    category: 'Layanan Izin Siswa',
    description: 'Menghapus riwayat arsip perizinan siswa',
  },

  // Surat Panggilan Orang Tua
  {
    key: 'parent_call_create',
    label: 'Terbitkan Surat Panggilan',
    category: 'Surat Panggilan Orang Tua',
    description: 'Membuat surat resmi pemanggilan orang tua siswa',
  },
  {
    key: 'parent_call_print',
    label: 'Cetak Surat Panggilan & TTD Digital',
    category: 'Surat Panggilan Orang Tua',
    description: 'Mencetak surat panggilan resmi lengkap dengan kop sekolah',
  },

  // Manajemen Aturan
  {
    key: 'rules_manage',
    label: 'Kelola Aturan & Bobot Poin',
    category: 'Manajemen Aturan',
    description: 'Menambah, menyunting, dan menghapus daftar katalog aturan & poin',
  },

  // Master Data
  {
    key: 'students_manage',
    label: 'Kelola Master Data Siswa (Tambah/Edit/Hapus)',
    category: 'Master Data',
    description: 'Dapat menambah, mengubah identitas siswa, atau menghapus data',
  },
  {
    key: 'classes_manage',
    label: 'Kelola Master Data Kelas (36 Rombel)',
    category: 'Master Data',
    description: 'Menambah, mengubah wali rombel, dan mengatur kapasitas kelas',
  },
  {
    key: 'walikelas_manage',
    label: 'Kelola Master Data Wali Kelas',
    category: 'Master Data',
    description: 'Menambah dan mengubah data NIP serta penugasan wali kelas',
  },

  // Manajemen User & Keamanan
  {
    key: 'users_manage',
    label: 'Kelola Akun Pengguna & Tambah User',
    category: 'Manajemen User & Sistem',
    description: 'Membuat akun baru, mengubah role pengguna, dan menonaktifkan akun',
  },
  {
    key: 'users_reset_password',
    label: 'Reset Password Pengguna Lain',
    category: 'Manajemen User & Sistem',
    description: 'Mengatur ulang kata sandi akun pengguna sekolah',
  },
  {
    key: 'matrix_manage',
    label: 'Ubah Matriks Pengaturan Hak Akses',
    category: 'Manajemen User & Sistem',
    description: 'Mengonfigurasi wewenang operasional tiap peran dalam sistem',
  },
];

export const initialRoleMatrix: RoleMatrixMap = {
  Admin: {
    role: 'Admin',
    label: 'Administrator',
    description: 'Akses penuh dan wewenang mutlak atas seluruh fitur, data master, dan pengaturan sistem.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    iconName: 'ShieldCheck',
    isSystemRole: true,
    allowedTabs: [
      'dashboard',
      'attendance',
      'recap',
      'rekap-surat-izin',
      'layanan-izin-siswa',
      'discipline',
      'rekap-pelanggaran',
      'tagihan-pembinaan',
      'surat-panggilan',
      'aturan-pelanggaran',
      'data-siswa',
      'data-kelas',
      'data-walikelas',
      'manajemen-user',
      'matriks-role',
    ],
    actionPermissions: {
      attendance_input_all: true,
      attendance_input_own: true,
      attendance_export: true,
      attendance_verify_letter: true,
      discipline_create: true,
      discipline_edit: true,
      discipline_delete: true,
      discipline_coaching: true,
      discipline_export: true,
      permit_approve: true,
      permit_create_manual: true,
      permit_delete: true,
      parent_call_create: true,
      parent_call_print: true,
      rules_manage: true,
      students_manage: true,
      classes_manage: true,
      walikelas_manage: true,
      users_manage: true,
      users_reset_password: true,
      matrix_manage: true,
    },
    lastUpdated: '2026-01-01',
    updatedBy: 'Sistem Standar',
  },

  'Wali Kelas': {
    role: 'Wali Kelas',
    label: 'Wali Kelas (36 Rombel)',
    description: 'Fokus pada pembinaan rombongan belajar, presensi harian siswa, penyelesaian pembinaan, dan penerbitan surat panggilan.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconName: 'UserCheck',
    allowedTabs: [
      'dashboard',
      'attendance',
      'recap',
      'rekap-surat-izin',
      'layanan-izin-siswa',
      'discipline',
      'tagihan-pembinaan',
      'surat-panggilan',
      'data-siswa',
      'data-kelas',
      'data-walikelas',
    ],
    actionPermissions: {
      attendance_input_all: false,
      attendance_input_own: true,
      attendance_export: true,
      attendance_verify_letter: true,
      discipline_create: true,
      discipline_edit: false,
      discipline_delete: false,
      discipline_coaching: true,
      discipline_export: true,
      permit_approve: true,
      permit_create_manual: true,
      permit_delete: false,
      parent_call_create: true,
      parent_call_print: true,
      rules_manage: false,
      students_manage: false,
      classes_manage: false,
      walikelas_manage: false,
      users_manage: false,
      users_reset_password: false,
      matrix_manage: false,
    },
    lastUpdated: '2026-01-01',
    updatedBy: 'Sistem Standar',
  },

  Guru: {
    role: 'Guru',
    label: 'Guru (Piket, Mapel & BK)',
    description: 'Mencakup Guru Piket gerbang, Guru Mata Pelajaran KBM, dan Guru BK dalam penegakan ketertiban serta izin siswa.',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    iconName: 'GraduationCap',
    allowedTabs: [
      'dashboard',
      'attendance',
      'recap',
      'layanan-izin-siswa',
      'discipline',
      'rekap-pelanggaran',
      'tagihan-pembinaan',
      'aturan-pelanggaran',
      'data-siswa',
      'data-kelas',
      'data-walikelas',
    ],
    actionPermissions: {
      attendance_input_all: true,
      attendance_input_own: false,
      attendance_export: true,
      attendance_verify_letter: false,
      discipline_create: true,
      discipline_edit: false,
      discipline_delete: false,
      discipline_coaching: true,
      discipline_export: true,
      permit_approve: true,
      permit_create_manual: true,
      permit_delete: false,
      parent_call_create: false,
      parent_call_print: false,
      rules_manage: false,
      students_manage: false,
      classes_manage: false,
      walikelas_manage: false,
      users_manage: false,
      users_reset_password: false,
      matrix_manage: false,
    },
    lastUpdated: '2026-01-01',
    updatedBy: 'Sistem Standar',
  },

  Tendik: {
    role: 'Tendik',
    label: 'Tenaga Kependidikan (TU & Staf)',
    description: 'Pelayanan administrasi Tata Usaha, arsip surat keterangan izin, verifikasi data induk Dapodik, dan distribusi panggilan.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    iconName: 'Briefcase',
    allowedTabs: [
      'dashboard',
      'attendance',
      'recap',
      'rekap-surat-izin',
      'layanan-izin-siswa',
      'surat-panggilan',
      'data-siswa',
      'data-kelas',
      'data-walikelas',
    ],
    actionPermissions: {
      attendance_input_all: false,
      attendance_input_own: false,
      attendance_export: true,
      attendance_verify_letter: true,
      discipline_create: false,
      discipline_edit: false,
      discipline_delete: false,
      discipline_coaching: false,
      discipline_export: true,
      permit_approve: true,
      permit_create_manual: true,
      permit_delete: false,
      parent_call_create: false,
      parent_call_print: true,
      rules_manage: false,
      students_manage: true,
      classes_manage: false,
      walikelas_manage: false,
      users_manage: false,
      users_reset_password: false,
      matrix_manage: false,
    },
    lastUpdated: '2026-01-01',
    updatedBy: 'Sistem Standar',
  },
};

/**
 * Normalizes any role string into one of standard 4 keys
 */
export const normalizeRole = (rawRole?: string): UserRole => {
  if (!rawRole) return 'Guru';
  if (rawRole === 'Admin' || rawRole === 'Administrator') return 'Admin';
  if (rawRole === 'Wali Kelas') return 'Wali Kelas';
  if (rawRole === 'Tendik' || rawRole === 'Tata Usaha' || rawRole === 'Staf TU') return 'Tendik';
  return 'Guru';
};

/**
 * Helper to check if a role has access to a navigation tab
 */
export const checkTabAccess = (
  role: string | undefined, 
  tabId: string, 
  matrix: RoleMatrixMap = initialRoleMatrix
): boolean => {
  const norm = normalizeRole(role);
  // Admin always has full tab access
  if (norm === 'Admin') return true;
  const config = matrix[norm];
  if (!config) return true;
  // Student master aliases
  if (tabId === 'students' && config.allowedTabs.includes('data-siswa')) return true;
  return config.allowedTabs.includes(tabId);
};

/**
 * Helper to check if a role has a specific action permission
 */
export const checkActionPermission = (
  role: string | undefined, 
  permissionKey: ActionPermissionKey, 
  matrix: RoleMatrixMap = initialRoleMatrix
): boolean => {
  const norm = normalizeRole(role);
  if (norm === 'Admin') return true;
  const config = matrix[norm];
  if (!config || !config.actionPermissions) return false;
  return !!config.actionPermissions[permissionKey];
};
