import { SchoolProfile, Student, AttendanceRecord, DisciplineRecord, AdminUser, AttendanceStatus, LetterStatus, WaliKelasTeacher, ViolationRule } from '../types';

export const initialSchoolProfile: SchoolProfile = {
  name: 'SMAN 1 Batu',
  npsn: '20517757',
  address: 'Jl. KH. Agus Salim No. 57, Sisir',
  city: 'Kota Batu',
  province: 'Jawa Timur',
  postalCode: '65314',
  principalName: 'Drs. Rr. Wulandari Wahyuningsih, M.Pd.',
  principalNip: '19690315 199412 2 002',
  academicYear: '2026/2027',
  semester: 'Ganjil',
};

// 36 Rombel: X-1 s/d X-12, XI-1 s/d XI-12, XII-1 s/d XII-12
export interface RombelClass {
  id: string;
  name: string;
  grade: 'X' | 'XI' | 'XII';
  number: number;
  homeroom: string;
  room?: string;
  capacity?: number;
}

export interface RawWaliKelasInput {
  grade: 'X' | 'XI' | 'XII';
  number: number;
  name: string;
  nip: string;
  phone: string;
  status: 'PNS' | 'PPPK' | 'GTT';
}

export const rawWaliKelasData: RawWaliKelasInput[] = [
  // A. KELAS X
  { grade: 'X', number: 1, name: 'Dini Ayupratiwi, S.Pd', nip: '19940728 202421 2 057', phone: '0812-3341-1001', status: 'PPPK' },
  { grade: 'X', number: 2, name: 'Devi Anggraeni, S.Pd', nip: '19890725 202421 2 041', phone: '0812-3341-1002', status: 'PPPK' },
  { grade: 'X', number: 3, name: 'Dewi Insya Siska, M.Pd', nip: '19780823 200604 2 029', phone: '0812-3341-1003', status: 'PNS' },
  { grade: 'X', number: 4, name: 'Sutejo, S.Pd', nip: '19730709 200604 1 013', phone: '0812-3341-1004', status: 'PNS' },
  { grade: 'X', number: 5, name: 'Suwil Roidah, S.Pd', nip: '19840712 202221 2 044', phone: '0812-3341-1005', status: 'PPPK' },
  { grade: 'X', number: 6, name: 'Nenni Setyo Utami, ST', nip: '19750312 201001 2 013', phone: '0812-3341-1006', status: 'PNS' },
  { grade: 'X', number: 7, name: 'Sri Nurhayani, S.Pd', nip: '19920814 202321 2 042', phone: '0812-3341-1007', status: 'PPPK' },
  { grade: 'X', number: 8, name: 'Eka Hidayatul Mukarromah, S.Pd.I', nip: '19870913 202421 2 024', phone: '0812-3341-1008', status: 'PPPK' },
  { grade: 'X', number: 9, name: 'Ahmad Muhajir RH, S.Pd', nip: '19820826 202221 1 011', phone: '0812-3341-1009', status: 'PPPK' },
  { grade: 'X', number: 10, name: 'Any Novitasari, S.Pd.', nip: '19861121 201001 2 014', phone: '0812-3341-1010', status: 'PNS' },
  { grade: 'X', number: 11, name: 'Diana Irawati, S.Pd', nip: '19810910 202421 2 008', phone: '0812-3341-1011', status: 'PPPK' },
  { grade: 'X', number: 12, name: 'Ratih Sukmawati, S.Pd', nip: '19800802 202421 2 014', phone: '0812-3341-1012', status: 'PPPK' },

  // B. KELAS XI
  { grade: 'XI', number: 1, name: 'Rini Wahyuningsih, S.Pd', nip: '19731012 200801 2 005', phone: '0812-3341-2001', status: 'PNS' },
  { grade: 'XI', number: 2, name: 'Didik Eko Susanto, S.Psi.', nip: '19760426 202221 1 003', phone: '0812-3341-2002', status: 'PPPK' },
  { grade: 'XI', number: 3, name: 'Sennawati, S.Pd', nip: '19680704 199803 2 006', phone: '0812-3341-2003', status: 'PNS' },
  { grade: 'XI', number: 4, name: 'Amitha Mustika Dhamayanti, S.Pd.', nip: '19920219 202321 2 039', phone: '0812-3341-2004', status: 'PPPK' },
  { grade: 'XI', number: 5, name: 'Moh. Irham Rozaki, S.Kom., Gr.', nip: '19891021 202221 1 017', phone: '0812-3341-2005', status: 'PPPK' },
  { grade: 'XI', number: 6, name: 'Hervina Sovia Rosa, S.Pd', nip: '19870724 202421 2 003', phone: '0812-3341-2006', status: 'PPPK' },
  { grade: 'XI', number: 7, name: 'Lailaus Naeni, S.S., S.Pd', nip: '19900507 202221 2 016', phone: '0812-3341-2007', status: 'PPPK' },
  { grade: 'XI', number: 8, name: 'Emy Khuriyah, S.Pd', nip: '19741114 200801 2 015', phone: '0812-3341-2008', status: 'PNS' },
  { grade: 'XI', number: 9, name: 'Widya Ningsih, S.Kom.', nip: '19830912 202221 2 036', phone: '0812-3341-2009', status: 'PPPK' },
  { grade: 'XI', number: 10, name: 'Aviv Ardhillah Risqa, S.Pd', nip: '19891204 202321 1 016', phone: '0812-3341-2010', status: 'PPPK' },
  { grade: 'XI', number: 11, name: 'Juhadi Ishak, S.Pd', nip: '19790709 202221 1 012', phone: '0812-3341-2011', status: 'PPPK' },
  { grade: 'XI', number: 12, name: 'Shinta Amalia, M.Pd', nip: '19681220 199412 2 002', phone: '0812-3341-2012', status: 'PNS' },

  // C. KELAS XII
  { grade: 'XII', number: 1, name: 'Indah Herawati, S.Si', nip: '19800430 201001 2 006', phone: '0812-3341-3001', status: 'PNS' },
  { grade: 'XII', number: 2, name: 'Reny Widayanti, S.E.', nip: '19721203 200604 2 005', phone: '0812-3341-3002', status: 'PNS' },
  { grade: 'XII', number: 3, name: 'Drs. Hari Prasetyo', nip: '19670523 199903 1 003', phone: '0812-3341-3003', status: 'PNS' },
  { grade: 'XII', number: 4, name: 'Maria Cicilia Tri Palupi, S.Pd.', nip: '19750111 200801 2 011', phone: '0812-3341-3004', status: 'PNS' },
  { grade: 'XII', number: 5, name: 'Distri Adi Setiawan, S.S', nip: '19831214 201101 1 005', phone: '0812-3341-3005', status: 'PNS' },
  { grade: 'XII', number: 6, name: 'Iwan Yudi Hernawan, S.Pd., M.Pd.', nip: '19750406 200501 1 016', phone: '0812-3341-3006', status: 'PNS' },
  { grade: 'XII', number: 7, name: 'Nita Rimayanti, S.Pd.', nip: '19860728 200903 2 005', phone: '0812-3341-3007', status: 'PNS' },
  { grade: 'XII', number: 8, name: 'Ardianto, S.Pd.', nip: '19740708 201001 1 008', phone: '0812-3341-3008', status: 'PNS' },
  { grade: 'XII', number: 9, name: 'Abdul Khamid, S.Pd', nip: '19690821 199403 1 005', phone: '0812-3341-3009', status: 'PNS' },
  { grade: 'XII', number: 10, name: 'Abdul Aziz, S.Kom.', nip: '19940623 202221 1 006', phone: '0812-3341-3010', status: 'PPPK' },
  { grade: 'XII', number: 11, name: 'Agustini Purwanti, M.Pd., S.Pd.', nip: '19750815 200501 2 011', phone: '0812-3341-3011', status: 'PNS' },
  { grade: 'XII', number: 12, name: 'Aris Eko Kurniawan, S.Pd., M.Pd.', nip: '19810214 201001 1 017', phone: '0812-3341-3012', status: 'PNS' },
];

