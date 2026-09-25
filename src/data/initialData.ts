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

const teacherPool = [
  { name: 'Drs. H. Mulyadi', nip: '19680512 199303 1 004', phone: '0812-3341-2001', status: 'PNS' as const },
  { name: 'Siti Aminah, S.Pd., M.Pd.', nip: '19740822 199802 2 003', phone: '0813-5562-2002', status: 'PNS' as const },
  { name: 'Bambang Sugiantoro, M.Pd.', nip: '19710319 199703 1 005', phone: '0812-4478-2003', status: 'PNS' as const },
  { name: 'Sri Rahayu, S.Pd.', nip: '19760614 200003 2 006', phone: '0815-7789-2004', status: 'PNS' as const },
  { name: 'Ahmad Fauzan, M.Si.', nip: '19800918 200501 1 008', phone: '0812-8899-2005', status: 'PNS' as const },
  { name: 'Dwi Astuti, S.Kom., M.T.', nip: '19830211 200801 2 012', phone: '0813-9912-2006', status: 'PNS' as const },
  { name: 'Hendra Kusuma, S.Pd.', nip: '19790425 200604 1 009', phone: '0812-1123-2007', status: 'PNS' as const },
  { name: 'Nurul Aini, M.Pd.', nip: '19821105 200902 2 011', phone: '0815-2234-2008', status: 'PNS' as const },
  { name: 'Agus Priyono, S.T., M.Pd.', nip: '19770130 200312 1 007', phone: '0812-3345-2009', status: 'PNS' as const },
  { name: 'Endang Lestari, S.Pd.', nip: '19850719 201001 2 015', phone: '0813-4456-2010', status: 'PPPK' as const },
  { name: 'Wahyu Widodo, M.Pd.', nip: '19730914 199903 1 006', phone: '0812-5567-2011', status: 'PNS' as const },
  { name: 'Rina Suryani, S.Pd.', nip: '19861208 201101 2 018', phone: '0815-6678-2012', status: 'PPPK' as const },
  { name: 'Dr. Joko Santoso, M.Pd.', nip: '19700416 199512 1 003', phone: '0812-7789-2013', status: 'PNS' as const },
  { name: 'Yuni Astuti, S.Pd.', nip: '19840321 200903 2 014', phone: '0813-8890-2014', status: 'PNS' as const },
  { name: 'Arif Hidayat, M.Si.', nip: '19810810 200604 1 010', phone: '0815-9901-2015', status: 'PNS' as const },
  { name: 'Tri Wahyuni, S.Pd.', nip: '19870503 201402 2 009', phone: '0812-0012-2016', status: 'PPPK' as const },
  { name: 'Eko Prasetyo, S.Pd.', nip: '19780214 200501 1 007', phone: '0813-1123-2017', status: 'PNS' as const },
  { name: 'Dewi Sartika, M.Pd.', nip: '19830927 200801 2 016', phone: '0815-2234-2018', status: 'PNS' as const },
  { name: 'Sugeng Riyadi, S.Pd.', nip: '19721128 199803 1 005', phone: '0812-3345-2019', status: 'PNS' as const },
  { name: 'Nurul Hidayati, S.Si.', nip: '19880115 201503 2 007', phone: '0813-4456-2020', status: 'PPPK' as const },
  { name: 'Agung Wibowo, S.Pd.', nip: '19790620 200701 1 011', phone: '0815-5567-2021', status: 'PNS' as const },
  { name: 'Lilik Sulistiyani, M.Pd.', nip: '19811009 200604 2 013', phone: '0812-6678-2022', status: 'PNS' as const },
  { name: 'Mohammad Taufiq, S.Pd.', nip: '19860312 201001 1 014', phone: '0813-7789-2023', status: 'PPPK' as const },
  { name: 'Retno Wulandari, S.Pd.', nip: '19890405 201903 2 008', phone: '0815-8890-2024', status: 'PPPK' as const },
  { name: 'Sunardi, M.Pd.', nip: '19691204 199403 1 004', phone: '0812-9901-2025', status: 'PNS' as const },
  { name: 'Fitri Handayani, S.Pd.', nip: '19840718 200902 2 017', phone: '0813-0012-2026', status: 'PNS' as const },
  { name: 'Budi Darmawan, S.Kom.', nip: '19820524 200801 1 013', phone: '0815-1123-2027', status: 'PNS' as const },
  { name: 'Sri Utami, S.Pd.', nip: '19750912 200212 2 004', phone: '0812-2234-2028', status: 'PNS' as const },
  { name: 'Dedi Kurniawan, S.Pd.', nip: '19871130 201201 1 012', phone: '0813-3345-2029', status: 'PPPK' as const },
  { name: 'Ani Wijayanti, M.Pd.', nip: '19800816 200501 2 010', phone: '0815-4456-2030', status: 'PNS' as const },
  { name: 'Hari Suwondo, S.Pd.', nip: '19730419 199903 1 008', phone: '0812-5567-2031', status: 'PNS' as const },
  { name: 'Diah Permatasari, S.Pd.', nip: '19880227 201403 2 006', phone: '0813-6678-2032', status: 'PPPK' as const },
  { name: 'Wawan Setiawan, S.Pd.', nip: '19810103 200701 1 015', phone: '0815-7789-2033', status: 'PNS' as const },
  { name: 'Kusuma Wardani, M.Pd.', nip: '19830614 200801 2 019', phone: '0812-8890-2034', status: 'PNS' as const },
  { name: 'Rudy Hartono, S.T.', nip: '19781008 200604 1 012', phone: '0813-9901-2035', status: 'PNS' as const },
  { name: 'Eni Purwanti, S.Pd.', nip: '19850901 201101 2 021', phone: '0815-0012-2036', status: 'PPPK' as const },
];

