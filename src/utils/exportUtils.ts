import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SchoolProfile, StudentRecapItem, DisciplineRecord, AttendanceRecord, Student, WaliKelasTeacher } from '../types';

export const formatDateIndonesian = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${months[monthIndex] || month} ${year}`;
  } catch {
    return dateStr;
  }
};

export const formatDayAndDateIndonesian = (dateStr: string): string => {
  try {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayName = days[dateObj.getDay()] || '';
    return `${dayName}, ${formatDateIndonesian(dateStr)}`;
  } catch {
    return formatDateIndonesian(dateStr);
  }
};

export const getDaysDifference = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  if (isNaN(diffTime) || diffTime < 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const getDatesRangeList = (startDate: string, endDate: string): string[] => {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) return [];
  const dates: string[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

export const getDayShortName = (dateStr: string): string => {
  const d = new Date(dateStr);
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return dayNames[d.getDay()] || '';
};

export const isWeekendDay = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6; // 0 = Minggu, 6 = Sabtu (Hari Libur)
};

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayIndonesian = (): string => {
  const today = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
};

export const getIndonesianDayInitial = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const day = d.getDay(); // 0 = Minggu, 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu
    const initials = ['M', 'Sn', 'Sl', 'R', 'K', 'J', 'Sa'];
    return initials[day] || '';
  } catch {
    return '';
  }
};

export const isSundayDate = (dateStr: string): boolean => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.getDay() === 0;
  } catch {
    return false;
  }
};

/**
 * Ekspor Rekapitulasi Presensi ke format Excel (.xls)
 * - Tanpa kop dinas resmi & tanpa blok tanda tangan
 * - Di atas tabel hanya judul & subheader periode/rombel
 * - Header tabel bertingkat dengan penanda hari libur (Sabtu/Minggu)
 * - Warna kotak presensi sesuai status
 */
export const exportAttendanceToExcel = (
  schoolProfile: SchoolProfile,
  recapData: StudentRecapItem[],
  startDate: string,
  endDate: string,
  selectedClass: string,
  attendanceRecords?: AttendanceRecord[]
) => {
  const datesList = getDatesRangeList(startDate, endDate);
  const numDates = datesList.length;
  const totalCols = 5 + numDates + 5;

  // Map student attendance per date
  const recordMap = new Map<string, string>();
  if (attendanceRecords) {
    attendanceRecords.forEach((r) => {
      if (r.date >= startDate && r.date <= endDate) {
        recordMap.set(`${r.studentId}_${r.date}`, r.status);
      }
    });
  }

  // Calculate totals
  const totalH = recapData.reduce((acc, c) => acc + c.hadir, 0);
  const totalS = recapData.reduce((acc, c) => acc + c.sakit, 0);
  const totalI = recapData.reduce((acc, c) => acc + c.izin, 0);
  const totalA = recapData.reduce((acc, c) => acc + c.alpa, 0);
  const totalD = recapData.reduce((acc, c) => acc + c.dispen, 0);

  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Rekap Presensi</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; padding: 4px 6px; }
  .title-main { font-size: 14pt; font-weight: bold; text-align: center; border: none; padding: 6px 0; color: #0f172a; }
  .meta-sub { text-align: left; font-weight: bold; border: none; font-size: 10pt; color: #334155; padding-bottom: 6px; }
  .tbl-header { background-color: #0f766e; color: #ffffff; font-weight: bold; font-size: 10pt; border: 1px solid #0f766e; }
  .tbl-header-weekend { background-color: #dc2626; color: #ffffff; font-weight: bold; font-size: 10pt; border: 1px solid #dc2626; }
  .cell-h { background-color: #dcfce7; color: #166534; font-weight: bold; }
  .cell-s { background-color: #fef3c7; color: #92400e; font-weight: bold; }
  .cell-i { background-color: #e0f2fe; color: #075985; font-weight: bold; }
  .cell-a { background-color: #fee2e2; color: #991b1b; font-weight: bold; }
  .cell-d { background-color: #f3e8ff; color: #6b21a8; font-weight: bold; }
  .cell-weekend { background-color: #fee2e2; color: #ef4444; font-weight: bold; }
  .total-row { background-color: #e2e8f0; font-weight: bold; color: #0f172a; }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .font-mono { font-family: 'Consolas', monospace; }
</style>
</head>
<body>
<table>
  <!-- Title -->
  <tr>
    <th colspan="${totalCols}" class="title-main">Rekapitulasi Absensi Siswa</th>
  </tr>
  <!-- Subheader -->
  <tr>
    <td colspan="${totalCols}" class="meta-sub">
      Periode: ${formatDateIndonesian(startDate)} s.d. ${formatDateIndonesian(endDate)} (${getDaysDifference(startDate, endDate)} Hari) | Rombel: ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}
    </td>
  </tr>

  <!-- Table Header Row 1 -->
  <tr>
    <th rowspan="2" class="tbl-header" style="width: 32px;">No</th>
    <th rowspan="2" class="tbl-header" style="width: 85px;">NISN</th>
    <th rowspan="2" class="tbl-header" style="width: 220px;">Nama Lengkap</th>
    <th rowspan="2" class="tbl-header" style="width: 55px;">Kelas</th>
    <th rowspan="2" class="tbl-header" style="width: 40px;">L/P</th>
    <th colspan="${numDates}" class="tbl-header">Status Presensi</th>
    <th colspan="5" class="tbl-header">Rekapitulasi Jumlah</th>
  </tr>

  <!-- Table Header Row 2 -->
  <tr>
    ${datesList.map((d) => {
      const dayNum = parseInt(d.split('-')[2], 10);
      const isWeekend = isWeekendDay(d);
      return `<th class="${isWeekend ? 'tbl-header-weekend' : 'tbl-header'}" style="width: 30px;">${dayNum}</th>`;
    }).join('')}
    <th class="tbl-header" style="width: 32px;">H</th>
    <th class="tbl-header" style="width: 32px;">S</th>
    <th class="tbl-header" style="width: 32px;">I</th>
    <th class="tbl-header" style="width: 32px;">A</th>
    <th class="tbl-header" style="width: 32px;">D</th>
  </tr>

  <!-- Data Rows -->
  ${recapData.map((item, idx) => {
    const dailyCells = datesList.map((d) => {
      const isWeekend = isWeekendDay(d);
      const st = recordMap.get(`${item.studentId}_${d}`);
      if (st === 'H') return `<td class="cell-h">H</td>`;
      if (st === 'S') return `<td class="cell-s">S</td>`;
      if (st === 'I') return `<td class="cell-i">I</td>`;
      if (st === 'A') return `<td class="cell-a">A</td>`;
      if (st === 'D') return `<td class="cell-d">D</td>`;
      if (isWeekend) return `<td class="cell-weekend">Libur</td>`;
      return `<td>-</td>`;
    }).join('');

    return `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="font-mono text-center">${item.nisn}</td>
      <td class="text-left">${item.name}</td>
      <td class="text-center">${item.className}</td>
      <td class="text-center">${item.gender}</td>
      ${dailyCells}
      <td class="text-center font-bold">${item.hadir}</td>
      <td class="text-center font-bold">${item.sakit}</td>
      <td class="text-center font-bold">${item.izin}</td>
      <td class="text-center font-bold">${item.alpa}</td>
      <td class="text-center font-bold">${item.dispen}</td>
    </tr>`;
  }).join('')}

  <!-- TOTAL Row -->
  <tr class="total-row">
    <td colspan="5" class="text-center font-bold">TOTAL (${recapData.length} Siswa)</td>
    ${datesList.map((d) => {
      if (isWeekendDay(d)) return `<td>-</td>`;
      let countDayH = 0;
      recapData.forEach((s) => {
        if (recordMap.get(`${s.studentId}_${d}`) === 'H') countDayH++;
      });
      return `<td class="text-center font-bold">${countDayH}</td>`;
    }).join('')}
    <td class="text-center font-bold">${totalH}</td>
    <td class="text-center font-bold">${totalS}</td>
    <td class="text-center font-bold">${totalI}</td>
    <td class="text-center font-bold">${totalA}</td>
    <td class="text-center font-bold">${totalD}</td>
  </tr>
</table>
</body>
</html>
  `;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedClassName = selectedClass === 'ALL' ? 'Semua_Kelas' : selectedClass.replace(/\s+/g, '_');
  link.download = `Rekapitulasi_Absensi_Siswa_${sanitizedClassName}_${startDate}_sd_${endDate}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Ekspor Rekapitulasi Presensi ke format PDF
 * - Desain presisi 1 Halaman Landscape A4
 * - Tanpa kop dinas resmi & tanpa tanda tangan
 * - Di atas tabel hanya judul & subheader periode/rombel
 * - Header bertingkat Teal & Merah (Sabtu/Minggu)
 * - Warna kotak presensi sesuai status (H=Hijau, S=Kuning, I=Biru, A=Merah, D=Ungu)
 */
export const exportAttendanceToPdf = (
  schoolProfile: SchoolProfile,
  recapData: StudentRecapItem[],
  startDate: string,
  endDate: string,
  selectedClass: string,
  attendanceRecords?: AttendanceRecord[]
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const datesList = getDatesRangeList(startDate, endDate);
  const numDates = datesList.length;

  // Margin horizontal dinamis agar tabel selalu optimal dan penuh
  const marginX = numDates > 25 ? 6 : numDates > 15 ? 8 : 10;
  const availableWidth = pageWidth - marginX * 2;

  // Map student attendance per date
  const recordMap = new Map<string, string>();
  if (attendanceRecords) {
    attendanceRecords.forEach((r) => {
      if (r.date >= startDate && r.date <= endDate) {
        recordMap.set(`${r.studentId}_${r.date}`, r.status);
      }
    });
  }

  // Calculate totals
  const totalH = recapData.reduce((acc, c) => acc + c.hadir, 0);
  const totalS = recapData.reduce((acc, c) => acc + c.sakit, 0);
  const totalI = recapData.reduce((acc, c) => acc + c.izin, 0);
  const totalA = recapData.reduce((acc, c) => acc + c.alpa, 0);
  const totalD = recapData.reduce((acc, c) => acc + c.dispen, 0);

  // 1. Judul di atas tabel: "Rekapitulasi Absensi Siswa"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Rekapitulasi Absensi Siswa', pageWidth / 2, 9.5, { align: 'center' });

  // 2. Subheader Periode & Rombel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Periode: ${formatDateIndonesian(startDate)} s.d. ${formatDateIndonesian(endDate)} (${getDaysDifference(startDate, endDate)} Hari)   |   Rombel: ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}`,
    marginX,
    14.5
  );

  // 3. Header Tabel Bertingkat
  const headConfig: any[] = [
    [
      { content: 'No', rowSpan: 2 },
      { content: 'NISN', rowSpan: 2 },
      { content: 'Nama Lengkap', rowSpan: 2 },
      { content: 'Kelas', rowSpan: 2 },
      { content: 'L/P', rowSpan: 2 },
      { content: 'Status Presensi', colSpan: numDates },
      { content: 'Rekapitulasi Jumlah', colSpan: 5 },
    ],
    [
      ...datesList.map((d) => {
        const dayNum = parseInt(d.split('-')[2], 10);
        return { content: String(dayNum) };
      }),
      { content: 'H' },
      { content: 'S' },
      { content: 'I' },
      { content: 'A' },
      { content: 'D' },
    ],
  ];

  // 4. Baris Data Siswa
  const tableRows: any[] = recapData.map((item, idx) => {
    const dailyVals = datesList.map((d) => {
      const st = recordMap.get(`${item.studentId}_${d}`);
      if (st === 'H' || st === 'S' || st === 'I' || st === 'A' || st === 'D') return st;
      if (isWeekendDay(d)) return 'Libur';
      return '-';
    });

    return [
      idx + 1,
      item.nisn,
      item.name,
      item.className,
      item.gender,
      ...dailyVals,
      item.hadir,
      item.sakit,
      item.izin,
      item.alpa,
      item.dispen,
    ];
  });

  // 5. Baris TOTAL di bawah
  const dailyTotals = datesList.map((d) => {
    if (isWeekendDay(d)) return '-';
    let countDayH = 0;
    recapData.forEach((s) => {
      if (recordMap.get(`${s.studentId}_${d}`) === 'H') countDayH++;
    });
    return String(countDayH);
  });

  tableRows.push([
    { content: `TOTAL (${recapData.length} Siswa)`, colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
    ...dailyTotals,
    totalH,
    totalS,
    totalI,
    totalA,
    totalD,
  ]);

  // 6. Dynamic Compact Styling agar selalu muat rapi dalam 1 halaman
  const rowCount = tableRows.length; // ~37 baris untuk 36 siswa + 1 total
  let cellPadding = 0.5;
  let fontSize = 6.5;
  let headFontSize = 7;

  if (rowCount <= 20) {
    cellPadding = 1.1;
    fontSize = 7.8;
    headFontSize = 8.2;
  } else if (rowCount <= 30) {
    cellPadding = 0.7;
    fontSize = 7.0;
    headFontSize = 7.5;
  } else if (rowCount <= 38) {
    cellPadding = 0.42;
    fontSize = 6.2;
    headFontSize = 6.8;
  } else {
    cellPadding = 0.28;
    fontSize = 5.6;
    headFontSize = 6.2;
  }

  // 7. Perhitungan Lebar Kolom Dinamis (100% Memenuhi Lebar Kertas)
  let noW = 8;
  let nisnW = 22;
  let kelasW = 14;
  let genderW = 9;
  let sumColW = 6;

  if (numDates <= 4) {
    noW = 10;
    nisnW = 28;
    kelasW = 18;
    genderW = 12;
    sumColW = 13;
  } else if (numDates <= 10) {
    noW = 9;
    nisnW = 24;
    kelasW = 16;
    genderW = 10;
    sumColW = 10;
  } else if (numDates <= 20) {
    noW = 8;
    nisnW = 21;
    kelasW = 13;
    genderW = 8.5;
    sumColW = 7.5;
  } else if (numDates <= 25) {
    noW = 7.5;
    nisnW = 19;
    kelasW = 12;
    genderW = 8;
    sumColW = 6.2;
  } else {
    noW = 6.5;
    nisnW = 18;
    kelasW = 11;
    genderW = 7.5;
    sumColW = 5.2;
  }

  const fixedNonDateWidth = noW + nisnW + kelasW + genderW + sumColW * 5;
  const remainingForNamaAndDates = availableWidth - fixedNonDateWidth;

  let namaW = 55;
  let dayColW = 7;

  if (numDates === 0) {
    namaW = remainingForNamaAndDates;
    dayColW = 0;
  } else if (numDates <= 2) {
    namaW = Math.min(85, remainingForNamaAndDates * 0.5);
    dayColW = (remainingForNamaAndDates - namaW) / numDates;
  } else if (numDates <= 5) {
    namaW = Math.min(75, remainingForNamaAndDates * 0.45);
    dayColW = (remainingForNamaAndDates - namaW) / numDates;
  } else if (numDates <= 10) {
    namaW = Math.min(68, remainingForNamaAndDates * 0.4);
    dayColW = (remainingForNamaAndDates - namaW) / numDates;
  } else if (numDates <= 20) {
    namaW = Math.min(58, remainingForNamaAndDates * 0.35);
    dayColW = (remainingForNamaAndDates - namaW) / numDates;
  } else {
    // > 20 hari (rentang panjang hingga 31 hari)
    const minDayColW = 4.8;
    dayColW = Math.max(minDayColW, (remainingForNamaAndDates - 45) / numDates);
    namaW = Math.max(40, remainingForNamaAndDates - numDates * dayColW);
  }

  const colWidths: { [key: number]: any } = {};
  colWidths[0] = { halign: 'center', cellWidth: noW };
  colWidths[1] = { halign: 'center', cellWidth: nisnW };
  colWidths[2] = { halign: 'left', cellWidth: namaW };
  colWidths[3] = { halign: 'center', cellWidth: kelasW };
  colWidths[4] = { halign: 'center', cellWidth: genderW };

  for (let i = 0; i < numDates; i++) {
    colWidths[5 + i] = { halign: 'center', cellWidth: dayColW };
  }
  for (let i = 0; i < 5; i++) {
    colWidths[5 + numDates + i] = { halign: 'center', cellWidth: sumColW, fontStyle: 'bold' };
  }

  autoTable(doc, {
    startY: 17,
    head: headConfig,
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize,
      cellPadding,
      lineWidth: 0.1,
      lineColor: [203, 213, 225],
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 118, 110], // Teal
      textColor: [255, 255, 255],
      fontSize: headFontSize,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: cellPadding + 0.2,
    },
    columnStyles: colWidths,
    didParseCell: (data) => {
      // Header weekend styling (Sabtu & Minggu berwarna merah)
      if (data.section === 'head') {
        if (data.row.index === 1) {
          const dIdx = data.column.index - 5;
          if (dIdx >= 0 && dIdx < numDates && isWeekendDay(datesList[dIdx])) {
            data.cell.styles.fillColor = [220, 38, 38]; // Merah hari libur
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }

      // Body styling
      if (data.section === 'body') {
        // Highlight total bottom row
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [226, 232, 240];
          return;
        }

        const colIdx = data.column.index;
        // Tanggal columns
        if (colIdx >= 5 && colIdx < 5 + numDates) {
          const dIdx = colIdx - 5;
          const isWeekend = isWeekendDay(datesList[dIdx]);
          const rawVal = data.cell.raw;

          if (rawVal === 'H') {
            data.cell.styles.fillColor = [220, 252, 231]; // Soft Green
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fontStyle = 'bold';
          } else if (rawVal === 'S') {
            data.cell.styles.fillColor = [254, 243, 199]; // Soft Amber
            data.cell.styles.textColor = [146, 64, 14];
            data.cell.styles.fontStyle = 'bold';
          } else if (rawVal === 'I') {
            data.cell.styles.fillColor = [224, 242, 254]; // Soft Sky Blue
            data.cell.styles.textColor = [7, 89, 133];
            data.cell.styles.fontStyle = 'bold';
          } else if (rawVal === 'A') {
            data.cell.styles.fillColor = [254, 226, 226]; // Soft Red
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fontStyle = 'bold';
          } else if (rawVal === 'D') {
            data.cell.styles.fillColor = [243, 232, 255]; // Soft Purple
            data.cell.styles.textColor = [107, 33, 168];
            data.cell.styles.fontStyle = 'bold';
          } else if (isWeekend || rawVal === 'Libur') {
            data.cell.styles.fillColor = [254, 226, 226]; // Libur Red Tint
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
            data.cell.text = ['Libur'];
          }
        }
      }
    },
    margin: { top: 17, bottom: 5, left: marginX, right: marginX },
  });

  const sanitizedClassName = selectedClass === 'ALL' ? 'Semua_Kelas' : selectedClass.replace(/\s+/g, '_');
  doc.save(`Rekapitulasi_Absensi_Siswa_${sanitizedClassName}_${startDate}_sd_${endDate}.pdf`);
};


