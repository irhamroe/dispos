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
  FileText
} from 'lucide-react';
import { Student, SchoolProfile, StudentPermitRecord, StudentPermitType, StudentPermitStatus } from '../types';
import { RombelClass } from '../data/initialData';
import { formatDateIndonesian, formatDayAndDateIndonesian, getTodayDateString, getTodayIndonesian } from '../utils/exportUtils';
import { sortClasses } from '../utils/sortUtils';

interface StudentPermitManagementViewProps {
  permits: StudentPermitRecord[];
  students: Student[];
  classes: RombelClass[];
  schoolProfile: SchoolProfile;
  currentUserName: string;
  onUpdatePermit: (updated: StudentPermitRecord) => void;
  onDeletePermit: (permitId: string) => void;
  onOpenPublicPortal: () => void;
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
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | StudentPermitType>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | StudentPermitStatus>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [useDateFilter, setUseDateFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal: Print Standee QR Code
  const [isQrStandeeOpen, setIsQrStandeeOpen] = useState<boolean>(false);

  // Modal: View & Print Single Permit
  const [viewingPermit, setViewingPermit] = useState<StudentPermitRecord | null>(null);

  // Filtered Permits
  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      if (selectedTypeFilter !== 'ALL' && p.type !== selectedTypeFilter) return false;
      if (selectedStatusFilter !== 'ALL' && p.status !== selectedStatusFilter) return false;
      if (selectedClassFilter !== 'ALL' && p.className !== selectedClassFilter) return false;
      if (useDateFilter && p.date !== selectedDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.studentName.toLowerCase().includes(q);
        const matchNisn = (p.nisn || '').toLowerCase().includes(q);
        const matchNumber = p.permitNumber.toLowerCase().includes(q);
        const matchReason = p.reason.toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchNumber && !matchReason) return false;
      }
      return true;
    });
  }, [permits, selectedTypeFilter, selectedStatusFilter, selectedClassFilter, useDateFilter, selectedDate, searchQuery]);

  // Quick Metrics for Today
  const todayDate = getTodayDateString();
  const todayPermits = permits.filter((p) => p.date === todayDate);
  const todayExitSchool = todayPermits.filter((p) => p.type === 'Keluar Sekolah').length;
  const todayExitClass = todayPermits.filter((p) => p.type === 'Keluar Kelas').length;
  const todayUniform = todayPermits.filter((p) => p.type === 'Dispensasi Seragam').length;
  const todayPending = todayPermits.filter((p) => p.status === 'Menunggu').length;

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

  const handleReject = (permit: StudentPermitRecord) => {
    const updated: StudentPermitRecord = {
      ...permit,
      status: 'Ditolak',
      approvedBy: currentUserName,
      approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    onUpdatePermit(updated);
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
    const headers = ['No', 'No. Surat', 'Jenis Izin', 'Tanggal', 'Waktu', 'Nama Siswa', 'Kelas', 'NISN', 'Mata Pelajaran', 'Jam Ke-', 'Keperluan', 'Status Kembali / Seragam', 'Status Izin', 'Diverifikasi Oleh'];
    const rows = filteredPermits.map((p, idx) => [
      idx + 1,
      `"${p.permitNumber}"`,
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
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Izin_Siswa_SMAN1Batu_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate URL for QR code (points to public portal)
  const publicPortalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?view=izin-siswa`
    : 'https://dispos-smaba.vercel.app?view=izin-siswa';

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicPortalUrl)}&margin=10`;

  return (
    <div className="space-y-6 pb-12">
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
            Monitoring permohonan izin mandiri siswa (Scan QR Code): Keluar Sekolah, Keluar Kelas, dan Dispensasi Seragam.
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

        <div className="rounded-[32px] bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/60 p-5 shadow-xs border border-[#FDA4AF]/70 hover:-translate-y-1.5 transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#BE123C] uppercase tracking-wider">Menunggu Verifikasi</div>
            <div className="text-lg sm:text-xl font-black text-[#BE123C] mt-0.5">{todayPending} Permohonan</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[32px] bg-white/80 p-6 backdrop-blur-xl shadow-sm border border-white/60 space-y-4">
        {/* Row 1: Category Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 p-1.5 bg-[#E2F1FD] rounded-2xl text-xs font-black flex-wrap">
            {(['ALL', 'Keluar Sekolah', 'Keluar Kelas', 'Dispensasi Seragam'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedTypeFilter === type
                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs -translate-y-0.5'
                    : 'text-[#334155] hover:text-[#0F172A]'
                }`}
              >
                {type === 'ALL' ? 'Semua Jenis Izin' : type}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#E2F1FD] hover:bg-white text-sky-800 font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Row 2: Date, Class, Status & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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

          {/* Filter Status */}
          <div className="bg-[#E2F1FD] px-3.5 py-2 rounded-2xl border border-white/40 flex items-center gap-2">
            <span className="font-bold text-[#334155] shrink-0">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-transparent font-extrabold text-[#0F172A] focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Kembali">Sudah Kembali</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Cari nama, NISN, keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#E2F1FD] rounded-2xl text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Table of Permits */}
      <div className="rounded-[32px] bg-white/80 backdrop-blur-xl shadow-sm border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/80 to-purple-50/50 text-[#334155] font-black text-xs uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-4 px-3 w-12 text-center">No</th>
                <th className="py-4 px-4 w-28">Waktu / Tgl</th>
                <th className="py-4 px-4 min-w-[140px]">No. Surat</th>
                <th className="py-4 px-4 w-36 text-center">Kategori Izin</th>
                <th className="py-4 px-5 min-w-[200px]">Nama Siswa &amp; Kelas</th>
                <th className="py-4 px-5 min-w-[240px]">Rincian &amp; Alasan Izin</th>
                <th className="py-4 px-4 text-center w-32">Status Izin</th>
                <th className="py-4 px-4 text-center w-40">Aksi Guru Piket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B] font-bold">
                    Tidak ada data permohonan surat izin yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredPermits.map((p, idx) => {
                  return (
                    <tr key={p.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="py-4 px-3 text-center font-bold text-[#64748B]">
                        {idx + 1}
                      </td>

                      {/* Waktu / Tanggal */}
                      <td className="py-4 px-4">
                        <div className="font-black text-[#0F172A]">{p.timeSubmitted} WIB</div>
                        <div className="text-[11px] text-[#64748B]">{p.date}</div>
                      </td>

                      {/* No. Surat */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                          {p.permitNumber}
                        </span>
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
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
                          <span className="font-bold text-[#0284C7] bg-sky-50 px-2 py-0.2 rounded-md border border-sky-200">
                            Kelas {p.className}
                          </span>
                          <span>•</span>
                          <span>NISN: {p.nisn || '-'}</span>
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
                      </td>

                      {/* Status Izin */}
                      <td className="py-4 px-4 text-center">
                        {p.status === 'Menunggu' && (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
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
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                            <X className="w-3.5 h-3.5 text-rose-700" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi Guru Piket */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {p.status === 'Menunggu' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(p)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                                title="Setujui permohonan izin"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(p)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-black text-xs border border-rose-200 shadow-xs cursor-pointer active:scale-95 transition-all"
                                title="Tolak izin"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {p.status === 'Disetujui' && p.type === 'Keluar Sekolah' && p.willReturn === 'Kembali' && (
                            <button
                              type="button"
                              onClick={() => handleMarkReturned(p)}
                              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                              title="Konfirmasi bahwa siswa sudah kembali ke sekolah"
                            >
                              Telah Kembali
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewingPermit(p)}
                            className="p-1.5 bg-white hover:bg-sky-50 text-sky-700 rounded-xl border border-slate-200 shadow-xs cursor-pointer active:scale-95"
                            title="Lihat & Cetak e-Surat Izin"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus data izin ${p.permitNumber} siswa ${p.studentName}?`)) {
                                onDeletePermit(p.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl shadow-xs cursor-pointer active:scale-95"
                            title="Hapus Izin"
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

      {/* MODAL: CETAK STANDEE POSTER QR CODE UNTUK MEJA PIKET & KELAS */}
      {isQrStandeeOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95 max-h-[calc(100vh-2rem)] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-6 h-6 text-indigo-600" />
                <h3 className="text-base font-black text-[#0F172A]">
                  Standee &amp; Poster QR Code Layanan Izin Siswa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrStandeeOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standee Content Ready for A4 Print */}
            <div 
              id="printable-qr-standee"
              className="border-2 border-indigo-200 rounded-2xl p-6 bg-gradient-to-b from-white via-sky-50/50 to-indigo-50/40 text-center space-y-4 shadow-sm font-sans overflow-y-auto flex-1"
            >
              <div className="flex items-center justify-center gap-2 pb-2 border-b border-slate-200">
                <img src="/logo.png" alt="SMAN 1 Batu" className="w-12 h-12 object-contain" />
                <div className="text-left">
                  <h4 className="font-black text-sm uppercase text-slate-900">{schoolProfile.name}</h4>
                  <p className="text-[10px] text-slate-600 font-bold">TIM DISIPLIN POSITIF &amp; GURU PIKET</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black uppercase tracking-wider">
                  LAYANAN PERIZINAN SISWA MANDIRI
                </span>
                <h2 className="text-lg font-black text-slate-900 pt-1">
                  Scan QR Code Di Sini
                </h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Untuk mengajukan <strong>Surat Izin Keluar Sekolah</strong>, <strong>Keluar Kelas</strong>, atau <strong>Dispensasi Atribut Seragam</strong>.
                </p>
              </div>

              {/* QR Code Image */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 w-52 h-52 mx-auto shadow-md">
                <img src={qrImageUrl} alt="QR Code Izin Siswa" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-mono text-slate-700 font-bold truncate max-w-xs mx-auto">
                  {publicPortalUrl}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Tanpa perlu login akun • Buka kamera HP &amp; arahkan ke QR Code di atas
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-500">Siap dicetak &amp; ditempel di meja piket / mading</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrStandeeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Standee</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW & CETAK E-SURAT IZIN SISWA */}
      {viewingPermit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95 max-h-[calc(100vh-2rem)] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-sky-600" />
                <h3 className="text-base font-black text-[#0F172A]">
                  Pratinjau Surat Izin Siswa: {viewingPermit.permitNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPermit(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Body */}
            <div className="border border-slate-300 rounded-2xl p-6 bg-white text-xs space-y-4 font-serif overflow-y-auto flex-1">
              {/* Kop Surat */}
              <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-900 font-sans">
                <img src="/logo.png" alt="Logo SMAN 1 Batu" className="w-12 h-12 object-contain" />
                <div className="text-center flex-1">
                  <h3 className="font-bold text-[11px] uppercase text-slate-800">PEMERINTAH PROVINSI JAWA TIMUR • DINAS PENDIDIKAN</h3>
                  <h2 className="font-black text-sm uppercase text-slate-950">{schoolProfile.name}</h2>
                  <p className="text-[9.5px] text-slate-600">TIM DISIPLIN POSITIF &amp; GURU PIKET KESISWAAN</p>
                </div>
                <div className="w-12" />
              </div>

              <div className="text-center font-sans">
                <span className="inline-block px-3 py-1 bg-sky-100 text-sky-950 font-black rounded-full border border-sky-300 uppercase">
                  SURAT IZIN: {viewingPermit.type.toUpperCase()}
                </span>
                <div className="text-slate-600 font-mono text-[11px] mt-1">
                  Nomor: <strong>{viewingPermit.permitNumber}</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans space-y-2">
                <div className="grid grid-cols-[120px_10px_auto] gap-x-1">
                  <span className="text-slate-600">Nama Siswa</span>
                  <span>:</span>
                  <span className="font-black text-slate-950 uppercase">{viewingPermit.studentName}</span>
                </div>
                <div className="grid grid-cols-[120px_10px_auto] gap-x-1">
                  <span className="text-slate-600">Kelas / NISN</span>
                  <span>:</span>
                  <span className="font-bold text-slate-900">Kelas {viewingPermit.className} • NISN: {viewingPermit.nisn || '-'}</span>
                </div>
                <div className="grid grid-cols-[120px_10px_auto] gap-x-1">
                  <span className="text-slate-600">Waktu Pengajuan</span>
                  <span>:</span>
                  <span className="text-slate-900">{formatDateIndonesian(viewingPermit.date)}, {viewingPermit.timeSubmitted} WIB</span>
                </div>

                {viewingPermit.subject && (
                  <div className="grid grid-cols-[120px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Mata Pelajaran</span>
                    <span>:</span>
                    <span className="font-bold text-slate-900">{viewingPermit.subject} ({viewingPermit.lessonHour || '-'})</span>
                  </div>
                )}

                {viewingPermit.willReturn && (
                  <div className="grid grid-cols-[120px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Status Kembali</span>
                    <span>:</span>
                    <span className="font-black text-emerald-800">{viewingPermit.willReturn}</span>
                  </div>
                )}

                {viewingPermit.uniformViolationType && (
                  <div className="grid grid-cols-[120px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Dispensasi Seragam</span>
                    <span>:</span>
                    <span className="font-black text-rose-800">{viewingPermit.uniformViolationType}</span>
                  </div>
                )}

                <div className="grid grid-cols-[120px_10px_auto] gap-x-1 pt-1 border-t border-slate-200">
                  <span className="text-slate-600">Keperluan</span>
                  <span>:</span>
                  <span className="italic font-medium text-slate-900">"{viewingPermit.reason}"</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 font-sans text-xs">
                <div className="text-left">
                  <div className="text-slate-500">Status: <strong className="text-emerald-700">{viewingPermit.status}</strong></div>
                  <div className="text-[10px] text-slate-400 font-mono">{viewingPermit.qrVerificationCode}</div>
                </div>
                <div className="text-right">
                  <div>Kota Batu, {formatDateIndonesian(viewingPermit.date)}</div>
                  <div>Guru Piket / Kesiswaan</div>
                  <div className="h-10" />
                  <div className="font-bold underline">{viewingPermit.approvedBy || currentUserName}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setViewingPermit(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Izin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
