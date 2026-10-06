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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1C1B1F]/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[32px] max-w-2xl w-full border border-white/80 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#6750A4] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <Cloud className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white flex items-center gap-2.5" >
                <span>Penyimpanan Google Drive</span>
                {isConfigured ? (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950 shadow-xs">
                    Aktif
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-xs">
                    Belum Dikonfigurasi
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Simpan Foto &amp; Surat Bukti Pembinaan langsung ke Google Drive agar database tetap ringan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-purple-100/50 bg-[#FFFBFE] px-6 sm:px-8 pt-3 gap-2.5 text-xs font-black" >
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-white text-emerald-700 shadow-xs border-b-2 border-emerald-600'
                : 'text-[#49454F] hover:text-[#1C1B1F]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Pengaturan &amp; URL Endpoint
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`pb-3 px-4 rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tutorial'
                ? 'bg-white text-emerald-700 shadow-xs border-b-2 border-emerald-600'
                : 'text-[#49454F] hover:text-[#1C1B1F]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Panduan &amp; Kode Script (Gratis)
          </button>
        </div>

        {/* Tab Content: Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-4">
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-[24px] text-xs text-emerald-950 flex items-start gap-3 shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-black text-sm block mb-0.5" >Otomatisasi 3 Folder Google Drive:</span> Berkas akan otomatis disimpan di folder terpisah untuk <strong className="font-extrabold text-emerald-900">Foto Siswa</strong>, <strong className="font-extrabold text-emerald-900">Foto Bukti Pembinaan</strong>, dan <strong className="font-extrabold text-emerald-900">Surat Bukti Pembinaan</strong>.
              </div>
            </div>

            {/* Script URL Input */}
            <div>
              <label className="block font-extrabold text-[#1C1B1F] mb-1.5 text-xs flex items-center justify-between" >
                <span>URL Web App Google Apps Script</span>
                <span className="text-emerald-700 font-bold">Format: https://script.google.com/.../exec</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={config.scriptUrl}
                onChange={(e) => setConfig({ ...config, scriptUrl: e.target.value })}
                className="w-full px-4 py-3 bg-[#E7E0EC] rounded-2xl text-[#1C1B1F] font-mono text-xs font-semibold shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200"
              />
              <p className="text-[11px] text-[#49454F] mt-1.5">
                Dapatkan URL ini dari deploy Web App Google Apps Script Anda (lihat tab Panduan).
              </p>
            </div>

            {/* 3 Folders Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              {/* 1. Folder Foto Siswa */}
              <div className="p-4 bg-[#FFFBFE] rounded-[24px] border border-white/80 shadow-sm space-y-2">
                <label className="block font-black text-[#1C1B1F] text-xs flex items-center gap-1.5" >
                  <FolderOpen className="w-4 h-4 text-purple-600" />
                  <span>Folder Foto Siswa</span>
                </label>
                <input
                  type="text"
                  placeholder="Foto Siswa"
                  value={config.studentPhotoFolderName || 'Foto Siswa'}
                  onChange={(e) => setConfig({ ...config, studentPhotoFolderName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-white/80 rounded-xl text-xs font-extrabold text-[#1C1B1F] shadow-xs"
                  
                />
                <input
                  type="text"
                  placeholder="ID / Link Folder"
                  value={config.studentPhotoFolderId || ''}
                  onChange={(e) => setConfig({ ...config, studentPhotoFolderId: extractGoogleDriveFolderId(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#E7E0EC] rounded-xl text-[11px] font-mono font-semibold text-[#1C1B1F] shadow-none focus:bg-white focus:outline-hidden"
                />
                <p className="text-[10px] text-[#49454F]">ID atau URL link folder profil siswa.</p>
              </div>

              {/* 2. Folder Foto Bukti Pembinaan */}
              <div className="p-4 bg-[#FFFBFE] rounded-[24px] border border-white/80 shadow-sm space-y-2">
                <label className="block font-black text-[#1C1B1F] text-xs flex items-center gap-1.5" >
                  <FolderOpen className="w-4 h-4 text-emerald-600" />
                  <span>Folder Foto Bukti</span>
                </label>
                <input
                  type="text"
                  placeholder="Foto Bukti Pembinaan"
                  value={config.photoFolderName || 'Foto Bukti Pembinaan'}
                  onChange={(e) => setConfig({ ...config, photoFolderName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-white/80 rounded-xl text-xs font-extrabold text-[#1C1B1F] shadow-xs"
                  
                />
                <input
                  type="text"
                  placeholder="ID / Link Folder"
                  value={config.photoFolderId || ''}
                  onChange={(e) => setConfig({ ...config, photoFolderId: extractGoogleDriveFolderId(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#E7E0EC] rounded-xl text-[11px] font-mono font-semibold text-[#1C1B1F] shadow-none focus:bg-white focus:outline-hidden"
                />
                <p className="text-[10px] text-[#49454F]">ID atau URL link folder bukti pembinaan.</p>
              </div>

              {/* 3. Folder Surat Bukti Pembinaan */}
              <div className="p-4 bg-[#FFFBFE] rounded-[24px] border border-white/80 shadow-sm space-y-2">
                <label className="block font-black text-[#1C1B1F] text-xs flex items-center gap-1.5" >
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>Folder Surat Bukti</span>
                </label>
                <input
                  type="text"
                  placeholder="Surat Bukti Pembinaan"
                  value={config.evidenceFolderName || 'Surat Bukti Pembinaan'}
                  onChange={(e) => setConfig({ ...config, evidenceFolderName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-white/80 rounded-xl text-xs font-extrabold text-[#1C1B1F] shadow-xs"
                  
                />
                <input
                  type="text"
                  placeholder="ID / Link Folder"
                  value={config.evidenceFolderId || ''}
                  onChange={(e) => setConfig({ ...config, evidenceFolderId: extractGoogleDriveFolderId(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#E7E0EC] rounded-xl text-[11px] font-mono font-semibold text-[#1C1B1F] shadow-none focus:bg-white focus:outline-hidden"
                />
                <p className="text-[10px] text-[#49454F]">ID atau URL link folder surat bertandatangan.</p>
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !config.scriptUrl}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-[#1C1B1F] font-black text-xs rounded-2xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 border border-white/60 cursor-pointer"
                  
                >
                  <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{testing ? 'Menguji Koneksi...' : 'Uji Koneksi Google Drive'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-3 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 shadow-xs ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                      : 'bg-rose-50 text-rose-950 border border-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <FolderCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-purple-100/50 flex items-center justify-between">
              <div>
                {saveSuccess && (
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5" >
                    <Check className="w-4 h-4" /> Pengaturan Tersimpan!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#49454F] rounded-2xl font-extrabold text-xs shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all border border-white/60"
                  
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white font-black text-xs rounded-2xl shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none transition-all cursor-pointer"
                  
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Content: Tutorial */}
        {activeTab === 'tutorial' && (
          <div className="p-6 sm:p-8 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-base text-[#1C1B1F]" >Panduan Pemasangan Google Apps Script (1 Menit)</h4>
                <p className="text-xs text-[#49454F]">Gunakan akun Google Anda secara gratis tanpa batasan waktu.</p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white font-black text-xs rounded-2xl transition-all flex items-center gap-2 shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kode Berhasil Disalin!' : 'Salin Kode Script'}</span>
              </button>
            </div>

            {/* Step list */}
            <ol className="space-y-3 text-xs text-[#1C1B1F] list-decimal list-inside bg-[#FFFBFE] p-5 rounded-[28px] border border-white/80 shadow-none font-medium leading-relaxed">
              <li>
                Buka{' '}
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-black text-emerald-700 hover:underline inline-flex items-center gap-1"
                  
                >
                  script.google.com <ExternalLink className="w-3.5 h-3.5" />
                </a>{' '}
                dan klik tombol <strong>New Project (Proyek Baru)</strong>.
              </li>
              <li>
                Hapus seluruh isi editor bawaan, lalu <strong>Paste (Tempel)</strong> kode script yang telah Anda salin.
              </li>
              <li>
                Klik tombol biru <strong>Deploy</strong> di pojok kanan atas, lalu pilih <strong>New deployment (Penerapan baru)</strong>.
              </li>
              <li>
                Klik ikon roda gigi ⚙️ di sebelah kiri dan pilih jenis <strong>Web app</strong>.
              </li>
              <li>
                Atur pengaturan berikut:
                <ul className="list-disc list-inside pl-4 mt-1.5 space-y-1 text-[#49454F]">
                  <li><strong>Execute as:</strong> Me (Email Google Anda)</li>
                  <li><strong>Who has access:</strong> <span className="text-rose-600 font-black">Anyone (Siapa saja)</span> <em>(Penting agar aplikasi dapat mengirim foto/surat tanpa popup login)</em></li>
                </ul>
              </li>
              <li>
                Klik <strong>Deploy</strong>, lakukan <strong>Authorize access</strong> jika diminta izin Google Drive.
              </li>
              <li>
                Salin <strong>Web app URL</strong> (berakhiran <code>/exec</code>), lalu tempelkan ke tab <strong>Pengaturan &amp; URL Endpoint</strong> di modal ini.
              </li>
            </ol>

            {/* Code Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-[#1C1B1F]" >Pratinjau Kode Google Apps Script (Code.gs):</span>
                <span className="text-[10px] text-[#49454F]">Siap pakai &amp; otomatis membuat 3 folder</span>
              </div>
              <pre className="p-4 bg-[#1C1B1F] text-emerald-300 font-mono text-[11px] rounded-[24px] overflow-x-auto max-h-56 leading-relaxed shadow-inner">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="px-5 py-2.5 bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white font-black text-xs rounded-2xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                
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