export const initialClasses: RombelClass[] = rawWaliKelasData.map((item) => {
  const classId = `c-${item.grade.toLowerCase()}-${item.number}`;
  const className = `${item.grade}-${item.number}`;
  const building = item.grade === 'X' ? 'Gedung A' : item.grade === 'XI' ? 'Gedung B' : 'Gedung C';
  const roomNumber = item.grade === 'X' ? 100 + item.number : item.grade === 'XI' ? 200 + item.number : 300 + item.number;
  return {
    id: classId,
    name: className,
    grade: item.grade,
    number: item.number,
    homeroom: item.name,
    room: `${building} - R.${roomNumber}`,
    capacity: 36,
  };
});

export const initialWaliKelas: WaliKelasTeacher[] = rawWaliKelasData.map((item) => {
  const classId = `c-${item.grade.toLowerCase()}-${item.number}`;
  const className = `${item.grade}-${item.number}`;
  return {
    id: `wk-${item.grade.toLowerCase()}-${item.number}`,
    name: item.name,
    nip: item.nip,
    classId,
    className,
    grade: item.grade,
    phone: item.phone,
    status: item.status,
  };
});

import { realStudentsData } from './studentsData';

export const initialStudents: Student[] = realStudentsData;

// Generate attendance records for today and recent days based on real student data
export const generateInitialAttendance = (allStudents: Student[] = initialStudents): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const dates = [
    '2026-09-14',
    '2026-09-15',
    '2026-09-16',
    '2026-09-17',
  ];
  if (!dates.includes(todayStr)) {
    dates.push(todayStr);
  }

  dates.forEach((date) => {
    allStudents.forEach((student, idx) => {
      // Deterministic variation based on student id and date
      const hash = (idx * 31 + date.charCodeAt(9) * 17) % 100;
      let status: AttendanceStatus = 'H';
      let hasLetter: LetterStatus | undefined = undefined;
      let notes = '';
      let timeRecorded = '06:50';

      if (hash === 3 || hash === 19) {
        // Sakit
        status = 'S';
        hasLetter = hash === 3 ? 'Sudah Ada Surat' : 'Belum Ada Surat';
        notes = hash === 3 ? 'Surat dokter RS Karsa Husada Batu terlampir' : 'Kabar via WhatsApp orang tua, surat menyusul';
        timeRecorded = '07:10';
      } else if (hash === 7 || hash === 42) {
        // Izin
        status = 'I';
        hasLetter = hash === 7 ? 'Sudah Ada Surat' : 'Belum Ada Surat';
        notes = hash === 7 ? 'Surat permohonan izin acara keluarga resmi' : 'Izin lisan belum menyerahkan surat fisik';
        timeRecorded = '07:05';
      } else if (hash === 13) {
        // Alpa (Tanpa Keterangan)
        status = 'A';
        notes = 'Tanpa pemberitahuan sama sekali ke wali kelas/piket';
        timeRecorded = '07:30';
      } else if (hash === 28) {
        // Dispen (Dispensasi)
        status = 'D';
        notes = 'Dispensasi Lomba FLS2N / OSN Tingkat Kota Batu';
        timeRecorded = '07:00';
      } else {
        // Hadir
        status = 'H';
        timeRecorded = '06:45';
      }

      records.push({
        id: `att-${date}-${student.id}`,
        date,
        studentId: student.id,
        studentName: student.name,
        nisn: student.nisn,
        classId: student.classId,
        className: student.className,
        status,
        hasLetter,
        notes,
        timeRecorded,
        recordedBy: 'Guru Piket SMAN 1 Batu',
      });
    });
  });

  return records;
};

