"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Check, X, Calendar, BellRing, CheckCheck,
  WifiOff, Clock, Sparkles, HelpCircle, LayoutDashboard,
  RefreshCcw, ChevronRight, Wallet, Utensils, Star, History,
  ArrowUpRight, ShieldCheck
} from "lucide-react";
import Image from "next/image";

interface StatusTukin {
  id: number;
  periode?: string;
  current_step?: number;
  estimasi?: string;
  catatan?: string;
  is_rejected?: boolean;
  updated_at?: string;
}

interface ArsipItem {
  id?: number;
  periode: string;
  tanggal_cair: string;
  jenis: string;
}

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

const RATING_LABELS = [
  "",
  "Sangat Lambat",
  "Kurang Memuaskan",
  "Cukup Baik",
  "Cepat & Tepat",
  "Sangat Cepat & Transparan! 🎉"
];

const CONFETTI_PIECES = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  left: `${(i * 37) % 100}%`,
  delay: `${((i * 13) % 20) / 10}s`,
  duration: `${2.5 + ((i * 17) % 25) / 10}s`,
  scale: (0.5 + ((i * 19) % 8) / 10).toFixed(2),
  colorIndex: i % 5,
}));

function Confetti() {
  const colors = ["#10b981", "#14b8a6", "#34d399", "#fcd34d", "#f472b6"];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {CONFETTI_PIECES.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-full animate-confetti shadow-sm"
          style={{
            left: piece.left,
            top: "-20px",
            backgroundColor: colors[piece.colorIndex],
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            transform: `scale(${piece.scale})`,
          }}
        />
      ))}
    </div>
  );
}

