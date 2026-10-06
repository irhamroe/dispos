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
import { MdCard, MdBadge, MdButton } from './md3';

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
  const [selectedGrade, setSelectedGrade] = useState<'X' | 'XI' | 'XII'>('X');
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const availableClasses = useMemo(() => {
    return sortClasses(classes.filter((c) => c.grade === selectedGrade));
  }, [classes, selectedGrade]);

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

  const classStudents = useMemo(() => {
    return sortStudents(students.filter((s) => s.className === selectedClass));
  }, [students, selectedClass]);

  const currentClassInfo = useMemo(() => {
    return classes.find((c) => c.name === selectedClass);
  }, [classes, selectedClass]);

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

  useEffect(() => {
    const todayStr = getTodayDateString();
    if (selectedDate !== todayStr) {
      onDateChange(todayStr);
    }
  }, []);

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
      const existing = prev[studentId] || { status: 'H', notes: '' };
      let newHasLetter = existing.hasLetter;
      if (status === 'S' || status === 'I') {
        if (!newHasLetter) newHasLetter = 'Belum Ada Surat';
      } else {
        newHasLetter = undefined;
      }
      return {
        ...prev,
        [studentId]: {
          ...existing,
          status,
          hasLetter: newHasLetter,
        },
      };
    });
  };

  const handleLetterToggle = (studentId: string, letterState: LetterStatus) => {
    setDraftRecords((prev) => {
      const existing = prev[studentId] || { status: 'H', notes: '' };
      return {
        ...prev,
        [studentId]: {
          ...existing,
          hasLetter: letterState,
        },
      };
    });
  };

  const handleMarkAllHadir = () => {
    setDraftRecords((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        next[st.id] = {
          status: 'H',
          hasLetter: undefined,
          notes: prev[st.id]?.notes || '',
        };
      });
      return next;
    });
  };

  const hasSavedRecords = useMemo(() => {
    return attendanceRecords.some(
      (r) => r.date === selectedDate && r.className === selectedClass
    );
  }, [attendanceRecords, selectedDate, selectedClass]);

  const hasChanges = useMemo(() => {
    return classStudents.some((st) => {
      const existing = attendanceRecords.find(
        (r) => r.date === selectedDate && r.studentId === st.id
      );
      const draft = draftRecords[st.id];
      if (!draft) return false;
      if (!existing) return true;
      if (existing.status !== draft.status) return true;
      if (existing.hasLetter !== draft.hasLetter) return true;
      if ((existing.notes || '') !== (draft.notes || '')) return true;
      return false;
    });
  }, [classStudents, attendanceRecords, selectedDate, draftRecords]);

  const isUpdateMode = hasSavedRecords && hasChanges;

  const [toastMessage, setToastMessage] = useState('');

  const handleSave = () => {
    const updated: AttendanceRecord[] = classStudents.map((student) => {
      const draft = draftRecords[student.id] || { status: 'H', notes: '' };
      const existing = attendanceRecords.find(
        (r) => r.date === selectedDate && r.studentId === student.id
      );
      return {
        id: existing?.id || `att-${selectedDate}-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        nisn: student.nisn,
        className: selectedClass,
        date: selectedDate,
        status: draft.status,
        hasLetter: draft.hasLetter,
        notes: draft.notes,
        recordedBy: currentUserName,
        timestamp: new Date().toISOString(),
      };
    });

    onSaveAttendance(updated);

    const alpaList = classStudents.filter((st) => draftRecords[st.id]?.status === 'A');
    if (alpaList.length > 0) {
      alpaList.forEach((st) => {
        onOpenQuickDiscipline(st, 'Tanpa Keterangan (Alpa) pada presensi harian');
      });
    }

    setToastMessage(
      isUpdateMode
        ? `Perubahan presensi Kelas ${selectedClass} (${draftCounts.total} siswa) berhasil diperbarui!`
        : `Presensi Kelas ${selectedClass} (${draftCounts.total} siswa) berhasil disimpan!`
    );
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  const filteredStudents = classStudents.filter((st) =>
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.nisn.includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-12 font-roboto text-[#1C1B1F]">
      {/* Top Header Card */}
      <MdCard variant="elevated" radius="large" className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-medium text-[#1C1B1F] tracking-tight">
              Input Data Presensi
            </h2>
            {isUpdateMode && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#FFE0B2] text-[#E65100]">
                Ada Perubahan
              </span>
            )}
          </div>
        </div>

        {/* Date, Grade tabs, and Class selector */}
        <div className="pt-3 border-t border-[#E8DEF8] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tanggal Presensi */}
          <div className="flex items-center gap-2 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
            <Calendar className="w-4 h-4 text-[#6750A4] shrink-0" />
            <span className="text-[#49454F]">Tanggal:</span>
            <input
              id="attendance-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-[#1C1B1F] font-medium focus:outline-hidden cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* Grade filter tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#E7E0EC] rounded-full text-xs">
              <span className="text-[#49454F] px-2 text-[11px]">Jenjang:</span>
              {(['X', 'XI', 'XII'] as const).map((gr) => (
                <button
                  key={gr}
                  type="button"
                  id={`daily-grade-${gr}`}
                  onClick={() => handleGradeChange(gr)}
                  className={`px-4 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    selectedGrade === gr
                      ? 'bg-[#6750A4] text-white font-medium shadow-xs'
                      : 'text-[#49454F] hover:bg-[#6750A4]/10'
                  }`}
                >
                  Kelas {gr}
                </button>
              ))}
            </div>

            {/* Class dropdown */}
            <div className="flex items-center gap-2 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
              <Layers className="w-4 h-4 text-[#6750A4] shrink-0" />
              <span className="text-[#49454F]">Pilih Kelas:</span>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-medium text-[#1C1B1F] focus:outline-hidden cursor-pointer"
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
      </MdCard>

      {/* Save Success Toast */}
      {saveToast && (
        <div className="p-4 rounded-2xl bg-[#C8E6C9] text-[#1B5E20] text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 font-medium">
            <Check className="w-4 h-4 text-[#1B5E20]" />
            <span>{toastMessage}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A5D6A7] text-[#1B5E20] uppercase">
            Tersimpan
          </span>
        </div>
      )}

      {/* Banner Notifikasi Ada Perubahan Data Presensi */}
      {isUpdateMode && (
        <div className="p-4 rounded-2xl bg-[#FFE0B2] text-[#E65100] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-5 h-5 text-[#E65100] shrink-0" />
            <span>Presensi kelas ini sudah pernah diinput. Ada <strong>perubahan data absensi</strong> yang belum disimpan.</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#E65100] text-white font-medium rounded-full text-xs cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Update Presensi Sekarang</span>
          </button>
        </div>
      )}

      {/* Attendance Summary Ribbon & Quick Action */}
      <MdCard variant="filled" radius="large" className="p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-[#1C1B1F] mr-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8DEF8] text-[#1D192B] text-[11px] font-medium">
              Jenjang {currentClassInfo?.grade || selectedGrade}
            </span>
            <span className="text-sm font-bold">Kelas {selectedClass}</span>
            {currentClassInfo?.homeroom && (
              <span className="text-[#49454F] text-xs hidden sm:inline">
                ({currentClassInfo.homeroom})
              </span>
            )}
            <span className="text-[#49454F]">• {draftCounts.total} Siswa:</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#C8E6C9] text-[#1B5E20] font-medium">
            H: {draftCounts.h}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] font-medium">
            S: {draftCounts.s}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#E1F5FE] text-[#0277BD] font-medium">
            I: {draftCounts.i}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FFDAD6] text-[#410002] font-medium">
            A: {draftCounts.a}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#E8DEF8] text-[#1D192B] font-medium">
            D: {draftCounts.d}
          </span>

          {(draftCounts.i > 0 || draftCounts.s > 0) && (
            <span className="ml-2 px-3 py-1 rounded-full bg-[#E7E0EC] text-[#1C1B1F] text-[11px]">
              Surat S/I: <strong className="text-[#1B5E20]">{draftCounts.suratLengkap} Ada</strong> • <strong className="text-[#BA1A1A]">{draftCounts.suratBelum} Belum</strong>
            </span>
          )}
        </div>

        <MdButton
          variant="tonal"
          size="sm"
          onClick={handleMarkAllHadir}
          icon={<Sparkles className="w-4 h-4 text-[#6750A4]" />}
        >
          <span>Tandai Semua Hadir (H)</span>
        </MdButton>
      </MdCard>

      {/* Student List Table */}
      <div className="bg-[#F3EDF7] rounded-[32px] shadow-sm border border-[#E8DEF8] overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-[#E8DEF8] flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F]" />
            <input
              id="search-class-student-input"
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#E7E0EC] rounded-full text-xs text-[#1C1B1F] placeholder-[#49454F] focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-[#49454F] ml-3">
            Menampilkan <strong className="text-[#1C1B1F]">{filteredStudents.length} siswa</strong> ({selectedClass})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E7E0EC]/80 text-[11px] font-medium uppercase tracking-wider text-[#49454F] border-b border-[#E8DEF8]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28 text-center">NISN</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                <th className="py-3 px-2 text-center w-12">L/P</th>
                <th className="py-3 px-3 text-center min-w-[260px]">Status Presensi</th>
                <th className="py-3 px-4 min-w-[190px]">Surat Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DEF8] text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#49454F]">
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
                      className={`hover:bg-[#FFFBFE] transition-colors ${
                        draft.status === 'A'
                          ? 'bg-[#FFDAD6]/30'
                          : draft.status === 'D'
                          ? 'bg-[#E8DEF8]/30'
                          : draft.status === 'S'
                          ? 'bg-[#FFF3E0]/40'
                          : draft.status === 'I'
                          ? 'bg-[#E1F5FE]/40'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold text-[#49454F]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-[#1C1B1F]">
                        {student.nisn}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1C1B1F]">
                        {student.name}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            student.gender === 'L' ? 'bg-[#E1F5FE] text-[#0277BD]' : 'bg-[#FCE4EC] text-[#C2185B]'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      {/* H, S, I, A, D MD3 Buttons */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* H: Hadir */}
                          <button
                            type="button"
                            id={`btn-H-${student.id}`}
                            onClick={() => handleStatusChange(student.id, 'H')}
                            title="Hadir"
                            className={`w-9 h-8 rounded-full font-bold text-xs transition-all duration-200 cursor-pointer active:scale-95 ${
                              draft.status === 'H'
                                ? 'bg-[#2E7D32] text-white shadow-xs'
                                : 'bg-[#FFFBFE] text-[#49454F] hover:bg-[#C8E6C9]'
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
                            className={`w-9 h-8 rounded-full font-bold text-xs transition-all duration-200 cursor-pointer active:scale-95 ${
                              draft.status === 'S'
                                ? 'bg-[#EF6C00] text-white shadow-xs'
                                : 'bg-[#FFFBFE] text-[#49454F] hover:bg-[#FFE0B2]'
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
                            className={`w-9 h-8 rounded-full font-bold text-xs transition-all duration-200 cursor-pointer active:scale-95 ${
                              draft.status === 'I'
                                ? 'bg-[#0277BD] text-white shadow-xs'
                                : 'bg-[#FFFBFE] text-[#49454F] hover:bg-[#E1F5FE]'
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
                            className={`w-9 h-8 rounded-full font-bold text-xs transition-all duration-200 cursor-pointer active:scale-95 ${
                              draft.status === 'A'
                                ? 'bg-[#C62828] text-white shadow-xs'
                                : 'bg-[#FFFBFE] text-[#49454F] hover:bg-[#FFDAD6]'
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
                            className={`w-9 h-8 rounded-full font-bold text-xs transition-all duration-200 cursor-pointer active:scale-95 ${
                              draft.status === 'D'
                                ? 'bg-[#6750A4] text-white shadow-xs'
                                : 'bg-[#FFFBFE] text-[#49454F] hover:bg-[#E8DEF8]'
                            }`}
                          >
                            D
                          </button>
                        </div>
                      </td>

                      {/* Status Surat */}
                      <td className="py-2.5 px-4">
                        {isSickOrPermit ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                id={`letter-yes-${student.id}`}
                                onClick={() => handleLetterToggle(student.id, 'Sudah Ada Surat')}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                  draft.hasLetter === 'Sudah Ada Surat'
                                    ? 'bg-[#2E7D32] text-white'
                                    : 'bg-[#FFFBFE] text-[#49454F] hover:bg-[#C8E6C9]'
                                }`}
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>Ada Surat</span>
                              </button>

                              <button
                                type="button"
                                id={`letter-no-${student.id}`}
                                onClick={() => handleLetterToggle(student.id, 'Belum Ada Surat')}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                  draft.hasLetter === 'Belum Ada Surat'
                                    ? 'bg-[#C62828] text-white'
                                    : 'bg-[#FFFBFE] text-[#49454F] hover:bg-[#FFDAD6]'
                                }`}
                              >
                                <FileX className="w-3 h-3" />
                                <span>Belum Ada</span>
                              </button>
                            </div>
                            <span className="text-[10px] text-[#49454F]">
                              {draft.hasLetter === 'Sudah Ada Surat' ? '✓ Ada surat fisik/foto' : '⚠ Belum kumpul surat'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#49454F] italic">
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
        <div className="p-5 bg-[#E7E0EC]/60 border-t border-[#E8DEF8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#49454F]">
            Pastikan siswa yang <strong>Sakit (S)</strong> dan <strong>Izin (I)</strong> telah dikonfirmasi status suratnya.
          </div>
          <MdButton
            variant={isUpdateMode ? 'tonal' : 'filled'}
            size="lg"
            id="bottom-save-btn"
            onClick={handleSave}
            icon={isUpdateMode ? <RefreshCw className="w-4 h-4" /> : hasSavedRecords && !hasChanges ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          >
            {isUpdateMode ? (
              <span>Update Presensi Kelas {selectedClass}</span>
            ) : hasSavedRecords && !hasChanges ? (
              <span>Presensi Kelas {selectedClass} Tersimpan</span>
            ) : (
              <span>Simpan Presensi Kelas {selectedClass}</span>
            )}
          </MdButton>
        </div>
      </div>
    </div>
  );
};
