"use client";

import { useState, useEffect } from "react";
import { Share, PlusSquare, X } from "lucide-react";

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Deteksi apakah perangkat adalah iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // 2. Deteksi apakah aplikasi SUDAH di-install (jalan di mode Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         ('standalone' in window.navigator && (window.navigator as any).standalone === true);

    // Jika pengguna pakai iOS dan BELUM install, munculkan pop-up setelah 3 detik
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-10 inset-x-0 mx-auto max-w-sm px-4 z-[100] animate-fade-slide-up">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-5 relative">
        {/* Tombol Tutup */}
        <button 
          onClick={() => setShowPrompt(false)} 
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 bg-slate-100 p-1 rounded-full"
        >
          <X size={16} />
        </button>

        <h3 className="font-black text-slate-900 text-lg tracking-tight mb-2">
          Install SIMantu di iPhone 📱
        </h3>
        <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">
          Tambahkan aplikasi ini ke Layar Utama agar lebih mudah diakses.
        </p>
        
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <span className="bg-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border border-slate-200">1</span>
            Tap ikon <Share size={18} className="text-blue-500 mx-1" /> di bawah layar
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <span className="bg-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border border-slate-200">2</span>
            Pilih <span className="bg-slate-200 px-2 py-1 rounded text-xs ml-1 flex items-center gap-1">Add to Home Screen <PlusSquare size={14} /></span>
          </div>
        </div>

        {/* Panah ke bawah (menunjuk ke tombol Share Safari) */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-b border-r border-slate-200 rotate-45" />
      </div>
    </div>
  );
}