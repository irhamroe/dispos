import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { AdminUser, SchoolProfile } from '../types';
import { MdBackgroundBlobs, MdCard, MdButton, MdBadge, MdInput } from './md3';

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
    <div className="min-h-screen bg-[#FFFBFE] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-roboto text-[#1C1B1F]">
      {/* Material You Layered Background */}
      <MdBackgroundBlobs />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* School Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[28px] bg-[#F3EDF7] p-3 flex items-center justify-center shadow-md mb-4 border border-[#E8DEF8]">
            <img 
              src="/logo.png" 
              alt={schoolProfile.name} 
              className="w-full h-full object-contain select-none"
            />
          </div>

          <MdBadge variant="secondary" size="md" className="mb-2.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6750A4]" />
              Portal Autentikasi Tenaga Pendidik
            </span>
          </MdBadge>

          <h1 className="text-2xl sm:text-3xl font-medium text-[#1C1B1F] tracking-tight">
            {schoolProfile.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#49454F]">
            Sistem Informasi Presensi Kehadiran &amp; Disiplin Positif Siswa
          </p>
        </div>

        {/* Material You Login Card */}
        <div className="mt-7">
          <MdCard variant="elevated" radius="large" className="p-7 sm:p-8 space-y-5 bg-[#F3EDF7]/95 backdrop-blur-md">
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-[#FFDAD6] text-[#410002] text-xs font-medium flex items-start gap-2.5 border border-[#BA1A1A]/20">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A] mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Username Input */}
              <MdInput
                label="Username / NIP"
                id="username-input"
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau NIP..."
                startIcon={<User className="w-4 h-4" />}
              />

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#49454F] mb-1.5 ml-1">
                  Kata Sandi (Password)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-[#49454F] pointer-events-none flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full bg-[#E7E0EC] text-[#1C1B1F] placeholder-[#49454F]/60 rounded-t-xl rounded-b-none border-b-2 border-[#79747E] pl-10 pr-10 py-3 text-sm transition-all duration-200 focus:outline-hidden focus:border-[#6750A4] focus:bg-[#EDE7F2]"
                  />
                  <button
                    type="button"
                    id="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#49454F] hover:text-[#6750A4] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <MdButton
                  type="submit"
                  id="submit-login-btn"
                  variant="filled"
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
                </MdButton>
              </div>
            </form>
          </MdCard>
        </div>

        {/* Security Note */}
        <div className="mt-5 text-center">
          <p className="text-xs text-[#49454F] flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#6750A4]" />
            <span>Sistem terenkripsi. Catatan kedisiplinan dan absensi terlindungi.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
