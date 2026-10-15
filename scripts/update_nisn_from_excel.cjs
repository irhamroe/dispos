const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 1. Read Excel file
const excelPath = path.resolve(__dirname, '../NISN.xlsx');
if (!fs.existsSync(excelPath)) {
  console.error('File NISN.xlsx not found at', excelPath);
  process.exit(1);
}

const wb = xlsx.readFile(excelPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const excelRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const excelMap = new Map();
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

for (let i = 0; i < excelRows.length; i++) {
  const row = excelRows[i];
  if (!row || row.length === 0) continue;
  const rawName = String(row[0] || '').trim();
  let rawNisn = String(row[1] || '').trim();

  // Skip header or empty rows
  if (!rawName || rawName.toLowerCase() === 'nama') continue;

  // Pad numeric NISN to 10 digits if needed (e.g. lost leading zero in Excel)
  if (/^\d+$/.test(rawNisn) && rawNisn.length < 10) {
    rawNisn = rawNisn.padStart(10, '0');
  }

  excelMap.set(rawName.toLowerCase(), rawNisn);
}

console.log(`Loaded ${excelMap.size} student NISN entries from NISN.xlsx`);

// Verified alias mapping for names with abbreviation or slight spelling differences
const aliasMap = {
  'keiko melvena levianka p': 'keiko melvena levianka putri',
  'alda maratus sholiha anshori': "alda mar'atus sholihah anshori",
  'ayunda maharani prasetyaningtyas': 'ayunda maharani prasetyaningtias',
  'dewi arumdalu rizky ramadhani': 'dewi arumdalu rizky r',
  'nurul laili qurratul uyun': 'nurul laili quratul uyun',
  'putri candra mahardika': 'putri chandra mahardhika',
  'suci tia ramadhani': 'sucitia ramadani',
  'salwa aurelia mayura parithusta': 'salwa aurelia mayura paritusta',
  'akhasa panji anugrah': 'akasha panji anugrah',
  'astrid putri irdyantara mangiwa': 'astrid putri irdyantara m',
  'bryans madha wahyu p': 'bryans madha wahyu putra alansya',
  'wildan daniswara faadhilah z': 'wildan daniswara faadhilah zuhdi'
};

const excelNormMap = new Map();
for (const [nameLower, nisn] of excelMap.entries()) {
  excelNormMap.set(norm(nameLower), nisn);
}

// 2. Read src/data/studentsData.ts
const studentsDataPath = path.resolve(__dirname, '../src/data/studentsData.ts');
const fileContent = fs.readFileSync(studentsDataPath, 'utf8');

const regex = /realStudentsData:\s*Student\[\]\s*=\s*(\[[\s\S]*?\]);/;
const match = fileContent.match(regex);
if (!match) {
  console.error('Could not find realStudentsData array in studentsData.ts');
  process.exit(1);
}

const students = JSON.parse(match[1]);
console.log(`Loaded ${students.length} students from src/data/studentsData.ts`);

let updatedCount = 0;
let unchangedCount = 0;
let notFoundCount = 0;
const sampleUpdates = [];

const updatedStudents = students.map((s) => {
  const nameLower = s.name.trim().toLowerCase();
  const nameNorm = norm(s.name);

  let targetExcelName = nameLower;
  if (aliasMap[nameLower]) {
    targetExcelName = aliasMap[nameLower];
  }

  let finalNisn = null;
  if (excelMap.has(targetExcelName)) {
    finalNisn = excelMap.get(targetExcelName);
  } else if (excelNormMap.has(nameNorm)) {
    finalNisn = excelNormMap.get(nameNorm);
  }

  if (finalNisn) {
    if (finalNisn !== s.nisn) {
      updatedCount++;
      if (sampleUpdates.length < 15) {
        sampleUpdates.push({
          name: s.name,
          class: s.className,
          oldNisn: s.nisn,
          newNisn: finalNisn,
        });
      }
      return { ...s, nisn: finalNisn };
    } else {
      unchangedCount++;
      return s;
    }
  } else {
    notFoundCount++;
    return s;
  }
});

console.log('--- REKAP PEMBARUAN NISN ---');
console.log(`Total siswa diperbarui dengan NISN baru : ${updatedCount}`);
console.log(`Total siswa yang NISN-nya sudah sesuai : ${unchangedCount}`);
console.log(`Total siswa dipertahankan (tidak di Excel): ${notFoundCount}`);
console.log('\nContoh 15 Pembaruan NISN:');
console.table(sampleUpdates);

// 3. Write back to src/data/studentsData.ts
const newJsonString = JSON.stringify(updatedStudents, null, 2);
const newFileContent = fileContent.replace(regex, `realStudentsData: Student[] = ${newJsonString};`);

fs.writeFileSync(studentsDataPath, newFileContent, 'utf8');
console.log('Successfully written updated realStudentsData to src/data/studentsData.ts');
