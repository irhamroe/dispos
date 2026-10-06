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
  Send,
  UserCheck,
  Award
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
  getDayNameIndonesian,
  getTodayDateString, 
  getTodayIndonesian,
  exportParentCallLetterToPdf,
  ParentCallLetterData
} from '../utils/exportUtils';
import { sortClasses, sortStudents } from '../utils/sortUtils';
import { getGoogleDriveDirectImageUrl } from '../services/googleDriveService';

interface ParentCallLetterViewProps {
  students: Student[];
  disciplineRecords: DisciplineRecord[];
  classes: RombelClass[];
  waliKelasList: WaliKelasTeacher[];
  schoolProfile: SchoolProfile;
  onUpdateSchoolProfile?: (profile: Partial<SchoolProfile>) => void;
  currentUserName: string;
  enablePointsSystem?: boolean;
}

export const ParentCallLetterView: React.FC<ParentCallLetterViewProps> = ({
  students,
  disciplineRecords,
  classes,
  waliKelasList,
  schoolProfile,
  onUpdateSchoolProfile,
  currentUserName,
  enablePointsSystem = true,
}) => {
  // Filters for student selection
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [onlyWithViolations, setOnlyWithViolations] = useState<boolean>(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Selected violations to include in letter
  const [selectedViolationIds, setSelectedViolationIds] = useState<string[]>([]);

  // Letter form parameters (Official template as per document)
  const [letterDate, setLetterDate] = useState<string>(() => getTodayDateString());
  const [letterNumber, setLetterNumber] = useState<string>('400.3.8/ 1702 /101.6.10.26/2026');
  const [perihal, setPerihal] = useState<string>('Koordinasi Pembinaan Siswa');
  const [callDate, setCallDate] = useState<string>(() => {
    // Default: 1 day ahead
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  });
  const [callTime, setCallTime] = useState<string>('Pukul 12.30 WIB – selesai');
  const [callPlace, setCallPlace] = useState<string>('Ruang Disiplin Positif SMA Negeri 1 Batu');
  const [principalName, setPrincipalName] = useState<string>(() => schoolProfile.principalName || 'Drs. Rr. Wulandari Wahyuningsih, M.Pd.');
  const [principalRank, setPrincipalRank] = useState<string>(() => schoolProfile.principalRank || 'Pembina Utama Muda, IV/c');
  const [principalNip, setPrincipalNip] = useState<string>(() => schoolProfile.principalNip || '19670815 199412 2 003');

  // Synchronize principal name, rank, and NIP if schoolProfile changes
  React.useEffect(() => {
    if (schoolProfile.principalName) setPrincipalName(schoolProfile.principalName);
    if (schoolProfile.principalRank) setPrincipalRank(schoolProfile.principalRank);
    if (schoolProfile.principalNip) setPrincipalNip(schoolProfile.principalNip);
  }, [schoolProfile.principalName, schoolProfile.principalRank, schoolProfile.principalNip]);

  // Handlers to update & persist Principal info immediately
  const handlePrincipalNameChange = (val: string) => {
    setPrincipalName(val);
    onUpdateSchoolProfile?.({ principalName: val });
  };

  const handlePrincipalRankChange = (val: string) => {
    setPrincipalRank(val);
    onUpdateSchoolProfile?.({ principalRank: val });
  };

  const handlePrincipalNipChange = (val: string) => {
    setPrincipalNip(val);
    onUpdateSchoolProfile?.({ principalNip: val });
  };

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
    const list = students.filter((s) => {
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
    return sortStudents(list);
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
      const suffix = selectedStudent.nisn.slice(-4) || '1702';
      setLetterNumber(`400.3.8/${suffix}/101.6.10.26/${currentYear}`);
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
      letterDate,
      callDate,
      callTime,
      callPlace,
      principalName,
      principalRank,
      principalNip,
      enablePointsSystem,
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
    const pointsText = enablePointsSystem
      ? ` (${totalPoints} Poin dari ${includedViolations.length} catatan)`
      : ` (${includedViolations.length} catatan pelanggaran)`;
    const text = `*SURAT PANGGILAN ORANG TUA / WALI MURID*
${schoolProfile.name}
----------------------------------------
Nomor: ${letterNumber}
Perihal: ${perihal}

Kepada Yth.
Bapak/Ibu Orang Tua/Wali Murid
*${selectedStudent.name} (${selectedStudent.className})*
di Tempat

Sehubungan dengan adanya permasalahan yang harus diselesaikan bersama, maka kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali Murid beserta siswa, pada:

📅 *Hari:* ${getDayNameIndonesian(callDate)}
📆 *Tanggal:* ${formatDateIndonesian(callDate)}
⏰ *Waktu:* ${callTime}
📍 *Tempat:* ${callPlace}

Adapun rincian pelanggaran tata tertib tercatat${pointsText}.

Mengingat pentingnya hal tersebut, maka kami mengharapkan Bapak/Ibu untuk datang tepat pada waktu yang telah ditentukan.

Demikian atas perhatian dan kerjasama yang baik disampaikan terima kasih.

*Kepala ${schoolProfile.name}*
${principalName}
${principalRank ? `${principalRank}\n` : ''}NIP. ${principalNip}`;

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
    const text = encodeURIComponent(`*SURAT PANGGILAN ORANG TUA / WALI MURID*
${schoolProfile.name}
----------------------------------------
Nomor: ${letterNumber}
Perihal: ${perihal}

Kepada Yth.
Bapak/Ibu Orang Tua/Wali Murid
*${selectedStudent.name} (${selectedStudent.className})*

Sehubungan dengan adanya permasalahan yang harus diselesaikan bersama, maka kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali Murid beserta siswa, pada:
📅 *Hari:* ${getDayNameIndonesian(callDate)}
📆 *Tanggal:* ${formatDateIndonesian(callDate)}
⏰ *Waktu:* ${callTime}
📍 *Tempat:* ${callPlace}

Mengingat pentingnya hal tersebut, kami mengharapkan Bapak/Ibu datang tepat waktu. Terima kasih.`);

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
      <div className="bg-white/85 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs  font-extrabold text-violet-700 uppercase tracking-wider mb-1">
            <span>Disiplin Positif</span>
            <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[#1C1B1F] font-black">Surat Panggilan Orang Tua</span>
          </div>
          <h1 className="text-xl sm:text-2xl  font-black text-[#1C1B1F] tracking-tight flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <span>Surat Panggilan Orang Tua / Wali Murid</span>
          </h1>
          <p className="text-xs text-[#49454F] font-medium mt-1">
            Format resmi sesuai Dinas Pendidikan Provinsi Jawa Timur &amp; SMAN 1 Batu, dilengkapi rincian pelanggaran siswa.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-amber-50 rounded-2xl shadow-sm border border-amber-200/60 text-right">
            <div className="text-[10px]  font-extrabold text-amber-700 uppercase tracking-wider">Total Kasus</div>
            <div className="text-base  font-black text-amber-900">{disciplineRecords.length} Pelanggaran</div>
          </div>
          <div className="px-4 py-2.5 bg-violet-50 rounded-2xl shadow-sm border border-violet-200/60 text-right">
            <div className="text-[10px]  font-extrabold text-violet-700 uppercase tracking-wider">Siswa Terdata</div>
            <div className="text-base  font-black text-violet-900">{studentViolationsMap.size} Siswa</div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {copyFeedback && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-sm text-xs  font-extrabold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Main Grid: Controls & Letter Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Form (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* STEP 1: PILIH KELAS & SISWA */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] shadow-sm border border-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-violet-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white  font-black text-xs flex items-center justify-center shadow-xs">1</span>
                <h2 className="text-sm  font-black text-[#1C1B1F]">Pilih Kelas &amp; Siswa</h2>
              </div>
              <span className="text-[11px] font-medium text-[#49454F]">
                {filteredStudents.length} siswa ditemukan
              </span>
            </div>

            {/* Filter Kelas */}
            <div>
              <label className="block text-xs  font-extrabold text-[#1C1B1F] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                <span>Pilih Kelas Siswa</span>
              </label>
              <select
                id="select-call-class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#E7E0EC] rounded-2xl text-xs  font-extrabold text-[#1C1B1F] shadow-none focus:outline-hidden cursor-pointer border border-white/40"
              >
                <option value="ALL">Semua Kelas (36 Rombel X, XI, XII)</option>
                {sortClasses(classes).map((cls) => (
                  <option key={cls.id || cls.name} value={cls.name}>
                    Kelas {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search and Toggle Filter */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F]" />
                <input
                  type="text"
                  placeholder="Cari nama siswa atau NISN..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#E7E0EC] rounded-2xl text-xs text-[#1C1B1F] placeholder-clay-muted shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#49454F] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyWithViolations}
                  onChange={(e) => setOnlyWithViolations(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span>Hanya tampilkan siswa yang memiliki catatan pelanggaran</span>
              </label>
            </div>

            {/* Select Student Dropdown */}
            <div>
              <label className="block text-xs  font-extrabold text-[#1C1B1F] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-600" />
                  <span>Pilih Nama Siswa</span>
                </span>
                {selectedStudent && (
                  <span className="text-[10px] text-violet-700  font-extrabold bg-violet-100 px-2.5 py-0.5 rounded-full shadow-xs">
                    NISN: {selectedStudent.nisn}
                  </span>
                )}
              </label>
              
              {filteredStudents.length === 0 ? (
                <div className="p-3.5 bg-[#E7E0EC] rounded-2xl text-xs text-[#49454F] text-center shadow-none font-medium">
                  Tidak ada siswa yang sesuai kriteria pencarian di kelas ini.
                </div>
              ) : (
                <select
                  id="select-call-student"
                  value={selectedStudent?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#E7E0EC] rounded-2xl text-xs  font-extrabold text-[#1C1B1F] shadow-none focus:outline-hidden cursor-pointer border border-white/40"
                >
                  {filteredStudents.map((s) => {
                    const viols = studentViolationsMap.get(s.id) || [];
                    const pts = viols.reduce((acc, v) => acc + (v.points || 0), 0);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className}) — {viols.length} Kasus ({pts} Poin)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Student Info Card */}
            {selectedStudent && (
              <div className="p-4 bg-[#E7E0EC]/70 shadow-none rounded-2xl space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedStudent.photoUrl ? (
                      <img
                        src={getGoogleDriveDirectImageUrl(selectedStudent.photoUrl)}
                        alt={selectedStudent.name}
                        className="w-12 h-12 rounded-2xl object-cover shadow-xs border border-white shrink-0"
                      />
                    ) : (
                      <div 
                        className={`w-12 h-12 rounded-2xl shadow-xs flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          selectedStudent.gender === 'L' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'
                        }`}
                        
                      >
                        {selectedStudent.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-[#1C1B1F] text-sm leading-tight" >{selectedStudent.name}</div>
                      <div className="text-[#49454F] text-[11px] font-medium mt-0.5">
                        NISN: {selectedStudent.nisn} • {selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </div>
                    </div>
                  </div>
                  <span 
                    className="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold rounded-full text-[11px] shadow-xs shrink-0"
                    
                  >
                    Kelas {selectedStudent.className}
                  </span>
                </div>

                {selectedStudent.address && (
                  <div className="pt-2 border-t border-violet-100/60 text-[11px] flex items-start gap-1.5 text-[#49454F]">
                    <MapPin className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                    <span>{selectedStudent.address}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-violet-100/60 text-[11px]">
                  <div>
                    <span className="text-[#49454F] block text-[10px]">Wali Kelas:</span>
                    <span className=" font-extrabold text-[#1C1B1F]">{studentWaliKelas?.name || 'Belum diatur'}</span>
                  </div>
                  <div>
                    <span className="text-[#49454F] block text-[10px]">Kontak Orang Tua:</span>
                    <span className=" font-extrabold text-[#1C1B1F]">
                      {selectedStudent.parentPhone || selectedStudent.phone || 'Belum ada nomor'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-violet-100/60">
                  <span className="text-[#49454F] font-medium">Akumulasi Pelanggaran:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full  font-extrabold text-[11px] bg-amber-100 text-amber-800 shadow-xs">
                      {studentAllViolations.length} Kasus
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full  font-extrabold text-[11px] bg-rose-100 text-rose-800 shadow-xs">
                      {totalPoints} Poin
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: DAFTAR PELANGGARAN YANG DITAMPILKAN DALAM SURAT */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] shadow-sm border border-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-violet-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white  font-black text-xs flex items-center justify-center shadow-xs">2</span>
                <h2 className="text-sm  font-black text-[#1C1B1F]">Rincian Pelanggaran</h2>
              </div>
              {studentAllViolations.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllViolations}
                  className="text-[11px]  font-extrabold text-violet-700 hover:underline cursor-pointer"
                >
                  {selectedViolationIds.length === studentAllViolations.length
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua'}
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#49454F] leading-relaxed font-medium">
              Centang pelanggaran yang ingin dimasukkan ke dalam rincian surat panggilan orang tua.
            </p>

            {studentAllViolations.length === 0 ? (
              <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-1 shadow-sm border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div className="text-xs  font-extrabold text-emerald-900">Siswa Ini Tidak Memiliki Catatan Pelanggaran</div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Siswa berstatus tertib. Surat panggilan tetap dapat diterbitkan untuk koordinasi preventif.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 clay-custom-scrollbar">
                {studentAllViolations.map((rec) => {
                  const isChecked = selectedViolationIds.includes(rec.id);
                  const isCoached = rec.coachingStatus === 'Sudah';
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleToggleViolation(rec.id)}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-white shadow-sm border border-violet-200/80 -translate-y-0.5'
                          : 'bg-[#E7E0EC]/60 shadow-none opacity-70 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className=" font-extrabold text-[#1C1B1F] truncate">{rec.violationName}</span>
                          {enablePointsSystem ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full  font-black text-[10px] shadow-xs shrink-0">
                              +{rec.points} Poin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded-full  font-bold text-[10px] shadow-xs shrink-0">
                              {rec.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] text-[#49454F] mt-1 font-medium">
                          <span>{formatDateIndonesian(rec.date)}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#1C1B1F]">{rec.category}</span>
                          <span>•</span>
                          <span className={isCoached ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {isCoached ? 'Sudah Dibina' : 'Belum Pembinaan'}
                          </span>
                        </div>

                        {rec.description && (
                          <p className="text-[10.5px] text-[#49454F] italic mt-1.5 bg-[#E7E0EC] p-2 rounded-xl shadow-inner">
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
              <div className="p-3.5 bg-gradient-to-r from-violet-700 to-indigo-800 text-white rounded-2xl shadow-sm flex items-center justify-between text-xs">
                <span className="text-violet-200 font-medium">Total Pelanggaran Terpilih:</span>
                <span className=" font-black text-amber-300 text-sm">
                  {enablePointsSystem 
                    ? `${includedViolations.length} Kasus • ${totalPoints} Poin`
                    : `${includedViolations.length} Kasus Kejadian`}
                </span>
              </div>
            )}
          </div>

          {/* STEP 3: FORM DETAIL SURAT PANGGILAN */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] shadow-sm border border-white p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-violet-100 pb-3">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white  font-black text-xs flex items-center justify-center shadow-xs">3</span>
              <h2 className="text-sm  font-black text-[#1C1B1F]">Detail Surat &amp; Jadwal Pertemuan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block  font-extrabold text-[#1C1B1F] mb-1">Nomor Surat</label>
                <input
                  type="text"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div>
                <label className="block  font-extrabold text-[#1C1B1F] mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-violet-600" />
                  <span>Tanggal Surat</span>
                </label>
                <input
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F]  font-extrabold shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block  font-extrabold text-[#1C1B1F] mb-1">Perihal</label>
                <input
                  type="text"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F]  font-extrabold shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div>
                <label className="block  font-extrabold text-[#1C1B1F] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-violet-600" />
                  <span>Tanggal Pertemuan</span>
                </label>
                <input
                  type="date"
                  value={callDate}
                  onChange={(e) => setCallDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F]  font-extrabold shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div>
                <label className="block  font-extrabold text-[#1C1B1F] mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-violet-600" />
                  <span>Waktu Pertemuan</span>
                </label>
                <input
                  type="text"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  placeholder="Contoh: Pukul 12.30 WIB – selesai"
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block  font-extrabold text-[#1C1B1F] mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-violet-600" />
                  <span>Tempat Pertemuan</span>
                </label>
                <input
                  type="text"
                  value={callPlace}
                  onChange={(e) => setCallPlace(e.target.value)}
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block  font-extrabold text-[#1C1B1F] mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                  <span>Nama Kepala Sekolah</span>
                </label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => handlePrincipalNameChange(e.target.value)}
                  placeholder="Nama Kepala Sekolah beserta gelar"
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div>
                <label className="block  font-extrabold text-[#1C1B1F] mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-violet-600" />
                  <span>Pangkat / Golongan</span>
                </label>
                <input
                  type="text"
                  value={principalRank}
                  onChange={(e) => handlePrincipalRankChange(e.target.value)}
                  placeholder="Contoh: Pembina Utama Muda, IV/c"
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden border border-white/40"
                />
              </div>

              <div>
                <label className="block  font-extrabold text-[#1C1B1F] mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={principalNip}
                  onChange={(e) => handlePrincipalNipChange(e.target.value)}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full px-4 py-2 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden border border-white/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW DOKUMEN & TOMBOL AKSI (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Action Buttons Toolbar */}
          <div className="bg-white/85 backdrop-blur-xl p-4 rounded-[28px] shadow-sm border border-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs  font-extrabold text-[#1C1B1F]">Aksi Dokumen:</span>
              <span className="text-[10px] bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                Ukuran Cetak A4 Portrait
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-print-call-letter"
                onClick={handlePrint}
                className="px-4 py-2 rounded-2xl bg-white text-[#1C1B1F] hover:text-violet-700  font-extrabold text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Cetak surat langsung ke printer"
              >
                <Printer className="w-3.5 h-3.5 text-violet-600" />
                <span>Cetak Surat</span>
              </button>

              <button
                type="button"
                id="btn-download-pdf-call-letter"
                onClick={handleExportPdf}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white  font-extrabold text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Unduh berkas PDF resmi SMAN 1 Batu"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>

              <button
                type="button"
                id="btn-copy-wa-message"
                onClick={handleCopyWhatsApp}
                className="px-4 py-2 rounded-2xl bg-white text-[#1C1B1F] hover:text-emerald-700  font-extrabold text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Salin ringkasan pesan panggilan untuk dikirim ke WhatsApp"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salin WA</span>
              </button>

              {(selectedStudent?.parentPhone || selectedStudent?.phone) && (
                <button
                  type="button"
                  id="btn-send-direct-wa"
                  onClick={handleOpenWhatsApp}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white  font-extrabold text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-1.5"
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
            <div className="flex items-center gap-4 pb-2">
              <img src="/logo.png" alt="Logo SMAN 1 Batu" className="w-16 h-16 object-contain shrink-0" />
              <div className="text-center flex-1 font-sans">
                <h3 className="font-bold text-xs tracking-wider text-slate-800 uppercase">
                  PEMERINTAH PROVINSI JAWA TIMUR
                </h3>
                <h3 className="font-bold text-xs tracking-wider text-slate-800 uppercase">
                  DINAS PENDIDIKAN
                </h3>
                <h2 className="font-extrabold text-base tracking-wide text-slate-950 uppercase mt-0.5">
                  {schoolProfile.name}
                </h2>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Jalan KH. Agus Salim Nomor 57, Sisir, Kota Batu Jawa Timur 65314
                </p>
                <p className="text-[9.5px] text-slate-600">
                  Telepon (0341)591310, Laman: www.sman1batu.sch.id, Pos-el: sman1batu@yahoo.com
                </p>
              </div>
              <div className="w-16 shrink-0 hidden sm:block" />
            </div>

            {/* Garis Pembatas Kop Surat */}
            <div className="space-y-0.5 pb-2">
              <div className="h-[2px] bg-slate-900 w-full" />
              <div className="h-[0.5px] bg-slate-900 w-full" />
            </div>

            {/* Tempat & Tanggal Surat (Kanan Atas) */}
            <div className="text-right font-sans text-xs">
              Batu, {letterDate ? formatDateIndonesian(letterDate) : getTodayIndonesian()}
            </div>

            {/* Nomor, Lampiran, Perihal (Kiri Atas) */}
            <div className="font-sans text-xs space-y-1">
              <div className="grid grid-cols-[80px_10px_auto] gap-x-1">
                <span>Nomor</span>
                <span>:</span>
                <span className="text-slate-900">{letterNumber}</span>
              </div>
              <div className="grid grid-cols-[80px_10px_auto] gap-x-1">
                <span>Lampiran</span>
                <span>:</span>
                <span>-</span>
              </div>
              <div className="grid grid-cols-[80px_10px_auto] gap-x-1">
                <span>Perihal</span>
                <span>:</span>
                <span className="font-bold text-slate-900">{perihal}</span>
              </div>
            </div>

            {/* Tujuan Surat */}
            <div className="pt-2 font-sans text-xs space-y-0.5">
              <div>Yth.</div>
              <div>Bapak/Ibu Orang Tua/Wali Murid</div>
              <div className="font-bold uppercase text-slate-950">
                {selectedStudent?.name || '-'} &nbsp;&nbsp; {selectedStudent?.className || '-'}
              </div>
              <div>di</div>
              <div className="pl-4">Tempat</div>
            </div>

            {/* Paragraf Pembuka */}
            <div className="pt-2 space-y-2 font-serif text-[12px] text-justify leading-relaxed">
              <p className="indent-8">
                Sehubungan dengan adanya permasalahan yang harus diselesaikan bersama, maka kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali Murid beserta siswa, pada:
              </p>
            </div>

            {/* Detail Jadwal Pertemuan */}
            <div className="pl-8 font-sans text-xs space-y-1 py-1">
              <div className="grid grid-cols-[100px_10px_auto] gap-x-1">
                <span>Hari</span>
                <span>:</span>
                <span className="text-slate-900">{getDayNameIndonesian(callDate)}</span>
              </div>
              <div className="grid grid-cols-[100px_10px_auto] gap-x-1">
                <span>Tanggal</span>
                <span>:</span>
                <span className="text-slate-900">{formatDateIndonesian(callDate)}</span>
              </div>
              <div className="grid grid-cols-[100px_10px_auto] gap-x-1">
                <span>Waktu</span>
                <span>:</span>
                <span className="text-slate-900">{callTime}</span>
              </div>
              <div className="grid grid-cols-[100px_10px_auto] gap-x-1">
                <span>Tempat</span>
                <span>:</span>
                <span className="text-slate-900">{callPlace}</span>
              </div>
            </div>

            {/* TABEL RINCIAN PELANGGARAN YANG DILAKUKAN SISWA */}
            <div className="py-2 space-y-1.5">
              <p className="font-serif text-[11.5px] text-slate-800">
                Adapun rincian pelanggaran tata tertib yang telah dilakukan oleh siswa adalah sebagai berikut:
              </p>

              <table className="w-full border-collapse border border-slate-300 font-sans text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th className="border border-slate-300 py-1.5 px-2 w-8 text-center">No</th>
                    <th className="border border-slate-300 py-1.5 px-2 w-24 text-center">Tanggal</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">Jenis Pelanggaran</th>
                    <th className="border border-slate-300 py-1.5 px-2 w-20 text-center">Kategori</th>
                    {enablePointsSystem && (
                      <th className="border border-slate-300 py-1.5 px-2 w-16 text-center">Poin</th>
                    )}
                    <th className="border border-slate-300 py-1.5 px-2 w-28 text-center">Status Pembinaan</th>
                  </tr>
                </thead>
                <tbody>
                  {includedViolations.length === 0 ? (
                    <tr>
                      <td colSpan={enablePointsSystem ? 6 : 5} className="border border-slate-300 py-3 text-center text-slate-500 italic">
                        Tidak ada catatan pelanggaran khusus / Pembinaan preventif berkala.
                      </td>
                    </tr>
                  ) : (
                    includedViolations.map((v, idx) => (
                      <tr key={v.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 py-1 px-2 text-center text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 py-1 px-2 text-center whitespace-nowrap">{v.date}</td>
                        <td className="border border-slate-300 py-1 px-2">
                          <span className="font-semibold text-slate-900">{v.violationName}</span>
                          {v.description && (
                            <div className="text-[10px] text-slate-500 italic">
                              Ket: {v.description}
                            </div>
                          )}
                        </td>
                        <td className="border border-slate-300 py-1 px-2 text-center">{v.category}</td>
                        {enablePointsSystem && (
                          <td className="border border-slate-300 py-1 px-2 text-center font-bold text-rose-700">
                            {v.points}
                          </td>
                        )}
                        <td className="border border-slate-300 py-1 px-2 text-center">
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
                    <tr className="bg-slate-50 font-bold border-t border-slate-400">
                      <td colSpan={4} className="border border-slate-300 py-1 px-3 text-right">
                        TOTAL POIN:
                      </td>
                      {enablePointsSystem && (
                        <td className="border border-slate-300 py-1 px-2 text-center text-rose-700 font-black">
                          {totalPoints} Poin
                        </td>
                      )}
                      <td className="border border-slate-300 py-1 px-2 text-center text-slate-600 text-[10px]">
                        {includedViolations.length} Catatan
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Paragraf Penutup */}
            <div className="pt-2 space-y-2 font-serif text-[12px] text-justify leading-relaxed">
              <p className="indent-8">
                Mengingat pentingnya hal tersebut, maka kami mengharapkan Bapak/Ibu untuk datang tepat pada waktu yang telah ditentukan.
              </p>
              <p className="indent-8">
                Demikian atas perhatian dan kerjasama yang baik disampaikan terima kasih.
              </p>
            </div>

            {/* TANDA TANGAN RESMI KEPALA SEKOLAH (RATA KANAN) */}
            <div className="pt-8 flex justify-end font-sans text-xs">
              <div className="text-left w-64 space-y-0.5">
                <p>Kepala {schoolProfile.name}</p>
                <div className="h-20" />
                <p className="font-bold text-slate-900 underline">{principalName}</p>
                {principalRank && <p className="text-[10.5px] text-slate-700">{principalRank}</p>}
                <p className="text-[10.5px] text-slate-600">NIP. {principalNip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