export default function PublicPage() {
  const [data, setData] = useState<StatusTukin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStep, setPrevStep] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [showArsipModal, setShowArsipModal] = useState(false);
  const [arsipData, setArsipData] = useState<ArsipItem[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: res, error: err } = await supabase.from("status_tukin_global").select("*").eq("id", 1).single();
      if (err || !res) throw err;
      setData(res as StatusTukin);
      setError(false);
      
      if (typeof window !== "undefined" && res.periode) {
        const rated = localStorage.getItem(`rated_tukin_${res.periode}`);
        if (rated) setHasRated(true);
      }
    } catch {
      setError(true);
    } finally { setLoading(false); }
  }, []);

  const fetchArsip = async () => {
    const { data: res } = await supabase.from("arsip_pencairan").select("*").eq("jenis", "Tukin").order("tanggal_cair", { ascending: false });
    if (res) setArsipData(res as ArsipItem[]);
  };

  const submitRating = async (val: number) => {
    if (!data?.periode) return;
    setRating(val);
    await supabase.from("rating_kepuasan").insert([{ periode: data.periode, jenis: "Tukin", rating: val }]);
    localStorage.setItem(`rated_tukin_${data.periode}`, "true");
    setTimeout(() => setHasRated(true), 600);
  };

  useEffect(() => {
    fetchStatus();
    const channel = supabase.channel("realtime-status").on("postgres_changes", { event: "UPDATE", schema: "public", table: "status_tukin_global" }, (payload) => {
      setData(payload.new as StatusTukin); setIsOnline(true);
    }).subscribe((status) => setIsOnline(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [fetchStatus]);

  const currentStep = data?.current_step;
  useEffect(() => {
    if (currentStep === undefined) return;
    let timer: NodeJS.Timeout | undefined;
    if (prevStep !== null && prevStep < 8 && currentStep === 8) {
      setShowConfetti(true);
      timer = setTimeout(() => setShowConfetti(false), 8000);
    }
    setPrevStep(currentStep);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentStep, prevStep]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20 scale-[2.5]" />
        <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin shadow-md" />
      </div>
      <div className="flex flex-col items-center gap-1.5 z-10">
        <p className="text-slate-700 text-sm font-bold tracking-tight">Memuat Data SIMantu...</p>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase animate-pulse">Sinkronisasi Keuangan</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-5 p-8 text-center relative overflow-hidden">
      <div className="p-2 rounded-[2.5rem] bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] relative z-10 max-w-md w-full">
        <div className="bg-white p-8 sm:p-10 rounded-[calc(2.5rem-0.5rem)] border border-slate-100 flex flex-col items-center">
          <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-rose-100 shadow-inner">
            <WifiOff size={32} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 text-balance">Koneksi Terputus</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 text-pretty">Gagal menghubungkan ke server realtime database. Pastikan internet Anda aktif lalu coba kembali.</p>
          <button
            onClick={fetchStatus}
            className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw size={16} /> Coba Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );

  const safeStep = data ? Math.max(1, Math.min(8, data.current_step ?? 1)) : 1;
  const progressPct = Math.round((safeStep / 8) * 100);
  const currentStepData = STEPS[safeStep - 1];
  const isDisbursed = safeStep === 8 && !data?.is_rejected;
  const displayEstimasi = data?.estimasi ? data.estimasi : currentStepData.eta;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900 relative overflow-x-hidden">
      {showConfetti && <Confetti />}

      {/* MODAL RIWAYAT ARSIP */}
      {showArsipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" onClick={() => setShowArsipModal(false)} />
          <div className="relative w-full max-w-lg p-2 rounded-[2.5rem] bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200/80 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] animate-fade-slide-up">
            <div className="bg-white rounded-[calc(2.5rem-0.5rem)] p-6 sm:p-8 border border-slate-100 relative">
              <button
                onClick={() => setShowArsipModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                  <History size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Pencairan Tukin</h3>
                  <p className="text-xs text-slate-500 font-medium">Arsip periode pencairan yang telah sukses terbit SP2D</p>
                </div>
              </div>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1.5 custom-scrollbar">
                {arsipData.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                      <History size={24} />
                    </div>
                    <p className="text-slate-500 font-semibold text-sm">Belum ada arsip tersimpan.</p>
                  </div>
                ) : (
                  arsipData.map((arsip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/70 hover:border-emerald-200 hover:shadow-xs transition-all"
                    >
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 text-sm tracking-tight">{arsip.periode}</p>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <Calendar size={12} className="text-emerald-500" />
                          {new Date(arsip.tanggal_cair).toLocaleDateString("id-ID", { dateStyle: "long" })}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold">
                        <Check size={14} strokeWidth={3} /> Cair
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUSAT BANTUAN */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" onClick={() => setShowHelpModal(false)} />
          <div className="relative w-full max-w-md p-2 rounded-[2.5rem] bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200/80 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] animate-fade-slide-up">
            <div className="bg-white rounded-[calc(2.5rem-0.5rem)] p-8 sm:p-10 border border-slate-100 flex flex-col items-center text-center relative">
              <button
                onClick={() => setShowHelpModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
                <HelpCircle size={36} className="text-emerald-500 animate-wiggle" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2.5">Pusat Bantuan Keuangan</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 text-pretty">
                Ada kendala atau pertanyaan terkait alur pencairan Tukin? Tim Bendahara siap membantu Anda via WhatsApp.
              </p>
              <button
                onClick={() => window.open('https://wa.me/6281234567890?text=Halo%20Tim%20Keuangan,%20saya%20ingin%20bertanya%20terkait%20Tukin...', '_blank')}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-between group mb-3"
              >
                <span className="flex-1 text-center pl-6">Chat Tim Bendahara</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:translate-x-0.5">
                  <ArrowUpRight size={16} strokeWidth={2.5} />
                </span>
              </button>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-3 text-slate-400 hover:text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AMBIENT BACKGROUND GLOW */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-emerald-200/40 via-teal-100/25 to-transparent blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed -top-40 right-[-10%] w-[500px] h-[500px] bg-gradient-to-bl from-teal-200/30 to-transparent blur-[120px] rounded-full pointer-events-none z-0" />

      {/* FLOATING GLASS NAVBAR */}
      <div className="fixed top-4 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-5xl z-50 pointer-events-none">
        <nav className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] rounded-[2rem] px-4 py-2.5 flex items-center justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-white rounded-2xl shadow-xs border border-slate-200/60 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-slate-900/5">
              <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="w-full h-full object-cover" priority />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[17px] font-black tracking-tight text-slate-900 leading-none">
                SIMantu<span className="text-emerald-500">.</span>
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                Monitoring KN Soppeng
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50/90 rounded-full border border-slate-200/70 shadow-xs">
              <Calendar size={13} className="text-emerald-600" />
              <span className="text-[12px] font-bold text-slate-700 tracking-tight">{data?.periode || "Periode -"}</span>
            </div>
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 shadow-xs ${isOnline ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
              {isOnline ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              ) : (
                <WifiOff size={13} />
              )}
              <span className="text-[11px] font-extrabold hidden sm:inline uppercase tracking-wider">{isOnline ? "Live Realtime" : "Offline"}</span>
            </div>
          </div>
        </nav>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 pt-32 sm:pt-40 pb-24 relative z-20">

        {/* HERO SECTION */}
        <div className="mb-12 max-w-3xl text-center md:text-left mx-auto md:mx-0 flex flex-col items-center md:items-start animate-fade-slide-up">
          
          {/* EYEBROW BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-5 shadow-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Transparansi Pengelolaan Anggaran</span>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-8">
            <div className="flex bg-slate-200/60 p-1.5 rounded-full border border-slate-300/60 shadow-inner backdrop-blur-md">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-white text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border border-slate-200/60 transition-all"
              >
                <Wallet size={15} /> Tunjangan Kinerja
              </Link>
              <Link
                href="/uang-makan"
                className="flex items-center gap-2 px-4 sm:px-5 py-2 text-slate-500 hover:text-slate-800 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/40"
              >
                <Utensils size={15} /> Uang Makan
              </Link>
            </div>
            <button
              onClick={() => { fetchArsip(); setShowArsipModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/90 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs border border-slate-200/80 hover:border-emerald-200 active:scale-95 transition-all"
            >
              <History size={14} /> Riwayat
            </button>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[4.25rem] font-black text-slate-950 tracking-tight leading-[1.08] mb-5 text-balance">
            Pencairan Tukin, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
              Kini Lebih Transparan.
            </span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed max-w-xl text-center md:text-left text-pretty">
            Pantau status proses pengajuan hingga penerbitan SP2D secara langsung dan akurat dari tim keuangan.
          </p>
        </div>

        {/* HERO STATUS CARDS (DOUBLE-BEZEL ARCHITECTURE) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">

          {/* MAIN STAGE STATUS CARD */}
          <div className="lg:col-span-2 p-2 sm:p-2.5 rounded-[2.5rem] bg-gradient-to-b from-white via-slate-50/60 to-slate-100/60 border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-white p-6 sm:p-10 border border-slate-100/90 relative overflow-hidden flex flex-col justify-between h-full">
              
              {/* Subtle inner top-right glow */}
              <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent pointer-events-none rounded-bl-full" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Status Badges Header */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full shadow-xs relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-white/80 to-emerald-100/0 translate-x-[-100%] animate-shimmer" />
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 relative z-10">
                      Posisi Saat Ini
                    </span>
                  </div>

                  {!isDisbursed && !data?.is_rejected && (
                    <span className="px-3.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200/80 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                      <Clock size={13} className="text-slate-400 animate-pulse" />
                      Estimasi: <strong className="text-slate-800 font-extrabold">{displayEstimasi}</strong>
                    </span>
                  )}
                </div>

                {/* Stage Info Hero */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left mb-6 sm:mb-2">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] p-1.5 bg-gradient-to-b from-emerald-100 to-teal-50 border border-emerald-200/60 shadow-inner shrink-0">
                    <div className="w-full h-full rounded-[calc(2rem-0.375rem)] bg-white/95 backdrop-blur-sm flex items-center justify-center text-5xl sm:text-6xl shadow-sm animate-float">
                      {currentStepData.icon}
                    </div>
                  </div>
                  <div className="pt-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2.5">
                      <span>Tahap</span>
                      <span className="tabular-nums font-extrabold text-emerald-700">{safeStep}</span>
                      <ChevronRight size={12} className="text-slate-400" />
                      <span className="tabular-nums">8</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2.5 text-balance">
                      {currentStepData.title}
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md font-medium text-pretty">
                      {currentStepData.desc}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Container with Milestones */}
                <div className="mt-8 sm:mt-10 bg-slate-50/90 p-5 sm:p-6 rounded-[2rem] border border-slate-200/70 shadow-xs">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      Progres Penyelesaian
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums">
                        {progressPct}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Track */}
                  <div className="h-4 w-full bg-slate-200/70 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-full transition-all duration-[1500ms] ease-out relative shadow-sm"
                      style={{ width: `${progressPct}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/50 rounded-full animate-progress-head" />
                    </div>
                  </div>

                  {/* Milestone Ticks */}
                  <div className="flex justify-between items-center px-1 mt-2.5">
                    {STEPS.map((s) => (
                      <span
                        key={s.id}
                        className={`text-[9px] font-black tabular-nums transition-colors duration-300 ${s.id <= safeStep ? "text-emerald-700" : "text-slate-300"}`}
                      >
                        {s.id}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* SIDE CARDS COLUMN */}
          <div className="flex flex-col gap-6">

            {/* Papan Pengumuman / Status Sistem Card */}
            {data?.catatan && data.catatan !== "-" && data.catatan.trim() !== "" ? (
              <div className="p-2 rounded-[2.5rem] bg-gradient-to-b from-amber-100/70 via-amber-50 to-orange-50/40 border border-amber-200/80 shadow-[0_15px_40px_-15px_rgba(245,158,11,0.15)] flex-1 flex flex-col">
                <div className="bg-amber-50/60 rounded-[calc(2.5rem-0.5rem)] p-7 flex-1 flex flex-col justify-center relative overflow-hidden border border-amber-100">
                  <div className="bg-white/80 backdrop-blur-sm w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 mb-4 shadow-xs border border-amber-100">
                    <BellRing size={20} className="animate-wiggle" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-800/80 mb-2">
                    Papan Pengumuman
                  </p>
                  <p className="font-bold text-amber-950 text-sm leading-relaxed text-pretty">
                    {data.catatan}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-[2.5rem] bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.04)] flex-1 flex flex-col">
                <div className="bg-white rounded-[calc(2.5rem-0.5rem)] p-7 border border-slate-100 flex-1 flex flex-col justify-center">
                  <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100 shadow-inner">
                    <CheckCheck size={20} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Status Layanan
                  </p>
                  <p className="font-black text-slate-900 text-lg tracking-tight">
                    Semua Berjalan Normal
                  </p>
                </div>
              </div>
            )}

            {/* Terakhir Diperbarui Card */}
            <div className="p-2 rounded-[2.5rem] bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.04)] flex-1 flex flex-col">
              <div className="bg-white rounded-[calc(2.5rem-0.5rem)] p-7 border border-slate-100 flex-1 flex flex-col justify-center">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                  Terakhir Diperbarui
                </p>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2 tabular-nums">
                  {data?.updated_at ? new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  {data?.updated_at ? new Date(data.updated_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ALERT REVISI SPM (IF REJECTED) */}
        {data?.is_rejected && (
          <div className="mb-14 p-2 rounded-[2.5rem] bg-gradient-to-b from-rose-100 via-rose-50 to-white border border-rose-200 shadow-sm animate-fade-slide-up">
            <div className="bg-rose-50/70 rounded-[calc(2.5rem-0.5rem)] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 border border-rose-100">
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-200 text-rose-600">
                <X size={26} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-950 tracking-tight mb-1.5">
                  Pencairan Tertahan (Revisi Berkas SPM)
                </h3>
                <p className="font-medium text-rose-700 text-sm leading-relaxed text-pretty">
                  Berkas dikembalikan untuk penyesuaian oleh KPPN. Tim Keuangan sedang melakukan perbaikan dokumen secara intensif.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CELEBRATION & RATING CARD (IF DISBURSED) */}
        {isDisbursed && (
          <div className="mb-14 p-2 rounded-[2.5rem] bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-300 border border-emerald-300 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.25)] animate-fade-slide-up">
            <div className="bg-white/95 backdrop-blur-md rounded-[calc(2.5rem-0.5rem)] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                <div className="w-16 h-16 rounded-[1.75rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles size={32} className="text-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                    Tukin Selesai Diproses! 🎉
                  </h3>
                  <p className="font-medium text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg text-pretty">
                    Surat Perintah Pencairan Dana (SP2D) telah terbit. Saldo akan masuk ke rekening Anda secara bertahap.
                  </p>
                </div>
              </div>
              
              {/* INTERACTIVE RATING WIDGET */}
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/80 shrink-0 w-full md:w-auto text-center shadow-xs">
                {!hasRated ? (
                  <>
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-3">
                      Beri Penilaian Layanan
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => submitRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className={`p-2 rounded-xl transition-all duration-200 active:scale-90 ${(hoverRating !== null ? hoverRating >= star : rating >= star) ? 'text-amber-400 scale-110' : 'text-slate-300 hover:text-amber-300'}`}
                        >
                          <Star size={28} fill={(hoverRating !== null ? hoverRating >= star : rating >= star) ? "currentColor" : "none"} strokeWidth={2.5}/>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-amber-600 min-h-[18px]">
                      {RATING_LABELS[hoverRating || rating] || "Pilih 1 - 5 Bintang"}
                    </p>
                  </>
                ) : (
                  <div className="py-2 animate-fade-slide-up">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCheck size={20} />
                    </div>
                    <p className="text-sm font-black text-emerald-900">Terima Kasih!</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Ulasan Anda Telah Dicatat</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE ALUR TAHAPAN SECTION */}
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Rincian Alur Proses</h3>
              <p className="text-xs text-slate-500 font-medium">8 tahapan standar operasional pencairan Tunjangan Kinerja</p>
            </div>
          </div>
        </div>

        {/* 8 STEPS GRID (LINEAR-TIER CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
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
                className={`relative p-6 rounded-[2rem] border transition-all duration-300 ease-out group flex flex-col justify-between ${
                  (isCurrent || isFixing) && !isRejected
                    ? "bg-gradient-to-b from-emerald-50/80 via-white to-white border-emerald-400 ring-4 ring-emerald-500/15 shadow-[0_18px_35px_-10px_rgba(16,185,129,0.22)] scale-[1.02] z-10"
                    : isDone && !isRejected
                    ? "bg-white border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-sm"
                    : isRejected
                    ? "bg-rose-50/70 border-rose-300 ring-4 ring-rose-500/15"
                    : "bg-slate-50/60 border-slate-200/60 opacity-80 hover:opacity-100 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs transition-colors duration-300 ${
                        isDone && !isRejected
                          ? "bg-emerald-100 text-emerald-700"
                          : (isCurrent || isFixing) && !isRejected
                          ? "bg-emerald-600 text-white shadow-emerald-500/30"
                          : isRejected
                          ? "bg-rose-600 text-white"
                          : "bg-white text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isDone && !isRejected ? (
                        <Check size={18} strokeWidth={3} />
                      ) : isRejected ? (
                        <X size={18} strokeWidth={3} />
                      ) : (
                        <span className="tabular-nums">{stepNum}</span>
                      )}
                    </div>
                    <span className={`text-[30px] transition-transform duration-300 group-hover:scale-110 ${isPending ? "grayscale opacity-40" : ""}`}>
                      {step.icon}
                    </span>
                  </div>

                  <div className="min-h-[55px] mb-4">
                    <h4 className={`font-black text-[15px] leading-snug mb-1 tracking-tight ${isCurrent && !isRejected ? "text-slate-900" : isPending && !isRejected ? "text-slate-500" : "text-slate-800"}`}>
                      {step.title}
                    </h4>
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed text-pretty">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* BOTTOM STATUS TAG */}
                <div className="pt-4 border-t border-slate-100">
                  {isCurrent && !data?.is_rejected ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1.5 rounded-xl w-full justify-center border border-emerald-200/80 shadow-xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Sedang Diproses
                    </div>
                  ) : isDone && !data?.is_rejected ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center">
                      <CheckCheck size={14} className="text-emerald-500" /> Selesai
                    </div>
                  ) : isFixing ? (
                    <div className="flex items-center gap-1 text-[10px] font-black text-rose-700 uppercase tracking-widest bg-rose-50 px-2.5 py-1.5 rounded-xl w-full justify-center border border-rose-200">
                      <X size={12} strokeWidth={3} /> Perbaikan Berkas
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center">
                      <Clock size={11} className="opacity-60" /> {step.eta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white/80 backdrop-blur-md border-t border-slate-200/70 mt-auto py-8 text-center relative z-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            &copy; TA 2026 <strong className="text-slate-800">Kejaksaan Negeri Soppeng</strong>. Hak Cipta Dilindungi.
          </p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2 flex items-center justify-center gap-1.5">
            Sistem Informasi Monitoring Tukin & Uang Makan • Pranata Komputer 625
          </p>
        </div>
      </footer>

      {/* FLOATING ACTION BUTTON (PUSAT BANTUAN) */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 pl-4 pr-5 py-3.5 bg-slate-900 text-white rounded-full flex items-center gap-3 shadow-[0_12px_35px_rgba(0,0,0,0.2)] hover:bg-emerald-600 hover:shadow-emerald-600/30 hover:-translate-y-1 transition-all duration-300 active:scale-95 z-40 group"
      >
        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
          <HelpCircle size={18} />
        </span>
        <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
          Bantuan
        </span>
      </button>

    </div>
  );
}