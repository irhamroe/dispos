import React, { useState, useMemo, useRef } from 'react';
import { 
  FileWarning, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Upload, 
  Image as ImageIcon, 
  Paperclip, 
  FileText, 
  Printer, 
  X, 
  Calendar, 
  User, 
  ShieldAlert,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  BellRing
} from 'lucide-react';
import { DisciplineRecord, SchoolProfile, Student } from '../types';
import { formatDateIndonesian } from '../utils/exportUtils';

interface DisciplineDebtViewProps {
  disciplineRecords: DisciplineRecord[];
  students: Student[];
  schoolProfile: SchoolProfile;
  onUpdateRecord: (updated: DisciplineRecord) => void;
  currentUserName: string;
}

export const DisciplineDebtView: React.FC<DisciplineDebtViewProps> = ({
  disciplineRecords,
  students,
  schoolProfile,
  onUpdateRecord,
  currentUserName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [debtFilterType, setDebtFilterType] = useState<'ALL' | 'NO_COACHING' | 'WAITING_LETTER'>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  // Modal states for resolving debt
  const [resolvingRecord, setResolvingRecord] = useState<DisciplineRecord | null>(null);
  const [coachingDate, setCoachingDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [coachingPhoto, setCoachingPhoto] = useState<string | undefined>(undefined);
  const [coachingPhotoName, setCoachingPhotoName] = useState<string>('');
  const [coachingEvidenceFile, setCoachingEvidenceFile] = useState<string | undefined>(undefined);
  const [coachingEvidenceFileName, setCoachingEvidenceFileName] = useState<string>('');

  // Follow-up letter modal state (khusus melengkapi surat yang menyusul)
  const [letterUploadRecord, setLetterUploadRecord] = useState<DisciplineRecord | null>(null);
  const [followUpDocFile, setFollowUpDocFile] = useState<string | undefined>(undefined);
  const [followUpDocFileName, setFollowUpDocFileName] = useState<string>('');
  const followUpDocInputRef = useRef<HTMLInputElement>(null);

  // Preview image modal
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  // Call letter / notification preview modal
  const [callingLetterRecord, setCallingLetterRecord] = useState<DisciplineRecord | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Available classes
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

  // Filter records that have pending debt
  // A record has a debt if:
  // 1. coachingStatus !== 'Sudah' OR no coaching photo (Belum Dibina)
  // 2. coachingStatus === 'Sudah' AND missing coachingEvidenceFileName (Surat Menyusul / Belum TTD)
  const allDebtRecords = useMemo(() => {
    return disciplineRecords.filter((rec) => {
      const isCoachingBelum = rec.coachingStatus !== 'Sudah';
      const isMissingLetter = !rec.coachingEvidenceFileName && !rec.coachingEvidenceFile;
      return isCoachingBelum || isMissingLetter;
    });
  }, [disciplineRecords]);

  // Sub-counts
  const totalDebtCount = allDebtRecords.length;
  // Belum Pembinaan: Sesi belum dilaksanakan sama sekali
  const noCoachingCount = allDebtRecords.filter((r) => r.coachingStatus !== 'Sudah').length;
  // Surat Menyusul: Sudah dibina (ada foto), tetapi surat bukti belum diserahkan/diunggah karena perlu minta TTD ke beberapa orang
  const waitingLetterCount = allDebtRecords.filter((r) => r.coachingStatus === 'Sudah' && !r.coachingEvidenceFileName && !r.coachingEvidenceFile).length;

  // Filtered by criteria
  const filteredDebtRecords = useMemo(() => {
    return allDebtRecords.filter((rec) => {
      // Type filter
      if (debtFilterType === 'NO_COACHING' && rec.coachingStatus === 'Sudah') return false;
      if (debtFilterType === 'WAITING_LETTER' && (rec.coachingStatus !== 'Sudah' || rec.coachingEvidenceFileName || rec.coachingEvidenceFile)) return false;

      // Class filter
      if (selectedClass !== 'ALL' && rec.className !== selectedClass) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(query);
        const matchNisn = rec.nisn.includes(query);
        const matchViolation = rec.violationName.toLowerCase().includes(query);
        if (!matchName && !matchNisn && !matchViolation) return false;
      }

      return true;
    });
  }, [allDebtRecords, debtFilterType, selectedClass, searchQuery]);

  // Open resolve modal
  const handleOpenResolveModal = (record: DisciplineRecord) => {
    setResolvingRecord(record);
    setCoachingDate(record.coachingDate || new Date().toISOString().slice(0, 10));
    setCoachingPhoto(record.coachingPhoto);
    setCoachingPhotoName(record.coachingPhotoName || '');
    setCoachingEvidenceFile(record.coachingEvidenceFile);
    setCoachingEvidenceFileName(record.coachingEvidenceFileName || '');
  };

  // Open quick follow-up letter modal
  const handleOpenLetterUploadModal = (record: DisciplineRecord) => {
    setLetterUploadRecord(record);
    setFollowUpDocFile(record.coachingEvidenceFile);
    setFollowUpDocFileName(record.coachingEvidenceFileName || '');
  };

  // Upload handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoachingPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCoachingPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoachingEvidenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCoachingEvidenceFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFollowUpDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFollowUpDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFollowUpDocFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit resolve modal
  const handleSaveResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRecord) return;

    // SYARAT MINIMAL: Foto pembinaan wajib ada
    if (!coachingPhoto) {
      alert('Syarat minimal menyelesaikan pembinaan adalah melampirkan Foto Pembinaan. File surat bukti pembinaan dapat menyusul jika masih dalam proses pengurusan tanda tangan.');
      return;
    }

    const hasLetter = Boolean(coachingEvidenceFile || coachingEvidenceFileName);

    const updated: DisciplineRecord = {
      ...resolvingRecord,
      coachingStatus: 'Sudah',
      coachingDate,
      coachingPhoto,
      coachingPhotoName: coachingPhotoName || 'Foto_Pembinaan.jpg',
      coachingEvidenceFile,
      coachingEvidenceFileName: hasLetter ? (coachingEvidenceFileName || 'Surat_Pembinaan.pdf') : undefined,
      status: hasLetter ? 'Selesai' : 'Dalam Pantauan',
      positiveIntervention: hasLetter
        ? 'Pembinaan telah dilaksanakan dan dokumen surat pembinaan telah diserahkan lengkap.'
        : 'Sesi pembinaan telah dilaksanakan (ada foto dokumentasi). Surat bukti pembinaan masih dalam proses pengurusan tanda tangan (menyusul).',
    };

    onUpdateRecord(updated);
    setResolvingRecord(null);
    setNotice(
      hasLetter
        ? `Pembinaan dan surat bukti siswa ${updated.studentName} selesai lengkap!`
        : `Pembinaan siswa ${updated.studentName} ditandai SUDAH (Foto ada). Tagihan surat bukti pembinaan tetap tercatat menyusul.`
    );
    setTimeout(() => setNotice(null), 4000);
  };

  // Submit follow-up letter modal
  const handleSaveFollowUpLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterUploadRecord) return;
    if (!followUpDocFile && !followUpDocFileName) {
      alert('Silakan pilih file dokumen surat bukti pembinaan yang telah ditandatangani.');
      return;
    }

    const updated: DisciplineRecord = {
      ...letterUploadRecord,
      coachingEvidenceFile: followUpDocFile,
      coachingEvidenceFileName: followUpDocFileName || 'Surat_Pembinaan_Bertandatangan.pdf',
      status: 'Selesai',
      positiveIntervention: 'Dokumen surat bukti pembinaan telah diunggah lengkap dan telah ditandatangani pihak terkait.',
    };

    onUpdateRecord(updated);
    setLetterUploadRecord(null);
    setNotice(`Surat bukti pembinaan siswa ${updated.studentName} berhasil diunggah! Tagihan telah lunas sepenuhnya.`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Tagihan Pembinaan & Surat Siswa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring siswa yang belum menyelesaikan sesi pembinaan atau belum mengumpulkan surat bukti pembinaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-xs border border-rose-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{totalDebtCount} Tagihan Terbuka</span>
            </span>
          </div>
        </div>

        {notice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Seluruh Tagihan</span>
            <FileWarning className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalDebtCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Siswa dengan kewajiban belum tuntas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase">Belum Pembinaan</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800 mt-1">{noCoachingCount}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5 font-medium">Belum ada sesi bimbingan & foto</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase">Surat Menyusul (Proses TTD)</span>
            <Paperclip className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{waitingLetterCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5 font-medium">Pembinaan sudah, berkas surat menyusul</div>
        </div>
      </div>

      {/* Filter and Tab Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tagihan Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDebtFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                debtFilterType === 'ALL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Tagihan ({totalDebtCount})
            </button>
            <button
              type="button"
              onClick={() => setDebtFilterType('NO_COACHING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                debtFilterType === 'NO_COACHING'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Belum Pembinaan ({noCoachingCount})
            </button>
            <button
              type="button"
              onClick={() => setDebtFilterType('WAITING_LETTER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                debtFilterType === 'WAITING_LETTER'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Surat Menyusul / Menunggu TTD ({waitingLetterCount})
            </button>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 shrink-0">
            <span className="text-slate-400">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent font-bold focus:outline-hidden cursor-pointer text-slate-800"
            >
              <option value="ALL">Semua Kelas</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa, NISN, atau jenis pelanggaran pada daftar tagihan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Debt Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-28">Tgl Kejadian</th>
                <th className="py-3 px-4">Nama Siswa & Kelas</th>
                <th className="py-3 px-4 min-w-[200px]">Pelanggaran</th>
                <th className="py-3 px-3 text-center w-40">Status Pembinaan (Foto)</th>
                <th className="py-3 px-3 text-center w-44">Status Surat Bukti</th>
                <th className="py-3 px-3 text-center w-44">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDebtRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <span className="font-bold text-slate-700 block text-sm">Tidak Ada Tagihan Aktif!</span>
                    Seluruh siswa telah menyelesaikan pembinaan dan menyerahkan surat bukti secara lengkap.
                  </td>
                </tr>
              ) : (
                filteredDebtRecords.map((rec, idx) => {
                  const isCoachingBelum = rec.coachingStatus !== 'Sudah';
                  const hasPhoto = Boolean(rec.coachingPhoto);
                  const hasLetter = Boolean(rec.coachingEvidenceFile || rec.coachingEvidenceFileName);
                  const isWaitingLetter = rec.coachingStatus === 'Sudah' && !hasLetter;

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
                          <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
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
                        {isCoachingBelum ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span>Belum Pembinaan</span>
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sudah Dibina</span>
                            </span>
                            {rec.coachingPhoto && (
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto({ url: rec.coachingPhoto!, title: `Foto Pembinaan: ${rec.studentName}` })}
                                className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Lihat Foto</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {hasLetter ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Surat Lengkap</span>
                          </span>
                        ) : isWaitingLetter ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Paperclip className="w-3 h-3 text-amber-700" />
                              <span>Surat Menyusul</span>
                            </span>
                            <span className="text-[9px] text-amber-700">Perlu TTD beberapa orang</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            Belum Ada
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isWaitingLetter ? (
                            /* Selesaikan upload surat menyusul */
                            <button
                              type="button"
                              onClick={() => handleOpenLetterUploadModal(rec)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Unggah Surat Bukti Pembinaan yang telah ditandatangani"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Unggah Surat</span>
                            </button>
                          ) : (
                            /* Selesaikan Sesi Pembinaan (Foto wajib, surat opsional) */
                            <button
                              type="button"
                              onClick={() => handleOpenResolveModal(rec)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Tandai Pembinaan Selesai"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Bina Siswa</span>
                            </button>
                          )}

                          {/* Cetak Surat Panggilan */}
                          <button
                            type="button"
                            onClick={() => setCallingLetterRecord(rec)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Cetak Surat Panggilan / Tagihan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Selesaikan Tagihan Pembinaan */}
      {resolvingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-base font-bold">Selesaikan Tagihan Pembinaan</h3>
                  <p className="text-xs text-emerald-200">
                    Unggah bukti foto dan file surat pembinaan untuk menuntaskan tagihan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolvingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolve} className="p-6 space-y-4 text-xs">
              {/* Info Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Siswa & Pelanggaran</div>
                <div className="font-extrabold text-slate-900 text-sm">{resolvingRecord.studentName}</div>
                <div className="text-slate-600 text-[11px]">
                  Kelas {resolvingRecord.className} • NISN: {resolvingRecord.nisn}
                </div>
                <div className="text-rose-700 font-semibold pt-1 border-t border-slate-200/60 mt-1">
                  Pelanggaran: {resolvingRecord.violationName} ({resolvingRecord.date})
                </div>
              </div>

              {/* Info Syarat Minimal */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-bold">Ketentuan:</span> Syarat minimal untuk menyelesaikan pembinaan adalah melampirkan <span className="font-semibold underline">Foto Pembinaan</span>. Surat bukti pembinaan dapat <span className="font-semibold text-amber-800">menyusul</span> jika masih memerlukan tanda tangan beberapa pihak.
              </div>

              {/* Tanggal Pembinaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tanggal Pembinaan</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={coachingDate}
                  onChange={(e) => setCoachingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Foto Pembinaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Foto Pembinaan</span>
                    <span className="text-rose-500 font-bold">* (Syarat Wajib Minimal)</span>
                  </span>
                  {coachingPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoachingPhoto(undefined);
                        setCoachingPhotoName('');
                        if (photoInputRef.current) photoInputRef.current.value = '';
                      }}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </label>

                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {coachingPhoto ? (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-emerald-300 rounded-xl">
                    <img
                      src={coachingPhoto}
                      alt="Foto Pembinaan"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                      onClick={() => setPreviewPhoto({ url: coachingPhoto, title: `Foto Pembinaan: ${resolvingRecord.studentName}` })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate text-xs">{coachingPhotoName || 'Foto_Pembinaan.jpg'}</p>
                      <p className="text-[10px] text-emerald-700">Foto pembinaan terlampir (syarat minimal terpenuhi)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="border-2 border-dashed border-rose-300 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-slate-700 text-xs">Pilih atau Seret Foto Pembinaan</span>
                    <span className="text-[10px] text-rose-500 font-semibold">* Wajib melampirkan foto pelaksanaan pembinaan</span>
                  </div>
                )}
              </div>

              {/* Bukti Pembinaan (File Surat Pembinaan) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bukti Surat Pembinaan (File Surat)</span>
                    <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">Bisa Menyusul</span>
                  </span>
                  {coachingEvidenceFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoachingEvidenceFile(undefined);
                        setCoachingEvidenceFileName('');
                        if (docInputRef.current) docInputRef.current.value = '';
                      }}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Hapus File
                    </button>
                  )}
                </label>

                <input
                  type="file"
                  ref={docInputRef}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />

                {coachingEvidenceFileName ? (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-emerald-300 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate text-xs">{coachingEvidenceFileName}</p>
                      <p className="text-[10px] text-emerald-700">Surat pembinaan resmi terlampir</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => docInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-slate-700 text-xs">Unggah Surat Pembinaan (Opsional / Bisa Menyusul)</span>
                    <span className="text-[10px] text-slate-400">Bisa diunggah menyusul setelah tanda tangan lengkap</span>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResolvingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pembinaan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Khusus Unggah Surat Bukti Pembinaan Menyusul */}
      {letterUploadRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="text-base font-bold">Unggah Surat Bukti Pembinaan</h3>
                  <p className="text-xs text-amber-100">
                    Lengkapi surat bukti pembinaan yang telah selesai ditandatangani
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLetterUploadRecord(null)}
                className="p-1.5 rounded-lg text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUpLetter} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">{letterUploadRecord.studentName}</div>
                <div className="text-slate-600 text-[11px]">
                  Kelas {letterUploadRecord.className} • NISN: {letterUploadRecord.nisn}
                </div>
                <div className="text-slate-800 font-semibold pt-1 border-t border-amber-200/60 mt-1">
                  Pelanggaran: {letterUploadRecord.violationName}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sesi pembinaan telah dilaksanakan (Foto ada). Menunggu tanda tangan surat bukti.</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>Dokumen Surat Bukti Pembinaan (Telah Ditandatangani)</span>
                    <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="file"
                  ref={followUpDocInputRef}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFollowUpDocUpload}
                  className="hidden"
                />

                {followUpDocFile || followUpDocFileName ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {followUpDocFileName || 'Surat_Pembinaan_Bertandatangan.pdf'}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Dokumen surat siap disimpan</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => followUpDocInputRef.current?.click()}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => followUpDocInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-slate-500 cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-amber-600" />
                    <span className="font-bold text-xs text-slate-800">Pilih Berkas Surat Bukti Pembinaan</span>
                    <span className="text-[10px] text-slate-400">Format: PDF, DOC, DOCX, atau Foto/Scan Surat bertanda tangan</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLetterUploadRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Surat Pembinaan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Preview Foto */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
            <div className="p-3.5 bg-slate-800 text-white flex items-center justify-between text-xs font-bold">
              <span>{previewPhoto.title}</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Surat Pemanggilan Siswa / Notifikasi Tagihan */}
      {callingLetterRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Surat Pemanggilan & Tagihan Pembinaan Siswa</span>
              </div>
              <button
                type="button"
                onClick={() => setCallingLetterRecord(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Letterhead & Body */}
            <div className="p-6 space-y-4 text-xs text-slate-800 font-serif leading-relaxed">
              {/* Kop Surat */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h3 className="font-bold text-sm tracking-wide text-slate-900">{schoolProfile.name.toUpperCase()}</h3>
                <p className="text-[10px] text-slate-600 font-sans">
                  {schoolProfile.address}, {schoolProfile.city} | NPSN: {schoolProfile.npsn}
                </p>
                <p className="text-[10px] text-slate-500 font-sans">TIM KETERTIBAN & BIMBINGAN KONSELING</p>
              </div>

              <div className="text-right text-[11px] font-sans">
                Kota Batu, {formatDateIndonesian(new Date().toISOString().slice(0, 10))}
              </div>

              <div className="space-y-1 font-sans">
                <p><strong>Nomor:</strong> 421.3/BK-DISC/{new Date().getFullYear()}</p>
                <p><strong>Hal:</strong> Pemberitahuan & Tagihan Penyelesaian Pembinaan Siswa</p>
                <p><strong>Kepada Yth:</strong> Orang Tua / Wali Siswa dari <strong>{callingLetterRecord.studentName}</strong></p>
                <p>Di Tempat</p>
              </div>

              <p>Dengan hormat,</p>
              <p>
                Berdasarkan rekapitulasi data ketertiban siswa {schoolProfile.name}, dengan ini kami menginformasikan
                bahwa putra/putri Bapak/Ibu tercatat melakukan pelanggaran tata tertib sekolah berupa:
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-sans space-y-1 text-xs">
                <p><strong>Nama Siswa:</strong> {callingLetterRecord.studentName}</p>
                <p><strong>Kelas / NISN:</strong> Kelas {callingLetterRecord.className} / {callingLetterRecord.nisn}</p>
                <p><strong>Tanggal Kejadian:</strong> {formatDateIndonesian(callingLetterRecord.date)}</p>
                <p><strong>Jenis Pelanggaran:</strong> {callingLetterRecord.violationName}</p>
                <p><strong>Status Saat Ini:</strong> Belum menyelesaikan kewajiban pembinaan dan penyerahan surat komitmen.</p>
              </div>

              <p>
                Sehubungan dengan hal tersebut, kami mengharapkan kehadiran Bapak/Ibu untuk mendampingi putra/putri
                guna menyelesaikan sesi pembinaan serta penandatanganan surat komitmen bersama di ruang BK/Piket SMAN 1 Batu.
              </p>

              <div className="grid grid-cols-2 pt-6 font-sans text-center">
                <div>
                  <p>Guru BK / Tim Ketertiban,</p>
                  <p className="mt-12 font-bold">(..................................................)</p>
                </div>
                <div>
                  <p>Kepala {schoolProfile.name},</p>
                  <p className="mt-12 font-bold underline">{schoolProfile.principalName}</p>
                  <p className="text-[10px]">NIP. {schoolProfile.principalNip}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCallingLetterRecord(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Surat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
