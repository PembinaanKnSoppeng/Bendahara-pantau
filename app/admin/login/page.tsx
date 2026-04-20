"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, LockKeyhole, ArrowRight, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login")) {
        setError("Kredensial salah. Pastikan Email & Password benar.");
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Decorative Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header with Prettified Logo */}
        <div className="text-center mb-10">
           <div className="relative mx-auto w-20 h-20 bg-white rounded-full p-1.5 shadow-2xl shadow-indigo-200 ring-4 ring-white mb-6 flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.jpg"
              alt="Logo Instansi"
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
            Admin Workspace
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Control Panel SIMantu
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white">
          
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                <p className="text-sm font-bold text-rose-700 leading-snug">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 group-focus-within:text-indigo-600 transition-colors">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="admin@kn-soppeng.go.id"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 group-focus-within:text-indigo-600 transition-colors">
                Password Akses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockKeyhole size={20} className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/20 transition-all active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 group mt-4"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin text-indigo-400" /> Memverifikasi...</>
              ) : (
                <>Otorisasi Masuk <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white/50 px-5 py-2.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm">
            <ArrowLeft size={16} /> Kembali ke Halaman Publik
          </Link>
        </div>

      </div>
    </div>
  );
}