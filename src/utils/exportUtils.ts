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

/**
 * Ekspor Rekapitulasi Presensi SMAN 1 Batu ke format Excel (.xlsx)
 * Menggunakan kode status H, I, S, A, D serta konfirmasi surat I/S
 */
export const exportAttendanceToExcel = (
  schoolProfile: SchoolProfile,
  recapData: StudentRecapItem[],
  startDate: string,
  endDate: string,
  selectedClass: string,
  attendanceRecords?: AttendanceRecord[]
) => {
  const wb = XLSX.utils.book_new();
  const diffDays = getDaysDifference(startDate, endDate);
  const isDaily = diffDays > 0 && diffDays <= 31 && Boolean(attendanceRecords);
  const datesList = isDaily ? getDatesRangeList(startDate, endDate) : [];

  // Lookup map for fast daily status lookup
  const recordMap = new Map<string, { status: string; hasLetter?: string }>();
  if (isDaily && attendanceRecords) {
    attendanceRecords.forEach((r) => {
      if (r.date >= startDate && r.date <= endDate) {
        recordMap.set(`${r.studentId}_${r.date}`, { status: r.status, hasLetter: r.hasLetter });
      }
    });
  }

  const headerRow: (string | number)[] = [
    'No',
    'NISN',
    'Nama Siswa',
    'Kelas',
    'L/P',
  ];

  if (isDaily) {
    datesList.forEach((d) => {
      const parts = d.split('-');
      const isWeekend = isWeekendDay(d);
      const shortDay = getDayShortName(d);
      headerRow.push(isWeekend ? `${parts[2]}/${parts[1]} (${shortDay})` : `${parts[2]}/${parts[1]}`);
    });
  }

  headerRow.push(
    'H (Hadir)',
    'S (Sakit)',
    'I (Izin)',
    'A (Alpa)',
    'D (Dispen)',
    'Surat Lengkap',
    'Surat Belum',
    'Total Hari',
    'Persentase Hadir (%)'
  );

  const sheetData: (string | number)[][] = [
    [schoolProfile.name.toUpperCase()],
    [`NPSN: ${schoolProfile.npsn} | ${schoolProfile.address}, ${schoolProfile.city}, ${schoolProfile.province}`],
    [isDaily ? 'LAPORAN PRESENSI HARIAN SISWA (PER TANGGAL)' : 'LAPORAN REKAPITULASI PRESENSI KEHADIRAN SISWA (JUMLAH)'],
    [`Periode: ${formatDateIndonesian(startDate)} s.d. ${formatDateIndonesian(endDate)} (${diffDays} Hari)`],
    [`Filter Kelas: ${selectedClass === 'ALL' ? 'Semua Kelas (36 Rombel)' : selectedClass} | Kode: H=Hadir, S=Sakit, I=Izin, A=Alpa, D=Dispen | ! = I/S Belum Kumpulkan Surat`],
    [],
    headerRow,
  ];

  let totalH = 0;
  let totalS = 0;
  let totalI = 0;
  let totalA = 0;
  let totalD = 0;
  let totalSuratAda = 0;
  let totalSuratBelum = 0;

  recapData.forEach((item, index) => {
    totalH += item.hadir;
    totalS += item.sakit;
    totalI += item.izin;
    totalA += item.alpa;
    totalD += item.dispen;
    totalSuratAda += item.suratLengkap;
    totalSuratBelum += item.suratBelumAda;

    const row: (string | number)[] = [
      index + 1,
      item.nisn,
      item.name,
      item.className,
      item.gender,
    ];

    if (isDaily) {
      datesList.forEach((d) => {
        const r = recordMap.get(`${item.studentId}_${d}`);
        if (!r) {
          row.push('-');
        } else if ((r.status === 'I' || r.status === 'S') && r.hasLetter !== 'Sudah Ada Surat') {
          row.push(`${r.status}!`); // Tanda ! jika belum ada surat
        } else {
          row.push(r.status);
        }
      });
    }

    row.push(
      item.hadir,
      item.sakit,
      item.izin,
      item.alpa,
      item.dispen,
      item.suratLengkap,
      item.suratBelumAda,
      item.totalDays,
      `${item.percentage}%`
    );

    sheetData.push(row);
  });

  const avgPercentage = recapData.length > 0
    ? (recapData.reduce((acc, curr) => acc + curr.percentage, 0) / recapData.length).toFixed(1)
    : '0';

  // Summary Row
  const summaryRow: (string | number)[] = [
    'TOTAL',
    '',
    `Total: ${recapData.length} Siswa`,
    '',
    '',
  ];
  if (isDaily) {
    datesList.forEach(() => {
      summaryRow.push('');
    });
  }
  summaryRow.push(
    totalH,
    totalS,
    totalI,
    totalA,
    totalD,
    totalSuratAda,
    totalSuratBelum,
    '',
    `Rata-rata: ${avgPercentage}%`
  );

  sheetData.push([]);
  sheetData.push(summaryRow);

  sheetData.push([]);
  sheetData.push(['', '', '', '', '', '', '', '', 'Kota Batu, ' + getTodayIndonesian()]);
  sheetData.push(['', '', '', '', '', '', '', '', 'Mengetahui,']);
  sheetData.push(['', '', '', '', '', '', '', '', 'Kepala ' + schoolProfile.name]);
  sheetData.push([]);
  sheetData.push([]);
  sheetData.push(['', '', '', '', '', '', '', '', schoolProfile.principalName]);
  sheetData.push(['', '', '', '', '', '', '', '', `NIP. ${schoolProfile.principalNip}`]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  const cols: { wch: number }[] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 6 },  // L/P
  ];
  if (isDaily) {
    datesList.forEach(() => {
      cols.push({ wch: 5 });
    });
  }
  cols.push(
    { wch: 9 },  // H
    { wch: 9 },  // S
    { wch: 9 },  // I
    { wch: 9 },  // A
    { wch: 9 },  // D
    { wch: 14 }, // Surat Lengkap
    { wch: 14 }, // Surat Belum
    { wch: 10 }, // Total
    { wch: 16 }  // %
  );
  ws['!cols'] = cols;

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Presensi');

  const sanitizedClassName = selectedClass === 'ALL' ? 'Semua_36_Rombel' : selectedClass.replace(/\s+/g, '_');
  const modePrefix = isDaily ? 'Presensi_Harian' : 'Rekap_Presensi';
  const filename = `${modePrefix}_SMAN1Batu_${sanitizedClassName}_${startDate}_sd_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Ekspor Rekapitulasi Presensi SMAN 1 Batu ke format PDF
 * Layout Landscape resmi dengan Kop Surat Sekolah SMAN 1 Batu
 * - Jika rentang tanggal maksimal 1 bulan (<= 31 hari, misal 29, 30, 31 hari):
 *   Menampilkan kolom: No, NISN, Nama Lengkap, Kelas, L/P, Status Presensi (per tanggal), dan Rekapitulasi Jumlah (H, S, I, A, D).
 * - Jika rentang tanggal > 1 bulan (> 31 hari):
 *   Menampilkan kolom: No, NISN, Nama Lengkap, Kelas, L/P, dan Rekapitulasi Jumlah (H, S, I, A, D, % Hadir).
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
  const diffDays = getDaysDifference(startDate, endDate);
  const isDaily = diffDays > 0 && diffDays <= 31;
  const datesList = isDaily ? getDatesRangeList(startDate, endDate) : [];

  // Map student attendance per date
  const recordMap = new Map<string, string>();
  if (isDaily && attendanceRecords) {
    attendanceRecords.forEach((r) => {
      if (r.date >= startDate && r.date <= endDate) {
        recordMap.set(`${r.studentId}_${r.date}`, r.status);
      }
    });
  }

  // Margin horizontal
  const marginX = 10;

  // Header SMAN 1 Batu (Kop Surat)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 30, 45);
  doc.text(`PEMERINTAH PROVINSI JAWA TIMUR - DINAS PENDIDIKAN`, pageWidth / 2, 11, { align: 'center' });
  doc.setFontSize(14.5);
  doc.text(schoolProfile.name.toUpperCase(), pageWidth / 2, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `NPSN: ${schoolProfile.npsn} | ${schoolProfile.address}, ${schoolProfile.city}, ${schoolProfile.province} ${schoolProfile.postalCode}`,
    pageWidth / 2,
    22,
    { align: 'center' }
  );

  // Double border divider
  doc.setDrawColor(20, 30, 45);
  doc.setLineWidth(0.6);
  doc.line(marginX, 25, pageWidth - marginX, 25);
  doc.setLineWidth(0.2);
  doc.line(marginX, 26, pageWidth - marginX, 26);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const docTitle = isDaily
    ? 'LAPORAN PRESENSI HARIAN SISWA (PER TANGGAL)'
    : 'LAPORAN REKAPITULASI PRESENSI KEHADIRAN SISWA';
  doc.text(docTitle, pageWidth / 2, 31, { align: 'center' });

  // Subtitle / Filters
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const classNameText = selectedClass === 'ALL' ? 'Semua Rombel (Kelas X, XI, XII)' : `Rombel ${selectedClass}`;
  doc.text(`Periode: ${formatDateIndonesian(startDate)} s.d. ${formatDateIndonesian(endDate)} (${diffDays} Hari)`, marginX, 36);
  doc.text(`Rombel: ${classNameText}`, marginX, 40);
  doc.text(`T.A.: ${schoolProfile.academicYear} (${schoolProfile.semester}) | Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa, D=Dispen`, pageWidth - marginX, 36, { align: 'right' });
  doc.text(`Tanggal Cetak: ${getTodayIndonesian()}`, pageWidth - marginX, 40, { align: 'right' });

  // Calculate Totals
  const totalH = recapData.reduce((acc, curr) => acc + curr.hadir, 0);
  const totalS = recapData.reduce((acc, curr) => acc + curr.sakit, 0);
  const totalI = recapData.reduce((acc, curr) => acc + curr.izin, 0);
  const totalA = recapData.reduce((acc, curr) => acc + curr.alpa, 0);
  const totalD = recapData.reduce((acc, curr) => acc + curr.dispen, 0);
  const avgPercentage = recapData.length > 0
    ? (recapData.reduce((acc, curr) => acc + curr.percentage, 0) / recapData.length).toFixed(1)
    : '0';

  let headConfig: any[] = [];
  let tableRows: any[][] = [];
  let columnStyles: Record<number, any> = {};

  if (isDaily) {
    // Mode 1: Rentang <= 31 Hari (Per Tanggal)
    // Kolom: No, NISN, Nama Lengkap, Kelas, L/P, Status Presensi (per tanggal), Rekapitulasi Jumlah (H, S, I, A, D)
    const isMultiMonth = startDate.slice(0, 7) !== endDate.slice(0, 7);

    headConfig = [
      [
        { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NISN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Nama Lengkap', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Kelas', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'L/P', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Status Presensi', colSpan: datesList.length, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Rekapitulasi Jumlah', colSpan: 5, styles: { halign: 'center', valign: 'middle' } },
      ],
      [
        ...datesList.map((d) => {
          const dayNum = parseInt(d.split('-')[2], 10);
          const monthNum = parseInt(d.split('-')[1], 10);
          return {
            content: isMultiMonth ? `${dayNum}/${monthNum}` : `${dayNum}`,
            styles: { halign: 'center', valign: 'middle' },
          };
        }),
        { content: 'H', styles: { halign: 'center', valign: 'middle' } },
        { content: 'S', styles: { halign: 'center', valign: 'middle' } },
        { content: 'I', styles: { halign: 'center', valign: 'middle' } },
        { content: 'A', styles: { halign: 'center', valign: 'middle' } },
        { content: 'D', styles: { halign: 'center', valign: 'middle' } },
      ],
    ];

    tableRows = recapData.map((item, idx) => {
      const dailyStatuses = datesList.map((d) => recordMap.get(`${item.studentId}_${d}`) || '-');
      return [
        idx + 1,
        item.nisn,
        item.name,
        item.className,
        item.gender,
        ...dailyStatuses,
        item.hadir,
        item.sakit,
        item.izin,
        item.alpa,
        item.dispen,
      ];
    });

    // Summary row
    tableRows.push([
      '',
      '',
      `TOTAL (${recapData.length} Siswa)`,
      '',
      '',
      ...datesList.map(() => ''),
      totalH,
      totalS,
      totalI,
      totalA,
      totalD,
    ]);

    const dateColWidth = datesList.length > 25 ? 5.2 : datesList.length > 15 ? 6.5 : 8;
    columnStyles = {
      0: { halign: 'center', cellWidth: 7 },
      1: { halign: 'center', cellWidth: 19 },
      2: { halign: 'left', cellWidth: datesList.length > 25 ? 40 : 'auto' },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 6 },
    };

    datesList.forEach((_, idx) => {
      columnStyles[5 + idx] = { halign: 'center', cellWidth: dateColWidth };
    });

    for (let i = 0; i < 5; i++) {
      columnStyles[5 + datesList.length + i] = { halign: 'center', cellWidth: 5.5, fontStyle: 'bold' };
    }
  } else {
    // Mode 2: Rentang > 1 Bulan (> 31 Hari)
    // Kolom: No, NISN, Nama Lengkap, Kelas, L/P, Rekapitulasi Jumlah (H, S, I, A, D, % Hadir)
    headConfig = [
      [
        { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NISN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Nama Lengkap', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Kelas', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'L/P', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Rekapitulasi Jumlah', colSpan: 6, styles: { halign: 'center', valign: 'middle' } },
      ],
      [
        { content: 'Hadir (H)', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Sakit (S)', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Izin (I)', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Alpa (A)', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Dispen (D)', styles: { halign: 'center', valign: 'middle' } },
        { content: '% Hadir', styles: { halign: 'center', valign: 'middle' } },
      ],
    ];

    tableRows = recapData.map((item, idx) => [
      idx + 1,
      item.nisn,
      item.name,
      item.className,
      item.gender,
      item.hadir,
      item.sakit,
      item.izin,
      item.alpa,
      item.dispen,
      `${item.percentage}%`,
    ]);

    // Summary row
    tableRows.push([
      '',
      '',
      `TOTAL (${recapData.length} Siswa)`,
      '',
      '',
      totalH,
      totalS,
      totalI,
      totalA,
      totalD,
      `Rata: ${avgPercentage}%`,
    ]);

    columnStyles = {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'left', cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 20 },
      9: { halign: 'center', cellWidth: 20 },
      10: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
    };
  }

  autoTable(doc, {
    startY: 44,
    head: headConfig,
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: isDaily ? (datesList.length > 25 ? 6 : datesList.length > 15 ? 6.5 : 7.5) : 8,
      cellPadding: isDaily ? (datesList.length > 25 ? 0.6 : 0.8) : 1.2,
      textColor: [30, 41, 59],
      lineWidth: 0.1,
      lineColor: [203, 213, 225],
    },
    headStyles: {
      fillColor: [16, 118, 110], // Teal SMAN 1 Batu
      textColor: [255, 255, 255],
      fontSize: isDaily ? (datesList.length > 25 ? 6.5 : 7.5) : 8.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: isDaily ? (datesList.length > 25 ? 0.6 : 0.8) : 1.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didParseCell: (data) => {
      // Highlight summary row at the bottom
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
      // In daily view, tint weekend date columns
      if (isDaily && datesList.length > 0) {
        if (data.section === 'head' && data.row.index === 1) {
          const dIdx = data.column.index - 5;
          if (dIdx >= 0 && dIdx < datesList.length && isWeekendDay(datesList[dIdx])) {
            data.cell.styles.fillColor = [225, 29, 72]; // Soft rose/red for weekend header
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
        if (data.section === 'body' && data.row.index < tableRows.length - 1) {
          const dIdx = data.column.index - 5;
          if (dIdx >= 0 && dIdx < datesList.length && isWeekendDay(datesList[dIdx])) {
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
      }
    },
    margin: { left: marginX, right: marginX },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const pageHeight = doc.internal.pageSize.getHeight();
  let sigY = finalY;

  if (sigY > pageHeight - 38) {
    doc.addPage();
    sigY = 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Left side signature: Koordinator Guru Piket
  doc.text('Mengetahui,', 25, sigY);
  doc.text('Koordinator Guru Piket / Wali Kelas', 25, sigY + 5);
  doc.text('(..................................................)', 25, sigY + 22);
  doc.text('NIP. ........................................', 25, sigY + 27);

  // Right side signature: Kepala SMAN 1 Batu
  const rightX = pageWidth - 80;
  doc.text(`Kota Batu, ${getTodayIndonesian()}`, rightX, sigY);
  doc.text(`Kepala ${schoolProfile.name}`, rightX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolProfile.principalName, rightX, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${schoolProfile.principalNip}`, rightX, sigY + 27);

  const sanitizedClassName = selectedClass === 'ALL' ? 'Semua_Rombel' : selectedClass.replace(/\s+/g, '_');
  const modePrefix = isDaily ? 'Presensi_Harian' : 'Rekap_Presensi';
  const filename = `${modePrefix}_SMAN1Batu_${sanitizedClassName}_${startDate}_sd_${endDate}.pdf`;
  doc.save(filename);
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
