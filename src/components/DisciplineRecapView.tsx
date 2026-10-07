import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  CalendarRange, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  FileCheck, 
  Eye, 
  Layers, 
  X, 
  Sparkles,
  ArrowRight,
  Download,
  Image as ImageIcon,
  Paperclip,
  Cloud,
  ExternalLink
} from 'lucide-react';
import { DisciplineRecord, SchoolProfile, Student } from '../types';
import { exportDisciplineToExcel, exportDisciplineToPdf, formatDateIndonesian } from '../utils/exportUtils';
import { sortClasses, sortDisciplineRecords } from '../utils/sortUtils';
import { getGoogleDriveDirectImageUrl, getGoogleDriveViewUrl } from '../services/googleDriveService';

interface DisciplineRecapViewProps {
  disciplineRecords: DisciplineRecord[];
  students: Student[];
  schoolProfile: SchoolProfile;
}

export const DisciplineRecapView: React.FC<DisciplineRecapViewProps> = ({
  disciplineRecords,
  students,
  schoolProfile,
}) => {
  // Date range filters (default: current month)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const firstDayOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active detail modal & image preview modal
  const [activeRecordForDetail, setActiveRecordForDetail] = useState<DisciplineRecord | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Available classes sorted
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return sortClasses(Array.from(set));
  }, [students]);

  // Quick Preset Handlers
  const handlePresetToday = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const handlePreset7Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    setStartDate(d.toISOString().slice(0, 10));
    setEndDate(todayStr);
  };

  const handlePresetMonth = () => {
    setStartDate(firstDayOfMonth);
    setEndDate(todayStr);
  };

  const handlePresetAll = () => {
    if (disciplineRecords.length > 0) {
      const dates = disciplineRecords.map((r) => r.date).sort();
      setStartDate(dates[0]);
      setEndDate(dates[dates.length - 1] > todayStr ? dates[dates.length - 1] : todayStr);
    } else {
      setStartDate('2026-09-01');
      setEndDate(todayStr);
    }
  };

  // Filter records based on Date Range, Class, Status, and Search (sorted by latest first)
  const filteredRecords = useMemo(() => {
    const list = disciplineRecords.filter((rec) => {
      const withinDate = rec.date >= startDate && rec.date <= endDate;
      if (!withinDate) return false;

      if (selectedClass !== 'ALL' && rec.className !== selectedClass) return false;

      if (selectedStatus !== 'ALL' && rec.coachingStatus !== selectedStatus) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(query);
        const matchNisn = rec.nisn.includes(query);
        const matchViolation = rec.violationName.toLowerCase().includes(query);
        if (!matchName && !matchNisn && !matchViolation) return false;
      }

      return true;
    });
    return sortDisciplineRecords(list);
  }, [disciplineRecords, startDate, endDate, selectedClass, selectedStatus, searchQuery]);

  // KPI calculations for filtered data
  const totalCount = filteredRecords.length;
  const sudahCount = filteredRecords.filter((r) => r.coachingStatus === 'Sudah').length;
  const belumCount = filteredRecords.filter((r) => r.coachingStatus !== 'Sudah').length;
  const persentaseTuntas = totalCount > 0 ? Math.round((sudahCount / totalCount) * 100) : 100;

  // Export handlers
  const handleExportExcel = () => {
    const filterLabel = `Periode ${formatDateIndonesian(startDate)} s/d ${formatDateIndonesian(endDate)}${
      selectedClass !== 'ALL' ? ` (Kelas ${selectedClass})` : ''
    }`;
    exportDisciplineToExcel(schoolProfile, filteredRecords, filterLabel);
    setExportNotice('File Excel Rekapitulasi Pelanggaran berhasil diunduh!');
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleExportPdf = () => {
    const filterLabel = `Periode: ${formatDateIndonesian(startDate)} s/d ${formatDateIndonesian(endDate)}${
      selectedClass !== 'ALL' ? ` | Kelas: ${selectedClass}` : ''
    }`;
    exportDisciplineToPdf(schoolProfile, filteredRecords, filterLabel);
    setExportNotice('Laporan PDF Rekapitulasi Pelanggaran resmi berhasil diunduh!');
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner with Claymorphism */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-sm border border-white/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight" >
                Rekap Pelanggaran & Pembinaan
              </h2>
              <p className="text-sm text-[#334155] mt-1 font-medium">
                Laporan rekapitulasi data pelanggaran tata tertib dan status pembinaan berdasarkan rentang tanggal
              </p>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="export-recap-excel-btn"
              onClick={handleExportExcel}
              className="px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none flex-1 sm:flex-initial cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              id="export-recap-pdf-btn"
              onClick={handleExportPdf}
              className="px-4 py-3 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none flex-1 sm:flex-initial cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Date Range & Filter Panel */}
      <div className="rounded-[32px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-sm border border-white/60 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-2.5">
            <CalendarRange className="w-5 h-5 text-teal-600" />
            <span className="font-black text-[#0F172A] text-xs uppercase tracking-wider" >
              Filter Rentang Tanggal & Parameter
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePresetToday}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#E2F1FD] hover:bg-white text-[#334155] hover:text-[#0284C7] shadow-none transition-all cursor-pointer"
              
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handlePreset7Days}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#E2F1FD] hover:bg-white text-[#334155] hover:text-[#0284C7] shadow-none transition-all cursor-pointer"
              
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={handlePresetMonth}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#E2F1FD] hover:bg-white text-[#334155] hover:text-[#0284C7] shadow-none transition-all cursor-pointer"
              
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={handlePresetAll}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#E2F1FD] hover:bg-white text-[#334155] hover:text-[#0284C7] shadow-none transition-all cursor-pointer"
              
            >
              Semua Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Tanggal Awal */}
          <div>
            <label className="block font-black text-[#0F172A] mb-1.5" >Tanggal Awal</label>
            <input
              type="date"
              id="recap-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block font-black text-[#0F172A] mb-1.5" >Tanggal Akhir</label>
            <input
              type="date"
              id="recap-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
            />
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block font-black text-[#0F172A] mb-1.5" >Pilih Kelas</label>
            <select
              id="recap-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-extrabold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 transition-all cursor-pointer"
              
            >
              <option value="ALL">Semua Kelas (36 Rombel)</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Pembinaan */}
          <div>
            <label className="block font-black text-[#0F172A] mb-1.5" >Status Pembinaan</label>
            <select
              id="recap-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-extrabold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 transition-all cursor-pointer"
              
            >
              <option value="ALL">Semua Status Pembinaan</option>
              <option value="Sudah">Sudah Pembinaan</option>
              <option value="Belum">Belum Pembinaan</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#334155]" />
          <input
            type="text"
            placeholder="Cari nama siswa, NISN, atau jenis pelanggaran pada rentang tanggal ini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-[#E2F1FD] rounded-2xl text-xs text-[#0F172A] placeholder-[#334155] shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* KPI Cards for Selected Date Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="rounded-[32px] bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/60 p-5 shadow-xs border border-[#7DD3FC]/70 hover:-translate-y-1.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#0369A1] uppercase tracking-wider">Kasus Pada Rentang</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0369A1] mt-2 tracking-tight">{totalCount}</div>
          <div className="text-[10px] text-[#0369A1]/80 mt-1 font-medium truncate">
            {formatDateIndonesian(startDate)} - {formatDateIndonesian(endDate)}
          </div>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/60 p-5 shadow-xs border border-[#FDA4AF]/70 hover:-translate-y-1.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#E11D48] uppercase tracking-wider">Belum Pembinaan</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#E11D48] mt-2 tracking-tight">{belumCount}</div>
          <div className="text-[10px] text-[#BE123C] mt-1 font-semibold">Perlu ditindaklanjuti</div>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]/60 p-5 shadow-xs border border-[#6EE7B7]/70 hover:-translate-y-1.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#047857] uppercase tracking-wider">Sudah Pembinaan</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#047857] mt-2 tracking-tight">{sudahCount}</div>
          <div className="text-[10px] text-[#065F46] mt-1 font-semibold">Telah selesai dibina</div>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-[#F0FDFA] via-[#CCFBF1] to-[#99F6E4]/60 p-5 shadow-xs border border-[#5EEAD4]/70 hover:-translate-y-1.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#0F766E] uppercase tracking-wider">Rasio Penyelesaian</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F766E] mt-2 tracking-tight">{persentaseTuntas}%</div>
          <div className="text-[10px] text-[#115E59] mt-1 font-semibold">Tuntas pada periode ini</div>
        </div>
      </div>

      {/* Recap Table with Claymorphism */}
      <div className="rounded-[32px] bg-white/80 backdrop-blur-xl shadow-sm border border-white/60 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-black text-[#0F172A] flex items-center gap-2.5" >
            <span className="text-sm">Daftar Pelanggaran Hasil Rekapitulasi</span>
            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-xl font-extrabold border border-teal-200 shadow-xs">
              {filteredRecords.length} Data
            </span>
          </div>
          <div className="text-xs text-[#334155]">
            Rentang: <span className="font-extrabold text-[#0F172A]">{startDate} s/d {endDate}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/80 to-teal-50/50 text-[#334155] font-black text-xs uppercase tracking-wider border-b border-slate-200/60" >
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-4 w-32">Tanggal Kejadian</th>
                <th className="py-4 px-5">Nama Siswa & Kelas</th>
                <th className="py-4 px-5 min-w-[220px]">Jenis Pelanggaran</th>
                <th className="py-4 px-4 text-center w-40">Status Pembinaan</th>
                <th className="py-4 px-4 w-36 text-center">Tanggal Pembinaan</th>
                <th className="py-4 px-4 text-center w-32">Bukti & Foto</th>
                <th className="py-4 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#334155]">
                    <div className="w-16 h-16 rounded-full bg-[#E2F1FD] text-[#334155] flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <CalendarRange className="w-8 h-8" />
                    </div>
                    <span className="font-bold">Tidak ada catatan pelanggaran pada rentang tanggal dan kriteria filter ini.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const isSudah = rec.coachingStatus === 'Sudah';
                  return (
                    <tr key={rec.id} className="hover:bg-teal-50/40 transition-colors">
                      <td className="py-4 px-4 text-center text-[#334155] font-bold">{idx + 1}</td>
                      <td className="py-4 px-4 text-[#0F172A] whitespace-nowrap">
                        <div className="font-extrabold text-[#0F172A]" >{rec.date}</div>
                        <div className="text-[11px] text-[#334155]">{formatDateIndonesian(rec.date)}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-black text-[#0F172A] text-sm" >{rec.studentName}</div>
                        <div className="text-xs text-[#334155] mt-0.5 flex items-center gap-1.5">
                          <span className="font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 shadow-2xs">
                            Kelas {rec.className}
                          </span>
                          <span>•</span>
                          <span>NISN: {rec.nisn}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#0F172A]">{rec.violationName}</div>
                        <div className="text-[11px] text-[#334155] mt-0.5">Pelapor: {rec.reportedBy}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-xs ${
                            isSudah
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                          
                        >
                          {isSudah ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sudah</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Belum</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isSudah && rec.coachingDate ? (
                          <div className="text-[#0F172A] font-extrabold" >
                            {rec.coachingDate}
                            <div className="text-[11px] text-[#334155] font-normal">
                              {formatDateIndonesian(rec.coachingDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#334155] text-xs font-bold">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {rec.coachingPhoto && (
                            <button
                              type="button"
                              onClick={() =>
                                setActivePreviewImage({
                                  url: rec.coachingPhoto!,
                                  title: `Foto Pembinaan: ${rec.studentName}`,
                                })
                              }
                              className="p-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                              title="Lihat Foto Pembinaan"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          {rec.coachingEvidenceFileName && (
                            <button
                              type="button"
                              onClick={() => setActiveRecordForDetail(rec)}
                              className="p-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                              title={`Surat: ${rec.coachingEvidenceFileName}`}
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                          )}
                          {!rec.coachingPhoto && !rec.coachingEvidenceFileName && (
                            <span className="text-[#334155] text-xs font-bold">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveRecordForDetail(rec)}
                          className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#0F172A] font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                          
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0284C7]" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {activeRecordForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-lg w-full border border-white/60 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black" >Rincian Data Rekap Pelanggaran</h3>
                  <p className="text-xs text-slate-300">Detail catatan kejadian & tindak lanjut</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRecordForDetail(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-4 text-xs">
              <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none space-y-1">
                <div className="text-[#334155] text-[10px] uppercase font-black" >Identitas Siswa</div>
                <div className="text-base font-black text-[#0F172A]" >{activeRecordForDetail.studentName}</div>
                <div className="text-[#334155] text-xs">
                  Kelas {activeRecordForDetail.className} • NISN: {activeRecordForDetail.nisn}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none">
                  <div className="text-[#334155] text-[10px] uppercase font-black" >Tanggal Kejadian</div>
                  <div className="font-extrabold text-[#0F172A] mt-1" >{activeRecordForDetail.date}</div>
                  <div className="text-[11px] text-[#334155]">{formatDateIndonesian(activeRecordForDetail.date)}</div>
                </div>

                <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none">
                  <div className="text-[#334155] text-[10px] uppercase font-black" >Status Pembinaan</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl font-extrabold text-xs shadow-xs ${
                        activeRecordForDetail.coachingStatus === 'Sudah'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                      
                    >
                      {activeRecordForDetail.coachingStatus === 'Sudah'
                        ? 'Sudah Dilakukan Pembinaan'
                        : 'Belum Dilakukan Pembinaan'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none">
                <div className="text-[#334155] text-[10px] uppercase font-black" >Jenis Pelanggaran</div>
                <div className="font-black text-[#0F172A] text-sm mt-0.5" >{activeRecordForDetail.violationName}</div>
                <div className="text-[#334155] mt-1 text-xs">{activeRecordForDetail.description}</div>
              </div>

              {activeRecordForDetail.coachingStatus === 'Sudah' && (
                <div className="p-5 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-3 shadow-xs">
                  <div className="font-black text-teal-900 flex items-center gap-2" >
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    <span>Dokumentasi Pembinaan Siswa</span>
                  </div>
                  {activeRecordForDetail.coachingDate && (
                    <div className="text-[#0F172A]">
                      <span className="font-bold">Tanggal Pelaksanaan:</span>{' '}
                      {activeRecordForDetail.coachingDate} ({formatDateIndonesian(activeRecordForDetail.coachingDate)})
                    </div>
                  )}

                  {activeRecordForDetail.coachingPhoto && (
                    <div>
                      <div className="text-xs font-bold text-[#0F172A] mb-1.5 flex items-center justify-between">
                        <span>Foto Dokumentasi Pembinaan:</span>
                        {activeRecordForDetail.coachingPhoto.includes('drive.google.com') && (
                          <a
                            href={getGoogleDriveViewUrl(activeRecordForDetail.coachingPhoto)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 font-bold"
                          >
                            <Cloud className="w-3.5 h-3.5 text-teal-600" /> Buka di Google Drive <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <img
                        src={getGoogleDriveDirectImageUrl(activeRecordForDetail.coachingPhoto)}
                        alt="Foto Pembinaan"
                        className="w-full max-h-56 object-cover rounded-2xl border border-teal-200 cursor-pointer shadow-xs"
                        onClick={() =>
                          setActivePreviewImage({
                            url: activeRecordForDetail.coachingPhoto!,
                            title: `Foto Pembinaan: ${activeRecordForDetail.studentName}`,
                          })
                        }
                      />
                    </div>
                  )}

                  {activeRecordForDetail.coachingEvidenceFileName && (
                    <div className="p-3.5 bg-white rounded-2xl border border-teal-200 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0F172A] truncate text-xs">
                            {activeRecordForDetail.coachingEvidenceFileName}
                          </p>
                          <p className="text-[10px] text-teal-700 font-black">Surat Terverifikasi</p>
                        </div>
                      </div>
                      {activeRecordForDetail.coachingEvidenceFile && (
                        <a
                          href={getGoogleDriveViewUrl(activeRecordForDetail.coachingEvidenceFile)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                          
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Berkas</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveRecordForDetail(null)}
                  className="px-6 py-2.5 bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-xs rounded-2xl shadow-xs hover:-translate-y-0.5 active:scale-[0.92] cursor-pointer"
                  
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {activePreviewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#0F172A] rounded-[32px] overflow-hidden border border-white/20 shadow-sm">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between text-xs font-extrabold" >
              <span>{activePreviewImage.title}</span>
              <div className="flex items-center gap-2">
                {activePreviewImage.url.includes('drive.google.com') && (
                  <a
                    href={getGoogleDriveViewUrl(activePreviewImage.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Google Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActivePreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center bg-black/50">
              <img
                src={getGoogleDriveDirectImageUrl(activePreviewImage.url)}
                alt={activePreviewImage.title}
                className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
