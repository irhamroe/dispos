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
  X, 
  Calendar, 
  User, 
  ShieldAlert,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  BellRing,
  Cloud,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { DisciplineRecord, SchoolProfile, Student } from '../types';
import { formatDateIndonesian } from '../utils/exportUtils';
import { sortClasses, sortDisciplineRecords } from '../utils/sortUtils';
import { 
  uploadFileToGoogleDrive, 
  isGoogleDriveConfigured, 
  getGoogleDriveDirectImageUrl, 
  getGoogleDriveViewUrl 
} from '../services/googleDriveService';

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

  // Upload loading states for Google Drive
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadingFollowUpDoc, setUploadingFollowUpDoc] = useState(false);

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

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Available classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return sortClasses(Array.from(set));
  }, [students]);

  // Filter records that have pending debt
  const allDebtRecords = useMemo(() => {
    const list = disciplineRecords.filter((rec) => {
      const isCoachingBelum = rec.coachingStatus !== 'Sudah';
      const isMissingLetter = !rec.coachingEvidenceFileName && !rec.coachingEvidenceFile;
      return isCoachingBelum || isMissingLetter;
    });
    return sortDisciplineRecords(list);
  }, [disciplineRecords]);

  // Sub-counts
  const totalDebtCount = allDebtRecords.length;
  const noCoachingCount = allDebtRecords.filter((r) => r.coachingStatus !== 'Sudah').length;
  const waitingLetterCount = allDebtRecords.filter((r) => r.coachingStatus === 'Sudah' && !r.coachingEvidenceFileName && !r.coachingEvidenceFile).length;

  // Filtered by criteria
  const filteredDebtRecords = useMemo(() => {
    return allDebtRecords.filter((rec) => {
      if (debtFilterType === 'NO_COACHING' && rec.coachingStatus === 'Sudah') return false;
      if (debtFilterType === 'WAITING_LETTER' && (rec.coachingStatus !== 'Sudah' || rec.coachingEvidenceFileName || rec.coachingEvidenceFile)) return false;

      if (selectedClass !== 'ALL' && rec.className !== selectedClass) return false;

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
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoachingPhotoName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setCoachingPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (isGoogleDriveConfigured() && resolvingRecord) {
      setUploadingPhoto(true);
      try {
        const res = await uploadFileToGoogleDrive(file, 'photo', {
          studentName: resolvingRecord.studentName,
          className: resolvingRecord.className,
          violationName: resolvingRecord.violationName,
        });
        if (res.success && res.fileUrl) {
          setCoachingPhoto(res.fileUrl);
          setCoachingPhotoName(res.fileName || file.name);
        }
      } catch (err) {
        console.error('Error saat upload foto pembinaan ke Google Drive:', err);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoachingEvidenceFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setCoachingEvidenceFile(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (isGoogleDriveConfigured() && resolvingRecord) {
      setUploadingEvidence(true);
      try {
        const res = await uploadFileToGoogleDrive(file, 'evidence', {
          studentName: resolvingRecord.studentName,
          className: resolvingRecord.className,
          violationName: resolvingRecord.violationName,
        });
        if (res.success && res.fileUrl) {
          setCoachingEvidenceFile(res.fileUrl);
          setCoachingEvidenceFileName(res.fileName || file.name);
        }
      } catch (err) {
        console.error('Error saat upload surat ke Google Drive:', err);
      } finally {
        setUploadingEvidence(false);
      }
    }
  };

  const handleFollowUpDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFollowUpDocFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setFollowUpDocFile(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (isGoogleDriveConfigured() && letterUploadRecord) {
      setUploadingFollowUpDoc(true);
      try {
        const res = await uploadFileToGoogleDrive(file, 'evidence', {
          studentName: letterUploadRecord.studentName,
          className: letterUploadRecord.className,
          violationName: letterUploadRecord.violationName,
        });
        if (res.success && res.fileUrl) {
          setFollowUpDocFile(res.fileUrl);
          setFollowUpDocFileName(res.fileName || file.name);
        }
      } catch (err) {
        console.error('Error saat upload berkas surat ke Google Drive:', err);
      } finally {
        setUploadingFollowUpDoc(false);
      }
    }
  };

  // Submit resolve modal
  const handleSaveResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRecord) return;

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
      {/* Header Banner with Claymorphism */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-sm border border-white/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileWarning className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight" >
                Tagihan Pembinaan & Surat Siswa
              </h2>
              <p className="text-sm text-[#334155] mt-1 font-medium">
                Monitoring siswa yang belum menyelesaikan sesi pembinaan atau belum mengumpulkan surat bukti pembinaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-rose-50 text-rose-700 font-black text-sm border border-rose-200/80 flex items-center gap-2 shadow-xs" >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{totalDebtCount} Tagihan Terbuka</span>
            </div>
          </div>
        </div>

        {notice && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* KPI Cards with Claymorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-[32px] bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/60 p-6 shadow-xs border border-[#7DD3FC]/70 hover:-translate-y-1.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#0369A1] uppercase tracking-wider">Total Seluruh Tagihan</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <FileWarning className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#0369A1] mt-2 tracking-tight">
            {totalDebtCount}
          </div>
          <div className="text-xs text-[#0369A1]/80 mt-1 font-medium">Siswa dengan kewajiban belum tuntas</div>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/60 p-6 shadow-xs border border-[#FDA4AF]/70 hover:-translate-y-1.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#E11D48] uppercase tracking-wider">Belum Pembinaan</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#E11D48] mt-2 tracking-tight">
            {noCoachingCount}
          </div>
          <div className="text-xs text-[#BE123C] mt-1 font-semibold">Belum ada sesi bimbingan & foto</div>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/60 p-6 shadow-xs border border-[#FCD34D]/70 hover:-translate-y-1.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#B45309] uppercase tracking-wider">Surat Menyusul (Proses TTD)</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Paperclip className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#B45309] mt-2 tracking-tight">
            {waitingLetterCount}
          </div>
          <div className="text-xs text-[#92400E] mt-1 font-semibold">Pembinaan sudah, berkas surat menyusul</div>
        </div>
      </div>

      {/* Filter and Tab Pills */}
      <div className="rounded-[32px] bg-white/80 p-6 backdrop-blur-xl shadow-sm border border-white/60 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tagihan Type Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDebtFilterType('ALL')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                debtFilterType === 'ALL'
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs -translate-y-0.5'
                  : 'bg-[#E2F1FD] text-[#334155] shadow-none hover:bg-white/80'
              }`}
              
            >
              Semua Tagihan ({totalDebtCount})
            </button>
            <button
              type="button"
              onClick={() => setDebtFilterType('NO_COACHING')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                debtFilterType === 'NO_COACHING'
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs -translate-y-0.5'
                  : 'bg-[#E2F1FD] text-[#334155] shadow-none hover:bg-white/80'
              }`}
              
            >
              Belum Pembinaan ({noCoachingCount})
            </button>
            <button
              type="button"
              onClick={() => setDebtFilterType('WAITING_LETTER')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                debtFilterType === 'WAITING_LETTER'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs -translate-y-0.5'
                  : 'bg-[#E2F1FD] text-[#334155] shadow-none hover:bg-white/80'
              }`}
              
            >
              Surat Menyusul / Menunggu TTD ({waitingLetterCount})
            </button>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-[#E2F1FD] rounded-2xl px-4 py-2 shadow-none shrink-0">
            <span className="text-xs font-bold text-[#334155]">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent font-extrabold focus:outline-hidden cursor-pointer text-[#0F172A] text-xs"
              
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

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#334155]" />
          <input
            type="text"
            placeholder="Cari nama siswa, NISN, atau jenis pelanggaran pada daftar tagihan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-[#E2F1FD] rounded-2xl text-xs text-[#0F172A] placeholder-[#334155] shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Debt Table with Claymorphism */}
      <div className="rounded-[32px] bg-white/80 backdrop-blur-xl shadow-sm border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/80 to-purple-50/50 text-[#334155] font-black text-xs uppercase tracking-wider border-b border-slate-200/60" >
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-4 w-32">Tgl Kejadian</th>
                <th className="py-4 px-5">Nama Siswa & Kelas</th>
                <th className="py-4 px-5 min-w-[200px]">Pelanggaran</th>
                <th className="py-4 px-4 text-center w-44">Status Pembinaan (Foto)</th>
                <th className="py-4 px-4 text-center w-44">Status Surat Bukti</th>
                <th className="py-4 px-4 text-center w-44">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDebtRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#334155]">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="font-black text-[#0F172A] block text-base" >Tidak Ada Tagihan Aktif!</span>
                    <span className="text-xs text-[#334155] mt-1 block">Seluruh siswa telah menyelesaikan pembinaan dan menyerahkan surat bukti secara lengkap.</span>
                  </td>
                </tr>
              ) : (
                filteredDebtRecords.map((rec, idx) => {
                  const isCoachingBelum = rec.coachingStatus !== 'Sudah';
                  const hasLetter = Boolean(rec.coachingEvidenceFile || rec.coachingEvidenceFileName);
                  const isWaitingLetter = rec.coachingStatus === 'Sudah' && !hasLetter;

                  return (
                    <tr key={rec.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-4 px-4 text-center text-[#334155] font-bold">{idx + 1}</td>
                      <td className="py-4 px-4 text-[#0F172A] whitespace-nowrap">
                        <div className="font-extrabold text-[#0F172A]" >{rec.date}</div>
                        <div className="text-[11px] text-[#334155]">{formatDateIndonesian(rec.date)}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-black text-[#0F172A] text-sm" >{rec.studentName}</div>
                        <div className="text-xs text-[#334155] mt-0.5 flex items-center gap-1.5">
                          <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 shadow-2xs">
                            {rec.className}
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
                        {isCoachingBelum ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs" >
                            <Clock className="w-4 h-4 text-rose-500" />
                            <span>Belum Pembinaan</span>
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs" >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sudah Dibina</span>
                            </span>
                            {rec.coachingPhoto && (
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto({ url: rec.coachingPhoto!, title: `Foto Pembinaan: ${rec.studentName}` })}
                                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Lihat Foto</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {hasLetter ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs" >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Surat Lengkap</span>
                          </span>
                        ) : isWaitingLetter ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs" >
                              <Paperclip className="w-3.5 h-3.5 text-amber-700" />
                              <span>Surat Menyusul</span>
                            </span>
                            <span className="text-[10px] text-amber-700 font-semibold">Perlu TTD beberapa orang</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#E2F1FD] text-[#334155] shadow-none">
                            Belum Ada
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isWaitingLetter ? (
                            <button
                              type="button"
                              onClick={() => handleOpenLetterUploadModal(rec)}
                              className="px-3 py-2 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer"
                              title="Unggah Surat Bukti Pembinaan yang telah ditandatangani"
                            >
                              <Paperclip className="w-4 h-4" />
                              <span>Unggah Surat</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenResolveModal(rec)}
                              className="px-3 py-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer"
                              title="Tandai Pembinaan Selesai"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Bina Siswa</span>
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
      </div>

      {/* MODAL: Selesaikan Tagihan Pembinaan */}
      {resolvingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-lg w-full border border-white/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[calc(100vh-2rem)] flex flex-col my-auto">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black" >Selesaikan Tagihan Pembinaan</h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Unggah bukti foto dan file surat pembinaan untuk menuntaskan tagihan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolvingRecord(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolve} className="p-6 sm:p-8 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Info Banner */}
              <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none space-y-1">
                <div className="text-[#334155] text-[10px] uppercase font-black" >Siswa & Pelanggaran</div>
                <div className="font-black text-[#0F172A] text-sm" >{resolvingRecord.studentName}</div>
                <div className="text-[#334155] text-xs">
                  {resolvingRecord.className} • NISN: {resolvingRecord.nisn}
                </div>
                <div className="text-rose-700 font-bold pt-1.5 border-t border-slate-300/40 mt-1.5">
                  Pelanggaran: {resolvingRecord.violationName} ({resolvingRecord.date})
                </div>
              </div>

              {/* Info Syarat Minimal */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed shadow-xs">
                <span className="font-black">Ketentuan:</span> Syarat minimal untuk menyelesaikan pembinaan adalah melampirkan <span className="font-extrabold underline">Foto Pembinaan</span>. Surat bukti pembinaan dapat <span className="font-extrabold text-amber-800">menyusul</span> jika masih memerlukan tanda tangan beberapa pihak.
              </div>

              {/* Tanggal Pembinaan */}
              <div>
                <label className="block font-black text-[#0F172A] mb-1.5 flex items-center gap-1.5" >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Tanggal Pembinaan</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={coachingDate}
                  onChange={(e) => setCoachingDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Foto Pembinaan */}
              <div>
                <label className="block font-black text-[#0F172A] mb-1.5 flex items-center justify-between" >
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Foto Pembinaan</span>
                    <span className="text-rose-500 font-black">* (Syarat Wajib Minimal)</span>
                  </span>
                  {coachingPhoto && !uploadingPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoachingPhoto(undefined);
                        setCoachingPhotoName('');
                        if (photoInputRef.current) photoInputRef.current.value = '';
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
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

                {uploadingPhoto ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Sedang mengunggah file...</span>
                  </div>
                ) : coachingPhoto ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-emerald-300 shadow-xs">
                    <img
                      src={getGoogleDriveDirectImageUrl(coachingPhoto)}
                      alt="Foto Pembinaan"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs cursor-pointer"
                      onClick={() => setPreviewPhoto({ url: coachingPhoto, title: `Foto Pembinaan: ${resolvingRecord.studentName}` })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[#0F172A] truncate text-xs">{coachingPhotoName || 'Foto_Pembinaan.jpg'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {coachingPhoto.includes('drive.google.com') || coachingPhoto.includes('googleusercontent.com') ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold border border-emerald-200">
                            <Cloud className="w-3 h-3 text-emerald-600" /> Google Drive (Folder Foto)
                          </span>
                        ) : (
                          <p className="text-[11px] text-emerald-700 font-semibold">Foto pembinaan terlampir (syarat minimal terpenuhi)</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                      
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="border-2 border-dashed border-rose-300 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer bg-[#E2F1FD] shadow-none hover:bg-white transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="w-6 h-6 text-emerald-600" />
                    <span className="font-extrabold text-[#0F172A] text-xs">Pilih atau Seret Foto Pembinaan</span>
                    <span className="text-[11px] text-rose-500 font-bold">* Wajib melampirkan foto pelaksanaan pembinaan</span>
                  </div>
                )}
              </div>

              {/* Bukti Pembinaan (File Surat Pembinaan) */}
              <div>
                <label className="block font-black text-[#0F172A] mb-1.5 flex items-center justify-between" >
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <span>Bukti Surat Pembinaan (File Surat)</span>
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">Bisa Menyusul</span>
                  </span>
                  {coachingEvidenceFileName && !uploadingEvidence && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoachingEvidenceFile(undefined);
                        setCoachingEvidenceFileName('');
                        if (docInputRef.current) docInputRef.current.value = '';
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
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

                {uploadingEvidence ? (
                  <div className="p-4 bg-sky-50 border border-sky-300 rounded-2xl flex items-center justify-center gap-2 text-sky-800 text-xs font-bold shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Sedang mengunggah file...</span>
                  </div>
                ) : coachingEvidenceFileName ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-emerald-300 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[#0F172A] truncate text-xs">{coachingEvidenceFileName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {coachingEvidenceFile && (coachingEvidenceFile.includes('drive.google.com') || coachingEvidenceFile.includes('googleusercontent.com')) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg font-bold border border-sky-200">
                            <Cloud className="w-3 h-3 text-sky-600" /> Google Drive (Folder Surat)
                          </span>
                        ) : (
                          <p className="text-[11px] text-emerald-700 font-semibold">Surat pembinaan resmi terlampir</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                      
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => docInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer bg-[#E2F1FD] shadow-none hover:bg-white transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="w-6 h-6 text-[#334155]" />
                    <span className="font-extrabold text-[#0F172A] text-xs">Unggah Surat Pembinaan (Opsional / Bisa Menyusul)</span>
                    <span className="text-[11px] text-[#334155]">Bisa diunggah menyusul setelah tanda tangan lengkap</span>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResolvingRecord(null)}
                  className="px-5 py-2.5 rounded-2xl bg-[#E2F1FD] hover:bg-white text-[#334155] font-black transition-all shadow-xs active:scale-[0.92] active:shadow-none cursor-pointer"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer flex items-center gap-2"
                  
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Simpan Pembinaan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Khusus Unggah Surat Bukti Pembinaan Menyusul */}
      {letterUploadRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-lg w-full border border-white/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[calc(100vh-2rem)] flex flex-col my-auto">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
                  <Paperclip className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black" >Unggah Surat Bukti Pembinaan</h3>
                  <p className="text-xs text-amber-100 font-medium">
                    Lengkapi surat bukti pembinaan yang telah selesai ditandatangani
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLetterUploadRecord(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUpLetter} className="p-6 sm:p-8 space-y-5 text-xs overflow-y-auto flex-1">
              <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none space-y-1">
                <div className="font-black text-[#0F172A] text-sm" >{letterUploadRecord.studentName}</div>
                <div className="text-[#334155] text-xs">
                  {letterUploadRecord.className} • NISN: {letterUploadRecord.nisn}
                </div>
                <div className="text-[#0F172A] font-bold pt-1.5 border-t border-slate-300/40 mt-1.5">
                  Pelanggaran: {letterUploadRecord.violationName}
                </div>
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sesi pembinaan telah dilaksanakan (Foto ada). Menunggu tanda tangan surat bukti.</span>
                </div>
              </div>

              <div>
                <label className="block font-black text-[#0F172A] mb-1.5 flex items-center justify-between" >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>Dokumen Surat Bukti Pembinaan (Telah Ditandatangani)</span>
                    <span className="text-rose-500 font-black">*</span>
                  </span>
                </label>
                <input
                  type="file"
                  ref={followUpDocInputRef}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFollowUpDocUpload}
                  className="hidden"
                />

                {uploadingFollowUpDoc ? (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-center gap-2 text-amber-800 text-xs font-bold shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Sedang mengunggah file...</span>
                  </div>
                ) : followUpDocFile || followUpDocFileName ? (
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-300 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#0F172A] truncate" >
                          {followUpDocFileName || 'Surat_Pembinaan_Bertandatangan.pdf'}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {followUpDocFile && (followUpDocFile.includes('drive.google.com') || followUpDocFile.includes('googleusercontent.com')) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold border border-emerald-200">
                              <Cloud className="w-3 h-3 text-emerald-600" /> Google Drive (Folder Surat)
                            </span>
                          ) : (
                            <div className="text-[11px] text-emerald-600 font-bold">Dokumen surat siap disimpan</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => followUpDocInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#E2F1FD] hover:bg-white text-[#334155] font-black rounded-xl text-xs shadow-xs active:scale-[0.92] cursor-pointer"
                      
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => followUpDocInputRef.current?.click()}
                    className="w-full p-5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-[#E2F1FD] rounded-2xl shadow-none hover:bg-white transition-all flex flex-col items-center justify-center gap-2 text-[#334155] cursor-pointer"
                  >
                    <Upload className="w-7 h-7 text-amber-600" />
                    <span className="font-black text-xs text-[#0F172A]" >Pilih Berkas Surat Bukti Pembinaan</span>
                    <span className="text-[11px] text-[#334155]">Format: PDF, DOC, DOCX, atau Foto/Scan Surat bertanda tangan</span>
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLetterUploadRecord(null)}
                  className="px-5 py-2.5 rounded-2xl bg-[#E2F1FD] hover:bg-white text-[#334155] font-black transition-all shadow-xs active:scale-[0.92] active:shadow-none cursor-pointer"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer flex items-center gap-2"
                  
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Simpan Surat Pembinaan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Preview Foto */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#0F172A] rounded-[32px] overflow-hidden border border-white/20 shadow-sm">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between text-xs font-extrabold" >
              <span>{previewPhoto.title}</span>
              <div className="flex items-center gap-2">
                {previewPhoto.url.includes('drive.google.com') && (
                  <a
                    href={getGoogleDriveViewUrl(previewPhoto.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Google Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center bg-black/50">
              <img
                src={getGoogleDriveDirectImageUrl(previewPhoto.url)}
                alt={previewPhoto.title}
                className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