export const initialDisciplineRecords: DisciplineRecord[] = [];

export const defaultAdminUser: AdminUser = {
  id: 'usr-admin',
  username: 'admin',
  name: 'Admin',
  role: 'Admin',
  phone: '0812-3344-5501',
  nip: '19690315 199412 2 002',
  department: 'Administrator SIM Presensi & Disiplin Positif',
  avatar: 'AD',
  status: 'Aktif',
  password: 'smabadispos',
  createdAt: '2026-01-01',
};

export const initialUsers: AdminUser[] = [
  // 1. Admin User
  defaultAdminUser,

  // 2. 36 Wali Kelas Users (Username & Password = NIP)
  ...rawWaliKelasData.map((item) => {
    const className = `${item.grade}-${item.number}`;
    const initials = item.name
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

    return {
      id: `usr-wk-${item.grade.toLowerCase()}-${item.number}`,
      username: item.nip,
      name: item.name,
      role: 'Wali Kelas' as const,
      phone: item.phone,
      nip: item.nip,
      assignedClass: className,
      department: `Wali Kelas ${className}`,
      avatar: initials || 'WK',
      status: 'Aktif' as const,
      password: item.nip,
      createdAt: '2026-01-10',
    };
  }),

  // 3. Guru Mata Pelajaran (Non-Wali Kelas) dari Dokumen Resmi
  {
    id: 'usr-guru-raden',
    username: '19700513 200701 1 027',
    name: 'Raden Iriandi Budi Sulistiya, S.Pd',
    role: 'Guru',
    phone: '0812-3341-4001',
    nip: '19700513 200701 1 027',
    department: 'Guru Bahasa Inggris',
    avatar: 'RS',
    status: 'Aktif',
    password: '19700513 200701 1 027',
    createdAt: '2026-01-12',
  },
  {
    id: 'usr-guru-anas',
    username: '19840716 200903 1 005',
    name: 'Anas Bachtiar, S.Pd',
    role: 'Guru',
    phone: '0812-3341-4002',
    nip: '19840716 200903 1 005',
    department: 'Guru PJOK',
    avatar: 'AB',
    status: 'Aktif',
    password: '19840716 200903 1 005',
    createdAt: '2026-01-12',
  },
  {
    id: 'usr-guru-suhariyanti',
    username: '19741109 201412 2 001',
    name: 'Suhariyanti, S.Sos',
    role: 'Guru',
    phone: '0812-3341-4003',
    nip: '19741109 201412 2 001',
    department: 'Guru Sosiologi / IPS',
    avatar: 'SH',
    status: 'Aktif',
    password: '19741109 201412 2 001',
    createdAt: '2026-01-12',
  },
  {
    id: 'usr-guru-panji',
    username: '19900608 202521 1 127',
    name: 'Panji Penatas, S.Pd',
    role: 'Guru',
    phone: '0812-3341-4004',
    nip: '19900608 202521 1 127',
    department: 'Guru Sejarah',
    avatar: 'PP',
    status: 'Aktif',
    password: '19900608 202521 1 127',
    createdAt: '2026-01-12',
  },
];

