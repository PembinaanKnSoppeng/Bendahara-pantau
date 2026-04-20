"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Check, X, Calendar, BellRing, Share2, CheckCheck,
  Wifi, WifiOff, Clock, Sparkles, HelpCircle, LayoutDashboard,
  RefreshCcw, Activity
} from "lucide-react";
import Image from "next/image";

const STEPS = [
  { id: 1, title: "Rekapitulasi Absensi", desc: "Data kehadiran & potongan", icon: "📋", eta: "1-2 Hari" },
  { id: 2, title: "Pengesahan Rekap", desc: "Verifikasi pimpinan", icon: "✍️", eta: "1 Hari" },
  { id: 3, title: "Hitung Tukin", desc: "Perhitungan nominal akhir", icon: "🧮", eta: "1 Hari" },
  { id: 4, title: "Gaji Web KPPN", desc: "Upload data ke Gaji Web", icon: "💻", eta: "1 Hari" },
  { id: 5, title: "SAKTI KPPN", desc: "Validasi sistem SAKTI", icon: "🔐", eta: "1 Hari" },
  { id: 6, title: "Pengajuan SPM", desc: "Penerbitan Surat Perintah", icon: "📄", eta: "1-2 Hari" },
  { id: 7, title: "Verifikasi KPPN", desc: "Approve atau Reject", icon: "🏛️", eta: "1-3 Hari" },
  { id: 8, title: "SP2D Terbit", desc: "Dana masuk rekening! 🎉", icon: "💰", eta: "Cair!" },
];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  const colors = ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#ffffff"];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full animate-confetti opacity-80 shadow-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2.5 + Math.random() * 3}s`,
            transform: `scale(${Math.random() * 1.2})`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.6); opacity: 0; }
        }
        .animate-confetti { animation: confetti-fall cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      `}</style>
    </div>
  );
}

export default function PublicPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStep, setPrevStep] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: res, error: err } = await supabase.from("status_tukin_global").select("*").eq("id", 1).single();
      if (err || !res) throw err;
      setData(res);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const channel = supabase.channel("realtime-status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "status_tukin_global" }, (payload) => {
        setData(payload.new);
        setIsOnline(true);
      }).subscribe((status) => setIsOnline(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [fetchStatus]);

  useEffect(() => {
    if (!data) return;
    if (prevStep !== null && prevStep < 8 && data.current_step === 8) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    }
    setPrevStep(data.current_step);
  }, [data?.current_step]);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-10 scale-[2.5]" />
        <div className="h-14 w-14 border-[3px] border-slate-200 border-t-emerald-500 rounded-full animate-spin shadow-sm" />
      </div>
      <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase animate-pulse">Menyiapkan Workspace...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-5 p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.03)_0%,transparent_100%)]" />
      <div className="bg-white p-8 rounded-[2.5rem] border border-rose-100/50 shadow-[0_8px_30px_rgb(225,29,72,0.06)] relative z-10 max-w-sm w-full">
        <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff size={32} className="text-rose-500 opacity-90" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Koneksi Terputus</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
          Sistem gagal mensinkronisasi data progres. Pastikan jaringan internet Anda stabil.
        </p>
        <button 
          onClick={fetchStatus} 
          className="w-full py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_8px_20px_-6px_rgba(225,29,72,0.5)] hover:bg-rose-700 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={16} /> Muat Ulang Sistem
        </button>
      </div>
    </div>
  );

  const safeStep = data ? Math.max(1, Math.min(8, data.current_step ?? 1)) : 1;
  const progressPct = Math.round((safeStep / 8) * 100);
  const currentStepData = STEPS[safeStep - 1];
  const isDisbursed = safeStep === 8 && !data.is_rejected;
  const displayEstimasi = data?.estimasi ? data.estimasi : currentStepData.eta;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-24 relative overflow-hidden">
      {showConfetti && <Confetti />}

      {/* REFINED BACKGROUND - Super Soft Mesh Gradient */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay z-10"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-400/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />

      {/* FLOATING NAVBAR - Elegant & Soft */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none">
        <nav className="pointer-events-auto bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_rgb(0,0,0,0.02)] rounded-[2rem] px-4 py-3 w-full max-w-5xl flex items-center justify-between transition-all duration-500">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white rounded-[14px] p-0.5 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/logo.jpg" alt="Logo" width={44} height={44} className="w-full h-full object-cover rounded-[10px]" priority />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none flex items-baseline">
                SIMantu<span className="text-emerald-500 ml-0.5">.</span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] block mt-1">KN Soppeng</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-50/80 rounded-full border border-slate-100">
              <Calendar size={14} className="text-emerald-500 opacity-80" />
              <span className="text-xs font-bold text-slate-600">{data?.periode || "Periode -"}</span>
            </div>
            <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isOnline ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {isOnline ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> : <WifiOff size={12} />}
              <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <button onClick={handleShare} className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all duration-500 active:scale-95 group">
              {copied ? <CheckCheck size={16} /> : <Share2 size={16} className="group-hover:-translate-y-0.5 transition-transform" />}
            </button>
          </div>
        </nav>
      </div>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 pt-36 sm:pt-44 relative z-20">

        {/* HERO SECTION - Breathable & Elegant */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-sm px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
            <Activity size={12} className="text-emerald-500" /> Live Monitoring
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[4rem] font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
            Pantau Tukin <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Lebih Terbuka & Jelas.
            </span>
          </h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg">
            Transparansi penuh untuk setiap langkah pencairan tunjangan kinerja di lingkungan instansi.
          </p>
        </div>

        {/* BENTO GRID LAYOUT - Refined & Soft */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">

          {/* MAIN CARD (SOFT DARK MODE) */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-[0_20px_40px_rgb(0,0,0,0.08)] group transition-all duration-500">
            {/* Subtle Glowing Orbs */}
            <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-emerald-500/15 transition-colors duration-1000 ease-out" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-10">
                  <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    Tahap Berjalan
                  </span>
                  {!isDisbursed && !data.is_rejected && (
                    <span className="px-4 py-1.5 bg-white/5 text-slate-300 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock size={12} className="text-slate-400" /> ETA: {displayEstimasi}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  <div className="text-6xl sm:text-7xl bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-inner shrink-0 transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:rotate-2">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-500/80 font-black uppercase tracking-[0.3em] mb-3 font-mono flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span> TAHAP {safeStep} / 8
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-3">
                      {currentStepData.title}
                    </h2>
                    <p className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed max-w-md">
                      {currentStepData.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Elegant Progress Bar */}
              <div className="mt-14">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Persentase</span>
                  <span className="text-3xl font-black text-white tracking-tighter">{progressPct}%</span>
                </div>
                <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-[1500ms] ease-out relative"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse blur-[1px]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE PANELS (Clean & Glassy) */}
          <div className="flex flex-col gap-6">
            {/* Info Box */}
            {data?.catatan && data.catatan !== "-" && data.catatan.trim() !== "" ? (
              <div className="bg-white border border-amber-100 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(245,158,11,0.06)] relative overflow-hidden flex-1 flex flex-col justify-center transition-transform duration-500 hover:-translate-y-1">
                <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                  <BellRing size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Informasi</p>
                <p className="font-bold text-slate-800 text-base leading-relaxed">{data.catatan}</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1 flex flex-col justify-center transition-transform duration-500 hover:-translate-y-1">
                <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                  <CheckCheck size={20} />
                </div>
                <p className="font-bold text-slate-800 text-base">Sistem Normal</p>
                <p className="text-sm text-slate-500 font-medium mt-1">Tidak ada info tambahan saat ini.</p>
              </div>
            )}

            {/* Log Update Box */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1 relative overflow-hidden transition-transform duration-500 hover:-translate-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Pembaruan Terakhir</p>
              <div className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
                {data?.updated_at ? new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                {data?.updated_at ? new Date(data.updated_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ERROR BANNER */}
        {data?.is_rejected && (
          <div className="mb-16 bg-white border border-rose-100 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-[0_8px_30px_rgb(225,29,72,0.06)] relative overflow-hidden">
            <div className="bg-rose-50 p-4 rounded-2xl shrink-0"><X size={28} className="text-rose-500" /></div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Tertahan (Revisi SPM)</h3>
              <p className="font-medium text-slate-500 text-sm leading-relaxed">Berkas ditolak oleh KPPN. Tim Keuangan saat ini sedang memproses perbaikan.</p>
            </div>
          </div>
        )}

        {/* PIPELINE GRID - Minimalist Cards */}
        <div className="mb-8 flex items-center justify-between px-2">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard size={18} className="text-slate-400" /> Alur Pencairan
          </h3>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200/60 shadow-sm">
            {progressPct === 100 ? "SELESAI" : `TAHAP ${safeStep}/8`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isDone = stepNum < safeStep;
            const isCurrent = stepNum === safeStep;
            const isRejected = data?.is_rejected && stepNum === 7;
            const isFixing = data?.is_rejected && stepNum === 6 && safeStep === 6;
            const isPending = !isDone && !isCurrent;

            return (
              <div
                key={index}
                className={`
                  relative p-6 rounded-[2rem] transition-all duration-500 ease-out border group
                  ${isDone && !isRejected ? "bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]" : ""}
                  ${(isCurrent || isFixing) && !isRejected ? "bg-white border-emerald-500 shadow-[0_8px_30px_rgb(16,185,129,0.12)] scale-[1.02] z-10" : ""}
                  ${isRejected ? "bg-rose-50/50 border-rose-200" : ""}
                  ${isPending && !isRejected && !isFixing ? "bg-white/40 border-slate-100/50 opacity-60 backdrop-blur-sm" : ""}
                `}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500
                    ${isDone && !isRejected ? "bg-emerald-50 text-emerald-600" : ""}
                    ${(isCurrent || isFixing) && !isRejected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : ""}
                    ${isRejected ? "bg-rose-500 text-white" : ""}
                    ${isPending && !isRejected ? "bg-slate-50 text-slate-400" : ""}
                  `}>
                    {isDone && !isRejected ? <Check size={16} strokeWidth={3} /> : isRejected ? <X size={16} strokeWidth={3} /> : stepNum}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[28px] filter drop-shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ease-out">{step.icon}</span>
                  </div>
                </div>

                <h4 className={`font-black text-[15px] leading-snug mb-1.5 tracking-tight ${isPending && !isRejected ? "text-slate-400" : "text-slate-800"}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                
                {isCurrent && !data?.is_rejected && (
                  <div className="mt-5 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50/50 w-fit px-2.5 py-1 rounded-md">
                     <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                     Aktif
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Modern Floating Action Button */}
      <button 
        onClick={() => alert("Jika ada kendala terkait pencairan, silakan menghubungi Tim Pengelola Keuangan.")}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:-translate-y-1 hover:bg-slate-800 transition-all duration-500 ease-out active:translate-y-0 z-50 group"
      >
        <HelpCircle size={22} className="group-hover:scale-110 transition-transform duration-500 ease-out" />
      </button>
    </div>
  );
}