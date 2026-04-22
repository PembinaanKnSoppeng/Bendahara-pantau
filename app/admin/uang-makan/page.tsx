"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut, Save, ChevronRight, ChevronLeft, AlertCircle,
  RefreshCcw, ShieldCheck, Menu, X, Check, AlertTriangle,
  Clock, Eye, RotateCcw, PenTool, Wallet, Utensils, Star
} from "lucide-react";
import Image from "next/image";

const STEPS = [
  { id: 1, title: "Rekapitulasi Absensi", icon: "📋" },
  { id: 2, title: "Pengesahan Rekap", icon: "✍️" },
  { id: 3, title: "Hitung Uang Makan", icon: "🍱" },
  { id: 4, title: "Input Gaji Web", icon: "⌨️" },
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      <div className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] animate-fade-slide-up">
        <div className="flex items-start gap-5 mb-8">
          <div className="bg-amber-50 p-4 rounded-3xl shrink-0 border border-amber-100">
            <AlertTriangle size={28} className="text-amber-500 animate-wiggle" />
          </div>
          <div className="pt-1">
            <h3 className="font-black text-slate-900 text-xl mb-2 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all text-xs uppercase tracking-widest">
            Batal
          </button>
          <button onClick={onConfirm} className={`flex-1 py-4 rounded-2xl font-black text-white transition-all text-xs uppercase tracking-widest shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type HistoryEntry = { step: number; label: string; time: string; type: "advance" | "back" | "reject" | "info" | "reset" };

export default function AdminUangMakanDashboard() {
  const [data, setData] = useState<any>(null);
  const [periodeInput, setPeriodeInput] = useState("");
  const [estimasiInput, setEstimasiInput] = useState("");
  const [catatanInput, setCatatanInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [confirm, setConfirm] = useState<null | {
    title: string; desc: string; confirmLabel: string; confirmClass: string; action: () => Promise<void>;
  }>(null);

  // STATE RATING
  const [ratings, setRatings] = useState<any[]>([]);
  const avgRating = ratings.length > 0 ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1) : "0.0";

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
    const { data: res } = await supabase.from("status_uang_makan_global").select("*").eq("id", 1).single();
    if (res) {
      setData(res);
      setPeriodeInput(res.periode ?? "");
      setEstimasiInput(res.estimasi ?? "");
      setCatatanInput(res.catatan ?? "");
    }

    const { data: ratingData } = await supabase.from("rating_kepuasan").select("*").eq("jenis", "Uang Makan").order("created_at", { ascending: false });
    if (ratingData) setRatings(ratingData);

    setLoading(false);
  }, []);

  const handleUpdate = async (updates: any) => {
    setSaving(true);
    await supabase.from("status_uang_makan_global").update({ ...updates, updated_at: new Date() }).eq("id", 1);
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

  // FUNGSI CETAK PDF (UANG MAKAN)
  const printPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Laporan Kepuasan SIMantu - Uang Makan</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 10px; margin-bottom: 30px; }
            .instansi { font-size: 18pt; font-weight: 900; letter-spacing: 1px; }
            .sub-instansi { font-size: 12pt; font-weight: 600; color: #64748b; }
            .doc-title { text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; text-decoration: underline; }
            .stat-box { background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 30px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            .avg { font-size: 36pt; font-weight: 900; color: #f59e0b; margin: 0; line-height: 1;}
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f59e0b; color: white; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .footer { margin-top: 50px; text-align: right; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="instansi">KEJAKSAAN NEGERI SOPPENG</div>
            <div class="sub-instansi">SISTEM MONITORING TUNJANGAN (SIMantu)</div>
          </div>
          <div class="doc-title">LAPORAN INDEKS KEPUASAN PEGAWAI</div>
          <div class="stat-box">
            <div>
              <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Rata-rata Rating (Uang Makan)</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Total ${ratings.length} Responden</div>
            </div>
            <div class="avg">${avgRating}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>NO</th>
                <th>PERIODE</th>
                <th>RATING</th>
                <th>TANGGAL INPUT</th>
              </tr>
            </thead>
            <tbody>
              ${ratings.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.periode}</td>
                  <td>${r.rating} Bintang</td>
                  <td>${new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            <br><br><br>
            <p><b>Admin Keuangan</b></p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (loading || !data) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20 scale-[2.5]" />
        <div className="h-14 w-14 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin shadow-sm" />
      </div>
      <span className="font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">Menyiapkan Workspace...</span>
    </div>
  );

  const safeStep = Math.max(1, Math.min(8, data.current_step ?? 1));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-amber-100 selection:text-amber-900 pb-12">
      {confirm && <ConfirmModal {...confirm} onConfirm={doConfirmedAction} onCancel={closeConfirm} />}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 xl:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed h-full top-0 left-0 z-50 w-[20rem] bg-white border-r border-slate-100 flex flex-col transition-transform duration-500 ease-out shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}`}>
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-11 bg-white rounded-2xl p-0.5 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <div>
                <span className="text-slate-900 font-black text-xl uppercase tracking-tighter block leading-none">SIMantu<span className="text-amber-500">.</span></span>
                <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1 block">Admin Uang Makan</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="xl:hidden text-slate-400 hover:text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-100"><X size={20} /></button>
          </div>

          <nav className="space-y-3 mb-10">
            <Link href="/admin" className="text-slate-500 p-4 rounded-2xl flex items-center gap-3 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all font-bold text-sm group">
              <Wallet size={18} className="group-hover:text-indigo-500 transition-colors"/>
              Tunjangan Kinerja
            </Link>
            
            <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl flex items-center gap-3 border border-amber-100 shadow-sm">
              <Utensils size={18} />
              <span className="font-bold text-sm tracking-wide">Uang Makan</span>
            </div>

            <div className="border-t border-slate-100 my-4" />

            <a href="/" target="_blank" rel="noreferrer" className="text-slate-500 p-4 rounded-2xl flex items-center gap-3 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all font-bold text-sm group">
              <Eye size={18} className="group-hover:text-emerald-500 transition-colors"/>
              Lihat Layar Publik ↗
            </a>
          </nav>

          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Preview
            </p>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3.5 relative">
                  {i < STEPS.length - 1 && <div className={`absolute top-6 left-[11px] w-0.5 h-4 -z-10 ${i + 1 < safeStep ? "bg-emerald-200" : "bg-slate-200"}`} />}
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${i + 1 < safeStep ? "bg-emerald-100 text-emerald-600" : i + 1 === safeStep ? "bg-amber-500 text-white shadow-md shadow-amber-200 scale-110" : "bg-white border border-slate-200 text-slate-400"}`}>
                    {i + 1 < safeStep ? <Check size={12} strokeWidth={3} /> : i + 1 === safeStep ? <div className="h-2 w-2 bg-white rounded-full animate-ping" /> : <span className="text-[9px] font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-xs font-bold truncate ${i + 1 === safeStep ? "text-amber-900" : i + 1 < safeStep ? "text-slate-600" : "text-slate-400"}`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); }} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all p-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm">
            <LogOut size={16} /> Keluar Sistem
          </button>
        </div>
      </aside>

      <main className="xl:ml-[20rem] min-h-screen pb-12">
        <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="xl:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"><Menu size={20} /></button>
              <div><h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><ShieldCheck className="text-amber-500" size={24}/> Command Center UM</h1></div>
            </div>
            <div className="flex items-center gap-3">
              {saving && <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm animate-pulse hidden sm:flex"><RefreshCcw size={12} className="animate-spin" /> Menyinkronkan...</div>}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative animate-fade-slide-up">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-50 to-transparent pointer-events-none rounded-bl-full opacity-60" />
            <div className="px-6 sm:px-10 pt-10 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm">
                  <PenTool size={12} /> Modul Uang Makan
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Tahap {safeStep}: <span className="text-amber-600 block sm:inline mt-1 sm:mt-0">{STEPS[safeStep - 1]?.title}</span>
                </h2>
              </div>
              <div className="bg-slate-50 w-24 h-24 rounded-3xl border border-slate-100 shadow-inner flex items-center justify-center shrink-0">
                <span className="text-5xl font-black text-slate-300 font-mono tracking-tighter">0{safeStep}</span>
              </div>
            </div>

            <div className="px-6 sm:px-10 mb-10 relative z-10">
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${(safeStep / 8) * 100}%` }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="mx-4 sm:mx-10 mb-10 bg-slate-50 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-100 relative z-10">
              <button onClick={() => askConfirm({ title: "Mundur ke Tahap Sebelumnya?", desc: `Proses akan dikembalikan ke Tahap ${safeStep - 1}: ${STEPS[safeStep - 2]?.title ?? "—"}.`, confirmLabel: "Ya, Mundur", confirmClass: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30", action: async () => { await handleUpdate({ current_step: Math.max(1, safeStep - 1), is_rejected: false }); addHistory({ step: safeStep - 1, label: `Mundur ke Tahap ${safeStep - 1}`, type: "back" }); } })} disabled={safeStep === 1 || saving} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                <ChevronLeft size={18} /> Mundur
              </button>
              <div className="text-center px-4 hidden sm:block">
                <span className="h-2 w-2 bg-amber-300 rounded-full inline-block animate-ping mb-2" />
                <span className="block text-slate-400 font-black uppercase tracking-widest text-[10px]">Aksi Utama</span>
              </div>
              <button onClick={() => askConfirm({ title: "Lanjut ke Tahap Berikutnya?", desc: `Proses akan maju ke Tahap ${safeStep + 1}: ${STEPS[safeStep]?.title ?? "Selesai"}. Pastikan berkas tahap ini sudah selesai.`, confirmLabel: "Ya, Lanjut", confirmClass: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30", action: async () => { await handleUpdate({ current_step: Math.min(8, safeStep + 1), is_rejected: false }); addHistory({ step: safeStep + 1, label: `Maju ke Tahap ${safeStep + 1}`, type: "advance" }); } })} disabled={safeStep === 8 || saving} className="w-full sm:w-auto px-10 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)] hover:bg-amber-600 hover:-translate-y-1 hover:shadow-[0_12px_25px_-6px_rgba(245,158,11,0.6)] transition-all duration-300 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2">
                Lanjut Tahap <ChevronRight size={18} />
              </button>
            </div>

            {safeStep === 7 && (
              <div className="mx-4 sm:mx-10 mb-10 p-6 bg-rose-50 rounded-[2rem] border-2 border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-slide-up">
                <div className="flex items-center gap-5">
                  <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-rose-100 shrink-0"><AlertCircle size={28} className="text-rose-500 animate-wiggle" /></div>
                  <div>
                    <p className="text-lg font-black text-rose-900 tracking-tight mb-1">KPPN Menolak Berkas?</p>
                    <p className="text-xs text-rose-600 font-medium leading-relaxed max-w-md">Kembalikan ke tahap perbaikan (Step 6) untuk memberi tahu pegawai bahwa SPM sedang direvisi.</p>
                  </div>
                </div>
                <button onClick={() => askConfirm({ title: "Konfirmasi Penolakan KPPN", desc: "Tampilan pegawai akan berubah menjadi merah (Ditolak) dan status mundur ke Tahap 6.", confirmLabel: "Tolak & Revisi", confirmClass: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30", action: async () => { await handleUpdate({ current_step: 6, is_rejected: true }); addHistory({ step: 6, label: "KPPN Tolak SPM — Kembali Revisi", type: "reject" }); } })} className="w-full md:w-auto shrink-0 px-8 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 hover:-translate-y-1 transition-all active:translate-y-0">
                  Tolak & Revisi (→ Step 6)
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 sm:p-10 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><Save size={20} className="text-slate-600" /></div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Manajemen Informasi Uang Makan</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Periode UM</label>
                    <input type="text" value={periodeInput} onChange={(e) => setPeriodeInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all font-bold text-slate-800 placeholder:text-slate-400 shadow-sm" placeholder="Contoh: April 2026" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Estimasi Waktu (ETA)</label>
                    <input type="text" value={estimasiInput} onChange={(e) => setEstimasiInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all font-bold text-slate-800 placeholder:text-slate-400 shadow-sm" placeholder="Contoh: 1-2 Hari Kerja" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Papan Pengumuman (Opsional)</label>
                  <textarea value={catatanInput} onChange={(e) => setCatatanInput(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 resize-none shadow-sm" placeholder="Ketik pengumuman penting di sini..." />
                </div>
                <button onClick={async () => { await handleUpdate({ periode: periodeInput, estimasi: estimasiInput, catatan: catatanInput }); addHistory({ step: safeStep, label: "Memperbarui info teks & estimasi", type: "info" }); }} disabled={saving} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 hover:-translate-y-0.5 shadow-xl shadow-slate-900/10 transition-all active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />} 
                  {saving ? "Menyimpan..." : "Simpan Informasi"}
                </button>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8 animate-fade-slide-up" style={{ animationDelay: "200ms" }}>
              
              {/* KOTAK RATING & KEPUASAN (UANG MAKAN) */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] p-8 shadow-lg text-white mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none" />
                <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10"><Star size={16} className="text-amber-100" /> Indeks Kepuasan</h3>
                <div className="flex items-end gap-4 mb-6 relative z-10">
                  <div className="text-6xl font-black tracking-tighter">{avgRating}</div>
                  <div className="pb-2">
                    <div className="flex text-amber-100 mb-1">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= Math.round(Number(avgRating)) ? "currentColor" : "none"} strokeWidth={s <= Math.round(Number(avgRating)) ? 0 : 2} />)}
                    </div>
                    <p className="text-xs font-medium text-orange-100">Dari {ratings.length} responden</p>
                  </div>
                </div>
                <button onClick={printPDF} disabled={ratings.length === 0} className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 relative z-10 border border-white/20">
                  Cetak Laporan PDF
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] border-2 border-rose-100 p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                <h3 className="font-black text-rose-600 text-sm uppercase tracking-widest mb-2 relative z-10">Danger Zone</h3>
                <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed relative z-10">Gunakan fitur ini hanya saat memulai proses Uang Makan untuk bulan yang baru.</p>
                <button onClick={() => askConfirm({ title: "Mulai Bulan Baru (Reset)?", desc: "Jika berada di Tahap 8, periode akan diarsipkan. Lalu progres direset ke Tahap 1.", confirmLabel: "Ya, Reset Total", confirmClass: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30", action: async () => { 
                    if (safeStep === 8) { await supabase.from("arsip_pencairan").insert([{ periode: data.periode, jenis: "Uang Makan" }]); }
                    await handleUpdate({ current_step: 1, is_rejected: false, catatan: "-", estimasi: "Tahap Awal" }); addHistory({ step: 1, label: "RESET TOTAL - Bulan Baru Dimulai", type: "reset" }); } })} 
                  className="w-full py-3.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:shadow-lg hover:shadow-rose-500/20 flex items-center justify-center gap-2 relative z-10"
                >
                  <RotateCcw size={16} /> Arsipkan & Reset
                </button>
              </div>

              {history.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6 flex items-center gap-2"><Clock size={16} className="text-slate-400" /> Log Sesi Ini</h3>
                  <div className="space-y-5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((h, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i < history.length - 1 && <div className="absolute top-4 left-1.5 w-px h-full bg-slate-100 -z-10" />}
                        <div className={`mt-1 h-3 w-3 rounded-full shrink-0 shadow-sm ring-4 ring-white ${h.type === "advance" ? "bg-emerald-500" : h.type === "back" ? "bg-orange-500" : h.type === "reject" ? "bg-rose-500" : h.type === "reset" ? "bg-rose-900" : "bg-amber-500"}`} />
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{h.label}</p>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{h.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeSlideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
        .animate-fade-slide-up { animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-wiggle { animation: wiggle 1s infinite ease-in-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}