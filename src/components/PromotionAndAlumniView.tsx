import React, { useState, useMemo, useRef } from 'react';
import { 
  GraduationCap, 
  ArrowUpRight, 
  Shuffle, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Archive, 
  UserCheck, 
  Users, 
  Eye, 
  Printer, 
  Trash2, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Layers, 
  ShieldAlert, 
  Award, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Loader2, 
  Info,
  Check,
  Send,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Student, 
  DisciplineRecord, 
  SchoolProfile, 
  AdminUser, 
  RoleMatrixMap 
} from '../types';
import { RombelClass } from '../data/initialData';
import { sortClasses, sortStudents } from '../utils/sortUtils';
import { formatDateIndonesian, getTodayDateString, getTodayIndonesian } from '../utils/exportUtils';
import { getGoogleDriveDirectImageUrl } from '../services/googleDriveService';

interface PromotionAndAlumniViewProps {
  students: Student[];
  classes: RombelClass[];
  disciplineRecords: DisciplineRecord[];
  schoolProfile: SchoolProfile;
  currentUser?: AdminUser | null;
  roleMatrix?: RoleMatrixMap;
  onBatchUpdateStudents: (updatedStudents: Student[]) => Promise<void> | void;
  onUpdateSchoolProfile?: (profile: Partial<SchoolProfile>) => void;
  enablePointsSystem?: boolean;
}

