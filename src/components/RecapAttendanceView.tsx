import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  Layers, 
  FileCheck 
} from 'lucide-react';
import { AttendanceRecord, SchoolProfile, Student, StudentRecapItem } from '../types';
import { RombelClass } from '../data/initialData';
import { 
  exportAttendanceToExcel, 
  exportAttendanceToPdf, 
  formatDateIndonesian,
  getDaysDifference,
  getDatesRangeList,
  getDayShortName,
  isWeekendDay,
  getTodayDateString
} from '../utils/exportUtils';
import { sortClasses, sortStudents } from '../utils/sortUtils';

interface RecapAttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  classes: RombelClass[];
  schoolProfile: SchoolProfile;
}

export const RecapAttendanceView: React.FC<RecapAttendanceViewProps> = ({
  students,
  attendanceRecords,
  classes,
  schoolProfile,
}) => {
  // Date Range state - otomatis disetel ke tanggal hari ini saat aplikasi dibuka
  const [startDate, setStartDate] = useState<string>(() => getTodayDateString());
  const [endDate, setEndDate] = useState<string>(() => getTodayDateString());

  // Grade & Class filter
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('X');
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state for smooth viewing
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  // Calculate day difference to determine display mode (≤ 31 days = Status Per Tanggal, > 31 days = Jumlah Saja)
  const diffDays = useMemo(() => {
    return getDaysDifference(startDate, endDate);
  }, [startDate, endDate]);

  const isDailyView = diffDays > 0 && diffDays <= 31;

  // List of all individual dates in the range when in Daily View
  const datesList = useMemo(() => {
    if (!isDailyView) return [];
    return getDatesRangeList(startDate, endDate);
  }, [isDailyView, startDate, endDate]);

  // Fast map lookup for student attendance status on specific dates
  const attendanceRecordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    if (!isDailyView) return map;
    attendanceRecords.forEach((r) => {
      if (r.date >= startDate && r.date <= endDate) {
        map.set(`${r.studentId}_${r.date}`, r);
      }
    });
    return map;
  }, [attendanceRecords, isDailyView, startDate, endDate]);

  // Filtered classes according to selectedGrade
  const availableClasses = useMemo(() => {
    const list = selectedGrade === 'ALL' ? classes : classes.filter((c) => c.grade === selectedGrade);
    return sortClasses(list);
  }, [classes, selectedGrade]);

  // Compute student attendance summary across date range
  const studentRecapList: StudentRecapItem[] = useMemo(() => {
    const targetStudents = sortStudents(
      students.filter((s) => {
        const matchGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;
        const matchClass = selectedClass === 'ALL' || s.className === selectedClass;
        return matchGrade && matchClass;
      })
    );

    const filteredRecords = attendanceRecords.filter((rec) => {
      return rec.date >= startDate && rec.date <= endDate;
    });

    const distinctDates = Array.from(new Set(filteredRecords.map((r) => r.date)));
    const totalDays = distinctDates.length || 1;

    return targetStudents.map((st) => {
      const stRecords = filteredRecords.filter((r) => r.studentId === st.id);

      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alpa = 0;
      let dispen = 0;
      let suratLengkap = 0;
      let suratBelumAda = 0;

      stRecords.forEach((r) => {
        if (r.status === 'H') hadir++;
        else if (r.status === 'I') {
          izin++;
          if (r.hasLetter === 'Sudah Ada Surat') suratLengkap++;
          else suratBelumAda++;
        } else if (r.status === 'S') {
          sakit++;
          if (r.hasLetter === 'Sudah Ada Surat') suratLengkap++;
          else suratBelumAda++;
        } else if (r.status === 'A') alpa++;
        else if (r.status === 'D') dispen++;
      });

      const effectivePresent = hadir + dispen;
      const totalCount = stRecords.length || totalDays;
      const percentage = totalCount > 0 ? Math.round((effectivePresent / totalCount) * 100) : 0;

      return {
        studentId: st.id,
        nisn: st.nisn,
        name: st.name,
        className: st.className,
        gender: st.gender,
        hadir,
        izin,
        sakit,
        alpa,
        dispen,
        suratLengkap,
        suratBelumAda,
        totalDays: totalCount,
        percentage,
      };
    });
  }, [students, attendanceRecords, startDate, endDate, selectedGrade, selectedClass]);

  // Search filter
  const searchedRecapList = useMemo(() => {
    if (!searchQuery.trim()) return studentRecapList;
    const q = searchQuery.toLowerCase();
    return studentRecapList.filter(
      (item) => item.name.toLowerCase().includes(q) || item.nisn.includes(q)
    );
  }, [studentRecapList, searchQuery]);

  // Paginated records
  const totalPages = Math.ceil(searchedRecapList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedRecapList.slice(start, start + pageSize);
  }, [searchedRecapList, currentPage, pageSize]);

  // Aggregate stats
  const aggregateTotals = useMemo(() => {
    let totalH = 0;
    let totalI = 0;
    let totalS = 0;
    let totalA = 0;
    let totalD = 0;
    let totalSuratAda = 0;
    let totalSuratBelum = 0;

    studentRecapList.forEach((s) => {
      totalH += s.hadir;
      totalI += s.izin;
      totalS += s.sakit;
      totalA += s.alpa;
      totalD += s.dispen;
      totalSuratAda += s.suratLengkap;
      totalSuratBelum += s.suratBelumAda;
    });

    const avgRate = studentRecapList.length > 0
      ? Math.round(studentRecapList.reduce((acc, c) => acc + c.percentage, 0) / studentRecapList.length)
      : 0;

    return { totalH, totalI, totalS, totalA, totalD, totalSuratAda, totalSuratBelum, avgRate };
  }, [studentRecapList]);

  // Export handlers
  const handleExportExcel = () => {
    exportAttendanceToExcel(
      schoolProfile,
      searchedRecapList,
      startDate,
      endDate,
      selectedClass,
      attendanceRecords
    );
  };

  const handleExportPdf = () => {
    exportAttendanceToPdf(
      schoolProfile,
      searchedRecapList,
      startDate,
      endDate,
      selectedClass,
      attendanceRecords
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Controls with Claymorphism */}
      <div className="relative overflow-hidden rounded-[36px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-clay-card border border-white/60 space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#332F3A] tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Rekap Presensi
            </h2>
            <p className="text-sm text-[#635F69] mt-1 font-medium">
              Laporan akumulasi kehadiran siswa per rentang tanggal dan kelas
            </p>
          </div>

          {/* Action & Export Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              id="export-excel-btn"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              id="export-pdf-btn"
              onClick={handleExportPdf}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white font-extrabold text-xs transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center gap-4">
          {/* Start Date */}
          <div className="flex items-center gap-2.5 bg-[#EFEBF5] rounded-2xl px-4 py-2.5 shadow-clay-pressed text-xs">
            <Calendar className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <span className="text-[#635F69] font-bold">Tanggal Awal:</span>
            <input
              id="recap-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[#332F3A] font-extrabold focus:outline-hidden cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2.5 bg-[#EFEBF5] rounded-2xl px-4 py-2.5 shadow-clay-pressed text-xs">
            <Calendar className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <span className="text-[#635F69] font-bold">Tanggal Akhir:</span>
            <input
              id="recap-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[#332F3A] font-extrabold focus:outline-hidden cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>
        </div>

        {/* Grade and Class Filtering Controls */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Grade filter tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-[#EFEBF5] rounded-2xl shadow-clay-pressed text-xs font-bold">
            <span className="text-[#635F69] px-2 text-[11px] font-black uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Jenjang:</span>
            {(['X', 'XI', 'XII', 'ALL'] as const).map((gr) => (
              <button
                key={gr}
                type="button"
                id={`recap-grade-${gr}`}
                onClick={() => {
                  setSelectedGrade(gr);
                  setCurrentPage(1);
                  if (gr !== 'ALL') {
                    setSelectedClass(`${gr}-1`);
                  } else {
                    setSelectedClass('ALL');
                  }
                }}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedGrade === gr
                    ? 'bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white font-black shadow-clay-button -translate-y-0.5'
                    : 'text-[#635F69] hover:text-[#332F3A]'
                }`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {gr === 'ALL' ? 'Semua (36 Kelas)' : `Kelas ${gr}`}
              </button>
            ))}
          </div>

          {/* Class dropdown */}
          <div className="flex items-center gap-2.5 bg-[#EFEBF5] rounded-2xl px-4 py-2.5 text-xs text-[#332F3A] shadow-clay-pressed">
            <Layers className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <span className="text-[#635F69] font-bold">Pilih Kelas:</span>
            <select
              id="recap-class-select"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-extrabold text-[#332F3A] focus:outline-hidden cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <option value="ALL">Semua Kelas ({availableClasses.length} Kelas)</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Bar for Selected Range */}
      <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-white/60 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-black text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Total Rekap ({searchedRecapList.length} Siswa):
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
            H: {aggregateTotals.totalH}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-extrabold border border-amber-200 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
            S: {aggregateTotals.totalS}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 font-extrabold border border-sky-200 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
            I: {aggregateTotals.totalI}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-extrabold border border-rose-200 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
            A: {aggregateTotals.totalA}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-extrabold border border-purple-200 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
            D: {aggregateTotals.totalD}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900 font-black border border-teal-200 shadow-clay-surface" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Rata-rata Kehadiran: {aggregateTotals.avgRate}%
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#635F69]">
          <FileCheck className="w-4 h-4 text-[#7C3AED]" />
          <span>Surat I/S Terverifikasi: <strong className="text-emerald-700">{aggregateTotals.totalSuratAda}</strong> • Belum Ada Surat: <strong className="text-rose-600">{aggregateTotals.totalSuratBelum}</strong></span>
        </div>
      </div>

      {/* Recap Table */}
      <div className="rounded-[36px] bg-white/80 backdrop-blur-xl shadow-clay-card border border-white/60 overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-5 sm:p-6 border-b border-slate-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#635F69]" />
            <input
              id="search-recap-student"
              type="text"
              placeholder="Cari siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-[#EFEBF5] rounded-2xl text-xs text-[#332F3A] placeholder-[#635F69] shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 transition-all font-medium"
            />
          </div>

          <div className="text-xs text-[#635F69] font-medium">
            Periode: <strong className="text-[#332F3A]">{formatDateIndonesian(startDate)}</strong> s.d. <strong className="text-[#332F3A]">{formatDateIndonesian(endDate)}</strong> ({diffDays} hari)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            {isDailyView ? (
              /* THEAD: MODE HARIAN (RENTANG TANGGAL <= 1 BULAN) */
              <thead>
                <tr className="bg-gradient-to-r from-slate-100/80 to-purple-50/50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-[#635F69]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <th rowSpan={2} className="py-3 px-3 w-12 text-center border-r border-slate-200/60">No</th>
                  <th rowSpan={2} className="py-3 px-3 w-28 border-r border-slate-200/60">NISN</th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[180px] border-r border-slate-200/60">Nama Lengkap Siswa</th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-10 border-r border-slate-200/60">L/P</th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-14 border-r border-slate-200/60">Kelas</th>
                  <th colSpan={datesList.length} className="py-2 px-2 text-center bg-purple-100/60 text-[#7C3AED] border-r border-purple-200 font-black">
                    Status Presensi
                  </th>
                  <th colSpan={6} className="py-2 px-2 text-center bg-slate-100 text-[#332F3A] font-black">
                    Rekapitulasi Jumlah
                  </th>
                </tr>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase text-[#635F69]">
                  {datesList.map((dateStr) => {
                    const dayNum = parseInt(dateStr.split('-')[2], 10);
                    const shortDay = getDayShortName(dateStr);
                    const isWeekend = isWeekendDay(dateStr);
                    return (
                      <th
                        key={dateStr}
                        className={`py-2 px-0.5 text-center min-w-[36px] w-[36px] border-r transition-colors ${
                          isWeekend 
                            ? 'bg-rose-100/90 text-rose-700 border-r-rose-200/80 font-black' 
                            : 'border-r-slate-200/50 text-[#635F69]'
                        }`}
                        title={`${formatDateIndonesian(dateStr)} ${isWeekend ? '- Hari Libur Sekolah (Sabtu/Minggu)' : ''}`}
                      >
                        <div className="leading-tight">
                          <span className={`block text-[8.5px] font-bold ${isWeekend ? 'text-rose-700' : 'text-[#635F69] opacity-75'}`}>{shortDay}</span>
                          <span className={`block text-[11px] font-black ${isWeekend ? 'text-rose-900' : 'text-[#332F3A]'}`}>{dayNum}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-2 px-1 text-center w-11 text-emerald-700 bg-emerald-50/60 border-r border-slate-200/50">H</th>
                  <th className="py-2 px-1 text-center w-11 text-amber-700 bg-amber-50/60 border-r border-slate-200/50">S</th>
                  <th className="py-2 px-1 text-center w-11 text-sky-700 bg-sky-50/60 border-r border-slate-200/50">I</th>
                  <th className="py-2 px-1 text-center w-11 text-rose-700 bg-rose-50/60 border-r border-slate-200/50">A</th>
                  <th className="py-2 px-1 text-center w-11 text-purple-700 bg-purple-50/60 border-r border-slate-200/50">D</th>
                  <th className="py-2 px-2 text-center w-14 text-[#332F3A]">Persen</th>
                </tr>
              </thead>
            ) : (
              /* THEAD: MODE REKAP JUMLAH SAJA (RENTANG TANGGAL > 1 BULAN) */
              <thead>
                <tr className="bg-gradient-to-r from-slate-100/80 to-purple-50/50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-[#635F69]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <th className="py-4 px-3 w-12 text-center">No</th>
                  <th className="py-4 px-3 w-28">NISN</th>
                  <th className="py-4 px-4">Nama Lengkap Siswa</th>
                  <th className="py-4 px-2 text-center w-10">L/P</th>
                  <th className="py-4 px-2 text-center w-16">Kelas</th>
                  <th className="py-4 px-2 text-center w-14 text-emerald-700 bg-emerald-50/50">H</th>
                  <th className="py-4 px-2 text-center w-14 text-amber-700 bg-amber-50/50">S</th>
                  <th className="py-4 px-2 text-center w-14 text-sky-700 bg-sky-50/50">I</th>
                  <th className="py-4 px-2 text-center w-14 text-rose-700 bg-rose-50/50">A</th>
                  <th className="py-4 px-2 text-center w-14 text-purple-700 bg-purple-50/50">D</th>
                  <th className="py-4 px-3 text-center w-24">Persentase</th>
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isDailyView ? 5 + datesList.length + 6 : 11}
                    className="py-12 text-center text-[#635F69] font-bold"
                  >
                    Tidak ada catatan presensi dalam rentang tanggal dan filter ini.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  if (isDailyView) {
                    /* TBODY ROW: MODE HARIAN PER TANGGAL (≤ 1 BULAN) */
                    return (
                      <tr key={item.studentId} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-[#635F69] font-bold border-r border-slate-100">
                          {globalIdx}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#635F69] border-r border-slate-100">
                          {item.nisn}
                        </td>
                        <td className="py-3 px-4 font-black text-[#332F3A] border-r border-slate-100" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {item.name}
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              item.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {item.gender}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#EFEBF5] text-[#332F3A] shadow-2xs">
                            {item.className}
                          </span>
                        </td>

                        {/* Daily status cells for each date */}
                        {datesList.map((dateStr) => {
                          const rec = attendanceRecordMap.get(`${item.studentId}_${dateStr}`);
                          const isWeekend = isWeekendDay(dateStr);
                          const isMissingLetter = Boolean(
                            rec &&
                            (rec.status === 'I' || rec.status === 'S') &&
                            rec.hasLetter !== 'Sudah Ada Surat'
                          );
                          return (
                            <td
                              key={dateStr}
                              className={`py-2.5 px-0.5 text-center border-r transition-colors ${
                                isWeekend 
                                  ? 'bg-rose-50/70 border-r-rose-100/80' 
                                  : isMissingLetter
                                  ? 'bg-amber-50/40 border-r-slate-100'
                                  : 'border-r-slate-100'
                              }`}
                            >
                              {rec ? (
                                <span
                                  className={`relative inline-flex items-center justify-center w-6 h-6 rounded-lg font-black text-[10.5px] cursor-default transition-transform hover:scale-110 shadow-clay-surface ${
                                    rec.status === 'H'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : rec.status === 'S'
                                      ? isMissingLetter
                                        ? 'bg-amber-100 text-amber-900 ring-2 ring-rose-500 font-black'
                                        : 'bg-amber-100 text-amber-800'
                                      : rec.status === 'I'
                                      ? isMissingLetter
                                        ? 'bg-sky-100 text-sky-900 ring-2 ring-rose-500 font-black'
                                        : 'bg-sky-100 text-sky-800'
                                      : rec.status === 'A'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}
                                  title={
                                    rec.status === 'H'
                                      ? `${item.name} - Hadir (${dateStr})`
                                      : rec.status === 'S'
                                      ? `${item.name} - Sakit (${isMissingLetter ? '⚠️ Belum Ada Surat' : '✓ Surat Terlampir'})`
                                      : rec.status === 'I'
                                      ? `${item.name} - Izin (${isMissingLetter ? '⚠️ Belum Ada Surat' : '✓ Surat Terlampir'})`
                                      : rec.status === 'A'
                                      ? `${item.name} - Alpa (Tanpa Keterangan)`
                                      : `${item.name} - Dispensasi: ${rec.notes || 'Tugas Sekolah'}`
                                  }
                                >
                                  {rec.status}
                                  {isMissingLetter && (
                                    <span
                                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white flex items-center justify-center text-[7px] text-white font-black leading-none shadow-xs"
                                      title="Belum mengumpulkan surat keterangan"
                                    >
                                      !
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className={`font-mono text-[11px] select-none ${isWeekend ? 'text-rose-300 font-bold' : 'text-slate-300'}`}>
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary totals for daily view */}
                        <td className="py-3 px-1 text-center font-black text-emerald-700 bg-emerald-50/20 border-r border-slate-100" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {item.hadir}
                        </td>
                        <td className="py-3 px-1 text-center font-black text-amber-700 bg-amber-50/20 border-r border-slate-100" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {item.sakit}
                        </td>
                        <td className="py-3 px-1 text-center font-black text-sky-700 bg-sky-50/20 border-r border-slate-100" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {item.izin}
                        </td>
                        <td className={`py-3 px-1 text-center font-black border-r border-slate-100 ${item.alpa > 0 ? 'text-rose-700 bg-rose-100/40' : 'text-slate-400'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {item.alpa}
                        </td>
                        <td className="py-3 px-1 text-center font-black text-purple-700 bg-purple-50/20 border-r border-slate-100" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {item.dispen}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-clay-surface ${
                              item.percentage >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.percentage >= 80
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                            style={{ fontFamily: 'Nunito, sans-serif' }}
                          >
                            {item.percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  /* TBODY ROW: MODE REKAP JUMLAH SAJA (> 1 BULAN) */
                  return (
                    <tr key={item.studentId} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-3 text-center text-[#635F69] font-bold">
                        {globalIdx}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-[#635F69]">
                        {item.nisn}
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {item.name}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            item.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {item.gender}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#EFEBF5] text-[#332F3A] shadow-2xs">
                          {item.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center font-black text-emerald-700 bg-emerald-50/20" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {item.hadir}
                      </td>
                      <td className="py-3.5 px-2 text-center font-black text-amber-700 bg-amber-50/20" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {item.sakit}
                      </td>
                      <td className="py-3.5 px-2 text-center font-black text-sky-700 bg-sky-50/20" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {item.izin}
                      </td>
                      <td className={`py-3.5 px-2 text-center font-black ${item.alpa > 0 ? 'text-rose-700 bg-rose-100/40' : 'text-slate-400'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {item.alpa}
                      </td>
                      <td className="py-3.5 px-2 text-center font-black text-purple-700 bg-purple-50/20" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {item.dispen}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-clay-surface ${
                            item.percentage >= 95
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.percentage >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                          style={{ fontFamily: 'Nunito, sans-serif' }}
                        >
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend / Status Code Guide */}
        <div className="px-6 py-4 bg-[#EFEBF5]/60 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[#635F69]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-black text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>Keterangan Kode:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-xs shadow-clay-surface">H</span>
              <span className="font-semibold">Hadir</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-black inline-flex items-center justify-center text-xs shadow-clay-surface">S</span>
              <span className="font-semibold">Sakit</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-black inline-flex items-center justify-center text-xs shadow-clay-surface">I</span>
              <span className="font-semibold">Izin</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 font-black inline-flex items-center justify-center text-xs shadow-clay-surface">A</span>
              <span className="font-semibold">Alpa (Tanpa Keterangan)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black inline-flex items-center justify-center text-xs shadow-clay-surface">D</span>
              <span className="font-semibold">Dispensasi</span>
            </span>
            {isDailyView && (
              <span className="inline-flex items-center gap-2 pl-3 border-l border-slate-300">
                <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-black inline-flex items-center justify-center text-[10px] border border-rose-300 shadow-clay-surface">
                  Sab &amp; Min
                </span>
                <span className="font-bold text-rose-700">Libur Akhir Pekan</span>
              </span>
            )}
            <span className="inline-flex items-center gap-2 pl-3 border-l border-slate-300">
              <span className="relative inline-flex items-center justify-center w-6 h-6 rounded-lg font-black text-[10px] bg-amber-100 text-amber-900 ring-2 ring-rose-500 shadow-clay-surface">
                S
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white flex items-center justify-center text-[7px] text-white font-black leading-none">!</span>
              </span>
              <span className="font-bold text-rose-700">Tanda (!) : Belum Kumpulkan Surat</span>
            </span>
          </div>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-5 bg-[#EFEBF5]/40 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <div className="text-[#635F69] font-medium">
              Menampilkan {paginatedList.length} dari total {searchedRecapList.length} siswa
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="prev-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white shadow-clay-button disabled:opacity-40 hover:bg-slate-50 text-[#332F3A] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-black text-[#332F3A] px-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                id="next-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white shadow-clay-button disabled:opacity-40 hover:bg-slate-50 text-[#332F3A] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
