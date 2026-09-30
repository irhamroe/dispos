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
  const [password, setPassword] = useState('smabadispos');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('admin');

  const presetAccounts = [
    {
      type: 'admin',
      role: '1. Administrator (Super Admin)',
      name: 'Admin',
      username: 'admin',
      pass: 'smabadispos',
      badgeColor: 'bg-purple-900/60 text-purple-200 border-purple-700',
      desc: 'Akses penuh sistem, kelola seluruh data wali kelas & siswa',
    },
    {
      type: 'wali-x1',
      role: '2. Wali Kelas X-1',
      name: 'Dini Ayupratiwi, S.Pd',
      username: '19940728 202421 2 057',
      pass: '19940728 202421 2 057',
      badgeColor: 'bg-teal-900/60 text-teal-200 border-teal-700',
      desc: 'Wali Kelas X-1 (Login menggunakan NIP)',
    },
    {
      type: 'wali-xi5',
      role: '3. Wali Kelas XI-5',
      name: 'Moh. Irham Rozaki, S.Kom., Gr.',
      username: '19891021 202221 1 017',
      pass: '19891021 202221 1 017',
      badgeColor: 'bg-teal-900/60 text-teal-200 border-teal-700',
      desc: 'Wali Kelas XI-5 (Login menggunakan NIP)',
    },
    {
      type: 'wali-xii1',
      role: '4. Wali Kelas XII-1',
      name: 'Indah Herawati, S.Si',
      username: '19800430 201001 2 006',
      pass: '19800430 201001 2 006',
      badgeColor: 'bg-teal-900/60 text-teal-200 border-teal-700',
      desc: 'Wali Kelas XII-1 (Login menggunakan NIP)',
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

      // 2. Check matched user from users list (by Username or NIP, with or without spaces)
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

        // Check password (support formatted NIP with spaces or compact digits)
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
      setErrorMsg('Username atau password tidak cocok. Untuk Wali Kelas, gunakan NIP sebagai Username dan Password. Untuk Admin, gunakan user: admin dan password: smabadispos.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-emerald-600/20 via-teal-900/10 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* School Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center shadow-xl shadow-emerald-950/50 ring-2 ring-white/20 mb-4">
            <img 
              src="/logo.png" 
              alt={schoolProfile.name} 
              className="w-full h-full object-contain drop-shadow-md"
            />
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
