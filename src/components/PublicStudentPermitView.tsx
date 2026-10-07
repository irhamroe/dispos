import React, { useState, useMemo } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { Student, SchoolProfile, StudentPermitRecord, StudentPermitType } from '../types';
import { RombelClass } from '../data/initialData';
import { formatDateIndonesian, formatDayAndDateIndonesian, getTodayDateString, getTodayIndonesian } from '../utils/exportUtils';
import { sortClasses, sortStudents } from '../utils/sortUtils';

interface PublicStudentPermitViewProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  classes: RombelClass[];
  onSubmitPermit: (permit: StudentPermitRecord) => void;
  onBackToLogin: () => void;
}

export const PublicStudentPermitView: React.FC<PublicStudentPermitViewProps> = ({
  schoolProfile,
  students,
  classes,
  onSubmitPermit,
  onBackToLogin,
}) => {
  const [activeTab, setActiveTab] = useState<StudentPermitType>('Keluar Sekolah');

  // Form states
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [customNisn, setCustomNisn] = useState<string>('');

  // Form Fields for Exit School / Exit Class
  const [subject, setSubject] = useState<string>('');
  const [lessonHour, setLessonHour] = useState<string>('Jam ke-3 s/d 4');
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

  // Submission success state (Digital e-Pass Preview)
  const [submittedPermit, setSubmittedPermit] = useState<StudentPermitRecord | null>(null);

  // Filter students in the selected class
  const classStudents = useMemo(() => {
    const list = students.filter((s) => s.className === selectedClass);
    return sortStudents(list);
  }, [students, selectedClass]);

  // Handle student selection from dropdown
  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setCustomStudentName(s.name);
    setCustomNisn(s.nisn);
  };

  // Pre-fill student if student search matches or dropdown changes
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

    let prefix = 'IZIN-KS';
    if (activeTab === 'Keluar Kelas') prefix = 'IZIN-KK';
    if (activeTab === 'Dispensasi Seragam') prefix = 'IZIN-SG';

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const permitNumber = `${prefix}-${todayDate.replace(/-/g, '')}-${randomSuffix}`;
    const qrCode = `VERIF-${permitNumber}-SMAN1BATU`;

    const newPermit: StudentPermitRecord = {
      id: `prm-${Date.now()}`,
      permitNumber,
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
    setSubmittedPermit(newPermit);
  };

  const handleResetForm = () => {
    setSubmittedPermit(null);
    setReason('');
    setSubject('');
    setCustomStudentName('');
    setCustomNisn('');
    setSelectedStudent(null);
  };

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

          <button
            type="button"
            onClick={onBackToLogin}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Kembali ke portal login guru"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Portal Guru</span>
          </button>
        </div>

        {/* JIKA SUDAH BERHASIL SUBMIT: TAMPILKAN E-SURAT IZIN DIGITAL RESMI */}
        {submittedPermit ? (
          <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-6 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black">Permohonan Izin Berhasil Terkirim!</h2>
                  <p className="text-xs text-emerald-100">
                    Tunjukkan e-Surat Izin ini kepada Guru Piket / Satpam untuk verifikasi persetujuan.
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
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-900 border border-sky-300 uppercase tracking-wide">
                  SURAT IZIN: {submittedPermit.type.toUpperCase()}
                </span>
                <div className="text-xs text-slate-600 font-mono mt-1">
                  No: <strong className="text-slate-900">{submittedPermit.permitNumber}</strong>
                </div>
              </div>

              {/* Detail Identitas Siswa */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs font-sans text-xs space-y-2">
                <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                  <span className="text-slate-600">Nama Siswa</span>
                  <span>:</span>
                  <span className="font-black text-slate-950 text-sm uppercase">{submittedPermit.studentName}</span>
                </div>
                <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                  <span className="text-slate-600">Kelas / NISN</span>
                  <span>:</span>
                  <span className="font-bold text-slate-900">Kelas {submittedPermit.className} • {submittedPermit.nisn}</span>
                </div>
                <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                  <span className="text-slate-600">Waktu Pengajuan</span>
                  <span>:</span>
                  <span className="text-slate-800">{formatDateIndonesian(submittedPermit.date)}, Pukul {submittedPermit.timeSubmitted} WIB</span>
                </div>

                {submittedPermit.subject && (
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Mata Pelajaran</span>
                    <span>:</span>
                    <span className="font-semibold text-slate-900">{submittedPermit.subject}</span>
                  </div>
                )}

                {submittedPermit.lessonHour && (
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Jam Pelajaran</span>
                    <span>:</span>
                    <span className="font-semibold text-slate-900">{submittedPermit.lessonHour}</span>
                  </div>
                )}

                {submittedPermit.willReturn && (
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Status Kepulangan</span>
                    <span>:</span>
                    <span className={`font-bold ${submittedPermit.willReturn === 'Kembali' ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {submittedPermit.willReturn === 'Kembali' ? 'Akan Kembali ke Sekolah' : 'Tidak Kembali (Izin Pulang)'}
                    </span>
                  </div>
                )}

                {submittedPermit.uniformViolationType && (
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Jenis Dispensasi</span>
                    <span>:</span>
                    <span className="font-bold text-rose-800">{submittedPermit.uniformViolationType}</span>
                  </div>
                )}

                {submittedPermit.startDate && submittedPermit.estimatedEndDate && (
                  <div className="grid grid-cols-[130px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Masa Berlaku Izin</span>
                    <span>:</span>
                    <span className="font-semibold text-slate-900">
                      {formatDateIndonesian(submittedPermit.startDate)} s/d {formatDateIndonesian(submittedPermit.estimatedEndDate)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-[130px_10px_auto] gap-x-1 pt-1 border-t border-slate-100">
                  <span className="text-slate-600">Keperluan / Alasan</span>
                  <span>:</span>
                  <span className="font-medium text-slate-900 italic">"{submittedPermit.reason}"</span>
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
                    <div className="text-xs font-mono font-bold text-slate-800">{submittedPermit.qrVerificationCode}</div>
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Data tercatat di SIM Dispos SMAN 1 Batu</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-600">Guru Piket / Kesiswaan</div>
                  <div className="h-10" />
                  <div className="font-bold underline text-slate-900">Petugas Piket Harian</div>
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
                <Send className="w-4 h-4 text-sky-700" />
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
        ) : (
          /* FORM PENGAJUAN SURAT IZIN */
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
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Jam ke-3 s/d 4 (09.00 - 10.30)"
                        value={lessonHour}
                        onChange={(e) => setLessonHour(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-sky-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-sky-500/20"
                      />
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
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Jam ke-5 (10.45 - 11.30)"
                        value={lessonHour}
                        onChange={(e) => setLessonHour(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-2xl text-xs font-bold text-[#0F172A] border border-emerald-200 shadow-2xs focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20"
                      />
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
