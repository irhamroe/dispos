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

  // Available classes based on grade filter
  const availableClasses = useMemo(() => {
    const list = selectedGradeFilter === 'ALL' ? classes : classes.filter((c) => c.grade === selectedGradeFilter);
    return sortClasses(list);
  }, [classes, selectedGradeFilter]);

  // Filter students based on grade & class
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchGrade = selectedGradeFilter === 'ALL' || s.grade === selectedGradeFilter;
      const matchClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
      return matchGrade && matchClass;
    });
  }, [students, selectedGradeFilter, selectedClassFilter]);

  // Attendance for the selected date and filters
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

  // Counts for H, I, S, A, D
  const hadirCount = dateAttendance.filter((r) => r.status === 'H').length;
  const izinCount = dateAttendance.filter((r) => r.status === 'I').length;
  const sakitCount = dateAttendance.filter((r) => r.status === 'S').length;
  const alpaCount = dateAttendance.filter((r) => r.status === 'A').length;
  const dispenCount = dateAttendance.filter((r) => r.status === 'D').length;

  // Letter verification counts for I & S
  const sickAndPermitRecords = dateAttendance.filter((r) => r.status === 'I' || r.status === 'S');
  const suratAdaCount = sickAndPermitRecords.filter((r) => r.hasLetter === 'Sudah Ada Surat').length;
  const suratBelumCount = sickAndPermitRecords.filter((r) => r.hasLetter === 'Belum Ada Surat').length;

  // Attendance percentage: (Hadir + Dispen) counts toward active presence
  const attendancePercentage = totalFiltered > 0
    ? Math.round(((hadirCount + dispenCount) / totalFiltered) * 100)
    : 0;

  // Absent students (Alpa) and Missing Letter list
  const alpaStudents = dateAttendance.filter((r) => r.status === 'A');
  const missingLetterStudents = dateAttendance.filter(
    (r) => (r.status === 'S' || r.status === 'I') && r.hasLetter === 'Belum Ada Surat'
  );

  // Class breakdown for the selected grade
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
    <div className="space-y-6 pb-12">
      {/* Top Filter Card: Date, Grade & 36 Rombel */}
      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[32px] shadow-clay-card border border-white/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-nunito font-black text-clay-foreground tracking-tight">
              Dashboard Statistik
            </h2>
            <span className="p-1 rounded-xl bg-violet-100 text-violet-700 shadow-clay-orb animate-clay-breathe">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-clay-muted font-medium mt-0.5">
            Pantau kehadiran siswa &amp; status kedisiplinan secara real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker (Recessed) */}
          <div className="flex items-center gap-2 bg-[#EFEBF5] rounded-2xl px-3.5 py-2 text-xs text-clay-foreground shadow-clay-pressed border border-white/40">
            <Calendar className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="text-clay-muted font-medium">Tanggal:</span>
            <input
              id="dash-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-clay-foreground font-nunito font-extrabold focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Grade filter (Recessed) */}
          <div className="flex items-center gap-1.5 bg-[#EFEBF5] rounded-2xl px-3 py-2 text-xs text-clay-foreground shadow-clay-pressed border border-white/40">
            <span className="text-clay-muted font-medium">Jenjang:</span>
            <select
              id="dash-grade-filter"
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value as any);
                setSelectedClassFilter('ALL');
              }}
              className="bg-transparent font-nunito font-extrabold text-clay-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="X">Kelas X (12 Rombel)</option>
              <option value="XI">Kelas XI (12 Rombel)</option>
              <option value="XII">Kelas XII (12 Rombel)</option>
            </select>
          </div>

          {/* Rombel Class filter (Recessed) */}
          <div className="flex items-center gap-1.5 bg-[#EFEBF5] rounded-2xl px-3 py-2 text-xs text-clay-foreground shadow-clay-pressed border border-white/40">
            <Filter className="w-4 h-4 text-violet-600 shrink-0" />
            <select
              id="dash-class-filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent font-nunito font-extrabold text-clay-foreground focus:outline-hidden cursor-pointer"
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
      </div>

      {/* Main KPI Bento Grid: Hero Stat + H, I, S, A, D Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Attendance Rate (Hero Clay Card) */}
        <div className="col-span-2 bg-gradient-to-br from-[#9333EA] via-[#7C3AED] to-[#6D28D9] rounded-[32px] p-6 text-white shadow-clay-card flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          {/* Decorative ambient glow inside card */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-nunito font-extrabold uppercase tracking-wider text-violet-200">
                Tingkat Kehadiran
              </span>
              <span className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-nunito font-black tracking-tight drop-shadow-sm">
                {attendancePercentage}%
              </span>
              <span className="text-xs text-violet-200 font-medium">
                ({hadirCount + dispenCount} dari {totalFiltered} siswa)
              </span>
            </div>
          </div>

          <div className="mt-5 relative z-10">
            <div className="w-full bg-black/20 rounded-full h-3 p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-300 to-teal-200 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2.5 text-[11px] text-violet-200 font-medium">
              <span>{formatDateIndonesian(selectedDate)}</span>
              <span className="font-bold">{selectedClassFilter === 'ALL' ? `${availableClasses.length} Rombel` : `Rombel ${selectedClassFilter}`}</span>
            </div>
          </div>
        </div>

        {/* H: Hadir */}
        <div className="bg-white/85 backdrop-blur-xl rounded-[28px] p-5 shadow-clay-card border border-white hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-nunito font-extrabold text-clay-muted uppercase">Hadir (H)</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-nunito font-black text-sm shadow-clay-orb">
              H
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-nunito font-black text-emerald-600">{hadirCount}</div>
            <div className="text-[11px] text-clay-muted font-medium mt-0.5">Presensi aktif kelas</div>
          </div>
        </div>

        {/* I: Izin */}
        <div className="bg-white/85 backdrop-blur-xl rounded-[28px] p-5 shadow-clay-card border border-white hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-nunito font-extrabold text-clay-muted uppercase">Izin (I)</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center font-nunito font-black text-sm shadow-clay-orb">
              I
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-nunito font-black text-blue-600">{izinCount}</div>
            <div className="text-[11px] text-clay-muted font-medium mt-0.5">Izin acara / urusan</div>
          </div>
        </div>

        {/* S: Sakit */}
        <div className="bg-white/85 backdrop-blur-xl rounded-[28px] p-5 shadow-clay-card border border-white hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-nunito font-extrabold text-clay-muted uppercase">Sakit (S)</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-nunito font-black text-sm shadow-clay-orb">
              S
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-nunito font-black text-amber-600">{sakitCount}</div>
            <div className="text-[11px] text-clay-muted font-medium mt-0.5">Istirahat / rawat</div>
          </div>
        </div>

        {/* A: Alpa */}
        <div className="bg-white/85 backdrop-blur-xl rounded-[28px] p-5 shadow-clay-card border border-white hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-nunito font-extrabold text-clay-muted uppercase">Alpa (A)</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-nunito font-black text-sm shadow-clay-orb">
              A
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-nunito font-black text-rose-600">{alpaCount}</div>
            <div className="text-[11px] text-rose-500 font-bold mt-0.5">Tanpa keterangan</div>
          </div>
        </div>
      </div>

      {/* Verification Surat Badge Bar (Tactile Clay Panel) */}
      <div className="p-5 rounded-[30px] bg-white/85 backdrop-blur-xl shadow-clay-card border border-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-clay-orb">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-nunito font-extrabold text-clay-foreground">
              Verifikasi Surat Siswa (Sakit &amp; Izin)
            </h4>
            <p className="text-xs text-clay-muted font-medium mt-0.5">
              Total <span className="font-bold text-clay-foreground">{sickAndPermitRecords.length} siswa</span> berstatus Izin / Sakit pada tanggal terpilih.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-nunito font-black shadow-clay-pill border border-emerald-200/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{suratAdaCount} Ada Surat</span>
          </span>

          <span className="px-3.5 py-1.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-nunito font-black shadow-clay-pill border border-rose-200/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{suratBelumCount} Belum Ada Surat</span>
          </span>
        </div>
      </div>

      {/* Grid: 36 Rombel Matrix + Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 36 Rombel Attendance Monitor */}
        <div className="lg:col-span-2 bg-white/85 backdrop-blur-xl p-6 rounded-[32px] shadow-clay-card border border-white/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-nunito font-black text-clay-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                <span>Monitoring Kehadiran 36 Rombel</span>
              </h3>
              <p className="text-xs text-clay-muted font-medium mt-0.5">
                Pencapaian kehadiran per kelas di SMAN 1 Batu (Target disiplin: &ge; 95%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('recap')}
              className="px-3.5 py-1.5 rounded-2xl bg-white text-violet-700 text-xs font-nunito font-extrabold shadow-clay-button hover:-translate-y-0.5 active:scale-[0.92] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Rekap Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rombel Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1 clay-custom-scrollbar">
            {classBreakdown.map((item) => (
              <div
                key={item.name}
                onClick={() => {
                  setSelectedClassFilter(item.name);
                  onNavigateTab('attendance');
                }}
                className="p-3.5 rounded-[22px] bg-[#EFEBF5]/60 hover:bg-white shadow-clay-card hover:shadow-clay-card-hover hover:-translate-y-1 cursor-pointer transition-all duration-200 border border-white/60"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-nunito font-black text-clay-foreground">{item.name}</span>
                  <span
                    className={`font-nunito font-black text-xs ${
                      item.rate >= 95 ? 'text-emerald-600' : item.rate >= 85 ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  >
                    {item.rate}%
                  </span>
                </div>
                
                {/* Mini clay progress bar */}
                <div className="w-full bg-[#E0DBEC] rounded-full h-2 overflow-hidden mb-2 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.rate >= 95 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : item.rate >= 85 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-rose-400 to-red-500'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-clay-muted font-medium">
                  <span>{item.present}/{item.total} Hadir</span>
                  {item.alpa > 0 && <span className="font-bold text-rose-500">{item.alpa} Alpa</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Attention List (Alpa & Missing Letter) */}
        <div className="space-y-4">
          {/* Siswa Alpa (Tanpa Keterangan) */}
          <div className="bg-white/85 backdrop-blur-xl p-5 rounded-[32px] shadow-clay-card border border-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-nunito font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Alpa Hari Ini ({alpaStudents.length})</span>
              </h4>
            </div>
            <p className="text-[11px] text-clay-muted font-medium mb-3">
              Siswa tidak hadir tanpa kabar; segera hubungi wali murid.
            </p>

            {alpaStudents.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-[#EFEBF5] text-emerald-700 text-xs text-center font-nunito font-extrabold shadow-clay-pressed">
                Nihil alpa pada rombel terpilih! 🎉
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 clay-custom-scrollbar">
                {alpaStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-3 rounded-2xl bg-[#EFEBF5]/70 shadow-clay-pressed text-xs flex items-center justify-between">
                    <div>
                      <div className="font-nunito font-extrabold text-clay-foreground">{st.studentName}</div>
                      <div className="text-[10px] text-clay-muted font-medium">{st.className} • NISN: {st.nisn}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-nunito font-black bg-rose-100 text-rose-700 shadow-clay-pill">
                      Alpa
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Siswa Sakit/Izin Belum Menyerahkan Surat */}
          <div className="bg-white/85 backdrop-blur-xl p-5 rounded-[32px] shadow-clay-card border border-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-nunito font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <FileX className="w-4 h-4" />
                <span>Belum Ada Surat ({missingLetterStudents.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => onNavigateTab('rekap-surat-izin')}
                className="text-[11px] font-nunito font-extrabold text-violet-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Kelola Surat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-clay-muted font-medium mb-3">
              Daftar izin / sakit yang belum mengumpulkan surat keterangan fisik.
            </p>

            {missingLetterStudents.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-[#EFEBF5] text-emerald-700 text-xs text-center font-nunito font-extrabold shadow-clay-pressed">
                Seluruh siswa izin &amp; sakit telah menyerahkan surat.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 clay-custom-scrollbar">
                {missingLetterStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-3 rounded-2xl bg-[#EFEBF5]/70 shadow-clay-pressed text-xs flex items-center justify-between">
                    <div>
                      <div className="font-nunito font-extrabold text-clay-foreground">{st.studentName}</div>
                      <div className="text-[10px] text-clay-muted font-medium">{st.className} • Status: {st.status === 'S' ? 'Sakit' : 'Izin'}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-nunito font-black bg-amber-100 text-amber-800 shadow-clay-pill">
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
