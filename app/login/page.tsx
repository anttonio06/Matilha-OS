"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dog, Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router   = useRouter();
  const [email,  setEmail]  = useState("andrea@matilha.com.br");
  const [pass,   setPass]   = useState("•••••••••");
  const [showPw, setShowPw] = useState(false);
  const [loading,setLoading]= useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-forest-900 flex items-center justify-center p-6">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-forest-800 rounded-full opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-forest-700 rounded-full opacity-30" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-forest-600 rounded-full opacity-10" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-forest-400 flex items-center justify-center mb-4 shadow-lg">
            <Dog className="w-7 h-7 text-forest-900" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white tracking-tight">MATILHA OS</p>
            <p className="text-sm text-forest-400 mt-1">Sistema operacional canino</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Entrar na plataforma</h2>
            <p className="text-sm text-forest-400 mt-1">Acesso restrito à equipe autorizada</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-forest-300 mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-forest-500 text-sm pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-forest-400/40 focus:border-forest-400/50 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-forest-300 mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full h-10 rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-forest-500 text-sm pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-forest-400/40 focus:border-forest-400/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-500 hover:text-forest-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 accent-forest-400" />
                <span className="text-xs text-forest-400">Lembrar acesso</span>
              </label>
              <button type="button" className="text-xs text-forest-400 hover:text-white transition-colors">
                Esqueci a senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-forest-400 text-forest-900 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-forest-300 transition-colors disabled:opacity-70 mt-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Entrar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* Role profiles hint */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            { role: "Admin",    initials: "AC" },
            { role: "Recepção", initials: "MR" },
            { role: "Treinador",initials: "RA" },
          ].map(({ role, initials }) => (
            <button key={role} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-forest-600/40 flex items-center justify-center">
                <span className="text-2xs font-bold text-forest-300">{initials}</span>
              </div>
              <span className="text-2xs text-forest-400">{role}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-2xs text-forest-600 mt-3">Entrar como demonstração</p>

        {/* Footer */}
        <p className="text-center text-2xs text-forest-700 mt-8">
          Matilha OS v1.0 · © 2024 Matilha Equilibrada
        </p>
      </div>
    </div>
  );
}
