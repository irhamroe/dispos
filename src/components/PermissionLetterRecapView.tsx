import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  X, 
  Upload, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  HelpCircle,
  FileCheck2,
  FileWarning,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, LetterStatus, SchoolProfile, Student } from '../types';
import { RombelClass } from '../data/initialData';
import { 
  exportPermissionLettersToExcel, 
  exportPermissionLettersToPdf, 
  formatDateIndonesian, 
  getTodayDateString, 
  getTodayIndonesian 
} from '../utils/exportUtils';

interface PermissionLetterRecapViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  classes: RombelClass[];
  schoolProfile: SchoolProfile;
  onUpdateAttendance: (updatedRecords: AttendanceRecord[]) => void;
}

export const PermissionLetterRecapView: React.FC<PermissionLetterRecapViewProps> = ({
  students,
  attendanceRecords,
  classes,
  schoolProfile,
  onUpdateAttendance,
}) => {
  // Date filters - default to active range
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>(() => getTodayDateString());

  // Filter letter status: default to 'BELUM' to focus on students who have not submitted their letters
  const [letterFilter, setLetterFilter] = useState<'BELUM' | 'SUDAH' | 'ALL'>('BELUM');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'I' | 'S'>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [markingRecord, setMarkingRecord] = useState<AttendanceRecord | null>(null);
  const [letterReceiptDate, setLetterReceiptDate] = useState<string>(() => getTodayDateString());
  const [letterNotes, setLetterNotes] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Filtered classes by grade
  const availableClasses = useMemo(() => {
    if (selectedGrade === 'ALL') return classes;
    return classes.filter((c) => c.grade === selectedGrade);
  }, [classes, selectedGrade]);

  // Base list of all 'I' (Izin) and 'S' (Sakit) records
  const allAbsenceWithLetterDuty = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      // Must be Izin or Sakit
      if (rec.status !== 'I' && rec.status !== 'S') return false;

      // Date range filter
      if (startDate && rec.date < startDate) return false;
      if (endDate && rec.date > endDate) return false;

      // Grade and Class filter
      if (selectedGrade !== 'ALL') {
        const student = students.find((s) => s.id === rec.studentId);
        if (student && student.grade !== selectedGrade) return false;
      }
      if (selectedClass !== 'ALL' && rec.className !== selectedClass) return false;

      // Type filter (I vs S)
      if (typeFilter !== 'ALL' && rec.status !== typeFilter) return false;

      // Letter filter (Belum vs Sudah)
      const isLetterDone = rec.hasLetter === 'Sudah Ada Surat';
      if (letterFilter === 'BELUM' && isLetterDone) return false;
      if (letterFilter === 'SUDAH' && !isLetterDone) return false;

      return true;
    });
  }, [attendanceRecords, startDate, endDate, selectedGrade, selectedClass, typeFilter, letterFilter, students]);

  // Search filter
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return allAbsenceWithLetterDuty;
    const q = searchQuery.toLowerCase();
    return allAbsenceWithLetterDuty.filter((rec) => {
      return (
        rec.studentName.toLowerCase().includes(q) ||
        rec.nisn.includes(q) ||
        rec.className.toLowerCase().includes(q) ||
        (rec.notes && rec.notes.toLowerCase().includes(q))
      );
    });
  }, [allAbsenceWithLetterDuty, searchQuery]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Aggregate KPI metrics across the date range and class filter (independent of letterFilter)
  const metrics = useMemo(() => {
    const scopedRecords = attendanceRecords.filter((rec) => {
      if (rec.status !== 'I' && rec.status !== 'S') return false;
      if (startDate && rec.date < startDate) return false;
      if (endDate && rec.date > endDate) return false;
      if (selectedGrade !== 'ALL') {
        const student = students.find((s) => s.id === rec.studentId);
        if (student && student.grade !== selectedGrade) return false;
      }
      if (selectedClass !== 'ALL' && rec.className !== selectedClass) return false;
      return true;
    });

    const total = scopedRecords.length;
    const belumKumpul = scopedRecords.filter((r) => r.hasLetter !== 'Sudah Ada Surat').length;
    const sudahKumpul = scopedRecords.filter((r) => r.hasLetter === 'Sudah Ada Surat').length;
    const izinBelum = scopedRecords.filter((r) => r.status === 'I' && r.hasLetter !== 'Sudah Ada Surat').length;
    const sakitBelum = scopedRecords.filter((r) => r.status === 'S' && r.hasLetter !== 'Sudah Ada Surat').length;

    const complianceRate = total > 0 ? Math.round((sudahKumpul / total) * 100) : 100;

    return { total, belumKumpul, sudahKumpul, izinBelum, sakitBelum, complianceRate };
  }, [attendanceRecords, startDate, endDate, selectedGrade, selectedClass, students]);

  // Open modal to mark single letter as collected
  const handleOpenMarkModal = (rec: AttendanceRecord) => {
    setMarkingRecord(rec);
    setLetterReceiptDate(getTodayDateString());
    setLetterNotes(rec.notes || 'Surat fisik diserahkan ke guru piket');
  };

  // Save single letter status update
  const handleSaveMarkRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markingRecord) return;

    const updated: AttendanceRecord = {
      ...markingRecord,
      hasLetter: 'Sudah Ada Surat',
      notes: letterNotes.trim() ? `${letterNotes.trim()} (Diterima tgl ${formatDateIndonesian(letterReceiptDate)})` : `Surat diterima tgl ${formatDateIndonesian(letterReceiptDate)}`,
    };

    onUpdateAttendance([updated]);
    setMarkingRecord(null);
  };

  // Revert letter status to "Belum Ada Surat"
  const handleRevertLetterStatus = (rec: AttendanceRecord) => {
    if (window.confirm(`Batalkan status surat untuk ${rec.studentName}? Siswa ini akan kembali tercatat belum mengumpulkan surat.`)) {
      const updated: AttendanceRecord = {
        ...rec,
        hasLetter: 'Belum Ada Surat',
      };
      onUpdateAttendance([updated]);
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const filterDesc = `${letterFilter === 'BELUM' ? 'Belum Kumpul Surat' : letterFilter === 'SUDAH' ? 'Sudah Ada Surat' : 'Semua'} (${startDate} s/d ${endDate}) Kelas ${selectedClass}`;
    exportPermissionLettersToExcel(schoolProfile, filteredRecords, filterDesc);
  };

  const handleExportPdf = () => {
    const filterDesc = `${letterFilter === 'BELUM' ? 'Belum Kumpul Surat' : letterFilter === 'SUDAH' ? 'Sudah Ada Surat' : 'Semua'} (${startDate} s/d ${endDate}) Kelas ${selectedClass}`;
    exportPermissionLettersToPdf(schoolProfile, filteredRecords, filterDesc);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Navigation Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Rekap Surat Izin &amp; Sakit Siswa</span>
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              id="export-letters-excel-btn"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              id="export-letters-pdf-btn"
              onClick={handleExportPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Date Range & Presets */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-600">Mulai:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-600">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const t = getTodayDateString();
                  setStartDate(t);
                  setEndDate(t);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-09-14');
                  setEndDate('2026-09-17');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Minggu Aktif
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-09-01');
                  setEndDate('2026-09-30');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Bulan Ini
              </button>
            </div>
          </div>

          {/* Quick Tab: Status Surat Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLetterFilter('BELUM');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                letterFilter === 'BELUM'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileWarning className="w-3.5 h-3.5" />
              <span>Belum Kumpul Surat ({metrics.belumKumpul})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLetterFilter('SUDAH');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                letterFilter === 'SUDAH'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Sudah Ada Surat ({metrics.sudahKumpul})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLetterFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                letterFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Semua ({metrics.total})</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Bar: Tingkat, Kelas, Jenis, dan Search */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tingkat */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Tingkat</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value as any);
                setSelectedClass('ALL');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Semua Tingkat (X, XI, XII)</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>
          </div>

          {/* Rombel / Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Kelas / Rombel</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Semua Kelas ({availableClasses.length} Rombel)</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} - {c.homeroom}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Presensi: Izin vs Sakit */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Jenis Ketidakhadiran</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Semua (Izin &amp; Sakit)</option>
              <option value="I">Izin Saja (I)</option>
              <option value="S">Sakit Saja (S)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Cari Siswa</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Nama, NISN, atau alasan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Belum Kumpul Surat */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Belum Kumpul Surat
            </span>
            <div className="text-2xl font-extrabold text-rose-700 mt-1">{metrics.belumKumpul}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Siswa wajib menyerahkan bukti fisik</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <FileWarning className="w-5 h-5" />
          </div>
        </div>

        {/* Izin Tanpa Surat */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Izin Tanpa Surat (I)
            </span>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">{metrics.izinBelum}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Izin lisan / WA belum ada surat</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            I
          </div>
        </div>

        {/* Sakit Tanpa Surat */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Sakit Tanpa Surat (S)
            </span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{metrics.sakitBelum}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Belum ada surat dokter / ortu</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            S
          </div>
        </div>

        {/* Sudah Ada Surat */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Surat Terverifikasi
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{metrics.sudahKumpul}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {metrics.complianceRate}% Pemenuhan surat
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-sm">
              Daftar Siswa ({filteredRecords.length} Catatan)
            </h3>
            {letterFilter === 'BELUM' && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                Menampilkan yang Belum Mengumpulkan Surat
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10.5px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-28 text-center">NISN</th>
                <th className="py-3 px-3 min-w-[180px]">Nama Siswa</th>
                <th className="py-3 px-3 w-24 text-center">Kelas</th>
                <th className="py-3 px-3 w-28 text-center">Status Presensi</th>
                <th className="py-3 px-3 w-36 text-center">Status Surat Izin</th>
                <th className="py-3 px-3 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada data siswa yang cocok dengan filter.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {letterFilter === 'BELUM'
                        ? 'Semua siswa izin & sakit pada kriteria ini telah mengumpulkan surat.'
                        : 'Coba ubah tanggal atau rentang pencarian.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isLetterCollected = rec.hasLetter === 'Sudah Ada Surat';
                  const student = students.find((s) => s.id === rec.studentId);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{globalIdx}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {rec.date}
                        <div className="text-[10px] text-slate-400">{formatDateIndonesian(rec.date)}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-semibold text-slate-600">
                        {rec.nisn}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{rec.studentName}</div>
                        {student && (
                          <div className="text-[10px] text-slate-400">Gender: {student.gender}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 text-center">{rec.className}</td>
                      <td className="py-3 px-3 text-center">
                        {rec.status === 'I' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <span>Izin (I)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <span>Sakit (S)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isLetterCollected ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sudah Ada Surat</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Belum Ada Surat</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isLetterCollected ? (
                            <button
                              type="button"
                              onClick={() => handleOpenMarkModal(rec)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Tandai surat sudah diterima oleh sekolah"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Terima Surat</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevertLetterStatus(rec)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Batalkan (Ubah kembali ke Belum Ada Surat)"
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {paginatedRecords.length} dari {filteredRecords.length} catatan
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 inline" />
                Sebelumnya
              </button>
              <span className="font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Verifikasi / Terima Surat Izin */}
      {markingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="text-base font-bold">Verifikasi Surat Izin / Sakit</h3>
                  <p className="text-xs text-emerald-100">
                    Konfirmasi penerimaan surat keterangan fisik dari siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMarkingRecord(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMarkRecord} className="p-6 space-y-4 text-xs">
              {/* Info Siswa */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">{markingRecord.studentName}</div>
                <div className="text-slate-600 text-[11px]">
                  Kelas {markingRecord.className} • NISN: {markingRecord.nisn}
                </div>
                <div className="text-slate-800 font-semibold pt-1 border-t border-slate-200/80 mt-1 flex items-center justify-between">
                  <span>Tanggal Presensi: {formatDateIndonesian(markingRecord.date)}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    markingRecord.status === 'I' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {markingRecord.status === 'I' ? 'Izin (I)' : 'Sakit (S)'}
                  </span>
                </div>
              </div>

              {/* Tanggal Penyerahan Surat */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tanggal Penyerahan Surat Fisik</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={letterReceiptDate}
                  onChange={(e) => setLetterReceiptDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Catatan / Keterangan Surat */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Keterangan Surat (Dokter / Orang Tua)
                </label>
                <textarea
                  rows={3}
                  value={letterNotes}
                  onChange={(e) => setLetterNotes(e.target.value)}
                  placeholder="Contoh: Surat dokter RS Karsa Husada Batu, izin istirahat 2 hari."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMarkingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan &amp; Tandai Sudah Ada Surat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