export const initialClasses: RombelClass[] = [];
export const initialWaliKelas: WaliKelasTeacher[] = [];

// Generate Kelas X (X-1 s/d X-12)
for (let i = 1; i <= 12; i++) {
  const teacher = teacherPool[i - 1];
  const classId = `c-x-${i}`;
  const className = `X-${i}`;
  
  initialClasses.push({
    id: classId,
    name: className,
    grade: 'X',
    number: i,
    homeroom: teacher.name,
    room: `Gedung A - R.${100 + i}`,
    capacity: 36,
  });

  initialWaliKelas.push({
    id: `wk-x-${i}`,
    name: teacher.name,
    nip: teacher.nip,
    classId,
    className,
    grade: 'X',
    phone: teacher.phone,
    email: `${teacher.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}@sman1batu.sch.id`,
    status: teacher.status,
  });
}

// Generate Kelas XI (XI-1 s/d XI-12)
for (let i = 1; i <= 12; i++) {
  const teacher = teacherPool[12 + i - 1];
  const classId = `c-xi-${i}`;
  const className = `XI-${i}`;

  initialClasses.push({
    id: classId,
    name: className,
    grade: 'XI',
    number: i,
    homeroom: teacher.name,
    room: `Gedung B - R.${200 + i}`,
    capacity: 36,
  });

  initialWaliKelas.push({
    id: `wk-xi-${i}`,
    name: teacher.name,
    nip: teacher.nip,
    classId,
    className,
    grade: 'XI',
    phone: teacher.phone,
    email: `${teacher.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}@sman1batu.sch.id`,
    status: teacher.status,
  });
}

// Generate Kelas XII (XII-1 s/d XII-12)
for (let i = 1; i <= 12; i++) {
  const teacher = teacherPool[24 + i - 1];
  const classId = `c-xii-${i}`;
  const className = `XII-${i}`;

  initialClasses.push({
    id: classId,
    name: className,
    grade: 'XII',
    number: i,
    homeroom: teacher.name,
    room: `Gedung C - R.${300 + i}`,
    capacity: 36,
  });

  initialWaliKelas.push({
    id: `wk-xii-${i}`,
    name: teacher.name,
    nip: teacher.nip,
    classId,
    className,
    grade: 'XII',
    phone: teacher.phone,
    email: `${teacher.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}@sman1batu.sch.id`,
    status: teacher.status,
  });
}

