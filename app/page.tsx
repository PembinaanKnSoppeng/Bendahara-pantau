"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Check, X, Calendar, BellRing,
  Share2, CheckCheck, ChevronRight, AlertTriangle,
  Wifi, WifiOff, Clock, Sparkles
} from "lucide-react";
import Image from "next/image";

const STEPS = [
  { id: 1, title: "Rekapitulasi Absensi", desc: "Pengumpulan data kehadiran seluruh pegawai", icon: "📋" },
  { id: 2, title: "Pengesahan Rekap", desc: "Verifikasi & tanda tangan pimpinan", icon: "✍️" },
  { id: 3, title: "Hitung Tukin", desc: "Perhitungan nominal tunjangan per pegawai", icon: "🧮" },
  { id: 4, title: "Gaji Web KPPN", desc: "Upload & validasi data ke Gaji Web", icon: "💻" },
  { id: 5, title: "SAKTI KPPN", desc: "Validasi di sistem keuangan SAKTI", icon: "🔐" },
  { id: 6, title: "Pengajuan SPM", desc: "Penerbitan Surat Perintah Membayar", icon: "📄" },
  { id: 7, title: "Verifikasi KPPN", desc: "Tahap penentu: Approve atau Reject", icon: "🏛️" },
  { id: 8, title: "SP2D Terbit", desc: "Dana masuk ke rekening pegawai! 🎉", icon: "💰" },
];

