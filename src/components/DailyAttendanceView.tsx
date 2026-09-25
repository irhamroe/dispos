import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Search, 
  Save, 
  Sparkles, 
  Calendar, 
  ShieldAlert, 
  Check, 
  FileCheck, 
  FileX, 
  HelpCircle,
  Clock,
  Layers,
  RefreshCw,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, LetterStatus, Student } from '../types';
import { RombelClass } from '../data/initialData';
import { formatDateIndonesian, getTodayDateString } from '../utils/exportUtils';

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

  // Group classes by grade
  const classesX = useMemo(() => classes.filter((c) => c.grade === 'X'), [classes]);
  const classesXI = useMemo(() => classes.filter((c) => c.grade === 'XI'), [classes]);
  const classesXII = useMemo(() => classes.filter((c) => c.grade === 'XII'), [classes]);

  // Filter available classes according to selectedGrade
  const availableClasses = useMemo(() => {
    return classes.filter((c) => c.grade === selectedGrade);
  }, [classes, selectedGrade]);

  // Handle grade change and auto-adjust selected class if needed
  const handleGradeChange = (newGrade: 'X' | 'XI' | 'XII') => {
    setSelectedGrade(newGrade);
    const isCurrentClassInNewGrade = classes.some(
      (c) => c.grade === newGrade && c.name === selectedClass
    );
    if (!isCurrentClassInNewGrade) {
      const firstInGrade = classes.find((c) => c.grade === newGrade);
      if (firstInGrade) {
        setSelectedClass(firstInGrade.name);
      }
    }
  };

  // Students in selected rombel (~36 students)
  const classStudents = useMemo(() => {
    return students.filter((s) => s.className === selectedClass);
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
        hasLetter: existing?.hasLetter || 'Sudah Ada Surat',
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
        hasLetter: existing?.hasLetter || (existing?.status === 'S' || existing?.status === 'I' ? 'Sudah Ada Surat' : undefined),
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
      // Default to "Sudah Ada Surat" if changed to S or I
      if ((status === 'S' || status === 'I') && !updatedLetter) {
        updatedLetter = 'Sudah Ada Surat';
      }
      return {
        ...prev,
        [studentId]: {
          ...current,
          status,
          hasLetter: (status === 'S' || status === 'I') ? (updatedLetter || 'Sudah Ada Surat') : undefined,
          // Catatan hanya tersimpan jika status D
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

  const handleNotesChange = (studentId: string, notes: string) => {
    setDraftRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
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

  // If input presensi was already done and there is a change, button becomes "Update Presensi"
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
        hasLetter: (current.status === 'S' || current.status === 'I') ? (current.hasLetter || 'Sudah Ada Surat') : undefined,
        notes: current.status === 'D' ? (current.notes || '') : '',
        timeRecorded: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        recordedBy: currentUserName,
      };
    });

    onSaveAttendance(recordsToSave);
    setToastMessage(
      isUpdate 
        ? `Presensi Kelas ${selectedClass} untuk tanggal ${formatDateIndonesian(selectedDate)} berhasil di-update!`
        : `Presensi Kelas ${selectedClass} untuk tanggal ${formatDateIndonesian(selectedDate)} berhasil disimpan!`
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
      {/* Top Header Simpel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Bagian atas hanya menampilkan judul Input Data Presensi */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Input Data Presensi
            </h2>
            {isUpdateMode && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                Ada Perubahan
              </span>
            )}
          </div>
        </div>

        {/* Dibawah judul: tanggal, pilih jenjang (tab pills sama seperti di rekap presensi), dan pilih kelas */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tanggal Presensi */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs">
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-slate-500 font-medium">Tanggal Presensi:</span>
            <input
              id="attendance-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* Grade filter tabs - Hanya Kelas X, XI, XII */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
              <span className="text-slate-400 px-2 text-[11px] font-bold">Jenjang:</span>
              {(['X', 'XI', 'XII'] as const).map((gr) => (
                <button
                  key={gr}
                  type="button"
                  id={`daily-grade-${gr}`}
                  onClick={() => handleGradeChange(gr)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedGrade === gr
                      ? 'bg-white text-teal-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kelas {gr}
                </button>
              ))}
            </div>

            {/* Class dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
              <Layers className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-slate-400">Pilih Kelas:</span>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
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
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-300 text-teal-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-teal-600" />
            <span>{toastMessage || `Presensi Kelas ${selectedClass} untuk tanggal ${formatDateIndonesian(selectedDate)} berhasil disimpan!`}</span>
          </div>
          <span className="text-[11px] font-bold text-teal-600 uppercase">Tersimpan</span>
        </div>
      )}

      {/* Banner Notifikasi Ada Perubahan Data Presensi */}
      {isUpdateMode && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Presensi kelas ini sudah pernah diinput sebelumnya. Ada <strong>perubahan data absensi</strong> yang belum disimpan.</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update Presensi Sekarang</span>
          </button>
        </div>
      )}

      {/* Attendance Summary Ribbon & Quick Action */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mr-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-200 text-[11px] font-extrabold">
              Jenjang {currentClassInfo?.grade || selectedGrade}
            </span>
            <span>Kelas {selectedClass}</span>
            {currentClassInfo?.homeroom && (
              <span className="text-slate-500 font-medium text-[11px] hidden sm:inline">
                ({currentClassInfo.homeroom})
              </span>
            )}
            <span className="text-slate-500 font-normal">• {draftCounts.total} Siswa:</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
            H (Hadir): {draftCounts.h}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
            S (Sakit): {draftCounts.s}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
            I (Izin): {draftCounts.i}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
            A (Alpa): {draftCounts.a}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold">
            D (Dispen): {draftCounts.d}
          </span>

          {(draftCounts.i > 0 || draftCounts.s > 0) && (
            <span className="ml-2 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-medium text-[11px]">
              Surat S/I: <strong className="text-emerald-700">{draftCounts.suratLengkap} Ada</strong> • <strong className="text-rose-700">{draftCounts.suratBelum} Belum</strong>
            </span>
          )}
        </div>

        <button
          type="button"
          id="mark-all-h-btn"
          onClick={handleMarkAllHadir}
          className="px-3.5 py-2 rounded-xl bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Tandai Semua Hadir (H)</span>
        </button>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-class-student-input"
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium ml-3">
            Menampilkan {filteredStudents.length} siswa ({selectedClass})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700 divide-x divide-slate-300 border-b border-slate-300">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28 text-center">NISN</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                <th className="py-3 px-2 text-center w-12">L/P</th>
                <th className="py-3 px-3 text-center min-w-[240px]">
                  Status Presensi
                </th>
                <th className="py-3 px-4 min-w-[190px]">
                  Surat
                </th>
                <th className="py-3 px-4 min-w-[200px]">Catatan / Dispensasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
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
                      className={`divide-x divide-slate-300 hover:bg-slate-50 transition-colors ${
                        draft.status === 'A'
                          ? 'bg-rose-50/40'
                          : draft.status === 'D'
                          ? 'bg-indigo-50/30'
                          : draft.status === 'S'
                          ? 'bg-amber-50/30'
                          : draft.status === 'I'
                          ? 'bg-blue-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-semibold text-slate-600">
                        {student.nisn}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student.name}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            student.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      {/* H, S, I, A, D Radio Buttons */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* H: Hadir */}
                          <button
                            type="button"
                            id={`btn-H-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'H')}
                            title="Hadir"
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              draft.status === 'H'
                                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                            }`}
                          >
                            H
                          </button>

                          {/* S: Sakit */}
                          <button
                            type="button"
                            id={`btn-S-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'S')}
                            title="Sakit (Perlu surat)"
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              draft.status === 'S'
                                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
                            }`}
                          >
                            S
                          </button>

                          {/* I: Izin */}
                          <button
                            type="button"
                            id={`btn-I-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'I')}
                            title="Izin (Perlu surat)"
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              draft.status === 'I'
                                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
                            }`}
                          >
                            I
                          </button>

                          {/* A: Alpa */}
                          <button
                            type="button"
                            id={`btn-A-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'A')}
                            title="Alpa (Tanpa Keterangan)"
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              draft.status === 'A'
                                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                            }`}
                          >
                            A
                          </button>

                          {/* D: Dispen */}
                          <button
                            type="button"
                            id={`btn-D-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'D')}
                            title="Dispen (Dispensasi tugas sekolah / kegiatan luar)"
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              draft.status === 'D'
                                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200'
                            }`}
                          >
                            D
                          </button>
                        </div>
                      </td>

                      {/* Status Surat (Khusus Izin & Sakit) */}
                      <td className="py-3 px-4">
                        {isSickOrPermit ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                id={`letter-yes-${student.id}`}
                                onClick={() => handleLetterToggle(student.id, 'Sudah Ada Surat')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  draft.hasLetter === 'Sudah Ada Surat'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 border border-slate-200'
                                }`}
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>Ada Surat</span>
                              </button>

                              <button
                                type="button"
                                id={`letter-no-${student.id}`}
                                onClick={() => handleLetterToggle(student.id, 'Belum Ada Surat')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  draft.hasLetter === 'Belum Ada Surat'
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-rose-50 border border-slate-200'
                                }`}
                              >
                                <FileX className="w-3 h-3" />
                                <span>Belum Ada</span>
                              </button>
                            </div>
                            <span className="text-[10px] font-medium text-slate-500">
                              {draft.hasLetter === 'Sudah Ada Surat' ? '✓ Ada surat terlampir' : '⚠ Belum mengumpulkan surat'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {draft.status === 'H' ? 'Hadir' : draft.status === 'D' ? 'Surat Tugas Dispen' : '-'}
                          </span>
                        )}
                      </td>

                      {/* Catatan / Dispensasi (HANYA AKTIF KETIKA STATUS D) */}
                      <td className="py-3 px-4">
                        {draft.status === 'D' ? (
                          <div>
                            <input
                              type="text"
                              id={`notes-${student.id}`}
                              value={draft.notes || ''}
                              onChange={(e) => handleNotesChange(student.id, e.target.value)}
                              placeholder="Ketik kegiatan / alasan dispensasi..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-400 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                            />
                            <span className="text-[9.5px] text-indigo-600 font-semibold mt-0.5 block">
                              Aktif untuk status dispensasi
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            id={`notes-${student.id}`}
                            value=""
                            disabled
                            placeholder="Hanya aktif untuk status D"
                            className="w-full px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-400 placeholder-slate-400 cursor-not-allowed select-none italic"
                          />
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Pastikan siswa yang <strong>Sakit (S)</strong> dan <strong>Izin (I)</strong> telah dikonfirmasi status suratnya.
          </div>
          <button
            type="button"
            id="bottom-save-btn"
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              isUpdateMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-300'
                : hasSavedRecords && !hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
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
