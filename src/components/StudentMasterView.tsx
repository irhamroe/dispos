import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  CheckCircle2, 
  X, 
  GraduationCap, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  MapPin, 
  Camera, 
  Upload, 
  Trash2, 
  Edit3, 
  Eye, 
  User, 
  ExternalLink, 
  Sparkles, 
  Home, 
  AlertCircle, 
  RefreshCw, 
  Cloud, 
  Loader2,
  UserCheck
} from 'lucide-react';
import { Student, DisciplineRecord, AttendanceRecord, AdminUser, RoleMatrixMap } from '../types';
import { RombelClass } from '../data/initialData';
import { sortClasses, sortStudents } from '../utils/sortUtils';
import { checkActionPermission, initialRoleMatrix } from '../data/roleMatrixData';
import { 
  uploadFileToGoogleDrive, 
  isGoogleDriveConfigured, 
  getGoogleDriveDirectImageUrl, 
  getGoogleDriveViewUrl, 
  extractGoogleDriveFileId 
} from '../services/googleDriveService';
import { GoogleDriveConfigModal } from './GoogleDriveConfigModal';

interface StudentMasterViewProps {
  students: Student[];
  classes: RombelClass[];
  disciplineRecords: DisciplineRecord[];
  attendanceRecords: AttendanceRecord[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onResetToDefaultStudents?: () => Promise<void> | void;
  initialClassFilter?: string;
  enablePointsSystem?: boolean;
  currentUser?: AdminUser | null;
  roleMatrix?: RoleMatrixMap;
}

export const StudentMasterView: React.FC<StudentMasterViewProps> = ({
  students,
  classes,
  disciplineRecords,
  attendanceRecords,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onResetToDefaultStudents,
  initialClassFilter,
  enablePointsSystem = true,
  currentUser,
  roleMatrix = initialRoleMatrix,
}) => {
  const canManageStudents = checkActionPermission(currentUser?.role, 'students_manage', roleMatrix);
  const isWaliKelas = currentUser?.role === 'Wali Kelas';
  const assignedClass = currentUser?.assignedClass;

  const isHomeroomStudent = (s: Student) => {
    if (isWaliKelas && assignedClass) {
      return s.className === assignedClass;
    }
    return false;
  };

  const canEditStudent = (s: Student) => {
    return canManageStudents || isHomeroomStudent(s);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedClass, setSelectedClass] = useState(() => {
    if (initialClassFilter) return initialClassFilter;
    if (currentUser?.role === 'Wali Kelas' && currentUser?.assignedClass) {
      return currentUser.assignedClass;
    }
    return 'ALL';
  });
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>(() => {
    const targetClass = initialClassFilter || (currentUser?.role === 'Wali Kelas' ? currentUser?.assignedClass : undefined);
    if (targetClass && targetClass !== 'ALL') {
      const found = classes.find((c) => c.name === targetClass);
      if (found) return found.grade;
    }
    return 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [photoFilter, setPhotoFilter] = useState<'ALL' | 'WITH_PHOTO' | 'NO_PHOTO'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; name: string } | null>(null);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [uploadingNewPhoto, setUploadingNewPhoto] = useState(false);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);

  // Sync if initialClassFilter prop changes
  React.useEffect(() => {
    if (initialClassFilter) {
      setSelectedClass(initialClassFilter);
      const found = classes.find((c) => c.name === initialClassFilter);
      if (found) setSelectedGrade(found.grade);
    }
  }, [initialClassFilter, classes]);

  // Pagination state (36 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 36;

  // New Student form state
  const [newNisn, setNewNisn] = useState('');
  const [newName, setNewName] = useState('');
  const [newClassId, setNewClassId] = useState(classes[0]?.id || 'c-x-1');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');
  const [newPhone, setNewPhone] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');

  // Edit Student form state
  const [editNisn, setEditNisn] = useState('');
  const [editName, setEditName] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editGender, setEditGender] = useState<'L' | 'P'>('L');
  const [editPhone, setEditPhone] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [editPhotoInputMode, setEditPhotoInputMode] = useState<'upload' | 'url'>('upload');

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const availableClasses = useMemo(() => {
    const list = selectedGrade === 'ALL' ? classes : classes.filter((c) => c.grade === selectedGrade);
    return sortClasses(list);
  }, [classes, selectedGrade]);

