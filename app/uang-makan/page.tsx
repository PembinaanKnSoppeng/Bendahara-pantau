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

interface StatusUangMakan {
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
  { id: 2, title: "Pengesahan Rekap", desc: "Verifikasi pimpinan hierarki", icon: "✍️", eta: "1 Hari" },
  { id: 3, title: "Hitung Uang Makan", desc: "Perhitungan nominal uang makan", icon: "🍱", eta: "1 Hari" },
  { id: 4, title: "Input Gaji Web", desc: "Input manual ke Gaji Web", icon: "⌨️", eta: "1 Hari" },
  { id: 5, title: "SAKTI KPPN", desc: "Validasi anggaran sistem SAKTI", icon: "🔐", eta: "1 Hari" },
  { id: 6, title: "Pengajuan SPM", desc: "Penerbitan Surat Perintah Membayar", icon: "📄", eta: "1-2 Hari" },
  { id: 7, title: "Verifikasi KPPN", desc: "Tahap penentu: Approve / Reject", icon: "🏛️", eta: "1-3 Hari" },
  { id: 8, title: "SP2D Terbit", desc: "Dana cair masuk ke rekening! 🎉", icon: "💰", eta: "Cair!" },
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
  const colors = ["#f59e0b", "#fbbf24", "#fcd34d", "#fb923c", "#f472b6"];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {CONFETTI_PIECES.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2.5 h-2.5 rounded-full animate-confetti shadow-xs"
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

export default function UangMakanPublicPage() {
  const [data, setData] = useState<StatusUangMakan | null>(null);
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
      const { data: res, error: err } = await supabase.from("status_uang_makan_global").select("*").eq("id", 1).single();
      if (err || !res) throw err;
      setData(res as StatusUangMakan);
      setError(false);
      
      if (typeof window !== "undefined" && res.periode) {
        const rated = localStorage.getItem(`rated_uang_makan_${res.periode}`);
        if (rated) setHasRated(true);
      }
    } catch {
      setError(true);
    } finally { setLoading(false); }
  }, []);

  const fetchArsip = async () => {
    const { data: res } = await supabase.from("arsip_pencairan").select("*").eq("jenis", "Uang Makan").order("tanggal_cair", { ascending: false });
    if (res) setArsipData(res as ArsipItem[]);
  };

  const submitRating = async (val: number) => {
    if (!data?.periode) return;
    setRating(val);
    await supabase.from("rating_kepuasan").insert([{ periode: data.periode, jenis: "Uang Makan", rating: val }]);
    localStorage.setItem(`rated_uang_makan_${data.periode}`, "true");
    setTimeout(() => setHasRated(true), 600);
  };

  useEffect(() => {
    fetchStatus();
    const channel = supabase.channel("realtime-uang-makan").on("postgres_changes", { event: "UPDATE", schema: "public", table: "status_uang_makan_global" }, (payload) => {
      setData(payload.new as StatusUangMakan); setIsOnline(true);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-200/30 blur-[90px] rounded-full pointer-events-none" />
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20 scale-[2.2]" />
        <div className="h-14 w-14 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin shadow-sm" />
      </div>
      <div className="flex flex-col items-center gap-1 z-10">
        <p className="text-slate-700 text-sm font-bold tracking-tight">Memuat Data SIMantu...</p>
        <p className="text-slate-400 text-[11px] font-semibold tracking-wider uppercase animate-pulse">Monitoring Uang Makan</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 p-6 text-center relative overflow-hidden">
      <div className="p-1.5 rounded-[2rem] bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] relative z-10 max-w-sm w-full">
        <div className="bg-white p-7 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center">
          <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mb-5 border border-rose-100 shadow-inner">
            <WifiOff size={28} className="text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1.5 text-balance">Koneksi Terputus</h2>
          <p className="text-slate-500 text-xs font-medium leading-relaxed mb-5 text-pretty">Gagal menghubungkan ke server realtime database. Pastikan internet Anda aktif lalu coba kembali.</p>
          <button
            onClick={fetchStatus}
            className="w-full py-3.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw size={15} /> Coba Muat Ulang
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans selection:bg-amber-100 selection:text-amber-900 relative overflow-x-hidden">
      {showConfetti && <Confetti />}

      {/* MODAL RIWAYAT ARSIP */}
      {showArsipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" onClick={() => setShowArsipModal(false)} />
          <div className="relative w-full max-w-md p-1.5 rounded-[2rem] bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] animate-fade-slide-up">
            <div className="bg-white rounded-[calc(2rem-0.375rem)] p-5 sm:p-6 border border-slate-100 relative">
              <button
                onClick={() => setShowArsipModal(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Riwayat Pencairan Uang Makan</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Periode pencairan yang telah sukses terbit SP2D</p>
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {arsipData.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                      <History size={20} />
                    </div>
                    <p className="text-slate-500 font-semibold text-xs">Belum ada arsip tersimpan.</p>
                  </div>
                ) : (
                  arsipData.map((arsip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200/70 hover:border-amber-200 hover:shadow-xs transition-all"
                    >
                      <div className="space-y-0.5">
                        <p className="font-black text-slate-900 text-xs tracking-tight">{arsip.periode}</p>
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Calendar size={11} className="text-amber-500" />
                          {new Date(arsip.tanggal_cair).toLocaleDateString("id-ID", { dateStyle: "long" })}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] font-bold">
                        <Check size={12} strokeWidth={3} /> Cair
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" onClick={() => setShowHelpModal(false)} />
          <div className="relative w-full max-w-sm p-1.5 rounded-[2rem] bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] animate-fade-slide-up">
            <div className="bg-white rounded-[calc(2rem-0.375rem)] p-6 sm:p-7 border border-slate-100 flex flex-col items-center text-center relative">
              <button
                onClick={() => setShowHelpModal(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
              >
                <X size={18} />
              </button>
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-amber-100">
                <HelpCircle size={30} className="text-amber-500 animate-wiggle" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Pusat Bantuan Keuangan</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 text-pretty">
                Ada kendala atau pertanyaan terkait alur pencairan Uang Makan? Tim Bendahara siap membantu Anda via WhatsApp.
              </p>
              <button
                onClick={() => window.open('https://wa.me/6281234567890?text=Halo%20Tim%20Keuangan,%20saya%20ingin%20bertanya%20terkait%20Uang%20Makan...', '_blank')}
                className="w-full py-3.5 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-between group mb-2.5"
              >
                <span className="flex-1 text-center pl-5">Chat Tim Bendahara</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:translate-x-0.5">
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </span>
              </button>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 text-slate-400 hover:text-slate-700 text-[11px] font-bold uppercase tracking-wider transition-colors"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AMBIENT BACKGROUND GLOW */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-200/30 via-orange-100/15 to-transparent blur-[120px] rounded-full pointer-events-none z-0" />

      {/* FLOATING GLASS NAVBAR (COMPACT) */}
      <div className="fixed top-3 inset-x-0 mx-auto w-[calc(100%-1.5rem)] max-w-5xl z-50 pointer-events-none">
        <nav className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_8px_25px_rgba(0,0,0,0.04)] rounded-full px-3.5 py-1.5 sm:py-2 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-xl shadow-xs border border-slate-200/60 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-slate-900/5">
              <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="w-full h-full object-cover" priority />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[15px] font-black tracking-tight text-slate-900 leading-none">
                SIMantu<span className="text-amber-500">.</span>
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                Monitoring KN Soppeng
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-50/90 rounded-full border border-slate-200/70 shadow-xs">
              <Calendar size={12} className="text-amber-600" />
              <span className="text-[11px] font-bold text-slate-700 tracking-tight">{data?.periode || "Periode -"}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 shadow-xs ${isOnline ? "bg-amber-50/90 border-amber-200/80 text-amber-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
              {isOnline ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
              ) : (
                <WifiOff size={12} />
              )}
              <span className="text-[10px] font-extrabold hidden sm:inline uppercase tracking-wider">{isOnline ? "Live Realtime" : "Offline"}</span>
            </div>
          </div>
        </nav>
      </div>

      {/* MAIN CONTAINER (COMPACT PADDING) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 relative z-20">

        {/* HERO SECTION */}
        <div className="mb-7 max-w-2xl text-center md:text-left mx-auto md:mx-0 flex flex-col items-center md:items-start animate-fade-slide-up">
          
          {/* EYEBROW BADGE */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-3 shadow-xs">
            <ShieldCheck size={13} className="text-amber-600" />
            <span>Transparansi Pengelolaan Anggaran</span>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
            <div className="flex bg-slate-200/60 p-1 rounded-full border border-slate-300/60 shadow-inner backdrop-blur-md">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-slate-500 hover:text-slate-800 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-white/40"
              >
                <Wallet size={13} /> Tunjangan Kinerja
              </Link>
              <Link
                href="/uang-makan"
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-white text-amber-700 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs border border-slate-200/60 transition-all"
              >
                <Utensils size={13} /> Uang Makan
              </Link>
            </div>
            <button
              onClick={() => { fetchArsip(); setShowArsipModal(true); }}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-white/90 hover:bg-amber-50 text-slate-600 hover:text-amber-800 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs border border-slate-200/80 hover:border-amber-200 active:scale-95 transition-all"
            >
              <History size={13} /> Riwayat
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black text-slate-950 tracking-tight leading-[1.12] mb-3 text-balance">
            Pencairan Uang Makan, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500">
              Kini Lebih Transparan.
            </span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-lg text-center md:text-left text-pretty">
            Pantau tahapan verifikasi berkas absensi hingga terbit SP2D uang makan secara real-time dan terbuka.
          </p>
        </div>

        {/* HERO STATUS CARDS (COMPACT DOUBLE-BEZEL) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* MAIN STAGE STATUS CARD */}
          <div className="lg:col-span-2 p-1.5 sm:p-2 rounded-[1.75rem] bg-gradient-to-b from-white via-slate-50/60 to-slate-100/60 border border-slate-200/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="rounded-[calc(1.75rem-0.375rem)] bg-white p-5 sm:p-7 border border-slate-100/90 relative overflow-hidden flex flex-col justify-between h-full">
              
              {/* Subtle inner top-right glow */}
              <div className="absolute top-0 right-0 w-[280px] h-[280px] bg-gradient-to-bl from-amber-100/40 via-orange-50/20 to-transparent pointer-events-none rounded-bl-full" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Status Badges Header */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full shadow-xs relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-100/0 via-white/80 to-amber-100/0 translate-x-[-100%] animate-shimmer" />
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 relative z-10">
                      Posisi Saat Ini
                    </span>
                  </div>

                  {!isDisbursed && !data?.is_rejected && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200/80 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                      <Clock size={12} className="text-slate-400 animate-pulse" />
                      Estimasi: <strong className="text-slate-800 font-extrabold">{displayEstimasi}</strong>
                    </span>
                  )}
                </div>

                {/* Stage Info Hero */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left mb-4">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-[1.25rem] p-1 bg-gradient-to-b from-amber-100 to-orange-50 border border-amber-200/60 shadow-inner shrink-0">
                    <div className="w-full h-full rounded-[calc(1.25rem-0.25rem)] bg-white/95 backdrop-blur-sm flex items-center justify-center text-4xl sm:text-5xl shadow-xs animate-float">
                      {currentStepData.icon}
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-1.5">
                      <span>Tahap</span>
                      <span className="tabular-nums font-extrabold text-amber-700">{safeStep}</span>
                      <ChevronRight size={10} className="text-slate-400" />
                      <span className="tabular-nums">8</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1 text-balance">
                      {currentStepData.title}
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md font-medium text-pretty">
                      {currentStepData.desc}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Container with Milestones */}
                <div className="mt-4 sm:mt-5 bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-xs">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Progres Penyelesaian
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums">
                      {progressPct}%
                    </span>
                  </div>
                  
                  {/* Track */}
                  <div className="h-3 w-full bg-slate-200/70 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-[1500ms] ease-out relative shadow-xs"
                      style={{ width: `${progressPct}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                      <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/50 rounded-full animate-progress-head" />
                    </div>
                  </div>

                  {/* Milestone Ticks */}
                  <div className="flex justify-between items-center px-1 mt-1.5">
                    {STEPS.map((s) => (
                      <span
                        key={s.id}
                        className={`text-[8px] font-black tabular-nums transition-colors duration-300 ${s.id <= safeStep ? "text-amber-700" : "text-slate-300"}`}
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
          <div className="flex flex-col gap-3.5">

            {/* Papan Pengumuman / Status Sistem Card */}
            {data?.catatan && data.catatan !== "-" && data.catatan.trim() !== "" ? (
              <div className="p-1.5 rounded-[1.75rem] bg-gradient-to-b from-amber-100/70 via-amber-50 to-orange-50/40 border border-amber-200/80 shadow-xs flex-1 flex flex-col">
                <div className="bg-amber-50/60 rounded-[calc(1.75rem-0.375rem)] p-5 flex-1 flex flex-col justify-center relative overflow-hidden border border-amber-100">
                  <div className="bg-white/80 backdrop-blur-sm w-9 h-9 rounded-xl flex items-center justify-center text-amber-600 mb-2.5 shadow-xs border border-amber-100">
                    <BellRing size={16} className="animate-wiggle" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-800/80 mb-1">
                    Papan Pengumuman
                  </p>
                  <p className="font-bold text-amber-950 text-xs sm:text-[13px] leading-relaxed text-pretty">
                    {data.catatan}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-1.5 rounded-[1.75rem] bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-xs flex-1 flex flex-col">
                <div className="bg-white rounded-[calc(1.75rem-0.375rem)] p-5 border border-slate-100 flex-1 flex flex-col justify-center">
                  <div className="bg-amber-50 w-9 h-9 rounded-xl flex items-center justify-center text-amber-600 mb-2.5 border border-amber-100 shadow-inner">
                    <CheckCheck size={16} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                    Status Layanan
                  </p>
                  <p className="font-black text-slate-900 text-base tracking-tight">
                    Semua Berjalan Normal
                  </p>
                </div>
              </div>
            )}

            {/* Terakhir Diperbarui Card */}
            <div className="p-1.5 rounded-[1.75rem] bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-xs flex-1 flex flex-col">
              <div className="bg-white rounded-[calc(1.75rem-0.375rem)] p-5 border border-slate-100 flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Terakhir Diperbarui
                </p>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1 tabular-nums">
                  {data?.updated_at ? new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-400" />
                  {data?.updated_at ? new Date(data.updated_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ALERT REVISI SPM (IF REJECTED) */}
        {data?.is_rejected && (
          <div className="mb-8 p-1.5 rounded-[1.75rem] bg-gradient-to-b from-rose-100 via-rose-50 to-white border border-rose-200 shadow-xs animate-fade-slide-up">
            <div className="bg-rose-50/70 rounded-[calc(1.75rem-0.375rem)] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 border border-rose-100">
              <div className="bg-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-rose-200 text-rose-600">
                <X size={20} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950 tracking-tight mb-1">
                  Pencairan Tertahan (Revisi Berkas SPM)
                </h3>
                <p className="font-medium text-rose-700 text-xs leading-relaxed text-pretty">
                  Berkas dikembalikan untuk penyesuaian oleh KPPN. Tim Keuangan sedang melakukan perbaikan dokumen secara intensif.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CELEBRATION & RATING CARD (IF DISBURSED) */}
        {isDisbursed && (
          <div className="mb-8 p-1.5 rounded-[1.75rem] bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 border border-amber-300 shadow-[0_15px_40px_-15px_rgba(245,158,11,0.2)] animate-fade-slide-up">
            <div className="bg-white/95 backdrop-blur-md rounded-[calc(1.75rem-0.375rem)] p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles size={24} className="text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
                    Uang Makan Selesai Diproses! 🎉
                  </h3>
                  <p className="font-medium text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md text-pretty">
                    Surat Perintah Pencairan Dana (SP2D) telah terbit. Saldo akan masuk ke rekening Anda secara bertahap.
                  </p>
                </div>
              </div>
              
              {/* INTERACTIVE RATING WIDGET */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0 w-full md:w-auto text-center shadow-xs">
                {!hasRated ? (
                  <>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">
                      Beri Penilaian Layanan
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => submitRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${(hoverRating !== null ? hoverRating >= star : rating >= star) ? 'text-amber-400 scale-110' : 'text-slate-300 hover:text-amber-300'}`}
                        >
                          <Star size={22} fill={(hoverRating !== null ? hoverRating >= star : rating >= star) ? "currentColor" : "none"} strokeWidth={2.5}/>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] font-bold text-amber-600 min-h-[16px]">
                      {RATING_LABELS[hoverRating || rating] || "Pilih 1 - 5 Bintang"}
                    </p>
                  </>
                ) : (
                  <div className="py-1 animate-fade-slide-up">
                    <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-1">
                      <CheckCheck size={16} />
                    </div>
                    <p className="text-xs font-black text-amber-950">Terima Kasih!</p>
                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">Ulasan Dicatat</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE ALUR TAHAPAN SECTION */}
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <LayoutDashboard size={15} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Rincian Alur Proses</h3>
              <p className="text-[11px] text-slate-500 font-medium">8 tahapan standar operasional pencairan Uang Makan Pegawai</p>
            </div>
          </div>
        </div>

        {/* 8 STEPS GRID (COMPACT PROPORTIONS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative">
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
                className={`relative p-4 sm:p-4.5 rounded-[1.25rem] border transition-all duration-300 ease-out group flex flex-col justify-between ${
                  (isCurrent || isFixing) && !isRejected
                    ? "bg-gradient-to-b from-amber-50/80 via-white to-white border-amber-400 ring-4 ring-amber-500/15 shadow-[0_12px_28px_-8px_rgba(245,158,11,0.2)] scale-[1.01] z-10"
                    : isDone && !isRejected
                    ? "bg-white border-slate-200/80 shadow-xs hover:border-amber-200 hover:shadow-xs"
                    : isRejected
                    ? "bg-rose-50/70 border-rose-300 ring-4 ring-rose-500/15"
                    : "bg-slate-50/60 border-slate-200/60 opacity-80 hover:opacity-100 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3.5 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs transition-colors duration-300 ${
                        isDone && !isRejected
                          ? "bg-amber-100 text-amber-800"
                          : (isCurrent || isFixing) && !isRejected
                          ? "bg-amber-500 text-white shadow-amber-500/30"
                          : isRejected
                          ? "bg-rose-600 text-white"
                          : "bg-white text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isDone && !isRejected ? (
                        <Check size={15} strokeWidth={3} />
                      ) : isRejected ? (
                        <X size={15} strokeWidth={3} />
                      ) : (
                        <span className="tabular-nums">{stepNum}</span>
                      )}
                    </div>
                    <span className={`text-[24px] transition-transform duration-300 group-hover:scale-110 ${isPending ? "grayscale opacity-40" : ""}`}>
                      {step.icon}
                    </span>
                  </div>

                  <div className="min-h-[46px] mb-3">
                    <h4 className={`font-black text-[13px] sm:text-[14px] leading-snug mb-1 tracking-tight ${isCurrent && !isRejected ? "text-slate-900" : isPending && !isRejected ? "text-slate-500" : "text-slate-800"}`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium leading-relaxed text-pretty">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* BOTTOM STATUS TAG */}
                <div className="pt-3 border-t border-slate-100">
                  {isCurrent && !data?.is_rejected ? (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-800 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg w-full justify-center border border-amber-200/80 shadow-xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                      </span>
                      Sedang Diproses
                    </div>
                  ) : isDone && !data?.is_rejected ? (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center">
                      <CheckCheck size={13} className="text-amber-500" /> Selesai
                    </div>
                  ) : isFixing ? (
                    <div className="flex items-center gap-1 text-[9px] font-black text-rose-700 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg w-full justify-center border border-rose-200">
                      <X size={11} strokeWidth={3} /> Perbaikan Berkas
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center">
                      <Clock size={10} className="opacity-60" /> {step.eta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white/80 backdrop-blur-md border-t border-slate-200/70 mt-auto py-6 text-center relative z-20">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs text-slate-500 font-medium">
            &copy; TA 2026 <strong className="text-slate-800">Kejaksaan Negeri Soppeng</strong>. Hak Cipta Dilindungi.
          </p>
          <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-1 flex items-center justify-center gap-1">
            Sistem Informasi Monitoring Tukin & Uang Makan • Pranata Komputer 625
          </p>
        </div>
      </footer>

      {/* FLOATING ACTION BUTTON (COMPACT) */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 pl-3 pr-4 py-2.5 bg-slate-900 text-white rounded-full flex items-center gap-2.5 shadow-[0_8px_25px_rgba(0,0,0,0.18)] hover:bg-amber-600 hover:shadow-amber-600/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 z-40 group"
      >
        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
          <HelpCircle size={14} />
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline">
          Bantuan
        </span>
      </button>

    </div>
  );
}