export const sampleViolationCatalog: ViolationRule[] = [
  // A. BUDAYA DISIPLIN (A1 - A19)
  {
    id: 'vr-a1',
    code: 'A1',
    name: 'Terlambat datang ke sekolah',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Refleksi disiplin pagi dan pembiasaan literasi karakter 15 menit.'
  },
  {
    id: 'vr-a2',
    code: 'A2',
    name: 'Pulang sekolah sebelum waktunya tanpa izin',
    category: 'Sedang',
    defaultPoints: 15,
    suggestedIntervention: 'Klarifikasi bersama wali kelas, pembuatan komitmen tertib waktu, dan penugasan mandiri.'
  },
  {
    id: 'vr-a3',
    code: 'A3',
    name: 'Keluar lingkungan sekolah saat jam pelajaran tanpa izin',
    category: 'Sedang',
    defaultPoints: 15,
    suggestedIntervention: 'Mediasi bersama guru piket dan pembuatan surat pernyataan komitmen tata tertib.'
  },
  {
    id: 'vr-a4',
    code: 'A4',
    name: 'Tidak masuk sekolah tanpa keterangan (Alpa)',
    category: 'Sedang',
    defaultPoints: 10,
    suggestedIntervention: 'Konfirmasi kehadiran langsung oleh wali kelas kepada orang tua dan pendampingan presensi.'
  },
  {
    id: 'vr-a5',
    code: 'A5',
    name: 'Tidak mengikuti atau tidak tertib saat upacara bendera',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Pendampingan baris-berbaris dan penulisan refleksi nilai nasionalisme.'
  },
  {
    id: 'vr-a6',
    code: 'A6',
    name: 'Meninggalkan kelas saat pelajaran tanpa izin guru',
    category: 'Sedang',
    defaultPoints: 10,
    suggestedIntervention: 'Penyelesaian tugas di bawah bimbingan guru mapel dan dialog restitusi.'
  },
  {
    id: 'vr-a7',
    code: 'A7',
    name: 'Memakai jaket/sweater di sekolah tanpa izin',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Penyimpanan jaket di loker/tas dan pembiasaan kerapian seragam sekolah.'
  },
  {
    id: 'vr-a8',
    code: 'A8',
    name: 'Rambut tidak rapi (tidak 3-2-1) atau dicat bagi laki-laki',
    category: 'Ringan',
    defaultPoints: 10,
    suggestedIntervention: 'Merapikan potongan rambut sesuai standar 3-2-1 maksimal dalam 2 hari kerja.'
  },
  {
    id: 'vr-a9',
    code: 'A9',
    name: 'Mewarnai/mengecat rambut bagi perempuan',
    category: 'Ringan',
    defaultPoints: 10,
    suggestedIntervention: 'Mengembalikan warna rambut alami/hitam dan pembinaan kerapian berpenampilan.'
  },
  {
    id: 'vr-a10',
    code: 'A10',
    name: 'Memakai gelang, kalung, anting, atau tindik bagi laki-laki',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Pengamanan aksesoris oleh pihak sekolah dan penandatanganan komitmen tata tertib.'
  },
  {
    id: 'vr-a11',
    code: 'A11',
    name: 'Memakai make-up atau aksesoris berlebihan bagi perempuan',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Pembersihan riasan wajah/cat kuku dan edukasi kesederhanaan penampilan di sekolah.'
  },
  {
    id: 'vr-a12',
    code: 'A12',
    name: 'Seragam atau atribut tidak lengkap / tidak sesuai jadwal',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Melengkapi atribut seragam sekolah dan pemeriksaan berkala oleh wali kelas.'
  },
  {
    id: 'vr-a13',
    code: 'A13',
    name: 'Berpakaian tidak sopan / tidak rapi di lingkungan sekolah',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Penggantian pakaian yang sopan dan edukasi etika berpakaian di lingkungan sekolah.'
  },
  {
    id: 'vr-a14',
    code: 'A14',
    name: 'Makan atau minum saat jam pelajaran tanpa izin',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Pengingat adab belajar di kelas dan komitmen fokus mengikuti pembelajaran.'
  },
  {
    id: 'vr-a15',
    code: 'A15',
    name: 'Membeli makanan/minuman di luar jam istirahat',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Pembinaan manajemen waktu istirahat dan kembali ke kelas mengikuti KBM.'
  },
  {
    id: 'vr-a16',
    code: 'A16',
    name: 'Membeli makanan/minuman dari luar lewat belanja online (COD)',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Pengambilan barang di ruang piket setelah pulang dan edukasi jajan di kantin sekolah.'
  },
  {
    id: 'vr-a17',
    code: 'A17',
    name: 'Menggunakan HP/alat elektronik saat pelajaran tanpa izin',
    category: 'Sedang',
    defaultPoints: 10,
    suggestedIntervention: 'Penyimpanan HP di loker kelas dan penugasan rangkuman materi pembelajaran.'
  },
  {
    id: 'vr-a18',
    code: 'A18',
    name: 'Berpacaran / melakukan tindakan asusila di sekolah',
    category: 'Sedang',
    defaultPoints: 25,
    suggestedIntervention: 'Bimbingan konseling etika pergaulan remaja oleh Guru BK dan pemanggilan orang tua.'
  },
  {
    id: 'vr-a19',
    code: 'A19',
    name: 'Tidak menyelesaikan buku pembinaan dalam 5 hari kerja',
    category: 'Sedang',
    defaultPoints: 10,
    suggestedIntervention: 'Pemanggilan oleh Tim Ketertiban Sekolah untuk percepatan penyelesaian pembinaan.'
  },

  // B. BUDAYA RELIGIUS DAN TOLERANSI (B1 - B5)
  {
    id: 'vr-b1',
    code: 'B1',
    name: 'Tidak melaksanakan ibadah sesuai ketentuan agama masing-masing',
    category: 'Sedang',
    defaultPoints: 15,
    suggestedIntervention: 'Pembinaan karakter religius dan bimbingan rohani oleh guru agama.'
  },
  {
    id: 'vr-b2',
    code: 'B2',
    name: 'Mengganggu atau tidak menghormati teman yang sedang beribadah',
    category: 'Sedang',
    defaultPoints: 15,
    suggestedIntervention: 'Penanaman nilai toleransi beragama dan refleksi sikap bersama wali kelas.'
  },
  {
    id: 'vr-b3',
    code: 'B3',
    name: 'Tidak tertib saat berdoa di awal dan akhir pembelajaran',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Refleksi nilai keagamaan dan pembiasaan khidmat saat berdoa bersama.'
  },
  {
    id: 'vr-b4',
    code: 'B4',
    name: 'Berbicara tidak sopan atau berperilaku tidak ramah dan santun',
    category: 'Sedang',
    defaultPoints: 20,
    suggestedIntervention: 'Dialog restitusi empati dan permohonan maaf tulus secara lisan serta tertulis.'
  },
  {
    id: 'vr-b5',
    code: 'B5',
    name: 'Tidak tertib saat menyanyikan lagu Indonesia Raya di awal pembelajaran',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Refleksi nilai kebangsaan dan pembinaan sikap nasionalisme oleh wali kelas.'
  },

  // C. BUDAYA PEDULI LINGKUNGAN (C1 - C5)
  {
    id: 'vr-c1',
    code: 'C1',
    name: 'Tidak melaksanakan piket di dalam dan luar kelas',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Melaksanakan bakti kebersihan ruang kelas dan halaman sekolah.'
  },
  {
    id: 'vr-c2',
    code: 'C2',
    name: 'Tidak menjaga kebersihan dan keindahan fasilitas sekolah',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Bakti pemeliharaan fasilitas dan kebersihan lingkungan sekolah.'
  },
  {
    id: 'vr-c3',
    code: 'C3',
    name: 'Membuang sampah sembarangan (tidak pada tempatnya)',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Operasi semut pembersihan area sekolah dan pembuatan poster peduli kebersihan.'
  },
  {
    id: 'vr-c4',
    code: 'C4',
    name: 'Tidak mengikuti kegiatan Jumat Sehat dan Jumat Bersih',
    category: 'Ringan',
    defaultPoints: 5,
    suggestedIntervention: 'Penugasan bakti lingkungan sekolah bersama tim ketertiban.'
  },
  {
    id: 'vr-c5',
    code: 'C5',
    name: 'Merusak fasilitas sekolah',
    category: 'Berat',
    defaultPoints: 35,
    suggestedIntervention: 'Tanggung jawab perbaikan/pembersihan sarana dan bakti pemeliharaan fasilitas sekolah.'
  },

  // D. BUDAYA AMAN, NYAMAN, INKLUSIF DAN MERAYAKAN KEBHINEKAAN (D1 - D12)
  {
    id: 'vr-d1',
    code: 'D1',
    name: 'Terlibat atau menjadi anggota organisasi terlarang/geng liar',
    category: 'Berat',
    defaultPoints: 50,
    suggestedIntervention: 'Penanganan intensif Kepala Sekolah & Guru BK, pakta integritas, dan pemanggilan orang tua.'
  },
  {
    id: 'vr-d2',
    code: 'D2',
    name: 'Melakukan perundungan (bullying) verbal, psikis, atau fisik',
    category: 'Berat',
    defaultPoints: 40,
    suggestedIntervention: 'Mediasi restoratif oleh Tim TPPK dan Guru BK serta pendampingan psikologis.'
  },
  {
    id: 'vr-d3',
    code: 'D3',
    name: 'Berkelahi, tawuran, atau main hakim sendiri',
    category: 'Berat',
    defaultPoints: 45,
    suggestedIntervention: 'Mediasi perdamaian resmi, konseling emosi oleh Guru BK, dan perjanjian bersama orang tua.'
  },
  {
    id: 'vr-d4',
    code: 'D4',
    name: 'Membawa, menyimpan, atau melihat konten pornografi',
    category: 'Berat',
    defaultPoints: 35,
    suggestedIntervention: 'Penghapusan konten, bimbingan etika digital oleh Guru BK, dan pendampingan orang tua.'
  },
  {
    id: 'vr-d5',
    code: 'D5',
    name: 'Membuat kegaduhan atau perayaan berlebihan di sekolah',
    category: 'Ringan',
    defaultPoints: 10,
    suggestedIntervention: 'Pembersihan area terdampak dan penulisan surat refleksi ketertiban bersama wali kelas.'
  },
  {
    id: 'vr-d6',
    code: 'D6',
    name: 'Membawa senjata tajam, miras, rokok/vape, atau obat terlarang',
    category: 'Berat',
    defaultPoints: 75,
    suggestedIntervention: 'Penyitaan barang bukti, penanganan darurat Kepala Sekolah & Tim BK, dan pemanggilan orang tua.'
  },
  {
    id: 'vr-d7',
    code: 'D7',
    name: 'Memalsukan tanda tangan kepala sekolah, guru, atau orang tua',
    category: 'Sedang',
    defaultPoints: 25,
    suggestedIntervention: 'Pembuatan surat pernyataan kejujuran dan klarifikasi langsung bersama orang tua.'
  },
  {
    id: 'vr-d8',
    code: 'D8',
    name: 'Terlibat tindak kriminal / kejahatan pidana',
    category: 'Berat',
    defaultPoints: 75,
    suggestedIntervention: 'Tindak lanjut khusus pimpinan sekolah bersama pihak berwenang dan pendampingan orang tua.'
  },
  {
    id: 'vr-d9',
    code: 'D9',
    name: 'Mengambil atau meminjam barang tanpa izin (Mencuri)',
    category: 'Sedang',
    defaultPoints: 25,
    suggestedIntervention: 'Pengembalian barang kepada pemilik sah, permohonan maaf, dan pembinaan nilai kejujuran.'
  },
  {
    id: 'vr-d10',
    code: 'D10',
    name: 'Berjudi atau bermain judi online di sekolah',
    category: 'Sedang',
    defaultPoints: 25,
    suggestedIntervention: 'Konseling bahaya perjudian digital dan penandatanganan komitmen bersama orang tua.'
  },
  {
    id: 'vr-d11',
    code: 'D11',
    name: 'Mengunggah konten negatif tentang aktivitas sekolah',
    category: 'Sedang',
    defaultPoints: 25,
    suggestedIntervention: 'Penghapusan unggahan (take down), klarifikasi positif, dan edukasi etika bermedia sosial.'
  },
  {
    id: 'vr-d12',
    code: 'D12',
    name: 'Merekam atau mendokumentasikan aktivitas sekolah tanpa izin tertulis',
    category: 'Sedang',
    defaultPoints: 25,
    suggestedIntervention: 'Penghapusan dokumentasi dan edukasi privasi serta etika dokumentasi di lingkungan sekolah.'
  }
];