// Indonesian first & last name pools
const maleFirstNames = [
  'Aditya', 'Ahmad', 'Alif', 'Arya', 'Bagas', 'Bayu', 'Bima', 'Candra',
  'Danang', 'Davin', 'Dimas', 'Dwi', 'Fadhil', 'Fajar', 'Galih', 'Gilang',
  'Hafizh', 'Haris', 'Ihsan', 'Ilham', 'Jaka', 'Kevin', 'Luqman', 'Maulana',
  'Muhammad', 'Nabil', 'Oka', 'Pratama', 'Raditya', 'Rafi', 'Rangga', 'Reza',
  'Rian', 'Rifki', 'Rizky', 'Satria', 'Taufik', 'Umar', 'Wahyu', 'Yoga'
];

const femaleFirstNames = [
  'Aisyah', 'Ananda', 'Anisa', 'Annisa', 'Bella', 'Cantika', 'Citra', 'Dewi',
  'Dian', 'Dinda', 'Elisa', 'Fadhilah', 'Fitri', 'Gita', 'Hana', 'Indah',
  'Intan', 'Karina', 'Kartika', 'Kirana', 'Laras', 'Lestari', 'Maya', 'Mega',
  'Meilani', 'Nabila', 'Nadya', 'Nurul', 'Putri', 'Rani', 'Riska', 'Salma',
  'Salsabila', 'Siti', 'Syifa', 'Tasya', 'Tiara', 'Vina', 'Wulan', 'Zahra'
];

const lastNames = [
  'Pratama', 'Saputra', 'Kusuma', 'Wardana', 'Hidayat', 'Wibowo', 'Santoso',
  'Nugroho', 'Purnomo', 'Setiawan', 'Ramadhan', 'Wijaya', 'Permana', 'Firmansyah',
  'Mahendra', 'Utomo', 'Suryono', 'Hakim', 'Gunawan', 'Syahreza', 'Pangestu',
  'Subroto', 'Prasetyo', 'Pamungkas', 'Baskoro', 'Kurniawan', 'Sudrajat', 'Hermawan'
];

// Batu street & subdistrict pools
const batuStreetPool = [
  'Jl. Panglima Sudirman',
  'Jl. KH. Agus Salim',
  'Jl. Diponegoro',
  'Jl. Sultan Agung',
  'Jl. Gajah Mada',
  'Jl. Trunojoyo',
  'Jl. Suropati',
  'Jl. Bromo',
  'Jl. Songgoriti',
  'Jl. Panderman',
  'Jl. Welirang',
  'Jl. Brantas',
  'Jl. Oro-Oro Ombo',
  'Jl. Raya Beji',
  'Jl. Mojorejo',
  'Jl. Hasanudin',
  'Jl. Junrejo',
  'Jl. Bumiaji',
];

const batuSubdistricts = [
  'Kel. Sisir, Kec. Batu',
  'Kel. Temas, Kec. Batu',
  'Kel. Ngaglik, Kec. Batu',
  'Kel. Songgokerto, Kec. Batu',
  'Desa Pesanggrahan, Kec. Batu',
  'Desa Oro-Oro Ombo, Kec. Batu',
  'Desa Sidomulyo, Kec. Batu',
  'Desa Bumiaji, Kec. Bumiaji',
  'Desa Punten, Kec. Bumiaji',
  'Desa Tulungrejo, Kec. Bumiaji',
  'Desa Mojorejo, Kec. Junrejo',
  'Desa Pendem, Kec. Junrejo',
  'Desa Beji, Kec. Junrejo',
];

