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
import { sortViolationRules } from '../utils/sortUtils';

interface ViolationRulesViewProps {
  violationRules: ViolationRule[];
  onAddRule: (newRule: ViolationRule) => void;
  onEditRule: (updatedRule: ViolationRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onResetRules: () => void;
  enablePointsSystem?: boolean;
  onTogglePointsSystem?: (enabled: boolean) => void;
}

export const ViolationRulesView: React.FC<ViolationRulesViewProps> = ({
  violationRules,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onResetRules,
  enablePointsSystem = true,
  onTogglePointsSystem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ViolationCategory>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ViolationRule | null>(null);
  
  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ViolationCategory>('Ringan');
  const [formPoints, setFormPoints] = useState<number>(5);
  const [formIntervention, setFormIntervention] = useState('');

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormCode('');
    setFormName('');
    setFormCategory('Ringan');
    setFormPoints(5);
    setFormIntervention('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rule: ViolationRule) => {
    setEditingRule(rule);
    setFormCode(rule.code || '');
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

    const generatedCode = formCode.trim().toUpperCase() || `A${violationRules.length + 1}`;

    if (editingRule) {
      const updated: ViolationRule = {
        ...editingRule,
        code: generatedCode,
        name: formName.trim(),
        category: formCategory,
        defaultPoints: Number(formPoints) || 5,
        suggestedIntervention: formIntervention.trim(),
      };
      onEditRule(updated);
      setNotice(`Aturan [${updated.code}] "${updated.name}" berhasil diperbarui.`);
    } else {
      const newRule: ViolationRule = {
        id: `vr-${Date.now()}`,
        code: generatedCode,
        name: formName.trim(),
        category: formCategory,
        defaultPoints: Number(formPoints) || 5,
        suggestedIntervention: formIntervention.trim() || 'Refleksi disiplin dan komitmen tata tertib siswa.',
      };
      onAddRule(newRule);
      setNotice(`Aturan baru [${newRule.code}] "${newRule.name}" berhasil ditambahkan ke katalog.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotice(null), 3500);
  };

  // Handle Delete with Confirmation
  const handleDelete = (rule: ViolationRule) => {
    if (confirm(`Hapus aturan jenis pelanggaran [${rule.code || ''}]:\n"${rule.name}"?`)) {
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

  // Filtered and Sorted Rules
  const filteredRules = useMemo(() => {
    const list = violationRules.filter((rule) => {
      if (selectedCategory !== 'ALL' && rule.category !== selectedCategory) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchCode = rule.code?.toLowerCase().includes(q);
        const matchName = rule.name.toLowerCase().includes(q);
        const matchIntervention = rule.suggestedIntervention?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchIntervention) return false;
      }
      return true;
    });
    return sortViolationRules(list);
  }, [violationRules, selectedCategory, searchQuery]);

  // Counts
  const totalCount = violationRules.length;
  const ringanCount = violationRules.filter((r) => r.category === 'Ringan').length;
  const sedangCount = violationRules.filter((r) => r.category === 'Sedang').length;
  const beratCount = violationRules.filter((r) => r.category === 'Berat').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner with Claymorphism */}
      <div className="relative overflow-hidden rounded-[36px] bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-clay-card border border-white/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white flex items-center justify-center shadow-clay-button shrink-0">
              <SlidersHorizontal className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#332F3A] tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Manajemen Aturan Pelanggaran
              </h2>
              <p className="text-sm text-[#635F69] mt-1 font-medium">
                Kelola katalog tata tertib: input, edit, dan hapus jenis pelanggaran beserta bobot poin dan restitusi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-2xl bg-white/90 text-[#635F69] hover:text-[#332F3A] font-extrabold text-xs transition-all shadow-clay-button active:scale-[0.92] flex items-center justify-center gap-2 cursor-pointer"
              title="Kembalikan ke aturan standar awal"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Standar</span>
            </button>

            <button
              type="button"
              id="add-new-rule-btn"
              onClick={handleOpenCreateModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aturan Baru</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-clay-surface animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* Optional Points Mode Toggle Card */}
      <div className={`p-6 rounded-[32px] backdrop-blur-xl border transition-all shadow-clay-card ${
        enablePointsSystem 
          ? 'bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-white/70 border-emerald-200' 
          : 'bg-white/80 border-white/60'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-clay-button shrink-0 ${
              enablePointsSystem ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-[#EFEBF5] text-[#635F69]'
            }`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-black text-[#332F3A] text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>Mode Sistem Poin Pelanggaran</h3>
                <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-clay-surface ${
                  enablePointsSystem 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-[#EFEBF5] text-[#635F69]'
                }`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {enablePointsSystem ? 'AKTIF (Mode Poin)' : 'NONAKTIF (Fokus Restoratif)'}
                </span>
              </div>
              <p className="text-xs text-[#635F69] mt-1 font-medium">
                {enablePointsSystem
                  ? 'Sistem mencatat dan menampilkan angka bobot poin pelanggaran serta akumulasi poin setiap siswa.'
                  : 'Sistem menyembunyikan perhitungan angka poin dan murni berfokus pada pendekatan Disiplin Positif Restoratif, dokumentasi foto & berkas pembinaan.'}
              </p>
            </div>
          </div>

          {onTogglePointsSystem && (
            <button
              type="button"
              onClick={() => onTogglePointsSystem(!enablePointsSystem)}
              className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] ${
                enablePointsSystem
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {enablePointsSystem ? 'Nonaktifkan Sistem Poin' : 'Aktifkan Sistem Poin'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-white/60 hover:-translate-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#635F69] uppercase tracking-wider" style={{ fontFamily: 'Nunito, sans-serif' }}>Total Aturan</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center shadow-clay-surface">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#332F3A] mt-2 tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>{totalCount}</div>
          <div className="text-xs text-[#635F69] mt-1 font-medium">Katalog aktif di sistem</div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-sky-200/60 hover:-translate-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-sky-700 uppercase tracking-wider" style={{ fontFamily: 'Nunito, sans-serif' }}>Pelanggaran Ringan</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-clay-surface">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-sky-700 mt-2 tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>{ringanCount}</div>
          {enablePointsSystem && (
            <div className="text-xs text-sky-600/90 mt-1 font-semibold">
              Bobot poin 5 - 10
            </div>
          )}
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-amber-200/60 hover:-translate-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider" style={{ fontFamily: 'Nunito, sans-serif' }}>Pelanggaran Sedang</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-clay-surface">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2 tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>{sedangCount}</div>
          {enablePointsSystem && (
            <div className="text-xs text-amber-600/90 mt-1 font-semibold">
              Bobot poin 15 - 25
            </div>
          )}
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 backdrop-blur-xl shadow-clay-card border border-rose-200/60 hover:-translate-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-700 uppercase tracking-wider" style={{ fontFamily: 'Nunito, sans-serif' }}>Pelanggaran Berat</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-clay-surface">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2 tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>{beratCount}</div>
          {enablePointsSystem && (
            <div className="text-xs text-rose-600/90 mt-1 font-semibold">
              Bobot poin 30 - 50+
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[32px] bg-white/80 p-6 backdrop-blur-xl shadow-clay-card border border-white/60 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-clay-button -translate-y-0.5'
                  : 'bg-[#EFEBF5] text-[#635F69] shadow-clay-pressed hover:bg-white'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Ringan')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'Ringan'
                  ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-clay-button -translate-y-0.5'
                  : 'bg-[#EFEBF5] text-[#635F69] shadow-clay-pressed hover:bg-white'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Ringan ({ringanCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Sedang')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'Sedang'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-clay-button -translate-y-0.5'
                  : 'bg-[#EFEBF5] text-[#635F69] shadow-clay-pressed hover:bg-white'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Sedang ({sedangCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Berat')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'Berat'
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-clay-button -translate-y-0.5'
                  : 'bg-[#EFEBF5] text-[#635F69] shadow-clay-pressed hover:bg-white'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Berat ({beratCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#635F69]" />
            <input
              type="text"
              placeholder="Cari nama jenis pelanggaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#EFEBF5] rounded-2xl text-xs text-[#332F3A] placeholder-[#635F69] shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-[36px] bg-white/80 backdrop-blur-xl shadow-clay-card border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100/80 to-purple-50/50 text-[#635F69] font-black text-xs uppercase tracking-wider border-b border-slate-200/60" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <th className="py-4 px-4 text-center w-14">No</th>
                <th className="py-4 px-4 text-center w-24">Kode</th>
                <th className="py-4 px-5 min-w-[260px]">Jenis Pelanggaran</th>
                <th className="py-4 px-4 text-center w-32">Kategori</th>
                {enablePointsSystem && (
                  <th className="py-4 px-4 text-center w-32">Poin Standar</th>
                )}
                <th className="py-4 px-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={enablePointsSystem ? 6 : 5} className="py-16 text-center text-[#635F69]">
                    <div className="w-16 h-16 rounded-full bg-[#EFEBF5] text-[#635F69] flex items-center justify-center mx-auto mb-3 shadow-clay-surface">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <span className="font-bold">Tidak ada aturan jenis pelanggaran yang sesuai filter.</span>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => {
                  let badgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
                  if (rule.category === 'Sedang') {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (rule.category === 'Berat') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr key={rule.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-4 px-4 text-center text-[#635F69] font-bold">{idx + 1}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl font-mono text-xs font-black bg-slate-800 text-white shadow-clay-surface">
                          {rule.code || `A${idx + 1}`}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-black text-[#332F3A] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{rule.name}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black border shadow-clay-surface ${badgeClass}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {rule.category}
                        </span>
                      </td>
                      {enablePointsSystem && (
                        <td className="py-4 px-4 text-center">
                          <span className="font-black text-[#332F3A] bg-[#EFEBF5] px-3 py-1 rounded-xl shadow-clay-pressed" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {rule.defaultPoints} Poin
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-2 rounded-xl bg-white/90 hover:bg-white text-[#635F69] hover:text-[#7C3AED] shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                            title="Edit Aturan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-clay-surface hover:-translate-y-0.5 active:scale-[0.92] transition-all cursor-pointer"
                            title="Hapus Aturan"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#332F3A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-lg w-full border border-white/60 shadow-clay-card overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-clay-surface">
                  <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {editingRule ? 'Edit Aturan Jenis Pelanggaran' : 'Tambah Aturan Jenis Pelanggaran Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 sm:p-8 space-y-5 text-xs">
              {/* Kode & Nama Jenis Pelanggaran */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block font-black text-[#332F3A] mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Kode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: A1"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-3 bg-[#EFEBF5] rounded-2xl text-[#332F3A] font-mono font-black shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 text-xs uppercase"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block font-black text-[#332F3A] mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Nama Jenis Pelanggaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Terlambat datang ke sekolah..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl text-[#332F3A] font-bold shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 text-xs"
                  />
                </div>
              </div>

              {/* Kategori & Poin */}
              <div className={enablePointsSystem ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                <div>
                  <label className="block font-black text-[#332F3A] mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Kategori Pelanggaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ViolationCategory;
                      setFormCategory(cat);
                      if (!editingRule) {
                        if (cat === 'Ringan') setFormPoints(5);
                        else if (cat === 'Sedang') setFormPoints(15);
                        else if (cat === 'Berat') setFormPoints(35);
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl text-[#332F3A] font-extrabold shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 text-xs cursor-pointer"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>

                {enablePointsSystem && (
                  <div>
                    <label className="block font-black text-[#332F3A] mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Bobot Poin Standar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={formPoints}
                      onChange={(e) => setFormPoints(parseInt(e.target.value, 10) || 5)}
                      className="w-full px-4 py-3 bg-[#EFEBF5] rounded-2xl text-[#332F3A] font-black shadow-clay-pressed focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-[#EFEBF5] hover:bg-white text-[#635F69] font-black transition-all shadow-clay-button active:scale-[0.92] active:shadow-clay-pressed cursor-pointer"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black transition-all shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] active:shadow-clay-pressed cursor-pointer flex items-center gap-2"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
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
