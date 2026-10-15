import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  DoorOpen, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  QrCode, 
  FileText, 
  Printer, 
  Check, 
  User, 
  ArrowRight, 
  Eye, 
  RefreshCw, 
  X,
  Layers,
  Sparkles,
  Lock,
  ChevronRight,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { StudentPermitRecord, SchoolProfile, AdminUser } from '../types';

interface SecurityGateVerificationViewProps {
  permits: StudentPermitRecord[];
  schoolProfile: SchoolProfile;
  currentUserName: string;
  currentUser?: AdminUser;
  onUpdatePermit?: (updated: StudentPermitRecord) => void;
}

export const SecurityGateVerificationView: React.FC<SecurityGateVerificationViewProps> = ({
  permits,
  schoolProfile,
  currentUserName,
  currentUser,
  onUpdatePermit,
}) => {
  // Today's date YYYY-MM-DD
  const todayDate = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Disetujui' | 'Menunggu' | 'Ditolak'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermitForInspection, setSelectedPermitForInspection] = useState<StudentPermitRecord | null>(null);
  const [qrCodeSearch, setQrCodeSearch] = useState('');
  const [gateActionToast, setGateActionToast] = useState<string | null>(null);

  // Helper date formatter
  const formatDateIndonesian = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const showToast = (msg: string) => {
    setGateActionToast(msg);
    setTimeout(() => {
      setGateActionToast(null);
    }, 3500);
  };

  // Filter only 'Keluar Sekolah' permits
  const keluarSekolahPermits = useMemo(() => {
    return permits.filter((p) => p.type === 'Keluar Sekolah');
  }, [permits]);

  // Statistics for selected date
  const stats = useMemo(() => {
    const listForDate = keluarSekolahPermits.filter((p) => p.date === selectedDate);
    const approved = listForDate.filter((p) => p.status === 'Disetujui');
    const pending = listForDate.filter((p) => p.status === 'Menunggu');
    const rejected = listForDate.filter((p) => p.status === 'Ditolak');
    const passedGate = listForDate.filter((p) => p.securityChecked);

    return {
      total: listForDate.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      passedGate: passedGate.length,
    };
  }, [keluarSekolahPermits, selectedDate]);

  // Filtered list based on search, status, and date
  const filteredList = useMemo(() => {
    return keluarSekolahPermits.filter((p) => {
      // Date filter
      if (selectedDate && p.date !== selectedDate) return false;

      // Status filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.studentName || '').toLowerCase().includes(q);
        const matchClass = (p.className || '').toLowerCase().includes(q);
        const matchNisn = (p.nisn || '').toLowerCase().includes(q);
        const matchPermitNo = (p.permitNumber || '').toLowerCase().includes(q);
        const matchQr = (p.qrVerificationCode || '').toLowerCase().includes(q);
        const matchReason = (p.reason || '').toLowerCase().includes(q);
        return matchName || matchClass || matchNisn || matchPermitNo || matchQr || matchReason;
      }

      return true;
    });
  }, [keluarSekolahPermits, selectedDate, statusFilter, searchQuery]);

  // Handle direct QR code search / scan
  const handleQuickQrLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeSearch.trim()) return;

    const term = qrCodeSearch.trim().toLowerCase();
    const matched = keluarSekolahPermits.find((p) => 
      (p.qrVerificationCode || '').toLowerCase() === term ||
      (p.permitNumber || '').toLowerCase() === term ||
      (p.studentName || '').toLowerCase().includes(term)
    );

    if (matched) {
      setSelectedPermitForInspection(matched);
      setQrCodeSearch('');
    } else {
      alert(`Permohonan dengan kode atau nomor "${qrCodeSearch}" tidak ditemukan.`);
    }
  };

  // Handle Gate Check-In/Check-Out stamp by Satpam
  const handleToggleGatePass = (permit: StudentPermitRecord) => {
    if (!onUpdatePermit) return;

    const isChecked = !!permit.securityChecked;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const updated: StudentPermitRecord = {
      ...permit,
      securityChecked: !isChecked,
      securityCheckedAt: !isChecked ? nowTime : undefined,
      securityCheckedBy: !isChecked ? (currentUserName || 'Petugas Keamanan Satpam') : undefined,
      updatedAt: new Date().toISOString(),
    };

    onUpdatePermit(updated);
    if (!isChecked) {
      showToast(`Pencatatan Gerbang Berhasil: ${permit.studentName} telah melewati pos satpam pukul ${nowTime} WIB.`);
    } else {
      showToast(`Tanda lewat gerbang untuk ${permit.studentName} telah dibatalkan.`);
    }

    if (selectedPermitForInspection && selectedPermitForInspection.id === permit.id) {
      setSelectedPermitForInspection(updated);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-roboto text-slate-800">
      {/* Toast Notification */}
      {gateActionToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{gateActionToast}</span>
        </div>
      )}

      {/* Top Header Card: Pos Satpam & Gerbang Utama */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 rounded-[32px] p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Ambient Decorative Accents */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Pos Keamanan &amp; Gerbang Sekolah</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-bold text-slate-300">{schoolProfile.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <DoorOpen className="w-6 h-6" />
              </div>
              <span>Pemeriksaan Siswa Izin Keluar Sekolah</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau dan periksa e-surat izin siswa yang akan melewati gerbang sekolah. Siswa hanya diizinkan keluar apabila telah disahkan melalui <strong>3 Tahap Persetujuan (Admin, Guru Mapel, dan Wakil Kepala Sekolah)</strong>.
            </p>
          </div>

          {/* User Badge & Fast QR Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Petugas Jaga:</div>
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentUserName || 'Petugas Keamanan (Satpam)'}</span>
              </div>
            </div>

            <form onSubmit={handleQuickQrLookup} className="relative flex items-center">
              <input
                type="text"
                placeholder="Scan / Cari Kode Surat..."
                value={qrCodeSearch}
                onChange={(e) => setQrCodeSearch(e.target.value)}
                className="w-full sm:w-60 bg-white/15 text-white placeholder-slate-400 text-xs font-medium rounded-2xl pl-10 pr-20 py-3 border border-white/20 focus:outline-hidden focus:bg-white/25 focus:ring-2 focus:ring-sky-400 transition-all"
              />
              <QrCode className="w-4 h-4 text-sky-400 absolute left-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[11px] rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Cek
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 4 Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengajuan Hari Ini */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 rounded-[26px] bg-white border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'ALL' ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Izin Keluar</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">Siswa terdata</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Seluruh pengajuan izin keluar sekolah hari ini.</p>
        </div>

        {/* Card 2: Resmi Disetujui (BOLEH KELUAR) */}
        <div 
          onClick={() => setStatusFilter('Disetujui')}
          className={`p-5 rounded-[26px] bg-gradient-to-br from-emerald-50 via-white to-teal-50 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'Disetujui' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Boleh Keluar Gerbang</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Check className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{stats.approved}</span>
            <span className="text-xs text-emerald-800 font-bold">Lengkap 3 Tahap</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Disahkan Admin, Guru Mapel, dan Wakasek.</p>
        </div>

        {/* Card 3: Dalam Proses (BELUM BOLEH KELUAR) */}
        <div 
          onClick={() => setStatusFilter('Menunggu')}
          className={`p-5 rounded-[26px] bg-gradient-to-br from-amber-50 via-white to-orange-50 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'Menunggu' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Masih Dalam Proses</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs animate-pulse">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{stats.pending}</span>
            <span className="text-xs text-amber-800 font-bold">Tahan / Belum Sah</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Jangan izinkan keluar sampai disahkan lengkap.</p>
        </div>

        {/* Card 4: Ditolak */}
        <div 
          onClick={() => setStatusFilter('Ditolak')}
          className={`p-5 rounded-[26px] bg-gradient-to-br from-rose-50 via-white to-red-50 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'Ditolak' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Izin Ditolak</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <X className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700">{stats.rejected}</span>
            <span className="text-xs text-rose-800 font-bold">Dilarang Keluar</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">Permohonan izin tidak disetujui Admin Disiplin Positif.</p>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa, kelas, NISN, atau keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Date Picker & Fast Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(todayDate)}
              className={`px-3.5 py-2 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                selectedDate === todayDate 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1">Filter Status:</span>
          {[
            { id: 'ALL', label: `Semua (${stats.total})` },
            { id: 'Disetujui', label: `Boleh Keluar (${stats.approved})`, activeClass: 'bg-emerald-600 text-white shadow-xs' },
            { id: 'Menunggu', label: `Dalam Proses (${stats.pending})`, activeClass: 'bg-amber-600 text-white shadow-xs' },
            { id: 'Ditolak', label: `Ditolak (${stats.rejected})`, activeClass: 'bg-rose-600 text-white shadow-xs' },
          ].map((chip) => {
            const isSelected = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? (chip.activeClass || 'bg-slate-900 text-white shadow-xs')
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List Table / Cards */}
      <div className="bg-white rounded-[28px] shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-sky-600" />
            <h2 className="font-black text-sm text-slate-900 uppercase tracking-wide">
              Daftar Siswa Mengajukan Izin Keluar Sekolah ({filteredList.length})
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Tanggal: {formatDateIndonesian(selectedDate)}
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
              <DoorOpen className="w-8 h-8" />
            </div>
            <p className="font-extrabold text-sm text-slate-800">
              Tidak ada data siswa izin keluar sekolah
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada permohonan keluar sekolah pada tanggal {formatDateIndonesian(selectedDate)} atau yang cocok dengan filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((permit, idx) => {
              const isApproved = permit.status === 'Disetujui';
              const isPending = permit.status === 'Menunggu';
              const isRejected = permit.status === 'Ditolak';

              // Determine current stage if still in progress
              let pendingStageLabel = 'Tahap 1: Admin Disiplin Positif';
              if (permit.adminApproval?.approved && !permit.teacherApproval?.approved) {
                pendingStageLabel = permit.subject ? `Tahap 2: Guru Mapel (${permit.subject}) / Wali Kelas` : 'Tahap 2: Guru Mapel / Wali Kelas';
              } else if (permit.adminApproval?.approved && permit.teacherApproval?.approved && !permit.wakasekApproval?.approved) {
                pendingStageLabel = 'Tahap 3: Wakil Kepala Sekolah';
              }

              return (
                <div 
                  key={permit.id}
                  className={`p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 ${
                    isApproved ? 'bg-emerald-50/20' : isPending ? 'bg-amber-50/20' : 'bg-rose-50/20'
                  }`}
                >
                  {/* Left: Student Identity & Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {permit.studentName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base text-slate-900 uppercase">
                          {permit.studentName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                          {permit.className}
                        </span>
                        {permit.willReturn && (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            permit.willReturn === 'Kembali' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {permit.willReturn === 'Kembali' ? 'Akan Kembali' : 'Izin Pulang (Tidak Kembali)'}
                          </span>
                        )}
                        {permit.securityChecked && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-indigo-600" />
                            <span>Telah Lewat Gerbang ({permit.securityCheckedAt})</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                        <span>Pukul diajukan: <strong>{permit.timeSubmitted} WIB</strong></span>
                        <span>•</span>
                        <span>Jam Pelajaran: <strong>{permit.lessonHour || '-'}</strong></span>
                        {permit.subject && (
                          <>
                            <span>•</span>
                            <span>Mapel: <strong>{permit.subject}</strong></span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-mono text-slate-400">{permit.permitNumber}</span>
                      </div>

                      <div className="text-xs text-slate-700 italic pt-1">
                        Keperluan: "{permit.reason}"
                      </div>
                    </div>
                  </div>

                  {/* Center: 3-Stage Mini Tracker */}
                  <div className="lg:w-72 shrink-0 p-3 bg-white rounded-2xl border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Pengesahan 3 Tahap Resmi:
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      {/* Tahap 1: Admin */}
                      <div className={`p-1.5 rounded-lg text-center font-bold ${
                        permit.adminApproval?.approved
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <div className="text-[9px]">1. Admin</div>
                        <div>{permit.adminApproval?.approved ? '✓ Sah' : '⏳'}</div>
                      </div>

                      {/* Tahap 2: Guru Mapel / Wali Kelas */}
                      <div className={`p-1.5 rounded-lg text-center font-bold ${
                        permit.teacherApproval?.approved
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <div className="text-[9px]">2. Guru/Wali</div>
                        <div>{permit.teacherApproval?.approved ? '✓ Sah' : '⏳'}</div>
                      </div>

                      {/* Tahap 3: Wakasek */}
                      <div className={`p-1.5 rounded-lg text-center font-bold ${
                        permit.wakasekApproval?.approved
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <div className="text-[9px]">3. Wakasek</div>
                        <div>{permit.wakasekApproval?.approved ? '✓ Sah' : '⏳'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Security Gate Status & Action */}
                  <div className="flex items-center gap-3 shrink-0 justify-between lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-right">
                      {isApproved ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>BOLEH KELUAR</span>
                        </div>
                      ) : isPending ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs shadow-sm">
                            <Clock className="w-4 h-4" />
                            <span>TAHAN / MENUNGGU</span>
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold mt-0.5">
                            {pendingStageLabel}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs shadow-sm">
                          <XCircle className="w-4 h-4" />
                          <span>DILARANG KELUAR</span>
                        </div>
                      )}
                    </div>

                    {/* Tombol Periksa e-Surat */}
                    <button
                      type="button"
                      onClick={() => setSelectedPermitForInspection(permit)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-sky-400" />
                      <span>Periksa e-Surat</span>
                    </button>

                    {/* Quick Gate Check Button */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => handleToggleGatePass(permit)}
                        title={permit.securityChecked ? "Batalkan tanda lewat" : "Catat siswa lewat gerbang"}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          permit.securityChecked 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100' 
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL PEMERIKSAAN E-SURAT IZIN SISWA */}
      {/* ------------------------------------------------------------------- */}
      {selectedPermitForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base">Pemeriksaan e-Surat Izin Keluar Sekolah</h3>
                  <p className="text-xs text-slate-300">
                    Pos Keamanan Gerbang Utama • SMAN 1 Batu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPermitForInspection(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Surat Izin Resmi Preview */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans">
              {/* Decision Alert Banner for Security Guard */}
              <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 ${
                selectedPermitForInspection.status === 'Disetujui'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : selectedPermitForInspection.status === 'Menunggu'
                  ? 'bg-amber-50 border-amber-400 text-amber-950'
                  : 'bg-rose-50 border-rose-400 text-rose-950'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                    selectedPermitForInspection.status === 'Disetujui' 
                      ? 'bg-emerald-600' 
                      : selectedPermitForInspection.status === 'Menunggu' 
                      ? 'bg-amber-500' 
                      : 'bg-rose-600'
                  }`}>
                    {selectedPermitForInspection.status === 'Disetujui' ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : selectedPermitForInspection.status === 'Menunggu' ? (
                      <Clock className="w-7 h-7" />
                    ) : (
                      <XCircle className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider">
                      STATUS KEPUTUSAN POS KEAMANAN:
                    </div>
                    <div className="text-base font-black">
                      {selectedPermitForInspection.status === 'Disetujui'
                        ? '✓ RESMI DIIZINKAN KELUAR GERBANG'
                        : selectedPermitForInspection.status === 'Menunggu'
                        ? '⏳ TAHAN! MASIH DALAM PROSES PERSETUJUAN'
                        : '✕ DITOLAK! DILARANG KELUAR SEKOLAH'}
                    </div>
                    <div className="text-xs mt-0.5 opacity-90">
                      {selectedPermitForInspection.status === 'Disetujui'
                        ? 'Surat izin ini sah dan telah lengkap ditandatangani oleh Admin, Guru Mapel / Wali Kelas, dan Wakil Kepala Sekolah.'
                        : selectedPermitForInspection.status === 'Menunggu'
                        ? 'Siswa belum menyelesaikan seluruh tahapan pengesahan resmi. Harap arahkan siswa kembali ke pos Tim Disiplin Positif.'
                        : 'Permohonan izin keluar telah ditolak oleh Tim Disiplin Positif sekolah.'}
                    </div>
                  </div>
                </div>

                {selectedPermitForInspection.status === 'Disetujui' && (
                  <button
                    type="button"
                    onClick={() => handleToggleGatePass(selectedPermitForInspection)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                      selectedPermitForInspection.securityChecked
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    {selectedPermitForInspection.securityChecked ? '✓ Tercatat Keluar' : 'Catat Lewat Gerbang'}
                  </button>
                )}
              </div>

              {/* Digital Certificate Pass Card */}
              <div className="border-2 border-slate-300 rounded-[28px] p-6 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 space-y-4 shadow-sm relative overflow-hidden font-serif">
                {/* Kop Mini */}
                <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900 font-sans">
                  <img src="/logo.png" alt="Logo SMAN 1 Batu" className="w-12 h-12 object-contain shrink-0" />
                  <div className="text-center flex-1">
                    <h4 className="font-bold text-[10px] tracking-wider text-slate-800 uppercase leading-tight">
                      PEMERINTAH PROVINSI JAWA TIMUR • DINAS PENDIDIKAN
                    </h4>
                    <h3 className="font-black text-sm tracking-wide text-slate-950 uppercase leading-tight">
                      {schoolProfile.name}
                    </h3>
                  </div>
                  <div className="w-12 shrink-0 hidden sm:block" />
                </div>

                {/* Surat Title & Badge */}
                <div className="text-center pt-1 font-sans">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border ${
                    selectedPermitForInspection.status === 'Disetujui'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    SURAT IZIN KELUAR SEKOLAH ({selectedPermitForInspection.status.toUpperCase()})
                  </span>
                </div>

                {/* Identitas Siswa */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs font-sans text-xs space-y-2">
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Nama Siswa</span>
                    <span>:</span>
                    <span className="font-black text-slate-950 text-sm uppercase">{selectedPermitForInspection.studentName}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Kelas / Rombel</span>
                    <span>:</span>
                    <span className="font-bold text-slate-900">{selectedPermitForInspection.className}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Waktu Pengajuan</span>
                    <span>:</span>
                    <span className="text-slate-800 font-bold">
                      {formatDateIndonesian(selectedPermitForInspection.date)}, Pukul {selectedPermitForInspection.timeSubmitted} WIB
                    </span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Jam Pelajaran</span>
                    <span>:</span>
                    <span className="font-semibold text-slate-900">{selectedPermitForInspection.lessonHour || '-'}</span>
                  </div>
                  {selectedPermitForInspection.subject && (
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-600">Mata Pelajaran</span>
                      <span>:</span>
                      <span className="font-semibold text-slate-900">{selectedPermitForInspection.subject}</span>
                    </div>
                  )}
                  {selectedPermitForInspection.willReturn && (
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-600">Status Kepulangan</span>
                      <span>:</span>
                      <span className={`font-bold ${selectedPermitForInspection.willReturn === 'Kembali' ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {selectedPermitForInspection.willReturn === 'Kembali' ? 'Akan Kembali ke Sekolah' : 'Tidak Kembali (Izin Pulang)'}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1 pt-1 border-t border-slate-100">
                    <span className="text-slate-600">Keperluan / Alasan</span>
                    <span>:</span>
                    <span className="font-medium text-slate-900 italic">"{selectedPermitForInspection.reason}"</span>
                  </div>
                </div>

                {/* Lembar 3 Tahap Pengesahan */}
                <div className="pt-2 border-t-2 border-slate-900 font-sans space-y-2">
                  <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider text-center">
                    LEMBAR PENGESAHAN 3 TAHAP BERURUTAN
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Kotak 1: Admin */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      selectedPermitForInspection.adminApproval?.approved 
                        ? 'bg-emerald-50/80 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">1. Admin Disiplin Positif</div>
                      <div className={`text-[10px] font-bold ${selectedPermitForInspection.adminApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {selectedPermitForInspection.adminApproval?.approved ? '✓ Diverifikasi' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-0.5 truncate">
                        {selectedPermitForInspection.adminApproval?.approvedBy || selectedPermitForInspection.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {selectedPermitForInspection.adminApproval?.approvedAt ? `${selectedPermitForInspection.adminApproval.approvedAt} WIB` : '-'}
                      </div>
                    </div>

                    {/* Kotak 2: Guru Mapel / Wali Kelas */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      selectedPermitForInspection.teacherApproval?.approved 
                        ? 'bg-violet-50/80 border-violet-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">2. Guru Mapel / Wali Kelas</div>
                      <div className="text-[9px] text-slate-500 font-semibold truncate" title={selectedPermitForInspection.subject}>
                        {selectedPermitForInspection.subject || 'Guru Mapel / Wali Kelas'}
                      </div>
                      <div className={`text-[10px] font-bold ${selectedPermitForInspection.teacherApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {selectedPermitForInspection.teacherApproval?.approved ? '✓ Disetujui' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-0.5 truncate">
                        {selectedPermitForInspection.teacherApproval?.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {selectedPermitForInspection.teacherApproval?.approvedAt ? `${selectedPermitForInspection.teacherApproval.approvedAt} WIB` : '-'}
                      </div>
                    </div>

                    {/* Kotak 3: Wakil Kepala Sekolah */}
                    <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                      selectedPermitForInspection.wakasekApproval?.approved 
                        ? 'bg-indigo-50/80 border-indigo-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-black text-slate-700 uppercase">3. Wakil Kepala Sekolah</div>
                      <div className="text-[9px] text-slate-500 font-semibold truncate">
                        {selectedPermitForInspection.wakasekApproval?.roleTitle || 'Semua Waka Berwenang'}
                      </div>
                      <div className={`text-[10px] font-bold ${selectedPermitForInspection.wakasekApproval?.approved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {selectedPermitForInspection.wakasekApproval?.approved ? '✓ Disahkan' : '⏳ Menunggu'}
                      </div>
                      <div className="font-black text-xs text-slate-900 underline pt-0.5 truncate">
                        {selectedPermitForInspection.wakasekApproval?.approvedBy || '-'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {selectedPermitForInspection.wakasekApproval?.approvedAt ? `${selectedPermitForInspection.wakasekApproval.approvedAt} WIB` : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code & Digital Signature */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 font-sans border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 p-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs flex items-center justify-center">
                      <QrCode className="w-full h-full text-slate-900" />
                    </div>
                    <div className="text-left text-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Verifikasi Disiplin Positif</div>
                      <div className="text-xs font-mono font-bold text-emerald-800">
                        3-STAGE DIGITAL VALIDATED
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {selectedPermitForInspection.qrVerificationCode || selectedPermitForInspection.permitNumber}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-slate-600">
                      {selectedPermitForInspection.wakasekApproval?.roleTitle || 'Pengesahan Wakil Kepala Sekolah'}
                    </div>
                    <div className="h-7 flex items-center justify-end">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded border border-emerald-300 uppercase">
                        VERIFIED
                      </span>
                    </div>
                    <div className="font-bold underline text-slate-900">
                      {selectedPermitForInspection.wakasekApproval?.approvedBy || 'Wakil Kepala Sekolah'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak Lembar Izin</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPermitForInspection(null)}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm"
              >
                Tutup Pemeriksaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
