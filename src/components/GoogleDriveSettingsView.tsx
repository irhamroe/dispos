import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  HardDrive, 
  FolderOpen, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  Save,
  ArrowRight,
  ShieldCheck,
  FileText,
  Camera,
  FolderCheck
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

export const GoogleDriveSettingsView: React.FC = () => {
  const [config, setConfig] = useState<GoogleDriveConfig>(getGoogleDriveConfig);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'tutorial'>('settings');

  useEffect(() => {
    setConfig(getGoogleDriveConfig());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    showToast('Kode Google Apps Script berhasil disalin ke clipboard!');
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
      if (res.success) {
        showToast('Koneksi ke Google Drive Apps Script berhasil terhubung!');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal terhubung ke endpoint Google Apps Script.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoogleDriveConfig(config);
    showToast('Pengaturan Google Drive berhasil disimpan!');
  };

  const isConfigured = isGoogleDriveConfigured();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 sm:p-8 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#0284C7]/15 text-[#0284C7] border border-[#0284C7]/20 shadow-xs">
                Integrasi Cloud Storage
              </span>
              <span className="text-[#334155]/40 text-xs">•</span>
              <span className="text-[#334155] text-xs font-bold">SMAN 1 Batu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center shadow-xs">
                <Cloud className="w-5 h-5" />
              </div>
              <span>Pengaturan Google Drive</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1.5 max-w-2xl leading-relaxed">
              Konfigurasi penyimpanan otomatis foto profil siswa, foto bukti kejadian pelanggaran, serta berkas surat pembinaan langsung ke folder Google Drive sekolah.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isConfigured ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black">Google Drive Aktif</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-black">Belum Dikonfigurasi</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pt-6 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Konfigurasi Folder &amp; Web App</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              activeTab === 'tutorial'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panduan Pasang Apps Script</span>
          </button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: URL Apps Script */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#0F172A] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">1</span>
                  <span>URL Web App Google Apps Script</span>
                </h2>
                <p className="text-xs text-[#475569] font-medium mt-0.5">
                  URL hasil publikasi Web App dari proyek Apps Script akun Google Drive Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !config.scriptUrl}
                  className="px-3.5 py-2 text-xs font-extrabold rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>
              </div>
            </div>

            <input
              type="url"
              required
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={config.scriptUrl}
              onChange={(e) => setConfig({ ...config, scriptUrl: e.target.value })}
              className="w-full px-4 py-3 bg-[#E2F1FD]/70 border border-sky-200 rounded-2xl text-xs font-mono font-medium text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-sky-500 shadow-2xs transition-all"
            />

            {/* Test result message */}
            {testResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 font-bold ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 2: Folder Target di Google Drive */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#0F172A] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">2</span>
                <span>Folder Penyimpanan di Google Drive</span>
              </h2>
              <p className="text-xs text-[#475569] font-medium mt-0.5">
                Masukkan link URL folder atau ID foldernya langsung. Jika dikosongkan, folder akan dibuat otomatis dengan nama default di root Google Drive Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Folder 1: Foto Profil Siswa */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs hover:border-sky-300 transition-all">
                <label className="block font-black text-[#0F172A] text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-sky-600" />
                    <span>1. Foto Profil Siswa</span>
                  </span>
                  <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-md">Master Data</span>
                </label>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Nama Folder (Default: Foto Siswa):</span>
                  <input
                    type="text"
                    placeholder="Foto Siswa"
                    value={config.studentPhotoFolderName || 'Foto Siswa'}
                    onChange={(e) => setConfig({ ...config, studentPhotoFolderName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-[#0F172A] shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">ID / Link Folder Google Drive:</span>
                  <input
                    type="text"
                    placeholder="Contoh: https://drive.google.com/drive/folders/1abc..."
                    value={config.studentPhotoFolderId || ''}
                    onChange={(e) => setConfig({ ...config, studentPhotoFolderId: extractGoogleDriveFolderId(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#E2F1FD] border border-sky-200 rounded-xl text-xs font-mono font-semibold text-[#0F172A] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Folder 2: Foto Kejadian Pelanggaran */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs hover:border-rose-300 transition-all">
                <label className="block font-black text-[#0F172A] text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-rose-600" />
                    <span>2. Foto Kejadian Pelanggaran</span>
                  </span>
                  <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-md">Disiplin</span>
                </label>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Nama Folder (Default: Foto Pelanggaran):</span>
                  <input
                    type="text"
                    placeholder="Foto Pelanggaran"
                    value={config.violationPhotoFolderName || 'Foto Pelanggaran'}
                    onChange={(e) => setConfig({ ...config, violationPhotoFolderName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-[#0F172A] shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">ID / Link Folder Google Drive:</span>
                  <input
                    type="text"
                    placeholder="Contoh: https://drive.google.com/drive/folders/1abc..."
                    value={config.violationPhotoFolderId || ''}
                    onChange={(e) => setConfig({ ...config, violationPhotoFolderId: extractGoogleDriveFolderId(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#E2F1FD] border border-sky-200 rounded-xl text-xs font-mono font-semibold text-[#0F172A] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Folder 3: Foto Bukti Pembinaan */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs hover:border-emerald-300 transition-all">
                <label className="block font-black text-[#0F172A] text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-emerald-600" />
                    <span>3. Foto Bukti Pembinaan</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">Pembinaan</span>
                </label>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Nama Folder (Default: Foto Bukti Pembinaan):</span>
                  <input
                    type="text"
                    placeholder="Foto Bukti Pembinaan"
                    value={config.photoFolderName || 'Foto Bukti Pembinaan'}
                    onChange={(e) => setConfig({ ...config, photoFolderName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-[#0F172A] shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">ID / Link Folder Google Drive:</span>
                  <input
                    type="text"
                    placeholder="Contoh: https://drive.google.com/drive/folders/1abc..."
                    value={config.photoFolderId || ''}
                    onChange={(e) => setConfig({ ...config, photoFolderId: extractGoogleDriveFolderId(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#E2F1FD] border border-sky-200 rounded-xl text-xs font-mono font-semibold text-[#0F172A] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Folder 4: Surat Bukti Pembinaan */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs hover:border-amber-300 transition-all">
                <label className="block font-black text-[#0F172A] text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-amber-600" />
                    <span>4. Surat Bukti Pembinaan (Dokumen)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md">Dokumen</span>
                </label>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Nama Folder (Default: Surat Bukti Pembinaan):</span>
                  <input
                    type="text"
                    placeholder="Surat Bukti Pembinaan"
                    value={config.evidenceFolderName || 'Surat Bukti Pembinaan'}
                    onChange={(e) => setConfig({ ...config, evidenceFolderName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-[#0F172A] shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">ID / Link Folder Google Drive:</span>
                  <input
                    type="text"
                    placeholder="Contoh: https://drive.google.com/drive/folders/1abc..."
                    value={config.evidenceFolderId || ''}
                    onChange={(e) => setConfig({ ...config, evidenceFolderId: extractGoogleDriveFolderId(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#E2F1FD] border border-sky-200 rounded-xl text-xs font-mono font-semibold text-[#0F172A] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Status Aktifasi & Tombol Simpan */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-5 h-5 rounded-lg text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <div>
                <span className="text-xs sm:text-sm font-black text-[#0F172A] block">Aktifkan Unggah ke Google Drive</span>
                <span className="text-[11px] text-[#475569]">File foto &amp; dokumen otomatis disimpan ke Google Drive saat diunggah.</span>
              </div>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      ) : (
        /* Tutorial Tab */
        <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Panduan Pemasangan Google Apps Script</span>
              </h2>
              <p className="text-xs text-[#475569] font-medium mt-0.5">
                Ikuti 5 langkah sederhana berikut untuk menghubungkan akun Google Drive sekolah dengan aplikasi.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-extrabold text-xs transition-all shadow-2xs cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode Skrip'}</span>
            </button>
          </div>

          <ol className="space-y-4 text-xs text-[#334155] font-medium leading-relaxed list-decimal list-inside">
            <li className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900">Buka Google Apps Script:</strong> Buka tautan{' '}
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 font-bold underline inline-flex items-center gap-1"
              >
                script.google.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              menggunakan akun Google Drive sekolah, lalu klik tombol <strong>"New project" (Proyek Baru)</strong>.
            </li>
            <li className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900">Ganti Kode Bawaan:</strong> Hapus seluruh kode yang ada di editor (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">myFunction</code>), lalu <strong>Paste/Tempel kode</strong> yang sudah Anda salin di bawah ini.
            </li>
            <li className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900">Deploy sebagai Web App:</strong> Klik menu <strong>Deploy</strong> (kanan atas) &rarr; pilih <strong>New deployment</strong>.
            </li>
            <li className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900">Atur Hak Akses Web App:</strong>
              <ul className="list-disc list-inside ml-4 mt-1.5 space-y-1 text-slate-700">
                <li>Klik ikon roda gigi &rarr; pilih <strong>Web app</strong>.</li>
                <li><strong>Execute as:</strong> <em>Me (email akun Google Anda)</em>.</li>
                <li><strong>Who has access:</strong> <strong className="text-rose-600">Anyone (Siapa saja)</strong> &mdash; <em>Sangat penting agar upload dari aplikasi berhasil tanpa login berulang.</em></li>
              </ul>
            </li>
            <li className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900">Salin URL &amp; Simpan:</strong> Klik <strong>Deploy</strong>, izinkan akses saat diminta (Authorize Access), lalu salin <strong>Web app URL</strong> yang berakhiran <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">/exec</code> dan tempelkan ke tab <em>Konfigurasi Folder &amp; Web App</em> di atas.
            </li>
          </ol>

          {/* Code Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Kode Google Apps Script Siap Pakai:</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800 shadow-inner">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
