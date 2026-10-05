/**
 * Google Drive Integration Service
 * Digunakan untuk mengunggah Foto Bukti Pembinaan, Surat Bukti Pembinaan,
 * dan Foto Profil Siswa langsung ke Google Drive agar database Firestore
 * tidak terbebani ukuran file (base64).
 */

export interface GoogleDriveConfig {
  scriptUrl: string; // URL Web App dari Google Apps Script (e.g. https://script.google.com/macros/s/.../exec)
  photoFolderId?: string; // Optional: Folder ID khusus Foto Bukti Pembinaan di Google Drive
  evidenceFolderId?: string; // Optional: Folder ID khusus Surat Bukti Pembinaan di Google Drive
  studentPhotoFolderId?: string; // Optional: Folder ID khusus Foto Profil Siswa di Google Drive
  photoFolderName?: string; // Default: 'Foto Bukti Pembinaan'
  evidenceFolderName?: string; // Default: 'Surat Bukti Pembinaan'
  studentPhotoFolderName?: string; // Default: 'Foto Siswa'
  enabled: boolean;
}

const GDRIVE_CONFIG_STORAGE_KEY = 'app_sman1batu_gdrive_config_v1';

export const DEFAULT_GDRIVE_CONFIG: GoogleDriveConfig = {
  scriptUrl: (import.meta as any).env?.VITE_GDRIVE_SCRIPT_URL || '',
  photoFolderId: (import.meta as any).env?.VITE_GDRIVE_PHOTO_FOLDER_ID || '',
  evidenceFolderId: (import.meta as any).env?.VITE_GDRIVE_DOC_FOLDER_ID || '',
  studentPhotoFolderId: (import.meta as any).env?.VITE_GDRIVE_STUDENT_PHOTO_FOLDER_ID || '',
  photoFolderName: 'Foto Bukti Pembinaan',
  evidenceFolderName: 'Surat Bukti Pembinaan',
  studentPhotoFolderName: 'Foto Siswa',
  enabled: true,
};

// Ambil konfigurasi saat ini dari LocalStorage atau default
export const getGoogleDriveConfig = (): GoogleDriveConfig => {
  try {
    const saved = localStorage.getItem(GDRIVE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_GDRIVE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Gagal membaca konfigurasi Google Drive dari localStorage:', e);
  }
  return DEFAULT_GDRIVE_CONFIG;
};

/**
 * Ekstrak Folder ID dari input (bisa berupa ID langsung atau link URL folder Google Drive)
 */
export const extractGoogleDriveFolderId = (input?: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  // Format link folder: /folders/FOLDER_ID atau id=FOLDER_ID
  const matchFolder = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (matchFolder && matchFolder[1]) return matchFolder[1];

  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  return trimmed;
};

// Simpan konfigurasi ke LocalStorage
export const saveGoogleDriveConfig = (config: Partial<GoogleDriveConfig>): GoogleDriveConfig => {
  const current = getGoogleDriveConfig();
  const updated: GoogleDriveConfig = {
    ...current,
    ...config,
    scriptUrl: config.scriptUrl ? config.scriptUrl.trim() : current.scriptUrl,
    photoFolderId: config.photoFolderId !== undefined ? extractGoogleDriveFolderId(config.photoFolderId) : current.photoFolderId,
    evidenceFolderId: config.evidenceFolderId !== undefined ? extractGoogleDriveFolderId(config.evidenceFolderId) : current.evidenceFolderId,
    studentPhotoFolderId: config.studentPhotoFolderId !== undefined ? extractGoogleDriveFolderId(config.studentPhotoFolderId) : current.studentPhotoFolderId,
  };
  try {
    localStorage.setItem(GDRIVE_CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Gagal menyimpan konfigurasi Google Drive:', e);
  }
  return updated;
};

// Cek apakah Google Drive Web App sudah dikonfigurasi dan aktif
export const isGoogleDriveConfigured = (): boolean => {
  const config = getGoogleDriveConfig();
  return Boolean(config.enabled && config.scriptUrl && config.scriptUrl.trim().startsWith('https://script.google.com/'));
};

export interface UploadResult {
  success: boolean;
  fileUrl: string; // URL Pratinjau / Share Google Drive
  directUrl?: string; // URL Gambar Langsung / Thumbnail Google Drive
  downloadUrl?: string;
  fileId?: string;
  fileName: string;
  folderName?: string;
  error?: string;
}

/**
 * Konversi File menjadi Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Ekstrak File ID dari Google Drive URL
 */
export const extractGoogleDriveFileId = (url?: string): string | null => {
  if (!url) return null;
  // Match /d/FILE_ID or id=FILE_ID
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
};

/**
 * Dapatkan URL gambar langsung dari Google Drive untuk tag <img src="...">
 */
export const getGoogleDriveDirectImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url; // Base64 data

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    // lh3.googleusercontent.com atau drive.google.com/thumbnail memberikan render gambar terbaik & cepat tanpa CORS issue
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
};

/**
 * Dapatkan URL tampilan web Google Drive untuk dibuka di tab baru
 */
export const getGoogleDriveViewUrl = (url?: string): string => {
  if (!url) return '';
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }
  return url;
};

