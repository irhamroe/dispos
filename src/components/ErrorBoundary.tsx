import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.removeItem('app_sman1batu_admin_user');
      localStorage.removeItem('app_sman1batu_admin_user_v2');
      localStorage.removeItem('app_sman1batu_admin_user_v4');
      localStorage.removeItem('app_firebase_custom_config');
    } catch {
      // Ignore
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#0A192F] flex items-center justify-center p-4 font-roboto text-slate-900">
          <div className="max-w-md w-full bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-2">
                <span>Pemulihan Sistem Otomatis</span>
              </div>
              <h1 className="text-xl font-black text-[#0F172A]">Terjadi Kendala Memuat Aplikasi</h1>
              <p className="text-xs text-[#64748B] mt-1">
                Sistem mendeteksi adanya sesi atau cache lama di peramban Anda. Silakan klik tombol di bawah untuk memuat ulang.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-100 rounded-2xl text-left overflow-x-auto text-[11px] font-mono text-rose-800 border border-slate-200 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Cache &amp; Buka Halaman Login</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SMAN 1 Batu • SIM Absensi &amp; Dispos</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
