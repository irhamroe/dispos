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

// Also load Siswa sheet to get mapping of ID_Kelas / NIS / Nama
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
console.log('Mapped Excel NIS to Students count:', excelNisToStudentMap.size);

const wsAbs = wb.Sheets['Data_Absensi'];
const dataAbs = xlsx.utils.sheet_to_json(wsAbs);

let matchedCount = 0;
let unmatchedCount = 0;
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
    matchedCount++;
    convertedAttendance.push({
      id: `att-${dateStr}-${student.id}`,
      studentId: student.id,
      date: dateStr,
      status: status,
      letterStatus: row['Status Surat'] === 'Ada' ? 'Diterima' : (row['Status Surat'] === 'Pending' ? 'Menunggu' : undefined),
      recordedBy: 'Sinkronisasi AppScript SMAN 1 Batu',
      timeRecorded: '07:00'
    });
  } else {
    unmatchedCount++;
  }
}

console.log('Total converted attendance records:', convertedAttendance.length);
console.log('Matched count:', matchedCount);
console.log('Unmatched count:', unmatchedCount);

const uniqueDates = Array.from(new Set(convertedAttendance.map(a => a.date))).sort();
console.log('Total school days:', uniqueDates.length);
console.log('Date range:', uniqueDates[0], 'to', uniqueDates[uniqueDates.length - 1]);

const summary = {};
for (const a of convertedAttendance) {
  summary[a.status] = (summary[a.status] || 0) + 1;
}
console.log('Status Summary:', summary);
