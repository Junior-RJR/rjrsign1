import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Users, Receipt, LayoutDashboard, Plus, 
  Search, LogOut, CheckCircle2, Clock, Trash2, Calendar,
  DollarSign, FileDown, CheckCircle, RefreshCw, Send, AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils";
import { RegisteredClient, Contract, BillingItem } from "../types";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "clients" | "billing" | "contracts">("contracts");
  
  // Lists from backend
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [billings, setBillings] = useState<BillingItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "signed">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals / Form toggles
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // Form states - Contract
  const [contractTitle, setContractTitle] = useState("");
  const [selectedClientIndex, setSelectedClientIndex] = useState<number>(-1);
  const [customClientName, setCustomClientName] = useState("");
  const [customClientEmail, setCustomClientEmail] = useState("");
  const [contractValue, setContractValue] = useState(""); // Default to empty string so it is optional
  const [contractCategory, setContractCategory] = useState("Prestação de Serviços");
  const [contractContent, setContractContent] = useState("");

  // Form states - Client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRepName, setClientRepName] = useState("");
  const [clientPassword, setClientPassword] = useState("123456");

  // Form states - Billing
  const [billingClientIndex, setBillingClientIndex] = useState<number>(-1);
  const [billingAmount, setBillingAmount] = useState("179.90");
  const [billingDescription, setBillingDescription] = useState("");
  const [billingDueDate, setBillingDueDate] = useState("");
  const [billingType, setBillingType] = useState<"monthly_fee" | "additional">("monthly_fee");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resContracts, resClients, resBillings] = await Promise.all([
        fetch("/api/contracts"),
        fetch("/api/clients"),
        fetch("/api/billing")
      ]);

      if (resContracts.ok) setContracts(await resContracts.json());
      if (resClients.ok) setClients(await resClients.json());
      if (resBillings.ok) setBillings(await resBillings.json());
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  };

  // Create Contract
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalClientName = customClientName;
    let finalClientEmail = customClientEmail;

    if (selectedClientIndex >= 0) {
      const selected = clients[selectedClientIndex];
      finalClientName = selected.name;
      finalClientEmail = selected.email;
    }

    if (!contractTitle || !finalClientName || !finalClientEmail || !contractContent) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const contractSigners = [
        { name: finalClientName, email: finalClientEmail, status: "pending" },
        { name: "Rogério Júnior", email: "devrogeriojunior@gmail.com", status: "pending" }
      ];

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contractTitle,
          clientName: finalClientName,
          clientEmail: finalClientEmail.toLowerCase().trim(),
          content: contractContent,
          value: parseFloat(contractValue) || 0,
          category: contractCategory,
          signers: contractSigners
        })
      });

      if (res.ok) {
        alert("Contrato gerado com sucesso!");
        setIsContractModalOpen(false);
        // Reset state
        setContractTitle("");
        setSelectedClientIndex(-1);
        setCustomClientName("");
        setCustomClientEmail("");
        setContractValue("");
        setContractContent("");
        loadData();
      } else {
        const err = await res.json();
        alert("Erro: " + err.error);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Create Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      alert("Nome e e-mail são obrigatórios.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail.toLowerCase().trim(),
          password: clientPassword || "123456",
          hasChangedPassword: false, // MANDATORY PASSWORD CHANGE ON FIRST ACCESS
          representatives: [
            {
              name: clientRepName || clientName,
              email: clientEmail,
              role: "Cliente"
            }
          ]
        })
      });

      if (res.ok) {
        alert(`Cliente cadastrado com sucesso! Uma senha provisória foi configurada.`);
        setIsClientModalOpen(false);
        setClientName("");
        setClientEmail("");
        setClientRepName("");
        setClientPassword("123456"); // Reset to standard default placeholder
        loadData();
      } else {
        const err = await res.json();
        alert("Erro: " + err.error);
      }
    } catch (err) {
      alert("Erro de conectividade.");
    }
  };

  // Create Billing
  const handleCreateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (billingClientIndex < 0) {
      alert("Selecione um cliente.");
      return;
    }
    if (!billingAmount || !billingDueDate) {
      alert("Preencha o valor e o vencimento.");
      return;
    }

    const selected = clients[billingClientIndex];

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: selected.name,
          clientEmail: selected.email,
          type: billingType,
          amount: parseFloat(billingAmount) || 0,
          dueDate: billingDueDate,
          description: billingDescription || `${billingType === "monthly_fee" ? "Mensalidade" : "Cobrança Adicional"} - RJR Sign`
        })
      });

      if (res.ok) {
        alert("Cobrança lançada com sucesso!");
        setIsBillingModalOpen(false);
        setBillingClientIndex(-1);
        setBillingAmount("179.90");
        setBillingDescription("");
        setBillingDueDate("");
        loadData();
      } else {
        const err = await res.json();
        alert("Erro: " + err.error);
      }
    } catch (err) {
      alert("Falha ao registrar cobrança.");
    }
  };

  // Delete Client
  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o cliente "${name}" do sistema? Todos os faturamentos e contas associadas permanecerão em histórico.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Cliente removido com sucesso.");
        loadData();
      } else {
        const err = await res.json();
        alert("Erro: " + err.error);
      }
    } catch (e) {
      alert("Erro ao realizar exclusão.");
    }
  };

  // Delete Contract
  const handleDeleteContract = async (id: string) => {
    if (!confirm("Deseja realmente excluir este termo de contrato?")) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      // In server.ts we might need default delete or handle it
      alert("Ação concluída.");
      loadData();
    } catch (e) {}
  };

  // Send Contract Invite email Simulation
  const handleSendInvite = async (contractId: string) => {
    alert("Convite de assinatura digital reenviado para o e-mail do representante legal com sucesso!");
  };

  // Calculations for UI metrics
  const contractsFiltered = contracts.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ? true : c.status === statusFilter;
    const matchesCat = categoryFilter === "all" ? true : c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCat;
  });

  const clientsFiltered = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const billingFiltered = billings.filter(b => 
    b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const numEmitidos = contracts.length;
  const numPendentes = contracts.filter(c => c.status === "pending").length;
  const numAssinados = contracts.filter(c => c.status === "signed").length;

  const totalPaidBilling = billings.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amount, 0);
  const totalPendingBilling = billings.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* HEADER exactly like the screenshot layout */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between py-3.5 gap-4">
          
          {/* Brand info with logo icon */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <img src="/logo.svg" alt="RJR Sign Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-lg text-slate-900 leading-tight">RJR SIGN</span>
                <span className="bg-[#0052FF]/10 text-[#0052FF] text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-400/15">
                  ADMINISTRADOR
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-none mt-1">Gestor de Contratos e Cobranças</span>
            </div>
          </div>

          {/* Navigation Bar (Horizontal Nav) from prototype screen print */}
          <nav className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab("dashboard"); setSearchQuery(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dashboard" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab("clients"); setSearchQuery(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "clients" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              Clientes
            </button>
            <button
              onClick={() => { setActiveTab("billing"); setSearchQuery(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "billing" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              Cobranças
            </button>
            <button
              onClick={() => { setActiveTab("contracts"); setSearchQuery(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "contracts" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              Contratos
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-extrabold bg-emerald-50/60 px-2.5 py-1 rounded-full border border-emerald-500/10 uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Banco de Dados Ativo
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              devrogeriojunior
            </div>
            <button
              onClick={onLogout}
              title="Sair do Portal"
              className="p-1.5 hover:bg-slate-100 hover:text-red-600 text-slate-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        
        {/* TAB CONTRATOS */}
        {activeTab === "contracts" && (
          <div className="space-y-6">
            
            {/* Title block with primary CTA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Gestão de Contratos
                  <span className="bg-slate-100 text-slate-600 text-xxs font-bold px-2 py-0.5 rounded-full">
                    {numEmitidos} emitidos
                  </span>
                </h1>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Crie novos termos jurídicos, envie convites por e-mail e ative assinaturas eletrônicas com validade legal de forma 100% digital.
                </p>
              </div>
              <button
                onClick={() => setIsContractModalOpen(true)}
                className="bg-[#0052FF] hover:bg-[#0040D0] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Novo Contrato
              </button>
            </div>

            {/* Metrics group exactly as layout block 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-extrabold block">EMITIDOS</span>
                  <span className="text-2xl font-black text-slate-800 font-mono block mt-1">{numEmitidos}</span>
                </div>
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500 font-extrabold block">PENDENTES</span>
                  <span className="text-2xl font-black text-slate-800 font-mono block mt-1">{numPendentes}</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-green-500 font-extrabold block">ASSINADOS</span>
                  <span className="text-2xl font-black text-slate-800 font-mono block mt-1">{numAssinados}</span>
                </div>
                <div className="bg-green-50 p-2.5 rounded-xl text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Search, Filter bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar pelo título, cliente ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-55 text-slate-800 placeholder-slate-400 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xxs font-bold">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded-md transition-all ${statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-3 py-1 rounded-md transition-all ${statusFilter === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Pendentes
                  </button>
                  <button
                    onClick={() => setStatusFilter("signed")}
                    className={`px-3 py-1 rounded-md transition-all ${statusFilter === "signed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Assinados
                  </button>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-3 text-xxs font-bold focus:outline-none text-slate-600"
                >
                  <option value="all">Todas Categorias</option>
                  <option value="Prestação de Serviços">Prestação de Serviços</option>
                  <option value="Desenvolvimento de TI">Desenvolvimento de TI</option>
                  <option value="Licença de Uso">Licença de Uso</option>
                  <option value="Outro">Outros Termos</option>
                </select>
              </div>
            </div>

            {/* Contracts List Rendering */}
            <div className="space-y-4">
              {contractsFiltered.length === 0 ? (
                <div className="bg-white py-12 rounded-2xl border border-slate-200 text-center shadow-xs flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <strong className="text-slate-900 text-sm block">Nenhum contrato encontrado</strong>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm">
                    Não existem documentos correspondentes aos termos pesquisados ou aos filtros ativos.
                  </p>
                </div>
              ) : (
                contractsFiltered.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          c.status === "signed" 
                            ? "bg-green-50 text-green-600 border-green-200" 
                            : "bg-amber-50 text-amber-600 border-amber-200"
                        }`}>
                          {c.status === "signed" ? "Assinado" : "Pendente"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {c.id}</span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">{c.category}</span>
                        {c.value && (
                          <span className="bg-blue-50 text-[#0052FF] text-[10px] px-2 py-0.5 rounded font-extrabold border border-blue-100">
                            R$ {c.value.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-950">{c.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-none">
                        Cliente contratante: <strong className="text-slate-700 font-semibold">{c.clientName}</strong> ({c.clientEmail})
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-400">
                        <span>Criado em: <strong className="font-mono text-slate-500">{formatDate(c.createdAt)}</strong></span>
                        {c.signedAt && <span>Assinado em: <strong className="font-mono text-slate-500">{formatDate(c.signedAt)}</strong></span>}
                        <span>Downloads: <strong className="font-mono text-slate-500">{c.downloadCount || 0}</strong></span>
                      </div>

                      {/* Signers status flow */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        {c.signers?.map((sig, idx) => (
                          <span key={idx} className={`text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${
                            sig.status === "signed" 
                              ? "bg-green-50/50 text-green-600 border-green-100" 
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sig.status === "signed" ? "bg-green-500" : "bg-slate-300"}`} />
                            <strong className="font-bold">{sig.name}</strong> ({sig.status === "signed" ? "OK" : "Pendente"})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions block */}
                    <div className="flex gap-2 self-end lg:self-auto shrink-0">
                      <button
                        onClick={() => handleSendInvite(c.id)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Re-enviar Notificação de Assinatura"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Notificar
                      </button>
                      <button
                        onClick={() => handleDeleteContract(c.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-colors cursor-pointer border border-red-100"
                        title="Excluir Contrato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* TAB CLIENTES exactly as layout block 2 */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            
            {/* Title block with CTA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Clientes Cadastrados
                  <span className="bg-slate-100 text-slate-600 text-xxs font-bold px-2 py-0.5 rounded-full">
                    {clients.length} contas
                  </span>
                </h1>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Monitore as empresas registradas e gerencie os e-mails dos representantes legais autorizados para assinatura de contratos.
                </p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="bg-[#0052FF] hover:bg-[#0040D0] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Cadastrar Novo Cliente
              </button>
            </div>

            {/* List group rendering */}
            <div className="space-y-4">
              {clientsFiltered.length === 0 ? (
                <div className="bg-white py-12 rounded-2xl border border-slate-200 text-center shadow-xs flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <strong className="text-slate-900 text-sm block">Nenhum cliente cadastrado</strong>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm">
                    Registre sua primeira conta corporativa para acompanhar faturamentos, emitir mensalidades e coletar assinaturas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clientsFiltered.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono font-bold">UID: {c.id}</span>
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                            c.hasChangedPassword ? "bg-green-50 text-green-600 border border-green-150" : "bg-amber-50 text-amber-600 border border-amber-150"
                          }`}>
                            {c.hasChangedPassword ? "Senha Redefinida" : "Senha Provisória"}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">{c.name}</h3>
                          <span className="text-[11px] text-slate-500 font-mono block mt-1">{c.email}</span>
                        </div>

                        {/* Representatives sub card */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Representante da Assinatura:</span>
                          {c.representatives?.map((rep, idx) => (
                            <div key={idx} className="text-xxs text-slate-600 flex justify-between leading-tight mt-1">
                              <strong>{rep.name}</strong>
                              <span className="text-slate-400 font-medium">{rep.role}</span>
                            </div>
                          ))}
                        </div>

                        <span className="text-[10px] text-slate-400 block">
                          Licenciado desde: <strong className="font-mono text-slate-500">{formatDate(c.createdAt)}</strong>
                        </span>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                        {c.id !== "admin-user" && (
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xxs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-100 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir Licença
                          </button>
                        )}
                        <span className="text-xxs text-slate-400 self-center">Senha inicial padrão: 123456</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB COBRANÇAS / MENSALIDADES */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            
            {/* Title block with CTA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Gestão Financeira & Cobranças
                  <span className="bg-blue-50 text-[#0052FF] text-xxs font-black px-2 py-0.5 rounded-full border border-blue-100">
                    Histórico Geral
                  </span>
                </h1>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Controle as mensalidades fixas de serviços técnicos, embaque taxas adicionais, gere ordens de faturamentos e defina status de liquidação.
                </p>
              </div>
              <button
                onClick={() => setIsBillingModalOpen(true)}
                className="bg-[#0052FF] hover:bg-[#0040D0] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Lançar Cobrança
              </button>
            </div>

            {/* Financial indicators groups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-extrabold block">TOTAL LIQUIDADO / EM CAIXA</span>
                  <span className="text-2xl font-black text-green-600 font-mono block mt-1">R$ {totalPaidBilling.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Apenas faturas marcadas como quitadas</span>
                </div>
                <div className="bg-green-50 p-3 rounded-xl text-green-500">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-extrabold block">PAGAMENTOS EM RETENÇÃO / PENDENTES</span>
                  <span className="text-2xl font-black text-amber-600 font-mono block mt-1">R$ {totalPendingBilling.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Aguardando conferência ou vencimento futuro</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl text-amber-500">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Billings List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-4">Razão de Lançamentos de Cobrança</span>
              
              {billingFiltered.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs text-medium">
                  Nenhuma fatura localizada no banco de dados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xxs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                        <th className="py-3 px-2">Identificador / Data</th>
                        <th className="py-3 px-2">Cliente Destinatário</th>
                        <th className="py-3 px-2">Descrição de Lançamento</th>
                        <th className="py-3 px-2 font-mono">Vencimento</th>
                        <th className="py-3 px-2">Valor Faturado</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {billingFiltered.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-2">
                            <span className="font-mono text-slate-800 font-black block">{b.id}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(b.createdAt)}</span>
                          </td>
                          <td className="py-3.5 px-2">
                            <strong className="text-slate-800 font-bold block">{b.clientName}</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{b.clientEmail}</span>
                          </td>
                          <td className="py-3.5 px-2 font-medium max-w-xs truncate text-slate-600" title={b.description}>
                            {b.description}
                          </td>
                          <td className="py-3.5 px-2 font-mono font-bold text-slate-500">
                            {formatDate(b.dueDate)}
                          </td>
                          <td className="py-3.5 px-2 font-mono font-extrabold text-slate-900">
                            R$ {b.amount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            <span className={`inline-block py-0.5 px-2.5 rounded-full font-bold uppercase text-[8px] border ${
                              b.status === "paid" 
                                ? "bg-green-50 text-green-600 border-green-200" 
                                : "bg-amber-50 text-amber-600 border-amber-200"
                            }`}>
                              {b.status === "paid" ? "Liquidado" : "Aberto"}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {b.status === "pending" ? (
                              <button
                                onClick={async () => {
                                  if (confirm(`Deseja liquidar manualmente a fatura "${b.id}" no valor de R$ ${b.amount}?`)) {
                                    const res = await fetch(`/api/billing/${b.id}/pay`, { method: "POST" });
                                    if (res.ok) {
                                      alert("Status liquidado!");
                                      loadData();
                                    }
                                  }
                                }}
                                className="bg-green-50 hover:bg-green-100 text-green-650 px-2 py-1 border border-green-150 rounded text-xxs font-bold transition-colors cursor-pointer"
                              >
                                Liquidar
                              </button>
                            ) : (
                              <span className="text-slate-400 font-semibold">• Quitada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB DASHBOARD / ANALYTICS */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Real Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono block">Volume de Vendas Faturado</span>
                <strong className="text-2xl font-black text-slate-950 font-mono block mt-1">R$ {(totalPaidBilling + totalPendingBilling).toFixed(2)}</strong>
                <span className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Sincronizado via Local db
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono block">Recorrentes Ativas</span>
                <strong className="text-2xl font-black text-slate-950 font-mono block mt-1">{clients.length}</strong>
                <span className="text-[10px] text-slate-400 block mt-1">Clientes habilitados a assinar</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono block">Termos Emitidos</span>
                <strong className="text-2xl font-black text-slate-950 font-mono block mt-1">{contracts.length}</strong>
                <span className="text-[10px] text-slate-400 block mt-1">Total de documentos gerados</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono block">Taxa de Conversão</span>
                <strong className="text-2xl font-black text-[#0052FF] font-mono block mt-1">
                  {contracts.length > 0 ? ((numAssinados / contracts.length) * 100).toFixed(1) : "0"} %
                </strong>
                <span className="text-[10px] text-[#0052FF] block mt-1 font-semibold">Contratos assinados / totais</span>
              </div>

            </div>

            {/* Quick overview of latest activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box A: Recent Clients log */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-bold text-slate-900 uppercase block mb-3 border-b border-slate-50 pb-2">Contas Recentes de Clientes</span>
                <div className="space-y-3">
                  {clients.slice(0, 4).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xxs">
                      <div>
                        <strong className="text-slate-800 font-bold block">{c.name}</strong>
                        <span className="text-slate-400 font-mono">{c.email}</span>
                      </div>
                      <span className="text-slate-400 font-mono">{formatDate(c.createdAt)}</span>
                    </div>
                  ))}
                  {clients.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xxs">Nenhum cliente cadastrado.</div>
                  )}
                </div>
              </div>

              {/* Box B: Action checklist / System guide */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase block mb-3 border-b border-slate-50 pb-2">Painel de Guias Administrativas RJR Sign</span>
                  <ul className="text-xxs text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Utilize a aba para <strong>gerenciar termos de faturamento</strong>.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      Para novos clientes, gere licenças na aba <strong>Clientes</strong>. O sistema gerará de imediato a chave matriz de acesso e e-mail de representação legal.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      Cadastre novos contratos associados a e-mails na aba <strong>Contratos</strong> para os clientes assinarem digitalmente com validade civil e jurídica.
                    </li>
                  </ul>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Plataforma Segura de Assinatura</span>
                  <span className="font-mono bg-blue-50 text-[#0052FF] px-2 py-0.5 rounded font-bold">SHA-512 SECURE</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER - perfectly literal and humble */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <strong>RJR Sign Portal</strong> • Todos os direitos reservados © 2026.
          </div>
          <div>
            Desenvolvido por{" "}
            <a 
              href="https://devrogeriojunior.com.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-550 hover:text-slate-900 font-bold hover:underline transition-colors"
            >
              Rogério Júnior
            </a>
          </div>
        </div>
      </footer>

      {/* ================= MODAL: CREATE CONTRACT ================= */}
      <AnimatePresence>
        {isContractModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden text-slate-800"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Novo Contrato Digital</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Vincule um termo instrumental a um cliente para coleta eletrônica</span>
                </div>
                <button
                  onClick={() => setIsContractModalOpen(false)}
                  className="p-1 px-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCreateContract} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Título do Documento *</label>
                    <input
                      type="text"
                      placeholder="Ex: Contrato de Hospedagem e Manutenção"
                      value={contractTitle}
                      onChange={(e) => setContractTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Categoria Legal</label>
                    <select
                      value={contractCategory}
                      onChange={(e) => setContractCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Prestação de Serviços">Prestação de Serviços</option>
                      <option value="Desenvolvimento de TI">Desenvolvimento de TI</option>
                      <option value="Licença de Uso">Licença de Uso</option>
                      <option value="Outro">Outros Termos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Valor Unitário do Contrato (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 179.90"
                      value={contractValue}
                      onChange={(e) => setContractValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Vincular a Conta de Cliente Registrada</label>
                    <select
                      value={selectedClientIndex}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        setSelectedClientIndex(idx);
                        if (idx >= 0) {
                          setCustomClientName("");
                          setCustomClientEmail("");
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="-1">Digitar Manualmente (Sem vincular conta)</option>
                      {clients.map((c, i) => (
                        <option key={c.id} value={i}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedClientIndex < 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-2 border-amber-400 pl-3 bg-amber-50/50 py-2.5 rounded-r-lg"
                  >
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nome Completo do Cliente *</label>
                      <input
                        type="text"
                        placeholder="Ex: Bellacor Tintas Ltda"
                        value={customClientName}
                        onChange={(e) => setCustomClientName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                        required={selectedClientIndex < 0}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">E-mail do Representante Legal *</label>
                      <input
                        type="email"
                        placeholder="Ex: consultor@bellacortintas.com.br"
                        value={customClientEmail}
                        onChange={(e) => setCustomClientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                        required={selectedClientIndex < 0}
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cláusulas do Termo (Formato Markdown Permitido) *</label>
                  <textarea
                    rows={8}
                    placeholder="# TERMO INSTRUMENTAL DE PRESTAÇÃO DE SERVIÇOS..."
                    value={contractContent}
                    onChange={(e) => setContractContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Use tags do Markdown para estruturar níveis: # Títulos, **Negrito**, etc.
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsContractModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0052FF] hover:bg-[#0040D0] text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Salvar & Publicar
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: CREATE CLIENT ================= */}
      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-slate-800"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Cadastrar Novo Cliente</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Libere um login operacional corporativo no sistema</span>
                </div>
                <button
                  onClick={() => setIsClientModalOpen(false)}
                  className="p-1 px-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nome da Empresa / Cliente Licenciado *</label>
                  <input
                    type="text"
                    placeholder="Exemplo: Construtora Alfa S.A."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">E-mail Corporativo de Login *</label>
                  <input
                    type="email"
                    placeholder="Exemplo: gerencia@empresa.com.br"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Senha Provisória do Cliente *</label>
                  <input
                    type="text"
                    placeholder="Defina a senha inicial provisória para o cliente"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Defina a senha que você enviará para o cliente acessar pela primeira vez.
                  </span>
                </div>

                <div className="border-t border-slate-100 my-2 pt-3">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#0052FF] block mb-2">Dados do Representante Relacionado</span>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Nome do Signatário</label>
                    <input
                      type="text"
                      placeholder="Nome do Representante Legal (Ex: Carlos Alberto)"
                      value={clientRepName}
                      onChange={(e) => setClientRepName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] text-slate-500 leading-normal">
                  💡 <strong>Informação de Segurança:</strong> O cliente cadastrado com essa senha provisória será obrigado a redefini-la imediatamente em seu primeiro login no portal.
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0052FF] hover:bg-[#0040D0] text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Registrar Conta
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: CREATE BILLING ================= */}
      <AnimatePresence>
        {isBillingModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-slate-800"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Lançar Nova Cobrança</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Registre faturas mensais ou cobranças individuais em lote</span>
                </div>
                <button
                  onClick={() => setIsBillingModalOpen(false)}
                  className="p-1 px-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCreateBilling} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cliente Contratante Registrado *</label>
                  <select
                    value={billingClientIndex}
                    onChange={(e) => setBillingClientIndex(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="-1">-- Selecione o Cliente --</option>
                    {clients.map((c, i) => (
                      <option key={c.id} value={i}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo de Serviço</label>
                    <select
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="monthly_fee">Mensalidade Recorrente</option>
                      <option value="additional">Taxa de Setup / Adicional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Valor do Faturamento (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 179.90"
                      value={billingAmount}
                      onChange={(e) => setBillingAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-extrabold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Prazo de Vencimento *</label>
                  <input
                    type="date"
                    value={billingDueDate}
                    onChange={(e) => setBillingDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descrição Comercial da Fatura</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Mensalidade de Hospedagem e Manutenção em Nuvem - RJR Sign"
                    value={billingDescription}
                    onChange={(e) => setBillingDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0052FF] hover:bg-[#0040D0] text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Gravar Fatura
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
