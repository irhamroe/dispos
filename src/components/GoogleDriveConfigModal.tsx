import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  FolderCheck, 
  HelpCircle, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  Cloud,
  HardDrive,
  FolderOpen
} from 'lucide-react';
import { 
  getGoogleDriveConfig, 
  saveGoogleDriveConfig, 
  testGoogleDriveConnection, 
  GOOGLE_APPS_SCRIPT_CODE,
  isGoogleDriveConfigured,
  extractGoogleDriveFolderId,
  GoogleDriveConfig
} from '../services/googleDriveService';

interface GoogleDriveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const GoogleDriveConfigModal: React.FC<GoogleDriveConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<GoogleDriveConfig>(getGoogleDriveConfig);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'tutorial'>('settings');

  useEffect(() => {
    if (isOpen) {
      setConfig(getGoogleDriveConfig());
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!config.scriptUrl || !config.scriptUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGoogleDriveConnection(config.scriptUrl.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal terhubung ke endpoint.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoogleDriveConfig(config);
    setSaveSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const isConfigured = isGoogleDriveConfigured();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Cloud className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                Penyimpanan Google Drive
                {isConfigured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Belum Dikonfigurasi
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-200/80">
                Simpan Foto & Surat Bukti Pembinaan langsung ke Google Drive agar database tetap ringan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Pengaturan & URL Endpoint
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'tutorial'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Panduan & Kode Script (Gratis)
          </button>
        </div>

        {/* Tab Content: Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Otomatisasi 3 Folder Google Drive:</span> Berkas akan otomatis disimpan di folder terpisah untuk <span className="font-semibold text-emerald-800">Foto Siswa</span>, <span className="font-semibold text-emerald-800">Foto Bukti Pembinaan</span>, dan <span className="font-semibold text-emerald-800">Surat Bukti Pembinaan</span>.
              </div>
            </div>

            {/* Script URL Input */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs flex items-center justify-between">
                <span>URL Web App Google Apps Script</span>
                <span className="text-emerald-700 font-normal">Format: https://script.google.com/.../exec</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={config.scriptUrl}
                onChange={(e) => setConfig({ ...config, scriptUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Dapatkan URL ini dari deploy Web App Google Apps Script Anda (lihat tab Panduan).
              </p>
            </div>

            {/* 3 Folders Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* 1. Folder Foto Siswa */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-purple-600" />
                  <span>Folder Foto Siswa</span>
                </label>
                <input
                  type="text"
                  placeholder="Foto Siswa"
                  value={config.studentPhotoFolderName || 'Foto Siswa'}
                  onChange={(e) => setConfig({ ...config, studentPhotoFolderName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
                <input
                  type="text"
                  placeholder="ID / Link Folder Google Drive"
                  value={config.studentPhotoFolderId || ''}
                  onChange={(e) => setConfig({ ...config, studentPhotoFolderId: extractGoogleDriveFolderId(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 mt-1.5 focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">ID atau URL link folder profil siswa.</p>
              </div>

              {/* 2. Folder Foto Bukti Pembinaan */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Folder Foto Bukti</span>
                </label>
                <input
                  type="text"
                  placeholder="Foto Bukti Pembinaan"
                  value={config.photoFolderName || 'Foto Bukti Pembinaan'}
                  onChange={(e) => setConfig({ ...config, photoFolderName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
                <input
                  type="text"
                  placeholder="ID / Link Folder Google Drive"
                  value={config.photoFolderId || ''}
                  onChange={(e) => setConfig({ ...config, photoFolderId: extractGoogleDriveFolderId(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 mt-1.5 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">ID atau URL link folder bukti pembinaan.</p>
              </div>

              {/* 3. Folder Surat Bukti Pembinaan */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Folder Surat Bukti</span>
                </label>
                <input
                  type="text"
                  placeholder="Surat Bukti Pembinaan"
                  value={config.evidenceFolderName || 'Surat Bukti Pembinaan'}
                  onChange={(e) => setConfig({ ...config, evidenceFolderName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
                <input
                  type="text"
                  placeholder="ID / Link Folder Google Drive"
                  value={config.evidenceFolderId || ''}
                  onChange={(e) => setConfig({ ...config, evidenceFolderId: extractGoogleDriveFolderId(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 mt-1.5 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">ID atau URL link folder surat bertandatangan.</p>
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !config.scriptUrl}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 border border-slate-300 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{testing ? 'Menguji Koneksi...' : 'Uji Koneksi Google Drive'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <FolderCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Pengaturan Tersimpan!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Content: Tutorial */}
        {activeTab === 'tutorial' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800">Panduan Pemasangan Google Apps Script (1 Menit)</h4>
                <p className="text-xs text-slate-500">Gunakan akun Google Anda secara gratis tanpa batasan waktu.</p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kode Berhasil Disalin!' : 'Salin Kode Script'}</span>
              </button>
            </div>

            {/* Step list */}
            <ol className="space-y-3 text-xs text-slate-700 list-decimal list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li className="leading-relaxed">
                Buka{' '}
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                >
                  script.google.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                dan klik tombol <strong>New Project (Proyek Baru)</strong>.
              </li>
              <li className="leading-relaxed">
                Hapus seluruh isi editor bawaan, lalu <strong>Paste (Tempel)</strong> kode script yang telah Anda salin.
              </li>
              <li className="leading-relaxed">
                Klik tombol biru <strong>Deploy</strong> di pojok kanan atas, lalu pilih <strong>New deployment (Penerapan baru)</strong>.
              </li>
              <li className="leading-relaxed">
                Klik ikon roda gigi ⚙️ di sebelah kiri dan pilih jenis <strong>Web app</strong>.
              </li>
              <li className="leading-relaxed">
                Atur pengaturan berikut:
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600">
                  <li><strong>Execute as:</strong> Me (Email Google Anda)</li>
                  <li><strong>Who has access:</strong> <span className="text-rose-600 font-bold">Anyone (Siapa saja)</span> <em>(Penting agar aplikasi dapat mengirim foto/surat tanpa popup login)</em></li>
                </ul>
              </li>
              <li className="leading-relaxed">
                Klik <strong>Deploy</strong>, lakukan <strong>Authorize access</strong> jika diminta izin Google Drive.
              </li>
              <li className="leading-relaxed">
                Salin <strong>Web app URL</strong> (berakhiran <code>/exec</code>), lalu tempelkan ke tab <strong>Pengaturan & URL Endpoint</strong> di modal ini.
              </li>
            </ol>

            {/* Code Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-600">Pratinjau Kode Google Apps Script (Code.gs):</span>
                <span className="text-[10px] text-slate-400">Siap pakai & otomatis membuat 2 folder</span>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-56 leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Saya Sudah Punya URL, Lanjut Pengaturan →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
