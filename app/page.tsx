"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Check, X, Calendar, BellRing, Share2, CheckCheck,
  Wifi, WifiOff, Clock, Sparkles, HelpCircle, LayoutDashboard,
  RefreshCcw, HeartPulse, ChevronRight
} from "lucide-react";
import Image from "next/image";

const STEPS = [
  { id: 1, title: "Rekapitulasi Absensi", desc: "Data kehadiran & potongan pegawai", icon: "📋", eta: "1-2 Hari" },
  { id: 2, title: "Pengesahan Rekap", desc: "Verifikasi pimpinan secara hierarki", icon: "✍️", eta: "1 Hari" },
  { id: 3, title: "Hitung Tukin", desc: "Perhitungan nominal akhir secara sistem", icon: "🧮", eta: "1 Hari" },
  { id: 4, title: "Gaji Web KPPN", desc: "Upload data sinkronisasi ke Gaji Web", icon: "💻", eta: "1 Hari" },
  { id: 5, title: "SAKTI KPPN", desc: "Validasi anggaran di sistem SAKTI", icon: "🔐", eta: "1 Hari" },
  { id: 6, title: "Pengajuan SPM", desc: "Penerbitan Surat Perintah Membayar", icon: "📄", eta: "1-2 Hari" },
  { id: 7, title: "Verifikasi KPPN", desc: "Tahap penentu: Approve atau Reject", icon: "🏛️", eta: "1-3 Hari" },
  { id: 8, title: "SP2D Terbit", desc: "Dana akan masuk ke rekening masing-masing! 🎉", icon: "💰", eta: "Cair!" },
];

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => i);
  const colors = ["#10b981", "#14b8a6", "#34d399", "#fcd34d", "#f472b6"];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full animate-confetti shadow-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${Math.random() * 1.5}s`,
            animationDuration: `${2.5 + Math.random() * 2}s`,
            transform: `scale(${Math.random() * 0.8 + 0.5})`,
          }}
        />
      ))}
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20 scale-[2.5]" />
        <div className="h-14 w-14 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin shadow-sm" />
      </div>
      <p className="text-slate-500 text-xs font-bold tracking-widest uppercase animate-pulse">Memuat Data Tukin...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-5 p-8 text-center relative overflow-hidden">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10 max-w-md w-full">
        <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff size={36} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Oops, Koneksi Terputus</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
          Sistem gagal mengambil data terbaru. Jangan khawatir, pastikan internet Anda stabil lalu coba lagi.
        </p>
        <button 
          onClick={fetchStatus} 
          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-emerald-500 hover:shadow-emerald-500/25 hover:-translate-y-1 transition-all duration-300 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={18} /> Coba Muat Ulang
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">
      {showConfetti && <Confetti />}

      {/* FRIENDLY BACKGROUND BLOBS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-100/50 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-amber-100/40 blur-[100px] rounded-full pointer-events-none" />

      {/* SOFT FLOATING NAVBAR */}
      <div className="fixed top-6 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-5xl z-50 pointer-events-none">
        <nav className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] px-4 py-3 flex items-center justify-between transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-white rounded-[14px] shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="w-full h-full object-cover" priority />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[17px] font-black tracking-tight text-slate-800 leading-none">
                SIMantu<span className="text-emerald-500">.</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sistem Monitoring Tukin KN Soppeng</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
              <Calendar size={14} className="text-emerald-500" />
              <span className="text-[12px] font-bold text-slate-600">{data?.periode || "Periode -"}</span>
            </div>
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-500 ${isOnline ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"}`}>
              {isOnline ? <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> : <WifiOff size={14} />}
              <span className="text-[11px] font-bold hidden sm:inline">{isOnline ? "Terhubung" : "Offline"}</span>
            </div>
            <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 hover:scale-105 transition-all duration-300 active:scale-95 group">
              {copied ? <CheckCheck size={16} className="text-emerald-500" /> : <Share2 size={16} />}
            </button>
          </div>
        </nav>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 pt-40 sm:pt-48 pb-20 relative z-20">

        {/* HERO SECTION */}
        <div className="mb-12 max-w-3xl text-center md:text-left mx-auto md:mx-0 flex flex-col items-center md:items-start animate-fade-slide-up">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-slate-600 mb-6">
            <HeartPulse size={14} className="text-emerald-500" /> Pantau Tanpa Stres
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[4.5rem] font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Pencairan Tukin, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              Kini Lebih Transparan.
            </span>
          </h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl text-center md:text-left">
            Dapatkan pembaruan langsung dari tim pengelola keuangan. Lacak status berkas Anda dengan mudah dan tenang.
          </p>
        </div>

        {/* MAIN BENTO DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">

          {/* MAIN CARD (ANIMATED) */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-50 to-transparent pointer-events-none rounded-bl-full opacity-60" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              
              {/* Animated Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
                
                {/* Posisi Saat Ini Badge with Shimmer Effect */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-white/60 to-emerald-100/0 translate-x-[-100%] animate-shimmer" />
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-700 relative z-10">Posisi Saat Ini</span>
                </div>

                {!isDisbursed && !data.is_rejected && (
                  <span className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-100 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Clock size={14} className="text-slate-400 animate-pulse" /> Estimasi: {displayEstimasi}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left mb-6 sm:mb-0">
                {/* Floating Icon Base */}
                <div key={safeStep} className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60 rounded-[2rem] flex items-center justify-center text-5xl sm:text-6xl shrink-0 shadow-inner animate-float group-hover:scale-105 transition-all duration-500 ease-out">
                  {currentStepData.icon}
                </div>
                
                {/* Text Info */}
                <div className="pt-2 animate-fade-slide-up" style={{ animationDelay: "200ms" }}>
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center sm:justify-start gap-1.5">
                    Tahap {safeStep} <ChevronRight size={14}/> 8
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-3">
                    {currentStepData.title}
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md font-medium">
                    {currentStepData.desc}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 sm:mt-14 bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-fade-slide-up" style={{ animationDelay: "300ms" }}>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Penyelesaian</span>
                  <span className="text-2xl font-black text-emerald-500">{progressPct}%</span>
                </div>
                <div className="h-4 w-full bg-slate-200/60 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-[1500ms] ease-out relative"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SIDE PANELS */}
          <div className="flex flex-col gap-6">
            {data?.catatan && data.catatan !== "-" && data.catatan.trim() !== "" ? (
              <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 flex-1 flex flex-col justify-center transition-transform duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="bg-white/60 backdrop-blur-sm w-12 h-12 rounded-2xl flex items-center justify-center text-amber-500 mb-4 shadow-sm relative z-10">
                  <BellRing size={20} className="animate-wiggle" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700/60 mb-2 relative z-10">Papan Pengumuman</p>
                <p className="font-bold text-amber-900 text-[15px] leading-relaxed relative z-10">{data.catatan}</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex-1 flex flex-col justify-center transition-transform duration-300 hover:-translate-y-1">
                <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                  <CheckCheck size={20} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Status Sistem</p>
                <p className="font-bold text-slate-800 text-lg">Semua Normal</p>
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex-1 flex flex-col justify-center transition-transform duration-300 hover:-translate-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Terakhir Diperbarui</p>
              <div className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                {data?.updated_at ? new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                {data?.updated_at ? new Date(data.updated_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ALERTS */}
        {data?.is_rejected && (
          <div className="mb-16 bg-rose-50 border border-rose-100 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm relative overflow-hidden animate-fade-slide-up">
            <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"><X size={24} className="text-rose-500" /></div>
            <div>
              <h3 className="text-xl font-black text-rose-900 tracking-tight mb-2">Pencairan Tertahan (Revisi SPM)</h3>
              <p className="font-medium text-rose-700 text-sm leading-relaxed">Berkas saat ini dikembalikan oleh KPPN. Jangan khawatir, Tim Keuangan sedang melakukan revisi dokumen.</p>
            </div>
          </div>
        )}

        {isDisbursed && (
          <div className="mb-16 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm relative overflow-hidden animate-fade-slide-up">
            <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"><Sparkles size={24} className="text-emerald-500 animate-pulse" /></div>
            <div>
              <h3 className="text-xl font-black text-emerald-900 tracking-tight mb-2">Hore, Tukin Selesai Diproses! 🎉</h3>
              <p className="font-medium text-emerald-700 text-sm leading-relaxed">SP2D telah terbit. Silakan periksa mutasi rekening Anda secara berkala mulai hari ini.</p>
            </div>
          </div>
        )}

        {/* PIPELINE GRID */}
        <div className="mb-8 flex items-center justify-between px-2">
          <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <LayoutDashboard size={18} className="text-emerald-500" /> Rincian Alur Proses
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isDone = stepNum < safeStep;
            const isCurrent = stepNum === safeStep;
            const isRejected = data?.is_rejected && stepNum === 7;
            const isFixing = data?.is_rejected && stepNum === 6 && safeStep === 6;
            const isPending = !isDone && !isCurrent;

            const statusClass = isDone && !isRejected
              ? "bg-white border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)]" 
              : (isCurrent || isFixing) && !isRejected
                ? "bg-white border-emerald-400 ring-4 ring-emerald-50 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.2)] scale-[1.02] z-10" 
                : isRejected 
                  ? "bg-rose-50 border-rose-300 ring-4 ring-rose-50" 
                  : "bg-slate-50/50 border-slate-200 border-dashed opacity-70"; 

            return (
              <div
                key={index}
                className={`relative p-6 rounded-[2rem] border-2 transition-all duration-500 ease-out group ${statusClass}`}
              >
                {/* Connecting Lines Desktop */}
                {index < STEPS.length - 1 && (index + 1) % 4 !== 0 && (
                  <div className="hidden lg:block absolute top-11 -right-5 w-5 h-[2px] z-0">
                     <div className={`w-full h-full ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className={`
                    w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-base shadow-sm transition-colors duration-500
                    ${isDone && !isRejected ? "bg-emerald-100 text-emerald-600" : ""}
                    ${(isCurrent || isFixing) && !isRejected ? "bg-emerald-500 text-white shadow-emerald-500/30" : ""}
                    ${isRejected ? "bg-rose-500 text-white" : ""}
                    ${isPending && !isRejected ? "bg-white text-slate-400 border border-slate-200" : ""}
                  `}>
                    {isDone && !isRejected ? <Check size={20} strokeWidth={3} /> : isRejected ? <X size={20} strokeWidth={3} /> : stepNum}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[32px] transition-all duration-500 ease-out filter drop-shadow-sm ${isCurrent && !isRejected ? "scale-110 -rotate-3" : isPending ? "grayscale opacity-50" : ""}`}>
                      {step.icon}
                    </span>
                  </div>
                </div>

                <div className="min-h-[50px] mb-4">
                  <h4 className={`font-black text-[15px] leading-tight mb-1.5 tracking-tight ${isCurrent && !isRejected ? "text-slate-900" : isPending && !isRejected ? "text-slate-500" : "text-slate-800"}`}>
                    {step.title}
                  </h4>
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-slate-100/80 flex items-center justify-between">
                  {isCurrent && !data?.is_rejected ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1.5 rounded-lg w-full justify-center border border-emerald-100">
                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                        Sedang Diproses
                    </div>
                  ) : isDone && !data?.is_rejected ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center">
                        <CheckCheck size={14} className="text-emerald-400" /> Selesai
                    </div>
                  ) : isFixing ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1.5 rounded-lg w-full justify-center border border-rose-100">
                        <X size={12} strokeWidth={3} /> Perbaikan Berkas
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center">
                        <Clock size={12} className="opacity-70" /> {step.eta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER - COPYRIGHT */}
      <footer className="w-full bg-white border-t border-slate-200/60 mt-auto py-8 text-center relative z-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sm text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} <span className="font-bold text-slate-700">Kejaksaan Negeri Soppeng</span>. Hak Cipta Dilindungi.
          </p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2 flex items-center justify-center gap-1">
            Built with <HeartPulse size={10} className="text-rose-400" /> by Pranata Komputer 625
          </p>
        </div>
      </footer>

      {/* FLOATING HELP BUTTON */}
      <button 
        onClick={() => alert("Hai! Jika ada kendala atau pertanyaan seputar pencairan, silakan hubungi tim Bendahara ya.")}
        className="fixed bottom-8 right-8 px-5 py-4 bg-slate-900 text-white rounded-full flex items-center gap-3 shadow-[0_10px_30px_rgb(0,0,0,0.15)] hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-emerald-500/30 transition-all duration-300 ease-out active:scale-95 z-50 group"
      >
        <HelpCircle size={20} />
        <span className="text-sm font-bold pr-1 hidden sm:inline">Pusat Bantuan</span>
      </button>

      {/* KEYFRAMES */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-shimmer { animation: shimmer 2s infinite ease-in-out; }
        .animate-float { animation: float 4s infinite ease-in-out; }
        .animate-wiggle { animation: wiggle 1s infinite ease-in-out; }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0; 
        }
      `}</style>
    </div>
  );
}