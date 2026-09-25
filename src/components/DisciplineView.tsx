import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Upload, 
  Image as ImageIcon, 
  FileCheck, 
  Eye, 
  Trash2, 
  X, 
  Calendar,
  Layers,
  User,
  Paperclip,
  Maximize2,
  Camera
} from 'lucide-react';
import { DisciplineRecord, SchoolProfile, Student, ViolationCategory, DisciplineStatus, CoachingStatus, ViolationRule } from '../types';
import { sampleViolationCatalog } from '../data/initialData';
import { formatDateIndonesian } from '../utils/exportUtils';

interface DisciplineViewProps {
  students: Student[];
  disciplineRecords: DisciplineRecord[];
  onAddRecord: (record: DisciplineRecord) => void;
  onUpdateStatus?: (id: string, status: DisciplineStatus) => void;
  onUpdateRecord?: (record: DisciplineRecord) => void;
  onDeleteRecord?: (id: string) => void;
  schoolProfile: SchoolProfile;
  currentUserName: string;
  initialStudentForModal?: Student | null;
  initialViolationForModal?: string;
  onClearInitialModalData?: () => void;
  violationRules?: ViolationRule[];
}

export const DisciplineView: React.FC<DisciplineViewProps> = ({
  students,
  disciplineRecords,
  onAddRecord,
  onUpdateStatus,
  onUpdateRecord,
  onDeleteRecord,
  schoolProfile,
  currentUserName,
  initialStudentForModal,
  initialViolationForModal,
  onClearInitialModalData,
  violationRules = sampleViolationCatalog,
}) => {
  const catalogToUse = violationRules && violationRules.length > 0 ? violationRules : sampleViolationCatalog;

  // Filters & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterCoachingStatus, setFilterCoachingStatus] = useState<string>('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modal State for Catat Pelanggaran
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detail / Preview Modal State
  const [activeRecordForDetail, setActiveRecordForDetail] = useState<DisciplineRecord | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Unique classes from students list
  const availableClasses = React.useMemo(() => {
    const classSet = new Set<string>();
    students.forEach((s) => {
      if (s.className) classSet.add(s.className);
    });
    return Array.from(classSet).sort((a, b) => {
      const partsA = a.split('-');
      const partsB = b.split('-');
      if (partsA[0] !== partsB[0]) {
        const order = { X: 1, XI: 2, XII: 3 };
        return (order[partsA[0] as keyof typeof order] || 0) - (order[partsB[0] as keyof typeof order] || 0);
      }
      return parseInt(partsA[1] || '0', 10) - parseInt(partsB[1] || '0', 10);
    });
  }, [students]);

  // Form states strictly adhering to user requirements:
  // 1. Tanggal Kejadian
  // 2. Pilih kelas
  // 3. Nama Siswa
  // 4. Jenis Pelanggaran
  // 5. Poin (otomatis terisi ketika jenis pelanggaran dipilih - tidak ditampilkan teksnya)
  // 6. Status Pembinaan (sudah / belum)
  // 7. Jika sudah: Tanggal Pembinaan, Foto Pembinaan, Bukti Pembinaan (File Surat pembinaan)
  const defaultClass = availableClasses[0] || 'X-1';
  const [incidentDate, setIncidentDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [violationName, setViolationName] = useState<string>(catalogToUse[0]?.name || '');
  
  // Point auto-calculated in state, NOT displayed in form UI as per instruction
  const [autoPoints, setAutoPoints] = useState<number>(() => {
    return catalogToUse[0]?.defaultPoints || 5;
  });
  const [autoCategory, setAutoCategory] = useState<ViolationCategory>('Ringan');

  // Status Pembinaan: sudah / belum
  const [coachingStatus, setCoachingStatus] = useState<CoachingStatus>('Belum');

  // Conditional fields when coachingStatus === 'Sudah'
  const [coachingDate, setCoachingDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [coachingPhoto, setCoachingPhoto] = useState<string | undefined>(undefined);
  const [coachingPhotoName, setCoachingPhotoName] = useState<string>('');
  const [coachingEvidenceFile, setCoachingEvidenceFile] = useState<string | undefined>(undefined);
  const [coachingEvidenceFileName, setCoachingEvidenceFileName] = useState<string>('');

  // File input refs for main form
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // States for Resolving Coaching Modal (when "Tandai: Sudah" is clicked in the history table)
  const [resolvingCoachingRecord, setResolvingCoachingRecord] = useState<DisciplineRecord | null>(null);
  const [resolveCoachingDate, setResolveCoachingDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [resolveCoachingPhoto, setResolveCoachingPhoto] = useState<string | undefined>(undefined);
  const [resolveCoachingPhotoName, setResolveCoachingPhotoName] = useState<string>('');
  const [resolveCoachingEvidenceFile, setResolveCoachingEvidenceFile] = useState<string | undefined>(undefined);
  const [resolveCoachingEvidenceFileName, setResolveCoachingEvidenceFileName] = useState<string>('');
  const resolvePhotoInputRef = useRef<HTMLInputElement>(null);
  const resolveDocInputRef = useRef<HTMLInputElement>(null);

  // States for Dedicated Follow-up Letter Upload Modal (Surat Menyusul)
  const [followUpRecord, setFollowUpRecord] = useState<DisciplineRecord | null>(null);
  const [followUpDocFile, setFollowUpDocFile] = useState<string | undefined>(undefined);
  const [followUpDocFileName, setFollowUpDocFileName] = useState<string>('');
  const followUpDocInputRef = useRef<HTMLInputElement>(null);

  // Students in currently selected class in modal
  const studentsInSelectedClass = React.useMemo(() => {
    return students.filter((s) => s.className === selectedClass);
  }, [students, selectedClass]);

  // Whenever selectedClass changes, automatically set first student
  useEffect(() => {
    if (studentsInSelectedClass.length > 0) {
      const currentValid = studentsInSelectedClass.find((s) => s.id === selectedStudentId);
      if (!currentValid) {
        setSelectedStudentId(studentsInSelectedClass[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [studentsInSelectedClass, selectedStudentId]);

  // Point mapping helper based on violation chosen
  const determinePointsAndCategory = (vName: string) => {
    const foundCatalog = catalogToUse.find((c) => c.name === vName);
    if (foundCatalog) {
      return {
        points: foundCatalog.defaultPoints,
        category: foundCatalog.category,
      };
    }
    // Default fallback
    return {
      points: 10,
      category: 'Ringan' as ViolationCategory,
    };
  };

  // Handle change in Jenis Pelanggaran: auto-updates points silently
  const handleViolationChange = (newViolation: string) => {
    setViolationName(newViolation);
    const { points, category } = determinePointsAndCategory(newViolation);
    setAutoPoints(points);
    setAutoCategory(category);
  };

  // Trigger open modal if requested from parent (e.g. from Daily Attendance view)
  useEffect(() => {
    if (initialStudentForModal) {
      setSelectedClass(initialStudentForModal.className);
      setSelectedStudentId(initialStudentForModal.id);
      if (initialViolationForModal) {
        handleViolationChange(initialViolationForModal);
      }
      setIsModalOpen(true);
      if (onClearInitialModalData) {
        onClearInitialModalData();
      }
    }
  }, [initialStudentForModal, initialViolationForModal, onClearInitialModalData]);

  // Open modal reset handler
  const handleOpenModal = () => {
    const firstClass = availableClasses[0] || 'X-1';
    setSelectedClass(firstClass);
    const firstStudent = students.find((s) => s.className === firstClass);
    if (firstStudent) {
      setSelectedStudentId(firstStudent.id);
    }
    setIncidentDate(new Date().toISOString().slice(0, 10));
    handleViolationChange(catalogToUse[0]?.name || 'Keterlambatan masuk sekolah (> 15 menit)');
    setCoachingStatus('Belum');
    setCoachingDate(new Date().toISOString().slice(0, 10));
    setCoachingPhoto(undefined);
    setCoachingPhotoName('');
    setCoachingEvidenceFile(undefined);
    setCoachingEvidenceFileName('');
    setIsModalOpen(true);
  };

  // Main Form File Upload Handlers
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

  // Resolve Modal Handlers (When "Tandai: Sudah" is clicked in history)
  const handleClickTandaiSudah = (record: DisciplineRecord) => {
    setResolvingCoachingRecord(record);
    setResolveCoachingDate(record.coachingDate || new Date().toISOString().slice(0, 10));
    setResolveCoachingPhoto(record.coachingPhoto);
    setResolveCoachingPhotoName(record.coachingPhotoName || '');
    setResolveCoachingEvidenceFile(record.coachingEvidenceFile);
    setResolveCoachingEvidenceFileName(record.coachingEvidenceFileName || '');
  };

  const handleToggleToBelum = (record: DisciplineRecord) => {
    if (confirm(`Ubah status pembinaan siswa ${record.studentName} kembali menjadi "Belum"?`)) {
      const updated: DisciplineRecord = {
        ...record,
        coachingStatus: 'Belum',
        status: 'Dalam Pantauan',
      };
      if (onUpdateRecord) {
        onUpdateRecord(updated);
      } else if (onUpdateStatus) {
        onUpdateStatus(record.id, 'Dalam Pantauan');
      }
      setExportNotice(`Status pembinaan ${record.studentName} diubah menjadi Belum.`);
      setTimeout(() => setExportNotice(null), 3000);
    }
  };

  const handleResolvePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResolveCoachingPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setResolveCoachingPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResolveDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResolveCoachingEvidenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setResolveCoachingEvidenceFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveResolveCoaching = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingCoachingRecord) return;

    // SYARAT MINIMAL: Harus ada foto pembinaan
    if (!resolveCoachingPhoto) {
      alert('Syarat minimal untuk menyelesaikan pembinaan adalah mengunggah Foto Pembinaan. File surat bukti pembinaan dapat menyusul jika masih dalam proses tanda tangan.');
      return;
    }

    const hasLetter = Boolean(resolveCoachingEvidenceFile || resolveCoachingEvidenceFileName);

    const updated: DisciplineRecord = {
      ...resolvingCoachingRecord,
      coachingStatus: 'Sudah',
      coachingDate: resolveCoachingDate,
      coachingPhoto: resolveCoachingPhoto,
      coachingPhotoName: resolveCoachingPhotoName || 'Foto_Pembinaan.jpg',
      coachingEvidenceFile: resolveCoachingEvidenceFile,
      coachingEvidenceFileName: hasLetter ? (resolveCoachingEvidenceFileName || 'Surat_Pembinaan.pdf') : undefined,
      status: hasLetter ? 'Selesai' : 'Dalam Pantauan',
      positiveIntervention: hasLetter
        ? 'Pembinaan telah dilaksanakan dan dokumen surat bukti pembinaan telah diunggah lengkap.'
        : 'Sesi pembinaan telah dilaksanakan dengan foto kegiatan. Surat bukti pembinaan sedang dalam proses tanda tangan (menyusul).',
    };

    if (onUpdateRecord) {
      onUpdateRecord(updated);
    } else if (onUpdateStatus) {
      onUpdateStatus(updated.id, updated.status);
    }

    setResolvingCoachingRecord(null);
    setExportNotice(
      hasLetter
        ? `Pembinaan siswa ${updated.studentName} selesai lengkap (Foto & Surat terverifikasi).`
        : `Pembinaan siswa ${updated.studentName} ditandai SUDAH (Foto ada). Beri tanda: Surat Menyusul (Belum TTD).`
    );
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Follow-up Letter Handlers (for uploading surat when signatures are ready)
  const handleOpenFollowUpModal = (record: DisciplineRecord) => {
    setFollowUpRecord(record);
    setFollowUpDocFile(record.coachingEvidenceFile);
    setFollowUpDocFileName(record.coachingEvidenceFileName || '');
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

  const handleSaveFollowUpLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpRecord) return;
    if (!followUpDocFile && !followUpDocFileName) {
      alert('Silakan pilih file dokumen surat bukti pembinaan yang telah ditandatangani.');
      return;
    }

    const updated: DisciplineRecord = {
      ...followUpRecord,
      coachingEvidenceFile: followUpDocFile,
      coachingEvidenceFileName: followUpDocFileName || 'Surat_Pembinaan_Bertandatangan.pdf',
      status: 'Selesai',
      positiveIntervention: 'Pembinaan telah dilaksanakan dan dokumen surat bukti pembinaan bertanda tangan telah diunggah lengkap.',
    };

    if (onUpdateRecord) {
      onUpdateRecord(updated);
    } else if (onUpdateStatus) {
      onUpdateStatus(updated.id, 'Selesai');
    }

    setFollowUpRecord(null);
    setExportNotice(`Surat bukti pembinaan siswa ${updated.studentName} berhasil diunggah! Status pembinaan kini Lengkap.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Form Submit Handler
  const handleSubmitCatatPelanggaran = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      alert('Silakan pilih nama siswa yang valid.');
      return;
    }

    // SYARAT MINIMAL: Jika status pembinaan dipilih 'Sudah', wajib ada foto pembinaan
    if (coachingStatus === 'Sudah' && !coachingPhoto) {
      alert('Syarat minimal untuk memilih status pembinaan "Sudah" adalah mengunggah Foto Pembinaan. Berkas surat bukti pembinaan dapat menyusul jika sedang dimintakan tanda tangan.');
      return;
    }

    const hasLetter = Boolean(coachingEvidenceFile || coachingEvidenceFileName);

    const newRecord: DisciplineRecord = {
      id: `disc-${Date.now()}`,
      date: incidentDate,
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      classId: student.classId,
      className: student.className,
      category: autoCategory,
      violationName: violationName.trim(),
      points: autoPoints, // stored automatically without being displayed in form
      description: `Pencatatan pelanggaran ${violationName} pada tanggal ${formatDateIndonesian(incidentDate)}`,
      positiveIntervention: coachingStatus === 'Sudah' 
        ? (hasLetter 
            ? 'Telah dilaksanakan pembinaan dan dokumen surat bukti pembinaan lengkap.' 
            : 'Sesi pembinaan telah dilaksanakan (ada foto dokumentasi). Surat bukti pembinaan dalam proses tanda tangan (menyusul).') 
        : 'Menunggu proses pembinaan tata tertib oleh wali kelas / guru piket.',
      status: coachingStatus === 'Sudah' ? (hasLetter ? 'Selesai' : 'Dalam Pantauan') : 'Dalam Pantauan',
      reportedBy: currentUserName,
      coachingStatus,
      coachingDate: coachingStatus === 'Sudah' ? coachingDate : undefined,
      coachingPhoto: coachingStatus === 'Sudah' ? coachingPhoto : undefined,
      coachingPhotoName: coachingStatus === 'Sudah' ? (coachingPhotoName || 'Foto_Pembinaan.jpg') : undefined,
      coachingEvidenceFile: coachingStatus === 'Sudah' ? coachingEvidenceFile : undefined,
      coachingEvidenceFileName: coachingStatus === 'Sudah' ? (hasLetter ? coachingEvidenceFileName : undefined) : undefined,
    };

    onAddRecord(newRecord);
    setIsModalOpen(false);
    setExportNotice(
      coachingStatus === 'Sudah' && !hasLetter
        ? `Catatan pelanggaran ${student.name} disimpan. Status: Sudah Dibina (Foto ada), Surat Menyusul.`
        : `Catatan pelanggaran siswa ${student.name} berhasil disimpan.`
    );
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Quick toggle coaching status from table
  const handleQuickToggleCoaching = (record: DisciplineRecord) => {
    const newStatus: CoachingStatus = record.coachingStatus === 'Sudah' ? 'Belum' : 'Sudah';
    const updated: DisciplineRecord = {
      ...record,
      coachingStatus: newStatus,
      status: newStatus === 'Sudah' ? 'Selesai' : 'Dalam Pantauan',
      coachingDate: newStatus === 'Sudah' ? (record.coachingDate || new Date().toISOString().slice(0, 10)) : undefined,
    };

    if (onUpdateRecord) {
      onUpdateRecord(updated);
    } else if (onUpdateStatus) {
      onUpdateStatus(record.id, updated.status);
    }
  };

  // Filtered records
  const filteredRecords = disciplineRecords.filter((rec) => {
    const matchSearch =
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.nisn.includes(searchQuery) ||
      rec.violationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = filterClass === 'ALL' || rec.className === filterClass;
    const matchCoaching = filterCoachingStatus === 'ALL' || rec.coachingStatus === filterCoachingStatus;
    return matchSearch && matchClass && matchCoaching;
  });

  // KPI calculations
  const totalRecords = disciplineRecords.length;
  const belumPembinaanCount = disciplineRecords.filter((r) => r.coachingStatus !== 'Sudah').length;
  const suratMenyusulCount = disciplineRecords.filter((r) => r.coachingStatus === 'Sudah' && (!r.coachingEvidenceFile && !r.coachingEvidenceFileName)).length;
  const tuntasLengkapCount = disciplineRecords.filter((r) => r.coachingStatus === 'Sudah' && (!!r.coachingEvidenceFile || !!r.coachingEvidenceFileName)).length;
  const persentaseTuntas = totalRecords > 0 ? Math.round(((tuntasLengkapCount + suratMenyusulCount) / totalRecords) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Input Data Pelanggaran
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pencatatan data pelanggaran tata tertib dan status pembinaan siswa {schoolProfile.name}
                </p>
              </div>
            </div>
          </div>

          {/* Tombol Catat Pelanggaran yang Disediakan */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              id="catat-pelanggaran-btn"
              onClick={handleOpenModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Catat Pelanggaran</span>
            </button>
          </div>
        </div>

        {/* Informative notification */}
        {exportNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Pelanggaran</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalRecords}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">36 Rombel jenjang X, XI, XII</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase">Belum Pembinaan</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800 mt-1">{belumPembinaanCount}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5 font-medium">Perlu tindak lanjut pembinaan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase">Surat Menyusul</span>
            <Paperclip className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{suratMenyusulCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5 font-medium">Foto ada, menunggu TTD surat</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase">Pembinaan Lengkap</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{tuntasLengkapCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Foto & surat resmi lengkap</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-violation-input"
              type="text"
              placeholder="Cari nama siswa, NISN, atau jenis pelanggaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700">
              <span className="text-slate-400">Kelas:</span>
              <select
                id="filter-violation-class-select"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-transparent font-semibold focus:outline-hidden cursor-pointer text-slate-800"
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Coaching Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700">
              <span className="text-slate-400">Status Pembinaan:</span>
              <select
                id="filter-coaching-status-select"
                value={filterCoachingStatus}
                onChange={(e) => setFilterCoachingStatus(e.target.value)}
                className="bg-transparent font-semibold focus:outline-hidden cursor-pointer text-slate-800"
              >
                <option value="ALL">Semua Status</option>
                <option value="Belum">Belum Pembinaan</option>
                <option value="Sudah">Sudah Pembinaan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
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
                <th className="py-3 px-3 text-center w-32">Foto & Bukti</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada catatan data pelanggaran yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const isSudah = rec.coachingStatus === 'Sudah';
                  const hasLetter = Boolean(rec.coachingEvidenceFile || rec.coachingEvidenceFileName);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{rec.date}</div>
                        <div className="text-[10px] text-slate-400">{formatDateIndonesian(rec.date)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{rec.studentName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            Kelas {rec.className}
                          </span>
                          <span>•</span>
                          <span>NISN: {rec.nisn}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{rec.violationName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Pelapor: <span className="text-slate-600 font-medium">{rec.reportedBy}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {!isSudah ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span>Belum Dibina</span>
                          </span>
                        ) : !hasLetter ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sudah Dibina</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/60">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Surat Menyusul (Belum TTD)</span>
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sudah Dibina</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/60">
                              <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Surat Lengkap</span>
                            </span>
                          </div>
                        )}
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
                          {/* Foto Pembinaan indicator/button */}
                          {rec.coachingPhoto ? (
                            <button
                              type="button"
                              onClick={() => setActivePreviewImage({ url: rec.coachingPhoto!, title: `Foto Pembinaan: ${rec.studentName}` })}
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                              title="Lihat Foto Pembinaan (Syarat Minimal Terpenuhi)"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}

                          {/* Surat Pembinaan indicator/button */}
                          {rec.coachingEvidenceFileName ? (
                            <button
                              type="button"
                              onClick={() => setActiveRecordForDetail(rec)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              title={`Surat Pembinaan: ${rec.coachingEvidenceFileName}`}
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                          ) : isSudah ? (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded" title="Surat bukti pembinaan menyusul (dalam proses tanda tangan)">
                              Belum Ada Surat
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isSudah ? (
                            <button
                              type="button"
                              onClick={() => handleClickTandaiSudah(rec)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Tandai Sudah Pembinaan (Syarat minimal: Foto Pembinaan, Surat bisa menyusul)"
                            >
                              <Upload className="w-3 h-3 text-emerald-600" />
                              <span>Tandai: Sudah</span>
                            </button>
                          ) : !hasLetter ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenFollowUpModal(rec)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Unggah surat bukti pembinaan yang sudah selesai ditandatangani"
                              >
                                <Paperclip className="w-3 h-3 text-amber-700" />
                                <span>Unggah Surat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleToBelum(rec)}
                                className="px-1.5 py-1 rounded-lg text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                title="Ubah kembali status ke Belum"
                              >
                                Ubah
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleToBelum(rec)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Klik untuk ubah kembali ke Belum"
                            >
                              Ubah: Belum
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => setActiveRecordForDetail(rec)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Lihat Rincian Data"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteRecord && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus catatan pelanggaran siswa ${rec.studentName}?`)) {
                                  onDeleteRecord(rec.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================= */}
      {/* MODAL: CATAT PELANGGARAN                                  */}
      {/* Kolom input:                                              */}
      {/* - Tanggal Kejadian                                        */}
      {/* - Pilih kelas                                             */}
      {/* - Nama Siswa                                              */}
      {/* - Jenis Pelanggaran                                       */}
      {/* - Poin (otomatis terisi ketika jenis pelanggaran dipilih)  */}
      {/*   *tidak perlu ditampilkan tulisannya                     */}
      {/* - Status Pembinaan (sudah/belum)                          */}
      {/*   jika dipilih sudah maka muncul:                         */}
      {/*   - Tanggal Pembinaan                                     */}
      {/*   - Foto Pembinaan                                        */}
      {/*   - Bukti Pembinaan (File Surat pembinaan)                */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Catat Pelanggaran</h3>
                  <p className="text-xs text-emerald-200">
                    Formulir pencatatan pelanggaran tata tertib dan data pembinaan siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-catat-pelanggaran-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCatatPelanggaran} className="p-6 space-y-4 text-xs">
              {/* 1. Tanggal Kejadian */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tanggal Kejadian</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  id="input-tanggal-kejadian"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* 2. Pilih Kelas & 3. Nama Siswa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 2. Pilih kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih Kelas</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-pilih-kelas"
                    required
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    {availableClasses.map((cName) => (
                      <option key={cName} value={cName}>
                        Kelas {cName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Nama Siswa */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nama Siswa</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-nama-siswa"
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    {studentsInSelectedClass.length === 0 ? (
                      <option value="">Tidak ada siswa di kelas ini</option>
                    ) : (
                      studentsInSelectedClass.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.nisn})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* 4. Jenis Pelanggaran */}
              {/* Catatan: Poin otomatis terisi ketika jenis pelanggaran dipilih, tidak perlu ditampilkan tulisannya */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Jenis Pelanggaran</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-jenis-pelanggaran"
                  required
                  value={violationName}
                  onChange={(e) => handleViolationChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {catalogToUse.map((cat, i) => (
                    <option key={cat.id || i} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="Pelanggaran tata tertib lainnya">
                    Pelanggaran tata tertib lainnya
                  </option>
                </select>
              </div>

              {/* 5. Status Pembinaan *(sudah/belum) */}
              <div className="pt-1">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Status Pembinaan
                  <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="status-pembinaan-belum-btn"
                    onClick={() => setCoachingStatus('Belum')}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      coachingStatus === 'Belum'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Belum Dilakukan Pembinaan</span>
                  </button>

                  <button
                    type="button"
                    id="status-pembinaan-sudah-btn"
                    onClick={() => setCoachingStatus('Sudah')}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      coachingStatus === 'Sudah'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sudah Dilakukan Pembinaan</span>
                  </button>
                </div>
              </div>

              {/* JIKA STATUS PEMBINAAN DIPILIH SUDAH, MAKA MUNCUL: */}
              {/* - Tanggal Pembinaan */}
              {/* - Foto Pembinaan (Syarat Minimal Selesai) */}
              {/* - Bukti Pembinaan *(File Surat pembinaan - Bisa menyusul) */}
              {coachingStatus === 'Sudah' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Data Pelaksanaan Pembinaan Siswa</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      Minimal: Foto Pembinaan
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-200 text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-bold text-emerald-800">Ketentuan Selesai Pembinaan:</span> Syarat minimal untuk menyelesaikan pembinaan adalah melampirkan <span className="font-semibold text-slate-800">Foto Pembinaan</span>. Berkas <span className="font-semibold text-slate-800">Surat Bukti Pembinaan</span> yang memerlukan tanda tangan beberapa pihak dapat <span className="text-amber-700 font-semibold">menyusul</span> dan diunggah sewaktu-waktu.
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
                      id="input-tanggal-pembinaan"
                      value={coachingDate}
                      onChange={(e) => setCoachingDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                      id="input-foto-pembinaan"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    {coachingPhoto ? (
                      <div className="flex items-center gap-3 p-2.5 bg-white border border-emerald-300 rounded-xl">
                        <img
                          src={coachingPhoto}
                          alt="Foto Pembinaan"
                          className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                          onClick={() => setActivePreviewImage({ url: coachingPhoto, title: 'Pratinjau Foto Pembinaan' })}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-xs">{coachingPhotoName || 'Foto_Pembinaan.jpg'}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">Foto pembinaan siap dilampirkan (syarat minimal terpenuhi)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          Ganti
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => photoInputRef.current?.click()}
                        className="border-2 border-dashed border-rose-300 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center gap-1"
                      >
                        <Upload className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-slate-700 text-xs">Pilih atau Unggah Foto Kegiatan Pembinaan</span>
                        <span className="text-[10px] text-rose-500 font-semibold">* Wajib diunggah untuk menyelesaikan pembinaan</span>
                      </div>
                    )}
                  </div>

                  {/* Bukti Pembinaan *(File Surat pembinaan) */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Surat Bukti Pembinaan (Dokumen Bertandatangan)</span>
                        <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px] font-semibold">Bisa Menyusul</span>
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
                      id="input-bukti-pembinaan-file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />

                    {coachingEvidenceFileName ? (
                      <div className="flex items-center gap-3 p-2.5 bg-white border border-emerald-300 rounded-xl">
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
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          Ganti
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => docInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center gap-1"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-slate-700 text-xs">Unggah Dokumen Surat Pembinaan (Opsional / Bisa Menyusul)</span>
                        <span className="text-[10px] text-slate-400">Jika surat masih dalam proses tanda tangan beberapa pihak, dapat diunggah menyusul nanti</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  id="cancel-catat-pelanggaran-btn"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-catat-pelanggaran-btn"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Catatan Pelanggaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Record Modal */}
      {activeRecordForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Rincian Data Pelanggaran Siswa</h3>
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
                <div className="text-slate-400 text-[10px] uppercase font-bold">Data Siswa</div>
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
                      {activeRecordForDetail.coachingStatus === 'Sudah' ? 'Sudah Dilakukan Pembinaan' : 'Belum Dilakukan Pembinaan'}
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
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dokumentasi Pembinaan</span>
                  </div>
                  {activeRecordForDetail.coachingDate && (
                    <div className="text-slate-700">
                      <span className="font-semibold text-slate-900">Tanggal Pembinaan:</span> {activeRecordForDetail.coachingDate} ({formatDateIndonesian(activeRecordForDetail.coachingDate)})
                    </div>
                  )}

                  {activeRecordForDetail.coachingPhoto && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800 mb-1">Foto Pembinaan:</div>
                      <img
                        src={activeRecordForDetail.coachingPhoto}
                        alt="Foto Pembinaan"
                        className="w-full max-h-48 object-cover rounded-xl border border-emerald-200 cursor-pointer"
                        onClick={() => setActivePreviewImage({ url: activeRecordForDetail.coachingPhoto!, title: `Foto Pembinaan: ${activeRecordForDetail.studentName}` })}
                      />
                    </div>
                  )}

                  {activeRecordForDetail.coachingEvidenceFileName && (
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-slate-800 flex-1 truncate">{activeRecordForDetail.coachingEvidenceFileName}</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Surat Terverifikasi</span>
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

      {/* Jendela Modal Upload Foto Pembinaan & Surat Pembinaan (Tandai: Sudah) */}
      {resolvingCoachingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Unggah Bukti & Selesaikan Pembinaan</h3>
                  <p className="text-[11px] text-slate-300">Tandai status pembinaan menjadi sudah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolvingCoachingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolveCoaching} className="p-6 space-y-4 text-xs">
              {/* Info Siswa & Pelanggaran */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{resolvingCoachingRecord.studentName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Kelas {resolvingCoachingRecord.className}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  NISN: {resolvingCoachingRecord.nisn} • Tanggal Kejadian: {resolvingCoachingRecord.date}
                </div>
                <div className="pt-1 text-slate-800 font-semibold border-t border-slate-200/60 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{resolvingCoachingRecord.violationName}</span>
                </div>
              </div>

              {/* Info Syarat Minimal */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-bold">Ketentuan:</span> Syarat minimal untuk menyelesaikan pembinaan adalah melampirkan <span className="font-semibold underline">Foto Pembinaan</span>. Surat bukti pembinaan dapat <span className="font-semibold text-amber-800">menyusul</span> jika masih memerlukan tanda tangan beberapa pihak, dan siswa tetap akan ditandai berstatus "Surat Menyusul".
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
                  value={resolveCoachingDate}
                  onChange={(e) => setResolveCoachingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Foto Pembinaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Foto Pembinaan</span>
                    <span className="text-rose-500 font-bold">* (Syarat Wajib Minimal)</span>
                  </span>
                  {resolveCoachingPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolveCoachingPhoto(undefined);
                        setResolveCoachingPhotoName('');
                        if (resolvePhotoInputRef.current) resolvePhotoInputRef.current.value = '';
                      }}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </label>
                <input
                  type="file"
                  ref={resolvePhotoInputRef}
                  accept="image/*"
                  onChange={handleResolvePhotoUpload}
                  className="hidden"
                />
                {resolveCoachingPhoto ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-emerald-300 flex items-center gap-3">
                    <img
                      src={resolveCoachingPhoto}
                      alt="Preview Foto Pembinaan"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 cursor-pointer"
                      onClick={() => setActivePreviewImage({ url: resolveCoachingPhoto, title: `Foto Pembinaan: ${resolvingCoachingRecord.studentName}` })}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{resolveCoachingPhotoName || 'Foto_Pembinaan.jpg'}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Foto siap disimpan (syarat minimal terpenuhi)</div>
                      <button
                        type="button"
                        onClick={() => resolvePhotoInputRef.current?.click()}
                        className="text-[11px] text-emerald-700 hover:underline font-bold mt-1 inline-block"
                      >
                        Ganti Foto
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResolveCoachingPhoto(undefined);
                        setResolveCoachingPhotoName('');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => resolvePhotoInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-rose-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center gap-1 text-slate-500 cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-700">Unggah Foto Kegiatan Pembinaan</span>
                    <span className="text-[10px] text-rose-500 font-semibold">* Wajib ada foto untuk menandai pembinaan sudah</span>
                  </button>
                )}
              </div>

              {/* Bukti Pembinaan (File Surat Pembinaan) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Surat Bukti Pembinaan (Bertanda Tangan)</span>
                    <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px] font-semibold">Bisa Menyusul</span>
                  </span>
                  {resolveCoachingEvidenceFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolveCoachingEvidenceFile(undefined);
                        setResolveCoachingEvidenceFileName('');
                        if (resolveDocInputRef.current) resolveDocInputRef.current.value = '';
                      }}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Hapus Dokumen
                    </button>
                  )}
                </label>
                <input
                  type="file"
                  ref={resolveDocInputRef}
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleResolveDocUpload}
                  className="hidden"
                />
                {resolveCoachingEvidenceFile || resolveCoachingEvidenceFileName ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {resolveCoachingEvidenceFileName || 'Surat_Pembinaan.pdf'}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Surat terlampir</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => resolveDocInputRef.current?.click()}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Ganti
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResolveCoachingEvidenceFile(undefined);
                          setResolveCoachingEvidenceFileName('');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => resolveDocInputRef.current?.click()}
                    className="w-full p-3.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center gap-1 text-slate-500 cursor-pointer"
                  >
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-xs text-slate-700">Unggah Surat Pembinaan (Opsional / Menyusul)</span>
                    <span className="text-[10px] text-slate-400">Dapat diunggah menyusul setelah tanda tangan selesai</span>
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResolvingCoachingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Status Pembinaan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khusus Unggah Surat Pembinaan Menyusul */}
      {followUpRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="text-base font-bold">Unggah Surat Bukti Pembinaan</h3>
                  <p className="text-[11px] text-amber-100">Lengkapi tanda tangan surat bukti pembinaan yang menyusul</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFollowUpRecord(null)}
                className="p-1.5 rounded-lg text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUpLetter} className="p-6 space-y-4 text-xs">
              {/* Info Siswa */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{followUpRecord.studentName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    Kelas {followUpRecord.className}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  NISN: {followUpRecord.nisn} • Tgl Pelanggaran: {followUpRecord.date}
                </div>
                <div className="pt-1 text-slate-800 font-semibold border-t border-amber-200/60 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{followUpRecord.violationName}</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sesi pembinaan telah selesai pada {followUpRecord.coachingDate || followUpRecord.date} (Foto telah ada)</span>
                </div>
              </div>

              {/* Upload Input */}
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => followUpDocInputRef.current?.click()}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Ganti
                      </button>
                    </div>
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

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFollowUpRecord(null)}
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
