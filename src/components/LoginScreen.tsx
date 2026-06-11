import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, User, Mail, Lock, LogIn, ChevronRight, CornerDownLeft, Info, HelpCircle } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onBackToHome?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [repName, setRepName] = useState("");
  const [repRole, setRepRole] = useState("Diretor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, digite as credenciais.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      
      const payload: any = { email, password };
      if (isSignUp) {
        payload.name = name || email.split("@")[0];
        payload.isAdmin = isAdminRole || email === "devrogeriojunior@gmail.com";
        payload.representatives = [
          {
            name: name || "Representante",
            email: email,
            role: isAdminRole ? "Administrador Técnico" : "Cliente"
          }
        ];
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user);
      } else {
        let errorMessage = "Erro ao realizar operação de segurança. Verifique seus dados.";
        try {
          const text = await res.text();
          try {
            const errData = JSON.parse(text);
            errorMessage = errData.error || (errData.details ? `${errData.error}: ${errData.details}` : errorMessage);
          } catch (e) {
            // It's not JSON (could be a HTML error page or cloudflare event)
            errorMessage = `Erro ${res.status}: Servidor retornou uma resposta inesperada.`;
          }
        } catch (readErr) {
          errorMessage = `Erro ${res.status} no servidor.`;
        }
        setError(errorMessage);
      }
    } catch (err: any) {
      setError(`Servidor indisponível ou erro inesperado de rede: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b0f19] text-white min-h-screen flex items-center justify-center p-4 relative font-sans overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/5 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 w-full max-w-md bg-[#131b2e] rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8">
        
        {/* Top bar */}
        <div className="flex items-center justify-end mb-8">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono font-bold bg-blue-400/10 px-2.5 py-1 rounded-full border border-blue-400/20">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
            RJR Secure SSL
          </div>
        </div>

        {/* Title branding text */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center mb-3">
            <img src="/logo.svg" alt="RJR Sign Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white leading-none">RJR Sign</h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Portal de Gestão de Contratos e Assinatura Digital Segura
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/25 rounded-xl text-xxs text-rose-300 leading-normal"
          >
            <strong>Erro de Autenticação:</strong> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <AnimatePresence mode="wait">
            {isSignUp ? (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Nome do Cliente ou Empresa"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#090d16] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nível de Acesso (Perfil)</label>
                  <select
                    value={isAdminRole ? "admin" : "client"}
                    onChange={(e) => setIsAdminRole(e.target.value === "admin")}
                    className="w-full px-3 py-2.5 bg-[#090d16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="client">Cliente</option>
                    <option value="admin">Administrador Técnico</option>
                  </select>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Exemplo: cliente@empresa.com.br ou seu-email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#090d16] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Senha Operacional</label>
              {!isSignUp && (
                <span className="text-[10px] text-slate-500">Padrão Inicial: 123456</span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#090d16] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <span>Carregando Chave de Acesso...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 shrink-0" />
                {isSignUp ? "Criar Novo Usuário & Criptografar" : "Assinar Segurança e Entrar"}
                <ChevronRight className="w-4 h-4 shrink-0 font-bold" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between register sign up and login mode */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xxs text-slate-400">
            {isSignUp ? "Já possui credenciais RJR Sign?" : "Deseja cadastrar um novo cliente?"}
            <button
              onClick={() => {
                setError("");
                setIsSignUp(!isSignUp);
              }}
              className="ml-1 text-blue-400 hover:text-blue-300 font-bold underline transition-colors"
            >
              {isSignUp ? "Voltar para Login de Cliente" : "Criar Novo Usuário"}
            </button>
          </p>
        </div>

        {/* Quick Demo Credentials Help */}
        <div className="mt-5 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/60 text-[10px] text-slate-400 leading-normal space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Info className="w-3.5 h-3.5 text-[#0088FE]" />
            <span>Guia de Acesso Técnico:</span>
          </div>
          <p>
            • <strong>Usuário Administrador:</strong> devrogeriojunior@gmail.com / Senha: <strong>Manu2612</strong>
          </p>
          <p>
            • Novo cliente cadastrado poderá acessar com a senha provisória definida no momento de seu cadastro.
          </p>
        </div>

      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-500">
        Desenvolvido por{" "}
        <a 
          href="https://devrogeriojunior.com.br" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-slate-400 hover:text-white font-medium hover:underline transition-all"
        >
          Rogério Júnior
        </a>
      </div>
    </div>
  );
}
