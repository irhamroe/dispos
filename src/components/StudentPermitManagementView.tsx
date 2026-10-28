import React, { useState, useMemo } from 'react';
import { 
  DoorOpen, 
  School, 
  Shirt, 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  QrCode, 
  LogOut, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Layers,
  FileText,
  Bell,
  Check,
  XCircle,
  RotateCcw,
  Zap,
  ShieldAlert,
  Award,
  Lock,
  Unlock,
  AlertTriangle,
  Clock4
} from 'lucide-react';
import { Student, SchoolProfile, StudentPermitRecord, StudentPermitType, StudentPermitStatus, AdminUser, RoleMatrixMap, ApprovalStep } from '../types';
import { RombelClass } from '../data/initialData';
import { formatDateIndonesian, formatDayAndDateIndonesian, getTodayDateString, getTodayIndonesian } from '../utils/exportUtils';
import { sortClasses } from '../utils/sortUtils';
import { checkActionPermission, initialRoleMatrix } from '../data/roleMatrixData';

interface StudentPermitManagementViewProps {
  permits: StudentPermitRecord[];
  students: Student[];
  classes: RombelClass[];
  schoolProfile: SchoolProfile;
  currentUserName: string;
  onUpdatePermit: (updated: StudentPermitRecord) => void;
  onDeletePermit: (permitId: string) => void;
  onOpenPublicPortal: () => void;
  currentUser?: AdminUser | null;
  users?: AdminUser[];
  roleMatrix?: RoleMatrixMap;
}

type ManagementMainTab = 'PENDING' | 'APPROVED_RECAP' | 'REJECTED' | 'ALL_HISTORY';
type StageFilterType = 'ALL' | 'ADMIN' | 'GURU_MAPEL' | 'WAKASEK' | 'DONE';

interface StageApprovalModalState {
  permit: StudentPermitRecord;
  stage: 'ADMIN' | 'GURU_MAPEL' | 'WAKASEK';
  approverName: string;
  approverRole: string;
  notes: string;
}

