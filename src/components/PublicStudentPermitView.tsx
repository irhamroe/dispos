import React, { useState, useMemo, useEffect } from 'react';
import { 
  LogOut, 
  DoorOpen, 
  Shirt, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Layers, 
  BookOpen, 
  FileText, 
  Printer, 
  Download, 
  Sparkles, 
  ArrowLeft, 
  QrCode, 
  Send, 
  Check, 
  AlertCircle,
  School,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Search,
  XCircle,
  Clock4
} from 'lucide-react';
import { Student, SchoolProfile, StudentPermitRecord, StudentPermitType } from '../types';
import { RombelClass } from '../data/initialData';
import { formatDateIndonesian, formatDayAndDateIndonesian, getTodayDateString } from '../utils/exportUtils';
import { sortClasses, sortStudents } from '../utils/sortUtils';

interface PublicStudentPermitViewProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  classes: RombelClass[];
  permits?: StudentPermitRecord[];
  onSubmitPermit: (permit: StudentPermitRecord) => void;
  onBackToLogin?: () => void;
  onBackToApp?: () => void;
  isTeacherOrAdminLoggedIn?: boolean;
}

const LESSON_HOUR_OPTIONS = [
  'Jam ke-1 s/d 2',
  'Jam ke-2 s/d 3',
  'Jam ke-3 s/d 4',
  'Jam ke-4 s/d 5',
  'Jam ke-5 s/d 6',
  'Jam ke-6 s/d 7',
  'Jam ke-7 s/d 8',
  'Jam ke-8 s/d 9',
  'Jam ke-9 s/d 10',
];