// --- Utility ---
function timeAgo(dateStr: string) {
  if (!dateStr) return "-";
  const now = new Date();
  const past = new Date(dateStr);
  if (isNaN(past.getTime())) return "-";
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// --- Confetti Component ---
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => i);
  const colors = ["#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti-fall linear forwards; }
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
  const [tick, setTick] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStep, setPrevStep] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: res, error: err } = await supabase
        .from("status_tukin_global")
        .select("*")
        .eq("id", 1)
        .single();
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
    const channel = supabase
      .channel("realtime-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "status_tukin_global" },
        (payload) => {
          setData(payload.new);
          setIsOnline(true);
        }
      )
      .subscribe((status) => {
        setIsOnline(status === "SUBSCRIBED");
      });

    const timer = setInterval(() => setTick((t) => t + 1), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (!data) return;
    if (prevStep !== null && prevStep < 8 && data.current_step === 8) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    setPrevStep(data.current_step);
  }, [data?.current_step]);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safeStep = data ? Math.max(1, Math.min(8, data.current_step ?? 1)) : 1;
  const progressPct = Math.round((safeStep / 8) * 100);

  // --- Loading ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-20 scale-150" />
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">Memuat data terkini...</p>
    </div>
  );

  // --- Error ---
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-8 text-center">
      <AlertTriangle size={40} className="text-amber-500" />
      <h2 className="text-xl font-bold text-slate-800">Gagal memuat data</h2>
      <p className="text-slate-500 text-sm max-w-xs">Tidak dapat terhubung ke server. Periksa koneksi internet Anda.</p>
      <button
        onClick={fetchStatus}
        className="mt-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
      >
        Coba Lagi
      </button>
    </div>
  );

  const currentStepData = STEPS[safeStep - 1];
  const isDisbursed = safeStep === 8 && !data.is_rejected;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 pb-24">
      {showConfetti && <Confetti />}

      {/* Sticky Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Navbar */}
      <nav className="sticky top-1 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* Logo Image */}
            <Image
              src="/logo.jpg"
              alt="Logo Pembinaan Kejaksaan Republik Indonesia"
              width={40}
              height={40}
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain drop-shadow"
              priority
            />
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-800">
              SIMantu<span className="text-indigo-600"> Sistem Monitoring Tukin</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online Indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isOnline ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? "Live" : "Offline"}
            </div>

            {/* Periode */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium text-slate-600">
              <Calendar size={12} />
              <span>{data?.periode || "—"}</span>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all"
            >
              {copied ? <CheckCheck size={12} className="text-emerald-500" /> : <Share2 size={12} />}
              <span className="hidden sm:inline">{copied ? "Tersalin!" : "Salin Link"}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">

        {/* Hero */}
        <div className="mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Pemantauan Aktif
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
            Pantau Progres Pencairan <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Tukin Anda.
            </span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed">
            Sistem pemantauan transparan untuk mengecek tahapan pencairan Tunjangan Kinerja (Tukin) secara real-time.
          </p>
        </div>

        {/* Announcement Banner */}
        {data?.catatan && data.catatan !== "-" && data.catatan.trim() !== "" && (
          <div className="mb-8 bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg shadow-amber-900/5">
            <div className="bg-amber-100 p-3 rounded-xl shrink-0">
              <BellRing size={24} className="text-amber-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">📢 Informasi & Pengumuman</p>
              <p className="text-amber-900 font-bold text-base leading-snug">{data.catatan}</p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {isDisbursed && (
          <div className="mb-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-emerald-200">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={28} />
              <h2 className="text-2xl font-black">Tukin Sudah Cair! 🎉</h2>
            </div>
            <p className="text-emerald-100 font-medium">SP2D telah terbit dan dana sedang dalam proses transfer ke rekening pegawai.</p>
          </div>
        )}

        {/* Main Status Card + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">

          {/* Main Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-7 sm:p-10 border border-slate-200 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full opacity-50" />
            </div>

            <div className="relative z-10">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Tahapan Sekarang
              </span>
              <div className="mt-4 flex items-start gap-4">
                <span className="text-4xl">{currentStepData.icon}</span>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">Langkah {safeStep} dari 8</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight uppercase">
                    {currentStepData.title}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1 font-medium">{currentStepData.desc}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-8">
                <div className="flex justify-between text-xs font-bold mb-2.5">
                  <span className="text-slate-400">Penyelesaian</span>
                  <span className="text-indigo-600">{progressPct}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-400">Mulai</span>
                  <span className="text-[10px] text-slate-400">SP2D Terbit</span>
                </div>
              </div>

              {/* Steps mini dots */}
              <div className="flex gap-1.5 mt-4">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i + 1 < safeStep
                        ? "bg-emerald-400 flex-1"
                        : i + 1 === safeStep
                        ? "bg-indigo-600 flex-[2]"
                        : "bg-slate-200 flex-1"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-7 sm:p-8 text-white shadow-2xl shadow-indigo-900/20 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Update Terakhir</h3>
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Clock size={14} />
                <span className="text-sm font-bold">{timeAgo(data?.updated_at)}</span>
              </div>
              <div className="text-3xl font-mono font-bold text-white leading-none">
                {data?.updated_at
                  ? new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </div>
              <div className="text-slate-400 mt-1 text-xs">
                {data?.updated_at
                  ? new Date(data.updated_at).toLocaleDateString("id-ID", { dateStyle: "long" })
                  : "—"}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-5">
              <p className="text-slate-400 text-xs leading-relaxed">
                Informasi ini diperbarui oleh bagian keuangan segera setelah proses di KPPN selesai. Refresh otomatis aktif.
              </p>
            </div>

            {data.is_rejected && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <X size={16} className="text-rose-400" />
                  <span className="text-xs font-black text-rose-300 uppercase tracking-wide">Ditolak KPPN</span>
                </div>
                <p className="text-xs text-rose-200 font-medium leading-relaxed">
                  KPPN menolak pengajuan SPM. Saat ini sedang dalam tahap perbaikan oleh Admin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            Pipeline Proses Tukin
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {safeStep - 1} dari 8 selesai
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isDone = stepNum < safeStep;
            const isCurrent = stepNum === safeStep;
            const isRejected = data.is_rejected && stepNum === 7;
            const isFixing = data.is_rejected && stepNum === 6 && safeStep === 6;
            const isPending = !isDone && !isCurrent;

            return (
              <div
                key={index}
                className={`
                  relative p-5 sm:p-6 rounded-2xl transition-all duration-500 border
                  ${isDone && !isRejected ? "bg-white border-emerald-100 hover:shadow-md" : ""}
                  ${(isCurrent || isFixing) && !isRejected ? "bg-white border-indigo-200 shadow-xl shadow-indigo-50 ring-2 ring-indigo-500/20" : ""}
                  ${isRejected ? "bg-rose-50 border-rose-200 ring-2 ring-rose-500/10" : ""}
                  ${isPending && !isRejected && !isFixing ? "bg-slate-50/60 border-transparent opacity-50" : ""}
                `}
              >
                {/* Step number & icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all
                    ${isDone && !isRejected ? "bg-emerald-500 text-white" : ""}
                    ${(isCurrent || isFixing) && !isRejected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : ""}
                    ${isRejected ? "bg-rose-500 text-white animate-bounce" : ""}
                    ${isPending && !isRejected ? "bg-white text-slate-300 border border-slate-200" : ""}
                  `}>
                    {isDone && !isRejected ? <Check size={18} /> : isRejected ? <X size={18} /> : stepNum}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{step.icon}</span>
                    {isCurrent && !data.is_rejected && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    )}
                  </div>
                </div>

                {/* Text */}
                <h4 className={`font-bold text-base leading-tight mb-1 ${isPending && !isRejected ? "text-slate-400" : "text-slate-900"}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{step.desc}</p>

                {/* Badge */}
                {isFixing && (
                  <div className="mt-3 py-1 px-2.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg w-fit uppercase tracking-wide">
                    ⚠️ Perbaikan SPM
                  </div>
                )}
                {stepNum === 8 && isCurrent && !data.is_rejected && (
                  <div className="mt-3 py-1 px-2.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg w-fit uppercase tracking-wide">
                    ✅ Berhasil Cair!
                  </div>
                )}

                {/* Arrow connector (hidden on mobile) */}
                {index < STEPS.length - 1 && (index + 1) % 4 !== 0 && (
                  <ChevronRight
                    size={16}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300 hidden xl:block z-10"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-400 text-xs">
          <p>Data diperbarui secara real-time · {data?.periode}</p>
        </div>
      </main>
    </div>
  );
}