const fs = require('fs');
const xlsx = require('xlsx');

// Read studentsData.ts
const tsContent = fs.readFileSync('src/data/studentsData.ts', 'utf8');
const jsonMatch = tsContent.match(/export const realStudentsData: Student\[\] = (\[[\s\S]*\]);/);
if (!jsonMatch) {
  console.error('Could not extract realStudentsData');
  process.exit(1);
}
const students = JSON.parse(jsonMatch[1]);
console.log('Loaded students count:', students.length);

const nisnMap = new Map();
const nameMap = new Map();

for (const s of students) {
  if (s.nisn) nisnMap.set(String(s.nisn).trim(), s);
  nameMap.set(s.name.trim().toLowerCase(), s);
}

const wb = xlsx.readFile('Database Absensi.xlsx');
const wsSiswa = wb.Sheets['Siswa'];
const excelSiswa = xlsx.utils.sheet_to_json(wsSiswa);
const excelNisToStudentMap = new Map();
for (const row of excelSiswa) {
  const nis = String(row['NIS'] || '').trim();
  const nama = String(row['Nama'] || '').trim().toLowerCase();
  const student = nisnMap.get(nis) || nameMap.get(nama);
  if (student) {
    excelNisToStudentMap.set(nis, student);
  }
}

const wsAbs = wb.Sheets['Data_Absensi'];
const dataAbs = xlsx.utils.sheet_to_json(wsAbs);

const convertedAttendance = [];

for (const row of dataAbs) {
  const rawNis = String(row['NIS'] || '').trim();
  const student = excelNisToStudentMap.get(rawNis) || nisnMap.get(rawNis);

  let d = row['Tanggal'];
  let dateStr = '';
  if (typeof d === 'number') {
    const jsDate = new Date((d - (25567 + 2)) * 86400 * 1000);
    dateStr = jsDate.toISOString().slice(0, 10);
  } else if (typeof d === 'string') {
    dateStr = d.trim();
  }

  const rawStatus = String(row['Status'] || 'H').toUpperCase().trim();
  let status = 'H';
  if (['H', 'S', 'I', 'A', 'D'].includes(rawStatus)) {
    status = rawStatus;
  }

  if (student && dateStr) {
    const isSuratAda = row['Status Surat'] === 'Ada';
    const hasLetter = (status === 'S' || status === 'I') 
      ? (isSuratAda ? 'Sudah Ada Surat' : 'Belum Ada Surat') 
      : undefined;

    convertedAttendance.push({
      id: `att-${dateStr}-${student.id}`,
      date: dateStr,
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      classId: student.classId,
      className: student.className,
      status: status,
      hasLetter: hasLetter,
      timeRecorded: '07:00',
      recordedBy: 'Guru Piket / AppScript'
    });
  }
}

console.log('Writing historicalAttendance.ts with', convertedAttendance.length, 'records...');
const outContent = `import { AttendanceRecord } from '../types';\n\nexport const historicalAttendanceData: AttendanceRecord[] = ${JSON.stringify(convertedAttendance, null, 2)};\n`;
fs.writeFileSync('src/data/historicalAttendance.ts', outContent, 'utf8');
console.log('Successfully written src/data/historicalAttendance.ts!');
