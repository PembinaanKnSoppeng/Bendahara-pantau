"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Check, X, Calendar, BellRing, CheckCheck,
  WifiOff, Clock, HelpCircle, LayoutDashboard,
  RefreshCcw, ChevronRight, Wallet, Utensils, Star, History,
  CheckCircle2, MessageCircle
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
  "Sangat Cepat & Transparan!"
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
    <div className="fixed inset-0 pointer-events-none z-100 overflow-hidden">
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

  // R-32 Keyboard Accessibility: Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowArsipModal(false);
        setShowHelpModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-5 relative">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 border-3 border-amber-100 border-t-amber-600 rounded-full animate-spin shadow-xs" />
      </div>
      <div className="flex flex-col items-center gap-1 z-10">
        <p className="text-slate-800 text-sm font-bold tracking-tight">Memuat Data SIMantu...</p>
        <p className="text-slate-600 text-xs font-medium">Sinkronisasi data keuangan</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 p-6 text-center">
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm relative z-10 max-w-sm w-full flex flex-col items-center">
        <div className="bg-rose-50 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-rose-100">
          <WifiOff size={26} className="text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1.5 text-balance">Koneksi Terputus</h2>
        <p className="text-slate-600 text-xs font-medium leading-relaxed mb-5 text-pretty">Gagal menghubungkan ke server basis data realtime. Periksa koneksi internet Anda lalu coba kembali.</p>
        <button
          onClick={fetchStatus}
          className="w-full py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
        >
          <RefreshCcw size={15} /> Coba Muat Ulang
        </button>
      </div>
    </div>
  );

  const safeStep = data ? Math.max(1, Math.min(8, data.current_step ?? 1)) : 1;
  const progressPct = Math.round((safeStep / 8) * 100);
  const currentStepData = STEPS[safeStep - 1];
  const isDisbursed = safeStep === 8 && !data?.is_rejected;
  const displayEstimasi = data?.estimasi ? data.estimasi : currentStepData.eta;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_BENDAHARA || "";
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=Halo%20Tim%20Keuangan,%20saya%20ingin%20bertanya%20terkait%20Uang%20Makan...`
    : `https://wa.me/?text=Halo%20Tim%20Keuangan%20Kejaksaan%20Negeri%20Soppeng,%20saya%20ingin%20bertanya%20terkait%20Uang%20Makan...`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans selection:bg-amber-100 selection:text-amber-900 relative overflow-x-hidden">
      {showConfetti && <Confetti />}

      {/* MODAL RIWAYAT ARSIP */}
      {showArsipModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={() => setShowArsipModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-5 sm:p-6 animate-fade-slide-up">
            <button
              onClick={() => setShowArsipModal(false)}
              aria-label="Tutup jendela riwayat"
              className="absolute top-5 right-5 p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-hidden"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                <History size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Riwayat Pencairan Uang Makan</h3>
                <p className="text-xs text-slate-600 font-medium">Periode pencairan yang telah sukses terbit SP2D</p>
              </div>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {arsipData.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                    <History size={18} />
                  </div>
                  <p className="text-slate-600 font-semibold text-xs">Belum ada arsip tersimpan.</p>
                </div>
              ) : (
                arsipData.map((arsip, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-all"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-xs tracking-tight">{arsip.periode}</p>
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                        <Calendar size={11} className="text-amber-700" />
                        {new Date(arsip.tanggal_cair).toLocaleDateString("id-ID", { dateStyle: "long" })}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      <Check size={12} strokeWidth={3} /> Cair
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUSAT BANTUAN */}
      {showHelpModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={() => setShowHelpModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-7 flex flex-col items-center text-center animate-fade-slide-up">
            <button
              onClick={() => setShowHelpModal(false)}
              aria-label="Tutup jendela bantuan"
              className="absolute top-5 right-5 p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-hidden"
            >
              <X size={18} />
            </button>
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
              <HelpCircle size={28} className="text-amber-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">Pusat Bantuan Keuangan</h3>
            <p className="text-slate-600 text-xs font-medium leading-relaxed mb-6 text-pretty">
              Ada kendala atau pertanyaan terkait alur pencairan Uang Makan? Tim Bendahara Kejaksaan Negeri Soppeng siap membantu Anda.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-2.5 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:outline-hidden"
            >
              <MessageCircle size={16} />
              <span>Chat WhatsApp Bendahara</span>
            </a>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
            >
              Tutup Jendela
            </button>
          </div>
        </div>
      )}

      {/* FLOATING NAVBAR */}
      <div className="fixed top-3 inset-x-0 mx-auto w-[calc(100%-1.5rem)] max-w-5xl z-50 pointer-events-none">
        <nav className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-full px-3.5 py-1.5 sm:py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/logo.jpg" alt="Logo Kejaksaan Negeri Soppeng" width={32} height={32} className="w-full h-full object-cover" priority />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                SIMantu<span className="text-amber-600">.</span>
              </span>
              <span className="text-[9px] font-semibold text-slate-600 mt-0.5">
                Monitoring KN Soppeng
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
              <Calendar size={12} className="text-amber-700" />
              <span className="text-xs font-semibold text-slate-800 tracking-tight">{data?.periode || "Periode -"}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isOnline ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
              {isOnline ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600" />
                </span>
              ) : (
                <WifiOff size={12} />
              )}
              <span className="text-xs font-semibold hidden sm:inline">{isOnline ? "Live Realtime" : "Offline"}</span>
            </div>
          </div>
        </nav>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 relative z-10">

        {/* HERO SECTION */}
        <div className="mb-7 max-w-2xl text-center md:text-left mx-auto md:mx-0 flex flex-col items-center md:items-start animate-fade-slide-up">
          
          {/* TAB SWITCHER */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-slate-600 hover:text-slate-900 rounded-full text-xs font-semibold transition-all hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:outline-hidden"
              >
                <Wallet size={13} /> Tunjangan Kinerja
              </Link>
              <Link
                href="/uang-makan"
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-white text-amber-800 rounded-full text-xs font-bold shadow-xs border border-slate-200 transition-all focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:outline-hidden"
              >
                <Utensils size={13} /> Uang Makan
              </Link>
            </div>
            <button
              onClick={() => { fetchArsip(); setShowArsipModal(true); }}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-full text-xs font-semibold border border-slate-200 hover:border-amber-300 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:outline-hidden"
            >
              <History size={13} /> Riwayat
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight mb-2 text-balance">
            Pencairan Uang Makan, <br />
            <span className="text-amber-600">
              Kini Lebih Transparan.
            </span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-lg text-center md:text-left text-pretty">
            Pantau tahapan verifikasi berkas absensi hingga terbit SP2D uang makan secara langsung dan terbuka dari tim keuangan Kejaksaan Negeri Soppeng.
          </p>
        </div>

        {/* HERO STATUS CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* MAIN STAGE STATUS CARD */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 flex flex-col justify-between">
            <div className="flex flex-col h-full justify-between">
              
              {/* Status Badges Header */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600" />
                  </span>
                  <span>Posisi Saat Ini</span>
                </div>

                {!isDisbursed && !data?.is_rejected && (
                  <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-medium flex items-center gap-1">
                    <Clock size={12} className="text-slate-500" />
                    Estimasi: <strong className="text-slate-900 font-bold">{displayEstimasi}</strong>
                  </span>
                )}
              </div>

              {/* Stage Info Hero */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left mb-4">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl sm:text-5xl shadow-xs shrink-0">
                  {currentStepData.icon}
                </div>
                <div className="pt-0.5">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold mb-1.5">
                    <span>Tahap</span>
                    <span className="tabular-nums text-amber-800">{safeStep}</span>
                    <ChevronRight size={10} className="text-slate-500" />
                    <span className="tabular-nums">8</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1 text-balance">
                    {currentStepData.title}
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md font-medium text-pretty">
                    {currentStepData.desc}
                  </p>
                </div>
              </div>

              {/* Progress Bar Container with Milestones */}
              <div className="mt-4 sm:mt-5 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Progres Penyelesaian
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-amber-600 tabular-nums">
                    {progressPct}%
                  </span>
                </div>
                
                {/* Track */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 relative">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Milestone Ticks */}
                <div className="flex justify-between items-center px-1 mt-1.5">
                  {STEPS.map((s) => (
                    <span
                      key={s.id}
                      className={`text-[9px] font-bold tabular-nums ${s.id <= safeStep ? "text-amber-800" : "text-slate-500"}`}
                    >
                      {s.id}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* SIDE CARDS COLUMN */}
          <div className="flex flex-col gap-3.5">

            {/* Papan Pengumuman / Status Sistem Card */}
            {data?.catatan && data.catatan !== "-" && data.catatan.trim() !== "" ? (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-center">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-amber-700 mb-2.5 border border-amber-200">
                  <BellRing size={16} />
                </div>
                <p className="text-xs font-bold text-amber-900 mb-1">
                  Papan Pengumuman
                </p>
                <p className="font-medium text-amber-950 text-xs sm:text-[13px] leading-relaxed text-pretty">
                  {data.catatan}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-center">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 mb-2.5 border border-amber-100">
                  <CheckCheck size={16} />
                </div>
                <p className="text-xs font-semibold text-slate-600 mb-0.5">
                  Status Layanan
                </p>
                <p className="font-bold text-slate-900 text-base tracking-tight">
                  Semua Berjalan Normal
                </p>
              </div>
            )}

            {/* Terakhir Diperbarui Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                Terakhir Diperbarui
              </p>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1 tabular-nums">
                {data?.updated_at ? new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
              </div>
              <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-500" />
                {data?.updated_at ? new Date(data.updated_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}
              </p>
            </div>

          </div>
        </div>

        {/* ALERT REVISI SPM (IF REJECTED) */}
        {data?.is_rejected && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs flex flex-col sm:flex-row items-center gap-4 animate-fade-slide-up">
            <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-rose-200 text-rose-700">
              <X size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 tracking-tight mb-0.5">
                Pencairan Tertahan (Revisi Berkas SPM)
              </h3>
              <p className="font-medium text-rose-800 text-xs leading-relaxed text-pretty">
                Berkas dikembalikan untuk penyesuaian oleh KPPN. Tim Keuangan sedang melakukan perbaikan dokumen secara intensif.
              </p>
            </div>
          </div>
        )}

        {/* CELEBRATION & RATING CARD (IF DISBURSED) */}
        {isDisbursed && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-slide-up">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                  Uang Makan Selesai Diproses!
                </h3>
                <p className="font-medium text-slate-700 text-xs sm:text-sm leading-relaxed max-w-md text-pretty">
                  Surat Perintah Pencairan Dana (SP2D) telah terbit resmi. Saldo akan masuk ke rekening Anda secara berkala.
                </p>
              </div>
            </div>
            
            {/* INTERACTIVE RATING WIDGET */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shrink-0 w-full md:w-auto text-center shadow-xs">
              {!hasRated ? (
                <>
                  <p className="text-xs font-bold text-slate-800 mb-2">
                    Beri Penilaian Layanan
                  </p>
                  <div className="flex items-center justify-center gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => submitRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        aria-label={`Beri rating ${star} bintang`}
                        className={`p-1.5 rounded-lg transition-all duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-hidden ${(hoverRating !== null ? hoverRating >= star : rating >= star) ? 'text-amber-500 scale-105' : 'text-slate-300 hover:text-amber-400'}`}
                      >
                        <Star size={22} fill={(hoverRating !== null ? hoverRating >= star : rating >= star) ? "currentColor" : "none"} strokeWidth={2}/>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-amber-700 min-h-[16px]">
                    {RATING_LABELS[hoverRating || rating] || "Pilih 1 - 5 Bintang"}
                  </p>
                </>
              ) : (
                <div className="py-1 animate-fade-slide-up">
                  <div className="w-8 h-8 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-1 border border-amber-200">
                    <CheckCheck size={16} />
                  </div>
                  <p className="text-xs font-bold text-amber-950">Terima Kasih!</p>
                  <p className="text-[10px] font-semibold text-amber-700 mt-0.5">Penilaian Anda Telah Dicatat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TIMELINE ALUR TAHAPAN SECTION */}
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <LayoutDashboard size={15} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Rincian Alur Proses</h3>
              <p className="text-xs text-slate-600 font-medium">8 tahapan standar operasional pencairan Uang Makan Pegawai</p>
            </div>
          </div>
        </div>

        {/* 8 STEPS GRID */}
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
                className={`relative p-4 rounded-xl border transition-all duration-200 ease-out flex flex-col justify-between ${
                  (isCurrent || isFixing) && !isRejected
                    ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm z-10"
                    : isDone && !isRejected
                    ? "bg-white border-slate-200 shadow-xs"
                    : isRejected
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20"
                    : "bg-slate-50/70 border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3.5 relative z-10">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                        isDone && !isRejected
                          ? "bg-amber-100 text-amber-800"
                          : (isCurrent || isFixing) && !isRejected
                          ? "bg-amber-600 text-white"
                          : isRejected
                          ? "bg-rose-700 text-white"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {isDone && !isRejected ? (
                        <Check size={14} strokeWidth={2.5} />
                      ) : isRejected ? (
                        <X size={14} strokeWidth={2.5} />
                      ) : (
                        <span className="tabular-nums">{stepNum}</span>
                      )}
                    </div>
                    <span className={`text-[22px] ${isPending ? "grayscale opacity-50" : ""}`}>
                      {step.icon}
                    </span>
                  </div>

                  <div className="min-h-[46px] mb-3">
                    <h4 className={`font-bold text-xs sm:text-[13px] leading-snug mb-1 tracking-tight ${isCurrent && !isRejected ? "text-slate-900" : isPending && !isRejected ? "text-slate-600" : "text-slate-800"}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed text-pretty">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* BOTTOM STATUS TAG */}
                <div className="pt-3 border-t border-slate-100">
                  {isCurrent && !data?.is_rejected ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-md w-full justify-center border border-amber-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600" />
                      </span>
                      Sedang Diproses
                    </div>
                  ) : isDone && !data?.is_rejected ? (
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 w-full justify-center">
                      <CheckCheck size={13} className="text-amber-700" /> Selesai
                    </div>
                  ) : isFixing ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded-md w-full justify-center border border-rose-200">
                      <X size={11} strokeWidth={2.5} /> Perbaikan Berkas
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 w-full justify-center">
                      <Clock size={10} className="text-slate-500" /> {step.eta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-200 mt-auto py-6 text-center relative z-10">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs text-slate-600 font-medium">
            &copy; TA 2026 <strong className="text-slate-800">Kejaksaan Negeri Soppeng</strong>. Hak Cipta Dilindungi.
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
            Sistem Informasi Monitoring Tukin & Uang Makan (SIMANTU)
          </p>
        </div>
      </footer>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => setShowHelpModal(true)}
        aria-label="Buka pusat bantuan"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 pl-3 pr-4 py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-full flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all z-40 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-hidden"
      >
        <HelpCircle size={16} />
        <span className="text-xs font-bold hidden sm:inline">
          Bantuan
        </span>
      </button>

    </div>
  );
}