export const PublicStudentPermitView: React.FC<PublicStudentPermitViewProps> = ({
  schoolProfile,
  students,
  classes,
  permits = [],
  onSubmitPermit,
  onBackToLogin,
  onBackToApp,
  isTeacherOrAdminLoggedIn = false,
}) => {
  const [activeTab, setActiveTab] = useState<StudentPermitType>('Keluar Sekolah');
  const [portalMode, setPortalMode] = useState<'FORM' | 'STATUS_CHECK'>('FORM');

  // Form states
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [customNisn, setCustomNisn] = useState<string>('');

  // Form Fields for Exit School / Exit Class
  const [subject, setSubject] = useState<string>('');
  const [lessonHour, setLessonHour] = useState<string>('Jam ke-1 s/d 2');
  const [reason, setReason] = useState<string>('');
  const [willReturn, setWillReturn] = useState<'Kembali' | 'Tidak Kembali'>('Kembali');

  // Form Fields for Uniform Dispensation
  const [uniformViolationType, setUniformViolationType] = useState<string>('Sepatu bukan hitam polos');
  const [customUniformType, setCustomUniformType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => getTodayDateString());
  const [estimatedEndDate, setEstimatedEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Track active submitted / viewed permit
  const [activePermitId, setActivePermitId] = useState<string | null>(null);
  const [localSubmittedPermit, setLocalSubmittedPermit] = useState<StudentPermitRecord | null>(null);

  // Status check lookup state
  const [checkClass, setCheckClass] = useState<string>('X-1');
  const [checkStudentId, setCheckStudentId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Derive current permit from permits prop (for real-time Firestore sync) or local fallback
  const activePermit = useMemo(() => {
    if (!activePermitId) return null;
    const found = permits.find((p) => p.id === activePermitId);
    if (found) return found;
    if (localSubmittedPermit && localSubmittedPermit.id === activePermitId) {
      return localSubmittedPermit;
    }
    return null;
  }, [activePermitId, permits, localSubmittedPermit]);

  // Filter students in the selected class for form
  const classStudents = useMemo(() => {
    const list = students.filter((s) => s.className === selectedClass);
    return sortStudents(list);
  }, [students, selectedClass]);

  // Filter students in the selected class for status check
  const checkClassStudents = useMemo(() => {
    const list = students.filter((s) => s.className === checkClass);
    return sortStudents(list);
  }, [students, checkClass]);

  // Handle student selection from dropdown
  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setCustomStudentName(s.name);
    setCustomNisn(s.nisn);
  };

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedStudent(null);
    setCustomStudentName('');
    setCustomNisn('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalStudentName = selectedStudent?.name || customStudentName.trim();
    if (!finalStudentName) {
      alert('Silakan pilih atau masukkan nama siswa.');
      return;
    }

    const finalNisn = selectedStudent?.nisn || customNisn.trim() || '-';
    const now = new Date();
    const timeSubmitted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const todayDate = getTodayDateString();

    const permitId = `PERMIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qrCode = `VERIF-${todayDate.replace(/-/g, '')}-${permitId.slice(-6)}-SMAN1BATU`;

    const newPermit: StudentPermitRecord = {
      id: permitId,
      permitNumber: `IZIN-${todayDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      type: activeTab,
      studentId: selectedStudent?.id,
      studentName: finalStudentName,
      nisn: finalNisn,
      className: selectedClass,
      date: todayDate,
      timeSubmitted,
      subject: activeTab !== 'Dispensasi Seragam' ? subject.trim() : undefined,
      lessonHour: activeTab !== 'Dispensasi Seragam' ? lessonHour.trim() : undefined,
      reason: reason.trim(),
      willReturn: activeTab === 'Keluar Sekolah' ? willReturn : undefined,
      uniformViolationType: activeTab === 'Dispensasi Seragam' 
        ? (uniformViolationType === 'Lainnya' ? customUniformType.trim() : uniformViolationType)
        : undefined,
      startDate: activeTab === 'Dispensasi Seragam' ? startDate : undefined,
      estimatedEndDate: activeTab === 'Dispensasi Seragam' ? estimatedEndDate : undefined,
      status: 'Menunggu',
      qrVerificationCode: qrCode,
    };

    onSubmitPermit(newPermit);
    setLocalSubmittedPermit(newPermit);
    setActivePermitId(permitId);
  };

  const handleResetForm = () => {
    setActivePermitId(null);
    setLocalSubmittedPermit(null);
    setReason('');
    setSubject('');
    setCustomStudentName('');
    setCustomNisn('');
    setSelectedStudent(null);
    setPortalMode('FORM');
  };

  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Find permits for status check
  const studentPermitsToday = useMemo(() => {
    if (!checkStudentId) return [];
    const today = getTodayDateString();
    return permits.filter(
      (p) => (p.studentId === checkStudentId || p.className === checkClass) && p.date === today
    );
  }, [permits, checkStudentId, checkClass]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#0A192F] py-8 px-4 sm:px-6 lg:px-8 relative font-roboto text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Decorative Ambient Shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-sky-500/20 blur-3xl animate-md-drift-1" />
        <div className="absolute top-[30%] -right-[15%] w-[65vh] h-[65vh] rounded-full bg-blue-600/25 blur-3xl animate-md-drift-2" />
        <div className="absolute -bottom-[20%] left-[25%] w-[60vh] h-[60vh] rounded-full bg-teal-500/15 blur-3xl animate-md-drift-1" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.12)_0%,_transparent_70%)]" />
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl p-4 rounded-[28px] border border-white/20 shadow-xl text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md shrink-0 border border-sky-100">
              <img src="/logo.png" alt={schoolProfile.name} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-md">
                  Portal Siswa Mandiri
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Layanan Surat Izin Siswa {schoolProfile.name}
              </h1>
            </div>
          </div>

          {(onBackToApp || onBackToLogin) && (
            <button
              type="button"
              onClick={onBackToApp || onBackToLogin}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title={isTeacherOrAdminLoggedIn ? 'Kembali ke Dashboard Aplikasi' : 'Kembali ke portal login guru'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isTeacherOrAdminLoggedIn ? 'Kembali ke Dashboard' : 'Portal Guru'}
              </span>
            </button>
          )}
        </div>

        {/* NAVIGATION MODE: AJUKAN IZIN vs CEK STATUS */}
        {!activePermit && (
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={() => setPortalMode('FORM')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'FORM'
                  ? 'bg-white text-[#0B2545] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Ajukan Permohonan Izin</span>
            </button>

            <button
              type="button"
              onClick={() => setPortalMode('STATUS_CHECK')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'STATUS_CHECK'
                  ? 'bg-white text-[#0B2545] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Cek Status Permohonan</span>
            </button>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAMPILAN STATUS / SURAT IZIN AKTIF */}
        {/* ---------------------------------------------------- */}
        {activePermit ? (
          <div className="space-y-6">
            {/* KONDISI 1: STATUS MENUNGGU PERSETUJUAN */}
            {activePermit.status === 'Menunggu' && (
              <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-6 animate-in fade-in zoom-in-95">
                {/* Header Menunggu */}
                <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
                      <Clock4 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-amber-200 bg-black/15 px-2 py-0.5 rounded-md inline-block">
                        Status: Menunggu Persetujuan
                      </div>
                      <h2 className="text-base sm:text-lg font-black mt-0.5">
                        Permohonan Izin Terkirim ke Guru Piket
                      </h2>
                      <p className="text-xs text-amber-100">
                        Silakan menghadap Guru Piket di Meja Piket untuk mendapatkan persetujuan.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer shrink-0"
                    title="Segarkan Status"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Status Notice Box */}
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 font-bold block mb-0.5">
                      Surat Izin Resmi Belum Terbit
                    </strong>
                    Surat izin resmi dan kode verifikasi hanya akan ditampilkan di layar handphone ini setelah permohonan disetujui oleh Guru Piket / Admin. Halaman ini akan otomatis diperbarui begitu disetujui.
                  </div>
                </div>

                {/* Ringkasan Permohonan Siswa */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>Ringkasan Pengajuan Izin</span>
                    <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                      {activePermit.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-500 font-bold">Nama Siswa</span>
                    <span>:</span>
                    <span className="font-black text-slate-900 text-sm uppercase">{activePermit.studentName}</span>
                  </div>

                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-500 font-bold">Kelas / NISN</span>
                    <span>:</span>
                    <span className="font-bold text-slate-800">Kelas {activePermit.className} • {activePermit.nisn || '-'}</span>
                  </div>

                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-500 font-bold">Waktu Diajukan</span>
                    <span>:</span>
                    <span className="text-slate-800">{formatDateIndonesian(activePermit.date)}, Pukul {activePermit.timeSubmitted} WIB</span>
                  </div>

                  {activePermit.subject && (
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-500 font-bold">Mata Pelajaran</span>
                      <span>:</span>
                      <span className="font-semibold text-slate-900">{activePermit.subject}</span>
                    </div>
                  )}

                  {activePermit.lessonHour && (
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-500 font-bold">Jam Pelajaran</span>
                      <span>:</span>
                      <span className="font-semibold text-slate-900">{activePermit.lessonHour}</span>
                    </div>
                  )}

                  {activePermit.willReturn && (
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-500 font-bold">Status Kepulangan</span>
                      <span>:</span>
                      <span className={`font-bold ${activePermit.willReturn === 'Kembali' ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {activePermit.willReturn === 'Kembali' ? 'Akan Kembali ke Sekolah' : 'Tidak Kembali (Izin Pulang)'}
                      </span>
                    </div>
                  )}

                  {activePermit.uniformViolationType && (
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-500 font-bold">Jenis Atribut</span>
                      <span>:</span>
                      <span className="font-bold text-rose-800">{activePermit.uniformViolationType}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-bold">Alasan / Keperluan</span>
                    <span>:</span>
                    <span className="font-medium text-slate-900 italic">"{activePermit.reason}"</span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-5 py-2.5 rounded-2xl bg-[#E2F1FD] hover:bg-[#D0E8FB] text-[#0F172A] font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4 text-sky-700" />
                    <span>Kembali ke Halaman Utama</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Perbarui Status Persetujuan</span>
                  </button>
                </div>
              </div>
            )}

            {/* KONDISI 2: STATUS DISETUJUI / KEMBALI (SURAT RESMI TAMPIL) */}
            {(activePermit.status === 'Disetujui' || activePermit.status === 'Kembali') && (
              <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-6 animate-in fade-in zoom-in-95">
                <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black">Permohonan Izin Telah Disetujui!</h2>
                      <p className="text-xs text-emerald-100">
                        Tunjukkan e-Surat Izin ini kepada Guru Pengajar / Satpam saat keluar kelas atau gerbang sekolah.
                      </p>
                    </div>
                  </div>
                </div>

                {/* E-Pass Card Preview */}
                <div 
                  id="printable-student-permit"
                  className="border-2 border-slate-300 rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 space-y-4 shadow-sm relative overflow-hidden font-serif"
                >
                  {/* Header Kop Mini */}
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
                    <img src="/logo.png" alt="Logo SMAN 1 Batu" className="w-12 h-12 object-contain shrink-0" />
                    <div className="text-center flex-1 font-sans">
                      <h3 className="font-bold text-[11px] tracking-wider text-slate-800 uppercase leading-tight">
                        PEMERINTAH PROVINSI JAWA TIMUR • DINAS PENDIDIKAN
                      </h3>
                      <h2 className="font-black text-sm tracking-wide text-slate-950 uppercase leading-tight">
                        {schoolProfile.name}
                      </h2>
                      <p className="text-[9px] text-slate-600 leading-tight">
                        TIM DISIPLIN POSITIF &amp; GURU PIKET KESISWAAN
                      </p>
                    </div>
                    <div className="w-12 shrink-0 hidden sm:block" />
                  </div>

                  {/* Title & Badge */}
                  <div className="text-center pt-1 font-sans">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase tracking-wide shadow-2xs">
                      SURAT IZIN: {activePermit.type.toUpperCase()} (DISETUJUI)
                    </span>
                  </div>

                  {/* Detail Identitas Siswa */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs font-sans text-xs space-y-2">
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-600">Nama Siswa</span>
                      <span>:</span>
                      <span className="font-black text-slate-950 text-sm uppercase">{activePermit.studentName}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-600">Kelas / NISN</span>
                      <span>:</span>
                      <span className="font-bold text-slate-900">Kelas {activePermit.className} • {activePermit.nisn || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                      <span className="text-slate-600">Waktu Disetujui</span>
                      <span>:</span>
                      <span className="text-slate-800 font-bold">
                        {formatDateIndonesian(activePermit.date)}, Pukul {activePermit.approvedAt || activePermit.timeSubmitted} WIB
                      </span>
                    </div>

                    {activePermit.subject && (
                      <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                        <span className="text-slate-600">Mata Pelajaran</span>
                        <span>:</span>
                        <span className="font-semibold text-slate-900">{activePermit.subject}</span>
                      </div>
                    )}

                    {activePermit.lessonHour && (
                      <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                        <span className="text-slate-600">Jam Pelajaran</span>
                        <span>:</span>
                        <span className="font-semibold text-slate-900">{activePermit.lessonHour}</span>
                      </div>
                    )}

                    {activePermit.willReturn && (
                      <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                        <span className="text-slate-600">Status Kepulangan</span>
                        <span>:</span>
                        <span className={`font-bold ${activePermit.willReturn === 'Kembali' ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {activePermit.willReturn === 'Kembali' ? 'Akan Kembali ke Sekolah' : 'Tidak Kembali (Izin Pulang)'}
                        </span>
                      </div>
                    )}

                    {activePermit.uniformViolationType && (
                      <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                        <span className="text-slate-600">Jenis Dispensasi</span>
                        <span>:</span>
                        <span className="font-bold text-rose-800">{activePermit.uniformViolationType}</span>
                      </div>
                    )}

                    {activePermit.startDate && activePermit.estimatedEndDate && (
                      <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                        <span className="text-slate-600">Masa Berlaku Izin</span>
                        <span>:</span>
                        <span className="font-semibold text-slate-900">
                          {formatDateIndonesian(activePermit.startDate)} s/d {formatDateIndonesian(activePermit.estimatedEndDate)}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-[130px_10px_auto] gap-x-1 pt-1 border-t border-slate-100">
                      <span className="text-slate-600">Keperluan / Alasan</span>
                      <span>:</span>
                      <span className="font-medium text-slate-900 italic">"{activePermit.reason}"</span>
                    </div>
                  </div>

                  {/* Status & QR Verifikasi */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 p-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs flex items-center justify-center">
                        <QrCode className="w-full h-full text-slate-900" />
                      </div>
                      <div className="text-left text-xs">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Verifikasi Guru Piket</div>
                        <div className="text-xs font-mono font-bold text-emerald-800">
                          DISETUJUI OLEH {activePermit.approvedBy ? activePermit.approvedBy.toUpperCase() : 'GURU PIKET'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Data resmi tercatat di SIM Dispos SMAN 1 Batu</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="text-slate-600">Guru Piket / Kesiswaan</div>
                      <div className="h-8 flex items-center justify-end">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded border border-emerald-300 uppercase">
                          VERIFIED
                        </span>
                      </div>
                      <div className="font-bold underline text-slate-900">
                        {activePermit.approvedBy || 'Petugas Piket Harian'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-5 py-2.5 rounded-2xl bg-[#E2F1FD] hover:bg-[#D0E8FB] text-[#0F172A] font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4 text-sky-700" />
                    <span>Ajukan Surat Izin Lainnya</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-xs transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak / Simpan PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* KONDISI 3: STATUS DITOLAK */}
            {activePermit.status === 'Ditolak' && (
              <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-6 animate-in fade-in zoom-in-95">
                <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black">Permohonan Izin Ditolak</h2>
                      <p className="text-xs text-rose-100">
                        Permohonan izin tidak dapat disetujui oleh Guru Piket / Kesiswaan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 text-xs">
                  <span className="font-black text-rose-900 uppercase tracking-wider block text-[11px]">
                    Alasan Penolakan dari Guru Piket:
                  </span>
                  <p className="text-rose-800 font-semibold italic bg-white p-3 rounded-xl border border-rose-100">
                    "{activePermit.rejectionReason || 'Permohonan izin tidak memenuhi persyaratan atau alasan tidak dapat diterima.'}"
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Diverifikasi oleh: <strong className="text-slate-800">{activePermit.approvedBy || 'Guru Piket'}</strong> ({activePermit.approvedAt || '-'} WIB)
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2"
                  >
                    <span>Ajukan Permohonan Baru</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : portalMode === 'STATUS_CHECK' ? (
          /* ---------------------------------------------------- */
          /* PORTAL CEK STATUS PERMOHONAN SISWA */
          /* ---------------------------------------------------- */
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-600" />
                <span>Cek Status Permohonan Izin Siswa</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pilih kelas dan nama Anda untuk melihat apakah permohonan izin hari ini sudah disetujui.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-sky-50/70 rounded-2xl border border-sky-100 text-xs">
              <div>
                <label className="block font-black text-[#0F172A] mb-1">
                  Pilih Kelas Rombel <span className="text-rose-500">*</span>
                </label>
                <select
                  value={checkClass}
                  onChange={(e) => {
                    setCheckClass(e.target.value);
                    setCheckStudentId('');
                  }}
                  className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden"
                >
                  {sortClasses(classes).map((cls) => (
                    <option key={cls.id || cls.name} value={cls.name}>
                      Kelas {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-[#0F172A] mb-1">
                  Pilih Nama Siswa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={checkStudentId}
                  onChange={(e) => setCheckStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden"
                >
                  <option value="">-- Pilih Nama Siswa ({checkClassStudents.length} Siswa) --</option>
                  {checkClassStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nisn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hasil Pencarian Izin Hari Ini */}
            <div className="space-y-3">
              <div className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                Daftar Permohonan Hari Ini ({formatDateIndonesian(getTodayDateString())}):
              </div>

              {studentPermitsToday.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  {checkStudentId
                    ? 'Belum ada permohonan izin tercatat untuk siswa yang dipilih hari ini.'
                    : 'Silakan pilih nama siswa di atas untuk melihat status permohonan izin.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentPermitsToday.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePermitId(p.id)}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{p.studentName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            Kelas {p.className}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Jenis: <strong className="text-slate-800">{p.type}</strong> • Diajukan pukul {p.timeSubmitted} WIB
                        </div>
                        <div className="text-slate-600 italic">"{p.reason}"</div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-3 py-1 rounded-xl text-[11px] font-black border ${
                          p.status === 'Disetujui' || p.status === 'Kembali'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : p.status === 'Menunggu'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {p.status === 'Disetujui' || p.status === 'Kembali'
                            ? '✓ Disetujui'
                            : p.status === 'Menunggu'
                            ? '⏳ Menunggu'
                            : '✕ Ditolak'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPortalMode('FORM')}
                className="w-full py-3 rounded-2xl bg-[#E2F1FD] hover:bg-[#D0E8FB] text-[#0F172A] font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-sky-700" />
                <span>Kembali ke Form Pengajuan Izin</span>
              </button>
            </div>
          </div>
        ) : (
          /* ---------------------------------------------------- */
          /* FORM PENGAJUAN SURAT IZIN BARU */
          /* ---------------------------------------------------- */
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-6">
            {/* Header Tabs Jenis Izin */}
            <div className="space-y-2">
              <div className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Pilih Kategori Permohonan Izin:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Tab 1: Keluar Sekolah */}
                <button
                  type="button"
                  id="tab-izin-keluar-sekolah"
                  onClick={() => setActiveTab('Keluar Sekolah')}
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex items-center gap-3 ${
                    activeTab === 'Keluar Sekolah'
                      ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-sky-400 shadow-md -translate-y-0.5'
                      : 'bg-[#E2F1FD] hover:bg-white text-[#334155] border-white/60 hover:text-[#0F172A]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'Keluar Sekolah' ? 'bg-white/20 text-white' : 'bg-white text-sky-600 shadow-xs'
                  }`}>
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black leading-tight">Izin Keluar Sekolah</div>
                    <div className={`text-[10px] mt-0.5 ${activeTab === 'Keluar Sekolah' ? 'text-sky-100' : 'text-[#64748B]'}`}>
                      Meninggalkan area sekolah
                    </div>
                  </div>
                </button>

                {/* Tab 2: Keluar Kelas */}
                <button
                  type="button"
                  id="tab-izin-keluar-kelas"
                  onClick={() => setActiveTab('Keluar Kelas')}
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex items-center gap-3 ${
                    activeTab === 'Keluar Kelas'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md -translate-y-0.5'
                      : 'bg-[#E2F1FD] hover:bg-white text-[#334155] border-white/60 hover:text-[#0F172A]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'Keluar Kelas' ? 'bg-white/20 text-white' : 'bg-white text-emerald-600 shadow-xs'
                  }`}>
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black leading-tight">Izin Keluar Kelas</div>
                    <div className={`text-[10px] mt-0.5 ${activeTab === 'Keluar Kelas' ? 'text-emerald-100' : 'text-[#64748B]'}`}>
                      Ke UKS, BK, Perpustakaan
                    </div>
                  </div>
                </button>

                {/* Tab 3: Dispensasi Seragam / Atribut */}
                <button
                  type="button"
                  id="tab-izin-seragam"
                  onClick={() => setActiveTab('Dispensasi Seragam')}
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex items-center gap-3 ${
                    activeTab === 'Dispensasi Seragam'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-md -translate-y-0.5'
                      : 'bg-[#E2F1FD] hover:bg-white text-[#334155] border-white/60 hover:text-[#0F172A]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'Dispensasi Seragam' ? 'bg-white/20 text-white' : 'bg-white text-amber-600 shadow-xs'
                  }`}>
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black leading-tight">Dispensasi Seragam</div>
                    <div className={`text-[10px] mt-0.5 ${activeTab === 'Dispensasi Seragam' ? 'text-amber-100' : 'text-[#64748B]'}`}>
                      Atribut tidak sesuai aturan
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Bagian 1: Identitas Siswa */}
              <div className="p-4 bg-[#E2F1FD]/60 rounded-2xl border border-sky-100 space-y-3">
                <div className="text-[11px] font-black text-[#0369A1] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Identitas Siswa Pemohon</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pilih Kelas */}
                  <div>
                    <label className="block font-black text-[#0F172A] mb-1">
                      Kelas Rombel <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-permit-class"
                      value={selectedClass}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-sky-500/20 cursor-pointer"
                    >
                      {sortClasses(classes).map((cls) => (
                        <option key={cls.id || cls.name} value={cls.name}>
                          Kelas {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pilih Nama Siswa dari Rombel */}
                  <div>
                    <label className="block font-black text-[#0F172A] mb-1">
                      Pilih Nama Siswa <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-permit-student"
                      value={selectedStudent?.id || ''}
                      onChange={(e) => {
                        const found = classStudents.find((s) => s.id === e.target.value);
                        if (found) handleSelectStudent(found);
                      }}
                      className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-sky-500/20 cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Nama Siswa ({classStudents.length} Siswa) --</option>
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.nisn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nama & NISN Manual jika tidak ada di list */}
                {(!selectedStudent || classStudents.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Nama Lengkap Siswa
                      </label>
                      <input
                        type="text"
                        placeholder="Ketik nama lengkap siswa..."
                        value={customStudentName}
                        onChange={(e) => setCustomStudentName(e.target.value)}
                        className="w-full px-4 py-2 bg-white rounded-2xl text-xs font-semibold text-[#0F172A] border border-sky-200 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        NISN Siswa (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 0089882201"
                        value={customNisn}
                        onChange={(e) => setCustomNisn(e.target.value)}
                        className="w-full px-4 py-2 bg-white rounded-2xl text-xs font-semibold text-[#0F172A] border border-sky-200 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bagian 2: FORM SPESIFIK BERDASARKAN JENIS IZIN */}
              {activeTab === 'Keluar Sekolah' && (
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3 animate-in fade-in">
                  <div className="text-[11px] font-black text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>2. Detail Izin Keluar Sekolah</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Mata Pelajaran Saat Ini <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Matematika / Fisika / Sejarah"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Jam Pelajaran Ke- <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={lessonHour}
                        onChange={(e) => setLessonHour(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-sky-500/20 cursor-pointer"
                      >
                        {LESSON_HOUR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pilihan: Kembali atau Tidak */}
                  <div>
                    <label className="block font-black text-[#0F172A] mb-1.5">
                      Status Kepulangan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                        willReturn === 'Kembali' 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs' 
                          : 'bg-white text-[#334155] border-slate-200 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="returnStatus"
                          value="Kembali"
                          checked={willReturn === 'Kembali'}
                          onChange={() => setWillReturn('Kembali')}
                          className="sr-only"
                        />
                        <CheckCircle2 className={`w-4 h-4 ${willReturn === 'Kembali' ? 'text-white' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-black text-xs">Kembali ke Sekolah</div>
                          <div className={`text-[10px] ${willReturn === 'Kembali' ? 'text-emerald-100' : 'text-slate-500'}`}>
                            Setelah urusan selesai
                          </div>
                        </div>
                      </label>

                      <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                        willReturn === 'Tidak Kembali' 
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs' 
                          : 'bg-white text-[#334155] border-slate-200 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="returnStatus"
                          value="Tidak Kembali"
                          checked={willReturn === 'Tidak Kembali'}
                          onChange={() => setWillReturn('Tidak Kembali')}
                          className="sr-only"
                        />
                        <LogOut className={`w-4 h-4 ${willReturn === 'Tidak Kembali' ? 'text-white' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-black text-xs">Tidak Kembali (Pulang)</div>
                          <div className={`text-[10px] ${willReturn === 'Tidak Kembali' ? 'text-amber-100' : 'text-slate-500'}`}>
                            Sakit / Urusan keluarga
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-[#0F172A] mb-1">
                      Keperluan / Alasan Keluar Sekolah <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Jelaskan alasan keperluan keluar sekolah secara lengkap (misal: Kontrol ke RSUD Karsa Husada, Mengambil perlengkapan lomba di rumah, dll)..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-medium text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-sky-500/20"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'Keluar Kelas' && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in">
                  <div className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Detail Izin Keluar Kelas (Dalam Lingkungan Sekolah)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Mata Pelajaran Saat Ini <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bahasa Indonesia / Kimia"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-emerald-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Jam Pelajaran Ke- <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={lessonHour}
                        onChange={(e) => setLessonHour(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-emerald-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        {LESSON_HOUR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-[#0F172A] mb-1">
                      Keperluan / Ruangan yang Dituju <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Contoh: Istirahat di Ruang UKS karena pusing, Mengambil buku referensi di Perpustakaan, Menghadap Guru BK, dll..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-medium text-[#0F172A] border border-emerald-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'Dispensasi Seragam' && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3 animate-in fade-in">
                  <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Detail Izin Seragam / Atribut Tidak Sesuai Ketentuan</span>
                  </div>

                  <div>
                    <label className="block font-black text-[#0F172A] mb-1">
                      Jenis Pelanggaran / Ketidaksesuaian Atribut <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={uniformViolationType}
                      onChange={(e) => setUniformViolationType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-amber-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-amber-500/20 cursor-pointer"
                    >
                      <option value="Sepatu bukan hitam polos">Sepatu bukan hitam polos / Memakai sandal</option>
                      <option value="Tidak memakai dasi / ikat pinggang resmi">Tidak memakai dasi / ikat pinggang resmi SMAN 1 Batu</option>
                      <option value="Baju / Celana / Rok tidak sesuai jadwal harian">Baju / Celana / Rok tidak sesuai jadwal harian</option>
                      <option value="Seragam basah / sobek / rusak">Seragam basah / sobek / rusak</option>
                      <option value="Kaos kaki tidak sesuai ketentuan">Kaos kaki tidak sesuai ketentuan</option>
                      <option value="Lainnya">Lainnya (Ketik Manual)</option>
                    </select>
                  </div>

                  {uniformViolationType === 'Lainnya' && (
                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Sebutkan Jenis Atribut
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Sebutkan atribut yang tidak sesuai..."
                        value={customUniformType}
                        onChange={(e) => setCustomUniformType(e.target.value)}
                        className="w-full px-4 py-2 bg-white rounded-2xl text-xs font-semibold text-[#0F172A] border border-amber-200 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Tanggal Mulai Izin <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-amber-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-amber-500/20 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-[#0F172A] mb-1">
                        Perkiraan Tanggal Selesai <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={estimatedEndDate}
                        onChange={(e) => setEstimatedEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-amber-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-amber-500/20 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-[#0F172A] mb-1">
                      Alasan / Penjelasan Izin Seragam <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Jelaskan alasan mengapa atribut/seragam tidak sesuai (misal: Sepatu hitam robek dan sedang dibeli/dijahit, Seragam belum kering karena hujan deras, dll)..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-medium text-[#0F172A] border border-amber-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Sistem Disiplin Positif SMAN 1 Batu</span>
                </div>

                <button
                  type="submit"
                  id="btn-submit-student-permit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-md hover:shadow-sky-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Permohonan Surat Izin</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-sky-200/80 space-y-1">
          <p>© 2026 {schoolProfile.name} • Sistem Informasi Presensi &amp; Disiplin Positif Siswa</p>
          <p className="text-[10px] text-sky-300/70">
            Form ini dapat diakses langsung oleh siswa tanpa login melalui pemindaian QR Code di Meja Guru Piket.
          </p>
        </div>
      </div>
    </div>
  );
};
