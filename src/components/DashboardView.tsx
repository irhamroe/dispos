import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Calendar, 
  Filter, 
  TrendingUp, 
  ChevronRight,
  HeartHandshake,
  FileSpreadsheet,
  FileCheck,
  FileX,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AttendanceRecord, DisciplineRecord, Student } from '../types';
import { RombelClass } from '../data/initialData';
import { NavTab } from './Sidebar';
import { formatDateIndonesian } from '../utils/exportUtils';

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
    if (selectedGradeFilter === 'ALL') return classes;
    return classes.filter((c) => c.grade === selectedGradeFilter);
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-slate-400">Tanggal:</span>
            <input
              id="dash-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700">
            <span className="text-slate-400">Jenjang:</span>
            <select
              id="dash-grade-filter"
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value as any);
                setSelectedClassFilter('ALL');
              }}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="X">Kelas X (12 Rombel)</option>
              <option value="XI">Kelas XI (12 Rombel)</option>
              <option value="XII">Kelas XII (12 Rombel)</option>
            </select>
          </div>

          {/* Rombel Class filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700">
            <Filter className="w-4 h-4 text-teal-600 shrink-0" />
            <select
              id="dash-class-filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
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

      {/* Main KPI Stats Cards for H, I, S, A, D and Surat Verification */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Attendance Rate (H + D) */}
        <div className="col-span-2 bg-linear-to-br from-teal-700 to-emerald-800 rounded-2xl p-5 text-white shadow-md shadow-teal-900/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-teal-100">
                Tingkat Kehadiran
              </span>
              <span className="p-1.5 rounded-lg bg-teal-600/40 text-teal-100">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {attendancePercentage}%
              </span>
              <span className="text-xs text-teal-100 font-medium">
                ({hadirCount + dispenCount} dari {totalFiltered} siswa)
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full bg-teal-900/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-2 rounded-full transition-all duration-700"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px] text-teal-100">
              <span>{formatDateIndonesian(selectedDate)}</span>
              <span>{selectedClassFilter === 'ALL' ? `${availableClasses.length} Rombel` : `Rombel ${selectedClassFilter}`}</span>
            </div>
          </div>
        </div>

        {/* H: Hadir */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">H (Hadir)</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              H
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{hadirCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Presensi di kelas</div>
        </div>

        {/* I: Izin */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">I (Izin)</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              I
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{izinCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Izin orang tua / acara</div>
        </div>

        {/* S: Sakit */}
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">S (Sakit)</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              S
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{sakitCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Istirahat / dokter</div>
        </div>

        {/* A: Alpa */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">A (Alpa)</span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
              A
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700">{alpaCount}</div>
          <div className="text-[11px] text-rose-500 font-semibold mt-0.5">Tanpa kabar</div>
        </div>

        {/* D: Dispen */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">D (Dispen)</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
              D
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-700">{dispenCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tugas sekolah / lomba</div>
        </div>
      </div>

      {/* Verification Surat Badge Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Status Verifikasi Surat Siswa (Sakit & Izin)</h4>
            <p className="text-xs text-slate-400">
              Total {sickAndPermitRecords.length} siswa berstatus Izin / Sakit hari ini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{suratAdaCount} Sudah Ada Surat</span>
          </span>

          <span className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-300 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{suratBelumCount} Belum Ada Surat</span>
          </span>
        </div>
      </div>

      {/* Grid: 36 Rombel Matrix + Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 36 Rombel Attendance Monitor */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Monitoring Kehadiran 36 Rombel</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pencapaian kehadiran per kelas di SMAN 1 Batu (Target disiplin: &ge; 95%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('recap')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
            >
              <span>Rekap Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rombel Grid (12 per row or compact responsive cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {classBreakdown.map((item) => (
              <div
                key={item.name}
                onClick={() => {
                  setSelectedClassFilter(item.name);
                  onNavigateTab('attendance');
                }}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-slate-800">{item.name}</span>
                  <span
                    className={`font-bold text-[11px] ${
                      item.rate >= 95 ? 'text-emerald-700' : item.rate >= 85 ? 'text-amber-700' : 'text-rose-700'
                    }`}
                  >
                    {item.rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.rate >= 95 ? 'bg-emerald-500' : item.rate >= 85 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{item.present}/{item.total} Hadir</span>
                  {item.alpa > 0 && <span className="font-bold text-rose-600">{item.alpa} Alpa</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Attention List (Alpa & Missing Letter) */}
        <div className="space-y-4">
          {/* Siswa Alpa (Tanpa Keterangan) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Alpa Hari Ini ({alpaStudents.length})</span>
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Siswa tidak hadir tanpa kabar; segera hubungi wali murid.
            </p>

            {alpaStudents.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-medium">
                Nihil alpa pada rombel terpilih!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alpaStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-200/60 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{st.studentName}</div>
                      <div className="text-[10px] text-slate-500">{st.className} • NISN: {st.nisn}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                      Alpa
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Siswa Sakit/Izin Belum Menyerahkan Surat */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <FileX className="w-4 h-4" />
                <span>Belum Ada Surat ({missingLetterStudents.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => onNavigateTab('rekap-surat-izin')}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Kelola Surat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Daftar izin / sakit yang belum mengumpulkan surat keterangan fisik.
            </p>

            {missingLetterStudents.length === 0 ? (
              <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs text-center font-medium">
                Seluruh siswa izin & sakit telah menyerahkan surat.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {missingLetterStudents.slice(0, 8).map((st) => (
                  <div key={st.id} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{st.studentName}</div>
                      <div className="text-[10px] text-slate-500">{st.className} • Status: {st.status === 'S' ? 'Sakit' : 'Izin'}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
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
