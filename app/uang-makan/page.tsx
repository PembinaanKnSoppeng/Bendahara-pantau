"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Check, X, Calendar, BellRing, Share2, CheckCheck,
  Wifi, WifiOff, Clock, Sparkles, HelpCircle, LayoutDashboard,
  RefreshCcw, HeartPulse, ChevronRight, Wallet, Utensils, Star, History
} from "lucide-react";
import Image from "next/image";

const STEPS = [
  { id: 1, title: "Rekapitulasi Absensi", desc: "Data kehadiran & potongan pegawai", icon: "📋", eta: "1-2 Hari" },
  { id: 2, title: "Pengesahan Rekap", desc: "Verifikasi pimpinan secara hierarki", icon: "✍️", eta: "1 Hari" },
  { id: 3, title: "Hitung Uang Makan", desc: "Perhitungan nominal uang makan", icon: "🍱", eta: "1 Hari" },
  { id: 4, title: "Input Gaji Web", desc: "Proses input manual ke Gaji Web", icon: "⌨️", eta: "1 Hari" },
  { id: 5, title: "SAKTI KPPN", desc: "Validasi anggaran di sistem SAKTI", icon: "🔐", eta: "1 Hari" },
  { id: 6, title: "Pengajuan SPM", desc: "Penerbitan Surat Perintah Membayar", icon: "📄", eta: "1-2 Hari" },
  { id: 7, title: "Verifikasi KPPN", desc: "Tahap penentu: Approve atau Reject", icon: "🏛️", eta: "1-3 Hari" },
  { id: 8, title: "SP2D Terbit", desc: "Dana akan masuk ke rekening masing-masing! 🎉", icon: "💰", eta: "Cair!" },
];

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => i);
  const colors = ["#f59e0b", "#fbbf24", "#fcd34d", "#fb923c", "#f472b6"];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((i) => (
        <div key={i} className="absolute w-3 h-3 rounded-full animate-confetti shadow-sm" style={{ left: `${Math.random() * 100}%`, top: `-20px`, backgroundColor: colors[i % colors.length], animationDelay: `${Math.random() * 1.5}s`, animationDuration: `${2.5 + Math.random() * 2}s`, transform: `scale(${Math.random() * 0.8 + 0.5})` }} />
      ))}
    </div>
  );
}