/**
 * Ekspor Catatan Pelanggaran & Pembinaan Siswa ke Excel
 */
export const exportDisciplineToExcel = (
  schoolProfile: SchoolProfile,
  records: DisciplineRecord[],
  filterText?: string
) => {
  const wb = XLSX.utils.book_new();

  const sheetData: (string | number)[][] = [
    [schoolProfile.name.toUpperCase()],
    [`NPSN: ${schoolProfile.npsn} | ${schoolProfile.address}, ${schoolProfile.city}`],
    ['BUKU PENCATATAN PELANGGARAN & PEMBINAAN SISWA'],
    [`Tanggal Ekspor: ${getTodayIndonesian()} | Status Filter: ${filterText || 'Semua'}`],
    [],
    [
      'No',
      'Tanggal Kejadian',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Jenis Pelanggaran',
      'Status Pembinaan',
      'Tanggal Pembinaan',
      'Bukti Surat Pembinaan',
      'Guru Pelapor'
    ]
  ];

  records.forEach((rec, idx) => {
    sheetData.push([
      idx + 1,
      rec.date,
      rec.nisn,
      rec.studentName,
      rec.className,
      rec.violationName,
      rec.coachingStatus === 'Sudah' ? 'Sudah Dilakukan Pembinaan' : 'Belum Pembinaan',
      rec.coachingStatus === 'Sudah' ? (rec.coachingDate || '-') : '-',
      rec.coachingEvidenceFileName || (rec.coachingStatus === 'Sudah' ? 'Terlampir' : '-'),
      rec.reportedBy
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 12 },
    { wch: 35 },
    { wch: 22 },
    { wch: 16 },
    { wch: 30 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Pelanggaran');
  XLSX.writeFile(wb, `Laporan_Pelanggaran_Siswa_SMAN1Batu_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Ekspor Catatan Pelanggaran & Pembinaan Siswa ke PDF
 */
export const exportDisciplineToPdf = (
  schoolProfile: SchoolProfile,
  records: DisciplineRecord[],
  filterText?: string
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header SMAN 1 Batu
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(schoolProfile.name.toUpperCase(), pageWidth / 2, 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`${schoolProfile.address}, ${schoolProfile.city} | NPSN: ${schoolProfile.npsn}`, pageWidth / 2, 18, { align: 'center' });

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(14, 21, pageWidth - 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('BUKU LAPORAN PENCATATAN DATA PELANGGARAN & PEMBINAAN SISWA', pageWidth / 2, 27, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Filter: ${filterText || 'Semua Data'} | Total Catatan: ${records.length}`, 14, 33);
  doc.text(`Dicetak: ${getTodayIndonesian()}`, pageWidth - 14, 33, { align: 'right' });

  const tableRows = records.map((rec, idx) => [
    idx + 1,
    rec.date,
    `${rec.studentName}\n(${rec.nisn})`,
    rec.className,
    rec.violationName,
    rec.coachingStatus === 'Sudah' ? 'Sudah' : 'Belum',
    rec.coachingStatus === 'Sudah' ? (rec.coachingDate || '-') : '-',
    rec.coachingEvidenceFileName || (rec.coachingStatus === 'Sudah' ? 'Terlampir' : '-'),
    rec.reportedBy
  ]);

  autoTable(doc, {
    startY: 37,
    head: [[
      'No', 'Tgl Kejadian', 'Siswa / NISN', 'Kelas',
      'Jenis Pelanggaran', 'Status Pembinaan', 'Tgl Pembinaan', 'Bukti Surat', 'Pelapor'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'left', cellWidth: 55 },
      5: { halign: 'center', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 35 },
      8: { halign: 'left', cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const pageHeight = doc.internal.pageSize.getHeight();
  let sigY = finalY;
  if (sigY > pageHeight - 35) {
    doc.addPage();
    sigY = 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text('Mengetahui,', 30, sigY);
  doc.text('Koordinator Guru BK / Tim Ketertiban Siswa', 30, sigY + 5);
  doc.text('(..................................................)', 30, sigY + 22);

  const rightX = pageWidth - 80;
  doc.text(`Kota Batu, ${getTodayIndonesian()}`, rightX, sigY);
  doc.text(`Kepala ${schoolProfile.name}`, rightX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolProfile.principalName, rightX, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${schoolProfile.principalNip}`, rightX, sigY + 27);

  doc.save(`Laporan_Data_Pelanggaran_SMAN1Batu_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Ekspor Rekap Surat Izin & Sakit Siswa ke format Excel (.xlsx)
 */
export const exportPermissionLettersToExcel = (
  schoolProfile: SchoolProfile,
  records: AttendanceRecord[],
  filterText: string
) => {
  const wb = XLSX.utils.book_new();

  const titleRows = [
    [schoolProfile.name.toUpperCase()],
    ['REKAPITULASI SURAT IZIN & SAKIT SISWA'],
    [`Filter: ${filterText} | Dicetak: ${getTodayIndonesian()}`],
    [],
    [
      'No',
      'Tanggal',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Status Presensi',
      'Status Surat Izin',
      'Petugas Pencatat'
    ]
  ];

  const dataRows = records.map((r, index) => [
    index + 1,
    r.date,
    r.nisn,
    r.studentName,
    r.className,
    r.status === 'I' ? 'Izin (I)' : 'Sakit (S)',
    r.hasLetter || 'Belum Ada Surat',
    r.recordedBy || '-'
  ]);

  const allRows = [...titleRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 16 }, // NISN
    { wch: 28 }, // Nama Siswa
    { wch: 10 }, // Kelas
    { wch: 16 }, // Status Presensi
    { wch: 24 }, // Status Surat Izin
    { wch: 24 }, // Petugas
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Surat_Izin');
  XLSX.writeFile(wb, `Rekap_Surat_Izin_SMAN1Batu_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Ekspor Rekap Surat Izin & Sakit Siswa ke PDF
 */
export const exportPermissionLettersToPdf = (
  schoolProfile: SchoolProfile,
  records: AttendanceRecord[],
  filterText: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolProfile.name.toUpperCase(), pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text('REKAPITULASI PEMENUHAN SURAT IZIN & SAKIT SISWA', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${schoolProfile.address}, ${schoolProfile.city} | NPSN: ${schoolProfile.npsn}`, pageWidth / 2, 27, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 29, pageWidth - 14, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Filter: ${filterText || 'Semua Data'} | Total Data: ${records.length}`, 14, 34);
  doc.text(`Dicetak: ${getTodayIndonesian()}`, pageWidth - 14, 34, { align: 'right' });

  const tableRows = records.map((r, idx) => [
    idx + 1,
    r.date,
    r.nisn,
    r.studentName,
    r.className,
    r.status === 'I' ? 'Izin (I)' : 'Sakit (S)',
    r.hasLetter === 'Sudah Ada Surat' ? 'Lengkap' : 'Belum Kumpul'
  ]);

  autoTable(doc, {
    startY: 38,
    head: [[
      'No', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Jenis', 'Status Surat'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [180, 83, 9], // amber-700
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 26 },
      3: { halign: 'left', cellWidth: 50 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const pageHeight = doc.internal.pageSize.getHeight();
  let sigY = finalY;
  if (sigY > pageHeight - 35) {
    doc.addPage();
    sigY = 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text('Mengetahui,', 30, sigY);
  doc.text('Guru Piket / Tim Presensi Siswa', 30, sigY + 5);
  doc.text('(..................................................)', 30, sigY + 22);

  const rightX = pageWidth - 80;
  doc.text(`Kota Batu, ${getTodayIndonesian()}`, rightX, sigY);
  doc.text(`Kepala ${schoolProfile.name}`, rightX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolProfile.principalName, rightX, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${schoolProfile.principalNip}`, rightX, sigY + 27);

  doc.save(`Laporan_Rekap_Surat_Izin_SMAN1Batu_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export interface ParentCallLetterData {
  schoolProfile: SchoolProfile;
  student: Student;
  waliKelas?: WaliKelasTeacher;
  violations: DisciplineRecord[];
  letterNumber: string;
  callNumber: string;
  callDate: string;
  callTime: string;
  callPlace: string;
  meetWith: string;
  agenda: string;
  notes?: string;
  senderTitle: string;
  senderName: string;
}

/**
 * Ekspor Surat Panggilan Orang Tua Siswa ke PDF Resmi
 */
export const exportParentCallLetterToPdf = (data: ParentCallLetterData) => {
  const {
    schoolProfile,
    student,
    waliKelas,
    violations,
    letterNumber,
    callNumber,
    callDate,
    callTime,
    callPlace,
    meetWith,
    agenda,
    notes,
    senderTitle,
    senderName,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;

  // Kop Surat Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH PROVINSI JAWA TIMUR', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(10.5);
  doc.text('DINAS PENDIDIKAN', pageWidth / 2, 19, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolProfile.name.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${schoolProfile.address}, ${schoolProfile.city}, Jawa Timur ${schoolProfile.postalCode || '65314'} | NPSN: ${schoolProfile.npsn}`,
    pageWidth / 2,
    30,
    { align: 'center' }
  );

  // Garis Kop Surat Ganda
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(marginX, 33, pageWidth - marginX, 33);
  doc.setLineWidth(0.2);
  doc.line(marginX, 34, pageWidth - marginX, 34);

  // Tempat & Tanggal Surat (Kanan)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Kota Batu, ${getTodayIndonesian()}`, pageWidth - marginX, 39, { align: 'right' });

  // Detail Surat (Kiri)
  doc.text(`Nomor     : ${letterNumber}`, marginX, 39);
  doc.text(`Sifat        : Penting / Rahasia`, marginX, 43.5);
  doc.text(`Lampiran : 1 (satu) Berkas Riwayat Pelanggaran`, marginX, 48);
  doc.text(`Perihal    : Surat Panggilan Orang Tua / Wali Murid (${callNumber})`, marginX, 52.5);

  // Tujuan Surat
  let curY = 59;
  doc.text('Kepada Yth.', marginX, curY);
  curY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Bapak / Ibu Orang Tua / Wali dari Siswa:`, marginX, curY);
  curY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Siswa   : ${student.name}`, marginX + 4, curY);
  curY += 4;
  doc.text(`NISN / Kelas  : ${student.nisn} / Kelas ${student.className} (${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'})`, marginX + 4, curY);
  if (waliKelas) {
    curY += 4;
    doc.text(`Wali Kelas     : ${waliKelas.name}`, marginX + 4, curY);
  }
  curY += 4.5;
  doc.text('di Tempat', marginX, curY);

  // Pembuka
  curY += 6;
  doc.text('Dengan hormat,', marginX, curY);
  curY += 4.5;
  const introText = 'Sehubungan dengan pembinaan tata tertib serta kedisiplinan siswa di lingkungan SMA Negeri 1 Batu, bersama ini kami sampaikan rincian riwayat pelanggaran tata tertib sekolah yang pernah tercatat atas nama putra/putri Bapak/Ibu sebagai berikut:';
  const splitIntro = doc.splitTextToSize(introText, pageWidth - (marginX * 2));
  doc.text(splitIntro, marginX, curY);
  curY += (splitIntro.length * 4) + 2;

  // Tabel Pelanggaran
  const totalPoints = violations.reduce((acc, v) => acc + (v.points || 0), 0);
  const violationRows = violations.map((v, idx) => [
    idx + 1,
    v.date,
    v.violationName,
    v.category,
    `${v.points} Poin`,
    v.coachingStatus === 'Sudah' ? 'Sudah Dibina' : 'Belum Dibina',
  ]);

  autoTable(doc, {
    startY: curY,
    head: [[
      'No',
      'Tanggal Kejadian',
      'Nama / Jenis Pelanggaran',
      'Kategori',
      'Poin',
      'Status Pembinaan'
    ]],
    body: violationRows.length > 0 ? violationRows : [
      ['-', '-', 'Tidak ada catatan pelanggaran khusus / Pembinaan preventif berkala', '-', '0 Poin', 'Selesai']
    ],
    foot: violationRows.length > 0 ? [[
      { content: 'TOTAL AKUMULASI POIN PELANGGARAN', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${totalPoints} Poin`, styles: { halign: 'center', fontStyle: 'bold', textColor: [185, 28, 28] } },
      { content: '', styles: { halign: 'center' } }
    ]] : undefined,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'left', cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 24 },
    },
    margin: { left: marginX, right: marginX },
  });

  curY = (doc as any).lastAutoTable.finalY + 4.5;

  // Jadwal Panggilan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const inviteText = 'Guna mencari solusi bersama serta langkah pembinaan terbaik demi kelancaran proses belajar dan masa depan putra/putri Bapak/Ibu, kami sangat mengharap kehadiran Bapak/Ibu pada:';
  const splitInvite = doc.splitTextToSize(inviteText, pageWidth - (marginX * 2));
  doc.text(splitInvite, marginX, curY);
  curY += (splitInvite.length * 4) + 2;

  // Box / List Jadwal
  const indentSchedule = marginX + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Hari / Tanggal  :', indentSchedule, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDayAndDateIndonesian(callDate), indentSchedule + 30, curY);
  curY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Waktu / Pukul   :', indentSchedule, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(callTime, indentSchedule + 30, curY);
  curY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Tempat Pertemuan :', indentSchedule, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(callPlace, indentSchedule + 30, curY);
  curY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Menghadap       :', indentSchedule, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(meetWith, indentSchedule + 30, curY);
  curY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Keperluan / Hal  :', indentSchedule, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(agenda, indentSchedule + 30, curY);
  curY += 4.5;

  if (notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan Khusus  :', indentSchedule, curY);
    doc.setFont('helvetica', 'italic');
    doc.text(notes, indentSchedule + 30, curY);
    curY += 4.5;
  }

  // Penutup
  curY += 1;
  doc.setFont('helvetica', 'normal');
  const closingText = 'Mengingat pentingnya pertemuan ini demi masa depan pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang ditentukan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.';
  const splitClosing = doc.splitTextToSize(closingText, pageWidth - (marginX * 2));
  doc.text(splitClosing, marginX, curY);
  curY += (splitClosing.length * 4) + 6;

  // Cek apakah muat untuk tanda tangan, jika tidak buat halaman baru
  if (curY > pageHeight - 38) {
    doc.addPage();
    curY = 25;
  }

  // Blok Tanda Tangan
  const leftX = marginX + 10;
  const rightX = pageWidth - marginX - 65;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Guru BK / Koordinator Ketertiban,', leftX, curY);
  doc.text(`Kepala ${schoolProfile.name},`, rightX, curY);

  curY += 18;
  doc.setFont('helvetica', 'bold');
  doc.text(senderName || '(..................................................)', leftX, curY);
  doc.text(schoolProfile.principalName, rightX, curY);

  curY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(senderTitle || 'Tim Bimbingan Konseling', leftX, curY);
  doc.text(`NIP. ${schoolProfile.principalNip}`, rightX, curY);

  const cleanStudentName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Surat_Panggilan_${cleanStudentName}_${callDate}.pdf`);
};
