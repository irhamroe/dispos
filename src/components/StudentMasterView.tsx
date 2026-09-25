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
  AlertCircle
} from 'lucide-react';
import { Student, DisciplineRecord, AttendanceRecord } from '../types';
import { RombelClass } from '../data/initialData';

interface StudentMasterViewProps {
  students: Student[];
  classes: RombelClass[];
  disciplineRecords: DisciplineRecord[];
  attendanceRecords: AttendanceRecord[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  initialClassFilter?: string;
}

export const StudentMasterView: React.FC<StudentMasterViewProps> = ({
  students,
  classes,
  disciplineRecords,
  attendanceRecords,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  initialClassFilter,
}) => {
  const [selectedClass, setSelectedClass] = useState(initialClassFilter || 'ALL');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>(() => {
    if (initialClassFilter && initialClassFilter !== 'ALL') {
      const found = classes.find((c) => c.name === initialClassFilter);
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

  // Sync if initialClassFilter prop changes
  React.useEffect(() => {
    if (initialClassFilter) {
      setSelectedClass(initialClassFilter);
      const found = classes.find((c) => c.name === initialClassFilter);
      if (found) setSelectedGrade(found.grade);
    }
  }, [initialClassFilter, classes]);

  // Pagination state (36 per page for high performance)
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
    if (selectedGrade === 'ALL') return classes;
    return classes.filter((c) => c.grade === selectedGrade);
  }, [classes, selectedGrade]);

  // Handle file upload for new student
  const handleAddFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 3 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload for edit student
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 3 MB.');
        return;
      }
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
    // Reset form
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
    return students.filter((s) => {
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
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Data Siswa & 36 Rombel SMAN 1 Batu
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              Total {students.length} Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola direktori siswa kelas X-1 s/d X-12, XI-1 s/d XI-12, dan XII-1 s/d XII-12 lengkap dengan foto profil & alamat domisili.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="add-student-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa</div>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">{stats.total}</div>
          <div className="text-[11px] text-teal-600 font-medium">36 Rombel Terdaftar</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto Profil Siswa</div>
          <div className="text-lg font-extrabold text-teal-700 mt-0.5">{stats.withPhoto}</div>
          <div className="text-[11px] text-slate-500">
            {stats.total > 0 ? Math.round((stats.withPhoto / stats.total) * 100) : 0}% terisi foto
          </div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Domisili</div>
          <div className="text-lg font-extrabold text-blue-700 mt-0.5">{stats.withAddress}</div>
          <div className="text-[11px] text-slate-500">
            {stats.total > 0 ? Math.round((stats.withAddress / stats.total) * 100) : 0}% terdata alamat
          </div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa Aktif</div>
          <div className="text-lg font-extrabold text-emerald-700 mt-0.5">{stats.active}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Status Akademik Aktif</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-master-student"
              type="text"
              placeholder="Cari nama, NISN, atau alamat..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Grade Filter */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              {(['ALL', 'X', 'XI', 'XII'] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => {
                    setSelectedGrade(grade);
                    setSelectedClass('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    selectedGrade === grade
                      ? 'bg-white text-teal-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {grade === 'ALL' ? 'Semua Tingkat' : `Kelas ${grade}`}
                </button>
              ))}
            </div>

            {/* Rombel Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs">
              <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <select
                id="master-class-filter"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
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
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs">
              <Camera className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <select
                value={photoFilter}
                onChange={(e) => {
                  setPhotoFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Status Foto</option>
                <option value="WITH_PHOTO">Ada Foto Siswa</option>
                <option value="NO_PHOTO">Belum Ada Foto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Table with Photo and Address Columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-wider text-slate-700 divide-x divide-slate-300">
                <th className="py-3 px-2 w-10 text-center">No</th>
                <th className="py-3 px-3 w-28 text-center bg-teal-50 text-teal-900 border-x-2 border-teal-200">
                  Aksi
                </th>
                <th className="py-3 px-2 w-14 text-center">Foto</th>
                <th className="py-3 px-3 w-28">NISN</th>
                <th className="py-3 px-3 min-w-[160px]">Nama Lengkap</th>
                <th className="py-3 px-2 text-center w-16">Kelas</th>
                <th className="py-3 px-2 text-center w-12">L/P</th>
                <th className="py-3 px-3 min-w-[120px]">No. HP Siswa</th>
                <th className="py-3 px-3 min-w-[180px]">Alamat Domisili</th>
                <th className="py-3 px-3 min-w-[120px]">Kontak Orang Tua</th>
                <th className="py-3 px-2 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-xs">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    Tidak ditemukan data siswa sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={s.id} className="divide-x divide-slate-300 hover:bg-slate-50 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {globalIdx}
                      </td>

                      {/* Aksi: Edit, Hapus & Detail */}
                      <td className="py-3 px-2 text-center bg-teal-50/40 border-x-2 border-teal-100">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingStudent(s)}
                            className="p-1.5 rounded-lg bg-white hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                            title="Lihat Detail Profil Siswa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg bg-white hover:bg-amber-50 hover:text-amber-700 text-slate-600 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                            title="Edit Data, Alamat & Foto Siswa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteStudent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(s)}
                              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-700 text-rose-600 border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                              title="Hapus Data Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Foto Siswa */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex justify-center">
                          {s.photoUrl ? (
                            <button
                              type="button"
                              onClick={() => setZoomedPhoto({ url: s.photoUrl!, name: s.name })}
                              className="relative group cursor-pointer"
                              title="Klik untuk memperbesar foto"
                            >
                              <img
                                src={s.photoUrl}
                                alt={s.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:ring-2 group-hover:ring-teal-500 transition-all"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-xl border border-dashed flex items-center justify-center font-bold text-xs ${
                                s.gender === 'L'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                              title="Belum ada foto profil"
                            >
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* NISN */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                        {s.nisn}
                      </td>

                      {/* Nama Lengkap */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                      </td>

                      {/* Kelas */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.className}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.gender === 'L'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {s.gender}
                        </span>
                      </td>

                      {/* No. HP Siswa */}
                      <td className="py-3 px-3 text-slate-600">
                        {s.phone ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-teal-600 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Alamat Siswa */}
                      <td className="py-3 px-4 text-slate-600">
                        {s.address ? (
                          <div className="flex items-start gap-1.5" title={s.address}>
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-snug line-clamp-2">
                              {s.address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Belum diisi</span>
                        )}
                      </td>

                      {/* Kontak Orang Tua */}
                      <td className="py-3 px-3 text-slate-600">
                        {s.parentPhone ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-teal-600 shrink-0" />
                            <span>{s.parentPhone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {s.status}
                        </span>
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
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="text-slate-500">
              Menampilkan {paginatedStudents.length} dari total {filteredStudents.length} siswa
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="master-prev-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                id="master-next-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH SISWA BARU (LENGKAP DENGAN FOTO & ALAMAT) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base">Tambah Data Siswa Baru</h3>
                  <p className="text-[11px] text-teal-100">SMAN 1 Batu • Lengkap dengan Foto & Alamat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* NISN & NAMA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NISN (Nomor Induk Siswa Nasional) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0091234567"
                    value={newNisn}
                    onChange={(e) => setNewNisn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap siswa..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* ROMBEL & GENDER */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Rombel (36 Rombel) *
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-teal-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {/* ALAMAT SISWA */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Alamat Lengkap Tempat Tinggal / Domisili Siswa</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Jl. Panglima Sudirman No. 45 RT 03/RW 02, Kel. Sisir, Kec. Batu, Kota Batu"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500 leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Isikan nama jalan, nomor rumah, RT/RW, kelurahan/desa, dan kota domisili.
                </p>
              </div>

              {/* TELEPON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon / WhatsApp Siswa
                  </label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* BAGIAN FOTO SISWA (DILETAKKAN DI BAGIAN BAWAH) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>Foto Profil Siswa (Opsional)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('upload')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        photoInputMode === 'upload' ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('url')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        photoInputMode === 'url' ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Tautan URL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Foto Preview */}
                  <div className="relative group shrink-0">
                    {newPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={newPhotoUrl}
                          alt="Pratinjau Foto Siswa"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-teal-500 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewPhotoUrl('');
                            if (addFileInputRef.current) addFileInputRef.current.value = '';
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-5 h-5 text-slate-300" />
                        <span className="text-[9px] mt-0.5 font-medium">Foto</span>
                      </div>
                    )}
                  </div>

                  {/* Input Foto */}
                  <div className="flex-1 min-w-0">
                    {photoInputMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={addFileInputRef}
                          accept="image/*"
                          onChange={handleAddFileUpload}
                          className="hidden"
                          id="add-student-photo-file"
                        />
                        <label
                          htmlFor="add-student-photo-file"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-teal-600" />
                          <span>Pilih Foto dari Perangkat</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Format JPG, PNG, WEBP (maks. 3 MB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/foto-siswa.jpg"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-teal-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Masukkan tautan gambar langsung dari web atau Google Drive
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="save-new-student-btn"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Siswa Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA SISWA (ALAMAT, FOTO & IDENTITAS) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Edit Data & Foto Siswa</h3>
                  <p className="text-[11px] text-slate-300">NISN: {editingStudent.nisn} • {editingStudent.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* NISN & NAMA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NISN *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* ROMBEL & GENDER */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas / Rombel *
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-teal-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {/* ALAMAT SISWA EDIT */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Alamat Lengkap Tempat Tinggal / Domisili</span>
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Contoh: Jl. Panglima Sudirman No. 45 RT 03/RW 02, Kel. Sisir, Kec. Batu, Kota Batu"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              {/* TELEPON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon Siswa
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* STATUS */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Siswa
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* BAGIAN FOTO SISWA EDIT (DILETAKKAN DI BAGIAN BAWAH) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>Foto Profil Siswa</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEditPhotoInputMode('upload')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        editPhotoInputMode === 'upload' ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPhotoInputMode('url')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        editPhotoInputMode === 'url' ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Tautan URL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Foto Preview */}
                  <div className="relative group shrink-0">
                    {editPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={editPhotoUrl}
                          alt="Pratinjau Foto Siswa"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-teal-500 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhotoUrl('');
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700 cursor-pointer"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-5 h-5 text-slate-300" />
                        <span className="text-[9px] mt-0.5 font-medium">Belum Ada</span>
                      </div>
                    )}
                  </div>

                  {/* Input Foto */}
                  <div className="flex-1 min-w-0">
                    {editPhotoInputMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={editFileInputRef}
                          accept="image/*"
                          onChange={handleEditFileUpload}
                          className="hidden"
                          id="edit-student-photo-file"
                        />
                        <label
                          htmlFor="edit-student-photo-file"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-teal-600" />
                          <span>Pilih / Ganti Foto</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Format JPG, PNG, WEBP (maks. 3 MB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/foto-siswa.jpg"
                          value={editPhotoUrl}
                          onChange={(e) => setEditPhotoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-teal-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Masukkan URL foto profil siswa
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-5 text-white relative">
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                {viewingStudent.photoUrl ? (
                  <img
                    src={viewingStudent.photoUrl}
                    alt={viewingStudent.name}
                    onClick={() => setZoomedPhoto({ url: viewingStudent.photoUrl!, name: viewingStudent.name })}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-white/80 shadow-md cursor-pointer hover:scale-105 transition-transform"
                    title="Klik untuk melihat foto besar"
                  />
                ) : (
                  <div
                    className={`w-18 h-18 rounded-2xl border-2 border-white/60 flex items-center justify-center font-black text-xl shadow-md ${
                      viewingStudent.gender === 'L' ? 'bg-sky-600 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {viewingStudent.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    Kelas {viewingStudent.className} • {viewingStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                  <h3 className="font-extrabold text-base leading-tight mt-1">{viewingStudent.name}</h3>
                  <p className="font-mono text-xs text-teal-100 mt-0.5">NISN: {viewingStudent.nisn}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Alamat Domisili */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Alamat Domisili / Tempat Tinggal</span>
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  {viewingStudent.address || 'Belum ada data alamat domisili yang terdaftar.'}
                </p>
              </div>

              {/* Kontak */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Kontak Siswa
                  </span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {viewingStudent.phone || '-'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Kontak Orang Tua
                  </span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {viewingStudent.parentPhone || '-'}
                  </span>
                </div>
              </div>

              {/* Disiplin & Akademik */}
              {(() => {
                const viols = disciplineRecords.filter((d) => d.studentId === viewingStudent.id);
                const pts = viols.reduce((acc, curr) => acc + curr.points, 0);
                return (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Akumulasi Disiplin
                      </span>
                      <span className="font-bold text-slate-800">{viols.length} Catatan Kejadian</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black ${
                        pts > 25
                          ? 'bg-rose-100 text-rose-800'
                          : pts > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {pts} Poin
                    </span>
                  </div>
                );
              })()}

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const s = viewingStudent;
                    setViewingStudent(null);
                    handleOpenEdit(s);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Data & Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZOOM FOTO SISWA */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="bg-white p-2 rounded-2xl max-w-sm w-full shadow-2xl space-y-3 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.name}
                className="w-full h-72 object-cover rounded-xl border border-slate-200"
              />
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-2 pb-1 text-center">
              <div className="font-bold text-sm text-slate-900">{zoomedPhoto.name}</div>
              <div className="text-[11px] text-slate-500">Foto Profil Resmi Siswa SMAN 1 Batu</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
