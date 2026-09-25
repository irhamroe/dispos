import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  BookOpen, 
  Scale,
  Sparkles
} from 'lucide-react';
import { ViolationRule, ViolationCategory } from '../types';

interface ViolationRulesViewProps {
  violationRules: ViolationRule[];
  onAddRule: (newRule: ViolationRule) => void;
  onEditRule: (updatedRule: ViolationRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onResetRules: () => void;
}

export const ViolationRulesView: React.FC<ViolationRulesViewProps> = ({
  violationRules,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onResetRules,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ViolationCategory>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ViolationRule | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ViolationCategory>('Ringan');
  const [formPoints, setFormPoints] = useState<number>(5);
  const [formIntervention, setFormIntervention] = useState('');

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormName('');
    setFormCategory('Ringan');
    setFormPoints(5);
    setFormIntervention('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rule: ViolationRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormCategory(rule.category);
    setFormPoints(rule.defaultPoints);
    setFormIntervention(rule.suggestedIntervention || '');
    setIsModalOpen(true);
  };

  // Handle Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingRule) {
      const updated: ViolationRule = {
        ...editingRule,
        name: formName.trim(),
        category: formCategory,
        defaultPoints: Number(formPoints) || 5,
        suggestedIntervention: formIntervention.trim(),
      };
      onEditRule(updated);
      setNotice(`Aturan "${updated.name}" berhasil diperbarui.`);
    } else {
      const newRule: ViolationRule = {
        id: `vr-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        defaultPoints: Number(formPoints) || 5,
        suggestedIntervention: formIntervention.trim() || 'Refleksi disiplin dan komitmen tata tertib siswa.',
      };
      onAddRule(newRule);
      setNotice(`Aturan baru "${newRule.name}" berhasil ditambahkan ke katalog.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotice(null), 3500);
  };

  // Handle Delete with Confirmation
  const handleDelete = (rule: ViolationRule) => {
    if (confirm(`Hapus aturan jenis pelanggaran:\n"${rule.name}"?`)) {
      onDeleteRule(rule.id);
      setNotice(`Aturan "${rule.name}" telah dihapus.`);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  // Handle Reset to Default
  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan seluruh aturan jenis pelanggaran ke katalog standar SMAN 1 Batu?')) {
      onResetRules();
      setNotice('Katalog aturan pelanggaran berhasil dikembalikan ke pengaturan awal standar.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return violationRules.filter((rule) => {
      if (selectedCategory !== 'ALL' && rule.category !== selectedCategory) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = rule.name.toLowerCase().includes(q);
        const matchIntervention = rule.suggestedIntervention?.toLowerCase().includes(q);
        if (!matchName && !matchIntervention) return false;
      }
      return true;
    });
  }, [violationRules, selectedCategory, searchQuery]);

  // Counts
  const totalCount = violationRules.length;
  const ringanCount = violationRules.filter((r) => r.category === 'Ringan').length;
  const sedangCount = violationRules.filter((r) => r.category === 'Sedang').length;
  const beratCount = violationRules.filter((r) => r.category === 'Berat').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Manajemen Aturan Jenis Pelanggaran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola katalog tata tertib: input, edit, dan hapus jenis pelanggaran beserta bobot poin dan restitusi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Kembalikan ke aturan standar awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>

            <button
              type="button"
              id="add-new-rule-btn"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aturan Baru</span>
            </button>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Aturan</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Katalog aktif di sistem</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase">Pelanggaran Ringan</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-800 mt-1">{ringanCount}</div>
          <div className="text-[11px] text-blue-600/80 mt-0.5 font-medium">Bobot poin 5 - 10</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase">Pelanggaran Sedang</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{sedangCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5 font-medium">Bobot poin 15 - 25</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase">Pelanggaran Berat</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800 mt-1">{beratCount}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5 font-medium">Bobot poin 30 - 50+</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Ringan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'Ringan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ringan ({ringanCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Sedang')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'Sedang'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sedang ({sedangCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Berat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'Berat'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Berat ({beratCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama jenis pelanggaran / restitusi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-4 min-w-[260px]">Jenis Pelanggaran</th>
                <th className="py-3 px-3 text-center w-28">Kategori</th>
                <th className="py-3 px-3 text-center w-24">Poin Standar</th>
                <th className="py-3 px-4">Rekomendasi Restitusi / Pembinaan</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada aturan jenis pelanggaran yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => {
                  let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (rule.category === 'Sedang') {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (rule.category === 'Berat') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{rule.name}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                          {rule.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {rule.defaultPoints} Poin
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        {rule.suggestedIntervention || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit Aturan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Aturan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: Input / Edit Aturan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {editingRule ? 'Edit Aturan Jenis Pelanggaran' : 'Tambah Aturan Jenis Pelanggaran Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              {/* Nama Jenis Pelanggaran */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Jenis Pelanggaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terlambat hadir lebih dari 15 menit..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-600 text-xs"
                />
              </div>

              {/* Kategori & Poin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Pelanggaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ViolationCategory;
                      setFormCategory(cat);
                      // suggest sensible default points based on category
                      if (!editingRule) {
                        if (cat === 'Ringan') setFormPoints(5);
                        else if (cat === 'Sedang') setFormPoints(15);
                        else if (cat === 'Berat') setFormPoints(35);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-600 text-xs cursor-pointer"
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bobot Poin Standar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={formPoints}
                    onChange={(e) => setFormPoints(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-600 text-xs"
                  />
                </div>
              </div>

              {/* Rekomendasi Restitusi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rekomendasi Restitusi / Tindakan Pembinaan
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Refleksi disiplin pagi bersama wali kelas dan tugas literasi karakter..."
                  value={formIntervention}
                  onChange={(e) => setFormIntervention(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-600 text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingRule ? 'Simpan Perubahan' : 'Tambahkan Aturan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
