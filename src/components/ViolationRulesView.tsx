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
import { MdCard, MdBadge, MdButton, MdInput, MdSelect } from './md3';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ViolationRule | null>(null);
  
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ViolationCategory>('Ringan');
  const [formPoints, setFormPoints] = useState<number>(5);
  const [formIntervention, setFormIntervention] = useState('');

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormCode('');
    setFormName('');
    setFormCategory('Ringan');
    setFormPoints(5);
    setFormIntervention('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: ViolationRule) => {
    setEditingRule(rule);
    setFormCode(rule.code || '');
    setFormName(rule.name);
    setFormCategory(rule.category);
    setFormPoints(rule.defaultPoints);
    setFormIntervention(rule.suggestedIntervention || '');
    setIsModalOpen(true);
  };

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

  const handleDelete = (rule: ViolationRule) => {
    if (confirm(`Hapus aturan jenis pelanggaran [${rule.code || ''}]:\n"${rule.name}"?`)) {
      onDeleteRule(rule.id);
      setNotice(`Aturan "${rule.name}" telah dihapus.`);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan seluruh aturan jenis pelanggaran ke katalog standar SMAN 1 Batu?')) {
      onResetRules();
      setNotice('Katalog aturan pelanggaran berhasil dikembalikan ke pengaturan awal standar.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

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

  const totalCount = violationRules.length;
  const ringanCount = violationRules.filter((r) => r.category === 'Ringan').length;
  const sedangCount = violationRules.filter((r) => r.category === 'Sedang').length;
  const beratCount = violationRules.filter((r) => r.category === 'Berat').length;

  return (
    <div className="space-y-6 pb-12 font-roboto text-[#0F172A]">
      {/* Header Banner */}
      <MdCard variant="elevated" radius="large" className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-xs shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-medium text-[#0F172A] tracking-tight">
                Manajemen Aturan Pelanggaran
              </h2>
              <p className="text-sm text-[#334155] mt-1">
                Kelola katalog tata tertib: input, edit, dan hapus jenis pelanggaran beserta bobot poin dan restitusi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <MdButton
              variant="outlined"
              onClick={handleReset}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              <span>Reset Standar</span>
            </MdButton>

            <MdButton
              variant="filled"
              id="add-new-rule-btn"
              onClick={handleOpenCreateModal}
              icon={<Plus className="w-4 h-4" />}
            >
              <span>Tambah Aturan Baru</span>
            </MdButton>
          </div>
        </div>

        {notice && (
          <div className="mt-4 p-4 rounded-2xl bg-[#C8E6C9] text-[#1B5E20] text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#1B5E20] shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </MdCard>

      {/* Points Mode Toggle Card */}
      <MdCard variant="tonal" radius="large" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-xs shrink-0 ${
              enablePointsSystem ? 'bg-[#0284C7] text-white' : 'bg-[#E2F1FD] text-[#334155]'
            }`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-medium text-[#0369A1] text-base">Mode Sistem Poin Pelanggaran</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  enablePointsSystem 
                    ? 'bg-[#C8E6C9] text-[#1B5E20]' 
                    : 'bg-[#E2F1FD] text-[#334155]'
                }`}>
                  {enablePointsSystem ? 'AKTIF (Mode Poin)' : 'NONAKTIF (Fokus Restoratif)'}
                </span>
              </div>
              <p className="text-xs text-[#334155] mt-1">
                {enablePointsSystem
                  ? 'Sistem mencatat dan menampilkan angka bobot poin pelanggaran serta akumulasi poin setiap siswa.'
                  : 'Sistem menyembunyikan perhitungan angka poin dan murni berfokus pada pendekatan Disiplin Positif Restoratif, dokumentasi foto & berkas pembinaan.'}
              </p>
            </div>
          </div>

          {onTogglePointsSystem && (
            <MdButton
              variant={enablePointsSystem ? 'danger' : 'filled'}
              onClick={() => onTogglePointsSystem(!enablePointsSystem)}
            >
              {enablePointsSystem ? 'Nonaktifkan Sistem Poin' : 'Aktifkan Sistem Poin'}
            </MdButton>
          )}
        </div>
      </MdCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/60 p-5 rounded-[28px] shadow-xs border border-[#7DD3FC]/70 hover:-translate-y-1 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider">Total Aturan</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0369A1] mt-2 tracking-tight">{totalCount}</div>
          <div className="text-xs text-[#0369A1]/80 mt-1 font-medium">Katalog aktif di sistem</div>
        </div>

        <div className="bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]/60 p-5 rounded-[28px] shadow-xs border border-[#6EE7B7]/70 hover:-translate-y-1 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#047857] uppercase tracking-wider">Pelanggaran Ringan</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#047857] mt-2 tracking-tight">{ringanCount}</div>
          {enablePointsSystem && (
            <div className="text-xs text-[#065F46] font-semibold mt-1">
              Bobot poin 5 - 10
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/60 p-5 rounded-[28px] shadow-xs border border-[#FCD34D]/70 hover:-translate-y-1 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#B45309] uppercase tracking-wider">Pelanggaran Sedang</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#B45309] mt-2 tracking-tight">{sedangCount}</div>
          {enablePointsSystem && (
            <div className="text-xs text-[#92400E] font-semibold mt-1">
              Bobot poin 15 - 25
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/60 p-5 rounded-[28px] shadow-xs border border-[#FDA4AF]/70 hover:-translate-y-1 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#E11D48] uppercase tracking-wider">Pelanggaran Berat</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#E11D48] mt-2 tracking-tight">{beratCount}</div>
          {enablePointsSystem && (
            <div className="text-xs text-[#BE123C] font-semibold mt-1">
              Bobot poin 30 - 50+
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <MdCard variant="filled" radius="large" className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#E0F2FE]'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Ringan')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                selectedCategory === 'Ringan'
                  ? 'bg-[#0277BD] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#E1F5FE]'
              }`}
            >
              Ringan ({ringanCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Sedang')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                selectedCategory === 'Sedang'
                  ? 'bg-[#E65100] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#FFF3E0]'
              }`}
            >
              Sedang ({sedangCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Berat')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                selectedCategory === 'Berat'
                  ? 'bg-[#BA1A1A] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#FFDAD6]'
              }`}
            >
              Berat ({beratCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#334155]" />
            <input
              type="text"
              placeholder="Cari nama jenis pelanggaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#E2F1FD] rounded-full text-xs text-[#0F172A] placeholder-[#334155] focus:outline-hidden"
            />
          </div>
        </div>
      </MdCard>

      {/* Rules Table */}
      <div className="rounded-[32px] bg-[#F0F9FF] shadow-sm border border-[#E0F2FE] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E2F1FD]/80 text-[#334155] font-medium text-xs uppercase tracking-wider border-b border-[#E0F2FE]">
                <th className="py-3 px-4 text-center w-14">No</th>
                <th className="py-3 px-4 text-center w-24">Kode</th>
                <th className="py-3 px-5 min-w-[260px]">Jenis Pelanggaran</th>
                <th className="py-3 px-4 text-center w-32">Kategori</th>
                {enablePointsSystem && (
                  <th className="py-3 px-4 text-center w-32">Poin Standar</th>
                )}
                <th className="py-3 px-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE] text-xs">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={enablePointsSystem ? 6 : 5} className="py-16 text-center text-[#334155]">
                    <div className="w-12 h-12 rounded-full bg-[#E2F1FD] text-[#334155] flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="font-medium">Tidak ada aturan jenis pelanggaran yang sesuai filter.</span>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => {
                  let badgeClass = 'bg-[#E1F5FE] text-[#0277BD]';
                  if (rule.category === 'Sedang') {
                    badgeClass = 'bg-[#FFF3E0] text-[#E65100]';
                  } else if (rule.category === 'Berat') {
                    badgeClass = 'bg-[#FFDAD6] text-[#410002]';
                  }

                  return (
                    <tr key={rule.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 text-center text-[#334155] font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full font-mono text-xs font-bold bg-[#E2F1FD] text-[#0F172A]">
                          {rule.code || `A${idx + 1}`}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-medium text-[#0F172A] text-sm">{rule.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                          {rule.category}
                        </span>
                      </td>
                      {enablePointsSystem && (
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-[#0F172A] bg-[#E2F1FD] px-3 py-1 rounded-full">
                            {rule.defaultPoints} Poin
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-2 rounded-full bg-[#E0F2FE] text-[#0284C7] hover:bg-[#DFD3F3] active:scale-95 transition-all cursor-pointer"
                            title="Edit Aturan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule)}
                            className="p-2 rounded-full bg-[#FFDAD6] text-[#410002] hover:bg-[#FFCDD2] active:scale-95 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F8FAFC] rounded-[32px] max-w-lg w-full border border-[#E0F2FE] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-6 bg-[#0284C7] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-medium">
                  {editingRule ? 'Edit Aturan Jenis Pelanggaran' : 'Tambah Aturan Jenis Pelanggaran Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 sm:p-8 space-y-5 text-xs">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <MdInput
                    label="Kode *"
                    required
                    placeholder="Contoh: A1"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="col-span-3">
                  <MdInput
                    label="Nama Jenis Pelanggaran *"
                    required
                    placeholder="Contoh: Terlambat datang ke sekolah..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>

              <div className={enablePointsSystem ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                <div>
                  <MdSelect
                    label="Kategori Pelanggaran *"
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
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </MdSelect>
                </div>

                {enablePointsSystem && (
                  <div>
                    <MdInput
                      label="Bobot Poin Standar *"
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={formPoints}
                      onChange={(e) => setFormPoints(parseInt(e.target.value, 10) || 5)}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E0F2FE] flex items-center justify-end gap-3">
                <MdButton
                  type="button"
                  variant="text"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </MdButton>
                <MdButton
                  type="submit"
                  variant="filled"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  <span>{editingRule ? 'Simpan Perubahan' : 'Tambahkan Aturan'}</span>
                </MdButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
