import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, ShieldCheck, KeyRound, Receipt, Copy, 
  Check, Lock, Edit3, Trash2, PenTool,
  Clock, LogOut, CheckCircle2, Eye, Download, Info
} from "lucide-react";
import { formatCurrency, formatDate, generateContractPDF } from "../utils";
import { Contract, BillingItem } from "../types";

interface ClientDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function ClientDashboard({ user, onLogout }: ClientDashboardProps) {
  // Password Reset Lifecycle States
  const [hasChangedPassword, setHasChangedPassword] = useState(user.hasChangedPassword);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Business States
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Signature pad states
  const [signingMode, setSigningMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [submittingSign, setSubmittingSign] = useState(false);

  // Canvas drawing references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (hasChangedPassword) {
      fetchClientData();
    }
  }, [hasChangedPassword]);

  // Establish canvas settings on view toggle
  useEffect(() => {
    if (selectedContract && selectedContract.status === "pending" && signingMode === "draw") {
      setTimeout(() => {
        initCanvas();
      }, 150);
    }
  }, [selectedContract, signingMode]);

  const fetchClientData = async () => {
    try {
      const [resContracts, resBillings] = await Promise.all([
        fetch(`/api/contracts?clientEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/billing?clientEmail=${encodeURIComponent(user.email)}`)
      ]);

      if (resContracts.ok) {
        const cData = await resContracts.json();
        setContracts(cData);
        if (cData.length > 0 && !selectedContract) {
          setSelectedContract(cData[0]);
        }
      }
      if (resBillings.ok) {
        setBillings(await resBillings.json());
      }
    } catch (err) {
      console.error("Erro ao coletar dados do cliente", err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve possuir ao menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação de senha não coincide.");
      return;
    }

    setPasswordError("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newPassword })
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setTimeout(() => {
          setHasChangedPassword(true);
        }, 1500);
      } else {
        const err = await res.json();
        setPasswordError(err.error || "Erro técnico ao redefinir a senha.");
      }
    } catch (e) {
      setPasswordError("Erro de comunicação com o servidor.");
    }
  };

  // Canvas context setup
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 500;
    canvas.height = 180;
    
    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineCap = "round";
    context.strokeStyle = "#1e293b"; // Charcoal/Navy ink color
    context.lineWidth = 3;
    contextRef.current = context;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    contextRef.current?.lineTo(coords.x, coords.y);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    initCanvas();
  };

  const getTypedSignatureImage = (): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0052FF"; // Corporate blue handwriting color
    ctx.font = "italic bold 32px cursive, 'Brush Script MT', system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName || user.name, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#64748b";
    ctx.font = "9px monospace";
    ctx.fillText(`AUTENTICADO VIA PORTAL RJR SIGN - IP REGISTRADO`, canvas.width / 2, canvas.height - 18);

    return canvas.toDataURL("image/png");
  };

  const handlePostSignature = async () => {
    if (!selectedContract) return;
    setSubmittingSign(true);

    let base64Image = "";

    if (signingMode === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        base64Image = canvas.toDataURL("image/png");
      }
    } else {
      if (!typedName) {
        alert("Favor preencher seu nome completo de firma ou assinatura.");
        setSubmittingSign(false);
        return;
      }
      base64Image = getTypedSignatureImage();
    }

    try {
      const res = await fetch(`/api/contracts/${selectedContract.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerEmail: user.email,
          signatureDrawing: base64Image,
          signatureName: signingMode === "draw" ? user.name : typedName,
          signatureType: signingMode
        })
      });

      if (res.ok) {
        alert("Termo de contrato assinado eletronicamente com validade civil de manifestação de interesse acordado!");
        fetchClientData();
        // Refresh selected contract state from backend list
        const resList = await fetch(`/api/contracts?clientEmail=${encodeURIComponent(user.email)}`);
        if (resList.ok) {
          const list = await resList.json();
          setContracts(list);
          const updated = list.find((c: any) => c.id === selectedContract.id);
          if (updated) setSelectedContract(updated);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Houve um erro técnico ao registrar assinatura.");
      }
    } catch (e) {
      alert("Erro de conexão de backend.");
    } finally {
      setSubmittingSign(false);
    }
  };

  const copyPixKey = (billId: string) => {
    const key = `rjr-sync-pix-sandbox-key-${billId}@devrogeriojunior.com.br`;
    navigator.clipboard.writeText(key);
    setCopiedInvoiceId(billId);
    setTimeout(() => {
      setCopiedInvoiceId(null);
    }, 2500);
  };

  // Enforce Password reset first for new client accounts
  if (!hasChangedPassword) {
    return (
      <div className="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold">Segurança e Redefinição Inicial</h2>
            <p className="text-xs text-slate-400 leading-normal">
              Esta é uma chave de credencial provisória. Por favor, redefina sua senha de acesso antes de visualizar seus contratos e faturas mensais.
            </p>
          </div>

          {passwordSuccess ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center text-xs space-y-2 border border-green-200">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-500" />
              <p className="font-bold">Senha Salva com Sucesso!</p>
              <p>Redirecionando de forma criptografada para o seu painel acadêmico...</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                  {passwordError}
                </div>
              )}
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nova Senha Escolhida</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo de 6 algarismos"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Confirmar Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Repita a mesma senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0052FF] hover:bg-[#0040D0] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Confirmar Redefinição de Senha
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 text-center">
            <button onClick={onLogout} className="text-xxs text-slate-500 hover:text-white underline">
              Sair e voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active status checks
  const isCurrentlySignedByUser = selectedContract?.signers.find(
    s => s.email.toLowerCase() === user.email.toLowerCase()
  )?.status === "signed";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* HEADER structure exactly matched */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between py-3.5">
          
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="RJR Sign Logo" className="w-10 h-10 object-contain animate-fade-in" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-lg text-slate-900 leading-none">RJR SIGN</span>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                  PORTAL DO ASSINANTE
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-none mt-1">Gestão de Documentos Digitais</span>
            </div>
          </div>

          {/* Right Area */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <strong className="text-xs text-slate-900 block truncate max-w-[150px]">{user.name}</strong>
              <span className="text-[10px] text-slate-400 font-mono italic block">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1 px-3 bg-slate-100 hover:bg-slate-200 hover:text-red-650 text-slate-600 font-bold transition-all rounded-lg text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5 hover:text-red-650" />
              Sair
            </button>
          </div>

        </div>
      </header>

      {/* CORE GRID */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* LEFT COLUMN: License Details & Invoices index */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* License Credentials Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-extrabold block">Assinatura Corporativa</span>
              <h3 className="font-bold text-slate-900 text-sm truncate">{user.name}</h3>
            </div>
            
            <div className="text-xxs space-y-3 pt-2 text-slate-600">
              <div>
                <span className="text-slate-400 block mb-0.5">E-mail Cadastrado:</span>
                <strong className="text-slate-800 font-mono font-bold block">{user.email}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Assinante Representado:</span>
                <strong className="text-slate-800 font-bold block">
                  {user.representatives?.[0]?.name || user.name}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-2 rounded-xl border border-green-150">
                <ShieldCheck className="w-4.5 h-4.5 text-green-600" />
                <span className="font-bold">Licença Habilitada & Ativa</span>
              </div>
            </div>
          </div>

          {/* Billings Demonstrativo */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-500" />
                Minhas Cobranças
              </h4>
              <span className="font-mono text-slate-400 text-xxs font-bold">RJR Finance</span>
            </div>

            <div className="space-y-3">
              {billings.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xxs font-medium">
                  Nenhuma mensalidade registrada para esta licença.
                </div>
              ) : (
                billings.map(b => (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-xl border text-xxs flex flex-col gap-2.5 transition-all ${
                      b.status === "paid" 
                        ? "bg-green-50/50 border-green-200 text-slate-700" 
                        : "bg-amber-50/50 border-amber-200 text-slate-705"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-slate-900 font-bold block leading-snug">{b.description}</strong>
                        <span className="text-slate-400 font-mono text-[9px] block mt-1">
                          Vencimento: {formatDate(b.dueDate)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${
                        b.status === "paid" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                      }`}>
                        {b.status === "paid" ? "Liquidado" : "Aberto"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 font-mono">
                      <strong className="text-sm font-black text-slate-900">
                        {formatCurrency(b.amount)}
                      </strong>

                      {b.status === "pending" && (
                        <button
                          onClick={() => copyPixKey(b.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedInvoiceId === b.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Pix Copia e Cola
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Documents Selection index */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Seus Contratos Vinculados
            </h4>

            <div className="space-y-2">
              {contracts.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xxs">Nenhum termo encontrado.</div>
              ) : (
                contracts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContract(c)}
                    className={`w-full p-3 rounded-xl border text-left text-xxs transition-all block ${
                      selectedContract?.id === c.id 
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <strong className="block font-bold leading-snug truncate">{c.title}</strong>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>Validade Digital</span>
                      <span className={`font-bold uppercase ${c.status === "signed" ? "text-emerald-400 font-semibold" : "text-amber-500 font-bold animate-pulse"}`}>
                        {c.status === "signed" ? "✓ Assinado" : "● Assinatura Pendente"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Active Contract term render and interactive signers block */}
        <div className="lg:col-span-8 space-y-6">
          {selectedContract ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              
              {/* Active document title head bar */}
              <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[9px] font-bold">
                      {selectedContract.category}
                    </span>
                  </div>
                  <h3 className="font-sans font-black text-white text-sm">{selectedContract.title}</h3>
                </div>

                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                  selectedContract.status === "signed" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/25" 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                }`}>
                  {selectedContract.status === "signed" ? "VÍNCULO ASSINADO" : "PENDENTE DE ASSINATURA"}
                </span>
              </div>

              {/* Document markdown parsing layout */}
              <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-200 max-h-[380px] overflow-y-auto">
                <div className="prose prose-sm font-sans text-xs text-slate-700 leading-relaxed space-y-4 max-w-none">
                  {selectedContract.content.split("\n\n").map((para, idx) => {
                    if (para.startsWith("# ")) {
                      return (
                        <h1 key={idx} className="text-base font-black text-slate-950 border-b border-slate-200 pb-2 mt-4">
                          {para.replace("# ", "")}
                        </h1>
                      );
                    } else if (para.startsWith("## ")) {
                      return <h2 key={idx} className="text-sm font-bold text-slate-950 mt-3">{para.replace("## ", "")}</h2>;
                    } else if (para.startsWith("### ")) {
                      return <h3 key={idx} className="text-xs font-bold text-slate-900 mt-2">{para.replace("### ", "")}</h3>;
                    } else if (para.startsWith("* ")) {
                      return (
                        <ul key={idx} className="list-disc pl-5 my-1 text-slate-700 space-y-1">
                          {para.split("\n").map((li, liIdx) => (
                            <li key={liIdx}>{li.replace("* ", "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx} className="my-2">{para}</p>;
                  })}
                </div>
              </div>

              {/* Legal Multi-Signatories Audit block */}
              <div className="p-5 bg-white border-b border-slate-200">
                <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold block mb-3">CONFORMIDADE DE ASSINATURAS DO INSTRUMENTO</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedContract.signers?.map((signer, sIdx) => (
                    <div key={sIdx} className="p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between bg-slate-50 text-xxs">
                      <div className="flex items-start justify-between w-full">
                        <div className="space-y-1">
                          <strong className="text-slate-800 font-bold block">{signer.name}</strong>
                          <span className="text-slate-400 font-mono block">{signer.email}</span>
                          {signer.status === "signed" ? (
                            <div className="text-[9px] text-green-600 space-y-0.5 mt-1">
                              <p>Assinatura eletrônica gravada em {formatDate(signer.signedAt)}</p>
                            </div>
                          ) : (
                            <span className="text-amber-500 font-medium block mt-1">Aguardando assinatura</span>
                          )}
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                          signer.status === "signed"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : "bg-slate-100 text-slate-400 border-slate-200 animate-pulse"
                        }`}>
                          {signer.status === "signed" ? "✓ Assinado" : "Pendente"}
                        </span>
                      </div>
                      {signer.status === "signed" && signer.signatureDrawing && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 flex flex-col items-start w-full">
                          <span className="text-[9px] text-slate-400 font-mono block mb-1">REPRESENTAÇÃO DIGITAL DA FIRMA:</span>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-200 max-w-xs w-full flex items-center justify-center">
                            <img src={signer.signatureDrawing} alt={`Firma de ${signer.name}`} className="max-h-[50px] object-contain" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* INTEGRATED SIGNING TOOL BAR */}
              <div className="p-6 bg-slate-50 text-xxs">
                {isCurrentlySignedByUser ? (
                  <div className="p-6 bg-green-50 rounded-2xl border border-green-200 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-900 leading-none">Você já assinou digitalmente este contrato!</h4>
                    <p className="text-slate-500 text-xxs max-w-md mx-auto leading-normal">
                      Sua assinatura foi devidamente ratificada por par de chaves provisórias criptográficas SHA-512. O faturamento está ativo e os arquivos bloqueados.
                    </p>
                    <div className="flex justify-center pt-1">
                      <button
                        onClick={async () => {
                          try {
                            await fetch(`/api/contracts/${selectedContract.id}/download`, { method: "POST" });
                            generateContractPDF(selectedContract);
                          } catch (e) {
                            generateContractPDF(selectedContract);
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xxs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                      >
                        <Download className="w-4 h-4" />
                        Baixar Cópia Digitalizada de Segurança
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-950 text-xs">Assinatura Eletrônica Autenticada</h4>
                        <p className="text-slate-400 leading-none text-xxs">Manifeste interesse civil legal criando sua firma abaixo:</p>
                      </div>

                      {/* Tool selection trigger tabs */}
                      <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                        <button
                          onClick={() => setSigningMode("draw")}
                          className={`px-3 py-1 rounded font-bold text-xxs transition-all ${
                            signingMode === "draw" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Desenhar Caneta
                        </button>
                        <button
                          onClick={() => setSigningMode("type")}
                          className={`px-3 py-1 rounded font-bold text-xxs transition-all ${
                            signingMode === "type" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Digitar Firma
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Signature Area */}
                      <div className="md:col-span-8 flex flex-col">
                        {signingMode === "draw" ? (
                          <div className="bg-white rounded-xl border border-slate-200 p-2 overflow-hidden flex flex-col items-center">
                            <span className="text-[9px] text-slate-400 self-start mb-1 font-mono uppercase">Lousa Digital de Escrita</span>
                            <canvas
                              ref={canvasRef}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="border border-dashed border-slate-200 rounded-lg w-full h-[150px] bg-white cursor-crosshair touch-none"
                            />
                            <div className="w-full flex justify-between mt-2 pt-1">
                              <span className="text-slate-400 text-[10px]">Desenhe deslizando o dedo ou cursor na tela</span>
                              <button
                                onClick={clearCanvas}
                                className="px-2.5 py-1 text-[10px] text-red-500 border border-red-200 font-bold hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                Limpar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nome Civil para Assinatura do Contrato</label>
                              <input
                                type="text"
                                placeholder={user.name}
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            
                            <div className="p-4 bg-slate-100 border border-dashed border-slate-200 rounded-xl text-center flex flex-col justify-center select-none h-[80px]">
                              <span className="text-slate-400 text-[9px] block mb-1">Previsualização da Firma Digital</span>
                              <span className="font-extrabold text-[#0052FF] italic text-xl font-serif tracking-wide truncate">
                                {typedName || user.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm signature panel */}
                      <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Declaração Jurídica:</span>
                          <p className="text-slate-500 leading-normal font-medium">
                            Manifesto pleno consentimento sob as cláusulas do instrumento de forma digital de boa fé, com rastreio de IP operacional.
                          </p>
                        </div>

                        <button
                          onClick={handlePostSignature}
                          disabled={submittingSign}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-sans font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-100" />
                          Confirmar Assinatura
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 max-w-sm mx-auto shadow-sm">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">Selecione um documento</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Clique em qualquer termo instrumental ou contrato listado ao lado esquerdo para ler, auditar as assinaturas e firmar acordo eletrônico.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Pure and literal structural footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong>RJR Sign Portal</strong> • Todos os direitos reservados © 2026.
          </div>
          <div>
            Desenvolvido por{" "}
            <a 
              href="https://devrogeriojunior.com.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-500 hover:text-slate-900 font-bold hover:underline transition-colors"
            >
              Rogério Júnior
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