export const StudentPermitManagementView: React.FC<StudentPermitManagementViewProps> = ({
  permits,
  students,
  classes,
  schoolProfile,
  currentUserName,
  onUpdatePermit,
  onDeletePermit,
  onOpenPublicPortal,
  currentUser,
  users = [],
  roleMatrix = initialRoleMatrix,
}) => {
  const canApprove = checkActionPermission(currentUser?.role, 'permit_approve', roleMatrix);
  const canCreateManual = checkActionPermission(currentUser?.role, 'permit_create_manual', roleMatrix);
  const canDelete = checkActionPermission(currentUser?.role, 'permit_delete', roleMatrix);

  // Role detection helpers
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Administrator';
  const isWakasek = currentUser?.role === 'Wakasek' || currentUser?.role === 'Wakil Kepala Sekolah' || 
    (currentUser?.department || '').toLowerCase().includes('wakasek') || 
    (currentUser?.department || '').toLowerCase().includes('wakil kepala') ||
    (currentUser?.department || '').toLowerCase().includes('waka');
  const isWaliKelas = currentUser?.role === 'Wali Kelas';
  const userWaliClass = currentUser?.assignedClass || (
    isWaliKelas && currentUser?.department
      ? currentUser.department.replace(/^Wali\s+Kelas\s*/i, '').trim()
      : undefined
  );
  const isActualWaliKelas = Boolean(userWaliClass) || isWaliKelas;
  const isGuruMapel = currentUser?.role === 'Guru';
  const isGuruOrWali = isGuruMapel || isActualWaliKelas || isWakasek;
  const isAdminDisiplin = (isAdmin || currentUser?.role === 'Guru Piket' || currentUser?.role === 'Guru BK') && !isWakasek;
  const isSatpam = currentUser?.role === 'Satpam' || 
    currentUser?.role === 'Security' || 
    (currentUser?.role as string) === 'Petugas Keamanan' || 
    (currentUser?.department || '').toLowerCase().includes('satpam') || 
    (currentUser?.department || '').toLowerCase().includes('security');

  // Khusus tombol 'Siswa Kembali': Hanya Admin dan Satpam saja yang berwenang
  const canVerifyReturn = isAdmin || isAdminDisiplin || isSatpam;

  // Per-Stage Permission Checks (Pemisahan kewenangan tegas antar tahap):
  // Tahap 1: Khusus Admin Disiplin Positif (Admin, Guru Piket, Guru BK) - Wakasek TIDAK BISA menyetujui Tahap 1
  const canApproveStage1 = isAdminDisiplin;
  // Tahap 2: Khusus Guru Mata Pelajaran atau Wali Kelas (Wakasek berwenang menyetujui karena pada dasarnya juga seorang Guru Mapel)
  const canApproveStage2 = isGuruOrWali || isAdmin;
  // Tahap 3: Khusus Wakil Kepala Sekolah (Admin Utama berhak membantu)
  const canApproveStage3 = isWakasek || isAdmin;

  // Helper to determine active step for a permit (Keluar Sekolah: 3 tahap, Keluar Kelas: 2 tahap)
  const getApprovalStep = (p: StudentPermitRecord): ApprovalStep => {
    if (p.type === 'Dispensasi Seragam') return 'DONE';
    if (p.status === 'Disetujui' || p.status === 'Kembali' || p.status === 'Sudah Kembali') return 'DONE';
    if (p.currentApprovalStep) return p.currentApprovalStep;
    if (!p.adminApproval?.approved) return 'ADMIN';
    if (!p.teacherApproval?.approved) return 'GURU_MAPEL';
    if (p.type === 'Keluar Sekolah') {
      if (!p.wakasekApproval?.approved) return 'WAKASEK';
    }
    return 'DONE';
  };

  // Main view tab (Pending vs Approved Recap vs Rejected vs All)
  const [mainTab, setMainTab] = useState<ManagementMainTab>('PENDING');

  // Secondary filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | StudentPermitType>('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState<StageFilterType>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [useDateFilter, setUseDateFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal: Print Standee QR Code
  const [isQrStandeeOpen, setIsQrStandeeOpen] = useState<boolean>(false);

  // Modal: View & Print Single Permit
  const [viewingPermit, setViewingPermit] = useState<StudentPermitRecord | null>(null);

  // Modal: Sequential Stage Approval (Tahap 1 Admin Disiplin / Tahap 2 Guru Mapel / Tahap 3 Wakasek)
  const [approvingStage, setApprovingStage] = useState<StageApprovalModalState | null>(null);
  const [isCustomRole, setIsCustomRole] = useState<boolean>(false);

  // Modal: Reject Permit with Reason Note
  const [rejectingPermit, setRejectingPermit] = useState<StudentPermitRecord | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // Counts
  const pendingPermits = useMemo(() => permits.filter((p) => p.status === 'Menunggu'), [permits]);
  const approvedPermits = useMemo(() => permits.filter((p) => p.status === 'Disetujui' || p.status === 'Kembali'), [permits]);
  const rejectedPermits = useMemo(() => permits.filter((p) => p.status === 'Ditolak'), [permits]);

  // If there are pending permits on initial load and user hasn't selected another tab, default to PENDING
  // If no pending permits, default to APPROVED_RECAP
  React.useEffect(() => {
    if (pendingPermits.length === 0 && mainTab === 'PENDING') {
      setMainTab('APPROVED_RECAP');
    }
  }, [pendingPermits.length]);

  // Filtered Permits according to active mainTab and sub-filters
  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      // 1. Filter by Main Tab
      if (mainTab === 'PENDING' && p.status !== 'Menunggu') return false;
      if (mainTab === 'APPROVED_RECAP' && p.status !== 'Disetujui' && p.status !== 'Kembali') return false;
      if (mainTab === 'REJECTED' && p.status !== 'Ditolak') return false;
      // if mainTab === 'ALL_HISTORY', no status restriction

      // 2. Filter by Type
      if (selectedTypeFilter !== 'ALL' && p.type !== selectedTypeFilter) return false;

      // 3. Filter by 3-Stage Approval (Khusus Keluar Sekolah)
      if (selectedStageFilter !== 'ALL') {
        const step = getApprovalStep(p);
        if (step !== selectedStageFilter) return false;
      }

      // 4. Filter by Class
      if (selectedClassFilter !== 'ALL' && p.className !== selectedClassFilter) return false;

      // 5. Filter by Date (if checkbox is active)
      if (useDateFilter && p.date !== selectedDate) return false;

      // 6. Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.studentName.toLowerCase().includes(q);
        const matchNisn = (p.nisn || '').toLowerCase().includes(q);
        const matchReason = p.reason.toLowerCase().includes(q);
        const matchSubject = (p.subject || '').toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchReason && !matchSubject) return false;
      }

      return true;
    });
  }, [permits, mainTab, selectedTypeFilter, selectedStageFilter, selectedClassFilter, useDateFilter, selectedDate, searchQuery]);

  // Quick Metrics for Today
  const todayDate = getTodayDateString();
  const todayPermits = permits.filter((p) => p.date === todayDate);
  const todayExitSchool = todayPermits.filter((p) => p.type === 'Keluar Sekolah').length;
  const todayExitClass = todayPermits.filter((p) => p.type === 'Keluar Kelas').length;
  const todayUniform = todayPermits.filter((p) => p.type === 'Dispensasi Seragam').length;
  const todayPending = pendingPermits.filter((p) => p.date === todayDate).length;

  // Standar Single Approval (Khusus Dispensasi Seragam - Hanya Perlu Persetujuan Admin Disiplin Positif)
  const handleApprove = (permit: StudentPermitRecord) => {
    const updated: StudentPermitRecord = {
      ...permit,
      status: 'Disetujui',
      approvedBy: `${currentUserName} (${currentUser?.department || 'Admin Disiplin Positif'})`,
      approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toISOString(),
    };
    onUpdatePermit(updated);
  };

  // Daftar Mata Pelajaran unik di sekolah untuk opsi dropdown Jabatan / Wewenang
  const schoolSubjects = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.role === 'Guru' && u.department) {
        const cleaned = u.department.replace(/^Guru\s+/i, '').trim();
        if (cleaned && !cleaned.toLowerCase().includes('kepala sekolah')) {
          set.add(cleaned);
        }
      }
    });
    const defaults = [
      'Bahasa Indonesia',
      'Bahasa Inggris',
      'Matematika',
      'Seni Budaya',
      'PJOK',
      'Sejarah',
      'Sosiologi / IPS',
      'Fisika',
      'Kimia',
      'Biologi',
      'Ekonomi',
      'Geografi',
      'PPKn',
      'Pendidikan Agama & Budi Pekerti',
      'Informatika',
      'Bimbingan Konseling (BK)',
    ];
    defaults.forEach((d) => set.add(d));
    return Array.from(set);
  }, [users]);

  // 3-STAGE SEQUENTIAL APPROVAL HANDLERS (Khusus Izin Keluar Sekolah)
  const handleOpenApproveStage = (permit: StudentPermitRecord, stage: 'ADMIN' | 'GURU_MAPEL' | 'WAKASEK') => {
    let defaultApprover = currentUserName;
    let defaultRole = 'Admin Disiplin Positif';
    let defaultNotes = '';

    // Otomatis tentukan jabatan dari akun pengguna yang sedang login (currentUser)
    const getUserSelfRole = () => {
      if (!currentUser) return '';
      if (isWakasek) {
        return currentUser.department || 'Wakil Kepala Sekolah';
      }
      if (isActualWaliKelas) {
        return userWaliClass ? `Wali Kelas ${userWaliClass}` : (currentUser.department || 'Wali Kelas');
      }
      if (currentUser.role === 'Guru') {
        return 'Guru Mata Pelajaran';
      }
      if (isAdminDisiplin) {
        return currentUser.department || 'Admin Disiplin Positif';
      }
      return currentUser.department || currentUser.role || '';
    };

    const selfRole = getUserSelfRole();

    if (stage === 'ADMIN') {
      defaultApprover = currentUserName || 'Admin Disiplin Positif';
      defaultRole = isAdminDisiplin ? (currentUser?.department || 'Admin Disiplin Positif') : 'Admin Disiplin Positif';
      defaultNotes = 'Permohonan izin keluar telah diverifikasi oleh Tim Disiplin Positif.';
    } else if (stage === 'GURU_MAPEL') {
      defaultApprover = currentUserName;
      if (isWakasek) {
        defaultRole = currentUser?.department || 'Wakil Kepala Sekolah';
      } else if (isActualWaliKelas) {
        // Jika user adalah wali kelas dari siswa ini, default adalah Wali Kelas [userWaliClass]
        // Jika user adalah wali kelas kelas lain tapi mengajar siswa ini, default adalah Guru Mata Pelajaran
        if (userWaliClass && userWaliClass === permit.className) {
          defaultRole = `Wali Kelas ${userWaliClass}`;
        } else {
          defaultRole = 'Guru Mata Pelajaran';
        }
      } else {
        defaultRole = 'Guru Mata Pelajaran';
      }

      if (defaultRole.startsWith('Wali Kelas')) {
        defaultNotes = `Permohonan izin keluar telah dikoordinasikan dan disetujui oleh ${defaultRole}.`;
      } else {
        defaultNotes = 'Materi KBM mata pelajaran saat ini telah dikoordinasikan.';
      }
    } else if (stage === 'WAKASEK') {
      defaultApprover = currentUserName;
      defaultRole = isWakasek ? (currentUser?.department || 'Wakil Kepala Sekolah') : (selfRole || 'Wakil Kepala Sekolah');
      defaultNotes = 'Disetujui izin keluar sekolah dan tercatat di buku kendali.';
    }

    setIsCustomRole(false);
    setApprovingStage({
      permit,
      stage,
      approverName: defaultApprover,
      approverRole: defaultRole,
      notes: defaultNotes,
    });
  };

  const handleConfirmApproveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingStage) return;

    const { permit, stage, approverName, approverRole, notes } = approvingStage;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    let updated: StudentPermitRecord = { ...permit };

    if (stage === 'ADMIN') {
      updated = {
        ...updated,
        adminApproval: {
          approved: true,
          approvedBy: approverName.trim() || currentUserName,
          approvedAt: nowTime,
          roleTitle: approverRole || 'Admin Disiplin Positif',
          notes: notes.trim() || undefined,
        },
        currentApprovalStep: 'GURU_MAPEL', // Maju ke Tahap 2: Guru Mapel / Wali Kelas
        status: 'Menunggu',
        updatedAt: new Date().toISOString(),
      };
    } else if (stage === 'GURU_MAPEL') {
      const isKeluarKelas = permit.type === 'Keluar Kelas';
      const roleSuffix = approverRole ? `(${approverRole})` : '(Guru Mapel / Wali Kelas)';
      updated = {
        ...updated,
        teacherApproval: {
          approved: true,
          approvedBy: approverName.trim() || currentUserName,
          approvedAt: nowTime,
          roleTitle: approverRole,
          notes: notes.trim() || undefined,
        },
        currentApprovalStep: isKeluarKelas ? 'DONE' : 'WAKASEK', // Keluar Kelas: Selesai (2 tahap), Keluar Sekolah: Maju ke Tahap 3 (Wakasek)
        status: isKeluarKelas ? 'Disetujui' : 'Menunggu',
        approvedBy: isKeluarKelas ? `${approverName.trim() || currentUserName} ${roleSuffix}` : updated.approvedBy,
        approvedAt: isKeluarKelas ? nowTime : updated.approvedAt,
        updatedAt: new Date().toISOString(),
      };
    } else if (stage === 'WAKASEK') {
      // Tahap 3 Selesai -> Seluruh 3 tahap lengkap, Izin Resmi Disetujui
      const roleSuffix = approverRole ? `(${approverRole})` : '(Wakil Kepala Sekolah)';
      updated = {
        ...updated,
        wakasekApproval: {
          approved: true,
          approvedBy: approverName.trim() || currentUserName,
          approvedAt: nowTime,
          roleTitle: approverRole,
          notes: notes.trim() || undefined,
        },
        currentApprovalStep: 'DONE',
        status: 'Disetujui',
        approvedBy: `${approverName.trim() || currentUserName} ${roleSuffix}`,
        approvedAt: nowTime,
        updatedAt: new Date().toISOString(),
      };
    }

    onUpdatePermit(updated);
    setIsCustomRole(false);
    setApprovingStage(null);
  };

  const handleOpenRejectModal = (permit: StudentPermitRecord) => {
    setRejectingPermit(permit);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPermit) return;

    const currentStep = getApprovalStep(rejectingPermit);
    const updated: StudentPermitRecord = {
      ...rejectingPermit,
      status: 'Ditolak',
      rejectedAtStep: currentStep,
      rejectedBy: currentUserName,
      approvedBy: currentUserName,
      approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      rejectionReason: rejectionReasonInput.trim() || `Permohonan izin tidak disetujui pada ${
        rejectingPermit.type === 'Dispensasi Seragam' ? 'Pemeriksaan Admin Disiplin Positif' :
        currentStep === 'ADMIN' ? 'Tahap 1 (Admin Disiplin Positif)' : 
        currentStep === 'GURU_MAPEL' ? 'Tahap 2 (Guru Mapel / Wali Kelas)' : 
        currentStep === 'WAKASEK' ? 'Tahap 3 (Wakasek)' : 'Pemeriksaan Admin Disiplin Positif'
      }`,
      updatedAt: new Date().toISOString(),
    };
    onUpdatePermit(updated);
    setRejectingPermit(null);
    setRejectionReasonInput('');
  };

  const handleMarkReturned = (permit: StudentPermitRecord) => {
    if (!canVerifyReturn) {
      alert('Hanya Admin dan Petugas Keamanan (Satpam) yang berwenang memverifikasi siswa kembali ke sekolah.');
      return;
    }
    const updated: StudentPermitRecord = {
      ...permit,
      status: 'Kembali',
      actualReturnTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toISOString(),
    };
    onUpdatePermit(updated);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No', 
      'Jenis Izin', 
      'Tanggal', 
      'Waktu Pengajuan', 
      'Nama Siswa', 
      'Kelas', 
      'NISN', 
      'Mata Pelajaran', 
      'Jam Pelajaran Ke-', 
      'Keperluan / Alasan', 
      'Status Kembali / Atribut Seragam', 
      'Status Persetujuan', 
      'Tahap Persetujuan',
      'Persetujuan Admin Disiplin Positif (Tahap 1)',
      'Persetujuan Guru Mapel / Wali Kelas (Tahap 2)',
      'Persetujuan Wakasek (Tahap 3)',
      'Diverifikasi Oleh',
      'Waktu Disetujui',
      'Catatan / Alasan Penolakan'
    ];
    
    const rows = filteredPermits.map((p, idx) => {
      const step = getApprovalStep(p);
      const stageText = p.type === 'Keluar Sekolah'
        ? p.status === 'Disetujui' || p.status === 'Kembali'
          ? 'Lengkap (3 Tahap Selesai)'
          : step === 'ADMIN'
          ? 'Tahap 1/3 (Menunggu Admin Disiplin Positif)'
          : step === 'GURU_MAPEL'
          ? 'Tahap 2/3 (Menunggu Guru Mapel / Wali Kelas)'
          : 'Tahap 3/3 (Menunggu Wakasek)'
        : p.type === 'Keluar Kelas'
        ? p.status === 'Disetujui' || p.status === 'Kembali'
          ? 'Lengkap (2 Tahap Selesai)'
          : step === 'ADMIN'
          ? 'Tahap 1/2 (Menunggu Admin Disiplin Positif)'
          : 'Tahap 2/2 (Menunggu Guru Mapel / Wali Kelas)'
        : p.status;

      return [
        idx + 1,
        `"${p.type}"`,
        `"${p.date}"`,
        `"${p.timeSubmitted}"`,
        `"${p.studentName.replace(/"/g, '""')}"`,
        `"${p.className}"`,
        `"${p.nisn || '-'}"`,
        `"${p.subject || '-'}"`,
        `"${p.lessonHour || '-'}"`,
        `"${p.reason.replace(/"/g, '""')}"`,
        `"${p.type === 'Keluar Sekolah' ? (p.willReturn || '-') : p.type === 'Dispensasi Seragam' ? (p.uniformViolationType || '-') : '-'}"`,
        `"${p.status}"`,
        `"${stageText}"`,
        `"${p.adminApproval?.approved ? `Disetujui oleh ${p.adminApproval.approvedBy} (${p.adminApproval.approvedAt})` : '-'}"`,
        `"${p.teacherApproval?.approved ? `Disetujui oleh ${p.teacherApproval.approvedBy} (${p.teacherApproval.approvedAt})` : '-'}"`,
        `"${p.wakasekApproval?.approved ? `Disetujui oleh ${p.wakasekApproval.approvedBy} (${p.wakasekApproval.approvedAt})` : '-'}"`,
        `"${p.approvedBy || '-'}"`,
        `"${p.approvedAt || '-'}"`,
        `"${p.rejectionReason ? p.rejectionReason.replace(/"/g, '""') : '-'}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Izin_Siswa_SMAN1Batu_${mainTab}_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate URL for QR code (points to public portal)
  const [customPortalUrl, setCustomPortalUrl] = useState<string>(() => {
    return localStorage.getItem('app_sman1batu_portal_qr_url') || '';
  });

  const publicPortalUrl = useMemo(() => {
    if (customPortalUrl.trim()) return customPortalUrl.trim();
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // If hosted online on live domain (Vercel, school domain, etc.)
      if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        const cleanPath = window.location.pathname.endsWith('/') 
          ? window.location.pathname 
          : `${window.location.pathname}/`;
        return `${origin}${cleanPath}?view=izin-siswa`;
      }
    }
    // Default online URL so mobile phones scanning from localhost can immediately open the live web app
    return 'https://dispos-smaba.vercel.app/?view=izin-siswa';
  }, [customPortalUrl]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(publicPortalUrl)}&margin=10&format=png&ecc=M`;

  // Opsi Dropdown Jabatan / Wewenang ringkas & kontekstual sesuai akun yang sedang login
  const roleOptions = useMemo(() => {
    if (!approvingStage) return [];
    const list: string[] = [];

    // 1. Jika pengguna login adalah Wali Kelas, tambahkan HANYA kelas binaannya sendiri (misal: "Wali Kelas XI-5")
    if (isActualWaliKelas) {
      if (userWaliClass) {
        list.push(`Wali Kelas ${userWaliClass}`);
      } else {
        list.push('Wali Kelas');
      }
    }

    // 2. Jika pengguna login adalah Waka (Wakil Kepala Sekolah)
    if (isWakasek) {
      const wakaTitle = currentUser?.department || 'Wakil Kepala Sekolah';
      if (!list.includes(wakaTitle)) {
        list.unshift(wakaTitle); // Waka selalu posisi pertama untuk akun waka
      }
    }

    // 3. Jika pengguna login adalah Tim Disiplin Positif (Admin, Piket, BK)
    if (isAdminDisiplin) {
      const disiplinTitle = currentUser?.department || 'Admin Disiplin Positif';
      if (!list.includes(disiplinTitle)) {
        list.unshift(disiplinTitle);
      }
    }

    // 4. Guru Mata Pelajaran (Semua Guru, Wali Kelas, dan Waka bisa bertindak sebagai Guru Mata Pelajaran)
    if (!list.includes('Guru Mata Pelajaran')) {
      list.push('Guru Mata Pelajaran');
    }

    // Pastikan nilai approverRole saat ini (jika ada) ada di daftar agar selalu terpilih
    if (approvingStage.approverRole && !list.includes(approvingStage.approverRole)) {
      list.unshift(approvingStage.approverRole);
    }

    return list;
  }, [approvingStage, currentUser, isWakasek, isAdminDisiplin, isActualWaliKelas, userWaliClass]);

  const handleRoleChange = (selectedValue: string) => {
    if (!approvingStage) return;

    if (selectedValue === '__CUSTOM__') {
      setIsCustomRole(true);
      return;
    }

    setIsCustomRole(false);

    // Otomatis sesuaikan template catatan disposisi jika belum diedit secara spesifik oleh pengguna
    let updatedNotes = approvingStage.notes;
    const isStandardNote = (noteText: string, p: StudentPermitRecord) => {
      const t = noteText.trim();
      if (!t) return true;
      if (t === 'Permohonan izin keluar telah diverifikasi oleh Tim Disiplin Positif.') return true;
      if (t === 'Disetujui izin keluar sekolah dan tercatat di buku kendali.') return true;
      if (t === 'Materi KBM mata pelajaran saat ini telah dikoordinasikan.') return true;
      if (t.startsWith('Permohonan izin keluar telah dikoordinasikan dan disetujui oleh Wali Kelas')) return true;
      return false;
    };

    if (isStandardNote(approvingStage.notes, approvingStage.permit)) {
      const s = selectedValue.toLowerCase();
      if (s.startsWith('wali kelas')) {
        const waliLabel = userWaliClass ? `Wali Kelas ${userWaliClass}` : selectedValue;
        updatedNotes = `Permohonan izin keluar telah dikoordinasikan dan disetujui oleh ${waliLabel}.`.trim();
      } else if (s.startsWith('guru')) {
        updatedNotes = 'Materi KBM mata pelajaran saat ini telah dikoordinasikan.';
      } else if (s.includes('wakil kepala') || s.includes('waka')) {
        updatedNotes = 'Disetujui izin keluar sekolah dan tercatat di buku kendali.';
      } else if (s.includes('admin') || s.includes('disiplin') || s.includes('piket') || s.includes('bk')) {
        updatedNotes = 'Permohonan izin keluar telah diverifikasi oleh Tim Disiplin Positif.';
      }
    }

    setApprovingStage({
      ...approvingStage,
      approverRole: selectedValue,
      notes: updatedNotes,
    });
  };

  return (
    <div className="space-y-6 pb-12 font-roboto text-[#0F172A]">
      {/* Header Banner */}
      <div className="bg-white/85 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] shadow-sm border border-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-sky-700 uppercase tracking-wider mb-1">
            <span>Disiplin Positif &amp; Kesiswaan</span>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[#0F172A]">Layanan Izin Siswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <DoorOpen className="w-6 h-6" />
            </div>
            <span>Surat Izin Keluar &amp; Dispensasi Siswa</span>
          </h1>
        </div>

        {/* Action Buttons: Standee QR & Open Public Portal */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="btn-print-qr-standee"
            onClick={() => setIsQrStandeeOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
            title="Cetak Poster / Standee QR Code Layanan Izin (Disiplin Positif)"
          >
            <QrCode className="w-4 h-4" />
            <span>Cetak QR Standee Disiplin Positif</span>
          </button>

          <button
            type="button"
            id="btn-open-public-portal"
            onClick={onOpenPublicPortal}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 font-black text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="Buka form input izin siswa publik"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Form Siswa (QR)</span>
          </button>
        </div>
      </div>

      {/* ALERT NOTIFIKASI JIKA ADA PERMOHONAN MENUNGGU PERSETUJUAN */}
      {pendingPermits.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white p-5 rounded-[28px] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white text-rose-700 text-[10px] font-black uppercase tracking-wider">
                  Pemberitahuan Persetujuan
                </span>
                <span className="text-xs font-bold text-amber-100">Menunggu Tindakan Admin Disiplin Positif</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Ada {pendingPermits.length} Siswa yang Mengajukan Permohonan Izin Baru
              </h3>
              <p className="text-xs text-rose-100/90 font-medium">
                Silakan periksa dan berikan keputusan (Setujui / Tolak). <b>Hanya permohonan yang disetujui yang akan dimasukkan ke Buku Rekapitulasi Izin Sekolah.</b>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMainTab('PENDING')}
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-rose-700 font-black text-xs transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer shrink-0 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Lihat Daftar Menunggu ({pendingPermits.length})</span>
          </button>
        </div>
      )}

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-[32px] bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/60 p-5 shadow-xs border border-[#7DD3FC]/70 hover:-translate-y-1.5 transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#0369A1] uppercase tracking-wider">Izin Keluar Sekolah</div>
            <div className="text-lg sm:text-xl font-black text-[#0369A1] mt-0.5">{todayExitSchool} Siswa</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/60 p-5 shadow-xs border border-[#86EFAC]/70 hover:-translate-y-1.5 transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#047857] uppercase tracking-wider">Izin Keluar Kelas</div>
            <div className="text-lg sm:text-xl font-black text-[#047857] mt-0.5">{todayExitClass} Siswa</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/60 p-5 shadow-xs border border-[#FCD34D]/70 hover:-translate-y-1.5 transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#B45309] uppercase tracking-wider">Dispensasi Seragam</div>
            <div className="text-lg sm:text-xl font-black text-[#B45309] mt-0.5">{todayUniform} Siswa</div>
          </div>
        </div>

        <div 
          onClick={() => setMainTab('PENDING')}
          className={`rounded-[32px] p-5 shadow-xs border transition-all flex items-center gap-4 group cursor-pointer ${
            pendingPermits.length > 0 
              ? 'bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/60 border-[#FDA4AF] ring-2 ring-rose-400/40 hover:-translate-y-1.5' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0 ${
            pendingPermits.length > 0 ? 'bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            <Clock className={`w-6 h-6 ${pendingPermits.length > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#BE123C] uppercase tracking-wider">Menunggu Keputusan</div>
            <div className="text-lg sm:text-xl font-black text-[#BE123C] mt-0.5">
              {pendingPermits.length} Permohonan
            </div>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION TABS (Pending vs Approved Recap vs Rejected vs All) */}
      <div className="rounded-[32px] bg-white/90 p-4 sm:p-5 backdrop-blur-xl shadow-sm border border-white/60 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[#E2F1FD] rounded-2xl text-xs font-black overflow-x-auto no-scrollbar max-w-full">
            {/* Tab 1: Menunggu Persetujuan */}
            <button
              type="button"
              id="tab-pending-permits"
              onClick={() => setMainTab('PENDING')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                mainTab === 'PENDING'
                  ? 'bg-rose-600 text-white shadow-xs -translate-y-0.5'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Menunggu Persetujuan</span>
              {pendingPermits.length > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  mainTab === 'PENDING' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                }`}>
                  {pendingPermits.length}
                </span>
              )}
            </button>

            {/* Tab 2: Buku Rekap Izin Resmi (Disetujui) */}
            <button
              type="button"
              id="tab-approved-recap"
              onClick={() => setMainTab('APPROVED_RECAP')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                mainTab === 'APPROVED_RECAP'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs -translate-y-0.5'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Buku Rekap Izin Resmi</span>
              <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                mainTab === 'APPROVED_RECAP' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {approvedPermits.length}
              </span>
            </button>

            {/* Tab 3: Riwayat Ditolak */}
            <button
              type="button"
              id="tab-rejected-permits"
              onClick={() => setMainTab('REJECTED')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                mainTab === 'REJECTED'
                  ? 'bg-slate-800 text-white shadow-xs -translate-y-0.5'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Ditolak ({rejectedPermits.length})</span>
            </button>

            {/* Tab 4: Semua Riwayat */}
            <button
              type="button"
              id="tab-all-permits"
              onClick={() => setMainTab('ALL_HISTORY')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                mainTab === 'ALL_HISTORY'
                  ? 'bg-sky-600 text-white shadow-xs -translate-y-0.5'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Semua ({permits.length})</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            id="btn-export-permits-csv"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-[#E2F1FD] hover:bg-white text-sky-800 font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Ekspor daftar ini ke file CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV ({filteredPermits.length})</span>
          </button>
        </div>

        {/* Sub-Filters: Type, Stage, Class, Date & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 text-xs pt-1">
          {/* Filter Kategori Izin */}
          <div className="bg-[#E2F1FD] px-3.5 py-2 rounded-2xl border border-white/40 flex items-center gap-2">
            <span className="font-bold text-[#334155] shrink-0">Kategori:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
              className="bg-transparent font-extrabold text-[#0F172A] focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">Semua Jenis Izin</option>
              <option value="Keluar Sekolah">Izin Keluar Sekolah</option>
              <option value="Keluar Kelas">Izin Keluar Kelas</option>
              <option value="Dispensasi Seragam">Dispensasi Seragam</option>
            </select>
          </div>

          {/* Filter Tahap Persetujuan (Keluar Sekolah & Keluar Kelas) */}
          <div className="bg-[#E2F1FD] px-3.5 py-2 rounded-2xl border border-white/40 flex items-center gap-2">
            <span className="font-bold text-[#334155] shrink-0">Tahap:</span>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value as any)}
              className="bg-transparent font-extrabold text-[#0F172A] focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">Semua Tahap</option>
              <option value="ADMIN">Tahap 1: Menunggu Admin Disiplin Positif</option>
              <option value="GURU_MAPEL">Tahap 2: Menunggu Guru Mapel / Wali Kelas</option>
              <option value="WAKASEK">Tahap 3: Menunggu Wakasek (Khusus KS)</option>
              <option value="DONE">✓ Selesai / Disetujui</option>
            </select>
          </div>

          {/* Filter Kelas */}
          <div className="bg-[#E2F1FD] px-3.5 py-2 rounded-2xl border border-white/40 flex items-center gap-2">
            <span className="font-bold text-[#334155] shrink-0">Kelas:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent font-extrabold text-[#0F172A] focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">Semua Kelas (36 Rombel)</option>
              {sortClasses(classes).map((cls) => (
                <option key={cls.id || cls.name} value={cls.name}>
                  Kelas {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal */}
          <div className="flex items-center gap-2 bg-[#E2F1FD] px-3.5 py-2 rounded-2xl border border-white/40">
            <input
              type="checkbox"
              id="chk-use-date"
              checked={useDateFilter}
              onChange={(e) => setUseDateFilter(e.target.checked)}
              className="rounded text-sky-600 cursor-pointer"
            />
            <label htmlFor="chk-use-date" className="font-bold text-[#334155] shrink-0 cursor-pointer">
              Tgl:
            </label>
            <input
              type="date"
              disabled={!useDateFilter}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-[#0F172A] focus:outline-hidden cursor-pointer w-full disabled:opacity-40"
            />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Cari nama, NISN, mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#E2F1FD] rounded-2xl text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Table of Permits */}
      <div className="rounded-[32px] bg-white/90 backdrop-blur-xl shadow-sm border border-white/60 overflow-hidden">
        {/* Table Title Banner */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${
              mainTab === 'PENDING' ? 'bg-rose-500 animate-ping' :
              mainTab === 'APPROVED_RECAP' ? 'bg-emerald-500' :
              mainTab === 'REJECTED' ? 'bg-slate-700' : 'bg-sky-500'
            }`} />
            <h2 className="text-sm font-black text-[#0F172A]">
              {mainTab === 'PENDING' && 'Daftar Permohonan Izin Siswa Menunggu Keputusan'}
              {mainTab === 'APPROVED_RECAP' && 'Buku Rekapitulasi Izin Siswa Resmi (Disetujui)'}
              {mainTab === 'REJECTED' && 'Daftar Permohonan Izin Siswa yang Ditolak'}
              {mainTab === 'ALL_HISTORY' && 'Seluruh Riwayat Pengajuan Izin Siswa'}
            </h2>
          </div>

          <span className="text-xs font-bold text-[#64748B]">
            Menampilkan {filteredPermits.length} baris data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/90 to-sky-50/60 text-[#334155] font-black text-xs uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-4 px-3 w-12 text-center">No</th>
                <th className="py-4 px-4 w-28">Waktu &amp; Tgl</th>
                <th className="py-4 px-4 w-36 text-center">Kategori Izin</th>
                <th className="py-4 px-5 min-w-[200px]">Nama Siswa &amp; Kelas</th>
                <th className="py-4 px-5 min-w-[240px]">Rincian &amp; Alasan Izin</th>
                <th className="py-4 px-4 text-center w-32">Status Izin</th>
                <th className="py-4 px-4 text-center min-w-[150px]">Keputusan &amp; Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-[#0F172A]">
                        {mainTab === 'PENDING' 
                          ? 'Tidak ada permohonan izin yang menunggu persetujuan.' 
                          : 'Tidak ada data izin yang sesuai dengan filter.'}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {mainTab === 'PENDING' 
                          ? 'Semua permohonan siswa telah diproses oleh Admin Disiplin Positif.' 
                          : 'Silakan ubah filter kategori, kelas, atau tanggal di atas.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPermits.map((p, idx) => {
                  return (
                    <tr key={p.id} className="hover:bg-sky-50/40 transition-colors">
                      {/* No */}
                      <td className="py-4 px-3 text-center font-bold text-[#64748B]">
                        {idx + 1}
                      </td>

                      {/* Waktu / Tanggal */}
                      <td className="py-4 px-4">
                        <div className="font-black text-[#0F172A]">{p.timeSubmitted} WIB</div>
                        <div className="text-[11px] text-[#64748B]">{p.date}</div>
                      </td>

                      {/* Kategori Izin */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black shadow-2xs ${
                          p.type === 'Keluar Sekolah'
                            ? 'bg-sky-100 text-sky-900 border border-sky-300'
                            : p.type === 'Keluar Kelas'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {p.type === 'Keluar Sekolah' && <DoorOpen className="w-3.5 h-3.5" />}
                          {p.type === 'Keluar Kelas' && <School className="w-3.5 h-3.5" />}
                          {p.type === 'Dispensasi Seragam' && <Shirt className="w-3.5 h-3.5" />}
                          <span>{p.type}</span>
                        </span>
                      </td>

                      {/* Nama Siswa & Kelas */}
                      <td className="py-4 px-5">
                        <div className="font-black text-[#0F172A] text-sm">{p.studentName}</div>
                        <div className="mt-1">
                          <span className="inline-flex items-center justify-center font-bold text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 whitespace-nowrap leading-tight text-xs">
                            {p.className}
                          </span>
                        </div>
                      </td>

                      {/* Rincian & Alasan */}
                      <td className="py-4 px-5">
                        {p.type === 'Dispensasi Seragam' ? (
                          <div className="space-y-1">
                            <div className="font-black text-amber-900">{p.uniformViolationType}</div>
                            <div className="text-[11px] text-[#334155] italic">"{p.reason}"</div>
                            {p.startDate && p.estimatedEndDate && (
                              <div className="text-[10px] text-slate-500 font-bold">
                                Berlaku: {p.startDate} s/d {p.estimatedEndDate}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-bold text-[#0F172A]">
                              Mapel: <span className="font-semibold text-slate-700">{p.subject || '-'}</span> ({p.lessonHour || '-'})
                            </div>
                            <div className="text-[11px] text-[#334155] italic">"{p.reason}"</div>
                            {p.type === 'Keluar Sekolah' && (
                              <div className={`text-[10px] font-black ${p.willReturn === 'Kembali' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                Status: {p.willReturn === 'Kembali' ? 'Akan Kembali ke Sekolah' : 'Tidak Kembali (Izin Pulang)'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Catatan jika ditolak */}
                        {p.status === 'Ditolak' && p.rejectionReason && (
                          <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 font-medium">
                            <b>Alasan Ditolak:</b> {p.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Status Izin & Tahap Persetujuan */}
                      <td className="py-4 px-4 text-center">
                        {p.type === 'Keluar Sekolah' ? (
                          <div className="space-y-1.5 flex flex-col items-center">
                            {p.status === 'Menunggu' && (() => {
                              const step = getApprovalStep(p);
                              return (
                                <div className="space-y-1.5 flex flex-col items-center w-full">
                                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs ${
                                    step === 'ADMIN'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                      : step === 'GURU_MAPEL'
                                      ? 'bg-violet-100 text-violet-900 border border-violet-300 animate-pulse'
                                      : 'bg-indigo-100 text-indigo-900 border border-indigo-300 animate-pulse'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {step === 'ADMIN' && 'Tahap 1/3: Menunggu Admin Disiplin Positif'}
                                      {step === 'GURU_MAPEL' && 'Tahap 2/3: Menunggu Guru Mapel / Wali Kelas'}
                                      {step === 'WAKASEK' && 'Tahap 3/3: Menunggu Wakasek'}
                                    </span>
                                  </span>

                                  {/* Stepper visual 3 tahap */}
                                  <div className="flex items-center justify-center gap-1 text-[9px] font-black text-slate-500 w-full pt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                      p.adminApproval?.approved 
                                        ? 'bg-emerald-100 text-emerald-800 font-black' 
                                        : step === 'ADMIN' 
                                        ? 'bg-amber-200 text-amber-900 ring-1 ring-amber-400 font-black' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {p.adminApproval?.approved ? '✓ Admin Disiplin' : '1. Admin Disiplin'}
                                    </span>
                                    <span>›</span>
                                    <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                      p.teacherApproval?.approved 
                                        ? 'bg-emerald-100 text-emerald-800 font-black' 
                                        : step === 'GURU_MAPEL' 
                                        ? 'bg-violet-200 text-violet-900 ring-1 ring-violet-400 font-black' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {p.teacherApproval?.approved ? '✓ Guru/Wali' : '2. Guru/Wali'}
                                    </span>
                                    <span>›</span>
                                    <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                      p.wakasekApproval?.approved 
                                        ? 'bg-emerald-100 text-emerald-800 font-black' 
                                        : step === 'WAKASEK' 
                                        ? 'bg-indigo-200 text-indigo-900 ring-1 ring-indigo-400 font-black' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {p.wakasekApproval?.approved ? '✓ Wakasek' : '3. Wakasek'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}

                            {p.status === 'Disetujui' && (
                              <div className="space-y-0.5 text-center">
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Disetujui Penuh (3 Tahap)</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  Admin Disiplin Positif • Guru Mapel / Wali Kelas • Wakasek
                                </div>
                              </div>
                            )}

                            {p.status === 'Kembali' && (
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                                <span>Sudah Kembali</span>
                              </span>
                            )}

                            {p.status === 'Ditolak' && (
                              <div className="space-y-0.5">
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
                                  <X className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Ditolak</span>
                                </span>
                                {p.rejectedAtStep && (
                                  <div className="text-[10px] text-rose-600 font-bold">
                                    pada {p.rejectedAtStep === 'ADMIN' ? 'Tahap 1 Admin Disiplin Positif' : p.rejectedAtStep === 'GURU_MAPEL' ? 'Tahap 2 Guru Mapel / Wali Kelas' : 'Tahap 3 Wakasek'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : p.type === 'Keluar Kelas' ? (
                          <div className="space-y-1.5 flex flex-col items-center">
                            {p.status === 'Menunggu' && (() => {
                              const step = getApprovalStep(p);
                              return (
                                <div className="space-y-1.5 flex flex-col items-center w-full">
                                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs ${
                                    step === 'ADMIN'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                      : 'bg-violet-100 text-violet-900 border border-violet-300 animate-pulse'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {step === 'ADMIN' ? 'Tahap 1/2: Menunggu Admin Disiplin Positif' : 'Tahap 2/2: Menunggu Guru Mapel / Wali Kelas'}
                                    </span>
                                  </span>

                                  {/* Stepper visual 2 tahap */}
                                  <div className="flex items-center justify-center gap-1 text-[9px] font-black text-slate-500 w-full pt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                      p.adminApproval?.approved 
                                        ? 'bg-emerald-100 text-emerald-800 font-black' 
                                        : step === 'ADMIN' 
                                        ? 'bg-amber-200 text-amber-900 ring-1 ring-amber-400 font-black' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {p.adminApproval?.approved ? '✓ Admin Disiplin' : '1. Admin Disiplin'}
                                    </span>
                                    <span>›</span>
                                    <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                      p.teacherApproval?.approved 
                                        ? 'bg-emerald-100 text-emerald-800 font-black' 
                                        : step === 'GURU_MAPEL' 
                                        ? 'bg-violet-200 text-violet-900 ring-1 ring-violet-400 font-black' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {p.teacherApproval?.approved ? '✓ Guru/Wali' : '2. Guru/Wali'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}

                            {p.status === 'Disetujui' && (
                              <div className="space-y-0.5 text-center">
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Disetujui Penuh (2 Tahap)</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  Admin Disiplin Positif • Guru Mapel / Wali Kelas
                                </div>
                              </div>
                            )}

                            {p.status === 'Kembali' && (
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                                <span>Sudah Kembali</span>
                              </span>
                            )}

                            {p.status === 'Ditolak' && (
                              <div className="space-y-0.5">
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
                                  <X className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Ditolak</span>
                                </span>
                                {p.rejectedAtStep && (
                                  <div className="text-[10px] text-rose-600 font-bold">
                                    pada {p.rejectedAtStep === 'ADMIN' ? 'Tahap 1 Admin Disiplin Positif' : 'Tahap 2 Guru Mapel / Wali Kelas'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Dispensasi Seragam (Hanya Persetujuan Admin Disiplin Positif Saja)
                          <div>
                            {p.status === 'Menunggu' && (
                              <div className="space-y-0.5 text-center">
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Menunggu Admin Disiplin</span>
                                </span>
                                <div className="text-[9px] text-slate-500 font-medium">Khusus Otorisasi Admin Disiplin Positif</div>
                              </div>
                            )}
                            {p.status === 'Disetujui' && (
                              <div className="space-y-0.5 text-center">
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Disetujui Admin Disiplin</span>
                                </span>
                                {p.approvedBy && (
                                  <div className="text-[10px] text-slate-500 font-medium">oleh {p.approvedBy}</div>
                                )}
                              </div>
                            )}
                            {p.status === 'Kembali' && (
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                                <span>Sudah Kembali</span>
                              </span>
                            )}
                            {p.status === 'Ditolak' && (
                              <div className="space-y-0.5 text-center">
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
                                  <X className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Ditolak Admin Disiplin</span>
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Keputusan & Aksi Bertahap */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* JIKA STATUS MENUNGGU */}
                          {p.status === 'Menunggu' && (
                            <>
                              {(p.type === 'Keluar Sekolah' || p.type === 'Keluar Kelas') ? (() => {
                                const step = getApprovalStep(p);
                                const isKeluarKelas = p.type === 'Keluar Kelas';
                                return (
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {/* Tahap 1: Admin Disiplin Positif */}
                                    {step === 'ADMIN' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenApproveStage(p, 'ADMIN')}
                                        disabled={!canApproveStage1}
                                        className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] shadow-xs transition-all flex items-center gap-1 ${
                                          canApproveStage1
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                        }`}
                                        title={canApproveStage1 
                                          ? `Tahap 1: Setujui verifikasi awal oleh Admin Disiplin Positif (${isKeluarKelas ? 'Tahap 1/2' : 'Tahap 1/3'})` 
                                          : 'Tahap 1 hanya dapat disetujui oleh Admin Disiplin Positif'}
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>Setujui Tahap 1 (Admin Disiplin)</span>
                                      </button>
                                    )}

                                    {/* Tahap 2: Guru Mapel / Wali Kelas */}
                                    {step === 'GURU_MAPEL' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenApproveStage(p, 'GURU_MAPEL')}
                                        disabled={!canApproveStage2}
                                        className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] shadow-xs transition-all flex items-center gap-1 ${
                                          canApproveStage2
                                            ? 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer active:scale-95'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                        }`}
                                        title={canApproveStage2
                                          ? (isKeluarKelas 
                                              ? `Tahap 2/2 (Final): Setujui izin keluar kelas oleh Guru Mapel ${p.subject || ''} atau Wali Kelas ${p.className || ''}`
                                              : `Tahap 2/3: Setujui oleh Guru Mapel ${p.subject || ''} atau Wali Kelas ${p.className || ''}`)
                                          : 'Tahap 2 hanya dapat disetujui oleh Guru Mata Pelajaran atau Wali Kelas'}
                                      >
                                        <School className="w-3.5 h-3.5" />
                                        <span>{isKeluarKelas ? 'Setujui Tahap 2 (Guru/Wali - Final)' : 'Setujui Tahap 2 (Guru Mapel / Wali Kelas)'}</span>
                                      </button>
                                    )}

                                    {/* Tahap 3: Wakasek (Khusus Keluar Sekolah) */}
                                    {!isKeluarKelas && step === 'WAKASEK' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenApproveStage(p, 'WAKASEK')}
                                        disabled={!canApproveStage3}
                                        className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] shadow-xs transition-all flex items-center gap-1 ${
                                          canApproveStage3
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                        }`}
                                        title={canApproveStage3
                                          ? 'Tahap 3/3: Pengesahan final oleh Wakil Kepala Sekolah'
                                          : 'Tahap 3 hanya dapat disahkan oleh Wakil Kepala Sekolah'}
                                      >
                                        <Award className="w-3.5 h-3.5" />
                                        <span>Setujui Tahap 3 (Wakasek)</span>
                                      </button>
                                    )}

                                    {/* Tombol Tolak */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRejectModal(p)}
                                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                                      title="Tolak permohonan izin ini"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Tolak</span>
                                    </button>
                                  </div>
                                );
                              })() : (
                                // Dispensasi Seragam (Hanya Perlu Persetujuan Admin Disiplin Positif Saja)
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(p)}
                                    disabled={!canApproveStage1}
                                    className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition-all flex items-center gap-1 ${
                                      canApproveStage1
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                    }`}
                                    title={canApproveStage1 ? "Setujui izin seragam (khusus Admin Disiplin Positif)" : "Hanya Admin Disiplin Positif yang berwenang menyetujui dispensasi seragam"}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Setujui (Admin Disiplin)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(p)}
                                    disabled={!canApproveStage1}
                                    className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition-all flex items-center gap-1 ${
                                      canApproveStage1
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                    }`}
                                    title={canApproveStage1 ? "Tolak permohonan izin" : "Hanya Admin Disiplin Positif yang berwenang menolak dispensasi seragam"}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Tolak</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* JIKA SUDAH DISETUJUI & KELUAR SEKOLAH (KEMBALI): TOMBOL TANDAI KEMBALI (HANYA ADMIN & SATPAM) */}
                          {canVerifyReturn && p.status === 'Disetujui' && p.type === 'Keluar Sekolah' && p.willReturn === 'Kembali' && (
                            <button
                              type="button"
                              onClick={() => handleMarkReturned(p)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                              title="Tandai siswa telah kembali ke sekolah (khusus Admin & Satpam)"
                            >
                              <Check className="w-3 h-3" />
                              <span>Siswa Kembali</span>
                            </button>
                          )}

                          {/* TOMBOL LIHAT / CETAK E-PASS RESMI */}
                          <button
                            type="button"
                            onClick={() => setViewingPermit(p)}
                            className="p-1.5 bg-slate-100 hover:bg-sky-100 text-sky-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                            title="Lihat & Cetak e-Surat Izin"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* TOMBOL HAPUS DATA */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus permohonan surat izin atas nama ${p.studentName}?`)) {
                                onDeletePermit(p.id);
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                            title="Hapus data izin ini"
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

      {/* MODAL 1: TOLAK PERMOHONAN IZIN (DENGAN ALASAN) */}
      {rejectingPermit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl border border-white space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-black text-base">
                <XCircle className="w-5 h-5" />
                <span>Tolak Permohonan Izin Siswa</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingPermit(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1 text-xs">
              <div className="font-bold text-rose-900">
                Siswa: <span className="font-black">{rejectingPermit.studentName}</span> ({rejectingPermit.className})
              </div>
              <div className="text-slate-700">
                Jenis: <span className="font-bold">{rejectingPermit.type}</span>
              </div>
              <div className="text-slate-600 italic">
                Keperluan: "{rejectingPermit.reason}"
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Alasan / Catatan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Tuliskan alasan penolakan (misal: Sedang ada ulangan harian, Keperluan tidak mendesak, Belum ada izin guru mapel, dll)..."
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingPermit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Konfirmasi Tolak Izin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW & PRINT E-SURAT IZIN DIGITAL */}
      {viewingPermit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span className="font-black text-sm text-[#0F172A]">Detail E-Surat Izin Resmi Siswa</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPermit(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Pass Container */}
            <div id="printable-admin-permit" className="border-2 border-slate-800 rounded-2xl p-6 bg-white space-y-4 font-serif text-slate-900">
              {/* Kop Surat Mini */}
              <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900 font-sans">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain shrink-0" />
                <div className="text-center flex-1">
                  <h3 className="font-bold text-[10px] tracking-wider text-slate-800 uppercase leading-tight">
                    PEMERINTAH PROVINSI JAWA TIMUR • DINAS PENDIDIKAN
                  </h3>
                  <h2 className="font-black text-sm tracking-wide text-slate-950 uppercase leading-tight">
                    {schoolProfile.name}
                  </h2>
                  <p className="text-[9px] text-slate-600">
                    TIM DISIPLIN POSITIF &amp; GURU PIKET KESISWAAN
                  </p>
                </div>
                <div className="w-12 shrink-0 hidden sm:block" />
              </div>

              {/* Title & Badge */}
              <div className="text-center space-y-1 font-sans">
                <h3 className="text-base font-black uppercase tracking-wider underline">
                  SURAT KETERANGAN IZIN {viewingPermit.type.toUpperCase()}
                </h3>
              </div>

              {/* Data Siswa */}
              <div className="space-y-2 text-xs font-sans">
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Nama Lengkap Siswa</span>
                  <span className="col-span-2 font-black text-slate-900 uppercase">{viewingPermit.studentName}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Kelas</span>
                  <span className="col-span-2 font-bold text-slate-900">{viewingPermit.className}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Hari &amp; Tanggal</span>
                  <span className="col-span-2 font-bold text-slate-900">{formatDayAndDateIndonesian(viewingPermit.date)} ({viewingPermit.timeSubmitted} WIB)</span>
                </div>

                {viewingPermit.type !== 'Dispensasi Seragam' ? (
                  <>
                    <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Mata Pelajaran &amp; Jam</span>
                      <span className="col-span-2 font-bold text-slate-900">{viewingPermit.subject || '-'} (Jam ke- {viewingPermit.lessonHour || '-'})</span>
                    </div>
                    {viewingPermit.type === 'Keluar Sekolah' && (
                      <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                        <span className="text-slate-500 font-bold">Ketentuan Kembali</span>
                        <span className="col-span-2 font-black text-sky-800">
                          {viewingPermit.willReturn === 'Kembali' ? 'Akan Kembali ke Sekolah' : 'Tidak Kembali (Izin Pulang ke Rumah)'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Jenis Izin Atribut</span>
                      <span className="col-span-2 font-black text-amber-900">{viewingPermit.uniformViolationType}</span>
                    </div>
                    <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Masa Berlaku Dispensasi</span>
                      <span className="col-span-2 font-bold text-slate-900">
                        {viewingPermit.startDate} s/d {viewingPermit.estimatedEndDate}
                      </span>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-3 py-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold">Keperluan / Alasan</span>
                  <span className="col-span-2 font-medium text-slate-900 italic">"{viewingPermit.reason}"</span>
                </div>
              </div>

              {/* Khusus Izin Keluar Sekolah: Tampilkan 3 Tahap Pengesahan Resmi */}
              {viewingPermit.type === 'Keluar Sekolah' && (
                <div className="pt-2 border-t-2 border-slate-900 font-sans space-y-2.5">
                  <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider text-center">
                    LEMBAR PENGESAHAN 3 TAHAP (ADMIN DISIPLIN POSITIF • GURU MAPEL / WALI KELAS • WAKASEK)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Kotak 1: Admin */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      viewingPermit.adminApproval?.approved 
                        ? 'bg-emerald-50/70 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">1. Admin Disiplin Positif</div>
                      <div className={`text-[10px] font-bold ${viewingPermit.adminApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {viewingPermit.adminApproval?.approved ? '✓ Telah Diverifikasi' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-1 truncate">
                        {viewingPermit.adminApproval?.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {viewingPermit.adminApproval?.approvedAt ? `${viewingPermit.adminApproval.approvedAt} WIB` : '-'}
                      </div>
                      {viewingPermit.adminApproval?.notes && (
                        <div className="text-[9px] text-slate-600 italic border-t border-slate-200/60 pt-1">
                          "{viewingPermit.adminApproval.notes}"
                        </div>
                      )}
                    </div>

                    {/* Kotak 2: Guru Mata Pelajaran */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      viewingPermit.teacherApproval?.approved 
                        ? 'bg-violet-50/70 border-violet-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">2. Guru Mata Pelajaran</div>
                      <div className="text-[9px] text-slate-500 font-semibold truncate" title={viewingPermit.subject}>
                        {viewingPermit.subject || 'Mapel Saat Ini'}
                      </div>
                      <div className={`text-[10px] font-bold ${viewingPermit.teacherApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {viewingPermit.teacherApproval?.approved ? '✓ Telah Disetujui' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-1 truncate">
                        {viewingPermit.teacherApproval?.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {viewingPermit.teacherApproval?.approvedAt ? `${viewingPermit.teacherApproval.approvedAt} WIB` : '-'}
                      </div>
                      {viewingPermit.teacherApproval?.notes && (
                        <div className="text-[9px] text-slate-600 italic border-t border-slate-200/60 pt-1">
                          "{viewingPermit.teacherApproval.notes}"
                        </div>
                      )}
                    </div>

                    {/* Kotak 3: Wakil Kepala Sekolah */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      viewingPermit.wakasekApproval?.approved 
                        ? 'bg-indigo-50/70 border-indigo-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">3. Wakil Kepala Sekolah</div>
                      <div className="text-[9px] text-slate-500 font-semibold truncate" title={viewingPermit.wakasekApproval?.roleTitle}>
                        {viewingPermit.wakasekApproval?.roleTitle ? viewingPermit.wakasekApproval.roleTitle.replace('Wakil Kepala Sekolah ', '') : 'Semua Bidang Waka'}
                      </div>
                      <div className={`text-[10px] font-bold ${viewingPermit.wakasekApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {viewingPermit.wakasekApproval?.approved ? '✓ Telah Disahkan' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-1 truncate">
                        {viewingPermit.wakasekApproval?.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {viewingPermit.wakasekApproval?.approvedAt ? `${viewingPermit.wakasekApproval.approvedAt} WIB` : '-'}
                      </div>
                      {viewingPermit.wakasekApproval?.notes && (
                        <div className="text-[9px] text-slate-600 italic border-t border-slate-200/60 pt-1">
                          "{viewingPermit.wakasekApproval.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {viewingPermit.type === 'Keluar Kelas' && (
                <div className="pt-2 border-t-2 border-slate-900 font-sans space-y-2.5">
                  <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider text-center">
                    LEMBAR PENGESAHAN 2 TAHAP (ADMIN DISIPLIN POSITIF • GURU MAPEL / WALI KELAS)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Kotak 1: Admin */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      viewingPermit.adminApproval?.approved 
                        ? 'bg-emerald-50/70 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">1. Admin Disiplin Positif</div>
                      <div className={`text-[10px] font-bold ${viewingPermit.adminApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {viewingPermit.adminApproval?.approved ? '✓ Telah Diverifikasi' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-1 truncate">
                        {viewingPermit.adminApproval?.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {viewingPermit.adminApproval?.approvedAt ? `${viewingPermit.adminApproval.approvedAt} WIB` : '-'}
                      </div>
                      {viewingPermit.adminApproval?.notes && (
                        <div className="text-[9px] text-slate-600 italic border-t border-slate-200/60 pt-1">
                          "{viewingPermit.adminApproval.notes}"
                        </div>
                      )}
                    </div>

                    {/* Kotak 2: Guru Mata Pelajaran */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      viewingPermit.teacherApproval?.approved 
                        ? 'bg-violet-50/70 border-violet-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">2. Guru Mata Pelajaran (Pengesah)</div>
                      <div className="text-[9px] text-slate-500 font-semibold truncate" title={viewingPermit.subject}>
                        {viewingPermit.subject || 'Mapel Saat Ini'}
                      </div>
                      <div className={`text-[10px] font-bold ${viewingPermit.teacherApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {viewingPermit.teacherApproval?.approved ? '✓ Telah Disetujui (Selesai)' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-1 truncate">
                        {viewingPermit.teacherApproval?.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {viewingPermit.teacherApproval?.approvedAt ? `${viewingPermit.teacherApproval.approvedAt} WIB` : '-'}
                      </div>
                      {viewingPermit.teacherApproval?.notes && (
                        <div className="text-[9px] text-slate-600 italic border-t border-slate-200/60 pt-1">
                          "{viewingPermit.teacherApproval.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-sans">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Status Permohonan</div>
                  <div className="text-xs font-black text-slate-900">{viewingPermit.status}</div>
                </div>
                {viewingPermit.approvedBy && (
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Diverifikasi Oleh</div>
                    <div className="text-xs font-black text-emerald-800">{viewingPermit.approvedBy} ({viewingPermit.approvedAt} WIB)</div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setViewingPermit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {canVerifyReturn && viewingPermit.status === 'Disetujui' && viewingPermit.type === 'Keluar Sekolah' && viewingPermit.willReturn === 'Kembali' && (
                  <button
                    type="button"
                    onClick={() => {
                      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      handleMarkReturned(viewingPermit);
                      setViewingPermit({
                        ...viewingPermit,
                        status: 'Kembali',
                        actualReturnTime: nowTime,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                    title="Tandai siswa telah kembali ke sekolah (khusus Admin & Satpam)"
                  >
                    <Check className="w-4 h-4" />
                    <span>Siswa Kembali</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak E-Surat Izin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KONFIRMASI PERSETUJUAN BERTAHAP (TAHAP 1 / 2 / 3) */}
      {approvingStage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-white space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                  approvingStage.stage === 'ADMIN' ? 'bg-emerald-600' :
                  approvingStage.stage === 'GURU_MAPEL' ? 'bg-violet-600' : 'bg-indigo-600'
                }`}>
                  {approvingStage.stage === 'ADMIN' && <ShieldCheck className="w-5 h-5" />}
                  {approvingStage.stage === 'GURU_MAPEL' && <School className="w-5 h-5" />}
                  {approvingStage.stage === 'WAKASEK' && <Award className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">
                    {approvingStage.stage === 'ADMIN' && (approvingStage.permit.type === 'Keluar Kelas' ? 'Persetujuan Tahap 1/2: Admin Disiplin Positif' : 'Persetujuan Tahap 1/3: Admin Disiplin Positif')}
                    {approvingStage.stage === 'GURU_MAPEL' && (approvingStage.permit.type === 'Keluar Kelas' ? 'Persetujuan Tahap 2/2 (Final): Guru Mata Pelajaran / Wali Kelas' : 'Persetujuan Tahap 2/3: Guru Mata Pelajaran / Wali Kelas')}
                    {approvingStage.stage === 'WAKASEK' && 'Persetujuan Tahap 3/3: Wakil Kepala Sekolah'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {approvingStage.stage === 'ADMIN' && 'Verifikasi permohonan awal oleh Tim Disiplin Positif'}
                    {approvingStage.stage === 'GURU_MAPEL' && (approvingStage.permit.type === 'Keluar Kelas' ? `Persetujuan izin meninggalkan kelas oleh Guru Mapel ${approvingStage.permit.subject ? `(${approvingStage.permit.subject})` : ''} atau Wali Kelas ${approvingStage.permit.className || ''}` : `Persetujuan izin KBM oleh Guru Mapel ${approvingStage.permit.subject ? `(${approvingStage.permit.subject})` : ''} atau Wali Kelas ${approvingStage.permit.className || ''}`)}
                    {approvingStage.stage === 'WAKASEK' && 'Pengesahan izin keluar gerbang sekolah'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setApprovingStage(null);
                  setIsCustomRole(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Permohonan */}
            <div className="bg-[#E2F1FD]/60 border border-sky-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm uppercase">{approvingStage.permit.studentName}</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold">{approvingStage.permit.className}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-sky-200/50">
                <div>
                  <span className="font-bold text-slate-700">Mata Pelajaran:</span> {approvingStage.permit.subject || '-'}
                </div>
                <div>
                  <span className="font-bold text-slate-700">Jam Ke-:</span> {approvingStage.permit.lessonHour || '-'}
                </div>
              </div>
              <div className="text-[11px] text-slate-700 italic pt-1 border-t border-sky-200/50">
                <b>Keperluan:</b> "{approvingStage.permit.reason}"
              </div>
            </div>

            {/* Riwayat Tahap Sebelumnya */}
            {approvingStage.stage !== 'ADMIN' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Riwayat Persetujuan Sebelumnya:
                </div>
                {approvingStage.permit.adminApproval?.approved && (
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tahap 1 Admin Disiplin Positif disetujui oleh: <b>{approvingStage.permit.adminApproval.approvedBy}</b> ({approvingStage.permit.adminApproval.approvedAt} WIB)</span>
                  </div>
                )}
                {approvingStage.stage === 'WAKASEK' && approvingStage.permit.teacherApproval?.approved && (
                  <div className="flex items-center gap-2 text-violet-800 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span>Tahap 2 Guru Mapel / Wali Kelas disetujui oleh: <b>{approvingStage.permit.teacherApproval.approvedBy}</b> ({approvingStage.permit.teacherApproval.approvedAt} WIB)</span>
                  </div>
                )}
              </div>
            )}

            {/* Form Input Penyetuju */}
            <form onSubmit={handleConfirmApproveStage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1">
                  Nama Penyetuju <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={approvingStage.approverName}
                  onChange={(e) => setApprovingStage({ ...approvingStage, approverName: e.target.value })}
                  placeholder="Nama penyetuju..."
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#0F172A]">
                    Jabatan / Wewenang <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    Pilih Peran Saat Mengizinkan
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={isCustomRole ? '__CUSTOM__' : approvingStage.approverRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none pr-9 text-xs"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="__CUSTOM__">✏️ Lainnya (Ketik Manual)...</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {isCustomRole && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={approvingStage.approverRole}
                      onChange={(e) => setApprovingStage({ ...approvingStage, approverRole: e.target.value })}
                      placeholder="Ketik jabatan atau wewenang manual..."
                      className="w-full px-3.5 py-2.5 bg-white border border-sky-300 rounded-xl font-bold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-xs shadow-xs"
                    />
                    <p className="text-[10px] text-sky-600 mt-1 font-medium">
                      Silakan ketik jabatan/peran khusus yang sesuai untuk pengesahan ini.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">
                  Catatan / Disposisi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={approvingStage.notes}
                  onChange={(e) => setApprovingStage({ ...approvingStage, notes: e.target.value })}
                  placeholder="Misal: Tugas KBM telah diberikan, Koordinasi dengan Wali Kelas..."
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setApprovingStage(null);
                    setIsCustomRole(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-sm cursor-pointer flex items-center gap-1.5 transition-all ${
                    approvingStage.stage === 'ADMIN' ? 'bg-emerald-600 hover:bg-emerald-500' :
                    approvingStage.stage === 'GURU_MAPEL' ? 'bg-violet-600 hover:bg-violet-500' : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {approvingStage.stage === 'ADMIN' && 'Sahkan Tahap 1 (Lanjut ke Guru Mapel / Wali Kelas)'}
                    {approvingStage.stage === 'GURU_MAPEL' && (approvingStage.permit.type === 'Keluar Kelas' ? 'Sahkan Tahap 2 (Final - Terbitkan Izin)' : 'Sahkan Tahap 2 (Lanjut ke Wakasek)')}
                    {approvingStage.stage === 'WAKASEK' && 'Sahkan Tahap 3 (Terbitkan Izin Resmi)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CETAK STANDEE QR CODE UNTUK TIM DISIPLIN POSITIF */}
      {isQrStandeeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span className="font-black text-sm text-[#0F172A]">Poster Standee QR Code Layanan Izin</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQrStandeeOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standee Poster Preview */}
            <div id="printable-qr-standee" className="border-4 border-indigo-600 rounded-3xl p-6 bg-gradient-to-br from-indigo-50 via-white to-sky-50 text-center space-y-4 shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                <div className="text-left">
                  <h3 className="font-black text-sm text-slate-900 uppercase leading-tight">{schoolProfile.name}</h3>
                  <p className="text-[10px] font-bold text-indigo-700">POSKO LAYANAN IZIN SISWA MANDIRI</p>
                </div>
              </div>

              <div className="py-2 px-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  SCAN QR CODE UNTUK IZIN
                </h2>
                <p className="text-[10px] text-indigo-100">
                  Keluar Kelas • Keluar Sekolah • Dispensasi Seragam
                </p>
              </div>

              {/* QR Image */}
              <div className="w-52 h-52 mx-auto bg-white p-2.5 rounded-2xl shadow-md border-2 border-indigo-200 flex items-center justify-center">
                <img src={qrImageUrl} alt="QR Code Izin Siswa" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-1 text-xs text-slate-700">
                <p className="font-black text-slate-900">Petunjuk Pengisian Siswa:</p>
                <ol className="text-[11px] text-slate-600 list-decimal list-inside space-y-0.5 text-left max-w-xs mx-auto">
                  <li>Arahkan kamera HP / Google Lens ke QR Code</li>
                  <li>Ketuk tombol <strong className="text-indigo-700">"Buka di Browser"</strong> yang muncul</li>
                  <li>Pilih jenis izin &amp; kirim formulir tanpa login</li>
                  <li>Tunggu verifikasi Admin Disiplin Positif</li>
                </ol>
              </div>
            </div>

            {/* URL Configuration / Link Info (Non-printed setting) */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                  Tautan Web Tujuan QR Code:
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Auto-Open HTTPS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPortalUrl || publicPortalUrl}
                  onChange={(e) => {
                    setCustomPortalUrl(e.target.value);
                    localStorage.setItem('app_sman1batu_portal_qr_url', e.target.value.trim());
                  }}
                  placeholder="https://dispos-smaba.vercel.app/?view=izin-siswa"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicPortalUrl);
                    alert('Tautan portal siswa berhasil disalin ke clipboard!');
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Salin Tautan"
                >
                  Salin
                </button>
                <a
                  href={publicPortalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  title="Buka Langsung"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka</span>
                </a>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                *Tautan QR code telah dikonfigurasi dengan protokol web standar sehingga kamera HP (Android/iPhone) langsung mendeteksinya sebagai tautan web otomatis.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsQrStandeeOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Poster Standee</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
