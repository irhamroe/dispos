import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Edit3, 
  Trash2, 
  Plus, 
  Eye, 
  CheckCircle2, 
  X, 
  DoorOpen, 
  Building2 
} from 'lucide-react';
import { Student } from '../types';
import { RombelClass } from '../data/initialData';
import { sortClasses } from '../utils/sortUtils';

interface DataKelasViewProps {
  classes: RombelClass[];
  students: Student[];
  onUpdateClass: (updated: RombelClass) => void;
  onAddClass?: (newClass: RombelClass) => void;
  onDeleteClass?: (classId: string) => void;
  onViewClassStudents: (className: string) => void;
}

export const DataKelasView: React.FC<DataKelasViewProps> = ({
  classes,
  students,
  onUpdateClass,
  onAddClass,
  onDeleteClass,
  onViewClassStudents,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClass, setEditingClass] = useState<RombelClass | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for editing
  const [editHomeroom, setEditHomeroom] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editCapacity, setEditCapacity] = useState(36);

  // Form state for adding
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState<'X' | 'XI' | 'XII'>('X');
  const [newHomeroom, setNewHomeroom] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newCapacity, setNewCapacity] = useState(36);

  // Count students per class
  const classStats = useMemo(() => {
    const stats: { [className: string]: { total: number; l: number; p: number } } = {};
    classes.forEach((c) => {
      stats[c.name] = { total: 0, l: 0, p: 0 };
    });
    students.forEach((s) => {
      if (stats[s.className]) {
        stats[s.className].total++;
        if (s.gender === 'L') stats[s.className].l++;
        else stats[s.className].p++;
      }
    });
    return stats;
  }, [classes, students]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    const list = classes.filter((c) => {
      const matchGrade = selectedGrade === 'ALL' || c.grade === selectedGrade;
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.homeroom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.room && c.room.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGrade && matchSearch;
    });
    return sortClasses(list);
  }, [classes, selectedGrade, searchQuery]);

  const countGradeX = classes.filter((c) => c.grade === 'X').length;
  const countGradeXI = classes.filter((c) => c.grade === 'XI').length;
  const countGradeXII = classes.filter((c) => c.grade === 'XII').length;

  const handleOpenEdit = (c: RombelClass) => {
    setEditingClass(c);
    setEditHomeroom(c.homeroom);
    setEditRoom(c.room || '');
    setEditCapacity(c.capacity || 36);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    const updated: RombelClass = {
      ...editingClass,
      homeroom: editHomeroom.trim() || editingClass.homeroom,
      room: editRoom.trim() || undefined,
      capacity: editCapacity,
    };
    onUpdateClass(updated);
    setEditingClass(null);
  };

  const handleDeleteClass = (cls: RombelClass) => {
    const studentCount = classStats[cls.name]?.total || 0;
    const msg =
      studentCount > 0
        ? `Rombel "${cls.name}" masih memiliki ${studentCount} siswa terdaftar. Apakah Anda yakin ingin menghapus kelas ini?`
        : `Apakah Anda yakin ingin menghapus Rombel "${cls.name}"? Data yang dihapus tidak dapat dikembalikan.`;

    if (confirm(msg)) {
      if (onDeleteClass) {
        onDeleteClass(cls.id);
      }
    }
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onAddClass) return;
    const newClass: RombelClass = {
      id: `c-${newGrade.toLowerCase()}-${Date.now()}`,
      name: newName.trim(),
      grade: newGrade,
      number: classes.filter((c) => c.grade === newGrade).length + 1,
      homeroom: newHomeroom.trim() || 'Belum Ditentukan',
      room: newRoom.trim() || undefined,
      capacity: newCapacity,
    };
    onAddClass(newClass);
    setIsAddModalOpen(false);
    setNewName('');
    setNewHomeroom('');
    setNewRoom('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header View with Claymorphism */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-sm border border-white/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6750A4] to-[#9333EA] text-white flex items-center justify-center shadow-xs shrink-0">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-purple-100 text-[#6750A4] shadow-xs" >
                Manajemen Data Sekolah
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1B1F] tracking-tight" >
              Data Kelas &amp; Rombongan Belajar
            </h2>
            <p className="text-sm text-[#49454F] mt-1 font-medium">
              Daftar 36 rombel aktif SMAN 1 Batu tahun ajaran 2026/2027 beserta wali kelas dan ruang belajar.
            </p>
          </div>
        </div>

        {onAddClass && (
          <button
            type="button"
            id="btn-add-class"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-br from-[#E8DEF8] to-[#6750A4] hover:from-[#9333EA] hover:to-[#6D28D9] text-white rounded-2xl text-xs font-extrabold transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none flex items-center gap-2 cursor-pointer self-start md:self-auto"
            
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rombel</span>
          </button>
        )}
      </div>

      {/* Metric Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-white/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#49454F] uppercase tracking-wider" >Total Rombel</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1C1B1F] mt-0.5" >{classes.length} Kelas</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-sky-200/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-sky-700 uppercase tracking-wider" >Kelas X</div>
            <div className="text-2xl sm:text-3xl font-black text-sky-700 mt-0.5" >{countGradeX} Rombel</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-indigo-200/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-indigo-700 uppercase tracking-wider" >Kelas XI</div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-0.5" >{countGradeXI} Rombel</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-purple-200/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-purple-700 uppercase tracking-wider" >Kelas XII</div>
            <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-0.5" >{countGradeXII} Rombel</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[32px] bg-white/80 p-6 backdrop-blur-xl shadow-sm border border-white/60 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Jenjang Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-[#E7E0EC] rounded-2xl shadow-none w-full md:w-auto font-bold">
          {(['ALL', 'X', 'XI', 'XII'] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              id={`filter-grade-${grade}`}
              onClick={() => setSelectedGrade(grade)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedGrade === grade
                  ? 'bg-gradient-to-br from-[#E8DEF8] to-[#6750A4] text-white shadow-xs -translate-y-0.5'
                  : 'text-[#49454F] hover:text-[#1C1B1F]'
              }`}
              
            >
              {grade === 'ALL' ? 'Semua Jenjang' : `Kelas ${grade}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#49454F]" />
          <input
            id="search-class-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rombel, wali kelas, ruang..."
            className="w-full pl-11 pr-4 py-3 bg-[#E7E0EC] rounded-2xl text-xs text-[#1C1B1F] placeholder-[#49454F] shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#6750A4]/20 font-medium"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-[32px] bg-white/80 backdrop-blur-xl shadow-sm border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/80 to-purple-50/50 text-[#49454F] font-black text-xs uppercase tracking-wider border-b border-slate-200/60" >
                <th className="py-4 px-4 w-12 text-center">No</th>
                <th className="py-4 px-5 min-w-[140px]">Nama Rombel</th>
                <th className="py-4 px-5 min-w-[220px]">Wali Kelas &amp; Ruangan</th>
                <th className="py-4 px-5 text-center min-w-[150px]">Jumlah Siswa &amp; Rasio</th>
                <th className="py-4 px-4 text-center w-24">Status</th>
                <th className="py-4 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#49454F] font-bold">
                    Tidak ada rombel yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c, idx) => {
                  const stats = classStats[c.name] || { total: 0, l: 0, p: 0 };
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-purple-50/30 transition-colors"
                    >
                      {/* No */}
                      <td className="py-4 px-4 text-center font-bold text-[#49454F]">
                        {idx + 1}
                      </td>

                      {/* Nama Rombel & Tingkat */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-[#1C1B1F] text-sm" >
                            {c.name}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#E7E0EC] text-[#6750A4] shadow-2xs">
                            Kelas {c.grade}
                          </span>
                        </div>
                      </td>

                      {/* Wali Kelas & Ruang Belajar */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#1C1B1F] leading-tight">
                          {c.homeroom}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#49454F] mt-0.5">
                          <DoorOpen className="w-3.5 h-3.5 text-[#6750A4] shrink-0" />
                          <span>{c.room || `Gedung Kelas ${c.grade}`}</span>
                        </div>
                      </td>

                      {/* Jumlah Siswa & Rasio L/P */}
                      <td className="py-4 px-5 text-center">
                        <div className="font-black text-[#6750A4] text-sm" >
                          {stats.total} Siswa
                        </div>
                        <div className="text-xs text-[#49454F] font-mono mt-0.5">
                          {stats.l} L / {stats.p} P
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs" >
                          Aktif
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            id={`btn-view-students-${c.id}`}
                            onClick={() => onViewClassStudents(c.name)}
                            title="Lihat Daftar Siswa"
                            className="px-3 py-1.5 bg-white hover:bg-purple-50 text-[#6750A4] rounded-xl font-black text-xs flex items-center gap-1 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                            
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Siswa</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-edit-class-${c.id}`}
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Rombel"
                            className="p-2 bg-white hover:bg-amber-50 text-[#49454F] hover:text-amber-700 rounded-xl shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {onDeleteClass && (
                            <button
                              type="button"
                              id={`btn-delete-class-${c.id}`}
                              onClick={() => handleDeleteClass(c)}
                              title="Hapus Rombel"
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
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
      </div>

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1C1B1F]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-sm border border-white/60 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200/60 pb-4">
              <h3 className="text-lg font-black text-[#1C1B1F]" >
                Edit Rombel {editingClass.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="w-9 h-9 rounded-2xl bg-[#E7E0EC] text-[#49454F] hover:text-[#1C1B1F] flex items-center justify-center cursor-pointer shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Nama Rombel
                </label>
                <input
                  type="text"
                  disabled
                  value={editingClass.name}
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#49454F] font-black shadow-none"
                  
                />
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Wali Kelas
                </label>
                <input
                  type="text"
                  value={editHomeroom}
                  onChange={(e) => setEditHomeroom(e.target.value)}
                  placeholder="Nama Lengkap & Gelar Wali Kelas"
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#6750A4]/20"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Ruang Kelas / Gedung
                </label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  placeholder="Contoh: Gedung A - R.101"
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#6750A4]/20"
                />
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Kapasitas Siswa
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value) || 36)}
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#6750A4]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-5 py-2.5 bg-[#E7E0EC] hover:bg-white text-[#49454F] rounded-2xl font-black shadow-xs active:scale-[0.92] cursor-pointer"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-br from-[#E8DEF8] to-[#6750A4] hover:from-[#9333EA] hover:to-[#6D28D9] text-white rounded-2xl font-black shadow-xs hover:-translate-y-0.5 active:scale-[0.92] cursor-pointer"
                  
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1C1B1F]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-sm border border-white/60 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200/60 pb-4">
              <h3 className="text-lg font-black text-[#1C1B1F]" >
                Tambah Rombongan Belajar Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-[#E7E0EC] text-[#49454F] hover:text-[#1C1B1F] flex items-center justify-center cursor-pointer shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#1C1B1F] mb-1.5" >
                    Tingkat / Jenjang
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value as 'X' | 'XI' | 'XII')}
                    className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-extrabold shadow-none focus:outline-hidden focus:bg-white cursor-pointer"
                    
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-[#1C1B1F] mb-1.5" >
                    Nama Rombel
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Misal: X-13"
                    className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Wali Kelas
                </label>
                <input
                  type="text"
                  value={newHomeroom}
                  onChange={(e) => setNewHomeroom(e.target.value)}
                  placeholder="Nama Lengkap & Gelar Wali Kelas"
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Ruang Kelas / Gedung
                </label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="Contoh: Gedung A - R.113"
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-medium shadow-none focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-[#E7E0EC] hover:bg-white text-[#49454F] rounded-2xl font-black shadow-xs active:scale-[0.92] cursor-pointer"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-br from-[#E8DEF8] to-[#6750A4] hover:from-[#9333EA] hover:to-[#6D28D9] text-white rounded-2xl font-black shadow-xs hover:-translate-y-0.5 active:scale-[0.92] cursor-pointer"
                  
                >
                  Tambahkan Rombel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
