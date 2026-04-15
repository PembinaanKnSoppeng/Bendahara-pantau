"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, LockKeyhole, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

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
        setError("Email atau password salah. Silakan periksa kembali.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email belum dikonfirmasi. Periksa inbox Anda.");
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">

      {/* Ambient Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <Image
              src="/logo.jpg"
              alt="Logo Pembinaan Kejaksaan Republik Indonesia"
              width={96}
              height={96}
              className="w-24 h-24 object-contain drop-shadow-xl"
              priority
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none mb-2">
            Admin Portal
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            Sistem Monitoring Tunjangan Kinerja
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/80 border border-white/80">

          {/* Error */}
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping mt-1.5 shrink-0" />
                <p className="text-sm font-bold text-rose-600 leading-snug">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 italic group-focus-within:text-indigo-600 transition-colors">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="admin@instansi.go.id"
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 italic group-focus-within:text-indigo-600 transition-colors">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockKeyhole size={18} className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                relative w-full overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 text-white
                py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200
                hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all active:translate-y-0
                disabled:opacity-70 disabled:hover:translate-y-0 mt-2 flex items-center justify-center gap-3
              "
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />

              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Sistem
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 font-medium mt-6">
          Akses terbatas untuk admin yang berwenang.
        </p>
      </div>
    </div>
  );
}