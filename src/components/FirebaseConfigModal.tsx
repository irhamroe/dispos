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
import { Student, AttendanceRecord, DisciplineRecord, WaliKelasTeacher, ViolationRule, AdminUser, StudentPermitRecord } from '../types';
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
  studentPermits?: StudentPermitRecord[];
  onDataSynced?: (data: {
    students?: Student[];
    classes?: RombelClass[];
    waliKelasList?: WaliKelasTeacher[];
    attendanceRecords?: AttendanceRecord[];
    disciplineRecords?: DisciplineRecord[];
    violationRules?: ViolationRule[];
    studentPermits?: StudentPermitRecord[];
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
  studentPermits = [],
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

      // 7. Student Permits
      if (studentPermits.length > 0) {
        setUploadProgress({ current: 0, total: studentPermits.length, label: 'Mengunggah Data Izin & Dispensasi Siswa...' });
        await batchSaveDocuments(COLLECTIONS.STUDENT_PERMITS, studentPermits);
      }

      setSyncSuccessMsg('Semua data master, absensi & permohonan izin berhasil diunggah ke Cloud Firestore!');
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
      const [remoteClasses, remoteWali, remoteStudents, remoteAttendance, remoteDiscipline, remoteRules, remotePermits] =
        await Promise.all([
          fetchAllDocuments<RombelClass>(COLLECTIONS.CLASSES),
          fetchAllDocuments<WaliKelasTeacher>(COLLECTIONS.WALI_KELAS),
          fetchAllDocuments<Student>(COLLECTIONS.STUDENTS),
          fetchAllDocuments<AttendanceRecord>(COLLECTIONS.ATTENDANCE),
          fetchAllDocuments<DisciplineRecord>(COLLECTIONS.DISCIPLINE),
          fetchAllDocuments<ViolationRule>(COLLECTIONS.VIOLATION_RULES),
          fetchAllDocuments<StudentPermitRecord>(COLLECTIONS.STUDENT_PERMITS),
        ]);

      if (onDataSynced) {
        onDataSynced({
          classes: remoteClasses.length > 0 ? remoteClasses : undefined,
          waliKelasList: remoteWali.length > 0 ? remoteWali : undefined,
          students: remoteStudents.length > 0 ? remoteStudents : undefined,
          attendanceRecords: remoteAttendance.length > 0 ? remoteAttendance : undefined,
          disciplineRecords: remoteDiscipline.length > 0 ? remoteDiscipline : undefined,
          violationRules: remoteRules.length > 0 ? remoteRules : undefined,
          studentPermits: remotePermits.length > 0 ? remotePermits : undefined,
        });
      }

      setSyncSuccessMsg(
        `Berhasil menarik ${remoteStudents.length} siswa, ${remoteClasses.length} kelas, ${remoteAttendance.length} rekap absensi, dan ${remotePermits.length} permohonan izin dari Firestore!`
      );
    } catch (error: any) {
      alert(`Gagal mengambil data dari Firestore: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[32px] shadow-sm border border-white/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-amber-500 via-teal-600 to-[#0284C7] text-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg font-black" >Koneksi Database Firebase</h2>
              <p className="text-xs text-white/90">Cloud Firestore NoSQL & Sinkronisasi Real-Time</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sky-100/50 bg-[#F8FAFC] px-6 sm:px-8 pt-3 gap-2.5 text-xs font-black shrink-0" >
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-4 rounded-t-2xl transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-white text-[#0284C7] shadow-xs border-b-2 border-[#0284C7]'
                : 'text-[#334155] hover:text-[#0F172A]'
            }`}
          >
            1. Konfigurasi API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-4 rounded-t-2xl transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-white text-[#0284C7] shadow-xs border-b-2 border-[#0284C7]'
                : 'text-[#334155] hover:text-[#0F172A]'
            }`}
          >
            2. Sinkron & Migrasi Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-4 rounded-t-2xl transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-[#0284C7] shadow-xs border-b-2 border-[#0284C7]'
                : 'text-[#334155] hover:text-[#0F172A]'
            }`}
          >
            3. Panduan Setup
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Status Alert */}
          <div
            className={`p-4 rounded-[24px] border flex items-center justify-between shadow-sm transition-all ${
              isConfigured
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="font-black text-sm" >
                  {isConfigured
                    ? `Firebase Aktif (${projectId || 'Terkonfigurasi'})`
                    : 'Firebase Belum Terhubung'}
                </div>
                <div className="text-[11px] text-[#334155] font-medium mt-0.5">
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
                className="px-4 py-2 rounded-2xl bg-white border border-emerald-300 text-emerald-800 font-black hover:bg-emerald-50 flex items-center gap-2 shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer shrink-0"
                
              >
                <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Tes Ping</span>
              </button>
            )}
          </div>

          {testMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold shadow-xs ${
                testStatus === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : testStatus === 'error'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {testMessage}
            </div>
          )}

          {/* TAB 1: CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Quick Paste Snippet */}
              <div className="p-4 bg-[#F8FAFC] border border-white/80 rounded-[24px] shadow-none space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F172A] flex items-center gap-2 text-xs" >
                    <Sparkles className="w-4 h-4 text-[#0284C7]" />
                    Auto-Fill: Paste Konfigurasi Firebase dari Console
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={pasteSnippet}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder='Tempel (paste) kode SDK di sini, contoh: const firebaseConfig = { apiKey: "AIza...", projectId: "..." };'
                  className="w-full p-3 bg-white border border-white/80 rounded-2xl font-mono text-[11px] text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1.5" >
                    API Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl font-mono text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1.5" >
                    Project ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="sman1batu-dispos-app"
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl font-mono text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1.5" >
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="sman1batu.firebaseapp.com"
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl font-mono text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1.5" >
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="sman1batu.appspot.com"
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl font-mono text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1.5" >
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl font-mono text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1.5" >
                    App ID
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:1234567890:web:abcdef"
                    className="w-full px-4 py-3 bg-[#E2F1FD] rounded-2xl font-mono text-xs font-semibold text-[#0F172A] placeholder-[#334155]/60 shadow-none focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-sky-100/50">
                {isConfigured ? (
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-2xl font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:-translate-y-0.5 active:scale-95 border border-rose-200"
                    
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
                  className="px-6 py-2.5 bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#9333EA] hover:to-[#6D28D9] text-white font-black rounded-2xl shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                  
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan &amp; Aktifkan Firebase</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SYNC & MIGRATION */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-[24px] text-sky-950 flex items-start gap-3 shadow-sm">
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-black text-sm block" >Migrasi &amp; Sinkronisasi Koleksi Firestore</span>
                  <p className="mt-1 leading-relaxed text-[#334155]">
                    Unggah seluruh data lokal awal (36 Rombel, ~1.300 Siswa, Aturan Pelanggaran) ke Firestore agar dapat diakses dari perangkat manapun secara bersamaan.
                  </p>
                </div>
              </div>

              {uploadProgress && (
                <div className="p-4 bg-[#F8FAFC] rounded-[24px] border border-white/80 shadow-none space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-[#0F172A]" >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#0284C7] animate-spin" />
                      {uploadProgress.label}
                    </span>
                    <span>
                      {uploadProgress.total > 0
                        ? `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`
                        : ''}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-[#E0F2FE] to-[#0284C7] h-2.5 rounded-full transition-all duration-300"
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
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[24px] font-black flex items-center gap-2.5 shadow-xs" >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Upload Button */}
                <div className="p-5 rounded-[28px] border border-sky-200 bg-sky-50/50 flex flex-col justify-between space-y-4 shadow-sm">
                  <div>
                    <div className="font-black text-sm text-[#0F172A] flex items-center gap-2" >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] text-white flex items-center justify-center shadow-xs">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <span>Upload Lokal ➔ Firestore</span>
                    </div>
                    <p className="text-[11px] text-[#334155] mt-2 leading-relaxed">
                      Kirim {students.length} Siswa, 36 Rombel, dan data absensi lokal ke database Cloud Firestore.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadAllDataToFirestore}
                    disabled={isUploading || !isConfigured}
                    className="w-full py-3 bg-gradient-to-br from-[#E0F2FE] to-[#0284C7] hover:from-[#9333EA] hover:to-[#6D28D9] disabled:bg-slate-300 text-white font-black rounded-2xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploading ? 'Sedang Mengunggah...' : 'Unggah Data ke Cloud'}</span>
                  </button>
                </div>

                {/* Download Button */}
                <div className="p-5 rounded-[28px] border border-sky-200 bg-sky-50/50 flex flex-col justify-between space-y-4 shadow-sm">
                  <div>
                    <div className="font-black text-sm text-[#0F172A] flex items-center gap-2" >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center shadow-xs">
                        <DownloadCloud className="w-4 h-4" />
                      </div>
                      <span>Tarik Firestore ➔ Lokal</span>
                    </div>
                    <p className="text-[11px] text-[#334155] mt-2 leading-relaxed">
                      Ambil pembaruan terkini dari Cloud Firestore dan terapkan pada sesi aplikasi saat ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadFromFirestore}
                    disabled={isDownloading || !isConfigured}
                    className="w-full py-3 bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 disabled:bg-slate-300 text-white font-black rounded-2xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.92] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    
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
            <div className="space-y-4 text-[#0F172A] leading-relaxed">
              <div className="p-5 bg-[#F8FAFC] border border-white/80 rounded-[28px] shadow-none space-y-3">
                <div className="font-black text-[#0F172A] text-sm flex items-center gap-2" >
                  <span>Langkah-Langkah Membuat Database di Firebase Console:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-[11px] text-[#334155] font-medium leading-relaxed">
                  <li>
                    Buka{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0284C7] font-black underline inline-flex items-center gap-1"
                      
                    >
                      Firebase Console <ExternalLink className="w-3.5 h-3.5" />
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

              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-[24px] text-[11px] text-amber-950 shadow-xs">
                <strong className="font-black" >Aturan Keamanan (Firestore Rules):</strong>
                <pre className="mt-2 p-3 bg-white/90 rounded-xl border border-amber-200 font-mono text-[10.5px] overflow-x-auto text-[#0F172A] shadow-inner">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Mode internal sekolah
    }
  }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-[#F8FAFC] border-t border-sky-100/50 flex items-center justify-between text-xs text-[#334155]">
          <span className="font-bold" >Sistem Informasi Absensi &amp; Dispos SMAN 1 Batu</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-50 text-[#0F172A] font-extrabold rounded-xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-white/60"
            
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
