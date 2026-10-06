import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
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
import { MdCard, MdBadge, MdButton } from './md3';

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
  const [startDate, setStartDate] = useState<string>(() => getTodayDateString());
  const [endDate, setEndDate] = useState<string>(() => getTodayDateString());

  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('X');
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  const diffDays = useMemo(() => {
    return getDaysDifference(startDate, endDate);
  }, [startDate, endDate]);

  const isDailyView = diffDays > 0 && diffDays <= 31;

  const datesList = useMemo(() => {
    if (!isDailyView) return [];
    return getDatesRangeList(startDate, endDate);
  }, [isDailyView, startDate, endDate]);

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

  const availableClasses = useMemo(() => {
    const list = selectedGrade === 'ALL' ? classes : classes.filter((c) => c.grade === selectedGrade);
    return sortClasses(list);
  }, [classes, selectedGrade]);

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

  const searchedRecapList = useMemo(() => {
    if (!searchQuery.trim()) return studentRecapList;
    const q = searchQuery.toLowerCase();
    return studentRecapList.filter(
      (item) => item.name.toLowerCase().includes(q) || item.nisn.includes(q)
    );
  }, [studentRecapList, searchQuery]);

  const totalPages = Math.ceil(searchedRecapList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedRecapList.slice(start, start + pageSize);
  }, [searchedRecapList, currentPage, pageSize]);

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
    <div className="space-y-6 pb-12 font-roboto text-[#1C1B1F]">
      {/* Header & Filter Controls */}
      <MdCard variant="elevated" radius="large" className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-medium text-[#1C1B1F] tracking-tight">
              Rekap Presensi
            </h2>
            <p className="text-sm text-[#49454F] mt-1">
              Laporan akumulasi kehadiran siswa per rentang tanggal dan kelas
            </p>
          </div>

          {/* Action & Export Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <MdButton
              variant="tonal"
              id="export-excel-btn"
              onClick={handleExportExcel}
              icon={<FileSpreadsheet className="w-4 h-4 text-[#1B5E20]" />}
            >
              <span>Ekspor Excel (.xlsx)</span>
            </MdButton>

            <MdButton
              variant="filled"
              id="export-pdf-btn"
              onClick={handleExportPdf}
              icon={<FileText className="w-4 h-4" />}
            >
              <span>Ekspor PDF (.pdf)</span>
            </MdButton>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="pt-4 border-t border-[#E8DEF8] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
            <Calendar className="w-4 h-4 text-[#6750A4] shrink-0" />
            <span className="text-[#49454F]">Tanggal Awal:</span>
            <input
              id="recap-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[#1C1B1F] font-medium focus:outline-hidden cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
            <Calendar className="w-4 h-4 text-[#6750A4] shrink-0" />
            <span className="text-[#49454F]">Tanggal Akhir:</span>
            <input
              id="recap-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[#1C1B1F] font-medium focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* Grade and Class Filtering Controls */}
        <div className="pt-4 border-t border-[#E8DEF8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Grade filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#E7E0EC] rounded-full text-xs">
            <span className="text-[#49454F] px-2 text-[11px]">Jenjang:</span>
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
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 ${
                  selectedGrade === gr
                    ? 'bg-[#6750A4] text-white font-medium shadow-xs'
                    : 'text-[#49454F] hover:bg-[#6750A4]/10'
                }`}
              >
                {gr === 'ALL' ? 'Semua (36 Kelas)' : `Kelas ${gr}`}
              </button>
            ))}
          </div>

          {/* Class dropdown */}
          <div className="flex items-center gap-2 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
            <Layers className="w-4 h-4 text-[#6750A4] shrink-0" />
            <span className="text-[#49454F]">Pilih Kelas:</span>
            <select
              id="recap-class-select"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-medium text-[#1C1B1F] focus:outline-hidden cursor-pointer"
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
      </MdCard>

      {/* Summary KPI Bar for Selected Range */}
      <MdCard variant="filled" radius="large" className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[#1C1B1F]">
            Total Rekap ({searchedRecapList.length} Siswa):
          </span>
          <span className="px-3 py-1 rounded-full bg-[#C8E6C9] text-[#1B5E20] font-bold">
            H: {aggregateTotals.totalH}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] font-bold">
            S: {aggregateTotals.totalS}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#E1F5FE] text-[#0277BD] font-bold">
            I: {aggregateTotals.totalI}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FFDAD6] text-[#410002] font-bold">
            A: {aggregateTotals.totalA}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#E8DEF8] text-[#1D192B] font-bold">
            D: {aggregateTotals.totalD}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#E8DEF8] text-[#6750A4] font-bold">
            Rata-rata: {aggregateTotals.avgRate}%
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#49454F]">
          <FileCheck className="w-4 h-4 text-[#6750A4]" />
          <span>Surat I/S Terverifikasi: <strong className="text-[#1B5E20]">{aggregateTotals.totalSuratAda}</strong> • Belum: <strong className="text-[#BA1A1A]">{aggregateTotals.totalSuratBelum}</strong></span>
        </div>
      </MdCard>

      {/* Recap Table */}
      <div className="rounded-[32px] bg-[#F3EDF7] shadow-sm border border-[#E8DEF8] overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-5 sm:p-6 border-b border-[#E8DEF8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F]" />
            <input
              id="search-recap-student"
              type="text"
              placeholder="Cari siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#E7E0EC] rounded-full text-xs text-[#1C1B1F] placeholder-[#49454F] focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-[#49454F]">
            Periode: <strong className="text-[#1C1B1F]">{formatDateIndonesian(startDate)}</strong> s.d. <strong className="text-[#1C1B1F]">{formatDateIndonesian(endDate)}</strong> ({diffDays} hari)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            {isDailyView ? (
              /* THEAD: MODE HARIAN */
              <thead>
                <tr className="bg-[#E7E0EC]/80 border-b border-[#E8DEF8] text-xs font-medium uppercase tracking-wider text-[#49454F]">
                  <th rowSpan={2} className="py-3 px-3 w-12 text-center border-r border-[#E8DEF8]">No</th>
                  <th rowSpan={2} className="py-3 px-3 w-28 border-r border-[#E8DEF8]">NISN</th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[180px] border-r border-[#E8DEF8]">Nama Lengkap Siswa</th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-10 border-r border-[#E8DEF8]">L/P</th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-14 border-r border-[#E8DEF8]">Kelas</th>
                  <th colSpan={datesList.length} className="py-2 px-2 text-center bg-[#E8DEF8] text-[#1D192B] border-r border-[#E8DEF8] font-medium">
                    Status Presensi
                  </th>
                  <th colSpan={6} className="py-2 px-2 text-center bg-[#E7E0EC] text-[#1C1B1F] font-medium">
                    Rekapitulasi Jumlah
                  </th>
                </tr>
                <tr className="bg-[#EDE7F2] border-b border-[#E8DEF8] text-[10px] font-medium uppercase text-[#49454F]">
                  {datesList.map((dateStr) => {
                    const dayNum = parseInt(dateStr.split('-')[2], 10);
                    const shortDay = getDayShortName(dateStr);
                    const isWeekend = isWeekendDay(dateStr);
                    return (
                      <th
                        key={dateStr}
                        className={`py-2 px-0.5 text-center min-w-[36px] w-[36px] border-r transition-colors ${
                          isWeekend 
                            ? 'bg-[#FFDAD6] text-[#410002] font-bold' 
                            : 'border-r-[#E8DEF8] text-[#49454F]'
                        }`}
                        title={`${formatDateIndonesian(dateStr)} ${isWeekend ? '- Hari Libur Sekolah' : ''}`}
                      >
                        <div className="leading-tight">
                          <span className={`block text-[8.5px] ${isWeekend ? 'text-[#410002]' : 'text-[#49454F]'}`}>{shortDay}</span>
                          <span className={`block text-[11px] font-bold ${isWeekend ? 'text-[#410002]' : 'text-[#1C1B1F]'}`}>{dayNum}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-2 px-1 text-center w-11 text-[#1B5E20] bg-[#C8E6C9]/40 border-r border-[#E8DEF8]">H</th>
                  <th className="py-2 px-1 text-center w-11 text-[#E65100] bg-[#FFF3E0]/40 border-r border-[#E8DEF8]">S</th>
                  <th className="py-2 px-1 text-center w-11 text-[#0277BD] bg-[#E1F5FE]/40 border-r border-[#E8DEF8]">I</th>
                  <th className="py-2 px-1 text-center w-11 text-[#BA1A1A] bg-[#FFDAD6]/40 border-r border-[#E8DEF8]">A</th>
                  <th className="py-2 px-1 text-center w-11 text-[#6750A4] bg-[#E8DEF8]/40 border-r border-[#E8DEF8]">D</th>
                  <th className="py-2 px-2 text-center w-14 text-[#1C1B1F] bg-[#E7E0EC]">%</th>
                </tr>
              </thead>
            ) : (
              /* THEAD: MODE REKAP BULANAN */
              <thead>
                <tr className="bg-[#E7E0EC]/80 border-b border-[#E8DEF8] text-xs font-medium uppercase tracking-wider text-[#49454F]">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-28">NISN</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Lengkap Siswa</th>
                  <th className="py-3 px-2 text-center w-12">L/P</th>
                  <th className="py-3 px-2 text-center w-16">Kelas</th>
                  <th className="py-3 px-2 text-center w-16 text-[#1B5E20]">Hadir (H)</th>
                  <th className="py-3 px-2 text-center w-16 text-[#E65100]">Sakit (S)</th>
                  <th className="py-3 px-2 text-center w-16 text-[#0277BD]">Izin (I)</th>
                  <th className="py-3 px-2 text-center w-16 text-[#BA1A1A]">Alpa (A)</th>
                  <th className="py-3 px-2 text-center w-16 text-[#6750A4]">Dispen (D)</th>
                  <th className="py-3 px-3 text-center w-20">% Kehadiran</th>
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-[#E8DEF8] text-xs">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={isDailyView ? datesList.length + 11 : 11} className="py-12 text-center text-[#49454F]">
                    Tidak ada data presensi pada kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  if (isDailyView) {
                    return (
                      <tr key={item.studentId} className="hover:bg-[#FFFBFE] transition-colors">
                        <td className="py-3 px-3 text-center text-[#49454F] font-bold border-r border-[#E8DEF8]">
                          {globalIdx}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#49454F] border-r border-[#E8DEF8]">
                          {item.nisn}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1C1B1F] border-r border-[#E8DEF8]">
                          {item.name}
                        </td>
                        <td className="py-3 px-2 text-center border-r border-[#E8DEF8]">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.gender === 'L' ? 'bg-[#E1F5FE] text-[#0277BD]' : 'bg-[#FCE4EC] text-[#C2185B]'
                            }`}
                          >
                            {item.gender}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center border-r border-[#E8DEF8]">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E7E0EC] text-[#1C1B1F]">
                            {item.className}
                          </span>
                        </td>

                        {/* Daily status cells */}
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
                                  ? 'bg-[#FFDAD6]/30 border-r-[#E8DEF8]' 
                                  : isMissingLetter
                                  ? 'bg-[#FFF3E0]/40 border-r-[#E8DEF8]'
                                  : 'border-r-[#E8DEF8]'
                              }`}
                            >
                              {rec ? (
                                <span
                                  className={`relative inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10.5px] cursor-default transition-transform hover:scale-110 ${
                                    rec.status === 'H'
                                      ? 'bg-[#C8E6C9] text-[#1B5E20]'
                                      : rec.status === 'S'
                                      ? isMissingLetter
                                        ? 'bg-[#FFE0B2] text-[#E65100] ring-2 ring-[#BA1A1A]'
                                        : 'bg-[#FFE0B2] text-[#E65100]'
                                      : rec.status === 'I'
                                      ? isMissingLetter
                                        ? 'bg-[#E1F5FE] text-[#0277BD] ring-2 ring-[#BA1A1A]'
                                        : 'bg-[#E1F5FE] text-[#0277BD]'
                                      : rec.status === 'A'
                                      ? 'bg-[#FFDAD6] text-[#410002]'
                                      : 'bg-[#E8DEF8] text-[#1D192B]'
                                  }`}
                                  title={
                                    rec.status === 'H'
                                      ? `${item.name} - Hadir (${dateStr})`
                                      : rec.status === 'S'
                                      ? `${item.name} - Sakit (${isMissingLetter ? '⚠️ Belum Ada Surat' : '✓ Surat Terlampir'})`
                                      : rec.status === 'I'
                                      ? `${item.name} - Izin (${isMissingLetter ? '⚠️ Belum Ada Surat' : '✓ Surat Terlampir'})`
                                      : rec.status === 'A'
                                      ? `${item.name} - Alpa`
                                      : `${item.name} - Dispensasi: ${rec.notes || 'Tugas Sekolah'}`
                                  }
                                >
                                  {rec.status}
                                  {isMissingLetter && (
                                    <span
                                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#BA1A1A] rounded-full border border-white flex items-center justify-center text-[7px] text-white font-bold leading-none"
                                      title="Belum kumpul surat"
                                    >
                                      !
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className={`font-mono text-[11px] select-none ${isWeekend ? 'text-[#BA1A1A]/40' : 'text-[#79747E]/40'}`}>
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary totals */}
                        <td className="py-3 px-1 text-center font-bold text-[#1B5E20] bg-[#C8E6C9]/20 border-r border-[#E8DEF8]">
                          {item.hadir}
                        </td>
                        <td className="py-3 px-1 text-center font-bold text-[#E65100] bg-[#FFF3E0]/20 border-r border-[#E8DEF8]">
                          {item.sakit}
                        </td>
                        <td className="py-3 px-1 text-center font-bold text-[#0277BD] bg-[#E1F5FE]/20 border-r border-[#E8DEF8]">
                          {item.izin}
                        </td>
                        <td className={`py-3 px-1 text-center font-bold border-r border-[#E8DEF8] ${item.alpa > 0 ? 'text-[#BA1A1A] bg-[#FFDAD6]/30' : 'text-[#49454F]'}`}>
                          {item.alpa}
                        </td>
                        <td className="py-3 px-1 text-center font-bold text-[#6750A4] bg-[#E8DEF8]/20 border-r border-[#E8DEF8]">
                          {item.dispen}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              item.percentage >= 95
                                ? 'bg-[#C8E6C9] text-[#1B5E20]'
                                : item.percentage >= 80
                                ? 'bg-[#FFE0B2] text-[#E65100]'
                                : 'bg-[#FFDAD6] text-[#410002]'
                            }`}
                          >
                            {item.percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  /* TBODY: MODE REKAP BULANAN */
                  return (
                    <tr key={item.studentId} className="hover:bg-[#FFFBFE] transition-colors">
                      <td className="py-3.5 px-3 text-center text-[#49454F] font-bold">
                        {globalIdx}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-[#49454F]">
                        {item.nisn}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1C1B1F]">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.gender === 'L' ? 'bg-[#E1F5FE] text-[#0277BD]' : 'bg-[#FCE4EC] text-[#C2185B]'
                          }`}
                        >
                          {item.gender}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E7E0EC] text-[#1C1B1F]">
                          {item.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center font-bold text-[#1B5E20] bg-[#C8E6C9]/20">
                        {item.hadir}
                      </td>
                      <td className="py-3.5 px-2 text-center font-bold text-[#E65100] bg-[#FFF3E0]/20">
                        {item.sakit}
                      </td>
                      <td className="py-3.5 px-2 text-center font-bold text-[#0277BD] bg-[#E1F5FE]/20">
                        {item.izin}
                      </td>
                      <td className={`py-3.5 px-2 text-center font-bold ${item.alpa > 0 ? 'text-[#BA1A1A] bg-[#FFDAD6]/30' : 'text-[#49454F]'}`}>
                        {item.alpa}
                      </td>
                      <td className="py-3.5 px-2 text-center font-bold text-[#6750A4] bg-[#E8DEF8]/20">
                        {item.dispen}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.percentage >= 95
                              ? 'bg-[#C8E6C9] text-[#1B5E20]'
                              : item.percentage >= 80
                              ? 'bg-[#FFE0B2] text-[#E65100]'
                              : 'bg-[#FFDAD6] text-[#410002]'
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
        <div className="px-6 py-4 bg-[#E7E0EC]/50 border-t border-[#E8DEF8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#49454F]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-[#1C1B1F]">Keterangan Kode:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#C8E6C9] text-[#1B5E20] font-bold inline-flex items-center justify-center text-xs">H</span>
              <span>Hadir</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#FFE0B2] text-[#E65100] font-bold inline-flex items-center justify-center text-xs">S</span>
              <span>Sakit</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#E1F5FE] text-[#0277BD] font-bold inline-flex items-center justify-center text-xs">I</span>
              <span>Izin</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#FFDAD6] text-[#410002] font-bold inline-flex items-center justify-center text-xs">A</span>
              <span>Alpa</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#E8DEF8] text-[#1D192B] font-bold inline-flex items-center justify-center text-xs">D</span>
              <span>Dispensasi</span>
            </span>
            {isDailyView && (
              <span className="inline-flex items-center gap-2 pl-3 border-l border-[#CAC4D0]">
                <span className="px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#410002] font-bold inline-flex items-center justify-center text-[10px]">
                  Sab &amp; Min
                </span>
                <span className="font-medium text-[#BA1A1A]">Libur Akhir Pekan</span>
              </span>
            )}
            <span className="inline-flex items-center gap-2 pl-3 border-l border-[#CAC4D0]">
              <span className="relative inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] bg-[#FFE0B2] text-[#E65100] ring-2 ring-[#BA1A1A]">
                S
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#BA1A1A] rounded-full border border-white flex items-center justify-center text-[7px] text-white font-bold leading-none">!</span>
              </span>
              <span className="font-medium text-[#BA1A1A]">Tanda (!) : Belum Kumpulkan Surat</span>
            </span>
          </div>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-5 bg-[#E7E0EC]/40 border-t border-[#E8DEF8] flex items-center justify-between text-xs">
            <div className="text-[#49454F]">
              Menampilkan {paginatedList.length} dari total {searchedRecapList.length} siswa
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="prev-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-full bg-white disabled:opacity-40 hover:bg-[#E8DEF8] text-[#1C1B1F] cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-[#1C1B1F] px-2">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                id="next-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-full bg-white disabled:opacity-40 hover:bg-[#E8DEF8] text-[#1C1B1F] cursor-pointer active:scale-95"
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
