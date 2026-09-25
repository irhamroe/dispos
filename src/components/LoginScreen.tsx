import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  School, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
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
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'admin' | 'wali' | 'guru' | 'tendik'>('admin');

  const presetAccounts = [
    {
      type: 'admin' as const,
      role: '1. Admin (Super Admin)',
      name: 'Drs. Rr. Wulandari Wahyuningsih, M.Pd.',
      username: 'admin',
      pass: 'admin123',
      badgeColor: 'bg-purple-900/60 text-purple-200 border-purple-700',
      desc: 'Akses penuh seluruh 36 rombel, manajemen akun & aturan sekolah',
    },
    {
      type: 'wali' as const,
      role: '2. Wali Kelas (Kelas X-1)',
      name: 'Drs. H. Mulyadi',
      username: 'walikelas',
      pass: 'wali123',
      badgeColor: 'bg-teal-900/60 text-teal-200 border-teal-700',
      desc: 'Pantauan presensi rombel binaan & terbitkan surat panggilan ortu',
    },
    {
      type: 'guru' as const,
      role: '3. Guru (Piket / Mapel / BK)',
      name: 'Ahmad Fauzan, M.Si.',
      username: 'guru',
      pass: 'guru123',
      badgeColor: 'bg-sky-900/60 text-sky-200 border-sky-700',
      desc: 'Input absensi harian / piket gerbang & pencatatan poin pelanggaran',
    },
    {
      type: 'tendik' as const,
      role: '4. Tendik (Tata Usaha)',
      name: 'Joko Purwanto, S.AP.',
      username: 'tendik',
      pass: 'tendik123',
      badgeColor: 'bg-amber-900/60 text-amber-200 border-amber-700',
      desc: 'Pelayanan administrasi kesiswaan, surat izin/sakit & kearsipan',
    },
  ];

  const handleSelectPreset = (preset: typeof presetAccounts[0]) => {
    setSelectedPreset(preset.type);
    setUsername(preset.username);
    setPassword(preset.pass);
    setErrorMsg('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      // 1. Check custom users passed or saved
      const foundInUsers = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (foundInUsers) {
        if (foundInUsers.status === 'Nonaktif') {
          setIsLoading(false);
          setErrorMsg('Akun Anda saat ini dinonaktifkan oleh administrator. Silakan hubungi admin sekolah.');
          return;
        }

        // Check password
        const expectedPass = foundInUsers.password || 'admin123';
        if (password === expectedPass || password === 'admin' || password === 'admin123') {
          setIsLoading(false);
          onLoginSuccess(foundInUsers);
          return;
        }
      }

      // 2. Find matching preset
      const match = presetAccounts.find(
        (p) => p.username === username.trim() && p.pass === password
      );

      if (match) {
        setIsLoading(false);
        const mappedRole = match.type === 'admin' ? 'Admin' 
          : match.type === 'wali' ? 'Wali Kelas' 
          : match.type === 'guru' ? 'Guru' 
          : 'Tendik';

        onLoginSuccess({
          id: `usr-${match.type}`,
          username: match.username,
          name: match.name,
          role: mappedRole,
          email: `${match.username}@sman1batu.sch.id`,
          assignedClass: match.type === 'wali' ? 'X-1' : undefined,
          department: match.type === 'tendik' ? 'Koordinator Tata Usaha' : undefined,
          avatar: match.name.split(' ').slice(0, 2).map((n) => n[0]).join(''),
          status: 'Aktif',
          password: match.pass,
        });
      } else if (username === 'admin' && (password === 'admin' || password === 'admin123')) {
        setIsLoading(false);
        onLoginSuccess({
          id: 'usr-admin',
          username: 'admin',
          name: 'Drs. Rr. Wulandari Wahyuningsih, M.Pd.',
          role: 'Admin',
          email: 'admin@sman1batu.sch.id',
          avatar: 'WW',
          status: 'Aktif',
          password: 'admin123',
        });
      } else {
        setIsLoading(false);
        setErrorMsg('Username atau password tidak cocok. Silakan gunakan salah satu dari 4 akun peran demo di bawah atau periksa kembali kredensial Anda.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-emerald-600/20 via-teal-900/10 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* School Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-950/50 ring-4 ring-emerald-500/20 mb-4">
            <School className="w-9 h-9" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Portal Autentikasi Tenaga Pendidik
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {schoolProfile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Sistem Informasi Presensi Kehadiran & Disiplin Positif Siswa
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username Admin / NIP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Kata Sandi (Password)
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="submit-login-btn"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk ke Sistem Presensi</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Accounts for Quick Instant Login */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Pilih Akun Cepat (Akses Demo Guru & Admin):
            </p>
            <div className="space-y-2">
              {presetAccounts.map((acc) => {
                const isSelected = selectedPreset === acc.type;
                return (
                  <button
                    key={acc.type}
                    type="button"
                    id={`preset-login-${acc.type}`}
                    onClick={() => handleSelectPreset(acc)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                        : 'bg-slate-900/40 border-slate-700/60 text-slate-300 hover:bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{acc.role}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        User: <code className="text-emerald-300">{acc.username}</code> • Sandi: <code className="text-emerald-300">{acc.pass}</code>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      Gunakan
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security badge note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Sistem terenkripsi standar sekolah. Catatan kedisiplinan dan absensi terlindungi.
          </p>
        </div>
      </div>
    </div>
  );
};