// Generate 36 students per class across all 36 classes = 1,296 students (~1,300)
export const generateStudents = (): Student[] => {
  const students: Student[] = [];
  let globalIndex = 1;

  initialClasses.forEach((cls) => {
    // 36 students per rombel
    for (let sIdx = 1; sIdx <= 36; sIdx++) {
      const isMale = (sIdx + cls.number) % 2 === 0;
      const firstPool = isMale ? maleFirstNames : femaleFirstNames;
      const firstName = firstPool[(globalIndex + sIdx * 7) % firstPool.length];
      const lastName = lastNames[(globalIndex + sIdx * 11) % lastNames.length];
      const fullName = `${firstName} ${lastName}`;

      // NISN format for SMAN 1 Batu: 009 (X), 008 (XI), 007 (XII)
      const prefixNisn = cls.grade === 'X' ? '009' : cls.grade === 'XI' ? '008' : '007';
      const paddedId = String(globalIndex).padStart(5, '0');
      const nisn = `${prefixNisn}1${paddedId}`;

      const phoneLast = String(1000 + globalIndex);
      const parentLast = String(5000 + globalIndex);

      const street = batuStreetPool[(globalIndex + sIdx * 3) % batuStreetPool.length];
      const subdistrict = batuSubdistricts[(globalIndex + sIdx * 5) % batuSubdistricts.length];
      const houseNumber = (sIdx * 3 + globalIndex % 45) || 12;
      const rt = (sIdx % 8) + 1;
      const rw = (sIdx % 5) + 1;
      const address = `${street} No. ${houseNumber}, RT 0${rt}/RW 0${rw}, ${subdistrict}, Kota Batu`;

      // Set sample photo avatars for students (using clean UI Avatars or dicebear)
      const photoUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=${isMale ? 'b6e3f4,c0aede' : 'ffd5dc,ffdfbf'}`;

      students.push({
        id: `s-${cls.id}-${sIdx}`,
        nisn,
        name: fullName,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        gender: isMale ? 'L' : 'P',
        phone: `0812345${phoneLast}`,
        parentPhone: `0813987${parentLast}`,
        address,
        photoUrl,
        status: 'Aktif',
      });

      globalIndex++;
    }
  });

  return students;
};

export const initialStudents: Student[] = generateStudents();

// Generate attendance records for today (2026-09-17) and recent days
// Realistic distribution: ~94% Hadir, ~2% Sakit, ~2% Izin, ~1% Alpa, ~1% Dispen
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

export const initialDisciplineRecords: DisciplineRecord[] = [
  {
    id: 'disc-1',
    date: '2026-09-17',
    studentId: 's-c-x-1-5',
    studentName: 'Bima Saputra',
    nisn: '009100005',
    classId: 'c-x-1',
    className: 'X-1',
    category: 'Sedang',
    violationName: 'Ketidakhadiran tanpa keterangan (Alpa)',
    points: 15,
    description: 'Siswa tidak hadir hari ini tanpa surat keterangan dan tercatat tidak masuk tanpa izin.',
    positiveIntervention: 'Restitusi kedisiplinan: Sesi refleksi nilai tanggung jawab dengan Wali Kelas X-1, penyusunan komitmen bangun pagi, dan pendampingan peer-buddy.',
    status: 'Dalam Pantauan',
    reportedBy: 'Drs. H. Mulyadi (Wali X-1)',
    witnessOrStaff: 'Guru Piket SMAN 1 Batu',
    coachingStatus: 'Belum',
  },
  {
    id: 'disc-2',
    date: '2026-09-16',
    studentId: 's-c-xi-3-9',
    studentName: 'Dimas Wijaya',
    nisn: '008100513',
    classId: 'c-xi-3',
    className: 'XI-3',
    category: 'Ringan',
    violationName: 'Seragam dan atribut tidak sesuai tata tertib SMAN 1 Batu',
    points: 5,
    description: 'Tidak mengenakan dasi dan ikat pinggang berlogo SMAN 1 Batu saat upacara.',
    positiveIntervention: 'Edukasi kerapian diri: Membantu piket tata tertib 15 menit dan meminjam kelengkapan seragam resmi di koperasi siswa.',
    status: 'Selesai',
    reportedBy: 'Ahmad Fauzan, M.Si.',
    coachingStatus: 'Sudah',
    coachingDate: '2026-09-16',
    coachingEvidenceFileName: 'Surat_Pembinaan_Dimas_Wijaya.pdf',
  },
  {
    id: 'disc-3',
    date: '2026-09-15',
    studentId: 's-c-xii-5-14',
    studentName: 'Yoga Setiawan',
    nisn: '007101022',
    classId: 'c-xii-5',
    className: 'XII-5',
    category: 'Ringan',
    violationName: 'Bermain gadget / ponsel saat jam KBM tanpa izin',
    points: 10,
    description: 'Membuka aplikasi game tanpa izin saat guru sedang menyampaikan materi pembelajaran di laboratorium.',
    positiveIntervention: 'Kesepakatan digital etik: Siswa merangkum materi yang tertinggal dan membuat komitmen penggunaan gawai cerdas.',
    status: 'Selesai',
    reportedBy: 'Wahyu Widodo, M.Pd.',
    coachingStatus: 'Sudah',
    coachingDate: '2026-09-15',
    coachingEvidenceFileName: 'Surat_Pernyataan_Siswa_Yoga.pdf',
  },
  {
    id: 'disc-4',
    date: '2026-09-14',
    studentId: 's-c-x-7-18',
    studentName: 'Fajar Nugroho',
    nisn: '009100234',
    classId: 'c-x-7',
    className: 'X-7',
    category: 'Sedang',
    violationName: 'Meninggalkan kelas / sekolah tanpa surat izin (Membolos)',
    points: 20,
    description: 'Terlihat keluar gerbang sekolah saat istirahat kedua dan tidak kembali mengikuti pelajaran jam ke-7.',
    positiveIntervention: 'Dialog segitiga restitusi bersama orang tua dan Guru BK SMAN 1 Batu serta pemberian proyek penguatan karakter bakti lingkungan.',
    status: 'Perlu Tindak Lanjut BK',
    reportedBy: 'Tim Disiplin SMAN 1 Batu',
    witnessOrStaff: 'Koordinator BK SMAN 1 Batu',
    coachingStatus: 'Belum',
  },
];

export const defaultAdminUser: AdminUser = {
  id: 'usr-admin-1',
  username: 'admin',
  name: 'Drs. Rr. Wulandari Wahyuningsih, M.Pd.',
  role: 'Admin',
  email: 'admin@sman1batu.sch.id',
  phone: '0812-3344-5501',
  nip: '19690315 199412 2 002',
  department: 'Kepala Sekolah / Penanggung Jawab Sistem',
  avatar: 'WW',
  status: 'Aktif',
  password: 'admin123',
  createdAt: '2026-01-10',
};

export const initialUsers: AdminUser[] = [
  // 1. Role: Admin
  defaultAdminUser,
  {
    id: 'usr-admin-2',
    username: 'operator',
    name: 'Bagus Santoso, S.Kom.',
    role: 'Admin',
    email: 'operator@sman1batu.sch.id',
    phone: '0813-8822-1102',
    nip: '19880415 201201 1 003',
    department: 'Operator IT Dapodik & SIM Sekolah',
    avatar: 'BS',
    status: 'Aktif',
    password: 'admin123',
    createdAt: '2026-01-12',
  },

  // 2. Role: Wali Kelas
  {
    id: 'usr-wk-1',
    username: 'walikelas',
    name: 'Drs. H. Mulyadi',
    role: 'Wali Kelas',
    email: 'mulyadi@sman1batu.sch.id',
    phone: '0812-3341-2001',
    nip: '19680512 199303 1 004',
    assignedClass: 'X-1',
    department: 'Wali Kelas X-1 (Guru Biologi)',
    avatar: 'HM',
    status: 'Aktif',
    password: 'wali123',
    createdAt: '2026-01-15',
  },
  {
    id: 'usr-wk-2',
    username: 'siti_aminah',
    name: 'Siti Aminah, S.Pd., M.Pd.',
    role: 'Wali Kelas',
    email: 'siti.aminah@sman1batu.sch.id',
    phone: '0813-5562-2002',
    nip: '19740822 199802 2 003',
    assignedClass: 'X-2',
    department: 'Wali Kelas X-2 (Guru Fisika)',
    avatar: 'SA',
    status: 'Aktif',
    password: 'wali123',
    createdAt: '2026-01-15',
  },
  {
    id: 'usr-wk-3',
    username: 'bambang_s',
    name: 'Bambang Sugiantoro, M.Pd.',
    role: 'Wali Kelas',
    email: 'bambang.s@sman1batu.sch.id',
    phone: '0812-4478-2003',
    nip: '19710319 199703 1 005',
    assignedClass: 'XI-1',
    department: 'Wali Kelas XI-1 (Guru Kimia)',
    avatar: 'BS',
    status: 'Aktif',
    password: 'wali123',
    createdAt: '2026-01-15',
  },
  {
    id: 'usr-wk-4',
    username: 'joko_santoso',
    name: 'Dr. Joko Santoso, M.Pd.',
    role: 'Wali Kelas',
    email: 'joko.santoso@sman1batu.sch.id',
    phone: '0812-7789-2013',
    nip: '19700416 199512 1 003',
    assignedClass: 'XII-1',
    department: 'Wali Kelas XII-1 (Guru Sosiologi)',
    avatar: 'JS',
    status: 'Aktif',
    password: 'wali123',
    createdAt: '2026-01-15',
  },

  // 3. Role: Guru
  {
    id: 'usr-guru-1',
    username: 'guru',
    name: 'Ahmad Fauzan, M.Si.',
    role: 'Guru',
    email: 'ahmad.fauzan@sman1batu.sch.id',
    phone: '0812-8899-2005',
    nip: '19800918 200501 1 008',
    department: 'Guru Matematika & Koordinator Piket',
    avatar: 'AF',
    status: 'Aktif',
    password: 'guru123',
    createdAt: '2026-01-16',
  },
  {
    id: 'usr-guru-2',
    username: 'sri_rahayu',
    name: 'Sri Rahayu, S.Pd.',
    role: 'Guru',
    email: 'sri.rahayu@sman1batu.sch.id',
    phone: '0815-7789-2004',
    nip: '19760614 200003 2 006',
    department: 'Guru Bimbingan Konseling (BK)',
    avatar: 'SR',
    status: 'Aktif',
    password: 'guru123',
    createdAt: '2026-01-16',
  },
  {
    id: 'usr-guru-3',
    username: 'hendra_k',
    name: 'Hendra Kusuma, S.Pd.',
    role: 'Guru',
    email: 'hendra.k@sman1batu.sch.id',
    phone: '0812-1123-2007',
    nip: '19790425 200604 1 009',
    department: 'Guru Pendidikan Jasmani & Kesehatan',
    avatar: 'HK',
    status: 'Aktif',
    password: 'guru123',
    createdAt: '2026-01-16',
  },
  {
    id: 'usr-guru-4',
    username: 'dwi_astuti',
    name: 'Dwi Astuti, S.Kom., M.T.',
    role: 'Guru',
    email: 'dwi.astuti@sman1batu.sch.id',
    phone: '0813-9912-2006',
    nip: '19830211 200801 2 012',
    department: 'Guru Informatika & Robotika',
    avatar: 'DA',
    status: 'Aktif',
    password: 'guru123',
    createdAt: '2026-01-16',
  },

  // 4. Role: Tendik (Tenaga Kependidikan)
  {
    id: 'usr-tendik-1',
    username: 'tendik',
    name: 'Joko Purwanto, S.AP.',
    role: 'Tendik',
    email: 'tu.sman1batu@gmail.com',
    phone: '0812-7721-3301',
    nip: '19750912 200112 1 002',
    department: 'Kepala Urusan Tata Usaha & Kearsipan',
    avatar: 'JP',
    status: 'Aktif',
    password: 'tendik123',
    createdAt: '2026-01-18',
  },
  {
    id: 'usr-tendik-2',
    username: 'dewi_kesiswaan',
    name: 'Dewi Anggraini, A.Md.',
    role: 'Tendik',
    email: 'kesiswaan.sman1batu@gmail.com',
    phone: '0813-4411-9922',
    nip: '19890620 201402 2 004',
    department: 'Staf Administrasi Kesiswaan & Presensi',
    avatar: 'DA',
    status: 'Aktif',
    password: 'tendik123',
    createdAt: '2026-01-18',
  },
  {
    id: 'usr-tendik-3',
    username: 'eko_sarpras',
    name: 'Eko Suprayitno',
    role: 'Tendik',
    email: 'sarpras.sman1batu@gmail.com',
    phone: '0852-3344-7711',
    nip: '19861110 201001 1 009',
    department: 'Staf Sarana Prasarana & Keamanan',
    avatar: 'ES',
    status: 'Aktif',
    password: 'tendik123',
    createdAt: '2026-01-18',
  },
  {
    id: 'usr-tendik-4',
    username: 'ratna_kepegawaian',
    name: 'Ratna Wulandari, S.E.',
    role: 'Tendik',
    email: 'kepegawaian.sman1batu@gmail.com',
    phone: '0813-7766-5544',
    nip: '19910518 201603 2 001',
    department: 'Staf Administrasi Kepegawaian & SIMPEG',
    avatar: 'RW',
    status: 'Aktif',
    password: 'tendik123',
    createdAt: '2026-01-18',
  },
];

export const sampleViolationCatalog: ViolationRule[] = [
  { id: 'vr-1', name: 'Keterlambatan masuk sekolah (> 15 menit)', category: 'Ringan', defaultPoints: 5, suggestedIntervention: 'Refleksi disiplin pagi dan pembiasaan literasi 15 menit' },
  { id: 'vr-2', name: 'Seragam dan atribut tidak sesuai tata tertib SMAN 1 Batu', category: 'Ringan', defaultPoints: 5, suggestedIntervention: 'Pemberitahuan orang tua dan pendampingan kerapian oleh wali kelas' },
  { id: 'vr-3', name: 'Bermain gadget / ponsel saat jam KBM tanpa izin', category: 'Ringan', defaultPoints: 10, suggestedIntervention: 'Penyimpanan ponsel di loker kelas dan tugas rangkuman materi' },
  { id: 'vr-4', name: 'Makan / minum saat jam pelajaran tanpa izin', category: 'Ringan', defaultPoints: 5, suggestedIntervention: 'Pengingat adab belajar dan komitmen tertib kelas' },
  { id: 'vr-5', name: 'Tidak mengerjakan tugas sekolah berturut-turut', category: 'Sedang', defaultPoints: 15, suggestedIntervention: 'Sesi bimbingan belajar khusus dan pendampingan tutor sebaya' },
  { id: 'vr-6', name: 'Meninggalkan kelas / sekolah tanpa surat izin (Membolos)', category: 'Sedang', defaultPoints: 20, suggestedIntervention: 'Dialog restitusi segitiga bersama wali kelas dan penugasan proyek kepedulian' },
  { id: 'vr-7', name: 'Bersikap tidak sopan terhadap pendidik / tenaga kependidikan', category: 'Sedang', defaultPoints: 25, suggestedIntervention: 'Konseling emosional dan penulisan surat refleksi empati' },
  { id: 'vr-8', name: 'Melakukan perundungan (Bullying) verbal / siber', category: 'Berat', defaultPoints: 40, suggestedIntervention: 'Penanganan komprehensif Guru BK SMAN 1 Batu, mediasi restoratif, dan pemanggilan orang tua' },
  { id: 'vr-9', name: 'Merusak fasilitas sarana dan prasarana sekolah', category: 'Berat', defaultPoints: 35, suggestedIntervention: 'Tanggung jawab perbaikan fasilitas dan bakti pemeliharaan sarana sekolah' },
];
