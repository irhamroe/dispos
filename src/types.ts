export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'D';

export type LetterStatus = 'Sudah Ada Surat' | 'Belum Ada Surat';

export interface Student {
  id: string;
  nisn: string;
  name: string;
  classId: string;
  className: string;
  grade: 'X' | 'XI' | 'XII';
  gender: 'L' | 'P';
  phone?: string;
  parentPhone?: string;
  address?: string;
  photoUrl?: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  nisn: string;
  classId: string;
  className: string;
  status: AttendanceStatus; // H | I | S | A | D
  hasLetter?: LetterStatus; // Khusus untuk I (Izin) dan S (Sakit)
  notes?: string;
  timeRecorded: string;
  recordedBy: string;
}

export type ViolationCategory = 'Ringan' | 'Sedang' | 'Berat';
export type DisciplineStatus = 'Dalam Pantauan' | 'Selesai' | 'Perlu Tindak Lanjut BK';
export type CoachingStatus = 'Belum' | 'Sudah';

export interface ViolationRule {
  id: string;
  name: string;
  category: ViolationCategory;
  defaultPoints: number;
  suggestedIntervention: string;
}

export interface DisciplineRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  nisn: string;
  classId: string;
  className: string;
  category: ViolationCategory;
  violationName: string;
  points: number;
  description?: string;
  positiveIntervention?: string; // Tindakan pembinaan / restitusi positif
  status: DisciplineStatus;
  reportedBy: string;
  witnessOrStaff?: string;
  // Pembinaan
  coachingStatus: CoachingStatus; // Status Pembinaan: sudah / belum
  coachingDate?: string; // Tanggal Pembinaan
  coachingPhoto?: string; // Foto Pembinaan (base64 / image data)
  coachingPhotoName?: string;
  coachingEvidenceFile?: string; // Bukti Pembinaan (File Surat pembinaan)
  coachingEvidenceFileName?: string;
}

export type UserRole = 'Admin' | 'Wali Kelas' | 'Guru' | 'Tendik';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: UserRole | 'Administrator' | 'Guru Piket' | 'Guru BK';
  email?: string;
  phone?: string;
  nip?: string;
  assignedClass?: string; // Untuk Wali Kelas (misal X-1, XI-4)
  department?: string; // Untuk Guru (Mapel) atau Tendik (Bagian TU/Kesiswaan/Sarpras)
  avatar?: string;
  photoUrl?: string;
  status: 'Aktif' | 'Nonaktif';
  password?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface WaliKelasTeacher {
  id: string;
  name: string;
  nip: string;
  classId: string;
  className: string;
  grade: 'X' | 'XI' | 'XII';
  phone: string;
  email: string;
  status: 'PNS' | 'PPPK' | 'GTT';
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  principalName: string;
  principalNip: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export interface ClassData {
  id: string;
  name: string;
  grade: 'X' | 'XI' | 'XII';
  homeroom: string;
  totalStudents: number;
  room?: string;
}

export type RombelClass = ClassData;

export interface StudentRecapItem {
  studentId: string;
  nisn: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
  hadir: number; // H
  izin: number; // I
  sakit: number; // S
  alpa: number; // A
  dispen: number; // D
  suratLengkap: number; // Jumlah surat yang sudah ada untuk I & S
  suratBelumAda: number; // Jumlah surat yang belum ada
  totalDays: number;
  percentage: number;
}
