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
  Sparkles,
  CheckCircle2,
  Clock,
  HeartPulse,
  UserX,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  AlertTriangle,
  DoorOpen,
  Bell
} from 'lucide-react';
import { AttendanceRecord, DisciplineRecord, Student, StudentPermitRecord } from '../types';
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
  studentPermits?: StudentPermitRecord[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  attendanceRecords,
  disciplineRecords,
  classes,
  selectedDate,
  onDateChange,
  onNavigateTab,
  studentPermits = [],
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

  const pendingPermitsList = useMemo(() => {
    return studentPermits.filter((p) => p.status === 'Menunggu');
  }, [studentPermits]);

  return (
    <div className="space-y-6 pb-12 font-roboto text-[#0F172A]">
      {/* Pending Student Permits Alert Banner */}
      {pendingPermitsList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white p-5 rounded-[28px] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white text-rose-700 text-[10px] font-black uppercase tracking-wider">
                  Perlu Persetujuan
                </span>
                <span className="text-xs font-bold text-amber-100">Layanan Izin Siswa</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Ada {pendingPermitsList.length} Permohonan Izin Siswa Baru Menunggu Persetujuan
              </h3>
              <p className="text-xs text-rose-100/90 font-medium">
                Siswa baru saja mengajukan izin keluar / dispensasi seragam. Permohonan yang disetujui akan otomatis masuk ke Buku Rekapitulasi Izin Resmi.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="dash-review-permits-btn"
            onClick={() => onNavigateTab('layanan-izin-siswa')}
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-rose-700 font-black text-xs transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer shrink-0 flex items-center gap-2"
          >
            <DoorOpen className="w-4 h-4" />
            <span>Tinjau &amp; Setujui Sekarang</span>
          </button>
        </div>
      )}

      {/* Top Filter Card */}
      <MdCard variant="elevated" radius="large" className="p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-medium text-[#0F172A] tracking-tight">
              Dashboard Statistik
            </h2>
            <span className="p-1.5 rounded-full bg-[#E0F2FE] text-[#0284C7]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-[#334155] mt-0.5">
            Pantau kehadiran siswa &amp; status kedisiplinan secara real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#E2F1FD] rounded-full px-4 py-2 text-xs text-[#0F172A]">
            <Calendar className="w-4 h-4 text-[#0284C7] shrink-0" />
            <span className="text-[#334155]">Tanggal:</span>
            <input
              id="dash-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-[#0F172A] font-medium focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-1.5 bg-[#E2F1FD] rounded-full px-4 py-2 text-xs text-[#0F172A]">
            <span className="text-[#334155]">Jenjang:</span>
            <select
              id="dash-grade-filter"
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value as any);
                setSelectedClassFilter('ALL');
              }}
              className="bg-transparent font-medium text-[#0F172A] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="X">Kelas X (12 Rombel)</option>
              <option value="XI">Kelas XI (12 Rombel)</option>
              <option value="XII">Kelas XII (12 Rombel)</option>
            </select>
          </div>

          {/* Rombel Class filter */}
          <div className="flex items-center gap-1.5 bg-[#E2F1FD] rounded-full px-4 py-2 text-xs text-[#0F172A]">
            <Filter className="w-4 h-4 text-[#0284C7] shrink-0" />
            <select
              id="dash-class-filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent font-medium text-[#0F172A] focus:outline-hidden cursor-pointer"
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

      {/* Main KPI Bento Grid: Hero Stat + H, I, S, A Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Attendance Rate (Hero Card) */}
        <div className="col-span-2 bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#0c4a6e] rounded-[32px] p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg group">
          <TrendingUp className="w-28 h-28 absolute -right-3 -bottom-4 text-white/10 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E0F2FE]">
                Tingkat Kehadiran
              </span>
              <span className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-xs">
                {attendancePercentage}%
              </span>
              <span className="text-xs text-[#E0F2FE] font-medium">
                ({hadirCount + dispenCount} dari {totalFiltered} siswa)
              </span>
            </div>
          </div>

          <div className="mt-5 relative z-10">
            <div className="w-full bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#4ade80] to-[#86efac] h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px] text-[#E0F2FE]">
              <span>{formatDateIndonesian(selectedDate)}</span>
              <span className="font-semibold bg-white/15 px-2.5 py-0.5 rounded-full">{selectedClassFilter === 'ALL' ? `${availableClasses.length} Rombel` : `Rombel ${selectedClassFilter}`}</span>
            </div>
          </div>
        </div>

        {/* H: Hadir */}
        <div className="bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]/60 border border-[#6EE7B7]/70 rounded-[28px] p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group">
          <CheckCircle2 className="w-20 h-20 absolute -right-2 -bottom-2 text-[#10B981]/15 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-[#065F46] uppercase tracking-wide">Hadir (H)</span>
            <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-[#047857]">{hadirCount}</div>
            <div className="text-[11px] font-medium text-[#065F46]/90 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              Presensi aktif kelas
            </div>
          </div>
        </div>

        {/* I: Izin */}
        <div className="bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/60 border border-[#7DD3FC]/70 rounded-[28px] p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group">
          <Clock className="w-20 h-20 absolute -right-2 -bottom-2 text-[#0284C7]/15 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-[#075985] uppercase tracking-wide">Izin (I)</span>
            <div className="w-8 h-8 rounded-xl bg-[#0284C7] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-[#0369A1]">{izinCount}</div>
            <div className="text-[11px] font-medium text-[#075985]/90 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]"></span>
              Izin acara / urusan
            </div>
          </div>
        </div>

        {/* S: Sakit */}
        <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/60 border border-[#FCD34D]/70 rounded-[28px] p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group">
          <HeartPulse className="w-20 h-20 absolute -right-2 -bottom-2 text-[#F59E0B]/15 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-[#92400E] uppercase tracking-wide">Sakit (S)</span>
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-[#B45309]">{sakitCount}</div>
            <div className="text-[11px] font-medium text-[#92400E]/90 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
              Istirahat / rawat
            </div>
          </div>
        </div>

        {/* A: Alpa */}
        <div className="bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/60 border border-[#FDA4AF]/70 rounded-[28px] p-5 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group">
          <UserX className="w-20 h-20 absolute -right-2 -bottom-2 text-[#F43F5E]/15 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-[#9F1239] uppercase tracking-wide">Alpa (A)</span>
            <div className="w-8 h-8 rounded-xl bg-[#F43F5E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-[#E11D48]">{alpaCount}</div>
            <div className="text-[11px] font-semibold text-[#BE123C] mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]"></span>
              Tanpa keterangan
            </div>
          </div>
        </div>
      </div>

      {/* Verification Surat Badge Bar */}
      <MdCard variant="tonal" radius="large" className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#0369A1]">
              Verifikasi Surat Siswa (Sakit &amp; Izin)
            </h4>
            <p className="text-xs text-[#334155] mt-0.5">
              Total <span className="font-medium text-[#0369A1]">{sickAndPermitRecords.length} siswa</span> berstatus Izin / Sakit pada tanggal terpilih.
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
        <div className="lg:col-span-2 bg-[#F0F9FF] p-6 rounded-[32px] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-[#0F172A] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0284C7]" />
                <span>Monitoring Kehadiran 36 Rombel</span>
              </h3>
              <p className="text-xs text-[#334155] mt-0.5">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {classBreakdown.map((item) => {
              const isGradeX = item.grade === 'X' || item.name.startsWith('X-');
              const isGradeXI = item.grade === 'XI' || item.name.startsWith('XI-');
              const isGradeXII = item.grade === 'XII' || item.name.startsWith('XII-');

              // Visual styling: X = Hijau, XI = Kuning, XII = Merah
              let theme = {
                cardBg: 'bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7]/70 to-[#BBF7D0]/40 border-[#BBF7D0]/80 hover:border-[#34D399]',
                iconBg: 'bg-gradient-to-tr from-[#059669] to-[#10B981] text-white',
                nameColor: 'text-[#047857]',
                progressTrack: 'bg-[#059669]/15',
                progressFill: 'bg-gradient-to-r from-[#059669] to-[#10B981]',
                IconComponent: GraduationCap,
              };

              if (isGradeXI) {
                theme = {
                  cardBg: 'bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/70 to-[#FDE68A]/40 border-[#FDE68A]/80 hover:border-[#F59E0B]',
                  iconBg: 'bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white',
                  nameColor: 'text-[#B45309]',
                  progressTrack: 'bg-[#D97706]/15',
                  progressFill: 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]',
                  IconComponent: BookOpen,
                };
              } else if (isGradeXII) {
                theme = {
                  cardBg: 'bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6]/70 to-[#FECDD3]/40 border-[#FECDD3]/80 hover:border-[#F43F5E]',
                  iconBg: 'bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white',
                  nameColor: 'text-[#BE123C]',
                  progressTrack: 'bg-[#E11D48]/15',
                  progressFill: 'bg-gradient-to-r from-[#E11D48] to-[#F43F5E]',
                  IconComponent: Award,
                };
              }

              const CardIcon = theme.IconComponent;

              return (
                <div
                  key={item.name}
                  onClick={() => {
                    setSelectedClassFilter(item.name);
                    onNavigateTab('attendance');
                  }}
                  className={`p-3.5 rounded-2xl border ${theme.cardBg} hover:shadow-md cursor-pointer transition-all duration-300 relative overflow-hidden group active:scale-[0.98]`}
                >
                  <div className="flex items-center justify-between text-xs mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl ${theme.iconBg} flex items-center justify-center font-bold text-xs shadow-xs group-hover:rotate-6 transition-transform`}>
                        <CardIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`font-bold text-xs ${theme.nameColor}`}>
                        {item.name}
                      </span>
                    </div>

                    <span
                      className={`font-extrabold text-[11px] px-2 py-0.5 rounded-full border shadow-xs ${
                        item.rate >= 95
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]/70'
                          : item.rate >= 85
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]/70'
                          : 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]/70'
                      }`}
                    >
                      {item.rate}%
                    </span>
                  </div>

                  <div className={`w-full ${theme.progressTrack} rounded-full h-2 overflow-hidden mb-2 relative z-10 p-0.5`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                        item.rate >= 95
                          ? 'bg-gradient-to-r from-[#22c55e] to-[#4ade80]'
                          : item.rate >= 85
                          ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]'
                          : theme.progressFill
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-[#334155] relative z-10 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#64748B]" />
                      <span>{item.present}/{item.total} Hadir</span>
                    </span>
                    {item.alpa > 0 ? (
                      <span className="font-bold text-[#E11D48] px-1.5 py-0.5 rounded-md bg-[#FFE4E6] text-[10px] flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {item.alpa} Alpa
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#10B981] font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Nihil Alpa
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Attention List */}
        <div className="space-y-4">
          {/* Siswa Alpa */}
          <div className="bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6]/50 to-white border border-[#FDA4AF]/60 p-5 rounded-[28px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#BA1A1A] flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Alpa Hari Ini ({alpaStudents.length})</span>
              </h4>
            </div>
            <p className="text-[11px] text-[#334155] mb-3">
              Siswa tidak hadir tanpa kabar; segera hubungi wali murid.
            </p>

            {alpaStudents.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#DCFCE7] text-[#15803D] text-xs text-center font-medium border border-[#86EFAC]/50">
                Nihil alpa pada rombel terpilih! 🎉
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alpaStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-3 rounded-xl bg-white border border-[#FECDD3] text-xs flex items-center justify-between shadow-xs">
                    <div>
                      <div className="font-medium text-[#0F172A]">{st.studentName}</div>
                      <div className="text-[10px] text-[#334155]">{st.className} • NISN: {st.nisn}</div>
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
          <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/50 to-white border border-[#FCD34D]/60 p-5 rounded-[28px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E65100] flex items-center gap-1.5">
                <FileX className="w-4 h-4" />
                <span>Belum Ada Surat ({missingLetterStudents.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => onNavigateTab('rekap-surat-izin')}
                className="text-[11px] font-medium text-[#0284C7] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Kelola Surat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-[#334155] mb-3">
              Daftar izin / sakit yang belum mengumpulkan surat keterangan fisik.
            </p>

            {missingLetterStudents.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#DCFCE7] text-[#15803D] text-xs text-center font-medium border border-[#86EFAC]/50">
                Seluruh siswa izin &amp; sakit telah menyerahkan surat.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {missingLetterStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-3 rounded-xl bg-white border border-[#FDE68A] text-xs flex items-center justify-between shadow-xs">
                    <div>
                      <div className="font-medium text-[#0F172A]">{st.studentName}</div>
                      <div className="text-[10px] text-[#334155]">{st.className} • Status: {st.status === 'S' ? 'Sakit' : 'Izin'}</div>
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
