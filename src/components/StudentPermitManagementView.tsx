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
  Sparkles,
  ArrowRight,
  Layers,
  FileText,
  Bell,
  Check,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { Student, SchoolProfile, StudentPermitRecord, StudentPermitType, StudentPermitStatus, AdminUser, RoleMatrixMap } from '../types';
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
  roleMatrix?: RoleMatrixMap;
}

type ManagementMainTab = 'PENDING' | 'APPROVED_RECAP' | 'REJECTED' | 'ALL_HISTORY';

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
  roleMatrix = initialRoleMatrix,
}) => {
  const canApprove = checkActionPermission(currentUser?.role, 'permit_approve', roleMatrix);
  const canCreateManual = checkActionPermission(currentUser?.role, 'permit_create_manual', roleMatrix);
  const canDelete = checkActionPermission(currentUser?.role, 'permit_delete', roleMatrix);
  // Main view tab (Pending vs Approved Recap vs Rejected vs All)
  const [mainTab, setMainTab] = useState<ManagementMainTab>('PENDING');

  // Secondary filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | StudentPermitType>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [useDateFilter, setUseDateFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal: Print Standee QR Code
  const [isQrStandeeOpen, setIsQrStandeeOpen] = useState<boolean>(false);

  // Modal: View & Print Single Permit
  const [viewingPermit, setViewingPermit] = useState<StudentPermitRecord | null>(null);

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

  // Filtered Permits according to active mainTab
  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      // 1. Filter by Main Tab
      if (mainTab === 'PENDING' && p.status !== 'Menunggu') return false;
      if (mainTab === 'APPROVED_RECAP' && p.status !== 'Disetujui' && p.status !== 'Kembali') return false;
      if (mainTab === 'REJECTED' && p.status !== 'Ditolak') return false;
      // if mainTab === 'ALL_HISTORY', no status restriction

      // 2. Filter by Type
      if (selectedTypeFilter !== 'ALL' && p.type !== selectedTypeFilter) return false;

      // 3. Filter by Class
      if (selectedClassFilter !== 'ALL' && p.className !== selectedClassFilter) return false;

      // 4. Filter by Date (if checkbox is active)
      if (useDateFilter && p.date !== selectedDate) return false;

      // 5. Filter by Search Query
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
  }, [permits, mainTab, selectedTypeFilter, selectedClassFilter, useDateFilter, selectedDate, searchQuery]);

  // Quick Metrics for Today
  const todayDate = getTodayDateString();
  const todayPermits = permits.filter((p) => p.date === todayDate);
  const todayExitSchool = todayPermits.filter((p) => p.type === 'Keluar Sekolah').length;
  const todayExitClass = todayPermits.filter((p) => p.type === 'Keluar Kelas').length;
  const todayUniform = todayPermits.filter((p) => p.type === 'Dispensasi Seragam').length;
  const todayPending = pendingPermits.filter((p) => p.date === todayDate).length;

  // Actions
  const handleApprove = (permit: StudentPermitRecord) => {
    const updated: StudentPermitRecord = {
      ...permit,
      status: 'Disetujui',
      approvedBy: currentUserName,
      approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    onUpdatePermit(updated);
  };

  const handleOpenRejectModal = (permit: StudentPermitRecord) => {
    setRejectingPermit(permit);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPermit) return;

    const updated: StudentPermitRecord = {
      ...rejectingPermit,
      status: 'Ditolak',
      approvedBy: currentUserName,
      approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      rejectionReason: rejectionReasonInput.trim() || 'Permohonan izin tidak disetujui oleh guru piket / kesiswaan',
    };
    onUpdatePermit(updated);
    setRejectingPermit(null);
    setRejectionReasonInput('');
  };

  const handleMarkReturned = (permit: StudentPermitRecord) => {
    const updated: StudentPermitRecord = {
      ...permit,
      status: 'Kembali',
      actualReturnTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
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
      'Diverifikasi Oleh',
      'Waktu Disetujui',
      'Catatan / Alasan Penolakan'
    ];
    
    const rows = filteredPermits.map((p, idx) => [
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
      `"${p.approvedBy || '-'}"`,
      `"${p.approvedAt || '-'}"`,
      `"${p.rejectionReason ? p.rejectionReason.replace(/"/g, '""') : '-'}"`,
    ]);

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
          <p className="text-xs sm:text-sm text-[#334155] font-medium mt-1">
            Persetujuan &amp; monitoring permohonan izin mandiri siswa (Scan QR Code): Keluar Sekolah, Keluar Kelas, dan Dispensasi Seragam.
          </p>
        </div>

        {/* Action Buttons: Standee QR & Open Public Portal */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="btn-print-qr-standee"
            onClick={() => setIsQrStandeeOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
            title="Cetak Poster / Standee QR Code untuk Meja Piket"
          >
            <QrCode className="w-4 h-4" />
            <span>Cetak QR Standee Piket</span>
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
                <span className="text-xs font-bold text-amber-100">Menunggu Tindakan Guru Piket</span>
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
          <div className="flex items-center gap-2 p-1.5 bg-[#E2F1FD] rounded-2xl text-xs font-black flex-wrap">
            {/* Tab 1: Menunggu Persetujuan */}
            <button
              type="button"
              id="tab-pending-permits"
              onClick={() => setMainTab('PENDING')}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
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
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                mainTab === 'APPROVED_RECAP'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs -translate-y-0.5'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Buku Rekap Izin Resmi (Disetujui)</span>
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
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
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
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                mainTab === 'ALL_HISTORY'
                  ? 'bg-sky-600 text-white shadow-xs -translate-y-0.5'
                  : 'text-[#334155] hover:text-[#0F172A]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Semua Riwayat ({permits.length})</span>
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

        {/* Sub-Filters: Type, Class, Date & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
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
              placeholder="Cari nama siswa, NISN, keperluan..."
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
                          ? 'Semua permohonan siswa telah diproses oleh guru piket.' 
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

                      {/* Status Izin */}
                      <td className="py-4 px-4 text-center">
                        {p.status === 'Menunggu' && (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-rose-700" />
                            <span>Menunggu</span>
                          </span>
                        )}
                        {p.status === 'Disetujui' && (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Disetujui</span>
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
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
                            <X className="w-3.5 h-3.5 text-rose-700" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>

                      {/* Keputusan & Aksi Guru Piket */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* JIKA STATUS MENUNGGU: TAMPILKAN TOMBOL KEPUTUSAN SETUJUI / TOLAK */}
                          {p.status === 'Menunggu' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(p)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                                title="Setujui dan masukkan ke Rekap Izin Resmi"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(p)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                                title="Tolak permohonan izin"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {/* JIKA SUDAH DISETUJUI & KELUAR SEKOLAH (KEMBALI): TOMBOL TANDAI KEMBALI */}
                          {p.status === 'Disetujui' && p.type === 'Keluar Sekolah' && p.willReturn === 'Kembali' && (
                            <button
                              type="button"
                              onClick={() => handleMarkReturned(p)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                              title="Tandai siswa telah kembali ke sekolah"
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
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setViewingPermit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>

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
      )}

      {/* MODAL 3: CETAK STANDEE QR CODE UNTUK MEJA PIKET */}
      {isQrStandeeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span className="font-black text-sm text-[#0F172A]">Poster Standee QR Code Piket</span>
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
                  <li>Tunggu persetujuan Guru Piket di meja piket</li>
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
