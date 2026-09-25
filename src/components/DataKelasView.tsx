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
    return classes.filter((c) => {
      const matchGrade = selectedGrade === 'ALL' || c.grade === selectedGrade;
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.homeroom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.room && c.room.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGrade && matchSearch;
    });
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
      {/* Header View */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Manajemen Data Sekolah
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Kelas & Rombongan Belajar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar 36 rombel aktif SMAN 1 Batu tahun ajaran 2026/2027 beserta wali kelas dan ruang belajar.
          </p>
        </div>

        {onAddClass && (
          <button
            type="button"
            id="btn-add-class"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rombel</span>
          </button>
        )}
      </div>

      {/* Metric Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Total Rombel</div>
            <div className="text-lg font-bold text-slate-900">{classes.length} Kelas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Kelas X</div>
            <div className="text-lg font-bold text-slate-900">{countGradeX} Rombel</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Kelas XI</div>
            <div className="text-lg font-bold text-slate-900">{countGradeXI} Rombel</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Kelas XII</div>
            <div className="text-lg font-bold text-slate-900">{countGradeXII} Rombel</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Jenjang Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          {(['ALL', 'X', 'XI', 'XII'] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              id={`filter-grade-${grade}`}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedGrade === grade
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {grade === 'ALL' ? 'Semua Jenjang' : `Kelas ${grade}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-class-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rombel, wali kelas, ruang..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700 divide-x divide-slate-300 border-b border-slate-300">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[120px]">Nama Rombel</th>
                <th className="py-3 px-3 text-center w-24">Tingkat</th>
                <th className="py-3 px-4 min-w-[160px]">Ruang Belajar</th>
                <th className="py-3 px-4 min-w-[220px]">Wali Kelas</th>
                <th className="py-3 px-3 text-center w-28">Jumlah Siswa</th>
                <th className="py-3 px-3 text-center w-24">Rasio L/P</th>
                <th className="py-3 px-3 text-center w-24">Status</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-xs">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada rombel yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c, idx) => {
                  const stats = classStats[c.name] || { total: 0, l: 0, p: 0 };
                  return (
                    <tr
                      key={c.id}
                      className="divide-x divide-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          {c.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Kelas {c.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{c.room || `Gedung Kelas ${c.grade}`}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.homeroom}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-teal-700">
                          {stats.total} Siswa
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-600">
                        {stats.l}L / {stats.p}P
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            id={`btn-view-students-${c.id}`}
                            onClick={() => onViewClassStudents(c.name)}
                            title="Lihat Daftar Siswa"
                            className="px-2 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Siswa</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-edit-class-${c.id}`}
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Rombel"
                            className="p-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteClass && (
                            <button
                              type="button"
                              id={`btn-delete-class-${c.id}`}
                              onClick={() => handleDeleteClass(c)}
                              title="Hapus Rombel"
                              className="p-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-md transition-colors cursor-pointer"
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

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Edit Rombel {editingClass.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Rombel
                </label>
                <input
                  type="text"
                  disabled
                  value={editingClass.name}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wali Kelas
                </label>
                <input
                  type="text"
                  value={editHomeroom}
                  onChange={(e) => setEditHomeroom(e.target.value)}
                  placeholder="Nama Lengkap & Gelar Wali Kelas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ruang Kelas / Gedung
                </label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  placeholder="Contoh: Gedung A - R.101"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapasitas Siswa
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value) || 36)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Rombongan Belajar Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat / Jenjang
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value as 'X' | 'XI' | 'XII')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Rombel
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Misal: X-13"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wali Kelas
                </label>
                <input
                  type="text"
                  value={newHomeroom}
                  onChange={(e) => setNewHomeroom(e.target.value)}
                  placeholder="Nama Lengkap & Gelar Wali Kelas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ruang Kelas / Gedung
                </label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="Contoh: Gedung A - R.113"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer"
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
