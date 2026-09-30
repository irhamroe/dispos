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
 * Ekspor Rekapitulasi Presensi SMAN 1 Batu ke format Excel (.xls)
 * Format persis seperti format dinas/sekolah pada lampiran:
 * - Baris 1: Judul TA, Bulan, Tahun, JUMLAH
 * - Baris 2: Inisial Hari (J, Sa, M, Sn, Sl, R, K) & Header S, I, A, D
 * - Baris 3: Kolom No, NIS, NAMA, L/P, KELAS, & Angka Tanggal 1..31
 * - Kolom Hari Minggu (M) berwarna MERAH solid
 * - Nilai S, I, A, D dengan warna latar khusus, H kosong
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
  const startParts = startDate.split('-');
  const startYear = startParts[0] || '2026';
  const startMonthIdx = parseInt(startParts[1] || '5', 10) - 1;
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[startMonthIdx] || 'Bulan';
  const academicYear = schoolProfile.academicYear || '2025/2026';

  // Map student attendance per date
  const recordMap = new Map<string, string>();
  if (attendanceRecords) {
    attendanceRecords.forEach((r) => {
      if (r.date >= startDate && r.date <= endDate) {
        recordMap.set(`${r.studentId}_${r.date}`, r.status);
      }
    });
  }

  const dayInitials = datesList.map((d) => getIndonesianDayInitial(d));
  const dayNumbers = datesList.map((d) => parseInt(d.split('-')[2], 10));
  const isSundays = datesList.map((d) => isSundayDate(d));

  const totalDateCols = datesList.length || 1;
  const midCol1 = Math.floor(totalDateCols / 2);
  const midCol2 = totalDateCols - midCol1;

  // Generate HTML table for Excel
  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Rekap Absensi</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  table { border-collapse: collapse; font-family: 'Calibri', 'Arial', sans-serif; font-size: 11px; }
  th, td { border: 1px solid #000000; text-align: center; vertical-align: middle; padding: 4px; }
  .title-hdr { font-weight: bold; font-size: 11.5px; text-align: left; background-color: #FFFFFF; border: 1px solid #000; }
  .month-hdr { font-weight: bold; font-size: 11.5px; text-align: center; background-color: #FFFFFF; border: 1px solid #000; }
  .year-hdr { font-weight: bold; font-size: 11.5px; text-align: center; background-color: #FFFFFF; border: 1px solid #000; }
  .jumlah-hdr { font-weight: bold; font-size: 11px; text-align: center; background-color: #FFFFFF; border: 1px solid #000; }
  .main-hdr { font-weight: bold; font-size: 11px; background-color: #FFFFFF; border: 1px solid #000; }
  .day-name-hdr { background-color: #FFE599; font-weight: bold; font-size: 10px; border: 1px solid #000; }
  .day-num-hdr { background-color: #9BC2E6; font-weight: bold; font-size: 10px; border: 1px solid #000; }
  .hdr-s { background-color: #A9D08E; font-weight: bold; border: 1px solid #000; }
  .hdr-i { background-color: #F8CBAD; font-weight: bold; border: 1px solid #000; }
  .hdr-a { background-color: #F4B084; font-weight: bold; border: 1px solid #000; }
  .hdr-d { background-color: #FFF2CC; font-weight: bold; border: 1px solid #000; }
  .sunday-col { background-color: #FF0000; color: #FFFFFF; border: 1px solid #000; }
  .cell-s { background-color: #A9D08E; font-weight: bold; color: #000000; border: 1px solid #000; }
  .cell-i { background-color: #F8CBAD; font-weight: bold; color: #000000; border: 1px solid #000; }
  .cell-a { background-color: #F4B084; font-weight: bold; color: #000000; border: 1px solid #000; }
  .cell-d { background-color: #FFF2CC; font-weight: bold; color: #000000; border: 1px solid #000; }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .font-mono { font-family: 'Consolas', 'Courier New', monospace; }
</style>
</head>
<body>
<table>
  <!-- Row 1: Top Titles -->
  <tr>
    <th colspan="5" class="title-hdr">REKAP ABSENSI SISWA TAHUN PELAJARAN ${academicYear}</th>
    <th colspan="${midCol1}" class="month-hdr">${monthName}</th>
    <th colspan="${midCol2}" class="year-hdr">${startYear}</th>
    <th colspan="4" class="jumlah-hdr">JUMLAH</th>
  </tr>

  <!-- Row 2: Day Initials & Summary Headers -->
  <tr>
    <th rowspan="2" class="main-hdr" style="width: 32px;">No</th>
    <th rowspan="2" class="main-hdr" style="width: 65px;">NIS</th>
    <th rowspan="2" class="main-hdr" style="width: 220px;">NAMA</th>
    <th rowspan="2" class="main-hdr" style="width: 35px;">L/P</th>
    <th rowspan="2" class="main-hdr" style="width: 55px;">KELAS</th>
    ${dayInitials.map((init) => `<th class="day-name-hdr" style="width: 26px;">${init}</th>`).join('')}
    <th class="hdr-s" style="width: 32px;">S</th>
    <th class="hdr-i" style="width: 32px;">I</th>
    <th class="hdr-a" style="width: 32px;">A</th>
    <th class="hdr-d" style="width: 32px;">D</th>
  </tr>

  <!-- Row 3: Day Numbers -->
  <tr>
    ${dayNumbers.map((num) => `<th class="day-num-hdr">${num}</th>`).join('')}
    <th class="hdr-s" style="border-top: none;"></th>
    <th class="hdr-i" style="border-top: none;"></th>
    <th class="hdr-a" style="border-top: none;"></th>
    <th class="hdr-d" style="border-top: none;"></th>
  </tr>

  <!-- Data Rows -->
  ${recapData.map((item, idx) => {
    const dailyCells = datesList.map((d, i) => {
      const isSun = isSundays[i];
      if (isSun) {
        return `<td class="sunday-col"></td>`;
      }
      const st = recordMap.get(`${item.studentId}_${d}`);
      if (st === 'S') return `<td class="cell-s">S</td>`;
      if (st === 'I') return `<td class="cell-i">I</td>`;
      if (st === 'A') return `<td class="cell-a">A</td>`;
      if (st === 'D') return `<td class="cell-d">D</td>`;
      return `<td></td>`;
    }).join('');

    return `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="font-mono text-center">${item.nisn}</td>
      <td class="text-left" style="font-weight: 500;">${item.name}</td>
      <td class="text-center">${item.gender}</td>
      <td class="text-center font-bold">${item.className}</td>
      ${dailyCells}
      <td class="text-center font-bold">${item.sakit}</td>
      <td class="text-center font-bold">${item.izin}</td>
      <td class="text-center font-bold">${item.alpa}</td>
      <td class="text-center font-bold">${item.dispen}</td>
    </tr>`;
  }).join('')}
</table>
</body>
</html>
  `;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedClassName = selectedClass === 'ALL' ? 'Semua_Kelas' : selectedClass.replace(/\s+/g, '_');
  link.download = `Rekap_Absensi_Siswa_${sanitizedClassName}_${monthName}_${startYear}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Ekspor Rekapitulasi Presensi SMAN 1 Batu ke format PDF
 * Layout Landscape sesuai persis dengan gambar lampiran:
 * - Header 3 baris terstruktur (Judul TA, Inisial Hari, Angka Tanggal, JUMLAH S/I/A/D)
 * - Kolom Hari Minggu berwarna Merah Solid
 * - Label S, I, A, D berwarna khusus
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

  const datesList = getDatesRangeList(startDate, endDate);
  const startParts = startDate.split('-');
  const startYear = startParts[0] || '2026';
  const startMonthIdx = parseInt(startParts[1] || '5', 10) - 1;
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[startMonthIdx] || 'Bulan';
  const academicYear = schoolProfile.academicYear || '2025/2026';

  const recordMap = new Map<string, string>();
  if (attendanceRecords) {
    attendanceRecords.forEach((r) => {
      if (r.date >= startDate && r.date <= endDate) {
        recordMap.set(`${r.studentId}_${r.date}`, r.status);
      }
    });
  }

  const dayInitials = datesList.map((d) => getIndonesianDayInitial(d));
  const dayNumbers = datesList.map((d) => parseInt(d.split('-')[2], 10));
  const isSundays = datesList.map((d) => isSundayDate(d));

  const totalDateCols = datesList.length || 1;
  const midCol1 = Math.floor(totalDateCols / 2);
  const midCol2 = totalDateCols - midCol1;

  // Header configuration
  const head = [
    // Row 1: Top Titles
    [
      { content: `REKAP ABSENSI SISWA TAHUN PELAJARAN ${academicYear}`, colSpan: 5, styles: { halign: 'left', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
      { content: monthName, colSpan: midCol1, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
      { content: startYear, colSpan: midCol2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
      { content: 'JUMLAH', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
    ],
    // Row 2: Day Initials & Summary Headers
    [
      { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'NIS', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'NAMA', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'L/P', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'KELAS', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [255, 255, 255], fontStyle: 'bold' } },
      ...dayInitials.map((init) => ({
        content: init,
        styles: { halign: 'center', valign: 'middle', fillColor: [255, 229, 153], textColor: [0, 0, 0], fontStyle: 'bold' }
      })),
      { content: 'S', styles: { halign: 'center', valign: 'middle', fillColor: [169, 208, 142], textColor: [0, 0, 0], fontStyle: 'bold' } },
      { content: 'I', styles: { halign: 'center', valign: 'middle', fillColor: [248, 203, 173], textColor: [0, 0, 0], fontStyle: 'bold' } },
      { content: 'A', styles: { halign: 'center', valign: 'middle', fillColor: [244, 176, 132], textColor: [0, 0, 0], fontStyle: 'bold' } },
      { content: 'D', styles: { halign: 'center', valign: 'middle', fillColor: [255, 242, 204], textColor: [0, 0, 0], fontStyle: 'bold' } },
    ],
    // Row 3: Day Numbers
    [
      ...dayNumbers.map((num) => ({
        content: String(num),
        styles: { halign: 'center', valign: 'middle', fillColor: [155, 194, 230], textColor: [0, 0, 0], fontStyle: 'bold' }
      })),
      { content: '', styles: { fillColor: [169, 208, 142] } },
      { content: '', styles: { fillColor: [248, 203, 173] } },
      { content: '', styles: { fillColor: [244, 176, 132] } },
      { content: '', styles: { fillColor: [255, 242, 204] } },
    ],
  ];

  // Body rows
  const body = recapData.map((item, idx) => {
    const dailyVals = datesList.map((d, i) => {
      if (isSundays[i]) return '';
      const st = recordMap.get(`${item.studentId}_${d}`);
      return (st === 'S' || st === 'I' || st === 'A' || st === 'D') ? st : '';
    });

    return [
      idx + 1,
      item.nisn,
      item.name,
      item.gender,
      item.className,
      ...dailyVals,
      item.sakit,
      item.izin,
      item.alpa,
      item.dispen,
    ];
  });

  const numDates = datesList.length;
  const dayColWidth = numDates > 0 ? Math.min(6, 175 / numDates) : 5.5;

  autoTable(doc, {
    head,
    body,
    startY: 6,
    margin: { top: 6, left: 6, right: 6, bottom: 6 },
    styles: {
      fontSize: 6.5,
      cellPadding: 0.5,
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 6 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'left', cellWidth: numDates > 25 ? 42 : 55 },
      3: { halign: 'center', cellWidth: 6 },
      4: { halign: 'center', cellWidth: 11 },
    },
    didParseCell: (data) => {
      const colIdx = data.column.index;
      if (data.section === 'body') {
        if (colIdx >= 5 && colIdx < 5 + numDates) {
          const dateIdx = colIdx - 5;
          const isSun = isSundays[dateIdx];
          if (isSun) {
            data.cell.styles.fillColor = [239, 68, 68]; // Red Sunday column
            data.cell.styles.textColor = [255, 255, 255];
          } else {
            const rawVal = data.cell.raw;
            if (rawVal === 'S') {
              data.cell.styles.fillColor = [169, 208, 142];
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'I') {
              data.cell.styles.fillColor = [248, 203, 173];
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'A') {
              data.cell.styles.fillColor = [244, 176, 132];
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'D') {
              data.cell.styles.fillColor = [255, 242, 204];
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          data.cell.styles.halign = 'center';
          data.cell.styles.cellWidth = dayColWidth;
        } else if (colIdx >= 5 + numDates) {
          data.cell.styles.halign = 'center';
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.cellWidth = 6.5;
        }
      }
    },
  });

  const sanitizedClassName = selectedClass === 'ALL' ? 'Semua_Kelas' : selectedClass.replace(/\s+/g, '_');
  doc.save(`Rekap_Absensi_Siswa_${sanitizedClassName}_${monthName}_${startYear}.pdf`);
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
