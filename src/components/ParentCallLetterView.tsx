import React, { useState, useMemo, useRef } from 'react';
import { 
  Mail, 
  Printer, 
  Download, 
  Search, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  MessageSquare, 
  Layers, 
  Users, 
  Copy, 
  ChevronRight,
  Sparkles,
  Info,
  CalendarDays,
  Send
} from 'lucide-react';
import { 
  Student, 
  DisciplineRecord, 
  SchoolProfile, 
  WaliKelasTeacher 
} from '../types';
import { RombelClass } from '../data/initialData';
import { 
  formatDateIndonesian, 
  formatDayAndDateIndonesian, 
  getTodayDateString, 
  getTodayIndonesian,
  exportParentCallLetterToPdf,
  ParentCallLetterData
} from '../utils/exportUtils';

interface ParentCallLetterViewProps {
  students: Student[];
  disciplineRecords: DisciplineRecord[];
  classes: RombelClass[];
  waliKelasList: WaliKelasTeacher[];
  schoolProfile: SchoolProfile;
  currentUserName: string;
}

export const ParentCallLetterView: React.FC<ParentCallLetterViewProps> = ({
  students,
  disciplineRecords,
  classes,
  waliKelasList,
  schoolProfile,
  currentUserName,
}) => {
  // Filters for student selection
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [onlyWithViolations, setOnlyWithViolations] = useState<boolean>(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Selected violations to include in letter
  const [selectedViolationIds, setSelectedViolationIds] = useState<string[]>([]);

  // Letter form parameters
  const [letterNumber, setLetterNumber] = useState<string>(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    return `421.3/BK-SP/${currentYear}/${currentMonth}/001`;
  });
  const [callNumber, setCallNumber] = useState<string>('Panggilan I');
  const [callDate, setCallDate] = useState<string>(() => {
    // Default: 2 days ahead
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().slice(0, 10);
  });
  const [callTime, setCallTime] = useState<string>('08:30 WIB');
  const [callPlace, setCallPlace] = useState<string>('Ruang Bimbingan & Konseling (BK) SMAN 1 Batu');
  const [meetWith, setMeetWith] = useState<string>('Guru BK & Wali Kelas');
  const [agenda, setAgenda] = useState<string>(
    'Pembahasan evaluasi ketertiban dan pembinaan kedisiplinan bersama orang tua/wali murid.'
  );
  const [notes, setNotes] = useState<string>(
    'Mohon membawa surat panggilan ini dan hadir tepat waktu. Jika berhalangan hadir, harap menghubungi pihak sekolah terlebih dahulu.'
  );
  const [senderTitle, setSenderTitle] = useState<string>('Guru Bimbingan & Konseling (BK)');
  const [senderName, setSenderName] = useState<string>(currentUserName || 'Tim Bimbingan Konseling');

  // Copy notification alert
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Group discipline records by studentId for fast lookup
  const studentViolationsMap = useMemo(() => {
    const map = new Map<string, DisciplineRecord[]>();
    disciplineRecords.forEach((rec) => {
      const existing = map.get(rec.studentId) || [];
      existing.push(rec);
      map.set(rec.studentId, existing);
    });
    // Sort each student's violations descending by date
    map.forEach((list) => {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return map;
  }, [disciplineRecords]);

  // Filter students based on class, violation status, and search query
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'ALL' && s.className !== selectedClass) return false;
      const violations = studentViolationsMap.get(s.id) || [];
      if (onlyWithViolations && violations.length === 0) return false;
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesNisn = s.nisn.toLowerCase().includes(q);
        if (!matchesName && !matchesNisn) return false;
      }
      return true;
    });
  }, [students, selectedClass, onlyWithViolations, studentSearchQuery, studentViolationsMap]);

  // Set default student if current selection becomes invalid
  const selectedStudent = useMemo(() => {
    if (selectedStudentId) {
      const found = students.find((s) => s.id === selectedStudentId);
      if (found) return found;
    }
    return filteredStudents[0] || students[0] || null;
  }, [selectedStudentId, students, filteredStudents]);

  // All violations for the currently selected student
  const studentAllViolations = useMemo(() => {
    if (!selectedStudent) return [];
    return studentViolationsMap.get(selectedStudent.id) || [];
  }, [selectedStudent, studentViolationsMap]);

  // Whenever selected student changes, select all their violations by default and update letter number
  React.useEffect(() => {
    if (selectedStudent) {
      const allIds = (studentViolationsMap.get(selectedStudent.id) || []).map((v) => v.id);
      setSelectedViolationIds(allIds);

      // Auto personalize letter number with student NISN suffix
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const suffix = selectedStudent.nisn.slice(-4) || '001';
      setLetterNumber(`421.3/BK-SP/${currentYear}/${currentMonth}/${suffix}`);
    }
  }, [selectedStudent?.id, studentViolationsMap]);

  // Wali Kelas for the selected student
  const studentWaliKelas = useMemo(() => {
    if (!selectedStudent) return undefined;
    return waliKelasList.find((w) => w.className === selectedStudent.className);
  }, [selectedStudent, waliKelasList]);

  // Violations included in the call letter
  const includedViolations = useMemo(() => {
    return studentAllViolations.filter((v) => selectedViolationIds.includes(v.id));
  }, [studentAllViolations, selectedViolationIds]);

  const totalPoints = useMemo(() => {
    return includedViolations.reduce((sum, v) => sum + (v.points || 0), 0);
  }, [includedViolations]);

  // Toggle single violation
  const handleToggleViolation = (id: string) => {
    setSelectedViolationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all violations
  const handleSelectAllViolations = () => {
    if (selectedViolationIds.length === studentAllViolations.length) {
      setSelectedViolationIds([]);
    } else {
      setSelectedViolationIds(studentAllViolations.map((v) => v.id));
    }
  };

  // Export PDF Handler
  const handleExportPdf = () => {
    if (!selectedStudent) return;
    const letterData: ParentCallLetterData = {
      schoolProfile,
      student: selectedStudent,
      waliKelas: studentWaliKelas,
      violations: includedViolations,
      letterNumber,
      callNumber,
      callDate,
      callTime,
      callPlace,
      meetWith,
      agenda,
      notes,
      senderTitle,
      senderName,
    };
    exportParentCallLetterToPdf(letterData);
  };

  // Print Document Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy WhatsApp message text
  const handleCopyWhatsApp = () => {
    if (!selectedStudent) return;
    const parentPhone = selectedStudent.parentPhone || selectedStudent.phone || '-';
    const text = `*SURAT PANGGILAN ORANG TUA / WALI SISWA*
${schoolProfile.name}
----------------------------------------
Yth. Bapak/Ibu Wali dari:
*Nama Siswa:* ${selectedStudent.name}
*NISN / Kelas:* ${selectedStudent.nisn} / ${selectedStudent.className}

Sehubungan dengan akumulasi catatan pelanggaran tata tertib sekolah (${totalPoints} Poin dari ${includedViolations.length} catatan), kami mengharap kehadiran Bapak/Ibu pada:

📅 *Hari/Tanggal:* ${formatDayAndDateIndonesian(callDate)}
⏰ *Pukul:* ${callTime}
📍 *Tempat:* ${callPlace}
👥 *Menghadap:* ${meetWith}
📋 *Agenda:* ${agenda}

_Catatan:_ ${notes}

Nomor Surat Resmi: ${letterNumber}
Terima kasih atas perhatian dan kerja samanya.
*Tim BK & Ketertiban ${schoolProfile.name}*`;

    navigator.clipboard.writeText(text);
    setCopyFeedback('Template pesan WhatsApp berhasil disalin ke clipboard!');
    setTimeout(() => setCopyFeedback(null), 3500);
  };

  // Open direct WhatsApp chat if phone exists
  const handleOpenWhatsApp = () => {
    if (!selectedStudent) return;
    const phone = selectedStudent.parentPhone || selectedStudent.phone || '';
    if (!phone) {
      alert('Nomor telepon orang tua belum terdaftar pada data siswa ini.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const text = encodeURIComponent(`*SURAT PANGGILAN ORANG TUA / WALI SISWA*
${schoolProfile.name}
----------------------------------------
Yth. Bapak/Ibu Orang Tua dari:
*Nama Siswa:* ${selectedStudent.name} (Kelas ${selectedStudent.className})

Sehubungan dengan catatan tata tertib siswa di sekolah, kami mengundang Bapak/Ibu untuk hadir pada:
📅 *Hari/Tanggal:* ${formatDayAndDateIndonesian(callDate)}
⏰ *Pukul:* ${callTime}
📍 *Tempat:* ${callPlace}
👥 *Menghadap:* ${meetWith}
📋 *Agenda:* ${agenda}

Nomor Surat: ${letterNumber}
Terima kasih atas kerja samanya.`);

    window.open(`https://wa.me/${finalPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Print-specific style to isolate the letter when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-call-letter, #printable-call-letter * {
            visibility: visible;
          }
          #printable-call-letter {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <span>Disiplin Positif</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-bold">Surat Panggilan Orang Tua</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <span>Surat Panggilan Orang Tua / Wali Murid</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan surat panggilan resmi lengkap dengan rekapitulasi riwayat pelanggaran tata tertib siswa SMAN 1 Batu.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-amber-50 rounded-xl border border-amber-200/60 text-right">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Total Kasus</div>
            <div className="text-base font-extrabold text-amber-900">{disciplineRecords.length} Pelanggaran</div>
          </div>
          <div className="px-3 py-2 bg-teal-50 rounded-xl border border-teal-200/60 text-right">
            <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Siswa Terdata</div>
            <div className="text-base font-extrabold text-teal-900">{studentViolationsMap.size} Siswa</div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {copyFeedback && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Main Grid: Controls & Letter Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Form (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* STEP 1: PILIH KELAS & SISWA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold text-slate-800">Pilih Kelas & Siswa</h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {filteredStudents.length} siswa ditemukan
              </span>
            </div>

            {/* Filter Kelas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Pilih Kelas Siswa</span>
              </label>
              <select
                id="select-call-class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">Semua Kelas (36 Rombel X, XI, XII)</option>
                {classes.map((cls) => (
                  <option key={cls.id || cls.name} value={cls.name}>
                    Kelas {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search and Toggle Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama siswa atau NISN..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyWithViolations}
                  onChange={(e) => setOnlyWithViolations(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Hanya tampilkan siswa yang memiliki catatan pelanggaran</span>
              </label>
            </div>

            {/* Select Student Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>Pilih Nama Siswa</span>
                </span>
                {selectedStudent && (
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                    NISN: {selectedStudent.nisn}
                  </span>
                )}
              </label>
              
              {filteredStudents.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  Tidak ada siswa yang sesuai kriteria pencarian di kelas ini.
                </div>
              ) : (
                <select
                  id="select-call-student"
                  value={selectedStudent?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {filteredStudents.map((s) => {
                    const viols = studentViolationsMap.get(s.id) || [];
                    const pts = viols.reduce((acc, v) => acc + (v.points || 0), 0);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className}) — {viols.length} Pelanggaran ({pts} Poin)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Student Info Card */}
            {selectedStudent && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedStudent.photoUrl ? (
                      <img
                        src={selectedStudent.photoUrl}
                        alt={selectedStudent.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                        selectedStudent.gender === 'L' ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}>
                        {selectedStudent.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm leading-tight">{selectedStudent.name}</div>
                      <div className="text-slate-500 text-[11px] font-medium mt-0.5">
                        NISN: {selectedStudent.nisn} • {selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-600 text-white font-bold rounded-lg text-[11px] shrink-0">
                    Kelas {selectedStudent.className}
                  </span>
                </div>

                {selectedStudent.address && (
                  <div className="pt-2 border-t border-slate-200/70 text-[11px] flex items-start gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{selectedStudent.address}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Wali Kelas:</span>
                    <span className="font-semibold text-slate-700">{studentWaliKelas?.name || 'Belum diatur'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kontak Orang Tua:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedStudent.parentPhone || selectedStudent.phone || 'Belum ada nomor'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                  <span className="text-slate-600 font-medium">Akumulasi Pelanggaran:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-amber-100 text-amber-800">
                      {studentAllViolations.length} Kasus
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800">
                      {totalPoints} Poin
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: DAFTAR PELANGGARAN YANG DITAMPILKAN DALAM SURAT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold text-slate-800">Daftar Pelanggaran Yang Pernah Dilakukan</h2>
              </div>
              {studentAllViolations.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllViolations}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                >
                  {selectedViolationIds.length === studentAllViolations.length
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua'}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Centang pelanggaran yang ingin dimasukkan ke dalam lampiran surat panggilan orang tua. Secara otomatis seluruh riwayat tercentang.
            </p>

            {studentAllViolations.length === 0 ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-emerald-900">Siswa Ini Tidak Memiliki Catatan Pelanggaran</div>
                <p className="text-[11px] text-emerald-700">
                  Siswa berstatus bersih dan tertib. Surat panggilan tetap dapat diterbitkan untuk agenda bimbingan rutin atau koordinasi orang tua.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {studentAllViolations.map((rec) => {
                  const isChecked = selectedViolationIds.includes(rec.id);
                  const isCoached = rec.coachingStatus === 'Sudah';
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleToggleViolation(rec.id)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 truncate">{rec.violationName}</span>
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] shrink-0">
                            +{rec.points} Poin
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
                          <span>{formatDateIndonesian(rec.date)}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{rec.category}</span>
                          <span>•</span>
                          <span className={isCoached ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                            {isCoached ? 'Sudah Dibina' : 'Belum Pembinaan'}
                          </span>
                        </div>

                        {rec.description && (
                          <p className="text-[10.5px] text-slate-600 italic mt-1 bg-white/70 p-1.5 rounded border border-slate-200/50">
                            "{rec.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {studentAllViolations.length > 0 && (
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">Total Pelanggaran Terpilih:</span>
                <span className="font-bold text-amber-300 text-sm">
                  {includedViolations.length} Kasus • {totalPoints} Poin
                </span>
              </div>
            )}
          </div>

          {/* STEP 3: FORM DETAIL SURAT PANGGILAN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">3</span>
              <h2 className="text-sm font-bold text-slate-800">Detail Surat & Jadwal Panggilan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Surat</label>
                <input
                  type="text"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tingkat Panggilan</label>
                <select
                  value={callNumber}
                  onChange={(e) => setCallNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="Panggilan I">Panggilan I (Pertama)</option>
                  <option value="Panggilan II">Panggilan II (Kedua)</option>
                  <option value="Panggilan III">Panggilan III (Peringatan Terakhir)</option>
                  <option value="Khusus BK">Panggilan Khusus Bimbingan Konseling</option>
                  <option value="Konferensi Kasus">Konferensi Kasus Tim Ketertiban</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tanggal Panggilan</span>
                </label>
                <input
                  type="date"
                  value={callDate}
                  onChange={(e) => setCallDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Waktu / Pukul</span>
                </label>
                <input
                  type="text"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  placeholder="Contoh: 08:30 WIB"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tempat Pertemuan</span>
                </label>
                <input
                  type="text"
                  value={callPlace}
                  onChange={(e) => setCallPlace(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Menghadap Kepada</label>
                <input
                  type="text"
                  value={meetWith}
                  onChange={(e) => setMeetWith(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Keperluan / Agenda</label>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan untuk Orang Tua</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan Pembuat Surat</label>
                <input
                  type="text"
                  value={senderTitle}
                  onChange={(e) => setSenderTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Petugas Pembuat</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW DOKUMEN & TOMBOL AKSI (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Action Buttons Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Aksi Dokumen:</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                Ukuran Cetak A4 Portrait
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-print-call-letter"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Cetak surat langsung ke printer atau Save as PDF browser"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Surat</span>
              </button>

              <button
                type="button"
                id="btn-download-pdf-call-letter"
                onClick={handleExportPdf}
                className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Unduh berkas PDF resmi SMAN 1 Batu"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>

              <button
                type="button"
                id="btn-copy-wa-message"
                onClick={handleCopyWhatsApp}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Salin ringkasan pesan panggilan untuk dikirim ke WhatsApp orang tua"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin WA</span>
              </button>

              {selectedStudent?.parentPhone && (
                <button
                  type="button"
                  id="btn-open-wa"
                  onClick={handleOpenWhatsApp}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Buka WhatsApp Web langsung ke orang tua"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
              )}
            </div>
          </div>

          {/* OFFICIAL LETTER PREVIEW (Printable Container) */}
          <div
            id="printable-call-letter"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 font-serif text-slate-900 text-xs leading-relaxed space-y-4"
          >
            {/* KOP SURAT RESMI */}
            <div className="text-center pb-3">
              <h3 className="font-bold text-xs tracking-wider text-slate-800 uppercase font-sans">
                Pemerintah Provinsi Jawa Timur
              </h3>
              <h3 className="font-bold text-xs tracking-wider text-slate-800 uppercase font-sans">
                Dinas Pendidikan
              </h3>
              <h2 className="font-extrabold text-base tracking-wide text-slate-950 uppercase font-sans mt-0.5">
                {schoolProfile.name}
              </h2>
              <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                {schoolProfile.address}, {schoolProfile.city}, Jawa Timur {schoolProfile.postalCode || '65314'} | NPSN: {schoolProfile.npsn}
              </p>
            </div>

            {/* Garis Pembatas Kop Surat */}
            <div className="space-y-0.5 pb-2">
              <div className="h-[2px] bg-slate-900 w-full" />
              <div className="h-[0.5px] bg-slate-900 w-full" />
            </div>

            {/* Nomor & Tanggal Surat */}
            <div className="flex justify-between items-start font-sans text-xs">
              <div className="space-y-1">
                <div className="grid grid-cols-[80px_10px_auto] gap-x-1">
                  <span>Nomor</span>
                  <span>:</span>
                  <span className="font-semibold text-slate-900">{letterNumber}</span>
                </div>
                <div className="grid grid-cols-[80px_10px_auto] gap-x-1">
                  <span>Sifat</span>
                  <span>:</span>
                  <span>Penting / Rahasia</span>
                </div>
                <div className="grid grid-cols-[80px_10px_auto] gap-x-1">
                  <span>Lampiran</span>
                  <span>:</span>
                  <span>1 (satu) Berkas Riwayat Pelanggaran</span>
                </div>
                <div className="grid grid-cols-[80px_10px_auto] gap-x-1">
                  <span>Perihal</span>
                  <span>:</span>
                  <span className="font-bold text-slate-900">
                    Surat Panggilan Orang Tua / Wali Murid ({callNumber})
                  </span>
                </div>
              </div>

              <div className="text-right text-xs">
                Kota Batu, {getTodayIndonesian()}
              </div>
            </div>

            {/* Tujuan Surat */}
            <div className="pt-2 font-sans text-xs space-y-1">
              <div>Kepada Yth.</div>
              <div className="font-bold">Bapak / Ibu Orang Tua / Wali Murid dari:</div>
              <div className="pl-3 space-y-0.5 pt-0.5 text-slate-800">
                <div className="grid grid-cols-[90px_10px_auto] gap-x-1">
                  <span className="text-slate-600">Nama Siswa</span>
                  <span>:</span>
                  <span className="font-bold text-slate-950 uppercase">{selectedStudent?.name || '-'}</span>
                </div>
                <div className="grid grid-cols-[90px_10px_auto] gap-x-1">
                  <span className="text-slate-600">NISN / Kelas</span>
                  <span>:</span>
                  <span>
                    {selectedStudent?.nisn || '-'} / Kelas {selectedStudent?.className || '-'} ({selectedStudent?.gender === 'L' ? 'Laki-laki' : 'Perempuan'})
                  </span>
                </div>
                {studentWaliKelas && (
                  <div className="grid grid-cols-[90px_10px_auto] gap-x-1">
                    <span className="text-slate-600">Wali Kelas</span>
                    <span>:</span>
                    <span>{studentWaliKelas.name}</span>
                  </div>
                )}
              </div>
              <div className="pt-1">di Tempat</div>
            </div>

            {/* Paragraf Pembuka */}
            <div className="pt-2 space-y-2">
              <p>Dengan hormat,</p>
              <p className="text-justify indent-6">
                Sehubungan dengan pembinaan tata tertib serta kedisiplinan siswa di lingkungan SMA Negeri 1 Batu, bersama ini kami sampaikan rincian riwayat pelanggaran tata tertib sekolah yang pernah tercatat atas nama putra/putri Bapak/Ibu sebagai berikut:
              </p>
            </div>

            {/* TABEL DAFTAR PELANGGARAN YANG DILAKUKAN SISWA */}
            <div className="py-2">
              <div className="text-[11px] font-sans font-bold text-slate-800 uppercase mb-1.5 flex items-center justify-between">
                <span>Rincian Catatan Pelanggaran Siswa</span>
                <span className="text-slate-500 font-normal normal-case">
                  Total: {includedViolations.length} Catatan Kejadian
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-300 font-sans text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th className="border border-slate-300 py-1.5 px-2 w-8 text-center">No</th>
                    <th className="border border-slate-300 py-1.5 px-2 w-24 text-center">Tanggal</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">Nama / Jenis Pelanggaran</th>
                    <th className="border border-slate-300 py-1.5 px-2 w-20 text-center">Kategori</th>
                    <th className="border border-slate-300 py-1.5 px-2 w-16 text-center">Poin</th>
                    <th className="border border-slate-300 py-1.5 px-2 w-28 text-center">Status Pembinaan</th>
                  </tr>
                </thead>
                <tbody>
                  {includedViolations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 py-3 text-center text-slate-500 italic">
                        Tidak ada catatan pelanggaran khusus / Pembinaan preventif berkala.
                      </td>
                    </tr>
                  ) : (
                    includedViolations.map((v, idx) => (
                      <tr key={v.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center whitespace-nowrap">{v.date}</td>
                        <td className="border border-slate-300 py-1.5 px-2">
                          <span className="font-bold text-slate-900">{v.violationName}</span>
                          {v.description && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5 leading-snug">
                              Ket: {v.description}
                            </div>
                          )}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">{v.category}</td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-rose-700">
                          {v.points}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">
                          {v.coachingStatus === 'Sudah' ? (
                            <span className="text-emerald-700 font-semibold">Sudah Dibina</span>
                          ) : (
                            <span className="text-rose-700 font-semibold">Belum Dibina</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {includedViolations.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-400">
                      <td colSpan={4} className="border border-slate-300 py-1.5 px-3 text-right">
                        TOTAL AKUMULASI POIN PELANGGARAN:
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center text-rose-700 font-black text-xs">
                        {totalPoints} Poin
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-500 text-[10px]">
                        {totalPoints >= 50 ? 'Kategori Kritis (BK)' : totalPoints >= 25 ? 'Perhatian Khusus' : 'Tahap Pembinaan'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Paragraf Undangan & Jadwal Panggilan */}
            <div className="pt-2 space-y-2">
              <p className="text-justify indent-6">
                Guna mencari solusi bersama serta langkah pembinaan terbaik demi kelancaran proses belajar dan masa depan putra/putri Bapak/Ibu, kami sangat mengharap kehadiran Bapak/Ibu pada:
              </p>

              <div className="pl-6 font-sans text-xs space-y-1.5 py-1">
                <div className="grid grid-cols-[140px_10px_auto] gap-x-1">
                  <span className="font-semibold text-slate-700">Hari / Tanggal</span>
                  <span>:</span>
                  <span className="font-bold text-slate-900">{formatDayAndDateIndonesian(callDate)}</span>
                </div>
                <div className="grid grid-cols-[140px_10px_auto] gap-x-1">
                  <span className="font-semibold text-slate-700">Waktu / Pukul</span>
                  <span>:</span>
                  <span className="font-bold text-slate-900">{callTime}</span>
                </div>
                <div className="grid grid-cols-[140px_10px_auto] gap-x-1">
                  <span className="font-semibold text-slate-700">Tempat Pertemuan</span>
                  <span>:</span>
                  <span>{callPlace}</span>
                </div>
                <div className="grid grid-cols-[140px_10px_auto] gap-x-1">
                  <span className="font-semibold text-slate-700">Menghadap Kepada</span>
                  <span>:</span>
                  <span className="font-semibold text-slate-900">{meetWith}</span>
                </div>
                <div className="grid grid-cols-[140px_10px_auto] gap-x-1">
                  <span className="font-semibold text-slate-700">Keperluan / Agenda</span>
                  <span>:</span>
                  <span>{agenda}</span>
                </div>
                {notes && (
                  <div className="grid grid-cols-[140px_10px_auto] gap-x-1">
                    <span className="font-semibold text-slate-700">Catatan Khusus</span>
                    <span>:</span>
                    <span className="italic text-slate-600">{notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Paragraf Penutup */}
            <div className="pt-2 space-y-2">
              <p className="text-justify indent-6">
                Mengingat pentingnya pertemuan ini demi masa depan pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang ditentukan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
              </p>
            </div>

            {/* TANDA TANGAN RESMI */}
            <div className="pt-8 grid grid-cols-2 text-center font-sans text-xs">
              <div>
                <p>{senderTitle},</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">
                  {senderName || '(..................................................)'}
                </p>
                <p className="text-[10.5px] text-slate-500">Tim Bimbingan Konseling & Tatib</p>
              </div>

              <div>
                <p>Kepala {schoolProfile.name},</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">{schoolProfile.principalName}</p>
                <p className="text-[10.5px] text-slate-500">NIP. {schoolProfile.principalNip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
