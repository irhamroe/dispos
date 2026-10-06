import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Search, 
  Phone, 
  Edit3, 
  Trash2, 
  Plus, 
  Eye, 
  X, 
  CheckCircle2, 
  Copy, 
  Award, 
  GraduationCap, 
  Briefcase 
} from 'lucide-react';
import { Student, WaliKelasTeacher } from '../types';
import { RombelClass } from '../data/initialData';
import { sortClasses, sortWaliKelas } from '../utils/sortUtils';

interface DataWaliKelasViewProps {
  waliKelasList: WaliKelasTeacher[];
  classes: RombelClass[];
  students: Student[];
  onUpdateWaliKelas: (updated: WaliKelasTeacher) => void;
  onAddWaliKelas?: (newTeacher: WaliKelasTeacher) => void;
  onDeleteWaliKelas?: (teacherId: string) => void;
  onViewClassStudents: (className: string) => void;
}

export const DataWaliKelasView: React.FC<DataWaliKelasViewProps> = ({
  waliKelasList,
  classes,
  students,
  onUpdateWaliKelas,
  onAddWaliKelas,
  onDeleteWaliKelas,
  onViewClassStudents,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<WaliKelasTeacher | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editNip, setEditNip] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editStatus, setEditStatus] = useState<'PNS' | 'PPPK' | 'GTT'>('PNS');

  // Add form state
  const [newName, setNewName] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newClassId, setNewClassId] = useState(classes[0]?.id || 'c-x-1');
  const [newStatus, setNewStatus] = useState<'PNS' | 'PPPK' | 'GTT'>('PNS');

  // Count students per class
  const classStudentCounts = useMemo(() => {
    const map: { [className: string]: number } = {};
    students.forEach((s) => {
      map[s.className] = (map[s.className] || 0) + 1;
    });
    return map;
  }, [students]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    const list = waliKelasList.filter((w) => {
      const matchGrade = selectedGrade === 'ALL' || w.grade === selectedGrade;
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.nip.includes(searchQuery) ||
        w.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.phone.includes(searchQuery);
      return matchGrade && matchSearch;
    });
    return sortWaliKelas(list);
  }, [waliKelasList, selectedGrade, searchQuery]);

  const pnsCount = waliKelasList.filter((w) => w.status === 'PNS').length;
  const pppkCount = waliKelasList.filter((w) => w.status === 'PPPK').length;

  const handleOpenEdit = (t: WaliKelasTeacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditNip(t.nip);
    setEditPhone(t.phone);
    setEditClassId(t.classId);
    setEditStatus(t.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const targetClass = classes.find((c) => c.id === editClassId);
    const updated: WaliKelasTeacher = {
      ...editingTeacher,
      name: editName.trim(),
      nip: editNip.trim(),
      phone: editPhone.trim(),
      classId: editClassId,
      className: targetClass ? targetClass.name : editingTeacher.className,
      grade: targetClass ? targetClass.grade : editingTeacher.grade,
      status: editStatus,
    };
    onUpdateWaliKelas(updated);
    setEditingTeacher(null);
  };

  const handleDeleteWaliKelas = (teacher: WaliKelasTeacher) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus data wali kelas "${teacher.name}" (Wali ${teacher.className})? Data yang dihapus tidak dapat dikembalikan.`
      )
    ) {
      if (onDeleteWaliKelas) {
        onDeleteWaliKelas(teacher.id);
      }
    }
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onAddWaliKelas) return;
    const targetClass = classes.find((c) => c.id === newClassId);
    const newTeacher: WaliKelasTeacher = {
      id: `wk-${Date.now()}`,
      name: newName.trim(),
      nip: newNip.trim() || '-',
      phone: newPhone.trim() || '-',
      classId: newClassId,
      className: targetClass ? targetClass.name : 'X-1',
      grade: targetClass ? targetClass.grade : 'X',
      status: newStatus,
    };
    onAddWaliKelas(newTeacher);
    setIsAddModalOpen(false);
    setNewName('');
    setNewNip('');
    setNewPhone('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header View with Claymorphism */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-sm border border-white/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-teal-100 text-teal-800 shadow-xs" >
                Manajemen Data Sekolah
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1B1F] tracking-tight" >
              Data Wali Kelas
            </h2>
            <p className="text-sm text-[#49454F] mt-1 font-medium">
              Direktori 36 guru wali kelas SMAN 1 Batu, kontak koordinasi presensi, dan pembinaan rombel.
            </p>
          </div>
        </div>

        {onAddWaliKelas && (
          <button
            type="button"
            id="btn-add-walikelas"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-br from-[#E8DEF8] to-[#6750A4] hover:from-[#9333EA] hover:to-[#6D28D9] text-white rounded-2xl text-xs font-extrabold transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none flex items-center gap-2 cursor-pointer self-start md:self-auto"
            
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Wali Kelas</span>
          </button>
        )}
      </div>

      {/* Metric Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-white/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#49454F] uppercase tracking-wider" >Total Wali Kelas</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1C1B1F] mt-0.5" >{waliKelasList.length} Guru</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-sky-200/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-sky-700 uppercase tracking-wider" >Rombel Terbina</div>
            <div className="text-2xl sm:text-3xl font-black text-sky-700 mt-0.5" >36 / 36 Rombel</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-emerald-200/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider" >Status PNS</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-0.5" >{pnsCount} Guru</div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-sm border border-amber-200/60 hover:-translate-y-1.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-amber-700 uppercase tracking-wider" >Status PPPK</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-0.5" >{pppkCount} Guru</div>
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
              id={`filter-wali-grade-${grade}`}
              onClick={() => setSelectedGrade(grade)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedGrade === grade
                  ? 'bg-gradient-to-br from-[#E8DEF8] to-[#6750A4] text-white shadow-xs -translate-y-0.5'
                  : 'text-[#49454F] hover:text-[#1C1B1F]'
              }`}
              
            >
              {grade === 'ALL' ? 'Semua Jenjang' : `Wali Kelas ${grade}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#49454F]" />
          <input
            id="search-wali-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, rombel..."
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
                <th className="py-4 px-5 min-w-[220px]">Nama Guru &amp; NIP</th>
                <th className="py-4 px-5 min-w-[120px] text-center">Kelas Binaan</th>
                <th className="py-4 px-5 min-w-[160px]">Kontak / No. HP</th>
                <th className="py-4 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#49454F] font-bold">
                    Tidak ada wali kelas yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => {
                  const cleanPhone = t.phone.replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-purple-50/30 transition-colors"
                    >
                      {/* No */}
                      <td className="py-4 px-4 text-center font-bold text-[#49454F]">
                        {idx + 1}
                      </td>

                      {/* Nama Guru, NIP & Status Kepegawaian */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="font-black text-[#1C1B1F] text-sm leading-tight" >
                            {t.name}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black shadow-xs shrink-0 ${
                              t.status === 'PNS'
                                ? 'bg-sky-100 text-sky-800'
                                : t.status === 'PPPK'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#E7E0EC] text-[#49454F]'
                            }`}
                            
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#49454F] font-mono mt-0.5">
                          NIP: {t.nip}
                        </div>
                      </td>

                      {/* Kelas Binaan */}
                      <td className="py-4 px-5 text-center">
                        <span className="font-black text-[#6750A4] bg-purple-50 border border-purple-200 px-3.5 py-1 rounded-xl text-xs inline-block shadow-xs" >
                          Kelas {t.className}
                        </span>
                      </td>

                      {/* Kontak WhatsApp */}
                      <td className="py-4 px-5 text-[#49454F]">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1.5 text-xs"
                            title="Chat via WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{t.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(t.phone)}
                            className="p-1 text-[#49454F] hover:text-[#1C1B1F] rounded-lg transition-colors cursor-pointer"
                            title="Salin Nomor HP"
                          >
                            {copiedPhone === t.phone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            id={`btn-view-students-wali-${t.id}`}
                            onClick={() => onViewClassStudents(t.className)}
                            title="Lihat Daftar Siswa di Rombel Ini"
                            className="px-3 py-1.5 bg-white hover:bg-purple-50 text-[#6750A4] rounded-xl font-black text-xs flex items-center gap-1 shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                            
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Siswa</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-edit-wali-${t.id}`}
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Data Wali Kelas"
                            className="p-2 bg-white hover:bg-amber-50 text-[#49454F] hover:text-amber-700 rounded-xl shadow-xs hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {onDeleteWaliKelas && (
                            <button
                              type="button"
                              id={`btn-delete-wali-${t.id}`}
                              onClick={() => handleDeleteWaliKelas(t)}
                              title="Hapus Wali Kelas"
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

      {/* Edit Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1C1B1F]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-sm border border-white/60 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200/60 pb-4">
              <h3 className="text-lg font-black text-[#1C1B1F]" >
                Edit Data Wali Kelas
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="w-9 h-9 rounded-2xl bg-[#E7E0EC] text-[#49454F] hover:text-[#1C1B1F] flex items-center justify-center cursor-pointer shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#6750A4]/20"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  NIP / NUPTK
                </label>
                <input
                  type="text"
                  value={editNip}
                  onChange={(e) => setEditNip(e.target.value)}
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-mono font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#6750A4]/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#1C1B1F] mb-1.5" >
                    Kelas Binaan
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-extrabold shadow-none focus:outline-hidden focus:bg-white cursor-pointer"
                    
                  >
                    {sortClasses(classes).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-[#1C1B1F] mb-1.5" >
                    Status Kepegawaian
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'PNS' | 'PPPK' | 'GTT')}
                    className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-extrabold shadow-none focus:outline-hidden focus:bg-white cursor-pointer"
                    
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT">GTT / Guru Tetap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#6750A4]/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1C1B1F]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-sm border border-white/60 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200/60 pb-4">
              <h3 className="text-lg font-black text-[#1C1B1F]" >
                Tambah Wali Kelas Baru
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
              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Drs. Ahmad Suwandi, M.Pd."
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  NIP / NUPTK
                </label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="19800101 200501 1 001"
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-mono font-bold shadow-none focus:outline-hidden focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-[#1C1B1F] mb-1.5" >
                    Kelas Binaan
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-extrabold shadow-none focus:outline-hidden focus:bg-white cursor-pointer"
                    
                  >
                    {sortClasses(classes).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-[#1C1B1F] mb-1.5" >
                    Status Kepegawaian
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'PNS' | 'PPPK' | 'GTT')}
                    className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-extrabold shadow-none focus:outline-hidden focus:bg-white cursor-pointer"
                    
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT">GTT / Guru Tetap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-[#1C1B1F] mb-1.5" >
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-bold shadow-none focus:outline-hidden focus:bg-white"
                  required
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
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
