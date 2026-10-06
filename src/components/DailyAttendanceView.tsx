import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  Search, 
  Save, 
  Sparkles, 
  Calendar, 
  FileCheck, 
  FileX, 
  Layers, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, LetterStatus, Student } from '../types';
import { RombelClass } from '../data/initialData';
import { formatDateIndonesian, getTodayDateString } from '../utils/exportUtils';
import { sortClasses, sortStudents } from '../utils/sortUtils';

interface DailyAttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  classes: RombelClass[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSaveAttendance: (updatedRecords: AttendanceRecord[]) => void;
  onOpenQuickDiscipline: (student: Student, defaultViolation: string) => void;
  currentUserName: string;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  students,
  attendanceRecords,
  classes,
  selectedDate,
  onDateChange,
  onSaveAttendance,
  onOpenQuickDiscipline,
  currentUserName,
}) => {
  // Selected grade/jenjang: 'X' | 'XI' | 'XII'
  const [selectedGrade, setSelectedGrade] = useState<'X' | 'XI' | 'XII'>('X');
  // Selected class out of 36 rombels
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  // Filter available classes according to selectedGrade
  const availableClasses = useMemo(() => {
    return sortClasses(classes.filter((c) => c.grade === selectedGrade));
  }, [classes, selectedGrade]);

  // Handle grade change and auto-adjust selected class if needed
  const handleGradeChange = (newGrade: 'X' | 'XI' | 'XII') => {
    setSelectedGrade(newGrade);
    const sortedGradeClasses = sortClasses(classes.filter((c) => c.grade === newGrade));
    const isCurrentClassInNewGrade = sortedGradeClasses.some(
      (c) => c.name === selectedClass
    );
    if (!isCurrentClassInNewGrade) {
      if (sortedGradeClasses.length > 0) {
        setSelectedClass(sortedGradeClasses[0].name);
      }
    }
  };

  // Students in selected rombel (~36 students)
  const classStudents = useMemo(() => {
    return sortStudents(students.filter((s) => s.className === selectedClass));
  }, [students, selectedClass]);

  const currentClassInfo = useMemo(() => {
    return classes.find((c) => c.name === selectedClass);
  }, [classes, selectedClass]);

  // Local draft state for attendance on this date and class
  const [draftRecords, setDraftRecords] = useState<{
    [studentId: string]: { status: AttendanceStatus; hasLetter?: LetterStatus; notes: string };
  }>(() => {
    const initialDraft: {
      [studentId: string]: { status: AttendanceStatus; hasLetter?: LetterStatus; notes: string };
    } = {};
    classStudents.forEach((student) => {
      const existing = attendanceRecords.find(
        (r) => r.date === selectedDate && r.studentId === student.id
      );
      initialDraft[student.id] = {
        status: existing?.status || 'H',
        hasLetter: existing?.hasLetter || (existing?.status === 'S' || existing?.status === 'I' ? 'Belum Ada Surat' : undefined),
        notes: existing?.notes || '',
      };
    });
    return initialDraft;
  });

  // Otomatis set tanggal ke real-time hari ini saat halaman Input Data Presensi dibuka
  useEffect(() => {
    const todayStr = getTodayDateString();
    if (selectedDate !== todayStr) {
      onDateChange(todayStr);
    }
  }, []);

  // Re-sync draft when date, class, or attendanceRecords change
  useEffect(() => {
    const newDraft: {
      [studentId: string]: { status: AttendanceStatus; hasLetter?: LetterStatus; notes: string };
    } = {};
    classStudents.forEach((student) => {
      const existing = attendanceRecords.find(
        (r) => r.date === selectedDate && r.studentId === student.id
      );
      newDraft[student.id] = {
        status: existing?.status || 'H',
        hasLetter: existing?.hasLetter || (existing?.status === 'S' || existing?.status === 'I' ? 'Belum Ada Surat' : undefined),
        notes: existing?.notes || '',
      };
    });
    setDraftRecords(newDraft);
  }, [selectedDate, selectedClass, classStudents, attendanceRecords]);

  // Draft counts: H, I, S, A, D and Surat verification
  const draftCounts = useMemo(() => {
    let h = 0;
    let i = 0;
    let s = 0;
    let a = 0;
    let d = 0;
    let suratLengkap = 0;
    let suratBelum = 0;

    classStudents.forEach((st) => {
      const record = draftRecords[st.id] || { status: 'H', notes: '' };
      if (record.status === 'H') h++;
      else if (record.status === 'I') {
        i++;
        if (record.hasLetter === 'Sudah Ada Surat') suratLengkap++;
        else suratBelum++;
      } else if (record.status === 'S') {
        s++;
        if (record.hasLetter === 'Sudah Ada Surat') suratLengkap++;
        else suratBelum++;
      } else if (record.status === 'A') a++;
      else if (record.status === 'D') d++;
    });

    return { h, i, s, a, d, suratLengkap, suratBelum, total: classStudents.length };
  }, [classStudents, draftRecords]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDraftRecords((prev) => {
      const current = prev[studentId] || { status: 'H', notes: '' };
      let updatedLetter = current.hasLetter;
      if ((status === 'S' || status === 'I') && !updatedLetter) {
        updatedLetter = 'Belum Ada Surat';
      }
      return {
        ...prev,
        [studentId]: {
          ...current,
          status,
          hasLetter: (status === 'S' || status === 'I') ? (updatedLetter || 'Belum Ada Surat') : undefined,
          notes: status === 'D' ? current.notes : '',
        },
      };
    });
  };

  const handleLetterToggle = (studentId: string, hasLetter: LetterStatus) => {
    setDraftRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        hasLetter,
      },
    }));
  };

  // Existing saved attendance records for this class & date
  const existingClassRecords = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.date === selectedDate && r.className === selectedClass
    );
  }, [attendanceRecords, selectedDate, selectedClass]);

  const hasSavedRecords = existingClassRecords.length > 0;

  // Detect if user has made any changes to the already saved records
  const hasChanges = useMemo(() => {
    if (!hasSavedRecords) return false;
    const existingMap = new Map(existingClassRecords.map((r) => [r.studentId, r]));

    for (const st of classStudents) {
      const existing = existingMap.get(st.id);
      const draft = draftRecords[st.id];
      if (!draft) continue;
      if (!existing) return true;
      if (draft.status !== existing.status) return true;
      if ((draft.status === 'S' || draft.status === 'I') && draft.hasLetter !== existing.hasLetter) return true;
      if ((draft.notes || '').trim() !== (existing.notes || '').trim()) return true;
    }
    return false;
  }, [hasSavedRecords, existingClassRecords, classStudents, draftRecords]);

  const isUpdateMode = hasSavedRecords && hasChanges;
  const [toastMessage, setToastMessage] = useState('');

  const handleMarkAllHadir = () => {
    const updated: { [studentId: string]: { status: AttendanceStatus; hasLetter?: LetterStatus; notes: string } } = {};
    classStudents.forEach((st) => {
      updated[st.id] = {
        status: 'H',
        hasLetter: undefined,
        notes: draftRecords[st.id]?.notes || '',
      };
    });
    setDraftRecords(updated);
  };

  const handleSave = () => {
    const isUpdate = hasSavedRecords;
    const recordsToSave: AttendanceRecord[] = classStudents.map((st) => {
      const current = draftRecords[st.id] || { status: 'H', notes: '' };
      return {
        id: `att-${selectedDate}-${st.id}`,
        date: selectedDate,
        studentId: st.id,
        studentName: st.name,
        nisn: st.nisn,
        classId: st.classId,
        className: st.className,
        status: current.status,
        hasLetter: (current.status === 'S' || current.status === 'I') ? (current.hasLetter || 'Belum Ada Surat') : undefined,
        notes: current.status === 'D' ? (current.notes || '') : '',
        timeRecorded: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        recordedBy: currentUserName,
      };
    });

    onSaveAttendance(recordsToSave);
    setToastMessage(
      isUpdate 
        ? `Presensi Kelas ${selectedClass} (${formatDateIndonesian(selectedDate)}) berhasil di-update!`
        : `Presensi Kelas ${selectedClass} (${formatDateIndonesian(selectedDate)}) berhasil disimpan!`
    );
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  const filteredStudents = classStudents.filter((st) =>
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.nisn.includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white/85 backdrop-blur-xl p-6 rounded-[32px] shadow-clay-card border border-white/80 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-nunito font-black text-clay-foreground tracking-tight">
              Input Data Presensi
            </h2>
            {isUpdateMode && (
              <span className="px-3 py-1 rounded-full text-xs font-nunito font-extrabold bg-amber-100 text-amber-800 shadow-clay-pill animate-pulse">
                Ada Perubahan
              </span>
            )}
          </div>
        </div>

        {/* Date, Grade tabs, and Class selector */}
        <div className="pt-3 border-t border-violet-100/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tanggal Presensi (Recessed) */}
          <div className="flex items-center gap-2 bg-[#EFEBF5] rounded-2xl px-4 py-2.5 text-xs text-clay-foreground shadow-clay-pressed border border-white/40">
            <Calendar className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="text-clay-muted font-medium">Tanggal:</span>
            <input
              id="attendance-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-clay-foreground font-nunito font-extrabold focus:outline-hidden cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* Grade filter tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#EFEBF5] rounded-2xl text-xs font-nunito font-extrabold shadow-clay-pressed">
              <span className="text-clay-muted px-2 text-[11px]">Jenjang:</span>
              {(['X', 'XI', 'XII'] as const).map((gr) => (
                <button
                  key={gr}
                  type="button"
                  id={`daily-grade-${gr}`}
                  onClick={() => handleGradeChange(gr)}
                  className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedGrade === gr
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-clay-button -translate-y-0.5'
                      : 'text-clay-foreground hover:bg-white/60'
                  }`}
                >
                  Kelas {gr}
                </button>
              ))}
            </div>

            {/* Class dropdown (Recessed) */}
            <div className="flex items-center gap-2 bg-[#EFEBF5] rounded-2xl px-4 py-2.5 text-xs text-clay-foreground shadow-clay-pressed border border-white/40">
              <Layers className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="text-clay-muted font-medium">Pilih Kelas:</span>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-nunito font-extrabold text-clay-foreground focus:outline-hidden cursor-pointer"
              >
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.name}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveToast && (
        <div className="p-4 rounded-[24px] bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between shadow-clay-card animate-in fade-in">
          <div className="flex items-center gap-2.5 font-nunito font-extrabold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-nunito font-black bg-emerald-200 text-emerald-900 shadow-clay-pill uppercase">
            Tersimpan
          </span>
        </div>
      )}

      {/* Banner Notifikasi Ada Perubahan Data Presensi */}
      {isUpdateMode && (
        <div className="p-4 rounded-[24px] bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-clay-card">
          <div className="flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Presensi kelas ini sudah pernah diinput. Ada <strong>perubahan data absensi</strong> yang belum disimpan.</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-nunito font-extrabold rounded-2xl text-xs cursor-pointer shrink-0 flex items-center gap-1.5 shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Update Presensi Sekarang</span>
          </button>
        </div>
      )}

      {/* Attendance Summary Ribbon & Quick Action */}
      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[28px] shadow-clay-card border border-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-nunito font-extrabold text-clay-foreground mr-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[11px] shadow-clay-pill font-black">
              Jenjang {currentClassInfo?.grade || selectedGrade}
            </span>
            <span className="text-sm">Kelas {selectedClass}</span>
            {currentClassInfo?.homeroom && (
              <span className="text-clay-muted font-medium text-xs hidden sm:inline">
                ({currentClassInfo.homeroom})
              </span>
            )}
            <span className="text-clay-muted font-medium">• {draftCounts.total} Siswa:</span>
          </div>
          <span className="px-3 py-1 rounded-2xl bg-emerald-100 text-emerald-800 font-nunito font-extrabold shadow-clay-pill">
            H: {draftCounts.h}
          </span>
          <span className="px-3 py-1 rounded-2xl bg-amber-100 text-amber-800 font-nunito font-extrabold shadow-clay-pill">
            S: {draftCounts.s}
          </span>
          <span className="px-3 py-1 rounded-2xl bg-sky-100 text-sky-800 font-nunito font-extrabold shadow-clay-pill">
            I: {draftCounts.i}
          </span>
          <span className="px-3 py-1 rounded-2xl bg-rose-100 text-rose-800 font-nunito font-extrabold shadow-clay-pill">
            A: {draftCounts.a}
          </span>
          <span className="px-3 py-1 rounded-2xl bg-indigo-100 text-indigo-800 font-nunito font-extrabold shadow-clay-pill">
            D: {draftCounts.d}
          </span>

          {(draftCounts.i > 0 || draftCounts.s > 0) && (
            <span className="ml-2 px-3 py-1 rounded-2xl bg-[#EFEBF5] text-clay-foreground font-medium text-[11px] shadow-clay-pressed">
              Surat S/I: <strong className="text-emerald-700">{draftCounts.suratLengkap} Ada</strong> • <strong className="text-rose-700">{draftCounts.suratBelum} Belum</strong>
            </span>
          )}
        </div>

        <button
          type="button"
          id="mark-all-h-btn"
          onClick={handleMarkAllHadir}
          className="px-4 py-2.5 rounded-2xl bg-white text-violet-700 hover:text-violet-800 text-xs font-nunito font-extrabold shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span>Tandai Semua Hadir (H)</span>
        </button>
      </div>

      {/* Student List Table */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[32px] shadow-clay-card border border-white overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-violet-100/60 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" />
            <input
              id="search-class-student-input"
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#EFEBF5] rounded-2xl text-xs text-clay-foreground placeholder-clay-muted shadow-clay-pressed focus:outline-hidden border border-white/40"
            />
          </div>
          <span className="text-xs text-clay-muted font-medium ml-3">
            Menampilkan <strong className="text-clay-foreground">{filteredStudents.length} siswa</strong> ({selectedClass})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EFEBF5]/70 text-[11px] font-nunito font-black uppercase tracking-wider text-clay-foreground border-b border-violet-100">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-3 w-28 text-center">NISN</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Siswa</th>
                <th className="py-3.5 px-2 text-center w-12">L/P</th>
                <th className="py-3.5 px-3 text-center min-w-[260px]">Status Presensi</th>
                <th className="py-3.5 px-4 min-w-[190px]">Surat Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/60 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-clay-muted font-medium">
                    Tidak ada siswa ditemukan pada kelas ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const draft = draftRecords[student.id] || { status: 'H', notes: '' };
                  const isSickOrPermit = draft.status === 'S' || draft.status === 'I';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-white/80 transition-colors ${
                        draft.status === 'A'
                          ? 'bg-rose-50/40'
                          : draft.status === 'D'
                          ? 'bg-indigo-50/30'
                          : draft.status === 'S'
                          ? 'bg-amber-50/30'
                          : draft.status === 'I'
                          ? 'bg-sky-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-clay-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-xs font-semibold text-clay-foreground">
                        {student.nisn}
                      </td>
                      <td className="py-3.5 px-4 font-nunito font-extrabold text-clay-foreground">
                        {student.name}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-nunito font-black shadow-clay-pill ${
                            student.gender === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      {/* H, S, I, A, D Tactile Clay Buttons */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* H: Hadir */}
                          <button
                            type="button"
                            id={`btn-H-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'H')}
                            title="Hadir"
                            className={`w-10 h-9 rounded-2xl font-nunito font-black text-xs transition-all duration-200 cursor-pointer ${
                              draft.status === 'H'
                                ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-clay-button -translate-y-0.5'
                                : 'bg-white text-clay-foreground hover:bg-emerald-50 hover:text-emerald-700 shadow-clay-card active:scale-[0.92] active:shadow-clay-pressed'
                            }`}
                          >
                            H
                          </button>

                          {/* S: Sakit */}
                          <button
                            type="button"
                            id={`btn-S-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'S')}
                            title="Sakit"
                            className={`w-10 h-9 rounded-2xl font-nunito font-black text-xs transition-all duration-200 cursor-pointer ${
                              draft.status === 'S'
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-clay-button -translate-y-0.5'
                                : 'bg-white text-clay-foreground hover:bg-amber-50 hover:text-amber-700 shadow-clay-card active:scale-[0.92] active:shadow-clay-pressed'
                            }`}
                          >
                            S
                          </button>

                          {/* I: Izin */}
                          <button
                            type="button"
                            id={`btn-I-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'I')}
                            title="Izin"
                            className={`w-10 h-9 rounded-2xl font-nunito font-black text-xs transition-all duration-200 cursor-pointer ${
                              draft.status === 'I'
                                ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-clay-button -translate-y-0.5'
                                : 'bg-white text-clay-foreground hover:bg-sky-50 hover:text-sky-700 shadow-clay-card active:scale-[0.92] active:shadow-clay-pressed'
                            }`}
                          >
                            I
                          </button>

                          {/* A: Alpa */}
                          <button
                            type="button"
                            id={`btn-A-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'A')}
                            title="Alpa"
                            className={`w-10 h-9 rounded-2xl font-nunito font-black text-xs transition-all duration-200 cursor-pointer ${
                              draft.status === 'A'
                                ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-clay-button -translate-y-0.5'
                                : 'bg-white text-clay-foreground hover:bg-rose-50 hover:text-rose-700 shadow-clay-card active:scale-[0.92] active:shadow-clay-pressed'
                            }`}
                          >
                            A
                          </button>

                          {/* D: Dispen */}
                          <button
                            type="button"
                            id={`btn-D-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'D')}
                            title="Dispen"
                            className={`w-10 h-9 rounded-2xl font-nunito font-black text-xs transition-all duration-200 cursor-pointer ${
                              draft.status === 'D'
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-clay-button -translate-y-0.5'
                                : 'bg-white text-clay-foreground hover:bg-indigo-50 hover:text-indigo-700 shadow-clay-card active:scale-[0.92] active:shadow-clay-pressed'
                            }`}
                          >
                            D
                          </button>
                        </div>
                      </td>

                      {/* Status Surat (Khusus Izin & Sakit) */}
                      <td className="py-3 px-4">
                        {isSickOrPermit ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                id={`letter-yes-${student.id}`}
                                onClick={() => handleLetterToggle(student.id, 'Sudah Ada Surat')}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-nunito font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                  draft.hasLetter === 'Sudah Ada Surat'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-clay-button -translate-y-0.5'
                                    : 'bg-white text-clay-foreground hover:bg-emerald-50 shadow-clay-card active:scale-95'
                                }`}
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>Ada Surat</span>
                              </button>

                              <button
                                type="button"
                                id={`letter-no-${student.id}`}
                                onClick={() => handleLetterToggle(student.id, 'Belum Ada Surat')}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-nunito font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                  draft.hasLetter === 'Belum Ada Surat'
                                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-clay-button -translate-y-0.5'
                                    : 'bg-white text-clay-foreground hover:bg-rose-50 shadow-clay-card active:scale-95'
                                }`}
                              >
                                <FileX className="w-3 h-3" />
                                <span>Belum Ada</span>
                              </button>
                            </div>
                            <span className="text-[10px] font-medium text-clay-muted">
                              {draft.hasLetter === 'Sudah Ada Surat' ? '✓ Ada surat fisik/foto' : '⚠ Belum mengumpulkan surat'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-clay-muted italic font-medium">
                            {draft.status === 'H' ? 'Hadir di kelas' : draft.status === 'D' ? 'Surat Tugas Dispen' : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Bar */}
        <div className="p-5 bg-white/50 border-t border-violet-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-clay-muted font-medium">
            Pastikan siswa yang <strong>Sakit (S)</strong> dan <strong>Izin (I)</strong> telah dikonfirmasi status suratnya.
          </div>
          <button
            type="button"
            id="bottom-save-btn"
            onClick={handleSave}
            className={`px-6 py-3 rounded-2xl text-xs font-nunito font-black transition-all shadow-clay-button hover:-translate-y-1 active:scale-[0.92] active:shadow-clay-pressed flex items-center gap-2 cursor-pointer ${
              isUpdateMode
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-300'
                : hasSavedRecords && !hasChanges
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
            }`}
          >
            {isUpdateMode ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Update Presensi Kelas {selectedClass}</span>
              </>
            ) : hasSavedRecords && !hasChanges ? (
              <>
                <Check className="w-4 h-4" />
                <span>Presensi Kelas {selectedClass} Tersimpan</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Presensi Kelas {selectedClass}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