/**
 * Unggah file ke Google Drive menggunakan Google Apps Script Web App
 */
export const uploadFileToGoogleDrive = async (
  file: File,
  folderType: 'photo' | 'evidence' | 'student_photo',
  metadata?: {
    studentName?: string;
    className?: string;
    nisn?: string;
    violationName?: string;
  }
): Promise<UploadResult> => {
  const config = getGoogleDriveConfig();

  if (!isGoogleDriveConfigured()) {
    return {
      success: false,
      fileUrl: '',
      fileName: file.name,
      error: 'Google Drive Apps Script belum dikonfigurasi. Silakan atur URL Web App di Pengaturan Google Drive.',
    };
  }

  try {
    const base64Data = await fileToBase64(file);

    // Format nama file rapi jika ada info siswa
    let customFileName = file.name;
    const cleanExt = file.name.split('.').pop() || 'jpg';
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (metadata?.studentName) {
      const sanitizedStudent = metadata.studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const sanitizedClass = (metadata.className || 'Umum').replace(/[^a-zA-Z0-9_-]/g, '_');
      const sanitizedNisn = (metadata.nisn || '').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (folderType === 'student_photo') {
        const nisnPart = sanitizedNisn ? `_${sanitizedNisn}` : '';
        customFileName = `Foto_Siswa_${sanitizedClass}${nisnPart}_${sanitizedStudent}.${cleanExt}`;
      } else if (folderType === 'photo') {
        customFileName = `Foto_Pembinaan_${sanitizedClass}_${sanitizedStudent}_${timestamp}.${cleanExt}`;
      } else {
        customFileName = `Surat_Pembinaan_${sanitizedClass}_${sanitizedStudent}_${timestamp}.${cleanExt}`;
      }
    }

    const payload = {
      action: 'upload',
      base64Data: base64Data,
      fileName: customFileName,
      mimeType: file.type || 'application/octet-stream',
      folderType: folderType, // 'photo' | 'evidence' | 'student_photo'
      photoFolderId: config.photoFolderId || '',
      evidenceFolderId: config.evidenceFolderId || '',
      studentPhotoFolderId: config.studentPhotoFolderId || '',
      photoFolderName: config.photoFolderName || 'Foto Bukti Pembinaan',
      evidenceFolderName: config.evidenceFolderName || 'Surat Bukti Pembinaan',
      studentPhotoFolderName: config.studentPhotoFolderName || 'Foto Siswa',
      studentName: metadata?.studentName || '',
      className: metadata?.className || '',
      nisn: metadata?.nisn || '',
    };

    // Menggunakan text/plain untuk menghindari CORS Preflight (OPTIONS) di Google Apps Script
    const response = await fetch(config.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.status === 'success' || result.success) {
      const fileId = result.fileId || extractGoogleDriveFileId(result.fileUrl);
      const directUrl = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : result.directUrl || result.fileUrl;
      const fileUrl = result.fileUrl || (fileId ? `https://drive.google.com/file/d/${fileId}/view?usp=sharing` : '');

      let fallbackFolderName = 'Foto Siswa';
      if (folderType === 'photo') fallbackFolderName = config.photoFolderName || 'Foto Bukti Pembinaan';
      if (folderType === 'evidence') fallbackFolderName = config.evidenceFolderName || 'Surat Bukti Pembinaan';
      if (folderType === 'student_photo') fallbackFolderName = config.studentPhotoFolderName || 'Foto Siswa';

      return {
        success: true,
        fileUrl: fileUrl,
        directUrl: directUrl,
        downloadUrl: result.downloadUrl,
        fileId: fileId,
        fileName: result.fileName || customFileName,
        folderName: result.folderName || fallbackFolderName,
      };
    } else {
      return {
        success: false,
        fileUrl: '',
        fileName: file.name,
        error: result.message || 'Gagal mengunggah file ke Google Drive (Respon script menunjukkan error).',
      };
    }
  } catch (err: any) {
    console.error('Error saat upload ke Google Drive:', err);
    return {
      success: false,
      fileUrl: '',
      fileName: file.name,
      error: err?.message || 'Terjadi kesalahan jaringan saat mengunggah ke Google Drive.',
    };
  }
};

/**
 * Uji koneksi ke Google Apps Script Web App
 */
