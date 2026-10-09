import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  X, 
  Camera, 
  Upload, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Briefcase, 
  GraduationCap,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AdminUser } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser | null;
  onUpdateUser: (updatedUser: AdminUser) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setNip(currentUser.nip || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setPassword(currentUser.password || '');
      setPhotoUrl(currentUser.photoUrl || '');
      setIsSaved(false);
      setShowPassword(false);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya berkas gambar (JPG, PNG, WEBP) yang diperbolehkan.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama lengkap tidak boleh kosong.');
      return;
    }

    const updated: AdminUser = {
      ...currentUser,
      name: name.trim(),
      nip: nip.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      password: password.trim() || currentUser.password,
      photoUrl: photoUrl.trim() || undefined,
      avatar: name.trim().slice(0, 2).toUpperCase(),
    };

    onUpdateUser(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const isWaliKelas = currentUser.role === 'Wali Kelas';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-white/80 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#0F172A] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                <span>Profil &amp; Data Saya</span>
                {isWaliKelas && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-emerald-950">
                    Wali Kelas {currentUser.assignedClass || ''}
                  </span>
                )}
              </h3>
              <p className="text-xs text-sky-100">
                Lengkapi identitas, kontak, NIP, dan foto profil Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-xs hover:-translate-y-0.5 active:scale-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {isSaved && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center gap-2.5 font-bold animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Data profil Anda berhasil disimpan dan diperbarui!</span>
            </div>
          )}

          {/* User Role Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E2F1FD]/60 to-[#F0F9FF] border border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name || currentUser.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#0284C7] text-white font-black text-base flex items-center justify-center shadow-sm">
                    {name ? name.slice(0, 2).toUpperCase() : currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <div className="font-black text-sm text-[#0F172A] flex items-center gap-1.5">
                  <span>{name || currentUser.name}</span>
                </div>
                <div className="text-[11px] text-[#334155] font-mono mt-0.5">
                  @{currentUser.username} • <span className="font-bold text-[#0284C7]">{currentUser.role}</span>
                  {currentUser.assignedClass ? ` (${currentUser.assignedClass})` : ''}
                </div>
              </div>
            </div>

            {isWaliKelas && currentUser.assignedClass && (
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-extrabold text-slate-400 block">Rombel Binaan</span>
                <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-[#0284C7] font-black text-xs inline-block mt-0.5 border border-sky-200">
                  Kelas {currentUser.assignedClass}
                </span>
              </div>
            )}
          </div>

          {/* Photo profile upload section */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-[#0F172A] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#0284C7]" />
                <span>Foto Profil Pengguna</span>
              </label>
              <div className="flex items-center gap-1 bg-[#E2F1FD] p-1 rounded-xl text-[11px]">
                <button
                  type="button"
                  onClick={() => setPhotoInputMode('upload')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    photoInputMode === 'upload' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#334155]'
                  }`}
                >
                  Unggah File
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoInputMode('url')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    photoInputMode === 'url' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#334155]'
                  }`}
                >
                  Link URL
                </button>
              </div>
            </div>

            {photoInputMode === 'upload' ? (
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="user-profile-file-input"
                />
                <label
                  htmlFor="user-profile-file-input"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#E2F1FD] hover:bg-sky-100 text-[#0284C7] font-extrabold rounded-xl border border-sky-200 shadow-xs cursor-pointer active:scale-95 transition-all text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Foto dari Komputer / HP</span>
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/foto-anda.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-[#E2F1FD] rounded-xl text-xs text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]"
                />
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Name & NIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-black text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Nama Lengkap &amp; Gelar *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso, S.Pd."
                className="w-full px-4 py-2.5 bg-[#E2F1FD] rounded-2xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20"
              />
            </div>

            <div>
              <label className="block font-black text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>NIP / Nomor Pegawai</span>
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="198501012010011001 atau -"
                className="w-full px-4 py-2.5 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-black text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>No. HP / WhatsApp</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-2.5 bg-[#E2F1FD] rounded-2xl text-xs font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20"
              />
            </div>

            <div>
              <label className="block font-black text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>Alamat Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@sman1batu.sch.id"
                className="w-full px-4 py-2.5 bg-[#E2F1FD] rounded-2xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#0284C7]/20"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
            <label className="block font-black text-amber-950 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Ganti Kata Sandi (Password)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru..."
                className="w-full pl-4 pr-11 py-2.5 bg-white rounded-xl text-xs font-mono font-bold text-[#0F172A] focus:outline-hidden focus:ring-3 focus:ring-amber-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-amber-800/80 font-medium">
              Gunakan kombinasi minimal 6 karakter agar akun Anda tetap aman.
            </p>
          </div>

          {/* Wali Kelas Note */}
          {isWaliKelas && (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-[#0369A1] flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 shrink-0 mt-0.5 text-[#0284C7]" />
              <p className="text-[11px] leading-relaxed">
                Sebagai <strong>Wali Kelas {currentUser.assignedClass}</strong>, Anda juga dapat melengkapi data siswa binaan Anda (foto, nomor telepon, alamat, NISN) melalui menu <strong>Data Siswa</strong>.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold cursor-pointer transition-all active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaved}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#0F172A] text-white font-black shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'Tersimpan!' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
