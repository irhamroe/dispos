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
  // Date Range state
  const [startDate, setStartDate] = useState('2026-09-14');
  const [endDate, setEndDate] = useState('2026-09-17');

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
    if (selectedGrade === 'ALL') return classes;
    return classes.filter((c) => c.grade === selectedGrade);
  }, [classes, selectedGrade]);

  // Compute student attendance summary across date range
  const studentRecapList: StudentRecapItem[] = useMemo(() => {
    // 1. Filter students according to grade and class
    const targetStudents = students.filter((s) => {
      const matchGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;
      const matchClass = selectedClass === 'ALL' || s.className === selectedClass;
      return matchGrade && matchClass;
    });

    // 2. Filter attendance records within the selected date range
    const filteredRecords = attendanceRecords.filter((rec) => {
      return rec.date >= startDate && rec.date <= endDate;
    });

    // 3. Count days in range with attendance data
    const distinctDates = Array.from(new Set(filteredRecords.map((r) => r.date)));
    const totalDays = distinctDates.length || 1;

    // 4. Map each student to their attendance summary
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

      // Percentage: (Hadir + Dispen) / total days recorded
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
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Rekap Presensi
            </h2>
          </div>

          {/* Action & Export Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              id="export-excel-btn"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              id="export-pdf-btn"
              onClick={handleExportPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Start Date */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-slate-500 font-medium">Tanggal Awal:</span>
            <input
              id="recap-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-slate-500 font-medium">Tanggal Akhir:</span>
            <input
              id="recap-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* Grade and Class Filtering Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Grade filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <span className="text-slate-400 px-2 text-[11px] font-bold">Jenjang:</span>
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
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedGrade === gr
                    ? 'bg-white text-teal-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {gr === 'ALL' ? 'Semua (36 Kelas)' : `Kelas ${gr}`}
              </button>
            ))}
          </div>

          {/* Class dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Layers className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-slate-400">Pilih Kelas:</span>
            <select
              id="recap-class-select"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
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
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700">
            Total Rekap ({searchedRecapList.length} Siswa):
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
            H: {aggregateTotals.totalH}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
            S: {aggregateTotals.totalS}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
            I: {aggregateTotals.totalI}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
            A: {aggregateTotals.totalA}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold">
            D: {aggregateTotals.totalD}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 font-bold">
            Rata-rata Kehadiran: {aggregateTotals.avgRate}%
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
          <FileCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Surat I/S Terverifikasi: <strong>{aggregateTotals.totalSuratAda}</strong> • Belum Ada Surat: <strong className="text-rose-600">{aggregateTotals.totalSuratBelum}</strong></span>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-recap-student"
              type="text"
              placeholder="Cari siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Periode: <strong>{formatDateIndonesian(startDate)}</strong> s.d. <strong>{formatDateIndonesian(endDate)}</strong> ({diffDays} hari)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            {isDailyView ? (
              /* THEAD: MODE HARIAN (RENTANG TANGGAL <= 1 BULAN) */
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th rowSpan={2} className="py-2.5 px-3 w-10 text-center border-r border-slate-200/60">No</th>
                  <th rowSpan={2} className="py-2.5 px-3 w-28 border-r border-slate-200/60">NISN</th>
                  <th rowSpan={2} className="py-2.5 px-4 min-w-[180px] border-r border-slate-200/60">Nama Lengkap Siswa</th>
                  <th rowSpan={2} className="py-2.5 px-2 text-center w-14 border-r border-slate-200/60">Kelas</th>
                  <th rowSpan={2} className="py-2.5 px-2 text-center w-10 border-r border-slate-200/60">L/P</th>
                  <th colSpan={datesList.length} className="py-1.5 px-2 text-center bg-teal-50 text-teal-900 border-r border-teal-200/80 font-bold">
                    Status Presensi Per Tanggal ({datesList.length} Hari)
                  </th>
                  <th colSpan={6} className="py-1.5 px-2 text-center bg-slate-100 text-slate-700 font-bold">
                    Rekapitulasi Jumlah
                  </th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  {datesList.map((dateStr) => {
                    const dayNum = parseInt(dateStr.split('-')[2], 10);
                    const shortDay = getDayShortName(dateStr);
                    const isWeekend = isWeekendDay(dateStr); // Sabtu & Minggu (Hari Libur)
                    return (
                      <th
                        key={dateStr}
                        className={`py-1.5 px-0.5 text-center min-w-[34px] w-[34px] border-r transition-colors ${
                          isWeekend 
                            ? 'bg-rose-100/90 text-rose-700 border-r-rose-200/80 font-bold' 
                            : 'border-r-slate-200/50 text-slate-600'
                        }`}
                        title={`${formatDateIndonesian(dateStr)} ${isWeekend ? '- Hari Libur Sekolah (Sabtu/Minggu)' : ''}`}
                      >
                        <div className="leading-tight">
                          <span className={`block text-[8.5px] font-bold ${isWeekend ? 'text-rose-700' : 'text-slate-500 opacity-75'}`}>{shortDay}</span>
                          <span className={`block text-[11px] font-black ${isWeekend ? 'text-rose-900' : 'text-slate-800'}`}>{dayNum}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-1.5 px-1 text-center w-11 text-emerald-700 bg-emerald-50/60 border-r border-slate-200/50">H</th>
                  <th className="py-1.5 px-1 text-center w-11 text-amber-700 bg-amber-50/60 border-r border-slate-200/50">S</th>
                  <th className="py-1.5 px-1 text-center w-11 text-blue-700 bg-blue-50/60 border-r border-slate-200/50">I</th>
                  <th className="py-1.5 px-1 text-center w-11 text-rose-700 bg-rose-50/60 border-r border-slate-200/50">A</th>
                  <th className="py-1.5 px-1 text-center w-11 text-indigo-700 bg-indigo-50/60 border-r border-slate-200/50">D</th>
                  <th className="py-1.5 px-2 text-center w-14 text-slate-700">Persen</th>
                </tr>
              </thead>
            ) : (
              /* THEAD: MODE REKAP JUMLAH SAJA (RENTANG TANGGAL > 1 BULAN) */
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-28">NISN</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-2 text-center w-16">Kelas</th>
                  <th className="py-3 px-2 text-center w-10">L/P</th>
                  <th className="py-3 px-2 text-center w-14 text-emerald-700 bg-emerald-50/50">H</th>
                  <th className="py-3 px-2 text-center w-14 text-amber-700 bg-amber-50/50">S</th>
                  <th className="py-3 px-2 text-center w-14 text-blue-700 bg-blue-50/50">I</th>
                  <th className="py-3 px-2 text-center w-14 text-rose-700 bg-rose-50/50">A</th>
                  <th className="py-3 px-2 text-center w-14 text-indigo-700 bg-indigo-50/50">D</th>
                  <th className="py-3 px-3 text-center w-24">Persentase</th>
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isDailyView ? 5 + datesList.length + 6 : 11}
                    className="py-8 text-center text-slate-400"
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
                      <tr key={item.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-medium border-r border-slate-100">
                          {globalIdx}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-100">
                          {item.nisn}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-2 text-center border-r border-slate-100">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.className}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center border-r border-slate-100">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {item.gender}
                          </span>
                        </td>

                        {/* Daily status cells for each date */}
                        {datesList.map((dateStr) => {
                          const rec = attendanceRecordMap.get(`${item.studentId}_${dateStr}`);
                          const isWeekend = isWeekendDay(dateStr); // Sabtu & Minggu
                          const isMissingLetter = Boolean(
                            rec &&
                            (rec.status === 'I' || rec.status === 'S') &&
                            rec.hasLetter !== 'Sudah Ada Surat'
                          );
                          return (
                            <td
                              key={dateStr}
                              className={`py-2 px-0.5 text-center border-r transition-colors ${
                                isWeekend 
                                  ? 'bg-rose-50/70 border-r-rose-100/80' 
                                  : isMissingLetter
                                  ? 'bg-amber-50/40 border-r-slate-100'
                                  : 'border-r-slate-100'
                              }`}
                            >
                              {rec ? (
                                <span
                                  className={`relative inline-flex items-center justify-center w-6 h-6 rounded font-bold text-[10.5px] cursor-default transition-transform hover:scale-110 shadow-2xs ${
                                    rec.status === 'H'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : rec.status === 'S'
                                      ? isMissingLetter
                                        ? 'bg-amber-100 text-amber-900 ring-2 ring-rose-500 font-black'
                                        : 'bg-amber-100 text-amber-800'
                                      : rec.status === 'I'
                                      ? isMissingLetter
                                        ? 'bg-blue-100 text-blue-900 ring-2 ring-rose-500 font-black'
                                        : 'bg-blue-100 text-blue-800'
                                      : rec.status === 'A'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-indigo-100 text-indigo-800'
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
                                <span className={`font-mono text-[11px] select-none ${isWeekend ? 'text-rose-300 font-semibold' : 'text-slate-300'}`}>
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary totals for daily view */}
                        <td className="py-2.5 px-1 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-slate-100">
                          {item.hadir}
                        </td>
                        <td className="py-2.5 px-1 text-center font-bold text-amber-700 bg-amber-50/20 border-r border-slate-100">
                          {item.sakit}
                        </td>
                        <td className="py-2.5 px-1 text-center font-bold text-blue-700 bg-blue-50/20 border-r border-slate-100">
                          {item.izin}
                        </td>
                        <td className={`py-2.5 px-1 text-center font-bold border-r border-slate-100 ${item.alpa > 0 ? 'text-rose-700 bg-rose-100/40' : 'text-slate-400'}`}>
                          {item.alpa}
                        </td>
                        <td className="py-2.5 px-1 text-center font-bold text-indigo-700 bg-indigo-50/20 border-r border-slate-100">
                          {item.dispen}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.percentage >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.percentage >= 80
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  /* TBODY ROW: MODE REKAP JUMLAH SAJA (> 1 BULAN) */
                  return (
                    <tr key={item.studentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {item.nisn}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.className}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {item.gender}
                        </span>
                      </td>
                      {/* H */}
                      <td className="py-3 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">
                        {item.hadir}
                      </td>
                      {/* S */}
                      <td className="py-3 px-2 text-center font-bold text-amber-700 bg-amber-50/20">
                        {item.sakit}
                      </td>
                      {/* I */}
                      <td className="py-3 px-2 text-center font-bold text-blue-700 bg-blue-50/20">
                        {item.izin}
                      </td>
                      {/* A */}
                      <td className={`py-3 px-2 text-center font-bold ${item.alpa > 0 ? 'text-rose-700 bg-rose-100/40' : 'text-slate-400'}`}>
                        {item.alpa}
                      </td>
                      {/* D */}
                      <td className="py-3 px-2 text-center font-bold text-indigo-700 bg-indigo-50/20">
                        {item.dispen}
                      </td>
                      {/* % Kehadiran */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.percentage >= 95
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.percentage >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
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
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-700">Keterangan Kode:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold inline-flex items-center justify-center text-[10px]">H</span>
              <span>Hadir</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 font-bold inline-flex items-center justify-center text-[10px]">S</span>
              <span>Sakit</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 font-bold inline-flex items-center justify-center text-[10px]">I</span>
              <span>Izin</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-rose-100 text-rose-800 font-bold inline-flex items-center justify-center text-[10px]">A</span>
              <span>Alpa (Tanpa Keterangan)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 font-bold inline-flex items-center justify-center text-[10px]">D</span>
              <span>Dispensasi</span>
            </span>
            {isDailyView && (
              <span className="inline-flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold inline-flex items-center justify-center text-[10px] border border-rose-300">
                  Sab &amp; Min
                </span>
                <span className="font-semibold text-rose-700">Libur Akhir Pekan</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="relative inline-flex items-center justify-center w-5 h-5 rounded font-bold text-[10px] bg-amber-100 text-amber-900 ring-2 ring-rose-500">
                S
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white flex items-center justify-center text-[7px] text-white font-black leading-none">!</span>
              </span>
              <span className="font-semibold text-rose-700">Tanda (!) : Status I atau S Belum Kumpulkan Surat</span>
            </span>
          </div>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="text-slate-500">
              Menampilkan {paginatedList.length} dari total {searchedRecapList.length} siswa
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="prev-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                id="next-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 text-slate-700"
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
