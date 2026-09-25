import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Search, 
  Phone, 
  Mail, 
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
  const [editEmail, setEditEmail] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editStatus, setEditStatus] = useState<'PNS' | 'PPPK' | 'GTT'>('PNS');

  // Add form state
  const [newName, setNewName] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
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
    return waliKelasList.filter((w) => {
      const matchGrade = selectedGrade === 'ALL' || w.grade === selectedGrade;
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.nip.includes(searchQuery) ||
        w.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.phone.includes(searchQuery);
      return matchGrade && matchSearch;
    });
  }, [waliKelasList, selectedGrade, searchQuery]);

  const pnsCount = waliKelasList.filter((w) => w.status === 'PNS').length;
  const pppkCount = waliKelasList.filter((w) => w.status === 'PPPK').length;

  const handleOpenEdit = (t: WaliKelasTeacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditNip(t.nip);
    setEditPhone(t.phone);
    setEditEmail(t.email);
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
      email: editEmail.trim(),
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
      email: newEmail.trim() || `${newName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}@sman1batu.sch.id`,
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
    setNewEmail('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
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
            Data Wali Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Direktori 36 guru wali kelas SMAN 1 Batu, kontak koordinasi presensi, dan pembinaan rombel.
          </p>
        </div>

        {onAddWaliKelas && (
          <button
            type="button"
            id="btn-add-walikelas"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Wali Kelas</span>
          </button>
        )}
      </div>

      {/* Metric Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Total Wali Kelas</div>
            <div className="text-lg font-bold text-slate-900">{waliKelasList.length} Guru</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Rombel Terbina</div>
            <div className="text-lg font-bold text-slate-900">36 / 36 Rombel</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Status PNS</div>
            <div className="text-lg font-bold text-slate-900">{pnsCount} Guru</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Status PPPK</div>
            <div className="text-lg font-bold text-slate-900">{pppkCount} Guru</div>
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
              id={`filter-wali-grade-${grade}`}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedGrade === grade
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {grade === 'ALL' ? 'Semua Jenjang' : `Wali Kelas ${grade}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-wali-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, rombel..."
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
                <th className="py-3 px-3 w-32 text-center bg-teal-50 text-teal-900 border-x-2 border-teal-200">Aksi</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Guru & NIP</th>
                <th className="py-3 px-3 text-center w-24">Rombel</th>
                <th className="py-3 px-3 text-center w-24">Tingkat</th>
                <th className="py-3 px-3 text-center w-28">Siswa Binaan</th>
                <th className="py-3 px-4 min-w-[170px]">Kontak WhatsApp</th>
                <th className="py-3 px-4 min-w-[190px]">Email Dinas</th>
                <th className="py-3 px-3 text-center w-24">Kepegawaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-xs">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada wali kelas yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => {
                  const studentCount = classStudentCounts[t.className] || 0;
                  const cleanPhone = t.phone.replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

                  return (
                    <tr
                      key={t.id}
                      className="divide-x divide-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-2 text-center bg-teal-50/40 border-x-2 border-teal-100">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            id={`btn-view-students-wali-${t.id}`}
                            onClick={() => onViewClassStudents(t.className)}
                            title="Lihat Daftar Siswa di Rombel Ini"
                            className="px-2 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-md font-semibold text-[11px] flex items-center gap-1 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Siswa</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-edit-wali-${t.id}`}
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Data Wali Kelas"
                            className="p-1 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-md border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteWaliKelas && (
                            <button
                              type="button"
                              id={`btn-delete-wali-${t.id}`}
                              onClick={() => handleDeleteWaliKelas(t)}
                              title="Hapus Wali Kelas"
                              className="p-1 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-md border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm leading-tight">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          NIP: {t.nip}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md text-xs">
                          {t.className}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Kelas {t.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {studentCount} Siswa
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
                            title="Chat via WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{t.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(t.phone)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            title="Salin Nomor HP"
                          >
                            {copiedPhone === t.phone ? (
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{t.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            t.status === 'PNS'
                              ? 'bg-blue-100 text-blue-800'
                              : t.status === 'PPPK'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Edit Data Wali Kelas
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / NUPTK
                </label>
                <input
                  type="text"
                  value={editNip}
                  onChange={(e) => setEditNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rombel Binaan
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'PNS' | 'PPPK' | 'GTT')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT">GTT / Guru Tetap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Dinas
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Wali Kelas Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Drs. Ahmad Suwandi, M.Pd."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / NUPTK
                </label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="19800101 200501 1 001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rombel Binaan
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'PNS' | 'PPPK' | 'GTT')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT">GTT / Guru Tetap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Dinas
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nama@sman1batu.sch.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
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
