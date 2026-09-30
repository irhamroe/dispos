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
