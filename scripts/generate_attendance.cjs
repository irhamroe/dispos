const fs = require('fs');
const xlsx = require('xlsx');

// 1. Read studentsData.ts
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

// 2. Read Database Absensi.xlsx
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

// Store existing records indexed by date_studentId
const existingRecordMap = new Map();
const recordedDates = new Set();

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

    const record = {
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
    };

    existingRecordMap.set(`${dateStr}_${student.id}`, record);
    recordedDates.add(dateStr);
  }
}

console.log('Unique raw attendance records loaded:', existingRecordMap.size);
console.log('Distinct dates in Excel:', recordedDates.size);

// 3. Define all effective school days between 2026-07-14 and 2026-10-07
// Start date is 2026-07-14 as requested.
const effectiveDates = Array.from(recordedDates)
  .filter(d => d >= '2026-07-14' && d <= '2026-10-07')
  .sort();

console.log('Total effective school days:', effectiveDates.length);
console.log('Effective school days list:', effectiveDates);

// 4. Fill missing records with 'H' status for every student on each effective school day
const allAttendanceRecords = [];
let preservedCount = 0;
let filledHCount = 0;

for (const date of effectiveDates) {
  for (const s of students) {
    const key = `${date}_${s.id}`;
    const existing = existingRecordMap.get(key);
    if (existing) {
      allAttendanceRecords.push(existing);
      preservedCount++;
    } else {
      allAttendanceRecords.push({
        id: `att-${date}-${s.id}`,
        date: date,
        studentId: s.id,
        studentName: s.name,
        nisn: s.nisn,
        classId: s.classId,
        className: s.className,
        status: 'H',
        timeRecorded: '07:00',
        recordedBy: 'Guru Piket / Sistem Otomatis'
      });
      filledHCount++;
    }
  }
}

console.log('Total generated attendance records:', allAttendanceRecords.length);
console.log('Preserved existing records:', preservedCount);
console.log('Filled missing as H records:', filledHCount);

// Status distribution
const statusCounts = {};
for (const r of allAttendanceRecords) {
  statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
}
console.log('Final Status distribution:', statusCounts);

// 5. Write to src/data/historicalAttendance.ts
console.log('Writing src/data/historicalAttendance.ts...');
const outContent = `import { AttendanceRecord } from '../types';\n\nexport const historicalAttendanceData: AttendanceRecord[] = ${JSON.stringify(allAttendanceRecords, null, 2)};\n`;
fs.writeFileSync('src/data/historicalAttendance.ts', outContent, 'utf8');
console.log('Successfully generated src/data/historicalAttendance.ts!');