export const testGoogleDriveConnection = async (scriptUrl?: string): Promise<{ success: boolean; message: string }> => {
  const url = scriptUrl || getGoogleDriveConfig().scriptUrl;
  if (!url || !url.trim().startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'URL Google Apps Script tidak valid. Harus diawali dengan https://script.google.com/',
    };
  }

  try {
    const payload = {
      action: 'ping',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Koneksi gagal: HTTP ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (data.status === 'success' || data.success || data.message) {
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Drive Apps Script berhasil terhubung!',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Script merespon dengan status bukan success.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi endpoint: ${err?.message || 'Periksa koneksi internet atau hak akses Deploy Web App (Pilih Anyone).'}`
    };
  }
};

/**
 * Kode Google Apps Script siap pakai untuk dipasang pengguna di script.google.com
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: PENYIMPANAN FOTO PEMBINAAN, SURAT, & FOTO SISWA DI GOOGLE DRIVE
 * =========================================================================
 * 
 * CARA PASANG:
 * 1. Buka https://script.google.com lalu klik "New Project" (Proyek Baru).
 * 2. Hapus semua kode yang ada di editor, lalu PASTE kode di bawah ini seluruhnya.
 * 3. Klik menu "Deploy" -> "New deployment".
 * 4. Pilih tipe "Web app" (ikon gear/roda gigi).
 * 5. Isi konfigurasi:
 *    - Description: Upload Media Dispos (Foto Siswa, Bukti Pembinaan, Surat)
 *    - Execute as: Me (email akun Google Anda)
 *    - Who has access: Anyone (Siapa saja, TANPA login) -> Sangat penting!
 * 6. Klik "Deploy", beri izin akses Google Drive saat diminta (Authorize Access).
 * 7. Salin "Web app URL" (format: https://script.google.com/macros/s/.../exec).
 * 8. Tempelkan URL tersebut ke Pengaturan Google Drive di Aplikasi Sistem Disiplin.
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Google Drive Apps Script Web App untuk Dispos aktif dan siap menerima upload.'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Tidak ada data POST yang diterima.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);

    // Endpoint PING / TEST
    if (data.action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Koneksi ke Google Drive Apps Script berhasil!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Endpoint UPLOAD FILE
    var base64Data = data.base64Data || '';
    var fileName = data.fileName || ('File_' + new Date().getTime());
    var mimeType = data.mimeType || 'application/octet-stream';
    var folderType = data.folderType || 'photo'; // 'photo', 'evidence', atau 'student_photo'
    
    // Potong header data URL jika ada (e.g. data:image/jpeg;base64,)
    if (base64Data.indexOf('base64,') > -1) {
      base64Data = base64Data.split('base64,')[1];
    }

    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);

    // Tentukan folder target (Folder berbeda untuk Foto Pembinaan, Surat Bukti, dan Foto Siswa)
    var targetFolderName = 'Foto Siswa';
    var customFolderId = data.studentPhotoFolderId;

    if (folderType === 'evidence') {
      targetFolderName = data.evidenceFolderName || 'Surat Bukti Pembinaan';
      customFolderId = data.evidenceFolderId;
    } else if (folderType === 'photo') {
      targetFolderName = data.photoFolderName || 'Foto Bukti Pembinaan';
      customFolderId = data.photoFolderId;
    } else if (folderType === 'student_photo') {
      targetFolderName = data.studentPhotoFolderName || 'Foto Siswa';
      customFolderId = data.studentPhotoFolderId;
    }
    
    // Helper ekstrak folder ID jika user memasukkan link URL lengkap
    function cleanFolderId(input) {
      if (!input) return '';
      var str = input.toString().trim();
      var matchF = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (matchF && matchF[1]) return matchF[1];
      var matchI = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchI && matchI[1]) return matchI[1];
      return str;
    }

    var targetFolder = null;

    // 1. Cek jika ada custom folder ID
    var cleanedId = cleanFolderId(customFolderId);
    if (cleanedId && cleanedId !== '') {
      try {
        targetFolder = DriveApp.getFolderById(cleanedId);
      } catch (err) {
        targetFolder = null;
      }
    }

    // 2. Jika tidak ada ID khusus atau ID salah, cari atau buat folder sesuai nama
    if (!targetFolder) {
      var folders = DriveApp.getFoldersByName(targetFolderName);
      if (folders.hasNext()) {
        targetFolder = folders.next();
      } else {
        targetFolder = DriveApp.createFolder(targetFolderName);
      }
    }

    // Buat file di dalam folder target
    var file = targetFolder.createFile(blob);
    
    // Set permission agar bisa dilihat oleh siapa saja yang memiliki link
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (permErr) {
      // Abaikan jika akun workspace memiliki kebijakan khusus
    }

    var fileId = file.getId();
    var fileUrl = file.getUrl();
    var directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    var downloadUrl = file.getDownloadUrl();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileId: fileId,
      fileUrl: fileUrl,
      directUrl: directUrl,
      downloadUrl: downloadUrl,
      fileName: fileName,
      folderName: targetFolder.getName()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
