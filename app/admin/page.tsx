"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  LogOut, Save, ChevronRight, ChevronLeft, AlertCircle,
  RefreshCcw, ShieldCheck, Menu, X, Check, AlertTriangle,
  Clock, Eye, Activity, RotateCcw
} from "lucide-react";
import Image from "next/image";

const STEPS = [
  { id: 1, title: "Rekapitulasi Absensi", icon: "📋" },
  { id: 2, title: "Pengesahan Rekap", icon: "✍️" },
  { id: 3, title: "Hitung Tukin", icon: "🧮" },
  { id: 4, title: "Gaji Web KPPN", icon: "💻" },
  { id: 5, title: "SAKTI KPPN", icon: "🔐" },
  { id: 6, title: "Pengajuan SPM", icon: "📄" },
  { id: 7, title: "Verifikasi KPPN", icon: "🏛️" },
  { id: 8, title: "SP2D Terbit", icon: "💰" },
];

type ConfirmModalProps = {
  title: string; desc: string; confirmLabel: string; confirmClass: string; 
  onConfirm: () => void; onCancel: () => void;
};

function ConfirmModal({ title, desc, confirmLabel, confirmClass, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-5 mb-8">
          <div className="bg-amber-100 p-4 rounded-2xl shrink-0">
            <AlertTriangle size={28} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-xl mb-2 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">
            Batal
          </button>
          <button onClick={onConfirm} className={`flex-1 py-4 rounded-2xl font-black text-white transition-all text-xs uppercase tracking-widest shadow-xl ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type HistoryEntry = { step: number; label: string; time: string; type: "advance" | "back" | "reject" | "info" | "reset" };

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [periodeInput, setPeriodeInput] = useState("");
  const [estimasiInput, setEstimasiInput] = useState(""); // <-- State baru untuk Estimasi
  const [catatanInput, setCatatanInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [confirm, setConfirm] = useState<null | {
    title: string; desc: string; confirmLabel: string; confirmClass: string; action: () => Promise<void>;
  }>(null);
  const router = useRouter();

  const addHistory = (entry: Omit<HistoryEntry, "time">) => {
    setHistory((prev) => [{ ...entry, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/admin/login");
      else fetchStatus();
    };
    checkUser();
  }, [router]);

  const fetchStatus = useCallback(async () => {
    const { data: res } = await supabase.from("status_tukin_global").select("*").eq("id", 1).single();
    if (res) {
      setData(res);
      setPeriodeInput(res.periode ?? "");
      setEstimasiInput(res.estimasi ?? ""); // <-- Ambil data Estimasi dari DB
      setCatatanInput(res.catatan ?? "");
    }
    setLoading(false);
  }, []);

  const handleUpdate = async (updates: any) => {
    setSaving(true);
    await supabase.from("status_tukin_global").update({ ...updates, updated_at: new Date() }).eq("id", 1);
    await fetchStatus();
    setSaving(false);
  };

  const askConfirm = (config: typeof confirm) => setConfirm(config);
  const closeConfirm = () => setConfirm(null);

  const doConfirmedAction = async () => {
    if (!confirm) return;
    closeConfirm();
    await confirm.action();
  };

  if (loading || !data) return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <span className="font-black text-slate-400 text-xs uppercase tracking-widest animate-pulse">Menyiapkan Workspace...</span>
    </div>
  );

  const safeStep = Math.max(1, Math.min(8, data.current_step ?? 1));

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-indigo-100">
      {confirm && <ConfirmModal {...confirm} onConfirm={doConfirmedAction} onCancel={closeConfirm} />}

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 xl:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed h-full top-0 left-0 z-40 w-[20rem] bg-slate-950 flex flex-col transition-transform duration-300 shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}`}>
        <div className="p-8 flex-1 overflow-y-auto">
          {/* Logo Brand */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <span className="text-white font-black text-xl uppercase tracking-tighter block leading-none">Admin Area</span>
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">SIMantu Dashboard</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="xl:hidden text-slate-500 hover:text-white bg-slate-800 p-2 rounded-xl"><X size={20} /></button>
          </div>

          <nav className="space-y-2 mb-10">
            <div className="bg-indigo-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/20">
              <Activity size={18} />
              <span className="font-black text-sm uppercase tracking-wider">Kontrol Status</span>
            </div>
            <a href="/" target="_blank" rel="noreferrer" className="text-slate-400 p-4 rounded-2xl flex items-center gap-3 hover:text-white hover:bg-slate-800/50 transition-all font-bold text-sm uppercase tracking-wider group">
              <Eye size={18} className="group-hover:text-emerald-400 transition-colors"/>
              Lihat Publik Page ↗
            </a>
          </nav>

          {/* Current Status Preview Mini */}
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-inner">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Preview Live Status</p>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    i + 1 < safeStep ? "bg-emerald-500/20 text-emerald-400" :
                    i + 1 === safeStep ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/50" :
                    "bg-slate-800 text-slate-600"
                  }`}>
                    {i + 1 < safeStep ? <Check size={12} /> : i + 1 === safeStep ? <div className="h-2 w-2 bg-white rounded-full animate-ping" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-xs font-bold truncate ${i + 1 === safeStep ? "text-white" : i + 1 < safeStep ? "text-slate-400" : "text-slate-600"}`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800/50 bg-slate-900/50">
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); }} className="w-full flex items-center justify-center gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all p-4 rounded-2xl font-black text-xs uppercase tracking-widest">
            <LogOut size={16} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="xl:ml-[20rem] min-h-screen pb-12">
        <div className="sticky top-0 z-20 bg-[#F1F5F9]/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="xl:hidden p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"><Menu size={20} /></button>
              <div><h1 className="text-xl font-black text-slate-900 uppercase italic leading-none tracking-tight">Main Controller</h1></div>
            </div>
            <div className="flex items-center gap-3">
              {saving && <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-indigo-100 hidden sm:flex"><RefreshCcw size={12} className="animate-spin" /> Sync...</div>}
              <div className="px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200 flex items-center gap-2 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistem Aktif</span></div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
            <div className="px-10 pt-10 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-6">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border border-slate-200 px-3 py-1 rounded-full w-fit">Modul Kontrol Progres</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tahap {safeStep}: <span className="text-indigo-600 block sm:inline">{STEPS[safeStep - 1]?.title}</span></h2>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner"><span className="text-5xl font-black text-slate-300 font-mono tracking-tighter">0{safeStep}</span></div>
            </div>
            <div className="px-10 mb-10 relative z-10">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700 relative" style={{ width: `${(safeStep / 8) * 100}%` }}><div className="absolute inset-0 bg-white/20 animate-pulse" /></div>
              </div>
            </div>
            <div className="mx-10 mb-10 bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-slate-900/20 relative z-10">
              <button onClick={() => askConfirm({ title: "Mundur ke Tahap Sebelumnya?", desc: `Proses akan dikembalikan ke Tahap ${safeStep - 1}: ${STEPS[safeStep - 2]?.title ?? "—"}.`, confirmLabel: "Ya, Mundur", confirmClass: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20", action: async () => { await handleUpdate({ current_step: Math.max(1, safeStep - 1), is_rejected: false }); addHistory({ step: safeStep - 1, label: `Mundur ke Tahap ${safeStep - 1}`, type: "back" }); } })} disabled={safeStep === 1 || saving} className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-30 border border-slate-700 flex items-center justify-center gap-2"><ChevronLeft size={18} /> Mundur</button>
              <div className="text-center px-4"><span className="h-3 w-3 bg-indigo-500 rounded-full inline-block animate-ping mb-2" /><span className="block text-white font-black uppercase tracking-widest text-sm">Aksi Update</span></div>
              <button onClick={() => askConfirm({ title: "Lanjut ke Tahap Berikutnya?", desc: `Proses akan maju ke Tahap ${safeStep + 1}: ${STEPS[safeStep]?.title ?? "Selesai"}. Pastikan berkas tahap ini sudah selesai.`, confirmLabel: "Ya, Lanjut", confirmClass: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20", action: async () => { await handleUpdate({ current_step: Math.min(8, safeStep + 1), is_rejected: false }); addHistory({ step: safeStep + 1, label: `Maju ke Tahap ${safeStep + 1}`, type: "advance" }); } })} disabled={safeStep === 8 || saving} className="w-full sm:w-auto px-10 py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-400 hover:shadow-indigo-400/40 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">Lanjut Tahap <ChevronRight size={18} /></button>
            </div>
            {safeStep === 7 && (
              <div className="mx-10 mb-10 p-6 bg-rose-50 rounded-[2rem] border-2 border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4"><div className="bg-white p-3 rounded-2xl shadow-sm"><AlertCircle size={24} className="text-rose-500" /></div><div><p className="text-lg font-black text-rose-800 tracking-tight">KPPN Menolak Berkas?</p><p className="text-xs text-rose-600 font-bold">Kembalikan ke tahap perbaikan (Step 6) untuk memberi tahu pegawai.</p></div></div>
                <button onClick={() => askConfirm({ title: "Konfirmasi Penolakan KPPN", desc: "Tampilan pegawai akan berubah menjadi merah (Ditolak) dan status mundur ke Tahap 6.", confirmLabel: "Tolak & Revisi", confirmClass: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20", action: async () => { await handleUpdate({ current_step: 6, is_rejected: true }); addHistory({ step: 6, label: "KPPN Tolak SPM — Kembali Revisi", type: "reject" }); } })} className="w-full md:w-auto shrink-0 px-8 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 hover:-translate-y-1 transition-all active:translate-y-0">Tolak & Revisi (→ Step 6)</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-8"><div className="bg-slate-100 p-2.5 rounded-xl"><Save size={20} className="text-slate-600" /></div><h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Data Informasi</h3></div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Periode Tukin</label>
                    <input type="text" value={periodeInput} onChange={(e) => setPeriodeInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-400" placeholder="Contoh: April 2026" />
                  </div>
                  {/* FEATURE BARU: ESTIMASI WAKTU */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Estimasi Waktu (ETA)</label>
                    <input type="text" value={estimasiInput} onChange={(e) => setEstimasiInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-slate-900 placeholder:text-slate-400" placeholder="Contoh: 1-2 Hari Kerja" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Papan Pengumuman (Opsional)</label>
                  <textarea value={catatanInput} onChange={(e) => setCatatanInput(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none" placeholder="Ketik pengumuman penting di sini..." />
                </div>
                <button onClick={async () => { await handleUpdate({ periode: periodeInput, estimasi: estimasiInput, catatan: catatanInput }); addHistory({ step: safeStep, label: "Memperbarui info teks, periode & estimasi", type: "info" }); }} disabled={saving} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-slate-900/20">{saving ? "Menyimpan Data..." : "Simpan Informasi"}</button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-rose-50 rounded-[2.5rem] border border-rose-200 p-8 shadow-inner">
                <h3 className="font-black text-rose-800 text-sm uppercase tracking-widest mb-2">Danger Zone</h3>
                <p className="text-xs font-bold text-rose-600/80 mb-6 leading-relaxed">Reset progres ke awal. Gunakan saat memulai proses Tukin untuk bulan baru.</p>
                <button onClick={() => askConfirm({ title: "Mulai Bulan Baru (Reset)?", desc: "Semua progres akan dihapus dan kembali ke Tahap 1. Tampilan pegawai akan keriset total.", confirmLabel: "Ya, Reset Total", confirmClass: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20", action: async () => { await handleUpdate({ current_step: 1, is_rejected: false, catatan: "-", estimasi: "Tahap Awal" }); addHistory({ step: 1, label: "RESET TOTAL - Bulan Baru Dimulai", type: "reset" }); } })} className="w-full py-3.5 bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-600 hover:border-rose-600 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"><RotateCcw size={16} /> Reset Progres</button>
              </div>

              {history.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-8">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6">Log Sesi Ini</h3>
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                    {history.map((h, i) => (
                      <div key={i} className="flex gap-3"><div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 shadow-sm ${h.type === "advance" ? "bg-emerald-500" : h.type === "back" ? "bg-amber-500" : h.type === "reject" ? "bg-rose-500" : h.type === "reset" ? "bg-rose-900" : "bg-indigo-500"}`} /><div><p className="font-bold text-slate-700 text-sm leading-tight mb-1">{h.label}</p><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {h.time}</p></div></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 