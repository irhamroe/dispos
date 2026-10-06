import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Filter, 
  TrendingUp, 
  ChevronRight,
  FileCheck, 
  FileX, 
  Layers, 
  ArrowRight, 
  XCircle, 
  Sparkles 
} from 'lucide-react';
import { AttendanceRecord, DisciplineRecord, Student } from '../types';
import { RombelClass } from '../data/initialData';
import { NavTab } from './Sidebar';
import { formatDateIndonesian } from '../utils/exportUtils';
import { sortClasses } from '../utils/sortUtils';
import { MdCard, MdBadge, MdButton } from './md3';

interface DashboardViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  disciplineRecords: DisciplineRecord[];
  classes: RombelClass[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  attendanceRecords,
  disciplineRecords,
  classes,
  selectedDate,
  onDateChange,
  onNavigateTab,
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  const availableClasses = useMemo(() => {
    const list = selectedGradeFilter === 'ALL' ? classes : classes.filter((c) => c.grade === selectedGradeFilter);
    return sortClasses(list);
  }, [classes, selectedGradeFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchGrade = selectedGradeFilter === 'ALL' || s.grade === selectedGradeFilter;
      const matchClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
      return matchGrade && matchClass;
    });
  }, [students, selectedGradeFilter, selectedClassFilter]);

  const dateAttendance = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      if (rec.date !== selectedDate) return false;
      const student = students.find((s) => s.id === rec.studentId);
      if (!student) return false;
      const matchGrade = selectedGradeFilter === 'ALL' || student.grade === selectedGradeFilter;
      const matchClass = selectedClassFilter === 'ALL' || rec.className === selectedClassFilter;
      return matchGrade && matchClass;
    });
  }, [attendanceRecords, selectedDate, students, selectedGradeFilter, selectedClassFilter]);

  const totalFiltered = filteredStudents.length;

  const hadirCount = dateAttendance.filter((r) => r.status === 'H').length;
  const izinCount = dateAttendance.filter((r) => r.status === 'I').length;
  const sakitCount = dateAttendance.filter((r) => r.status === 'S').length;
  const alpaCount = dateAttendance.filter((r) => r.status === 'A').length;
  const dispenCount = dateAttendance.filter((r) => r.status === 'D').length;

  const sickAndPermitRecords = dateAttendance.filter((r) => r.status === 'I' || r.status === 'S');
  const suratAdaCount = sickAndPermitRecords.filter((r) => r.hasLetter === 'Sudah Ada Surat').length;
  const suratBelumCount = sickAndPermitRecords.filter((r) => r.hasLetter === 'Belum Ada Surat').length;

  const attendancePercentage = totalFiltered > 0
    ? Math.round(((hadirCount + dispenCount) / totalFiltered) * 100)
    : 0;

  const alpaStudents = dateAttendance.filter((r) => r.status === 'A');
  const missingLetterStudents = dateAttendance.filter(
    (r) => (r.status === 'S' || r.status === 'I') && r.hasLetter === 'Belum Ada Surat'
  );

  const classBreakdown = useMemo(() => {
    return availableClasses.map((cls) => {
      const cStudents = students.filter((s) => s.className === cls.name);
      const cAtt = attendanceRecords.filter((r) => r.date === selectedDate && r.className === cls.name);
      const cPresent = cAtt.filter((r) => r.status === 'H' || r.status === 'D').length;
      const cAlpa = cAtt.filter((r) => r.status === 'A').length;
      const rate = cStudents.length > 0 ? Math.round((cPresent / cStudents.length) * 100) : 0;
      return {
        name: cls.name,
        grade: cls.grade,
        total: cStudents.length,
        present: cPresent,
        alpa: cAlpa,
        rate,
      };
    });
  }, [availableClasses, students, attendanceRecords, selectedDate]);

  return (
    <div className="space-y-6 pb-12 font-roboto text-[#1C1B1F]">
      {/* Top Filter Card */}
      <MdCard variant="elevated" radius="large" className="p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-medium text-[#1C1B1F] tracking-tight">
              Dashboard Statistik
            </h2>
            <span className="p-1.5 rounded-full bg-[#E8DEF8] text-[#6750A4]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-[#49454F] mt-0.5">
            Pantau kehadiran siswa &amp; status kedisiplinan secara real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
            <Calendar className="w-4 h-4 text-[#6750A4] shrink-0" />
            <span className="text-[#49454F]">Tanggal:</span>
            <input
              id="dash-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-[#1C1B1F] font-medium focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-1.5 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
            <span className="text-[#49454F]">Jenjang:</span>
            <select
              id="dash-grade-filter"
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value as any);
                setSelectedClassFilter('ALL');
              }}
              className="bg-transparent font-medium text-[#1C1B1F] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="X">Kelas X (12 Rombel)</option>
              <option value="XI">Kelas XI (12 Rombel)</option>
              <option value="XII">Kelas XII (12 Rombel)</option>
            </select>
          </div>

          {/* Rombel Class filter */}
          <div className="flex items-center gap-1.5 bg-[#E7E0EC] rounded-full px-4 py-2 text-xs text-[#1C1B1F]">
            <Filter className="w-4 h-4 text-[#6750A4] shrink-0" />
            <select
              id="dash-class-filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent font-medium text-[#1C1B1F] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Rombel ({totalFiltered} Siswa)</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  Rombel {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </MdCard>

      {/* Main KPI Bento Grid: Hero Stat + H, I, S, A, D Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Attendance Rate (Hero Card) */}
        <div className="col-span-2 bg-[#6750A4] rounded-[32px] p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#E8DEF8]">
                Tingkat Kehadiran
              </span>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                {attendancePercentage}%
              </span>
              <span className="text-xs text-[#E8DEF8]">
                ({hadirCount + dispenCount} dari {totalFiltered} siswa)
              </span>
            </div>
          </div>

          <div className="mt-5 relative z-10">
            <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#C8E6C9] h-full rounded-full transition-all duration-500"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px] text-[#E8DEF8]">
              <span>{formatDateIndonesian(selectedDate)}</span>
              <span className="font-medium">{selectedClassFilter === 'ALL' ? `${availableClasses.length} Rombel` : `Rombel ${selectedClassFilter}`}</span>
            </div>
          </div>
        </div>

        {/* H: Hadir */}
        <MdCard variant="filled" hoverable className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#49454F] uppercase">Hadir (H)</span>
            <div className="w-8 h-8 rounded-full bg-[#C8E6C9] text-[#1B5E20] flex items-center justify-center font-bold text-xs">
              H
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-[#1B5E20]">{hadirCount}</div>
            <div className="text-[11px] text-[#49454F] mt-0.5">Presensi aktif kelas</div>
          </div>
        </MdCard>

        {/* I: Izin */}
        <MdCard variant="filled" hoverable className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#49454F] uppercase">Izin (I)</span>
            <div className="w-8 h-8 rounded-full bg-[#E1F5FE] text-[#0277BD] flex items-center justify-center font-bold text-xs">
              I
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-[#0277BD]">{izinCount}</div>
            <div className="text-[11px] text-[#49454F] mt-0.5">Izin acara / urusan</div>
          </div>
        </MdCard>

        {/* S: Sakit */}
        <MdCard variant="filled" hoverable className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#49454F] uppercase">Sakit (S)</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center justify-center font-bold text-xs">
              S
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-[#E65100]">{sakitCount}</div>
            <div className="text-[11px] text-[#49454F] mt-0.5">Istirahat / rawat</div>
          </div>
        </MdCard>

        {/* A: Alpa */}
        <MdCard variant="filled" hoverable className="flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#49454F] uppercase">Alpa (A)</span>
            <div className="w-8 h-8 rounded-full bg-[#FFDAD6] text-[#410002] flex items-center justify-center font-bold text-xs">
              A
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-[#BA1A1A]">{alpaCount}</div>
            <div className="text-[11px] text-[#BA1A1A] font-medium mt-0.5">Tanpa keterangan</div>
          </div>
        </MdCard>
      </div>

      {/* Verification Surat Badge Bar */}
      <MdCard variant="tonal" radius="large" className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#6750A4] text-white flex items-center justify-center shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#1D192B]">
              Verifikasi Surat Siswa (Sakit &amp; Izin)
            </h4>
            <p className="text-xs text-[#49454F] mt-0.5">
              Total <span className="font-medium text-[#1D192B]">{sickAndPermitRecords.length} siswa</span> berstatus Izin / Sakit pada tanggal terpilih.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-full bg-[#C8E6C9] text-[#1B5E20] text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1B5E20]" />
            <span>{suratAdaCount} Ada Surat</span>
          </span>

          <span className="px-3.5 py-1.5 rounded-full bg-[#FFDAD6] text-[#410002] text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#BA1A1A]" />
            <span>{suratBelumCount} Belum Ada Surat</span>
          </span>
        </div>
      </MdCard>

      {/* Grid: 36 Rombel Matrix + Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 36 Rombel Attendance Monitor */}
        <div className="lg:col-span-2 bg-[#F3EDF7] p-6 rounded-[32px] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-[#1C1B1F] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6750A4]" />
                <span>Monitoring Kehadiran 36 Rombel</span>
              </h3>
              <p className="text-xs text-[#49454F] mt-0.5">
                Pencapaian kehadiran per kelas di SMAN 1 Batu (Target disiplin: &ge; 95%)
              </p>
            </div>
            <MdButton
              variant="tonal"
              size="sm"
              onClick={() => onNavigateTab('recap')}
            >
              <span>Rekap Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </MdButton>
          </div>

          {/* Rombel Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {classBreakdown.map((item) => (
              <div
                key={item.name}
                onClick={() => {
                  setSelectedClassFilter(item.name);
                  onNavigateTab('attendance');
                }}
                className="p-3.5 rounded-2xl bg-[#FFFBFE] hover:bg-[#E8DEF8] hover:shadow-xs cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#1C1B1F]">{item.name}</span>
                  <span
                    className={`font-bold text-xs ${
                      item.rate >= 95 ? 'text-[#1B5E20]' : item.rate >= 85 ? 'text-[#E65100]' : 'text-[#BA1A1A]'
                    }`}
                  >
                    {item.rate}%
                  </span>
                </div>
                
                <div className="w-full bg-[#E7E0EC] rounded-full h-1.5 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.rate >= 95 ? 'bg-[#2E7D32]' : item.rate >= 85 ? 'bg-[#EF6C00]' : 'bg-[#C62828]'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-[#49454F]">
                  <span>{item.present}/{item.total} Hadir</span>
                  {item.alpa > 0 && <span className="font-bold text-[#BA1A1A]">{item.alpa} Alpa</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Attention List */}
        <div className="space-y-4">
          {/* Siswa Alpa */}
          <div className="bg-[#F3EDF7] p-5 rounded-[28px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#BA1A1A] flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Alpa Hari Ini ({alpaStudents.length})</span>
              </h4>
            </div>
            <p className="text-[11px] text-[#49454F] mb-3">
              Siswa tidak hadir tanpa kabar; segera hubungi wali murid.
            </p>

            {alpaStudents.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#E8DEF8] text-[#1D192B] text-xs text-center font-medium">
                Nihil alpa pada rombel terpilih! 🎉
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alpaStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-3 rounded-xl bg-[#FFFBFE] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#1C1B1F]">{st.studentName}</div>
                      <div className="text-[10px] text-[#49454F]">{st.className} • NISN: {st.nisn}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FFDAD6] text-[#410002]">
                      Alpa
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Siswa Sakit/Izin Belum Menyerahkan Surat */}
          <div className="bg-[#F3EDF7] p-5 rounded-[28px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E65100] flex items-center gap-1.5">
                <FileX className="w-4 h-4" />
                <span>Belum Ada Surat ({missingLetterStudents.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => onNavigateTab('rekap-surat-izin')}
                className="text-[11px] font-medium text-[#6750A4] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Kelola Surat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-[#49454F] mb-3">
              Daftar izin / sakit yang belum mengumpulkan surat keterangan fisik.
            </p>

            {missingLetterStudents.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#E8DEF8] text-[#1D192B] text-xs text-center font-medium">
                Seluruh siswa izin &amp; sakit telah menyerahkan surat.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {missingLetterStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-3 rounded-xl bg-[#FFFBFE] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#1C1B1F]">{st.studentName}</div>
                      <div className="text-[10px] text-[#49454F]">{st.className} • Status: {st.status === 'S' ? 'Sakit' : 'Izin'}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FFE0B2] text-[#E65100]">
                      Surat Belum Ada
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
