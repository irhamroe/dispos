import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  Copy,
  Key,
  Layers,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';
import {
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  removeCustomFirebaseConfig,
  isFirebaseConfigured,
  FirebaseConfig,
  getDb
} from '../services/firebase';
import {
  batchSaveDocuments,
  fetchAllDocuments,
  COLLECTIONS
} from '../services/firestoreService';
import { Student, AttendanceRecord, DisciplineRecord, WaliKelasTeacher, ViolationRule, AdminUser } from '../types';
import { RombelClass } from '../data/initialData';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: RombelClass[];
  waliKelasList: WaliKelasTeacher[];
  attendanceRecords: AttendanceRecord[];
  disciplineRecords: DisciplineRecord[];
  violationRules: ViolationRule[];
  users: AdminUser[];
  onDataSynced?: (data: {
    students?: Student[];
    classes?: RombelClass[];
    waliKelasList?: WaliKelasTeacher[];
    attendanceRecords?: AttendanceRecord[];
    disciplineRecords?: DisciplineRecord[];
    violationRules?: ViolationRule[];
  }) => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  waliKelasList,
  attendanceRecords,
  disciplineRecords,
  violationRules,
  users,
  onDataSynced,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'sync' | 'guide'>('config');
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [measurementId, setMeasurementId] = useState('');

  const [pasteSnippet, setPasteSnippet] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Sync / Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getFirebaseConfig();
      if (currentConfig) {
        setApiKey(currentConfig.apiKey || '');
        setAuthDomain(currentConfig.authDomain || '');
        setProjectId(currentConfig.projectId || '');
        setStorageBucket(currentConfig.storageBucket || '');
        setMessagingSenderId(currentConfig.messagingSenderId || '');
        setAppId(currentConfig.appId || '');
        setMeasurementId(currentConfig.measurementId || '');
        setIsConfigured(true);
      } else {
        setIsConfigured(false);
      }
      setTestStatus('idle');
      setTestMessage('');
      setSyncSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-parse pasted Firebase SDK Snippet
  const handleParseSnippet = (text: string) => {
    setPasteSnippet(text);
    try {
      const apiKeyMatch = text.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = text.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = text.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = text.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = text.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = text.match(/appId:\s*["']([^"']+)["']/);
      const measurementIdMatch = text.match(/measurementId:\s*["']([^"']+)["']/);

      if (apiKeyMatch) setApiKey(apiKeyMatch[1]);
      if (authDomainMatch) setAuthDomain(authDomainMatch[1]);
      if (projectIdMatch) setProjectId(projectIdMatch[1]);
      if (storageBucketMatch) setStorageBucket(storageBucketMatch[1]);
      if (messagingSenderIdMatch) setMessagingSenderId(messagingSenderIdMatch[1]);
      if (appIdMatch) setAppId(appIdMatch[1]);
      if (measurementIdMatch) setMeasurementId(measurementIdMatch[1]);
    } catch (e) {
      console.error('Error parsing snippet', e);
    }
  };

  const handleSaveConfig = () => {
    if (!apiKey || !projectId) {
      alert('Mohon isi minimal API Key dan Project ID!');
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
      measurementId: measurementId.trim(),
    };

    saveCustomFirebaseConfig(config);
    setIsConfigured(true);
    setTestStatus('success');
    setTestMessage('Konfigurasi Firebase berhasil disimpan dan diaktifkan!');
  };

  const handleResetConfig = () => {
    if (confirm('Hapus konfigurasi kustom Firebase dari browser dan kembali ke mode lokal?')) {
      removeCustomFirebaseConfig();
      setApiKey('');
      setAuthDomain('');
      setProjectId('');
      setStorageBucket('');
      setMessagingSenderId('');
      setAppId('');
      setMeasurementId('');
      setPasteSnippet('');
      setIsConfigured(false);
      setTestStatus('idle');
      setTestMessage('Konfigurasi Firebase telah direset.');
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Mencoba menyambungkan ke Cloud Firestore...');

    try {
      const db = getDb();
      if (!db) {
        setTestStatus('error');
        setTestMessage('Firebase belum dikonfigurasi dengan benar.');
        return;
      }

      // Test reading classes collection
      await fetchAllDocuments(COLLECTIONS.CLASSES);
      setTestStatus('success');
      setTestMessage('Koneksi ke Cloud Firestore BERHASIL! Siap untuk membaca dan menulis data.');
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(`Koneksi gagal: ${error?.message || 'Pastikan Firestore Rules mengizinkan read/write.'}`);
    }
  };

  // Upload all local data to Firestore
  const handleUploadAllDataToFirestore = async () => {
    if (!isConfigured) {
      alert('Harap simpan dan hubungkan konfigurasi Firebase terlebih dahulu!');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin mengunggah semua data lokal (36 Rombel, ~1.300 Siswa, Absensi, dll) ke Cloud Firestore?')) {
      return;
    }

    setIsUploading(true);
    setSyncSuccessMsg('');

    try {
      // 1. Classes
      setUploadProgress({ current: 0, total: classes.length, label: 'Mengunggah 36 Rombel Kelas...' });
      await batchSaveDocuments(COLLECTIONS.CLASSES, classes);

      // 2. Wali Kelas
      setUploadProgress({ current: 0, total: waliKelasList.length, label: 'Mengunggah Data Wali Kelas...' });
      await batchSaveDocuments(COLLECTIONS.WALI_KELAS, waliKelasList);

      // 3. Violation Rules
      setUploadProgress({ current: 0, total: violationRules.length, label: 'Mengunggah Katalog Pelanggaran...' });
      await batchSaveDocuments(COLLECTIONS.VIOLATION_RULES, violationRules);

      // 4. Students
      setUploadProgress({ current: 0, total: students.length, label: `Mengunggah ${students.length} Data Siswa...` });
      await batchSaveDocuments(COLLECTIONS.STUDENTS, students, (cur, tot) => {
        setUploadProgress({ current: cur, total: tot, label: `Mengunggah ${cur} / ${tot} Siswa...` });
      });

      // 5. Attendance
      setUploadProgress({ current: 0, total: attendanceRecords.length, label: 'Mengunggah Rekap Absensi...' });
      await batchSaveDocuments(COLLECTIONS.ATTENDANCE, attendanceRecords, (cur, tot) => {
        setUploadProgress({ current: cur, total: tot, label: `Mengunggah ${cur} / ${tot} Absensi...` });
      });

      // 6. Discipline
      if (disciplineRecords.length > 0) {
        setUploadProgress({ current: 0, total: disciplineRecords.length, label: 'Mengunggah Rekor Disiplin...' });
        await batchSaveDocuments(COLLECTIONS.DISCIPLINE, disciplineRecords);
      }

      setSyncSuccessMsg('Semua data master & absensi berhasil diunggah ke Cloud Firestore!');
    } catch (error: any) {
      alert(`Gagal mengunggah data: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Pull / Download data from Firestore
  const handleDownloadFromFirestore = async () => {
    if (!isConfigured) {
      alert('Harap simpan dan hubungkan konfigurasi Firebase terlebih dahulu!');
      return;
    }

    setIsDownloading(true);
    setSyncSuccessMsg('');

    try {
      const [remoteClasses, remoteWali, remoteStudents, remoteAttendance, remoteDiscipline, remoteRules] =
        await Promise.all([
          fetchAllDocuments<RombelClass>(COLLECTIONS.CLASSES),
          fetchAllDocuments<WaliKelasTeacher>(COLLECTIONS.WALI_KELAS),
          fetchAllDocuments<Student>(COLLECTIONS.STUDENTS),
          fetchAllDocuments<AttendanceRecord>(COLLECTIONS.ATTENDANCE),
          fetchAllDocuments<DisciplineRecord>(COLLECTIONS.DISCIPLINE),
          fetchAllDocuments<ViolationRule>(COLLECTIONS.VIOLATION_RULES),
        ]);

      if (onDataSynced) {
        onDataSynced({
          classes: remoteClasses.length > 0 ? remoteClasses : undefined,
          waliKelasList: remoteWali.length > 0 ? remoteWali : undefined,
          students: remoteStudents.length > 0 ? remoteStudents : undefined,
          attendanceRecords: remoteAttendance.length > 0 ? remoteAttendance : undefined,
          disciplineRecords: remoteDiscipline.length > 0 ? remoteDiscipline : undefined,
          violationRules: remoteRules.length > 0 ? remoteRules : undefined,
        });
      }

      setSyncSuccessMsg(
        `Berhasil menarik ${remoteStudents.length} siswa, ${remoteClasses.length} kelas, dan ${remoteAttendance.length} rekap absensi dari Firestore!`
      );
    } catch (error: any) {
      alert(`Gagal mengambil data dari Firestore: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <Database className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Koneksi Database Firebase</h2>
              <p className="text-xs text-white/80">Cloud Firestore NoSQL & Sinkronisasi Real-Time</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Konfigurasi API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Sinkron & Migrasi Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Panduan Setup Console
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Status Alert */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {isConfigured
                    ? `Firebase Aktif (${projectId || 'Terkonfigurasi'})`
                    : 'Firebase Belum Terhubung'}
                </div>
                <div className="text-[11px] opacity-80">
                  {isConfigured
                    ? 'Aplikasi siap melakukan penyimpanan data ke Cloud Firestore.'
                    : 'Saat ini aplikasi berjalan dalam mode Offline (LocalStorage).'}
                </div>
              </div>
            </div>

            {isConfigured && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Tes Ping</span>
              </button>
            )}
          </div>

          {testMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                testStatus === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : testStatus === 'error'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {testMessage}
            </div>
          )}

          {/* TAB 1: CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Quick Paste Snippet */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Auto-Fill: Paste Konfigurasi Firebase dari Console
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={pasteSnippet}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder='Tempel (paste) kode SDK di sini, contoh: const firebaseConfig = { apiKey: "AIza...", projectId: "..." };'
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    API Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Project ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="sman1batu-dispos-app"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="sman1batu.firebaseapp.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="sman1batu.appspot.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:1234567890:web:abcdef"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                {isConfigured ? (
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Kredensial</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Aktifkan Firebase</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SYNC & MIGRATION */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 flex items-start gap-2.5">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold">Migrasi & Sinkronisasi Koleksi Firestore</span>
                  <p className="mt-0.5 opacity-90">
                    Unggah seluruh data lokal awal (36 Rombel, ~1.300 Siswa, Aturan Pelanggaran) ke Firestore agar dapat diakses dari perangkat manapun secara bersamaan.
                  </p>
                </div>
              </div>

              {uploadProgress && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
                      {uploadProgress.label}
                    </span>
                    <span>
                      {uploadProgress.total > 0
                        ? `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`
                        : ''}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          uploadProgress.total > 0
                            ? (uploadProgress.current / uploadProgress.total) * 100
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {syncSuccessMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Upload Button */}
                <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-teal-600" />
                      <span>Upload Lokal ➔ Firestore</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kirim {students.length} Siswa, 36 Rombel, dan data absensi lokal ke database Cloud Firestore.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadAllDataToFirestore}
                    disabled={isUploading || !isConfigured}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploading ? 'Sedang Mengunggah...' : 'Unggah Data ke Cloud'}</span>
                  </button>
                </div>

                {/* Download Button */}
                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <DownloadCloud className="w-4 h-4 text-blue-600" />
                      <span>Tarik Firestore ➔ Lokal</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ambil pembaruan terkini dari Cloud Firestore dan terapkan pada sesi aplikasi saat ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadFromFirestore}
                    disabled={isDownloading || !isConfigured}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>{isDownloading ? 'Sedang Menarik Data...' : 'Tarik Data dari Cloud'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Langkah-Langkah Membuat Database di Firebase Console:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                  <li>
                    Buka{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-600 font-bold underline inline-flex items-center gap-0.5"
                    >
                      Firebase Console <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    dan klik <strong>Add project</strong>.
                  </li>
                  <li>
                    Beri nama project (contoh: <code>sman1batu-dispos</code>) dan selesaikan pembuatan.
                  </li>
                  <li>
                    Di menu kiri, pilih <strong>Build ➔ Firestore Database</strong>, lalu klik{' '}
                    <strong>Create database</strong>.
                  </li>
                  <li>
                    Pilih lokasi database (contoh: <code>asia-southeast2 (Jakarta)</code>) dan pilih{' '}
                    <strong>Start in test mode</strong> (agar dapat membaca dan menulis data).
                  </li>
                  <li>
                    Klik <strong>Project Settings (Ikon Gerigi)</strong> di kiri atas ➔ tab <strong>General</strong> ➔ scroll ke bawah ke <strong>Your apps</strong> ➔ klik ikon Web (<code>&lt;/&gt;</code>).
                  </li>
                  <li>
                    Salin (copy) kode konfigurasi <code>firebaseConfig</code> dan tempelkan pada tab <strong>1. Konfigurasi API</strong> di aplikasi ini.
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900">
                <strong>Aturan Keamanan (Firestore Rules):</strong>
                <pre className="mt-1 p-2 bg-white rounded-lg border border-amber-300 font-mono text-[10px] overflow-x-auto text-slate-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Mode pengembangan / internal sekolah
    }
  }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Sistem Informasi Absensi & Dispos SMAN 1 Batu</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