export const PromotionAndAlumniView: React.FC<PromotionAndAlumniViewProps> = ({
  students,
  classes,
  disciplineRecords,
  schoolProfile,
  currentUser,
  onBatchUpdateStudents,
  onUpdateSchoolProfile,
  enablePointsSystem = true,
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'alumni'>('flow');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isGraduationConfirmOpen, setIsGraduationConfirmOpen] = useState(false);
  const [graduationYearInput, setGraduationYearInput] = useState(schoolProfile.academicYear || '2026/2027');
  
  // Step 2 (XI to XII) State
  const [step2Mode, setStep2Mode] = useState<'fixed' | 'shuffle' | 'manual'>('fixed');
  const [step2ManualSourceClass, setStep2ManualSourceClass] = useState<string>('');
  const [step2ManualTargetClass, setStep2ManualTargetClass] = useState<string>('');
  const [step2SelectedStudentIds, setStep2SelectedStudentIds] = useState<string[]>([]);
  
  // Step 3 (X to XI) State
  const [step3Mode, setStep3Mode] = useState<'shuffle' | 'fixed' | 'manual'>('shuffle');
  const [step3ManualSourceClass, setStep3ManualSourceClass] = useState<string>('');
  const [step3ManualTargetClass, setStep3ManualTargetClass] = useState<string>('');
  const [step3SelectedStudentIds, setStep3SelectedStudentIds] = useState<string[]>([]);

  // Alumni Search & Filter
  const [alumniSearch, setAlumniSearch] = useState('');
  const [selectedGraduationYear, setSelectedGraduationYear] = useState<string>('ALL');
  const [viewingAlumni, setViewingAlumni] = useState<Student | null>(null);
  const [printingAlumniRecord, setPrintingAlumniRecord] = useState<Student | null>(null);

  // File Upload refs
  const fileInputXItoXIIRef = useRef<HTMLInputElement>(null);
  const fileInputXtoXIRef = useRef<HTMLInputElement>(null);
  const fileInputNewGradeXRef = useRef<HTMLInputElement>(null);

  // Step 4 (New Grade X import) State
  const [isImportGradeXModalOpen, setIsImportGradeXModalOpen] = useState(false);
  const [previewGradeXStudents, setPreviewGradeXStudents] = useState<Student[]>([]);
  const [importGradeXMode, setImportGradeXMode] = useState<'append' | 'replace'>('append');
  const [importGradeXWarnings, setImportGradeXWarnings] = useState<string[]>([]);

  // Statistics
  const activeStudents = useMemo(() => students.filter((s) => s.status !== 'Lulus' && s.grade !== 'Alumni'), [students]);
  const gradeXIIStudents = useMemo(() => activeStudents.filter((s) => s.grade === 'XII'), [activeStudents]);
  const gradeXIStudents = useMemo(() => activeStudents.filter((s) => s.grade === 'XI'), [activeStudents]);
  const gradeXStudents = useMemo(() => activeStudents.filter((s) => s.grade === 'X'), [activeStudents]);
  const alumniStudents = useMemo(() => students.filter((s) => s.status === 'Lulus' || s.grade === 'Alumni'), [students]);

  // Distinct Graduation Years
  const graduationYears = useMemo(() => {
    const set = new Set<string>();
    alumniStudents.forEach((s) => {
      if (s.graduationYear) set.add(s.graduationYear);
    });
    return Array.from(set).sort().reverse();
  }, [alumniStudents]);

  // Filtered Alumni List
  const filteredAlumni = useMemo(() => {
    return alumniStudents.filter((s) => {
      const matchYear = selectedGraduationYear === 'ALL' || s.graduationYear === selectedGraduationYear;
      const q = alumniSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.className.toLowerCase().includes(q);
      return matchYear && matchSearch;
    });
  }, [alumniStudents, selectedGraduationYear, alumniSearch]);

  const classesX = useMemo(() => classes.filter((c) => c.grade === 'X'), [classes]);
  const classesXI = useMemo(() => classes.filter((c) => c.grade === 'XI'), [classes]);
  const classesXII = useMemo(() => classes.filter((c) => c.grade === 'XII'), [classes]);

  // Auto clear alerts
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // ==========================================
  // ACTION: KELULUSAN KELAS XII -> ALUMNI
  // ==========================================
  const handleExecuteGraduation = async () => {
    if (gradeXIIStudents.length === 0) {
      showError('Tidak ada siswa aktif di kelas XII untuk diluluskan.');
      return;
    }

    setIsProcessing(true);
    try {
      const year = graduationYearInput.trim() || schoolProfile.academicYear;
      const targetIds = new Set(gradeXIIStudents.map((s) => s.id));

      const updated = students.map((s) => {
        if (targetIds.has(s.id)) {
          const prevHistory = s.classHistory || [];
          return {
            ...s,
            grade: 'Alumni' as const,
            status: 'Lulus' as const,
            graduationYear: year,
            classHistory: [
              ...prevHistory,
              {
                grade: 'XII' as const,
                className: s.className,
                academicYear: year,
              },
            ],
          };
        }
        return s;
      });

      await onBatchUpdateStudents(updated);
      setIsGraduationConfirmOpen(false);
      showSuccess(`Berhasil meluluskan ${gradeXIIStudents.length} siswa kelas XII ke Arsip Alumni angkatan ${year}. Rekam jejak disiplin mereka tersimpan aman!`);
    } catch (err: any) {
      showError('Gagal memproses kelulusan: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // ACTION: KENAIKAN KELAS XI KE XII (FORMASI TETAP 1-TO-1)
  // ==========================================
  const handlePromoteXItoXIIFixed = async () => {
    if (gradeXIStudents.length === 0) {
      showError('Tidak ada siswa aktif kelas XI untuk dinaikkan.');
      return;
    }

    const confirmRun = window.confirm(
      `Apakah Anda yakin ingin menaikkan ${gradeXIStudents.length} siswa kelas XI ke kelas XII dengan formasi kelas yang sama (contoh: XI-1 -> XII-1)?\n\nCatatan pelanggaran mereka akan tetap tersimpan utuh.`
    );
    if (!confirmRun) return;

    setIsProcessing(true);
    try {
      const targetIds = new Set(gradeXIStudents.map((s) => s.id));
      const year = schoolProfile.academicYear;

      const updated = students.map((s) => {
        if (targetIds.has(s.id)) {
          // Cari nama kelas XII yang bersesuaian, misal XI-1 -> XII-1
          const targetClassName = s.className.replace(/^XI/i, 'XII');
          const matchedClass = classesXII.find((c) => c.name.toLowerCase() === targetClassName.toLowerCase());
          const newClassId = matchedClass?.id || s.classId;

          const prevHistory = s.classHistory || [];
          return {
            ...s,
            grade: 'XII' as const,
            className: targetClassName,
            classId: newClassId,
            classHistory: [
              ...prevHistory,
              {
                grade: 'XI' as const,
                className: s.className,
                academicYear: year,
              },
            ],
          };
        }
        return s;
      });

      await onBatchUpdateStudents(updated);
      showSuccess(`Berhasil mempromosikan ${gradeXIStudents.length} siswa kelas XI ke jenjang kelas XII (Formasi Tetap)!`);
    } catch (err: any) {
      showError('Gagal mempromosikan siswa: ' + (err?.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // EXCEL DOWNLOAD TEMPLATE PEMETAAN
  // ==========================================
  const handleDownloadMappingTemplate = (grade: 'XI' | 'X') => {
    const targetStudents = grade === 'XI' ? gradeXIStudents : gradeXStudents;
    const targetNextGrade = grade === 'XI' ? 'XII' : 'XI';
    
    if (targetStudents.length === 0) {
      showError(`Tidak ada siswa kelas ${grade} aktif untuk diunduh.`);
      return;
    }

    const rows = targetStudents.map((s, idx) => ({
      'No': idx + 1,
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'Jenis Kelamin': s.gender,
      [`Kelas Lama (${grade})`]: s.className,
      [`Kelas Baru (${targetNextGrade}) (ISI DI SINI)`]: '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `Pemetaan_Kelas_${grade}_ke_${targetNextGrade}`);
    XLSX.writeFile(wb, `Template_Pemetaan_Kenaikan_Kelas_${grade}_ke_${targetNextGrade}_SMAN1Batu.xlsx`);
  };

  // ==========================================
  // ACTION: UPLOAD PEMETAAN EXCEL (UNTUK KELAS DIACAK)
  // ==========================================
  const handleUploadMappingExcel = async (e: React.ChangeEvent<HTMLInputElement>, sourceGrade: 'XI' | 'X') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetNextGrade = sourceGrade === 'XI' ? 'XII' : 'XI';
    const targetClasses = sourceGrade === 'XI' ? classesXII : classesXI;

    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(firstSheet);

      if (!json || json.length === 0) {
        throw new Error('File Excel kosong atau format tidak sesuai.');
      }

      // Map NISN -> New Class Name
      const mapping = new Map<string, string>();
      json.forEach((row) => {
        const rawNisn = String(row['NISN'] || row['nisn'] || '').trim();
        // Cari kolom yang berisi kelas baru
        const newClassKey = Object.keys(row).find((k) => k.toLowerCase().includes('kelas baru') || k.toLowerCase().includes('tujuan') || k.toLowerCase().includes('target'));
        const newClassVal = newClassKey ? String(row[newClassKey] || '').trim() : '';
        if (rawNisn && newClassVal) {
          mapping.set(rawNisn, newClassVal);
        }
      });

      if (mapping.size === 0) {
        throw new Error('Tidak ditemukan data pemetaan kelas baru pada file. Pastikan kolom "Kelas Baru" sudah terisi.');
      }

      let updatedCount = 0;
      const year = schoolProfile.academicYear;

      const updated = students.map((s) => {
        if (s.grade === sourceGrade && s.status !== 'Lulus' && mapping.has(s.nisn)) {
          const targetClassName = mapping.get(s.nisn)!;
          const matchedClass = targetClasses.find((c) => c.name.toLowerCase() === targetClassName.toLowerCase());
          const newClassId = matchedClass?.id || s.classId;
          const prevHistory = s.classHistory || [];

          updatedCount++;
          return {
            ...s,
            grade: targetNextGrade as any,
            className: targetClassName,
            classId: newClassId,
            classHistory: [
              ...prevHistory,
              {
                grade: sourceGrade,
                className: s.className,
                academicYear: year,
              },
            ],
          };
        }
        return s;
      });

      await onBatchUpdateStudents(updated);
      showSuccess(`Berhasil memetakan & menaikkan ${updatedCount} siswa kelas ${sourceGrade} ke kelas ${targetNextGrade} sesuai file Excel! Catatan pelanggaran tetap utuh.`);
    } catch (err: any) {
      showError('Gagal memproses file Excel pemetaan: ' + (err?.message || 'Format tidak valid'));
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // ==========================================
  // ACTION: AUTO-SHUFFLE / BAGI RATA KELAS (DENGAN KESEIMBANGAN GENDER)
  // ==========================================
  const handleAutoShuffleBalance = async (sourceGrade: 'XI' | 'X') => {
    const targetNextGrade = sourceGrade === 'XI' ? 'XII' : 'XI';
    const targetClasses = sourceGrade === 'XI' ? classesXII : classesXI;
    const sourceStudents = sourceGrade === 'XI' ? gradeXIStudents : gradeXStudents;

    if (sourceStudents.length === 0) {
      showError(`Tidak ada siswa kelas ${sourceGrade} untuk diacak.`);
      return;
    }

    if (targetClasses.length === 0) {
      showError(`Tidak ada rombel jenjang ${targetNextGrade} yang terdaftar.`);
      return;
    }

    const confirmRun = window.confirm(
      `Sistem akan mengacak & membagikan ${sourceStudents.length} siswa kelas ${sourceGrade} secara proporsional ke ${targetClasses.length} rombel kelas ${targetNextGrade} dengan penyeimbangan jumlah putra/putri (L/P).\n\nApakah Anda ingin melanjutkan?`
    );
    if (!confirmRun) return;

    setIsProcessing(true);
    try {
      // Pisahkan L dan P untuk penyeimbangan
      const males = [...sourceStudents.filter((s) => s.gender === 'L')].sort(() => Math.random() - 0.5);
      const females = [...sourceStudents.filter((s) => s.gender === 'P')].sort(() => Math.random() - 0.5);

      const studentAllocation = new Map<string, RombelClass>();

      // Distribusikan laki-laki secara merata
      males.forEach((s, idx) => {
        const targetClass = targetClasses[idx % targetClasses.length];
        studentAllocation.set(s.id, targetClass);
      });

      // Distribusikan perempuan secara merata
      females.forEach((s, idx) => {
        const targetClass = targetClasses[idx % targetClasses.length];
        studentAllocation.set(s.id, targetClass);
      });

      const year = schoolProfile.academicYear;
      const updated = students.map((s) => {
        if (studentAllocation.has(s.id)) {
          const targetClass = studentAllocation.get(s.id)!;
          const prevHistory = s.classHistory || [];
          return {
            ...s,
            grade: targetNextGrade as any,
            className: targetClass.name,
            classId: targetClass.id,
            classHistory: [
              ...prevHistory,
              {
                grade: sourceGrade,
                className: s.className,
                academicYear: year,
              },
            ],
          };
        }
        return s;
      });

      await onBatchUpdateStudents(updated);
      showSuccess(`Berhasil mengacak & mendistribusikan ${sourceStudents.length} siswa kelas ${sourceGrade} ke ${targetClasses.length} rombel ${targetNextGrade} secara seimbang!`);
    } catch (err: any) {
      showError('Gagal melakukan distribusi acak: ' + (err?.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // ACTION: PINDAH SELEKSI MANUAL (CHECKLIST SISWA)
  // ==========================================
  const handleExecuteManualMove = async (grade: 'XI' | 'X') => {
    const selectedIds = grade === 'XI' ? step2SelectedStudentIds : step3SelectedStudentIds;
    const targetClass = grade === 'XI' ? step2ManualTargetClass : step3ManualTargetClass;
    const targetNextGrade = grade === 'XI' ? 'XII' : 'XI';
    const targetClasses = grade === 'XI' ? classesXII : classesXI;

    if (selectedIds.length === 0) {
      showError('Silakan pilih/centang minimal 1 siswa terlebih dahulu.');
      return;
    }
    if (!targetClass) {
      showError(`Silakan pilih kelas tujuan jenjang ${targetNextGrade}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const selectedSet = new Set(selectedIds);
      const matchedClass = targetClasses.find((c) => c.name === targetClass);
      const year = schoolProfile.academicYear;

      const updated = students.map((s) => {
        if (selectedSet.has(s.id)) {
          const prevHistory = s.classHistory || [];
          return {
            ...s,
            grade: targetNextGrade as any,
            className: targetClass,
            classId: matchedClass?.id || s.classId,
            classHistory: [
              ...prevHistory,
              {
                grade,
                className: s.className,
                academicYear: year,
              },
            ],
          };
        }
        return s;
      });

      await onBatchUpdateStudents(updated);
      if (grade === 'XI') setStep2SelectedStudentIds([]);
      else setStep3SelectedStudentIds([]);

      showSuccess(`Berhasil memindahkan ${selectedIds.length} siswa terpilih ke kelas ${targetClass}!`);
    } catch (err: any) {
      showError('Gagal memindahkan siswa: ' + (err?.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // ACTION: EKSPOR ARSIP ALUMNI KE EXCEL
  // ==========================================
  const handleExportAlumniToExcel = () => {
    if (filteredAlumni.length === 0) {
      showError('Tidak ada data alumni untuk diekspor.');
      return;
    }

    const rows = filteredAlumni.map((s, idx) => {
      const viols = disciplineRecords.filter((d) => d.studentId === s.id);
      const totalPoints = viols.reduce((acc, curr) => acc + (curr.points || 0), 0);

      return {
        'No': idx + 1,
        'NISN': s.nisn,
        'Nama Lengkap': s.name,
        'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        'Tahun Kelulusan': s.graduationYear || '-',
        'Rombel Terakhir': s.className,
        'Kontak Siswa': s.phone || '-',
        'Kontak Orang Tua': s.parentPhone || '-',
        'Alamat': s.address || '-',
        'Total Catatan Pelanggaran': viols.length,
        'Akumulasi Poin Disiplin': totalPoints,
        'Predikat Ketertiban': viols.length === 0 ? 'Sangat Baik (Tertib)' : viols.length <= 2 ? 'Baik' : 'Perlu Pembinaan Khusus',
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Arsip_Alumni_3_Tahun');
    XLSX.writeFile(wb, `Arsip_Alumni_SMAN1Batu_${selectedGraduationYear === 'ALL' ? 'Semua_Angkatan' : selectedGraduationYear.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ==========================================
  // ACTION: DOWNLOAD TEMPLATE SISWA BARU KELAS X
  // ==========================================
  const handleDownloadGradeXTemplate = () => {
    const rows = [
      {
        'No': 1,
        'NISN': '0091234561',
        'Nama Lengkap': 'Aditya Pratama',
        'Rombel Kelas X': 'X-1',
        'Jenis Kelamin (L/P)': 'L',
        'No HP Siswa': '081234567891',
        'No HP Orang Tua': '081298765431',
        'Alamat Domisili': 'Jl. Panglima Sudirman No. 10, Batu',
      },
      {
        'No': 2,
        'NISN': '0091234562',
        'Nama Lengkap': 'Bella Safitri',
        'Rombel Kelas X': 'X-1',
        'Jenis Kelamin (L/P)': 'P',
        'No HP Siswa': '081234567892',
        'No HP Orang Tua': '081298765432',
        'Alamat Domisili': 'Jl. Diponegoro No. 25, Batu',
      },
      {
        'No': 3,
        'NISN': '0091234563',
        'Nama Lengkap': 'Candra Wijaya',
        'Rombel Kelas X': 'X-2',
        'Jenis Kelamin (L/P)': 'L',
        'No HP Siswa': '081234567893',
        'No HP Orang Tua': '081298765433',
        'Alamat Domisili': 'Jl. Bromo No. 5, Batu',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa_Kelas_X');
    XLSX.writeFile(wb, `Template_Impor_Siswa_Baru_Kelas_X_SMAN1Batu.xlsx`);
  };

  // ==========================================
  // ACTION: UPLOAD EXCEL SISWA BARU KELAS X
  // ==========================================
  const handleUploadGradeXExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(firstSheet);

      if (!json || json.length === 0) {
        throw new Error('File Excel kosong atau format tidak sesuai.');
      }

      const warnings: string[] = [];
      const parsedList: Student[] = [];
      const existingNisns = new Set(students.map((s) => s.nisn));
      const seenFileNisns = new Set<string>();

      json.forEach((row, idx) => {
        const findVal = (keys: string[]) => {
          const matched = Object.keys(row).find((k) =>
            keys.some((key) => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(key.toLowerCase().replace(/[^a-z0-9]/g, '')))
          );
          return matched ? String(row[matched] || '').trim() : '';
        };

        const rawNisn = findVal(['nisn', 'nis', 'noinduk']);
        const rawName = findVal(['nama lengkap', 'namasiswa', 'nama']);
        const rawClass = findVal(['rombel kelas x', 'rombel', 'kelas', 'kelas x']);
        const rawGender = findVal(['jenis kelamin', 'jk', 'gender', 'sex']).toUpperCase();
        const rawPhone = findVal(['no hp siswa', 'hpsiswa', 'telpsiswa', 'telepon']);
        const rawParentPhone = findVal(['no hp orang tua', 'hportu', 'hporangtua', 'teleponortu']);
        const rawAddress = findVal(['alamat domisili', 'alamat', 'tempat tinggal']);

        if (!rawNisn || !rawName) {
          warnings.push(`Baris ${idx + 2}: Dilewati karena NISN atau Nama kosong.`);
          return;
        }

        if (seenFileNisns.has(rawNisn)) {
          warnings.push(`Baris ${idx + 2}: NISN ${rawNisn} duplikat di dalam berkas Excel.`);
          return;
        }
        seenFileNisns.add(rawNisn);

        if (existingNisns.has(rawNisn)) {
          warnings.push(`Baris ${idx + 2}: NISN ${rawNisn} (${rawName}) sudah terdaftar di database.`);
        }

        let normalizedClass = rawClass.toUpperCase().replace(/\s+/g, '-').replace(/X(?=[0-9])/i, 'X-');
        if (/^[0-9]+$/.test(normalizedClass)) {
          normalizedClass = `X-${normalizedClass}`;
        }
        if (!normalizedClass.startsWith('X-')) {
          normalizedClass = 'X-1';
        }

        const matchedClassObj = classesX.find((c) => c.name.toLowerCase() === normalizedClass.toLowerCase());
        const classId = matchedClassObj?.id || `c-x-${normalizedClass.replace('X-', '')}`;
        const gender = (rawGender === 'P' || rawGender.startsWith('PEREMPUAN')) ? 'P' : 'L';

        const newStudent: Student = {
          id: `std-x-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          nisn: rawNisn,
          name: rawName,
          className: normalizedClass,
          classId: classId,
          grade: 'X',
          gender,
          phone: rawPhone || undefined,
          parentPhone: rawParentPhone || undefined,
          address: rawAddress || undefined,
          status: 'Aktif',
          academicYearJoined: schoolProfile.academicYear,
        };

        parsedList.push(newStudent);
      });

      if (parsedList.length === 0) {
        throw new Error('Tidak ada baris data siswa yang valid ditemukan dalam berkas Excel.');
      }

      setPreviewGradeXStudents(parsedList);
      setImportGradeXWarnings(warnings);
      setIsImportGradeXModalOpen(true);
    } catch (err: any) {
      showError('Gagal memproses file Excel: ' + (err?.message || 'Format tidak valid'));
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // ==========================================
  // ACTION: CONFIRM IMPORT SISWA KELAS X
  // ==========================================
  const handleConfirmImportGradeX = async () => {
    if (previewGradeXStudents.length === 0) return;

    setIsProcessing(true);
    try {
      let nextStudents: Student[];

      if (importGradeXMode === 'replace') {
        const nonGradeX = students.filter((s) => s.grade !== 'X' || s.status === 'Lulus');
        nextStudents = [...nonGradeX, ...previewGradeXStudents];
      } else {
        const incomingNisns = new Set(previewGradeXStudents.map((s) => s.nisn));
        const filteredExisting = students.filter((s) => !incomingNisns.has(s.nisn));
        nextStudents = [...filteredExisting, ...previewGradeXStudents];
      }

      await onBatchUpdateStudents(nextStudents);
      setIsImportGradeXModalOpen(false);
      showSuccess(`Berhasil mengimpor dan menambahkan ${previewGradeXStudents.length} siswa baru kelas X ke sistem!`);
      setPreviewGradeXStudents([]);
    } catch (err: any) {
      showError('Gagal menyimpan siswa baru: ' + (err?.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-black">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Siklus Tahun Ajaran &amp; Arsip Retensi 3 Tahun</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Kenaikan Kelas, Kelulusan &amp; Arsip Alumni
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl font-medium leading-relaxed">
              Kelola alur kenaikan kelas dengan aman. Formasi siswa yang utuh maupun diacak tetap mempertahankan 
              seluruh catatan rekam jejak pelanggaran siswa. Siswa kelas XII lulus diarsipkan minimal 3 tahun.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center min-w-[140px]">
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">Tahun Ajaran Aktif</span>
              <span className="text-lg font-black text-amber-300">{schoolProfile.academicYear}</span>
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[10px] text-indigo-200 font-bold block">Total Siswa Aktif</span>
            <span className="text-xl font-black text-white">{activeStudents.length}</span>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Semua Jenjang</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[10px] text-amber-200 font-bold block">Kelas XII (Calon Lulusan)</span>
            <span className="text-xl font-black text-amber-400">{gradeXIIStudents.length}</span>
            <span className="text-[10px] text-amber-300/80 font-medium block mt-0.5">{classesXII.length} Rombel</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[10px] text-sky-200 font-bold block">Kelas XI (Calon Naik XII)</span>
            <span className="text-xl font-black text-sky-400">{gradeXIStudents.length}</span>
            <span className="text-[10px] text-sky-300/80 font-medium block mt-0.5">{classesXI.length} Rombel</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[10px] text-purple-200 font-bold block">Kelas X (Calon Naik XI)</span>
            <span className="text-xl font-black text-purple-400">{gradeXStudents.length}</span>
            <span className="text-[10px] text-purple-300/80 font-medium block mt-0.5">{classesX.length} Rombel</span>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-400/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-300 font-bold block">Arsip Alumni (Lulus)</span>
            <span className="text-xl font-black text-emerald-400">{alumniStudents.length}</span>
            <span className="text-[10px] text-emerald-200/80 font-medium block mt-0.5">Tersimpan &gt;= 3 Thn</span>
          </div>
        </div>
      </div>

      {/* ALERT NOTIFICATIONS */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs sm:text-sm font-bold">{successMessage}</p>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs sm:text-sm font-bold">{errorMessage}</p>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex bg-[#E2F1FD]/70 p-1.5 rounded-2xl shadow-xs text-xs font-bold gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('flow')}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'flow'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Alur Kenaikan Kelas &amp; Kelulusan (4 Tahap)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('alumni')}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'alumni'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Arsip Alumni &amp; Rekam Jejak 3 Tahun ({alumniStudents.length} Data)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ALUR KENAIKAN KELAS & KELULUSAN */}
      {/* ========================================================= */}
      {activeTab === 'flow' && (
        <div className="space-y-6">
          {/* STEP 1: KELULUSAN KELAS XII */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-sm border border-amber-200">
                  1
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Tahap 1: Kelulusan Siswa Kelas XII (Pindah ke Arsip Alumni)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Siswa kelas XII yang lulus dipindahkan ke status Alumni. Data diri, rekam jejak pelanggaran, dan presensi mereka tetap tersimpan utuh di arsip.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  disabled={isProcessing || gradeXIIStudents.length === 0}
                  onClick={() => setIsGraduationConfirmOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Proses Kelulusan Kelas XII ({gradeXIIStudents.length} Siswa)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {classesXII.map((c) => {
                const count = gradeXIIStudents.filter((s) => s.className === c.name).length;
                return (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">Kelas {c.name}</span>
                    <span className="text-sm font-black text-slate-800">{count} Siswa</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: KENAIKAN KELAS XI KE XII (BISA FORMASI TETAP ATAU DIACAK) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-700 flex items-center justify-center font-black text-sm border border-sky-200">
                  2
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Tahap 2: Kenaikan Kelas XI $\rightarrow$ Kelas XII</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                      {gradeXIStudents.length} Siswa Tersedia
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pilih metode promosi: formasi kelas tetap sama (1-ke-1), atau formasi diacak / berpencar ke kelas XII baru.
                  </p>
                </div>
              </div>

              {/* Mode Selection Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setStep2Mode('fixed')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    step2Mode === 'fixed' ? 'bg-white text-sky-700 font-black shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Formasi Tetap (1-ke-1)
                </button>
                <button
                  type="button"
                  onClick={() => setStep2Mode('shuffle')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    step2Mode === 'shuffle' ? 'bg-white text-sky-700 font-black shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Formasi Diacak / Excel
                </button>
                <button
                  type="button"
                  onClick={() => setStep2Mode('manual')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    step2Mode === 'manual' ? 'bg-white text-sky-700 font-black shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Pindah Seleksi Manual
                </button>
              </div>
            </div>

            {/* OPSI 2A: FORMASI TETAP */}
            {step2Mode === 'fixed' && (
              <div className="p-5 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-sky-950">Mode Formasi Tetap (1-ke-1 Mapping Otomatis)</h4>
                    <p className="text-xs text-sky-800/90 mt-0.5 leading-relaxed">
                      Seluruh siswa di rombel XI akan langsung dipromosikan ke rombel XII yang bersesuaian 
                      (contoh: seluruh siswa rombel <strong>XI-1 $\rightarrow$ XII-1</strong>, <strong>XI-2 $\rightarrow$ XII-2</strong>, dst).
                      Catatan pelanggaran dan ID siswa tidak berubah sama sekali.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={isProcessing || gradeXIStudents.length === 0}
                    onClick={handlePromoteXItoXIIFixed}
                    className="px-6 py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Terapkan Kenaikan Formasi Tetap ({gradeXIStudents.length} Siswa XI ke XII)</span>
                  </button>
                </div>
              </div>
            )}

            {/* OPSI 2B: DIACAK / EXCEL MAPPING */}
            {step2Mode === 'shuffle' && (
              <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-5">
                <div className="flex items-start gap-3">
                  <Shuffle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-indigo-950">Mode Formasi Diacak / Distribusi Ulang Siswa</h4>
                    <p className="text-xs text-indigo-800/90 mt-0.5 leading-relaxed">
                      Gunakan file Excel jika Anda sudah memiliki susunan rombel baru dari Kurikulum, atau gunakan pembagian rata otomatis 
                      oleh sistem dengan menjaga keseimbangan jumlah siswa laki-laki dan perempuan.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Sub-metode 1: Excel Pemetaan */}
                  <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
                    <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Cara 1: Pemetaan via File Excel (Akurat)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      1. Unduh template daftar siswa kelas XI.<br />
                      2. Isi nama kelas XII baru di kolom target.<br />
                      3. Unggah file kembali ke sistem.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadMappingTemplate('XI')}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Format Excel</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputXItoXIIRef}
                        accept=".xlsx, .xls"
                        onChange={(e) => handleUploadMappingExcel(e, 'XI')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => fileInputXItoXIIRef.current?.click()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Hasil Pemetaan</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-metode 2: Auto-Shuffle Seimbang */}
                  <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
                    <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                      <Shuffle className="w-4 h-4 text-indigo-600" />
                      <span>Cara 2: Bagi Rata Otomatis (Seimbang L/P)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Sistem akan mengacak siswa kelas XI secara proporsional ke 12 rombel kelas XII dengan 
                      mempertimbangkan rasio seimbang siswa putra dan putri.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={isProcessing || gradeXIStudents.length === 0}
                        onClick={() => handleAutoShuffleBalance('XI')}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Bagi Rata Otomatis ke Rombel XII</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OPSI 2C: MANUAL SELECTOR */}
            {step2Mode === 'manual' && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pindah Rombel Selektif (Checklist Siswa)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">1. Pilih Kelas Asal (Jenjang XI)</label>
                    <select
                      value={step2ManualSourceClass}
                      onChange={(e) => {
                        setStep2ManualSourceClass(e.target.value);
                        setStep2SelectedStudentIds([]);
                      }}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="">-- Pilih Kelas Asal --</option>
                      {classesXI.map((c) => (
                        <option key={c.id} value={c.name}>Kelas {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">2. Pilih Kelas Tujuan (Jenjang XII)</label>
                    <select
                      value={step2ManualTargetClass}
                      onChange={(e) => setStep2ManualTargetClass(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="">-- Pilih Kelas Tujuan --</option>
                      {classesXII.map((c) => (
                        <option key={c.id} value={c.name}>Kelas {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {step2ManualSourceClass && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Daftar Siswa Kelas {step2ManualSourceClass}:</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const sourceList = gradeXIStudents.filter((s) => s.className === step2ManualSourceClass);
                            setStep2SelectedStudentIds(sourceList.map((s) => s.id));
                          }}
                          className="text-sky-600 hover:underline cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setStep2SelectedStudentIds([])}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Batalkan Pilihan
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {gradeXIStudents
                        .filter((s) => s.className === step2ManualSourceClass)
                        .map((s) => (
                          <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step2SelectedStudentIds.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) setStep2SelectedStudentIds((prev) => [...prev, s.id]);
                                else setStep2SelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                              }}
                              className="rounded-sm text-sky-600 focus:ring-sky-500"
                            />
                            <span className="truncate font-medium">{s.name} ({s.gender})</span>
                          </label>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-slate-600">{step2SelectedStudentIds.length} Siswa Terpilih</span>
                      <button
                        type="button"
                        disabled={isProcessing || step2SelectedStudentIds.length === 0 || !step2ManualTargetClass}
                        onClick={() => handleExecuteManualMove('XI')}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        Pindahkan Terpilih ke Kelas {step2ManualTargetClass || '...'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: KENAIKAN KELAS X KE XI (FORMASI DIACAK / PEMINATAN) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-black text-sm border border-purple-200">
                  3
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Tahap 3: Kenaikan Kelas X $\rightarrow$ Kelas XI (Formasi Berpencar / Peminatan)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
                      {gradeXStudents.length} Siswa Tersedia
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Siswa kelas X naik ke kelas XI dengan formasi rombel yang berpencar sesuai mata pelajaran pilihan / Kurikulum Merdeka.
                  </p>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setStep3Mode('shuffle')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    step3Mode === 'shuffle' ? 'bg-white text-purple-700 font-black shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Distribusi Excel / Acak
                </button>
                <button
                  type="button"
                  onClick={() => setStep3Mode('fixed')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    step3Mode === 'fixed' ? 'bg-white text-purple-700 font-black shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Formasi Tetap (1-ke-1)
                </button>
                <button
                  type="button"
                  onClick={() => setStep3Mode('manual')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    step3Mode === 'manual' ? 'bg-white text-purple-700 font-black shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Pindah Seleksi Manual
                </button>
              </div>
            </div>

            {/* Content for Step 3 */}
            {step3Mode === 'shuffle' && (
              <div className="p-5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-4">
                <div className="flex items-start gap-3">
                  <Shuffle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-purple-950">Distribusi Siswa Kelas X ke Kelas XI Baru</h4>
                    <p className="text-xs text-purple-800/90 mt-0.5 leading-relaxed">
                      Unduh template untuk memasukkan pemetaan rombel baru (misal XI-1 s.d. XI-12), lalu unggah kembali file Excel tersebut.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-3">
                    <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Metode Excel (Rekomendasi Utama)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Gunakan file Excel jika daftar rombel XI sudah ditentukan oleh tim kurikulum/BK sekolah.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadMappingTemplate('X')}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Format Excel</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputXtoXIRef}
                        accept=".xlsx, .xls"
                        onChange={(e) => handleUploadMappingExcel(e, 'X')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => fileInputXtoXIRef.current?.click()}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Hasil Pemetaan</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-3">
                    <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Bagi Rata Otomatis</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Sistem akan membagi rata {gradeXStudents.length} siswa kelas X ke 12 rombel kelas XI secara acak seimbang putra/putri.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={isProcessing || gradeXStudents.length === 0}
                        onClick={() => handleAutoShuffleBalance('X')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Bagi Rata ke Rombel XI</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step3Mode === 'fixed' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Formasi 1-ke-1 (X-1 ke XI-1, X-2 ke XI-2, dst)</p>
                <p className="mt-1">Dapat digunakan jika rombel kelas X tidak berpencar dan tetap sama di kelas XI.</p>
                <div className="pt-3">
                  <button
                    type="button"
                    disabled={isProcessing || gradeXStudents.length === 0}
                    onClick={async () => {
                      const confirmRun = window.confirm(`Apakah Anda yakin ingin menaikkan ${gradeXStudents.length} siswa kelas X ke XI dengan formasi tetap?`);
                      if (!confirmRun) return;
                      setIsProcessing(true);
                      try {
                        const targetIds = new Set(gradeXStudents.map((s) => s.id));
                        const year = schoolProfile.academicYear;
                        const updated = students.map((s) => {
                          if (targetIds.has(s.id)) {
                            const targetClassName = s.className.replace(/^X/i, 'XI');
                            const matchedClass = classesXI.find((c) => c.name.toLowerCase() === targetClassName.toLowerCase());
                            return {
                              ...s,
                              grade: 'XI' as const,
                              className: targetClassName,
                              classId: matchedClass?.id || s.classId,
                              classHistory: [...(s.classHistory || []), { grade: 'X' as const, className: s.className, academicYear: year }],
                            };
                          }
                          return s;
                        });
                        await onBatchUpdateStudents(updated);
                        showSuccess(`Berhasil menaikkan ${gradeXStudents.length} siswa kelas X ke kelas XI!`);
                      } catch (err: any) {
                        showError(err?.message || 'Error');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Terapkan Kenaikan Formasi Tetap (X ke XI)
                  </button>
                </div>
              </div>
            )}

            {step3Mode === 'manual' && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pindah Rombel Selektif (X ke XI)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">1. Pilih Kelas Asal (Jenjang X)</label>
                    <select
                      value={step3ManualSourceClass}
                      onChange={(e) => {
                        setStep3ManualSourceClass(e.target.value);
                        setStep3SelectedStudentIds([]);
                      }}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="">-- Pilih Kelas Asal --</option>
                      {classesX.map((c) => (
                        <option key={c.id} value={c.name}>Kelas {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">2. Pilih Kelas Tujuan (Jenjang XI)</label>
                    <select
                      value={step3ManualTargetClass}
                      onChange={(e) => setStep3ManualTargetClass(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="">-- Pilih Kelas Tujuan --</option>
                      {classesXI.map((c) => (
                        <option key={c.id} value={c.name}>Kelas {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {step3ManualSourceClass && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Daftar Siswa Kelas {step3ManualSourceClass}:</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const sourceList = gradeXStudents.filter((s) => s.className === step3ManualSourceClass);
                            setStep3SelectedStudentIds(sourceList.map((s) => s.id));
                          }}
                          className="text-purple-600 hover:underline cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setStep3SelectedStudentIds([])}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Batalkan Pilihan
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {gradeXStudents
                        .filter((s) => s.className === step3ManualSourceClass)
                        .map((s) => (
                          <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step3SelectedStudentIds.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) setStep3SelectedStudentIds((prev) => [...prev, s.id]);
                                else setStep3SelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                              }}
                              className="rounded-sm text-purple-600 focus:ring-purple-500"
                            />
                            <span className="truncate font-medium">{s.name} ({s.gender})</span>
                          </label>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-slate-600">{step3SelectedStudentIds.length} Siswa Terpilih</span>
                      <button
                        type="button"
                        disabled={isProcessing || step3SelectedStudentIds.length === 0 || !step3ManualTargetClass}
                        onClick={() => handleExecuteManualMove('X')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        Pindahkan Terpilih ke Kelas {step3ManualTargetClass || '...'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 4: PENERIMAAN SISWA BARU KELAS X */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-200">
                  4
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Tahap 4: Impor &amp; Penerimaan Siswa Baru Kelas X</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      Saat Ini: {gradeXStudents.length} Siswa
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Unggah daftar siswa baru angkatan kelas X langsung melalui berkas spreadsheet Excel (.xlsx).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadGradeXTemplate}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Format Excel Siswa X</span>
                </button>

                <input
                  type="file"
                  ref={fileInputNewGradeXRef}
                  accept=".xlsx, .xls"
                  onChange={handleUploadGradeXExcel}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputNewGradeXRef.current?.click()}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah Berkas Excel Siswa Baru</span>
                </button>
              </div>
            </div>

            {/* Petunjuk Format & Panduan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Kolom Utama Wajib</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  Pastikan terdapat kolom <strong>NISN</strong>, <strong>Nama Lengkap</strong>, dan <strong>Rombel Kelas X</strong> (misal: X-1, X-2, s.d. X-12).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>Kolom Opsional / Pelengkap</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  Kolom <strong>Jenis Kelamin (L/P)</strong>, <strong>No HP Siswa</strong>, <strong>No HP Orang Tua</strong>, dan <strong>Alamat Domisili</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  <span>Otomatisasi Sistem</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  Siswa yang diimpor otomatis berstatus <strong>Aktif</strong>, terhubung ke rombel kelas X, dan terdaftar pada tahun ajaran aktif <strong>{schoolProfile.academicYear}</strong>.
                </p>
              </div>
            </div>

            {/* Rombel Distribution Strip */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-600 block">Distribusi Siswa Kelas X Saat Ini (Total {gradeXStudents.length} Siswa):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {classesX.map((c) => {
                  const cnt = gradeXStudents.filter((s) => s.className === c.name).length;
                  return (
                    <div key={c.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                      <span className="text-[10px] text-slate-500 font-bold block">{c.name}</span>
                      <span className="text-xs font-black text-slate-800">{cnt} Siswa</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ARSIP ALUMNI & RETENSI 3 TAHUN */}
      {/* ========================================================= */}
      {activeTab === 'alumni' && (
        <div className="space-y-6">
          {/* Info Banner Retensi 3 Tahun */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950">
                  Kebijakan Retensi Data Alumni 3 Tahun Terjamin
                </h4>
                <p className="text-xs text-emerald-800/90 font-medium">
                  Data kelulusan kelas XII disimpan aman lengkap dengan catatan kedisiplinan dan pembinaan untuk verifikasi ijazah atau penerbitan Surat Rekam Jejak / SKBB.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportAlumniToExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Arsip Alumni (.xlsx)</span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari alumni berdasarkan Nama, NISN, atau Rombel..."
                  value={alumniSearch}
                  onChange={(e) => setAlumniSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedGraduationYear}
                  onChange={(e) => setSelectedGraduationYear(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-hidden"
                >
                  <option value="ALL">Semua Angkatan Kelulusan ({alumniStudents.length})</option>
                  {graduationYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Angkatan Lulus {yr} ({alumniStudents.filter((s) => s.graduationYear === yr).length} Siswa)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabel Alumni */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Profil &amp; Identitas Alumni</th>
                    <th className="py-3.5 px-4">Tahun Lulus</th>
                    <th className="py-3.5 px-4">Rombel Terakhir</th>
                    <th className="py-3.5 px-4 text-center">Catatan Pelanggaran</th>
                    <th className="py-3.5 px-4">Masa Retensi</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAlumni.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <span>Belum ada data alumni yang cocok dengan pencarian / filter.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredAlumni.map((alumni, idx) => {
                      const viols = disciplineRecords.filter((d) => d.studentId === alumni.id);
                      const points = viols.reduce((acc, curr) => acc + (curr.points || 0), 0);

                      return (
                        <tr key={alumni.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {alumni.photoUrl ? (
                                <img
                                  src={getGoogleDriveDirectImageUrl(alumni.photoUrl)}
                                  alt={alumni.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${alumni.gender === 'L' ? 'bg-sky-600' : 'bg-pink-600'}`}>
                                  {alumni.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-black text-slate-900 block">{alumni.name}</span>
                                <span className="text-[11px] text-slate-500 font-mono">NISN: {alumni.nisn} • {alumni.gender === 'L' ? 'L' : 'P'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                              Lulus {alumni.graduationYear || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            Kelas {alumni.className}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {viols.length === 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                Tertib (0 Kasus)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                {viols.length} Kasus {enablePointsSystem ? `(${points} Poin)` : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Arsip Aktif (Garansi 3 Thn)</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingAlumni(alumni)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Lihat Rekam Jejak 3 Tahun"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>Rekam Jejak</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrintingAlumniRecord(alumni)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Cetak Surat Rekam Jejak Disiplin"
                              >
                                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Cetak SKBB</span>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI KELULUSAN KELAS XII */}
      {/* ========================================================= */}
      {isGraduationConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Konfirmasi Kelulusan Kelas XII</h3>
              <p className="text-xs text-slate-500">
                Sebanyak <strong>{gradeXIIStudents.length} siswa kelas XII</strong> akan ditandai Lulus dan dipindahkan ke Arsip Alumni.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold">Keamanan Data Terjamin:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                <li>Siswa tidak akan dihapus, melainkan berstatus <strong>Lulus</strong>.</li>
                <li>Seluruh riwayat pelanggaran dan absensi selama 3 tahun tetap utuh.</li>
                <li>Mereka tidak lagi muncul di absensi harian kelas aktif.</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tahun Kelulusan / Angkatan:</label>
              <input
                type="text"
                value={graduationYearInput}
                onChange={(e) => setGraduationYearInput(e.target.value)}
                placeholder="Contoh: 2026/2027"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGraduationConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteGraduation}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                <span>Ya, Proses Kelulusan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL REKAM JEJAK 3 TAHUN ALUMNI */}
      {/* ========================================================= */}
      {viewingAlumni && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Rekam Jejak 3 Tahun Alumni</h3>
                  <p className="text-xs text-slate-500 font-medium">Data arsip tersimpan selama masa studi di SMAN 1 Batu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAlumni(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Profile Strip */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center gap-4">
                {viewingAlumni.photoUrl ? (
                  <img
                    src={getGoogleDriveDirectImageUrl(viewingAlumni.photoUrl)}
                    alt={viewingAlumni.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-lg text-white shrink-0 ${viewingAlumni.gender === 'L' ? 'bg-sky-600' : 'bg-pink-600'}`}>
                    {viewingAlumni.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5">
                  <span className="text-sm font-black text-slate-900 block">{viewingAlumni.name}</span>
                  <span className="text-xs text-slate-600 font-mono block">NISN: {viewingAlumni.nisn}</span>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">Lulusan {viewingAlumni.graduationYear || '-'}</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">Kelas Terakhir: {viewingAlumni.className}</span>
                  </div>
                </div>
              </div>

              {/* Riwayat Kelas yang Pernah Ditempuh */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Riwayat Jenjang Kelas</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Kelas X</span>
                    <span className="font-black text-slate-800">
                      {viewingAlumni.classHistory?.find((h) => h.grade === 'X')?.className || 'Terekam'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Kelas XI</span>
                    <span className="font-black text-slate-800">
                      {viewingAlumni.classHistory?.find((h) => h.grade === 'XI')?.className || 'Terekam'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Kelas XII</span>
                    <span className="font-black text-slate-800">{viewingAlumni.className}</span>
                  </div>
                </div>
              </div>

              {/* Detail Pelanggaran 3 Tahun */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Catatan Pelanggaran Kedisiplinan Selama 3 Tahun
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {disciplineRecords.filter((d) => d.studentId === viewingAlumni.id).length} Catatan Kejadian
                  </span>
                </div>

                {(() => {
                  const records = disciplineRecords.filter((d) => d.studentId === viewingAlumni.id);
                  if (records.length === 0) {
                    return (
                      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <span className="text-xs font-black text-emerald-950 block">Catatan Disiplin Bersih</span>
                        <p className="text-[11px] text-emerald-800">Siswa ini tidak memiliki riwayat pelanggaran tata tertib selama menempuh pendidikan.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {records.map((r) => (
                        <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">{r.violationName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                                Saat Kelas {r.className}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">
                              Tanggal: {formatDateIndonesian(r.date)} • Pelapor: {r.reportedBy}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-rose-600 block">{r.points} Poin</span>
                            <span className={`text-[10px] font-bold ${r.coachingStatus === 'Sudah' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              Pembinaan: {r.coachingStatus === 'Sudah' ? 'Selesai' : 'Belum'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewingAlumni(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = viewingAlumni;
                  setViewingAlumni(null);
                  setPrintingAlumniRecord(s);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekam Jejak / SKBB</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PRINT SKBB / SURAT KETERANGAN KELAKUAN BAIK */}
      {/* ========================================================= */}
      {printingAlumniRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 print:shadow-none print:border-none print:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <span className="text-sm font-black text-slate-900">Pratinjau Surat Rekam Jejak Disiplin Alumni</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingAlumniRecord(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* KOP SURAT */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                PEMERINTAH PROVINSI JAWA TIMUR<br />DINAS PENDIDIKAN
              </h2>
              <h3 className="text-lg font-black uppercase text-slate-900">{schoolProfile.name}</h3>
              <p className="text-xs text-slate-600 font-medium">
                {schoolProfile.address}, {schoolProfile.city}, {schoolProfile.province} • NPSN: {schoolProfile.npsn}
              </p>
            </div>

            {/* JUDUL SURAT */}
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black uppercase underline tracking-wider text-slate-900">
                SURAT KETERANGAN REKAM JEJAK KEDISIPLINAN ALUMNI
              </h4>
              <p className="text-xs font-mono text-slate-500">
                Nomor: 421.3 / SKBB / {new Date().getFullYear()} / SMAN1BATU
              </p>
            </div>

            {/* ISI SURAT */}
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
              <p>
                Kepala {schoolProfile.name} dengan ini menerangkan bahwa:
              </p>

              <div className="pl-6 space-y-1 font-medium">
                <div className="grid grid-cols-4">
                  <span className="font-bold">Nama Lengkap</span>
                  <span className="col-span-3">: <strong>{printingAlumniRecord.name}</strong></span>
                </div>
                <div className="grid grid-cols-4">
                  <span className="font-bold">NISN</span>
                  <span className="col-span-3">: {printingAlumniRecord.nisn}</span>
                </div>
                <div className="grid grid-cols-4">
                  <span className="font-bold">Jenis Kelamin</span>
                  <span className="col-span-3">: {printingAlumniRecord.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                </div>
                <div className="grid grid-cols-4">
                  <span className="font-bold">Tahun Kelulusan</span>
                  <span className="col-span-3">: Angkatan {printingAlumniRecord.graduationYear || schoolProfile.academicYear}</span>
                </div>
                <div className="grid grid-cols-4">
                  <span className="font-bold">Rombel Terakhir</span>
                  <span className="col-span-3">: Kelas {printingAlumniRecord.className}</span>
                </div>
              </div>

              {(() => {
                const viols = disciplineRecords.filter((d) => d.studentId === printingAlumniRecord.id);
                const pts = viols.reduce((acc, curr) => acc + (curr.points || 0), 0);

                if (viols.length === 0) {
                  return (
                    <p className="text-justify">
                      Berdasarkan catatan rekam jejak pada Sistem Informasi Kesiswaan dan Bimbingan Konseling (BK), 
                      yang bersangkutan selama menempuh pendidikan 3 tahun di {schoolProfile.name} <strong>BERKELAKUAN BAIK</strong> dan 
                      tidak pernah melakukan pelanggaran tata tertib sekolah yang berat.
                    </p>
                  );
                }

                return (
                  <div className="space-y-2">
                    <p className="text-justify">
                      Berdasarkan catatan rekam jejak pada Sistem Informasi Kesiswaan dan Bimbingan Konseling (BK), 
                      yang bersangkutan tercatat memiliki akumulasi disiplin sebanyak <strong>{viols.length} catatan kejadian</strong> ({pts} poin), 
                      dengan rincian pembinaan yang telah ditindaklanjuti secara tertib.
                    </p>
                  </div>
                );
              })()}

              <p>
                Demikian surat keterangan ini diterbitkan dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya 
                (keperluan pendaftaran perguruan tinggi, kedinasan, atau pekerjaan).
              </p>
            </div>

            {/* TANDA TANGAN */}
            <div className="pt-6 flex justify-between items-end text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px]">Dicetak resmi melalui:</span>
                <p className="font-bold text-slate-700">Sistem Informasi Dispos &amp; Absensi</p>
                <p className="text-[10px] text-slate-400 font-mono">Kode Arsip: RETENSI-3THN-{printingAlumniRecord.nisn}</p>
              </div>

              <div className="text-center space-y-16">
                <div>
                  <p>{schoolProfile.city}, {getTodayIndonesian()}</p>
                  <p className="font-bold text-slate-900">Kepala Sekolah,</p>
                </div>
                <div>
                  <p className="font-black text-slate-900 underline">{schoolProfile.principalName}</p>
                  <p className="text-slate-600 font-mono text-[11px]">NIP. {schoolProfile.principalNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PRATINJAU IMPOR SISWA BARU KELAS X */}
      {/* ========================================================= */}
      {isImportGradeXModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Konfirmasi &amp; Pratinjau Siswa Baru Kelas X
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Ditemukan <strong>{previewGradeXStudents.length} calon siswa</strong> dari berkas Excel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportGradeXModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Warnings if any */}
              {importGradeXWarnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Catatan Validasi Berkas:</span>
                  </span>
                  <ul className="list-disc pl-5 text-[11px] text-amber-700 max-h-24 overflow-y-auto space-y-0.5">
                    {importGradeXWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mode Selection */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-800 block">Metode Penyimpanan ke Sistem:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    importGradeXMode === 'append' ? 'bg-white border-emerald-500 shadow-xs' : 'bg-transparent border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importGradeXMode === 'append'}
                      onChange={() => setImportGradeXMode('append')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Tambahkan ke Data yang Ada</span>
                      <span className="text-[11px] text-slate-500">Siswa baru akan digabungkan dengan data siswa yang sudah ada saat ini.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    importGradeXMode === 'replace' ? 'bg-white border-rose-500 shadow-xs' : 'bg-transparent border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importGradeXMode === 'replace'}
                      onChange={() => setImportGradeXMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold text-rose-800 block">Timpa Siswa Kelas X Lama</span>
                      <span className="text-[11px] text-slate-500">Menghapus data kelas X aktif sebelumnya dan menggantikannya dengan siswa baru ini.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Quick Summary Counts */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-700 font-bold block">Total Siswa</span>
                  <span className="text-base font-black text-emerald-950">{previewGradeXStudents.length} Siswa</span>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/80">
                  <span className="text-[10px] text-sky-700 font-bold block">Laki-laki (L)</span>
                  <span className="text-base font-black text-sky-950">
                    {previewGradeXStudents.filter((s) => s.gender === 'L').length} Siswa
                  </span>
                </div>
                <div className="p-3 bg-pink-50 rounded-xl border border-pink-200/80">
                  <span className="text-[10px] text-pink-700 font-bold block">Perempuan (P)</span>
                  <span className="text-base font-black text-pink-950">
                    {previewGradeXStudents.filter((s) => s.gender === 'P').length} Siswi
                  </span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">Pratinjau Daftar Siswa Baru:</span>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-black uppercase text-[10px]">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">NISN</th>
                        <th className="py-2.5 px-3">Nama Lengkap</th>
                        <th className="py-2.5 px-3">Rombel</th>
                        <th className="py-2.5 px-3 text-center">L/P</th>
                        <th className="py-2.5 px-3">No HP Ortu</th>
                        <th className="py-2.5 px-3">Alamat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewGradeXStudents.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{s.nisn}</td>
                          <td className="py-2 px-3 font-black text-slate-900">{s.name}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">{s.className}</td>
                          <td className="py-2 px-3 text-center font-bold">{s.gender}</td>
                          <td className="py-2 px-3 text-slate-500">{s.parentPhone || '-'}</td>
                          <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">{s.address || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsImportGradeXModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || previewGradeXStudents.length === 0}
                onClick={handleConfirmImportGradeX}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Konfirmasi &amp; Simpan {previewGradeXStudents.length} Siswa Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
