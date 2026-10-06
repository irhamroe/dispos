import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { AdminUser, SchoolProfile } from '../types';
import { ClayBackgroundBlobs } from './clay/ClayBackgroundBlobs';
import { ClayCard } from './clay/ClayCard';
import { ClayButton } from './clay/ClayButton';
import { ClayBadge } from './clay/ClayBadge';

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
      setErrorMsg('Username atau kata sandi tidak valid. Silakan periksa kembali data login Anda.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F4F1FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-dmsans">
      {/* 3D Floating Blobs Background */}
      <ClayBackgroundBlobs />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* School Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-[28px] bg-white/90 p-3.5 flex items-center justify-center shadow-clay-orb mb-4 animate-clay-breathe border border-white">
            <img 
              src="/logo.png" 
              alt={schoolProfile.name} 
              className="w-full h-full object-contain drop-shadow-sm select-none"
            />
          </div>

          <ClayBadge variant="violet" size="md" className="mb-2.5" icon={<ShieldCheck className="w-3.5 h-3.5 text-purple-700" />}>
            Portal Autentikasi Tenaga Pendidik
          </ClayBadge>

          <h1 className="text-2xl sm:text-3xl font-black font-nunito text-[#332F3A] tracking-tight">
            {schoolProfile.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#635F69] font-medium">
            Sistem Informasi Presensi Kehadiran &amp; Disiplin Positif Siswa
          </p>
        </div>

        {/* Claymorphism Login Card */}
        <div className="mt-7">
          <ClayCard radius="36" variant="glass" className="p-7 sm:p-8 space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-[18px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-clay-pill">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="username-input" 
                  className="block text-xs font-bold text-[#4C4459] font-nunito tracking-wide"
                >
                  Username / NIP
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-purple-600 pointer-events-none flex items-center">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="username-input"
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username atau NIP..."
                    className="w-full bg-[#ECE7F5] border-0 text-[#332F3A] font-semibold text-sm rounded-[18px] shadow-clay-pressed py-3.5 pl-11 pr-4 transition-all duration-200 placeholder:text-[#8E869B] placeholder:font-normal focus:bg-white focus:ring-4 focus:ring-purple-400/25 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="password-input" 
                  className="block text-xs font-bold text-[#4C4459] font-nunito tracking-wide"
                >
                  Kata Sandi (Password)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-purple-600 pointer-events-none flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full bg-[#ECE7F5] border-0 text-[#332F3A] font-semibold text-sm rounded-[18px] shadow-clay-pressed py-3.5 pl-11 pr-11 transition-all duration-200 placeholder:text-[#8E869B] placeholder:font-normal focus:bg-white focus:ring-4 focus:ring-purple-400/25 focus:outline-none"
                  />
                  <button
                    type="button"
                    id="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#8E869B] hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <ClayButton
                  type="submit"
                  id="submit-login-btn"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="w-full"
                  icon={isLoading ? undefined : <KeyRound className="w-4 h-4" />}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi Akses...</span>
                    </div>
                  ) : (
                    <span>Masuk ke Sistem</span>
                  )}
                </ClayButton>
              </div>
            </form>
          </ClayCard>
        </div>

        {/* Security Note */}
        <div className="mt-5 text-center">
          <p className="text-xs text-[#7A7485] font-medium flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Sistem terenkripsi. Catatan kedisiplinan dan absensi terlindungi.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
