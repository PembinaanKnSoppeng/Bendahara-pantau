"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  LogOut, Save, ChevronRight, ChevronLeft, AlertCircle,
  RefreshCcw, ShieldCheck, Menu, X, Check, AlertTriangle,
  Clock, Eye, Activity
} from "lucide-react";

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

// --- Confirmation Modal ---
type ConfirmModalProps = {
  title: string;
  desc: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({ title, desc, confirmLabel, confirmClass, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-amber-100 p-3 rounded-2xl shrink-0">
            <AlertTriangle size={24} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg mb-1">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-all text-sm uppercase"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl font-black text-white transition-all text-sm uppercase ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- History Entry ---
type HistoryEntry = {
  step: number;
  label: string;
  time: string;
  type: "advance" | "back" | "reject" | "info";
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [periodeInput, setPeriodeInput] = useState("");
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center gap-3">
      <div className="h-6 w-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <span className="font-bold text-slate-500 text-sm uppercase tracking-widest">Memuat Dashboard...</span>
    </div>
  );

  const safeStep = Math.max(1, Math.min(8, data.current_step ?? 1));

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans">
      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          desc={confirm.desc}
          confirmLabel={confirm.confirmLabel}
          confirmClass={confirm.confirmClass}
          onConfirm={doConfirmedAction}
          onCancel={closeConfirm}
        />
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed h-full top-0 left-0 z-40 w-72 bg-slate-900 flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
      `}>
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span className="text-white font-black text-lg uppercase tracking-tight">Admin Panel</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="xl:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-2 mb-8">
            <div className="bg-indigo-500/10 text-indigo-400 p-3.5 rounded-2xl flex items-center gap-3 border border-indigo-500/20">
              <Activity size={16} />
              <span className="font-bold text-sm uppercase tracking-wide">Kontrol Status</span>
            </div>
            <div className="text-slate-500 p-3.5 rounded-2xl flex items-center gap-3 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-default">
              <Eye size={16} />
              <a href="/" target="_blank" rel="noreferrer" className="font-bold text-sm uppercase tracking-wide w-full">
                Lihat Halaman Publik ↗
              </a>
            </div>
          </nav>

          {/* Current Status Preview */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Preview Status</p>
            <div className="space-y-2">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                    i + 1 < safeStep ? "bg-emerald-500" :
                    i + 1 === safeStep ? "bg-indigo-500 ring-2 ring-indigo-300/30" :
                    "bg-slate-700"
                  }`}>
                    {i + 1 < safeStep ? <Check size={10} className="text-white" /> :
                     i + 1 === safeStep ? <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping" /> :
                     <span className="text-[8px] text-slate-500 font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-xs font-medium truncate ${
                    i + 1 === safeStep ? "text-white font-bold" :
                    i + 1 < safeStep ? "text-slate-400" :
                    "text-slate-600"
                  }`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-6 border-t border-slate-800">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/admin/login");
            }}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all p-3.5 rounded-2xl font-bold text-sm uppercase"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="xl:ml-72 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="xl:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase italic leading-none">Dashboard Kendali</h1>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">Monitoring Tukin — {data?.periode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saving && (
                <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold animate-pulse">
                  <RefreshCcw size={12} className="animate-spin" /> Menyimpan...
                </div>
              )}
              <div className="px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">

          {/* Step Controller */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Kontrol Progres</p>
                <h2 className="text-2xl font-black text-slate-900">
                  Tahap {safeStep}: <span className="text-indigo-600">{STEPS[safeStep - 1]?.title}</span>
                </h2>
              </div>
              <span className="text-7xl font-black text-slate-100 select-none">
                0{safeStep}
              </span>
            </div>

            {/* Progress bar */}
            <div className="px-8 mb-6">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${(safeStep / 8) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5 uppercase">
                <span>Mulai</span>
                <span>{Math.round((safeStep / 8) * 100)}% Selesai</span>
                <span>Selesai</span>
              </div>
            </div>

            {/* Controls */}
            <div className="mx-8 mb-8 bg-slate-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-center gap-4 border border-slate-100">
              <button
                onClick={() => askConfirm({
                  title: "Mundur ke Tahap Sebelumnya?",
                  desc: `Proses akan dikembalikan ke Tahap ${safeStep - 1}: ${STEPS[safeStep - 2]?.title ?? "—"}.`,
                  confirmLabel: "Ya, Mundur",
                  confirmClass: "bg-slate-700 hover:bg-slate-900",
                  action: async () => {
                    await handleUpdate({ current_step: Math.max(1, safeStep - 1), is_rejected: false });
                    addHistory({ step: safeStep - 1, label: `Mundur ke Tahap ${safeStep - 1}`, type: "back" });
                  },
                })}
                disabled={safeStep === 1 || saving}
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black uppercase text-sm border-2 border-slate-200 hover:border-slate-400 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} /> Mundur
              </button>

              <div className="px-8 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Step Aktif</span>
                <span className="text-xl font-black text-slate-900 uppercase">{safeStep} / 8</span>
              </div>

              <button
                onClick={() => askConfirm({
                  title: "Lanjut ke Tahap Berikutnya?",
                  desc: `Proses akan maju ke Tahap ${safeStep + 1}: ${STEPS[safeStep]?.title ?? "Selesai"}.`,
                  confirmLabel: "Ya, Lanjut",
                  confirmClass: "bg-indigo-600 hover:bg-indigo-700",
                  action: async () => {
                    await handleUpdate({ current_step: Math.min(8, safeStep + 1), is_rejected: false });
                    addHistory({ step: safeStep + 1, label: `Maju ke Tahap ${safeStep + 1}: ${STEPS[safeStep]?.title}`, type: "advance" });
                  },
                })}
                disabled={safeStep === 8 || saving}
                className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                Lanjut <ChevronRight size={18} />
              </button>
            </div>

            {/* Reject Option (only at step 7) */}
            {safeStep === 7 && (
              <div className="mx-8 mb-8 p-5 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-rose-800">KPPN Menolak SPM?</p>
                    <p className="text-xs text-rose-500 font-medium">Klik tombol ini jika pengajuan ditolak dan perlu direvisi.</p>
                  </div>
                </div>
                <button
                  onClick={() => askConfirm({
                    title: "Konfirmasi Penolakan SPM",
                    desc: "Proses akan dikembalikan ke Tahap 6 (Pengajuan SPM) dengan status ditolak.",
                    confirmLabel: "Tolak & Revisi",
                    confirmClass: "bg-rose-600 hover:bg-rose-700",
                    action: async () => {
                      await handleUpdate({ current_step: 6, is_rejected: true });
                      addHistory({ step: 6, label: "KPPN Tolak SPM — Kembali ke Revisi", type: "reject" });
                    },
                  })}
                  className="shrink-0 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
                >
                  Tolak & Revisi (→ Step 6)
                </button>
              </div>
            )}
          </div>

          {/* Information Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-8">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Data Informasi</p>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-2 block italic">
                  Periode Bulan
                </label>
                <input
                  type="text"
                  value={periodeInput}
                  onChange={(e) => setPeriodeInput(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                  placeholder="Contoh: Juni 2025"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-2 block italic">
                  Catatan Tambahan <span className="normal-case font-normal">(opsional)</span>
                </label>
                <textarea
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                  placeholder="Contoh: Dana sedang diproses di bank, perkiraan masuk 1-2 hari kerja..."
                />
              </div>

              <button
                onClick={async () => {
                  await handleUpdate({ periode: periodeInput, catatan: catatanInput });
                  addHistory({ step: safeStep, label: "Update info periode & catatan", type: "info" });
                }}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm hover:bg-black transition-all disabled:opacity-50 shadow-lg"
              >
                <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>

          {/* Activity Log */}
          {history.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-8">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Log Aktivitas Sesi Ini</p>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      h.type === "advance" ? "bg-emerald-500" :
                      h.type === "back" ? "bg-amber-500" :
                      h.type === "reject" ? "bg-rose-500" :
                      "bg-indigo-500"
                    }`} />
                    <span className="font-medium text-slate-700 flex-1">{h.label}</span>
                    <span className="text-slate-400 text-xs font-medium shrink-0 flex items-center gap-1">
                      <Clock size={10} /> {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}