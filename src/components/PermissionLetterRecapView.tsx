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
  Sparkles,
  UserX,
  AlertTriangle
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
import { sortClasses, compareClassNames } from '../utils/sortUtils';

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

  // Modal states - Terima Surat
  const [markingRecord, setMarkingRecord] = useState<AttendanceRecord | null>(null);
  const [letterReceiptDate, setLetterReceiptDate] = useState<string>(() => getTodayDateString());
  const [letterNotes, setLetterNotes] = useState<string>('');

  // Modal states - Ubah ke Alpa
  const [alpaModalRecord, setAlpaModalRecord] = useState<AttendanceRecord | null>(null);
  const [alpaReason, setAlpaReason] = useState<string>('Surat izin/sakit belum diterima setelah batas waktu');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Filtered classes by grade
  const availableClasses = useMemo(() => {
    const list = selectedGrade === 'ALL' ? classes : classes.filter((c) => c.grade === selectedGrade);
    return sortClasses(list);
  }, [classes, selectedGrade]);

  // Base list of all 'I' (Izin) and 'S' (Sakit) records
  const allAbsenceWithLetterDuty = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      if (rec.status !== 'I' && rec.status !== 'S') return false;

      if (startDate && rec.date < startDate) return false;
      if (endDate && rec.date > endDate) return false;

      if (selectedGrade !== 'ALL') {
        const student = students.find((s) => s.id === rec.studentId);
        if (student && student.grade !== selectedGrade) return false;
      }
      if (selectedClass !== 'ALL' && rec.className !== selectedClass) return false;

      if (typeFilter !== 'ALL' && rec.status !== typeFilter) return false;

      const isLetterDone = rec.hasLetter === 'Sudah Ada Surat';
      if (letterFilter === 'BELUM' && isLetterDone) return false;
      if (letterFilter === 'SUDAH' && !isLetterDone) return false;

      return true;
    });
  }, [attendanceRecords, startDate, endDate, selectedGrade, selectedClass, typeFilter, letterFilter, students]);

  // Search filter
  const filteredRecords = useMemo(() => {
    const list = !searchQuery.trim()
      ? allAbsenceWithLetterDuty
      : allAbsenceWithLetterDuty.filter((rec) => {
          const q = searchQuery.toLowerCase();
          return (
            rec.studentName.toLowerCase().includes(q) ||
            rec.nisn.includes(q) ||
            rec.className.toLowerCase().includes(q) ||
            (rec.notes && rec.notes.toLowerCase().includes(q))
          );
        });

    return [...list].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const classComp = compareClassNames(a.className, b.className);
      if (classComp !== 0) return classComp;
      return a.studentName.localeCompare(b.studentName, 'id', { sensitivity: 'base' });
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

  // Open modal to change status to Alpa (A)
  const handleOpenAlpaModal = (rec: AttendanceRecord) => {
    setAlpaModalRecord(rec);
    setAlpaReason('Surat izin/sakit belum diterima setelah batas waktu');
  };

  // Confirm single record change to Alpa
  const handleConfirmConvertToAlpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alpaModalRecord) return;

    const todayStr = formatDateIndonesian(getTodayDateString());
    const reasonText = alpaReason.trim() ? alpaReason.trim() : 'Surat izin/sakit tidak diserahkan';
    const noteText = `Diubah ke Alpa (A) pada ${todayStr} - Alasan: ${reasonText}`;

    const updated: AttendanceRecord = {
      ...alpaModalRecord,
      status: 'A',
      hasLetter: 'Belum Ada Surat',
      notes: alpaModalRecord.notes ? `${alpaModalRecord.notes} | ${noteText}` : noteText,
    };

    onUpdateAttendance([updated]);
    setAlpaModalRecord(null);
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
      {/* Header & Quick Navigation Switcher with Claymorphism */}
      <div className="relative overflow-hidden rounded-[36px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-clay-card border border-white/60 space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-clay-button shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#332F3A] tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Rekap Surat Izin &amp; Sakit Siswa
              </h2>
              <p className="text-sm text-[#635F69] mt-1 font-medium">
                Monitoring kepatuhan pengumpulan bukti fisik surat izin dan surat dokter
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              id="export-letters-excel-btn"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              id="export-letters-pdf-btn"
              onClick={handleExportPdf}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Date Range & Letter Status Tabs */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-[#EFEBF5] px-4 py-2.5 rounded-2xl shadow-clay-pressed">
              <Calendar className="w-4 h-4 text-[#7C3AED]" />
              <span className="font-bold text-[#635F69]">Mulai:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-extrabold text-[#332F3A] focus:outline-hidden cursor-pointer"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
            </div>

            <div className="flex items-center gap-2 bg-[#EFEBF5] px-4 py-2.5 rounded-2xl shadow-clay-pressed">
              <Calendar className="w-4 h-4 text-[#7C3AED]" />
              <span className="font-bold text-[#635F69]">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-extrabold text-[#332F3A] focus:outline-hidden cursor-pointer"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
            </div>
          </div>

          {/* Quick Tab: Status Surat Filter */}
          <div className="flex items-center p-1.5 bg-[#EFEBF5] rounded-2xl shadow-clay-pressed text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                setLetterFilter('BELUM');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                letterFilter === 'BELUM'
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white font-black shadow-clay-button -translate-y-0.5'
                  : 'text-[#635F69] hover:text-[#332F3A]'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <FileWarning className="w-4 h-4" />
              <span>Belum Kumpul Surat ({metrics.belumKumpul})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLetterFilter('SUDAH');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                letterFilter === 'SUDAH'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black shadow-clay-button -translate-y-0.5'
                  : 'text-[#635F69] hover:text-[#332F3A]'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Sudah Ada Surat ({metrics.sudahKumpul})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLetterFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                letterFilter === 'ALL'
                  ? 'bg-white text-[#332F3A] font-black shadow-clay-surface -translate-y-0.5'
                  : 'text-[#635F69] hover:text-[#332F3A]'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <span>Semua ({metrics.total})</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Tingkat */}
          <div>
            <label className="block text-[11px] font-black text-[#635F69] mb-1.5 uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Tingkat</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value as any);
                setSelectedClass('ALL');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl font-extrabold text-[#332F3A] shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <option value="ALL">Semua Tingkat (X, XI, XII)</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>
          </div>

          {/* Rombel / Kelas */}
          <div>
            <label className="block text-[11px] font-black text-[#635F69] mb-1.5 uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Kelas / Rombel</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl font-extrabold text-[#332F3A] shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
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
            <label className="block text-[11px] font-black text-[#635F69] mb-1.5 uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Jenis Ketidakhadiran</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl font-extrabold text-[#332F3A] shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <option value="ALL">Semua (Izin &amp; Sakit)</option>
              <option value="I">Izin Saja (I)</option>
              <option value="S">Sakit Saja (S)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-black text-[#635F69] mb-1.5 uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Cari Siswa</label>
            <div className="relative">
              <Search className="w-5 h-5 text-[#635F69] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nama, NISN, atau alasan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 bg-[#EFEBF5] rounded-2xl font-medium text-xs text-[#332F3A] placeholder-[#635F69] shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-rose-200/60 hover:-translate-y-1.5 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Belum Kumpul Surat
            </span>
            <div className="text-3xl font-black text-rose-700 mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{metrics.belumKumpul}</div>
            <div className="text-[11px] text-[#635F69] mt-0.5 font-medium">Siswa wajib serahkan bukti fisik</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-bold shadow-clay-button">
            <FileWarning className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-sky-200/60 hover:-translate-y-1.5 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Izin Tanpa Surat (I)
            </span>
            <div className="text-3xl font-black text-sky-700 mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{metrics.izinBelum}</div>
            <div className="text-[11px] text-[#635F69] mt-0.5 font-medium">Izin lisan / WA belum ada surat</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-clay-button" style={{ fontFamily: 'Nunito, sans-serif' }}>
            I
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-amber-200/60 hover:-translate-y-1.5 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Sakit Tanpa Surat (S)
            </span>
            <div className="text-3xl font-black text-amber-700 mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{metrics.sakitBelum}</div>
            <div className="text-[11px] text-[#635F69] mt-0.5 font-medium">Belum ada surat dokter / ortu</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-lg shadow-clay-button" style={{ fontFamily: 'Nunito, sans-serif' }}>
            S
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-emerald-200/60 hover:-translate-y-1.5 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Surat Terverifikasi
            </span>
            <div className="text-3xl font-black text-emerald-700 mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{metrics.sudahKumpul}</div>
            <div className="text-[11px] text-emerald-600 font-extrabold mt-0.5">
              {metrics.complianceRate}% Pemenuhan surat
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-clay-button">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-[36px] bg-white/80 backdrop-blur-xl shadow-clay-card border border-white/60 overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-black text-[#332F3A] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Daftar Siswa ({filteredRecords.length} Catatan)
            </h3>
            {letterFilter === 'BELUM' && (
              <span className="px-3 py-1 text-xs font-black rounded-xl bg-rose-100 text-rose-700 border border-rose-200 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Menampilkan yang Belum Mengumpulkan Surat
              </span>
            )}
          </div>

          <div className="text-xs text-[#635F69] font-medium">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/80 to-amber-50/50 border-b border-slate-200/80 text-[#635F69] font-black uppercase text-xs" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <th className="py-4 px-4 w-12 text-center">No</th>
                <th className="py-4 px-4 w-32">Tanggal</th>
                <th className="py-4 px-4 w-28 text-center">NISN</th>
                <th className="py-4 px-4 min-w-[180px]">Nama Siswa</th>
                <th className="py-4 px-4 w-24 text-center">Kelas</th>
                <th className="py-4 px-4 w-28 text-center">Status Presensi</th>
                <th className="py-4 px-4 w-36 text-center">Status Surat Izin</th>
                <th className="py-4 px-4 w-52 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#635F69]">
                    <div className="w-16 h-16 rounded-full bg-[#EFEBF5] text-[#635F69] flex items-center justify-center mx-auto mb-3 shadow-clay-surface">
                      <FileCheck2 className="w-8 h-8" />
                    </div>
                    <p className="font-black text-base text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>Tidak ada data siswa yang cocok dengan filter.</p>
                    <p className="text-xs text-[#635F69] mt-1">
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
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-center text-[#635F69] font-bold">{globalIdx}</td>
                      <td className="py-4 px-4 font-extrabold text-[#332F3A] whitespace-nowrap" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {rec.date}
                        <div className="text-[11px] text-[#635F69] font-normal">{formatDateIndonesian(rec.date)}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-[#635F69]">
                        {rec.nisn}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-sm text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>{rec.studentName}</div>
                        {student && (
                          <div className="text-[11px] text-[#635F69]">Gender: {student.gender}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-black text-[#332F3A] text-center" style={{ fontFamily: 'Nunito, sans-serif' }}>{rec.className}</td>
                      <td className="py-4 px-4 text-center">
                        {rec.status === 'I' ? (
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            <span>Izin (I)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            <span>Sakit (S)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isLetterCollected ? (
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Sudah Ada Surat</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>Belum Ada Surat</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {!isLetterCollected ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenMarkModal(rec)}
                                className="px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed cursor-pointer flex items-center gap-1.5"
                                title="Tandai surat sudah diterima oleh sekolah"
                                style={{ fontFamily: 'Nunito, sans-serif' }}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Terima Surat</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAlpaModal(rec)}
                                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 font-extrabold text-xs transition-all shadow-clay-surface hover:-translate-y-0.5 active:scale-[0.92] cursor-pointer flex items-center gap-1.5"
                                title="Ubah status presensi menjadi Alpa (A) karena tidak mengumpulkan surat izin/sakit"
                                style={{ fontFamily: 'Nunito, sans-serif' }}
                              >
                                <UserX className="w-4 h-4" />
                                <span>Ubah ke Alpa</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevertLetterStatus(rec)}
                              className="px-3 py-1.5 rounded-xl bg-[#EFEBF5] hover:bg-white text-[#635F69] hover:text-rose-700 font-extrabold text-xs shadow-clay-button active:scale-[0.92] transition-all cursor-pointer"
                              title="Batalkan (Ubah kembali ke Belum Ada Surat)"
                              style={{ fontFamily: 'Nunito, sans-serif' }}
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
          <div className="p-5 bg-[#EFEBF5]/40 border-t border-slate-200/60 flex items-center justify-between text-xs text-[#635F69]">
            <div className="font-medium">
              Menampilkan {paginatedRecords.length} dari {filteredRecords.length} catatan
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3.5 py-2 rounded-xl bg-white shadow-clay-button disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer font-bold"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Sebelumnya
              </button>
              <span className="font-black text-[#332F3A] px-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3.5 py-2 rounded-xl bg-white shadow-clay-button disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer font-bold"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Verifikasi / Terima Surat Izin */}
      {markingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#332F3A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-lg w-full border border-white/60 shadow-clay-card overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-clay-surface">
                  <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-lg font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>Verifikasi Surat Izin / Sakit</h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Konfirmasi penerimaan surat keterangan fisik dari siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMarkingRecord(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMarkRecord} className="p-6 sm:p-8 space-y-5 text-xs">
              {/* Info Siswa */}
              <div className="p-4 bg-[#EFEBF5] rounded-2xl shadow-clay-pressed space-y-1">
                <div className="font-black text-[#332F3A] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{markingRecord.studentName}</div>
                <div className="text-[#635F69] text-xs">
                  Kelas {markingRecord.className} • NISN: {markingRecord.nisn}
                </div>
                <div className="text-[#332F3A] font-bold pt-1.5 border-t border-slate-300/40 mt-1.5 flex items-center justify-between">
                  <span>Tanggal Presensi: {formatDateIndonesian(markingRecord.date)}</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black shadow-clay-surface ${
                    markingRecord.status === 'I' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                  }`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {markingRecord.status === 'I' ? 'Izin (I)' : 'Sakit (S)'}
                  </span>
                </div>
              </div>

              {/* Tanggal Penyerahan Surat */}
              <div>
                <label className="block font-black text-[#332F3A] mb-1.5 flex items-center gap-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Tanggal Penyerahan Surat Fisik</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={letterReceiptDate}
                  onChange={(e) => setLetterReceiptDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl text-[#332F3A] font-bold shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Catatan / Keterangan Surat */}
              <div>
                <label className="block font-black text-[#332F3A] mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Catatan Keterangan Surat (Dokter / Orang Tua)
                </label>
                <textarea
                  rows={3}
                  value={letterNotes}
                  onChange={(e) => setLetterNotes(e.target.value)}
                  placeholder="Contoh: Surat dokter RS Karsa Husada Batu, izin istirahat 2 hari."
                  className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl text-[#332F3A] font-medium shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMarkingRecord(null)}
                  className="px-5 py-2.5 rounded-2xl bg-[#EFEBF5] hover:bg-white text-[#635F69] font-black transition-all shadow-clay-button active:scale-[0.92] active:shadow-clay-pressed cursor-pointer"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed cursor-pointer flex items-center gap-2"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Simpan &amp; Tandai Sudah Ada Surat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Ubah Status ke Alpa (A) */}
      {alpaModalRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#332F3A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-lg w-full border border-white/60 shadow-clay-card overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-6 bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-clay-surface">
                  <UserX className="w-6 h-6 text-rose-200" />
                </div>
                <div>
                  <h3 className="text-lg font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>Ubah Status Presensi ke Alpa (A)</h3>
                  <p className="text-xs text-rose-100 font-medium">
                    Sanksi/penyesuaian karena tidak menyerahkan surat izin atau sakit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlpaModalRecord(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConvertToAlpa} className="p-6 sm:p-8 space-y-5 text-xs">
              {/* Info Siswa */}
              <div className="p-4 bg-[#EFEBF5] rounded-2xl shadow-clay-pressed space-y-1">
                <div className="font-black text-[#332F3A] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{alpaModalRecord.studentName}</div>
                <div className="text-[#635F69] text-xs">
                  Kelas {alpaModalRecord.className} • NISN: {alpaModalRecord.nisn}
                </div>
                <div className="text-[#332F3A] font-bold pt-1.5 border-t border-slate-300/40 mt-1.5 flex items-center justify-between">
                  <span>Tanggal Presensi: {formatDateIndonesian(alpaModalRecord.date)}</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black shadow-clay-surface ${
                    alpaModalRecord.status === 'I' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                  }`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Status Saat Ini: {alpaModalRecord.status === 'I' ? 'Izin (I)' : 'Sakit (S)'}
                  </span>
                </div>
              </div>

              {/* Alert Peringatan */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 shadow-clay-surface">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Perhatian:</strong> Mengubah status presensi menjadi <strong>Alpa (A)</strong> akan memperbarui kehadiran siswa pada tanggal tersebut menjadi tanpa keterangan, dan masuk dalam akumulasi rekapitulasi presensi.
                </div>
              </div>

              {/* Alasan Perubahan */}
              <div>
                <label className="block font-black text-[#332F3A] mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Keterangan / Alasan Perubahan ke Alpa
                </label>
                <textarea
                  rows={2}
                  value={alpaReason}
                  onChange={(e) => setAlpaReason(e.target.value)}
                  placeholder="Contoh: Surat izin/sakit belum diterima setelah batas waktu yang ditentukan."
                  className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl text-[#332F3A] font-medium shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-rose-500/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAlpaModalRecord(null)}
                  className="px-5 py-2.5 rounded-2xl bg-[#EFEBF5] hover:bg-white text-[#635F69] font-black transition-all shadow-clay-button active:scale-[0.92] active:shadow-clay-pressed cursor-pointer"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed cursor-pointer flex items-center gap-2"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  <UserX className="w-5 h-5" />
                  <span>Ya, Ubah Jadi Alpa (A)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