  // Handle file upload for new student (Google Drive supported)
  const handleAddFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5 MB.');
      return;
    }

    if (isGoogleDriveConfigured()) {
      setUploadingNewPhoto(true);
      try {
        const chosenClass = classes.find((c) => c.id === newClassId);
        const res = await uploadFileToGoogleDrive(file, 'student_photo', {
          studentName: newName.trim() || 'SISWA',
          nisn: newNisn.trim() || 'NIS',
          className: chosenClass?.name || '',
        });
        if (res.success && (res.directUrl || res.fileUrl)) {
          setNewPhotoUrl(res.directUrl || res.fileUrl);
        } else {
          console.warn('Google Drive upload response issue, falling back to Base64:', res.error);
          alert('Peringatan: Gagal mengunggah ke Google Drive (' + (res.error || 'Terjadi kesalahan') + '). Foto dialihkan tersimpan secara lokal.');
          const reader = new FileReader();
          reader.onloadend = () => setNewPhotoUrl(reader.result as string);
          reader.readAsDataURL(file);
        }
      } catch (err: any) {
        console.error('Error upload foto siswa ke Google Drive:', err);
        alert('Gagal mengunggah ke Google Drive: ' + (err?.message || 'Error') + '. Menggunakan penyimpanan lokal.');
        const reader = new FileReader();
        reader.onloadend = () => setNewPhotoUrl(reader.result as string);
        reader.readAsDataURL(file);
      } finally {
        setUploadingNewPhoto(false);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload for edit student (Google Drive supported)
  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5 MB.');
      return;
    }

    if (isGoogleDriveConfigured()) {
      setUploadingEditPhoto(true);
      try {
        const chosenClass = classes.find((c) => c.id === editClassId);
        const res = await uploadFileToGoogleDrive(file, 'student_photo', {
          studentName: editName.trim() || 'SISWA',
          nisn: editNisn.trim() || 'NIS',
          className: chosenClass?.name || '',
        });
        if (res.success && (res.directUrl || res.fileUrl)) {
          setEditPhotoUrl(res.directUrl || res.fileUrl);
        } else {
          console.warn('Google Drive upload response issue, falling back to Base64:', res.error);
          alert('Peringatan: Gagal mengunggah ke Google Drive (' + (res.error || 'Terjadi kesalahan') + '). Foto dialihkan tersimpan secara lokal.');
          const reader = new FileReader();
          reader.onloadend = () => setEditPhotoUrl(reader.result as string);
          reader.readAsDataURL(file);
        }
      } catch (err: any) {
        console.error('Error upload foto siswa ke Google Drive:', err);
        alert('Gagal mengunggah ke Google Drive: ' + (err?.message || 'Error') + '. Menggunakan penyimpanan lokal.');
        const reader = new FileReader();
        reader.onloadend = () => setEditPhotoUrl(reader.result as string);
        reader.readAsDataURL(file);
      } finally {
        setUploadingEditPhoto(false);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenClass = classes.find((c) => c.id === newClassId);
    const grade = (chosenClass?.grade || 'X') as 'X' | 'XI' | 'XII';

    const newStudent: Student = {
      id: `s-${Date.now()}`,
      nisn: newNisn.trim(),
      name: newName.trim(),
      classId: newClassId,
      className: chosenClass?.name || 'X-1',
      grade,
      gender: newGender,
      phone: newPhone.trim() || undefined,
      parentPhone: newParentPhone.trim() || undefined,
      address: newAddress.trim() || undefined,
      photoUrl: newPhotoUrl.trim() || undefined,
      status: 'Aktif',
    };

    onAddStudent(newStudent);
    setIsAddModalOpen(false);
    setNewNisn('');
    setNewName('');
    setNewPhone('');
    setNewParentPhone('');
    setNewAddress('');
    setNewPhotoUrl('');
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  // Open edit modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditNisn(student.nisn);
    setEditName(student.name);
    setEditClassId(student.classId);
    setEditGender(student.gender);
    setEditPhone(student.phone || '');
    setEditParentPhone(student.parentPhone || '');
    setEditAddress(student.address || '');
    setEditPhotoUrl(student.photoUrl || '');
    setEditStatus(student.status);
    setEditPhotoInputMode('upload');
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const chosenClass = classes.find((c) => c.id === editClassId);
    const grade = (chosenClass?.grade || editingStudent.grade) as 'X' | 'XI' | 'XII';

    const updatedStudent: Student = {
      ...editingStudent,
      nisn: editNisn.trim(),
      name: editName.trim(),
      classId: editClassId,
      className: chosenClass?.name || editingStudent.className,
      grade,
      gender: editGender,
      phone: editPhone.trim() || undefined,
      parentPhone: editParentPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
      photoUrl: editPhotoUrl.trim() || undefined,
      status: editStatus,
    };

    if (onUpdateStudent) {
      onUpdateStudent(updatedStudent);
    }
    setEditingStudent(null);
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data siswa "${student.name}" (NISN: ${student.nisn}) dari rombel ${student.className}? Data yang dihapus tidak dapat dikembalikan.`)) {
      if (onDeleteStudent) {
        onDeleteStudent(student.id);
      }
    }
  };

  // Filter students based on grade, class, search, and photo status
  const filteredStudents = useMemo(() => {
    const list = students.filter((s) => {
      const matchGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;
      const matchClass = selectedClass === 'ALL' || s.className === selectedClass;
      
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.parentPhone && s.parentPhone.includes(q));

      const matchPhoto = 
        photoFilter === 'ALL' ||
        (photoFilter === 'WITH_PHOTO' && !!s.photoUrl) ||
        (photoFilter === 'NO_PHOTO' && !s.photoUrl);

      return matchGrade && matchClass && matchSearch && matchPhoto;
    });
    return sortStudents(list);
  }, [students, selectedGrade, selectedClass, searchQuery, photoFilter]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const withPhoto = students.filter((s) => !!s.photoUrl).length;
    const withAddress = students.filter((s) => !!s.address).length;
    const active = students.filter((s) => s.status === 'Aktif').length;
    return { total, withPhoto, withAddress, active };
  }, [students]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Claymorphism */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-sm border border-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#9333EA] text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight" >
                Data Siswa &amp; 36 Rombel
              </h2>
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-sky-100 text-[#0284C7] shadow-xs" >
                Total {students.length} Siswa
              </span>
            </div>
            <p className="text-sm text-[#334155] mt-1 font-medium">
              Kelola direktori siswa kelas X-1 s/d X-12, XI-1 s/d XI-12, dan XII-1 s/d XII-12 lengkap dengan foto profil &amp; alamat domisili.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {canManageStudents ? (
            <button
              type="button"
              id="add-student-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#9333EA] hover:to-[#6D28D9] text-white font-extrabold text-xs transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Siswa Baru</span>
            </button>
          ) : isWaliKelas && assignedClass ? (
            <div className="px-4 py-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-[#0284C7] font-bold text-xs flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mode Wali Kelas (Hak Edit Siswa {assignedClass})</span>
            </div>
          ) : (
            <span className="px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Akses Kelola Siswa Dibatasi (Mode Lihat)</span>
            </span>
          )}
        </div>
      </div>

      {/* Wali Kelas Special Guidance Banner */}
      {isWaliKelas && assignedClass && (
        <div className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-[#E0F2FE] via-[#BAE6FD]/40 to-white border border-[#0284C7]/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#0F172A]">
                  Akses Kelola Siswa Rombel {assignedClass}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  Wali Kelas Aktif
                </span>
              </div>
              <p className="text-xs text-[#334155] mt-0.5 leading-relaxed">
                Anda dapat mengedit dan melengkapi data seluruh siswa di rombel <strong>{assignedClass}</strong> (NISN, Nama, Kontak Siswa/Ortu, Alamat Domisili, dan Foto Profil).
              </p>
            </div>
          </div>
          {selectedClass !== assignedClass && (
            <button
              type="button"
              onClick={() => {
                setSelectedClass(assignedClass);
                const found = classes.find((c) => c.name === assignedClass);
                if (found) setSelectedGrade(found.grade);
              }}
              className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              Fokuskan ke Kelas {assignedClass}
            </button>
          )}
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/60 p-4 shadow-xs border border-[#7DD3FC]/70 hover:-translate-y-1 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#0369A1] uppercase tracking-wider">Total Siswa</span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-[#0369A1] mt-1 tracking-tight">{stats.total}</div>
          <div className="text-[10px] text-[#0369A1]/80 font-bold mt-0.5">36 Rombel Terdaftar</div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#FAF5FF] via-[#F3E8FF] to-[#DDD6FE]/60 p-4 shadow-xs border border-[#DDD6FE]/70 hover:-translate-y-1 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#6D28D9] uppercase tracking-wider">Foto Profil Siswa</span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-[#6D28D9] mt-1 tracking-tight">{stats.withPhoto}</div>
          <div className="text-[10px] text-[#6D28D9]/80 font-medium mt-0.5">
            {stats.total > 0 ? Math.round((stats.withPhoto / stats.total) * 100) : 0}% terisi foto
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/60 p-4 shadow-xs border border-[#FCD34D]/70 hover:-translate-y-1 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#B45309] uppercase tracking-wider">Alamat Domisili</span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-[#B45309] mt-1 tracking-tight">{stats.withAddress}</div>
          <div className="text-[10px] text-[#B45309]/80 font-medium mt-0.5">
            {stats.total > 0 ? Math.round((stats.withAddress / stats.total) * 100) : 0}% terdata alamat
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]/60 p-4 shadow-xs border border-[#6EE7B7]/70 hover:-translate-y-1 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#047857] uppercase tracking-wider">Siswa Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-[#047857] mt-1 tracking-tight">{stats.active}</div>
          <div className="text-[10px] text-[#047857] font-bold mt-0.5">Status Akademik Aktif</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[32px] bg-white/80 backdrop-blur-xl shadow-sm border border-white/60 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#334155]" />
            <input
              id="search-master-student"
              type="text"
              placeholder="Cari nama, NISN, atau alamat..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-[#E2F1FD] rounded-2xl text-xs text-[#0F172A] placeholder-[#334155] shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 transition-all font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Grade Filter */}
            <div className="flex bg-[#E2F1FD] p-1.5 rounded-2xl shadow-none text-xs gap-1 font-bold">
              {(['ALL', 'X', 'XI', 'XII'] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => {
                    setSelectedGrade(grade);
                    setSelectedClass('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                    selectedGrade === grade
                      ? 'bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] text-white shadow-xs -translate-y-0.5'
                      : 'text-[#334155] hover:text-[#0F172A]'
                  }`}
                  
                >
                  {grade === 'ALL' ? 'Semua' : `Kelas ${grade}`}
                </button>
              ))}
            </div>

            {/* Rombel Select */}
            <div className="flex items-center gap-2 bg-[#E2F1FD] rounded-2xl px-4 py-2.5 text-xs shadow-none">
              <Layers className="w-4 h-4 text-[#0284C7] shrink-0" />
              <select
                id="master-class-filter"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-extrabold text-[#0F172A] focus:outline-hidden cursor-pointer"
                
              >
                <option value="ALL">Semua Rombel ({filteredStudents.length} Siswa)</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.name}>
                    Rombel {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Filter */}
            <div className="flex items-center gap-2 bg-[#E2F1FD] rounded-2xl px-4 py-2.5 text-xs shadow-none">
              <Camera className="w-4 h-4 text-[#0284C7] shrink-0" />
              <select
                value={photoFilter}
                onChange={(e) => {
                  setPhotoFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-[#0F172A] focus:outline-hidden cursor-pointer"
                
              >
                <option value="ALL">Semua Foto</option>
                <option value="WITH_PHOTO">Ada Foto</option>
                <option value="NO_PHOTO">Belum Ada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Table with Photo and Address Columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/80 to-purple-50/50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-[#334155]" >
                <th className="py-4 px-4 w-12 text-center">No</th>
                <th className="py-4 px-5 min-w-[220px]">Profil &amp; Identitas Siswa</th>
                <th className="py-4 px-4 text-center min-w-[90px] w-24">Kelas</th>
                <th className="py-4 px-5 min-w-[160px]">Kontak (Siswa / Ortu)</th>
                <th className="py-4 px-5 min-w-[180px]">Alamat Domisili</th>
                <th className="py-4 px-4 text-center w-24">Status</th>
                <th className="py-4 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#334155]">
                    <div className="w-16 h-16 rounded-full bg-[#E2F1FD] text-[#334155] flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <span className="font-bold">Tidak ditemukan data siswa sesuai kriteria filter.</span>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={s.id} className="hover:bg-sky-50/30 transition-colors">
                      {/* No */}
                      <td className="py-4 px-4 text-center text-[#334155] font-bold">
                        {globalIdx}
                      </td>

                      {/* Profil & Identitas Siswa */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          {/* Foto Avatar */}
                          <div className="shrink-0">
                            {s.photoUrl ? (
                              <button
                                type="button"
                                onClick={() => setZoomedPhoto({ url: s.photoUrl!, name: s.name })}
                                className="relative group cursor-pointer block"
                                title="Klik untuk memperbesar foto"
                              >
                                <img
                                  src={getGoogleDriveDirectImageUrl(s.photoUrl)}
                                  alt={s.name}
                                  className="w-11 h-11 rounded-2xl object-cover border border-white/80 shadow-xs group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (s.photoUrl && target.src !== s.photoUrl) {
                                      target.src = s.photoUrl;
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-[#0F172A]/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ) : (
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs ${
                                  s.gender === 'L'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-pink-100 text-pink-800'
                                }`}
                                title="Belum ada foto profil"
                                
                              >
                                {s.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Nama & Info Detail */}
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-[#0F172A] text-sm truncate leading-tight" >
                              {s.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#334155] font-mono">
                              <span>NISN: {s.nisn}</span>
                              <span>•</span>
                              <span
                                className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                                  s.gender === 'L'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-pink-100 text-pink-800'
                                }`}
                              >
                                {s.gender === 'L' ? 'L' : 'P'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-black bg-sky-50 text-[#0284C7] border border-sky-200 shadow-xs whitespace-nowrap min-w-[58px]" >
                          {s.className}
                        </span>
                      </td>

                      {/* Kontak */}
                      <td className="py-3 px-5 text-[#334155]">
                        <div className="space-y-0.5">
                          {s.phone ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-bold text-[#0F172A]">{s.phone}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">No HP -</div>
                          )}
                          {s.parentPhone && (
                            <div className="text-[11px] text-[#334155] flex items-center gap-1 font-mono">
                              <span className="text-slate-400">Ortu:</span>
                              <span>{s.parentPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Alamat Domisili */}
                      <td className="py-3 px-5 text-[#334155]">
                        {s.address ? (
                          <div className="flex items-start gap-1.5 text-xs leading-tight" title={s.address}>
                            <MapPin className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{s.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs" >
                          {s.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingStudent(s)}
                            className="p-2 rounded-xl bg-white hover:bg-sky-50 text-[#334155] hover:text-[#0284C7] shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                            title="Lihat Detail Profil Siswa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEditStudent(s) && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(s)}
                              className="p-2 rounded-xl bg-white hover:bg-amber-50 text-[#334155] hover:text-amber-700 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                              title={isHomeroomStudent(s) ? `Lengkapi & Edit Data Siswa Binaan (${s.className})` : 'Edit Data Siswa'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canManageStudents && onDeleteStudent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(s)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                              title="Hapus Data Siswa"
                            >
                              <Trash2 className="w-4 h-4" />
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
          <div className="p-5 bg-[#E2F1FD]/40 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <div className="text-[#334155] font-medium">
              Menampilkan {paginatedStudents.length} dari total {filteredStudents.length} siswa
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="master-prev-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white shadow-xs disabled:opacity-40 hover:bg-slate-50 text-[#0F172A] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-black text-[#0F172A] px-2" >
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                id="master-next-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white shadow-xs disabled:opacity-40 hover:bg-slate-50 text-[#0F172A] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH SISWA BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-lg w-full border border-white/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[calc(100vh-2rem)] flex flex-col my-auto">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-[#0284C7] to-[#9333EA] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base" >Tambah Data Siswa Baru</h3>
                  <p className="text-xs text-purple-100">SMAN 1 Batu • Lengkap dengan Foto &amp; Alamat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 sm:p-8 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* NISN & NAMA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    NISN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0091234567"
                    value={newNisn}
                    onChange={(e) => setNewNisn(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-mono font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama siswa..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20"
                  />
                </div>
              </div>

              {/* ROMBEL & GENDER */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    Pilih Rombel (36 Rombel) *
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-extrabold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 cursor-pointer"
                    
                  >
                    {sortClasses(classes).map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    Jenis Kelamin *
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-extrabold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 cursor-pointer"
                    
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {/* ALAMAT SISWA */}
              <div>
                <label className="block font-black text-[#0F172A] mb-1.5 flex items-center gap-1.5" >
                  <MapPin className="w-4 h-4 text-[#0284C7]" />
                  <span>Alamat Lengkap Domisili Siswa</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Jl. Panglima Sudirman No. 45 RT 03/RW 02, Kel. Sisir, Kec. Batu, Kota Batu"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-medium shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20 leading-relaxed"
                />
              </div>

              {/* TELEPON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    No. Telepon / WhatsApp Siswa
                  </label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-medium shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    No. Telepon Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-medium shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20"
                  />
                </div>
              </div>

              {/* BAGIAN FOTO SISWA */}
              <div className="p-5 bg-[#E2F1FD] rounded-2xl shadow-none space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-black text-[#0F172A] flex items-center gap-2" >
                    <Camera className="w-5 h-5 text-[#0284C7]" />
                    <span>Foto Profil Siswa (Opsional)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs text-xs">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('upload')}
                      className={`px-3 py-1 rounded-lg font-black transition-colors cursor-pointer ${
                        photoInputMode === 'upload' ? 'bg-[#0284C7] text-white' : 'text-[#334155]'
                      }`}
                      
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('url')}
                      className={`px-3 py-1 rounded-lg font-black transition-colors cursor-pointer ${
                        photoInputMode === 'url' ? 'bg-[#0284C7] text-white' : 'text-[#334155]'
                      }`}
                      
                    >
                      Tautan URL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {uploadingNewPhoto ? (
                      <div className="w-18 h-18 rounded-2xl border-2 border-dashed border-[#0284C7] bg-sky-50 flex flex-col items-center justify-center text-[#0284C7] animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] mt-1 font-black">Upload...</span>
                      </div>
                    ) : newPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={getGoogleDriveDirectImageUrl(newPhotoUrl)}
                          alt="Pratinjau Foto Siswa"
                          className="w-18 h-18 rounded-2xl object-cover border-2 border-[#0284C7] shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewPhotoUrl('');
                            if (addFileInputRef.current) addFileInputRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 cursor-pointer"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-18 h-18 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6 text-slate-300" />
                        <span className="text-[10px] mt-0.5 font-bold">Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {photoInputMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={addFileInputRef}
                          accept="image/*"
                          disabled={uploadingNewPhoto}
                          onChange={handleAddFileUpload}
                          className="hidden"
                          id="add-student-photo-file"
                        />
                        <label
                          htmlFor="add-student-photo-file"
                          className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0F172A] rounded-2xl font-black text-xs cursor-pointer shadow-xs active:scale-[0.92] ${
                            uploadingNewPhoto ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          
                        >
                          {uploadingNewPhoto ? (
                            <Loader2 className="w-4 h-4 text-[#0284C7] animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 text-[#0284C7]" />
                          )}
                          <span>{uploadingNewPhoto ? 'Sedang mengunggah...' : 'Pilih Foto dari Perangkat'}</span>
                        </label>
                        <p className="text-[11px] text-[#334155] mt-1.5 font-medium">
                          Format JPG, PNG, WEBP (maks. 5 MB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/foto-siswa.jpg"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white rounded-2xl text-[#0F172A] text-xs shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]"
                        />
                        <p className="text-[11px] text-[#334155] mt-1.5 font-medium">
                          Masukkan tautan gambar langsung dari web atau Google Drive
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-[#E2F1FD] hover:bg-white text-[#334155] font-black transition-all shadow-xs active:scale-[0.92] cursor-pointer"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="save-new-student-btn"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#9333EA] hover:to-[#6D28D9] text-white font-black transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer"
                  
                >
                  Simpan Siswa Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA SISWA */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-lg w-full border border-white/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[calc(100vh-2rem)] flex flex-col my-auto">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-xs">
                  <Edit3 className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-base flex items-center gap-2" >
                    <span>Edit Data &amp; Foto Siswa</span>
                    {isHomeroomStudent(editingStudent) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950">
                        Rombel {editingStudent.className}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300">NISN: {editingStudent.nisn} • {editingStudent.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="p-6 sm:p-8 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    NISN *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-mono font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#0284C7]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    Kelas / Rombel *
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-extrabold shadow-none focus:outline-hidden focus:bg-white cursor-pointer"
                    
                  >
                    {sortClasses(classes).map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    Jenis Kelamin *
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as 'L' | 'P')}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-extrabold shadow-none focus:outline-hidden focus:bg-white cursor-pointer"
                    
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-[#0F172A] mb-1.5 flex items-center gap-1.5" >
                  <MapPin className="w-4 h-4 text-[#0284C7]" />
                  <span>Alamat Lengkap Domisili</span>
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-medium shadow-none focus:outline-hidden focus:bg-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    No. Telepon Siswa
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] shadow-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#0F172A] mb-1.5" >
                    No. Telepon Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] shadow-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-[#0F172A] mb-1.5" >
                  Status Siswa
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                  className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl text-[#0F172A] font-extrabold shadow-none focus:bg-white cursor-pointer"
                  
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* FOTO EDIT */}
              <div className="p-5 bg-[#E2F1FD] rounded-2xl shadow-none space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-black text-[#0F172A] flex items-center gap-2" >
                    <Camera className="w-5 h-5 text-[#0284C7]" />
                    <span>Foto Profil Siswa</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs text-xs">
                    <button
                      type="button"
                      onClick={() => setEditPhotoInputMode('upload')}
                      className={`px-3 py-1 rounded-lg font-black transition-colors cursor-pointer ${
                        editPhotoInputMode === 'upload' ? 'bg-[#0284C7] text-white' : 'text-[#334155]'
                      }`}
                      
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPhotoInputMode('url')}
                      className={`px-3 py-1 rounded-lg font-black transition-colors cursor-pointer ${
                        editPhotoInputMode === 'url' ? 'bg-[#0284C7] text-white' : 'text-[#334155]'
                      }`}
                      
                    >
                      Tautan URL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {uploadingEditPhoto ? (
                      <div className="w-18 h-18 rounded-2xl border-2 border-dashed border-[#0284C7] bg-sky-50 flex flex-col items-center justify-center text-[#0284C7] animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] mt-1 font-black">Upload...</span>
                      </div>
                    ) : editPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={getGoogleDriveDirectImageUrl(editPhotoUrl)}
                          alt="Pratinjau Foto Siswa"
                          className="w-18 h-18 rounded-2xl object-cover border-2 border-[#0284C7] shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhotoUrl('');
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 cursor-pointer"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-18 h-18 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6 text-slate-300" />
                        <span className="text-[10px] mt-0.5 font-bold">Belum Ada</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {editPhotoInputMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={editFileInputRef}
                          accept="image/*"
                          disabled={uploadingEditPhoto}
                          onChange={handleEditFileUpload}
                          className="hidden"
                          id="edit-student-photo-file"
                        />
                        <label
                          htmlFor="edit-student-photo-file"
                          className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0F172A] rounded-2xl font-black text-xs cursor-pointer shadow-xs active:scale-[0.92] ${
                            uploadingEditPhoto ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          
                        >
                          {uploadingEditPhoto ? (
                            <Loader2 className="w-4 h-4 text-[#0284C7] animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 text-[#0284C7]" />
                          )}
                          <span>{uploadingEditPhoto ? 'Sedang mengunggah...' : 'Pilih / Ganti Foto'}</span>
                        </label>
                        <p className="text-[11px] text-[#334155] mt-1.5 font-medium">
                          Format JPG, PNG, WEBP (maks. 5 MB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/foto-siswa.jpg"
                          value={editPhotoUrl}
                          onChange={(e) => setEditPhotoUrl(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white rounded-2xl text-[#0F172A] text-xs shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]"
                        />
                        <p className="text-[11px] text-[#334155] mt-1.5 font-medium">
                          Masukkan URL foto profil siswa
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-5 py-2.5 rounded-2xl bg-[#E2F1FD] hover:bg-white text-[#334155] font-black transition-all shadow-xs active:scale-[0.92] cursor-pointer"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#9333EA] hover:to-[#6D28D9] text-white font-black transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none cursor-pointer"
                  
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL / KARTU PROFIL SISWA */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-md w-full border border-white/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[calc(100vh-2rem)] flex flex-col my-auto">
            <div className="bg-gradient-to-br from-[#0284C7] via-[#9333EA] to-[#6D28D9] p-5 sm:p-6 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                {viewingStudent.photoUrl ? (
                  <img
                    src={getGoogleDriveDirectImageUrl(viewingStudent.photoUrl)}
                    alt={viewingStudent.name}
                    onClick={() => setZoomedPhoto({ url: viewingStudent.photoUrl!, name: viewingStudent.name })}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/80 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                    title="Klik untuk melihat foto besar"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-2xl border-2 border-white/60 flex items-center justify-center font-black text-2xl shadow-xs ${
                      viewingStudent.gender === 'L' ? 'bg-sky-600 text-white' : 'bg-pink-600 text-white'
                    }`}
                    
                  >
                    {viewingStudent.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-white/20 text-white shadow-xs" >
                    Kelas {viewingStudent.className} • {viewingStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                  <h3 className="font-black text-lg leading-tight mt-1.5" >{viewingStudent.name}</h3>
                  <p className="font-mono text-xs text-purple-200 mt-0.5">NISN: {viewingStudent.nisn}</p>
                  {extractGoogleDriveFileId(viewingStudent.photoUrl) && (
                    <a
                      href={getGoogleDriveViewUrl(viewingStudent.photoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-purple-200 hover:text-white underline mt-1.5 font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Foto di Google Drive</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Alamat Domisili */}
              <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none space-y-1">
                <span className="text-[10px] font-black text-[#334155] uppercase tracking-wider flex items-center gap-1.5" >
                  <MapPin className="w-4 h-4 text-[#0284C7]" />
                  <span>Alamat Domisili / Tempat Tinggal</span>
                </span>
                <p className="text-[#0F172A] font-bold leading-relaxed text-xs">
                  {viewingStudent.address || 'Belum ada data alamat domisili yang terdaftar.'}
                </p>
              </div>

              {/* Kontak */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none">
                  <span className="text-[10px] font-black text-[#334155] uppercase block mb-1" >
                    Kontak Siswa
                  </span>
                  <span className="font-extrabold text-[#0F172A] text-xs">
                    {viewingStudent.phone || '-'}
                  </span>
                </div>
                <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none">
                  <span className="text-[10px] font-black text-[#334155] uppercase block mb-1" >
                    Kontak Orang Tua
                  </span>
                  <span className="font-extrabold text-[#0F172A] text-xs">
                    {viewingStudent.parentPhone || '-'}
                  </span>
                </div>
              </div>

              {/* Disiplin & Akademik */}
              {(() => {
                const viols = disciplineRecords.filter((d) => d.studentId === viewingStudent.id);
                const pts = viols.reduce((acc, curr) => acc + (curr.points || 0), 0);
                return (
                  <div className="p-4 bg-[#E2F1FD] rounded-2xl shadow-none flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#334155] uppercase block" >
                        Akumulasi Disiplin
                      </span>
                      <span className="font-extrabold text-[#0F172A] text-xs">{viols.length} Catatan Kejadian</span>
                    </div>
                    {enablePointsSystem ? (
                      <span
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs ${
                          pts > 25
                            ? 'bg-rose-100 text-rose-800'
                            : pts > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                        
                      >
                        {pts} Poin
                      </span>
                    ) : (
                      <span
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs ${
                          viols.length > 2
                            ? 'bg-rose-100 text-rose-800'
                            : viols.length > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                        
                      >
                        {viols.length === 0 ? 'Tertib' : `${viols.length} Kasus`}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Action */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const s = viewingStudent;
                    setViewingStudent(null);
                    handleOpenEdit(s);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-black text-xs flex items-center gap-2 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                  
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Data &amp; Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZOOM FOTO SISWA */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="bg-white/95 backdrop-blur-2xl p-4 rounded-[32px] max-w-sm w-full shadow-sm border border-white/60 space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={getGoogleDriveDirectImageUrl(zoomedPhoto.url)}
                alt={zoomedPhoto.name}
                className="w-full h-80 object-cover rounded-[28px] border border-slate-200 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 flex items-center justify-center cursor-pointer shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-2 pb-2 text-center space-y-1">
              <div className="font-black text-base text-[#0F172A]" >{zoomedPhoto.name}</div>
              <div className="text-xs text-[#334155] font-medium">Foto Profil Resmi Siswa SMAN 1 Batu</div>
              {extractGoogleDriveFileId(zoomedPhoto.url) && (
                <div className="pt-2">
                  <a
                    href={getGoogleDriveViewUrl(zoomedPhoto.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-[#0284C7] rounded-2xl text-xs font-black transition-all border border-sky-200 shadow-xs"
                    
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Buka File Asli di Google Drive</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Configuration Modal */}
      <GoogleDriveConfigModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
      />
    </div>
  );
};