export default function UangMakanPublicPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStep, setPrevStep] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [showArsipModal, setShowArsipModal] = useState(false);
  const [arsipData, setArsipData] = useState<any[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: res, error: err } = await supabase.from("status_uang_makan_global").select("*").eq("id", 1).single();
      if (err || !res) throw err;
      setData(res);
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
    if (res) setArsipData(res);
  };

  const submitRating = async (val: number) => {
    setRating(val);
    await supabase.from("rating_kepuasan").insert([{ periode: data.periode, jenis: "Uang Makan", rating: val }]);
    localStorage.setItem(`rated_uang_makan_${data.periode}`, "true");
    setTimeout(() => setHasRated(true), 600);
  };

  useEffect(() => {
    fetchStatus();
    const channel = supabase.channel("realtime-uang-makan").on("postgres_changes", { event: "UPDATE", schema: "public", table: "status_uang_makan_global" }, (payload) => {
      setData(payload.new); setIsOnline(true);
    }).subscribe((status) => setIsOnline(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [fetchStatus]);

  useEffect(() => {
    if (!data) return;
    if (prevStep !== null && prevStep < 8 && data.current_step === 8) {
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 8000);
    }
    setPrevStep(data.current_step);
  }, [data?.current_step]);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-6">
      <div className="relative flex items-center justify-center"><div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20 scale-[2.5]" /><div className="h-14 w-14 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin shadow-sm" /></div>
      <p className="text-slate-500 text-xs font-bold tracking-widest uppercase animate-pulse">Memuat Data Uang Makan...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-5 p-8 text-center relative overflow-hidden">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10 max-w-md w-full">
        <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"><WifiOff size={36} className="text-rose-500" /></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Oops, Koneksi Terputus</h2>
        <button onClick={fetchStatus} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-rose-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"><RefreshCcw size={18} /> Coba Muat Ulang</button>
      </div>
    </div>
  );

  const safeStep = data ? Math.max(1, Math.min(8, data.current_step ?? 1)) : 1;
  const progressPct = Math.round((safeStep / 8) * 100);
  const currentStepData = STEPS[safeStep - 1];
  const isDisbursed = safeStep === 8 && !data.is_rejected;
  const displayEstimasi = data?.estimasi ? data.estimasi : currentStepData.eta;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans selection:bg-amber-100 selection:text-amber-900 relative overflow-hidden">
      {showConfetti && <Confetti />}

      {showArsipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowArsipModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 animate-fade-slide-up">
            <button onClick={() => setShowArsipModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-500"><History size={24} /></div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Uang Makan</h3>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {arsipData.length === 0 ? (
                <p className="text-center text-slate-500 py-6 font-medium text-sm">Belum ada data arsip sebelumnya.</p>
              ) : (
                arsipData.map((arsip, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-black text-slate-800">{arsip.periode}</p>
                      <p className="text-xs text-slate-500 font-medium">Cair: {new Date(arsip.tanggal_cair).toLocaleDateString("id-ID", { dateStyle: "medium" })}</p>
                    </div>
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-full"><Check size={16} strokeWidth={3}/></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowHelpModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center text-center animate-fade-slide-up">
            <button onClick={() => setShowHelpModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors duration-300"><X size={20} /></button>
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-amber-100/50"><HelpCircle size={36} className="text-amber-500 animate-wiggle" /></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Butuh Bantuan?</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">Hai! Jika Anda memiliki kendala, jangan ragu untuk menghubungi <strong className="text-slate-700">Tim Bendahara</strong>.</p>
            <button onClick={() => window.open('https://wa.me/6281234567890?text=Halo%20Tim%20Keuangan,%20saya%20ingin%20bertanya%20terkait%20Uang%20Makan...', '_blank')} className="w-full py-4 bg-amber-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-amber-600 hover:-translate-y-1 transition-all mb-3">Chat WhatsApp</button>
            <button onClick={() => setShowHelpModal(false)} className="w-full py-3 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-800">Tutup</button>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-amber-100/50 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-orange-100/30 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="fixed top-6 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-5xl z-50 pointer-events-none">
        <nav className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] px-4 py-3 flex items-center justify-between transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-white rounded-[14px] shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0"><Image src="/logo.jpg" alt="Logo" width={40} height={40} className="w-full h-full object-cover" priority /></div>
            <div className="flex flex-col justify-center">
              <span className="text-[17px] font-black tracking-tight text-slate-800 leading-none">SIMantu<span className="text-amber-500">.</span></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sistem Monitoring KN Soppeng</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100"><Calendar size={14} className="text-amber-500" /><span className="text-[12px] font-bold text-slate-600">{data?.periode || "Periode -"}</span></div>
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-500 ${isOnline ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-rose-50 border-rose-100 text-rose-600"}`}>{isOnline ? <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> : <WifiOff size={14} />}<span className="text-[11px] font-bold hidden sm:inline">{isOnline ? "Terhubung" : "Offline"}</span></div>
          </div>
        </nav>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 pt-40 sm:pt-48 pb-20 relative z-20">

        <div className="mb-12 max-w-3xl text-center md:text-left mx-auto md:mx-0 flex flex-col items-center md:items-start animate-fade-slide-up">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
            <div className="flex bg-slate-200/50 p-1.5 rounded-full border border-slate-200/60 shadow-inner backdrop-blur-sm">
              <Link href="/" className="flex items-center gap-2 px-5 sm:px-6 py-2.5 text-slate-500 hover:text-slate-800 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all"><Wallet size={16} /> Tunjangan Kinerja</Link>
              <Link href="/uang-makan" className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-white text-amber-600 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-widest shadow-sm border border-slate-100"><Utensils size={16} /> Uang Makan</Link>
            </div>
            <button onClick={() => { fetchArsip(); setShowArsipModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest shadow-sm border border-slate-200 transition-all">
              <History size={16} /> Riwayat
            </button>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[4.5rem] font-black text-slate-900 tracking-tight leading-[1.1] mb-6">Pencairan Uang Makan, <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Kini Lebih Transparan.</span></h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl text-center md:text-left">Dapatkan pembaruan langsung dari tim pengelola keuangan. Lacak status berkas Anda dengan mudah dan tenang.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-amber-50 to-transparent pointer-events-none rounded-bl-full opacity-60" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full shadow-sm relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-amber-100/0 via-white/60 to-amber-100/0 translate-x-[-100%] animate-shimmer" /><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" /></span><span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-700 relative z-10">Posisi Saat Ini</span></div>
                {!isDisbursed && !data.is_rejected && (<span className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-100 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-sm"><Clock size={14} className="text-slate-400 animate-pulse" /> Estimasi: {displayEstimasi}</span>)}
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left mb-6 sm:mb-0">
                <div key={safeStep} className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/60 rounded-[2rem] flex items-center justify-center text-5xl sm:text-6xl shrink-0 shadow-inner animate-float">{currentStepData.icon}</div>
                <div className="pt-2"><p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center sm:justify-start gap-1.5">Tahap {safeStep} <ChevronRight size={14}/> 8</p><h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-3">{currentStepData.title}</h2><p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md font-medium">{currentStepData.desc}</p></div>
              </div>
              <div className="mt-8 sm:mt-14 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-end mb-3"><span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Penyelesaian</span><span className="text-2xl font-black text-amber-500">{progressPct}%</span></div>
                <div className="h-4 w-full bg-slate-200/60 rounded-full overflow-hidden p-0.5"><div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-[1500ms] ease-out relative" style={{ width: `${progressPct}%` }}><div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div></div></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {data?.catatan && data.catatan !== "-" && data.catatan.trim() !== "" ? (
              <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-8 flex-1 flex flex-col justify-center relative overflow-hidden"><div className="bg-white/60 backdrop-blur-sm w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 mb-4 shadow-sm relative z-10"><BellRing size={20} className="animate-wiggle" /></div><p className="text-xs font-bold uppercase tracking-wider text-orange-700/60 mb-2 relative z-10">Papan Pengumuman</p><p className="font-bold text-orange-900 text-[15px] leading-relaxed relative z-10">{data.catatan}</p></div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex-1 flex flex-col justify-center"><div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-500 mb-4"><CheckCheck size={20} /></div><p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Status Sistem</p><p className="font-bold text-slate-800 text-lg">Semua Normal</p></div>
            )}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex-1 flex flex-col justify-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Terakhir Diperbarui</p><div className="text-3xl font-black text-slate-800 tracking-tight mb-2">{data?.updated_at ? new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</div><p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Calendar size={14} className="text-slate-400" />{data?.updated_at ? new Date(data.updated_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}</p></div>
          </div>
        </div>

        {data?.is_rejected && (
          <div className="mb-16 bg-rose-50 border border-rose-100 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm"><div className="bg-white w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"><X size={24} className="text-rose-500" /></div><div><h3 className="text-xl font-black text-rose-900 tracking-tight mb-2">Pencairan Tertahan (Revisi SPM)</h3><p className="font-medium text-rose-700 text-sm leading-relaxed">Berkas saat ini dikembalikan oleh KPPN. Jangan khawatir, Tim Keuangan sedang melakukan revisi dokumen.</p></div></div>
        )}

        {isDisbursed && (
          <div className="mb-16 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden animate-fade-slide-up">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm"><Sparkles size={28} className="text-amber-500 animate-pulse" /></div>
              <div>
                <h3 className="text-2xl font-black text-amber-900 tracking-tight mb-2">Uang Makan Selesai Diproses! 🎉</h3>
                <p className="font-medium text-amber-700 text-sm leading-relaxed">SP2D telah terbit. Mutasi rekening akan masuk secara berkala mulai hari ini.</p>
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-white shrink-0 w-full md:w-auto text-center">
              {!hasRated ? (
                <>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">Nilai Transparansi Kami</p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} onClick={() => submitRating(star)} 
                        className={`p-2 rounded-full transition-all duration-300 ${rating >= star ? 'text-amber-500 bg-amber-100 scale-110' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}`}
                      >
                        <Star size={28} fill={rating >= star ? "currentColor" : "none"} strokeWidth={2.5}/>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-2 animate-fade-slide-up">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCheck size={20} /></div>
                  <p className="text-sm font-black text-amber-900">Terima Kasih!</p>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Penilaian Anda Tersimpan</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-8 flex items-center justify-between px-2"><h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2"><LayoutDashboard size={18} className="text-amber-500" /> Rincian Alur Proses</h3></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isDone = stepNum < safeStep;
            const isCurrent = stepNum === safeStep;
            const isRejected = data?.is_rejected && stepNum === 7;
            const isFixing = data?.is_rejected && stepNum === 6 && safeStep === 6;
            const isPending = !isDone && !isCurrent;
            const statusClass = isDone && !isRejected ? "bg-white border-slate-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)]" : (isCurrent || isFixing) && !isRejected ? "bg-white border-amber-400 ring-4 ring-amber-50 shadow-[0_15px_40px_-10px_rgba(245,158,11,0.2)] scale-[1.02] z-10" : isRejected ? "bg-rose-50 border-rose-300 ring-4 ring-rose-50" : "bg-slate-50/50 border-slate-200 border-dashed opacity-70"; 

            return (
              <div key={index} className={`relative p-6 rounded-[2rem] border-2 transition-all duration-500 ease-out group ${statusClass}`}>
                {index < STEPS.length - 1 && (index + 1) % 4 !== 0 && (<div className="hidden lg:block absolute top-11 -right-5 w-5 h-[2px] z-0"><div className={`w-full h-full ${isDone ? 'bg-amber-400' : 'bg-slate-200'}`}></div></div>)}
                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-base shadow-sm transition-colors duration-500 ${isDone && !isRejected ? "bg-amber-100 text-amber-600" : ""} ${(isCurrent || isFixing) && !isRejected ? "bg-amber-500 text-white shadow-amber-500/30" : ""} ${isRejected ? "bg-rose-500 text-white" : ""} ${isPending && !isRejected ? "bg-white text-slate-400 border border-slate-200" : ""}`}>{isDone && !isRejected ? <Check size={20} strokeWidth={3} /> : isRejected ? <X size={20} strokeWidth={3} /> : stepNum}</div>
                  <div className="flex flex-col items-end gap-2"><span className={`text-[32px] transition-all duration-500 ease-out filter drop-shadow-sm ${isCurrent && !isRejected ? "scale-110 -rotate-3" : isPending ? "grayscale opacity-50" : ""}`}>{step.icon}</span></div>
                </div>
                <div className="min-h-[50px] mb-4"><h4 className={`font-black text-[15px] leading-tight mb-1.5 tracking-tight ${isCurrent && !isRejected ? "text-slate-900" : isPending && !isRejected ? "text-slate-500" : "text-slate-800"}`}>{step.title}</h4><p className="text-[13px] text-slate-500 font-medium leading-relaxed">{step.desc}</p></div>
                <div className="pt-4 border-t border-slate-100/80 flex items-center justify-between">
                  {isCurrent && !data?.is_rejected ? (<div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1.5 rounded-lg w-full justify-center border border-amber-100"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span></span>Sedang Diproses</div>) : isDone && !data?.is_rejected ? (<div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center"><CheckCheck size={14} className="text-amber-400" /> Selesai</div>) : isFixing ? (<div className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1.5 rounded-lg w-full justify-center border border-rose-100"><X size={12} strokeWidth={3} /> Perbaikan Berkas</div>) : (<div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full justify-center"><Clock size={12} className="opacity-70" /> {step.eta}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200/60 mt-auto py-8 text-center relative z-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sm text-slate-500 font-medium">&copy; TA 2026 <span className="font-bold text-slate-700">Kejaksaan Negeri Soppeng</span>. Hak Cipta Dilindungi.</p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2 flex items-center justify-center gap-1">Built with <HeartPulse size={10} className="text-rose-400" /> by Pranata Komputer 625</p>
        </div>
      </footer>

      <button onClick={() => setShowHelpModal(true)} className="fixed bottom-8 right-8 px-5 py-4 bg-slate-900 text-white rounded-full flex items-center gap-3 shadow-[0_10px_30px_rgb(0,0,0,0.15)] hover:bg-amber-500 hover:-translate-y-1 hover:shadow-amber-500/30 transition-all duration-300 ease-out active:scale-95 z-50 group">
        <HelpCircle size={20} />
        <span className="text-sm font-bold pr-1 hidden sm:inline">Pusat Bantuan</span>
      </button>

      <style>{`
        @keyframes confetti-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fadeSlideUp { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-shimmer { animation: shimmer 2s infinite ease-in-out; }
        .animate-float { animation: float 4s infinite ease-in-out; }
        .animate-wiggle { animation: wiggle 1s infinite ease-in-out; }
        .animate-fade-slide-up { animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}