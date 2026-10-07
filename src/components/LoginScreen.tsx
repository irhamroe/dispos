import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  GraduationCap,
  ClipboardCheck,
  CalendarCheck,
  Award,
  BookOpen,
  HeartHandshake,
  UserCheck,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { AdminUser, SchoolProfile } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AdminUser) => void;
  schoolProfile: SchoolProfile;
  users?: AdminUser[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  schoolProfile,
  users = [],
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanInputUser = username.trim().replace(/\s+/g, '').toLowerCase();
      const cleanInputPass = password.trim().replace(/\s+/g, '');
      const rawInputUser = username.trim().toLowerCase();
      const rawInputPass = password.trim();

      // 1. Direct check for Admin user (username: admin, password: smabadispos)
      if (rawInputUser === 'admin' && rawInputPass === 'smabadispos') {
        setIsLoading(false);
        const adminFromUsers = users.find((u) => u.username.toLowerCase() === 'admin');
        if (adminFromUsers) {
          onLoginSuccess(adminFromUsers);
        } else {
          onLoginSuccess({
            id: 'usr-admin',
            username: 'admin',
            name: 'Admin',
            role: 'Admin',
            avatar: 'AD',
            status: 'Aktif',
            password: 'smabadispos',
            department: 'Administrator SIM Presensi',
          });
        }
        return;
      }

      // 2. Check matched user from users list
      const foundInUsers = users.find((u) => {
        const uName = u.username.trim().replace(/\s+/g, '').toLowerCase();
        const uRawName = u.username.trim().toLowerCase();
        const uNip = (u.nip || '').trim().replace(/\s+/g, '').toLowerCase();
        return (
          uName === cleanInputUser ||
          uRawName === rawInputUser ||
          uNip === cleanInputUser
        );
      });

      if (foundInUsers) {
        if (foundInUsers.status === 'Nonaktif') {
          setIsLoading(false);
          setErrorMsg('Akun Anda saat ini dinonaktifkan oleh administrator. Silakan hubungi admin sekolah.');
          return;
        }

        const expectedPass = (foundInUsers.password || '').trim().replace(/\s+/g, '');
        const rawExpectedPass = (foundInUsers.password || '').trim();
        const nipClean = (foundInUsers.nip || '').trim().replace(/\s+/g, '');

        if (
          cleanInputPass === expectedPass ||
          rawInputPass === rawExpectedPass ||
          cleanInputPass === nipClean ||
          (foundInUsers.role === 'Admin' && rawInputPass === 'smabadispos')
        ) {
          setIsLoading(false);
          onLoginSuccess(foundInUsers);
          return;
        }
      }

      setIsLoading(false);
      setErrorMsg('Username atau kata sandi tidak valid. Silakan periksa kembali data login Anda.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#0A192F] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-roboto text-white selection:bg-sky-500 selection:text-white">
      {/* Decorative Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-sky-500/20 blur-3xl animate-md-drift-1" />
        <div className="absolute top-[30%] -right-[15%] w-[65vh] h-[65vh] rounded-full bg-blue-600/25 blur-3xl animate-md-drift-2" />
        <div className="absolute -bottom-[20%] left-[25%] w-[60vh] h-[60vh] rounded-full bg-teal-500/15 blur-3xl animate-md-drift-1" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.12)_0%,_transparent_70%)]" />
        
        {/* Subtle grid mesh overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }} 
        />
      </div>

      {/* FLOATING THEMATIC ICONS (Presensi, Disiplin Positif, Pendidikan, Sekolah) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none" aria-hidden="true">
        {/* Top Left: Graduation Cap */}
        <div className="absolute top-12 left-10 hidden md:flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl text-sky-200 animate-bounce duration-1000">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Disiplin Positif</div>
            <div className="text-[10px] text-sky-200/80">SMAN 1 Batu</div>
          </div>
        </div>

        {/* Top Right: Clipboard / Presensi */}
        <div className="absolute top-16 right-12 hidden md:flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl text-emerald-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Presensi Harian</div>
            <div className="text-[10px] text-emerald-200/80">36 Rombel Kelas</div>
          </div>
        </div>

        {/* Bottom Left: Pembinaan Siswa */}
        <div className="absolute bottom-16 left-14 hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl text-amber-200">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Bimbingan &amp; Pembinaan</div>
            <div className="text-[10px] text-amber-200/80">Restitusi Edukatif</div>
          </div>
        </div>

        {/* Bottom Right: Rekap & Laporan */}
        <div className="absolute bottom-16 right-14 hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl text-violet-200">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Rekap &amp; Ekspor</div>
            <div className="text-[10px] text-violet-200/80">Excel &amp; PDF Resmi</div>
          </div>
        </div>

        {/* Subtle Ambient Background Icons */}
        <div className="absolute top-1/4 left-1/5 text-sky-400/15 hidden sm:block">
          <BookOpen className="w-16 h-16 transform -rotate-12" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-blue-400/15 hidden sm:block">
          <CalendarCheck className="w-20 h-20 transform rotate-12" />
        </div>
        <div className="absolute bottom-1/4 right-1/6 text-teal-400/15 hidden sm:block">
          <Award className="w-16 h-16 transform -rotate-6" />
        </div>
        <div className="absolute bottom-1/3 left-1/6 text-sky-400/15 hidden sm:block">
          <UserCheck className="w-18 h-18 transform rotate-6" />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* School Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-[30px] bg-white/95 p-3.5 flex items-center justify-center shadow-2xl mb-4 border-2 border-white/80 ring-4 ring-sky-400/30">
            <img 
              src="/logo.png" 
              alt={schoolProfile.name} 
              className="w-full h-full object-contain select-none filter drop-shadow-sm"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/20 backdrop-blur-md border border-sky-400/30 text-sky-200 text-xs font-bold mb-2 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
            <span>Portal Autentikasi Tenaga Pendidik</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
            {schoolProfile.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-sky-100/90 font-medium">
            Sistem Informasi Presensi Kehadiran &amp; Disiplin Positif Siswa
          </p>
        </div>

        {/* Material You Login Card */}
        <div className="mt-6">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-7 sm:p-8 space-y-5 border border-white/60 shadow-2xl text-[#0F172A]">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div>
                <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#0284C7]" />
                  <span>Masuk ke Akun</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">Gunakan NIP / Username dan Password Anda</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="Sistem Aktif" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-900 text-xs font-semibold flex items-start gap-2.5 border border-rose-200 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#0F172A] mb-1 ml-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Username / NIP</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="username-input"
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username atau NIP..."
                    className="w-full bg-[#E2F1FD] text-[#0F172A] placeholder-[#64748B] font-semibold rounded-2xl border border-white/40 px-4 py-3 text-sm transition-all duration-200 focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#0F172A] mb-1 ml-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Kata Sandi (Password)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full bg-[#E2F1FD] text-[#0F172A] placeholder-[#64748B] font-semibold rounded-2xl border border-white/40 pl-4 pr-11 py-3 text-sm transition-all duration-200 focus:outline-hidden focus:bg-white focus:ring-4 focus:ring-sky-500/20"
                  />
                  <button
                    type="button"
                    id="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#64748B] hover:text-[#0284C7] transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-login-btn"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-md hover:shadow-sky-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi Akses...</span>
                    </div>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Masuk ke Sistem</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-5 text-center">
          <p className="text-xs text-sky-200/90 flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-sky-300" />
            <span>Sistem terenkripsi. Catatan kedisiplinan dan absensi terlindungi.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

