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
  Paperclip
} from 'lucide-react';
import { DisciplineRecord, SchoolProfile, Student } from '../types';
import { exportDisciplineToExcel, exportDisciplineToPdf, formatDateIndonesian } from '../utils/exportUtils';

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
    return Array.from(set).sort((a, b) => {
      const partsA = a.split('-');
      const partsB = b.split('-');
      if (partsA[0] !== partsB[0]) {
        const order = { X: 1, XI: 2, XII: 3 };
        return (order[partsA[0] as keyof typeof order] || 0) - (order[partsB[0] as keyof typeof order] || 0);
      }
      return parseInt(partsA[1] || '0', 10) - parseInt(partsB[1] || '0', 10);
    });
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

  // Filter records based on Date Range, Class, Status, and Search
  const filteredRecords = useMemo(() => {
    return disciplineRecords.filter((rec) => {
      // Date range check
      const withinDate = rec.date >= startDate && rec.date <= endDate;
      if (!withinDate) return false;

      // Class check
      if (selectedClass !== 'ALL' && rec.className !== selectedClass) return false;

      // Coaching status check
      if (selectedStatus !== 'ALL' && rec.coachingStatus !== selectedStatus) return false;

      // Search query check
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(query);
        const matchNisn = rec.nisn.includes(query);
        const matchViolation = rec.violationName.toLowerCase().includes(query);
        if (!matchName && !matchNisn && !matchViolation) return false;
      }

      return true;
    });
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
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Rekap Pelanggaran & Pembinaan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Laporan rekapitulasi data pelanggaran tata tertib dan status pembinaan berdasarkan rentang tanggal
              </p>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              id="export-recap-excel-btn"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs flex-1 sm:flex-initial cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              id="export-recap-pdf-btn"
              onClick={handleExportPdf}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs flex-1 sm:flex-initial cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Date Range & Filter Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Filter Rentang Tanggal & Parameter
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePresetToday}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handlePreset7Days}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors"
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={handlePresetMonth}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={handlePresetAll}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors"
            >
              Semua Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tanggal Awal */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Awal</label>
            <input
              type="date"
              id="recap-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              id="recap-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Kelas</label>
            <select
              id="recap-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
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
            <label className="block font-bold text-slate-700 mb-1">Status Pembinaan</label>
            <select
              id="recap-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="ALL">Semua Status Pembinaan</option>
              <option value="Sudah">Sudah Pembinaan</option>
              <option value="Belum">Belum Pembinaan</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa, NISN, atau jenis pelanggaran pada rentang tanggal ini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* KPI Cards for Selected Date Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Kasus Pada Rentang</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {formatDateIndonesian(startDate)} - {formatDateIndonesian(endDate)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase">Belum Pembinaan</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{belumCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5 font-medium">Perlu ditindaklanjuti</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase">Sudah Pembinaan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{sudahCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Telah selesai dibina</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700 uppercase">Rasio Penyelesaian</span>
            <FileCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">{persentaseTuntas}%</div>
          <div className="text-[11px] text-teal-600/80 mt-0.5">Tuntas pada periode ini</div>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <span>Daftar Pelanggaran Hasil Rekapitulasi</span>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-extrabold">
              {filteredRecords.length} Data
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Rentang: <span className="font-semibold text-slate-700">{startDate} s/d {endDate}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-28">Tanggal Kejadian</th>
                <th className="py-3 px-4">Nama Siswa & Kelas</th>
                <th className="py-3 px-4 min-w-[220px]">Jenis Pelanggaran</th>
                <th className="py-3 px-3 text-center w-36">Status Pembinaan</th>
                <th className="py-3 px-3 w-32 text-center">Tanggal Pembinaan</th>
                <th className="py-3 px-3 text-center w-28">Bukti & Foto</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarRange className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada catatan pelanggaran pada rentang tanggal dan kriteria filter ini.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const isSudah = rec.coachingStatus === 'Sudah';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{rec.date}</div>
                        <div className="text-[10px] text-slate-400">{formatDateIndonesian(rec.date)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{rec.studentName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
                            Kelas {rec.className}
                          </span>
                          <span>•</span>
                          <span>NISN: {rec.nisn}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{rec.violationName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Pelapor: {rec.reportedBy}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
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
                      <td className="py-3.5 px-3 text-center">
                        {isSudah && rec.coachingDate ? (
                          <div className="text-slate-800 font-semibold">
                            {rec.coachingDate}
                            <div className="text-[10px] text-slate-400 font-normal">
                              {formatDateIndonesian(rec.coachingDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
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
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                              title="Lihat Foto Pembinaan"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          {rec.coachingEvidenceFileName && (
                            <button
                              type="button"
                              onClick={() => setActiveRecordForDetail(rec)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              title={`Surat: ${rec.coachingEvidenceFileName}`}
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                          )}
                          {!rec.coachingPhoto && !rec.coachingEvidenceFileName && (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveRecordForDetail(rec)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Rincian Data Rekap Pelanggaran</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveRecordForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Identitas Siswa</div>
                <div className="text-sm font-extrabold text-slate-900">{activeRecordForDetail.studentName}</div>
                <div className="text-slate-600">
                  Kelas {activeRecordForDetail.className} • NISN: {activeRecordForDetail.nisn}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Tanggal Kejadian</div>
                  <div className="font-bold text-slate-800 mt-1">{activeRecordForDetail.date}</div>
                  <div className="text-[10px] text-slate-500">{formatDateIndonesian(activeRecordForDetail.date)}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Status Pembinaan</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
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

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Jenis Pelanggaran</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{activeRecordForDetail.violationName}</div>
                <div className="text-slate-500 mt-1">{activeRecordForDetail.description}</div>
              </div>

              {activeRecordForDetail.coachingStatus === 'Sudah' && (
                <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 space-y-2">
                  <div className="font-bold text-teal-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Dokumentasi Pembinaan Siswa</span>
                  </div>
                  {activeRecordForDetail.coachingDate && (
                    <div className="text-slate-700">
                      <span className="font-semibold text-slate-900">Tanggal Pelaksanaan:</span>{' '}
                      {activeRecordForDetail.coachingDate} ({formatDateIndonesian(activeRecordForDetail.coachingDate)})
                    </div>
                  )}

                  {activeRecordForDetail.coachingPhoto && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800 mb-1">Foto Dokumentasi Pembinaan:</div>
                      <img
                        src={activeRecordForDetail.coachingPhoto}
                        alt="Foto Pembinaan"
                        className="w-full max-h-48 object-cover rounded-xl border border-teal-200 cursor-pointer"
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
                    <div className="p-2.5 bg-white rounded-lg border border-teal-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-slate-800 flex-1 truncate">
                        {activeRecordForDetail.coachingEvidenceFileName}
                      </span>
                      <span className="text-[10px] text-teal-700 font-bold">Surat Terverifikasi</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveRecordForDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
            <div className="p-3.5 bg-slate-800 text-white flex items-center justify-between text-xs font-bold">
              <span>{activePreviewImage.title}</span>
              <button
                type="button"
                onClick={() => setActivePreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50">
              <img
                src={activePreviewImage.url}
                alt={activePreviewImage.title}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
