import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Users, Receipt, LayoutDashboard, Plus, 
  Search, LogOut, CheckCircle2, Clock, Trash2, Calendar,
  DollarSign, FileDown, CheckCircle, RefreshCw, Send, AlertCircle, Edit3,
  Check, X, Edit
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils";
import { RegisteredClient, Contract, BillingItem } from "../types";
import TermsModal from "./TermsModal";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "clients" | "billing" | "contracts">("dashboard");
  
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
  const [clientMonthlyFee, setClientMonthlyFee] = useState("179.90");
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Form states - Billing
  const [billingClientIndex, setBillingClientIndex] = useState<number>(-1);
  const [billingAmount, setBillingAmount] = useState("179.90");
  const [billingDescription, setBillingDescription] = useState("");
  const [billingDueDate, setBillingDueDate] = useState("");
  const [billingType, setBillingType] = useState<"monthly_fee" | "additional">("monthly_fee");
  const [selectedBillingClientId, setSelectedBillingClientId] = useState<string | null>(null);
  const [inlineMonthlyFee, setInlineMonthlyFee] = useState("");
  const [isUpdatingMonthlyFee, setIsUpdatingMonthlyFee] = useState(false);

  // New features premium state engines
  const [billingViewMode, setBillingViewMode] = useState<"clients" | "flat">("clients");
  const [selectedClientBillingDetail, setSelectedClientBillingDetail] = useState<RegisteredClient | null>(null);
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillDescription, setNewBillDescription] = useState("");
  const [newBillDueDate, setNewBillDueDate] = useState("");
  const [newBillType, setNewBillType] = useState<"monthly_fee" | "additional">("monthly_fee");
  const [isSubmittingNewBill, setIsSubmittingNewBill] = useState(false);

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isEditContractModalOpen, setIsEditContractModalOpen] = useState(false);
  const [formSigners, setFormSigners] = useState<{ name: string, email: string, requiredToSign: boolean, status: string }[]>([]);
  const [tempSignerName, setTempSignerName] = useState("");
  const [tempSignerEmail, setTempSignerEmail] = useState("");
  const [tempSignerRequired, setTempSignerRequired] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Pre-populate inline state when active selection changes
  useEffect(() => {
    if (selectedBillingClientId && clients.length > 0) {
      const activeClient = clients.find(c => c.id === selectedBillingClientId);
      if (activeClient) {
        setInlineMonthlyFee(String(activeClient.monthlyFee ?? "179.90"));
        setBillingAmount(String(activeClient.monthlyFee ?? "179.90"));
      }
    }
  }, [selectedBillingClientId, clients]);

  useEffect(() => {
    if (selectedClientBillingDetail) {
      setNewBillAmount(String(selectedClientBillingDetail.monthlyFee ?? "179.90"));
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setNewBillDueDate(futureDate.toISOString().split("T")[0]);
    }
  }, [selectedClientBillingDetail]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resContracts, resClients, resBillings] = await Promise.all([
        fetch("/api/contracts"),
        fetch("/api/clients"),
        fetch("/api/billing")
      ]);

      if (resContracts.ok) setContracts(await resContracts.json());
      if (resClients.ok) {
        const cList = await resClients.json();
        setClients(cList);
        if (cList.length > 0) {
          setSelectedBillingClientId(prev => prev || cList[0].id);
        }
      }
      if (resBillings.ok) setBillings(await resBillings.json());
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  };

  const openNewContractModal = () => {
    setContractTitle("");
    setSelectedClientIndex(-1);
    setCustomClientName("");
    setCustomClientEmail("");
    setContractValue("");
    setContractCategory("Prestação de Serviços");
    setContractContent("");
    setFormSigners([
      { name: "Rogério Júnior", email: "devrogeriojunior@gmail.com", requiredToSign: true, status: "pending" }
    ]);
    setIsContractModalOpen(true);
  };

  const handleClientSelected = (idx: number) => {
    setSelectedClientIndex(idx);
    if (idx >= 0) {
      const selected = clients[idx];
      setCustomClientName("");
      setCustomClientEmail("");
      
      const initialSigners = [
        { name: "Rogério Júnior", email: "devrogeriojunior@gmail.com", requiredToSign: true, status: "pending" },
        { 
          name: selected.representatives?.[0]?.name || selected.name, 
          email: selected.email, 
          requiredToSign: true, 
          status: "pending" 
        }
      ];
      setFormSigners(initialSigners);
    } else {
      setFormSigners([
        { name: "Rogério Júnior", email: "devrogeriojunior@gmail.com", requiredToSign: true, status: "pending" }
      ]);
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

    if (formSigners.length === 0) {
      alert("Por favor, adicione pelo menos um signatário obrigatório.");
      return;
    }

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contractTitle,
          clientName: finalClientName,
          clientEmail: finalClientEmail.toLowerCase().trim(),
          content: contractContent,
          value: contractValue ? parseFloat(contractValue) : null,
          category: contractCategory,
          signers: formSigners
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
        setFormSigners([]);
        loadData();
      } else {
        const err = await res.json();
        alert("Erro: " + err.error);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Create or Update Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      alert("Nome e e-mail são obrigatórios.");
      return;
    }

    try {
      if (editingClient) {
        // Run update PUT
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clientName,
            email: clientEmail.toLowerCase().trim(),
            monthlyFee: Number(clientMonthlyFee) || 179.90,
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
          alert(`Cadastro do cliente atualizado com sucesso!`);
          setIsClientModalOpen(false);
          setEditingClient(null);
          setClientName("");
          setClientEmail("");
          setClientRepName("");
          setClientPassword("123456");
          setClientMonthlyFee("179.90");
          loadData();
        } else {
          const err = await res.json();
          alert("Erro: " + err.error);
        }
      } else {
        // Run standard create
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clientName,
            email: clientEmail.toLowerCase().trim(),
            password: clientPassword || "123456",
            hasChangedPassword: false, // MANDATORY PASSWORD CHANGE ON FIRST ACCESS
            monthlyFee: Number(clientMonthlyFee) || 179.90,
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
          setClientPassword("123456");
          setClientMonthlyFee("179.90");
          loadData();
        } else {
          const err = await res.json();
          alert("Erro: " + err.error);
        }
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

  // Update client monthly fee inline
  const handleUpdateClientMonthlyFee = async (clientId: string, newFee: number) => {
    setIsUpdatingMonthlyFee(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyFee: newFee })
      });
      if (res.ok) {
        alert("Valor da mensalidade contratual atualizado com sucesso!");
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao atualizar mensalidade contratual.");
      }
    } catch (e) {
      alert("Erro ao conectar ao servidor.");
    } finally {
      setIsUpdatingMonthlyFee(false);
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
      alert("Ação concluída.");
      loadData();
    } catch (e) {}
  };

  // Send Contract Invite email Simulation
  const handleSendInvite = async (contractId: string) => {
    alert("Convite de assinatura digital reenviado para o e-mail do representante legal com sucesso!");
  };

  // Reactivate / Reset contract signatures
  const handleReactivateContract = async (id: string) => {
    if (!confirm("Deseja reestruturar e liberar este contrato para novas assinaturas? Isso limpará todas as firmas já coletadas.")) {
      return;
    }
    try {
      const res = await fetch(`/api/contracts/${id}/reactivate`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Contrato reativado e liberado para novas assinaturas com sucesso!");
        loadData();
      } else {
        const err = await res.json();
        alert("Erro ao reativar contrato: " + err.error);
      }
    } catch (e) {
      alert("Erro de conexão ao reativar contrato.");
    }
  };

  // Start edit contract modal
  const handleStartEditContract = (c: Contract) => {
    setEditingContract(c);
    setContractTitle(c.title);
    setContractCategory(c.category);
    setContractValue(c.value !== null && c.value !== undefined ? String(c.value) : "");
    setContractContent(c.content);
    setFormSigners([...(c.signers || [])]);
    setIsEditContractModalOpen(true);
  };

  // Save changes to contract
  const handleSaveEditedContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    if (formSigners.length === 0) {
      alert("Por favor, adicione pelo menos um signatário.");
      return;
    }

    try {
      const res = await fetch(`/api/contracts/${editingContract.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contractTitle,
          category: contractCategory,
          value: contractValue ? parseFloat(contractValue) : null,
          content: contractContent,
          signers: formSigners
        })
      });

      if (res.ok) {
        alert("Contrato atualizado com sucesso!");
        setIsEditContractModalOpen(false);
        setEditingContract(null);
        setFormSigners([]);
        loadData();
      } else {
        const err = await res.json();
        alert("Erro ao atualizar: " + err.error);
      }
    } catch (e) {
      alert("Erro ao conectar ao servidor para atualizar o contrato.");
    }
  };

  // Helper methods to edit formSigners
  const handleAddFormSigner = () => {
    if (!tempSignerName || !tempSignerEmail) {
      alert("Informe o nome e e-mail do assinante.");
      return;
    }

    const emailFormated = tempSignerEmail.toLowerCase().trim();
    if (formSigners.some(s => s.email.toLowerCase().trim() === emailFormated)) {
      alert("Este e-mail de assinante já está cadastrado.");
      return;
    }

    setFormSigners([
      ...formSigners,
      {
        name: tempSignerName,
        email: emailFormated,
        requiredToSign: tempSignerRequired,
        status: "pending"
      }
    ]);

    // Reset inputs
    setTempSignerName("");
    setTempSignerEmail("");
    setTempSignerRequired(true);
  };

  const handleRemoveFormSigner = (emailToRemove: string) => {
    setFormSigners(formSigners.filter(s => s.email.toLowerCase().trim() !== emailToRemove.toLowerCase().trim()));
  };

  // Create billing from client detail screen
  const handleCreateClientBillingFromDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientBillingDetail) return;

    if (!newBillAmount || !newBillDueDate) {
      alert("Por favor, preencha o valor e a data de vencimento.");
      return;
    }

    setIsSubmittingNewBill(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: selectedClientBillingDetail.name,
          clientEmail: selectedClientBillingDetail.email,
          type: newBillType,
          amount: parseFloat(newBillAmount) || 0,
          dueDate: newBillDueDate,
          description: newBillDescription || `${newBillType === "monthly_fee" ? "Mensalidade Fixa" : "Serviço Técnico Adicional"} - RJR Sign`
        })
      });

      if (res.ok) {
        alert("Faturamento lançado com sucesso!");
        // Reset fields
        setNewBillAmount("");
        setNewBillDescription("");
        setNewBillDueDate("");
        setNewBillType("monthly_fee");
        
        // Reload data
        await loadData();
        
        // Refresh detail modal object in state to re-calculate stats immediately
        const freshCl = clients.find(cl => cl.id === selectedClientBillingDetail.id);
        if (freshCl) setSelectedClientBillingDetail(freshCl);
      } else {
        const err = await res.json();
        alert("Erro ao lançar faturamento: " + err.error);
      }
    } catch (err) {
      alert("Falha ao registrar cobrança.");
    } finally {
      setIsSubmittingNewBill(false);
    }
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
            <div className="text-right hidden md:block">
              <strong className="text-xs text-slate-900 block font-semibold">Administrador</strong>
              <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">devrogeriojunior@gmail.com</span>
            </div>
            <button
              onClick={onLogout}
              title="Sair do Portal"
              className="p-1.5 hover:bg-slate-100 hover:text-red-650 text-slate-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
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
                onClick={openNewContractModal}
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
                    <div className="flex flex-wrap gap-2 self-end lg:self-auto shrink-0">
                      <button
                        onClick={() => handleSendInvite(c.id)}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                        title="Reenviar link de assinatura para e-mails pendentes"
                      >
                        <Send className="w-3 h-3 text-slate-500" />
                        Reenviar
                      </button>
                      
                      <button
                        onClick={() => handleStartEditContract(c)}
                        className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-[#0052FF] text-xxs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-blue-150"
                        title="Editar minuta legal e regulagem de assinantes"
                      >
                        <Edit className="w-3 h-3 text-[#0052FF]" />
                        Editar
                      </button>

                      {(c.status === "signed" || c.signers?.some(s => s.status === "signed")) ? (
                        <button
                          onClick={() => handleReactivateContract(c.id)}
                          className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xxs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-amber-200"
                          title="Voltar contrato para pendente e liberar novas assinaturas"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-600" />
                          Liberar / Reativar
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleDeleteContract(c.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-colors cursor-pointer border border-red-100"
                        title="Excluir definitamente do portal"
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
                          <span className="bg-blue-50 text-[#0052FF] font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-blue-100">
                            {formatCurrency(c.monthlyFee !== undefined ? c.monthlyFee : 179.90)} /mês
                          </span>
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
                              <span className="text-slate-400 font-mono">{c.email}</span>
                            </div>
                          ))}
                        </div>

                        <span className="text-[10px] text-slate-400 block">
                          Licenciado desde: <strong className="font-mono text-slate-500">{formatDate(c.createdAt)}</strong>
                        </span>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                        <button
                          onClick={() => {
                            setEditingClient(c);
                            setClientName(c.name);
                            setClientEmail(c.email);
                            setClientRepName(c.representatives?.[0]?.name || c.name);
                            setClientPassword(""); // Optional during edits
                            setClientMonthlyFee(c.monthlyFee !== undefined ? String(c.monthlyFee) : "179.90");
                            setIsClientModalOpen(true);
                          }}
                          className="bg-slate-55/5 hover:bg-slate-100 text-slate-700 text-xxs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar Cadastro
                        </button>

                        {c.id !== "admin-user" && (
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xxs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-100 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir Licença
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
        {activeTab === "billing" && (
          <div className="space-y-6">
            
            {/* Title block with CTA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Gestão Financeira & Cobranças
                  <span className="bg-blue-50 text-[#0052FF] text-xxs font-black px-2 py-0.5 rounded-full border border-blue-100">
                    {billingViewMode === "clients" ? "Visão por Cliente" : "Razão Geral"}
                  </span>
                </h1>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Controle as mensalidades fixas de serviços técnicos, fature serviços adicionais, e defina status de liquidação.
                </p>
              </div>
              <button
                onClick={() => setIsBillingModalOpen(true)}
                className="bg-[#0052FF] hover:bg-[#0040D0] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Lançar Cobrança Avulsa
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

            {/* View selectors tab switcher with beautiful style */}
            <div className="flex bg-slate-100 p-1 rounded-xl self-start border border-slate-200/60 text-xs font-bold gap-1 w-fit">
              <button
                onClick={() => setBillingViewMode("clients")}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  billingViewMode === "clients" 
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="w-4 h-4 text-blue-600" />
                Filtrar por Cliente
              </button>
              <button
                onClick={() => setBillingViewMode("flat")}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  billingViewMode === "flat" 
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" 
                    : "text-[#1E293B] hover:text-black"
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-500" />
                Histórico Geral de Cobranças ({billings.length})
              </button>
            </div>

            {/* Render View Mode content */}
            {billingViewMode === "clients" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((c) => {
                  const clientBillings = billings.filter(b => b.clientEmail.toLowerCase().trim() === c.email.toLowerCase().trim());
                  const paidSum = clientBillings.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amount, 0);
                  const pendingSum = clientBillings.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);

                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      
                      {/* Name & Representative Details */}
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="bg-blue-50 text-[#0052FF] font-sans font-black p-3 rounded-xl text-sm leading-none shrink-0 h-11 w-11 flex items-center justify-center uppercase border border-blue-100">
                            {c.name.slice(0, 2)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full">
                            Cliente RJR
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900 tracking-tight mt-3 truncate" title={c.name}>
                          {c.name}
                        </h3>
                        <span className="text-slate-400 text-[10px] font-mono block mt-0.5 truncate">{c.email}</span>
                      </div>

                      {/* Recurrent fee contract billing value editable inline */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">MENSALIDADE FIXA</span>
                          <div className="mt-1">
                            {selectedBillingClientId === c.id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-400 font-mono">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-20 border border-blue-500 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                                  value={inlineMonthlyFee}
                                  onChange={(e) => setInlineMonthlyFee(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateClientMonthlyFee(c.id, parseFloat(inlineMonthlyFee) || 0);
                                      setSelectedBillingClientId(null);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    handleUpdateClientMonthlyFee(c.id, parseFloat(inlineMonthlyFee) || 0);
                                    setSelectedBillingClientId(null);
                                  }}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Salvar"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedBillingClientId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <strong className="text-xs font-mono font-extrabold text-[#0052FF]">
                                  R$ {Number(c.monthlyFee || 0).toFixed(2)}
                                </strong>
                                <button
                                  onClick={() => {
                                    setSelectedBillingClientId(c.id);
                                    setInlineMonthlyFee(String(c.monthlyFee || "179.90"));
                                  }}
                                  className="text-slate-450 hover:text-[#0052FF] p-1 rounded transition-colors"
                                  title="Alterar mensalidade contratual"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Summary Counts */}
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">RESUMO</span>
                          <span className="text-[10px] block mt-1 font-semibold text-slate-600">
                            <strong className="text-green-600 font-bold">{clientBillings.filter(x => x.status === "paid").length}</strong> pagas •{" "}
                            <strong className="text-amber-600 font-bold">{clientBillings.filter(x => x.status === "pending").length}</strong> abertas
                          </span>
                        </div>
                      </div>

                      {/* Stat balances values */}
                      <div className="grid grid-cols-2 gap-2 text-center text-xxs bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[8px] font-bold text-slate-450 uppercase block">Total Pago</span>
                          <strong className="font-mono text-green-600 text-xs font-bold block mt-0.5">R$ {paidSum.toFixed(2)}</strong>
                        </div>
                        <div className="border-l border-slate-150">
                          <span className="text-[8px] font-bold text-slate-450 uppercase block">Total Aberto</span>
                          <strong className="font-mono text-amber-600 text-xs font-bold block mt-0.5">R$ {pendingSum.toFixed(2)}</strong>
                        </div>
                      </div>

                      {/* Detail screen opener */}
                      <button
                        onClick={() => setSelectedClientBillingDetail(c)}
                        className="w-full text-center py-2.5 text-xs font-bold bg-[#0052FF]/10 text-[#0052FF] hover:bg-[#0052FF]/25 border border-[#0052FF]/15 hover:border-[#0052FF]/30 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 shrink-0" />
                        Histórico & Novo Lançamento
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden animate-fade-in">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-4">Razão Geral de Lançamentos de Cobrança</span>
                
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
            )}

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
                        handleClientSelected(idx);
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
                        placeholder="Ex: Empresa de Tecnologia Ltda"
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
                        placeholder="Ex: consultor@empresa.com.br"
                        value={customClientEmail}
                        onChange={(e) => setCustomClientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                        required={selectedClientIndex < 0}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Dynamic Signers Customized Table Panel */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Fluxo de Assinatura (Signatários Regulamentados)</label>
                  
                  {formSigners.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic mb-3">Nenhum signatário adicionado para assinar este documento.</div>
                  ) : (
                    <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                      {formSigners.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-150 text-xs">
                          <div className="truncate">
                            <strong className="text-slate-800 font-extrabold">{s.name}</strong> 
                            <span className="text-slate-400 text-[10px] block font-mono leading-none mt-0.5">{s.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500">
                              <input
                                type="checkbox"
                                checked={s.requiredToSign !== false}
                                onChange={(e) => {
                                  const updated = [...formSigners];
                                  updated[idx] = { ...updated[idx], requiredToSign: e.target.checked };
                                  setFormSigners(updated);
                                }}
                                className="rounded text-[#0052FF]"
                              />
                              Inscrito para Assinar
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveFormSigner(s.email)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Excluir"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Adicionar Co-Signatário Form */}
                  <div className="border-t border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Nome do Co-Signatário</span>
                      <input
                        type="text"
                        placeholder="Ex: Pedro de Souza"
                        value={tempSignerName}
                        onChange={(e) => setTempSignerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xxs focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">E-mail de Assinatura</span>
                      <input
                        type="email"
                        placeholder="Ex: pedro@email.com"
                        value={tempSignerEmail}
                        onChange={(e) => setTempSignerEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xxs font-mono focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFormSigner}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg p-1.5 text-xxs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cláusulas do Termo (Formato Markdown Permitido) *</label>
                  <textarea
                    rows={6}
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

               {/* ================= MODAL: CREATE / EDIT CLIENT ================= */}
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
                  <h3 className="text-sm font-bold">
                    {editingClient ? "Editar Cadastro de Cliente" : "Cadastrar Novo Cliente"}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {editingClient ? "Atualize as informações cadastrais e comerciais da licença" : "Libere um login operacional no sistema"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsClientModalOpen(false);
                    setEditingClient(null);
                    setClientName("");
                    setClientEmail("");
                    setClientRepName("");
                    setClientPassword("123456");
                    setClientMonthlyFee("179.90");
                  }}
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
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Valor da Mensalidade Fixa (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 179.90"
                    value={clientMonthlyFee}
                    onChange={(e) => setClientMonthlyFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                    required
                  />
                </div>

                {!editingClient && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Senha Provisória do Cliente *</label>
                    <input
                      type="text"
                      placeholder="Defina a senha inicial provisória para o cliente"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                      required={!editingClient}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Defina a senha que você enviará para o cliente acessar pela primeira vez.
                    </span>
                  </div>
                )}

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
                  💡 <strong>Informação de Segurança:</strong> O cliente cadastrado acessará o portal utilizando o e-mail corporativo. Seus dados mostram-se protegidos por hash PBKDF2/SHA512.
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClientModalOpen(false);
                      setEditingClient(null);
                      setClientName("");
                      setClientEmail("");
                      setClientRepName("");
                      setClientPassword("123456");
                      setClientMonthlyFee("179.90");
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0052FF] hover:bg-[#0040D0] text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    {editingClient ? "Atualizar Cadastro" : "Registrar Conta"}
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

      {/* Pure and literal structural footer for Admin */}
      <footer className="bg-white border-t border-slate-200/80 py-8 mt-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            {/* Minimalist Brand Logo in Footer */}
            <div className="flex items-center gap-1.5">
              <div className="w-5.5 h-5.5 rounded bg-slate-900 flex items-center justify-center text-white font-mono text-[9px] font-black">
                R
              </div>
              <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                RJR <span className="text-[#0052FF]">SIGN</span>
              </span>
            </div>
            
            <span className="text-slate-300 hidden sm:inline">|</span>
            
            <p className="text-xxs text-slate-400 font-medium">
              Todos os direitos reservados © 2026.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="text-slate-500 hover:text-blue-600 hover:underline text-xxs font-bold transition-all cursor-pointer"
            >
              Termos de Uso &amp; Privacidade
            </button>
            
            <span className="text-slate-300">|</span>

            <div className="text-xxs">
              Desenvolvido por{" "}
              <a 
                href="https://devrogeriojunior.com.br" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-600 hover:text-slate-950 font-bold hover:underline transition-colors"
              >
                Rogério Júnior
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* ================= MODAL: EDIT EXISTING CONTRACT ================= */}
      <AnimatePresence>
        {isEditContractModalOpen && editingContract && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden text-slate-800"
            >
              <div className="bg-[#0052FF] text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Editar Contrato Comercial</h3>
                  <span className="text-[10px] text-blue-100 block mt-0.5">Editando ID: {editingContract.id}</span>
                </div>
                <button
                  onClick={() => setIsEditContractModalOpen(false)}
                  className="p-1 px-3 bg-blue-700 hover:bg-blue-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleSaveEditedContract} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Título do Documento *</label>
                    <input
                      type="text"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="Prestação de Serviços">Prestação de Serviços</option>
                      <option value="Desenvolvimento de TI">Desenvolvimento de TI</option>
                      <option value="Licença de Uso">Licença de Uso</option>
                      <option value="Outro">Outros Termos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Valor Unitário do Contrato (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sem valor fixado"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                {/* Edit Signers Dynamic Table */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Fluxo de Assinatura (Membros Co-Signatários)</label>
                  
                  {formSigners.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic mb-3">Sem signatários cadastrados.</div>
                  ) : (
                    <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                      {formSigners.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-150 text-xs">
                          <span className="truncate">
                            <strong className="text-slate-800 font-extrabold">{s.name}</strong> 
                            <span className="text-slate-400 text-[10px] block font-mono leading-none mt-0.5">{s.email}</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${s.status === 'signed' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {s.status === 'signed' ? 'Assinado' : 'Pendente'}
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500">
                              <input
                                type="checkbox"
                                checked={s.requiredToSign !== false}
                                onChange={(e) => {
                                  const updated = [...formSigners];
                                  updated[idx] = { ...updated[idx], requiredToSign: e.target.checked };
                                  setFormSigners(updated);
                                }}
                                className="rounded text-[#0052FF]"
                              />
                              Inscrito
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveFormSigner(s.email)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Nome</span>
                      <input
                        type="text"
                        placeholder="Ex: Novo Signatário"
                        value={tempSignerName}
                        onChange={(e) => setTempSignerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xxs"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">E-mail</span>
                      <input
                        type="email"
                        placeholder="Ex: novo@email.com"
                        value={tempSignerEmail}
                        onChange={(e) => setTempSignerEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xxs font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFormSigner}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg p-1.5 text-xxs font-bold animate-pulse-hover"
                    >
                      Incluir
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cláusulas Regulatórias (Formato Markdown)</label>
                  <textarea
                    rows={6}
                    value={contractContent}
                    onChange={(e) => setContractContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditContractModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0052FF] hover:bg-[#0040D0] text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Salvar Mudanças
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: CLIENT BILLING DETAIL TIMELINE & LAUNCHER ================= */}
      <AnimatePresence>
        {selectedClientBillingDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden text-slate-800"
            >
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Resumo Financeiro Individualizado</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Cliente: <strong className="text-blue-400">{selectedClientBillingDetail.name}</strong> ({selectedClientBillingDetail.email})</span>
                </div>
                <button
                  onClick={() => setSelectedClientBillingDetail(null)}
                  className="p-1 px-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  X
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[75vh] overflow-y-auto">
                
                {/* Visual Billing Timeline & Log list (Left - 7 columns) */}
                <div className="col-span-1 lg:col-span-7 p-6 border-r border-slate-150 space-y-4">
                  <span className="text-xxs font-black text-slate-400 uppercase tracking-wider block">Histórico de Cobranças Emitidas</span>
                  
                  {billings.filter(b => b.clientEmail.toLowerCase().trim() === selectedClientBillingDetail.email.toLowerCase().trim()).length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs italic">
                      Nenhuma cobrança registrada para este cliente.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                      {billings
                        .filter(b => b.clientEmail.toLowerCase().trim() === selectedClientBillingDetail.email.toLowerCase().trim())
                        .map(b => (
                          <div key={b.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors flex items-center justify-between gap-4 text-xs">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block py-0.5 px-2 rounded-full font-bold uppercase text-[7px] border ${
                                  b.status === "paid" 
                                    ? "bg-green-50 text-green-600 border-green-200" 
                                    : "bg-amber-50 text-amber-600 border-amber-200"
                                }`}>
                                  {b.status === "paid" ? "Liquidado" : "Pendente"}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">ID: {b.id}</span>
                              </div>
                              <span className="font-extrabold text-slate-800 block truncate" title={b.description || "Fatura avulsa"}>
                                {b.description || "Mensalidade / Lançamento de Serviço"}
                              </span>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                <span>Vecto: <strong className="font-mono text-slate-500 font-bold">{formatDate(b.dueDate)}</strong></span>
                                <span>Tipo: <strong className="text-slate-500 font-semibold">{b.type === "monthly_fee" ? "Mensalidade" : "Adicional"}</strong></span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-slate-900 block">R$ {b.amount.toFixed(2)}</span>
                              
                              {b.status === "pending" ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Liquidar manualmente esta fatura de R$ ${b.amount}?`)) {
                                      const res = await fetch(`/api/billing/${b.id}/pay`, { method: "POST" });
                                      if (res.ok) {
                                        loadData();
                                        const fresh = clients.find(x => x.id === selectedClientBillingDetail.id);
                                        if (fresh) setSelectedClientBillingDetail(fresh);
                                      }
                                    }
                                  }}
                                  className="text-[9px] text-[#0052FF] font-bold hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block ml-auto mt-1"
                                >
                                  Liquidar
                                </button>
                              ) : (
                                <span className="text-[9px] text-green-600 font-extrabold block mt-1">• Quitada</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Create New Bill directly for this specific client (Right - 5 columns) */}
                <form onSubmit={handleCreateClientBillingFromDetail} className="col-span-1 lg:col-span-5 p-6 bg-slate-50/50 space-y-4">
                  <span className="text-xxs font-black text-slate-500 uppercase tracking-wider block">Faturar Novo Serviço</span>
                  
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Tipo de Lançamento</label>
                    <select
                      value={newBillType}
                      onChange={(e) => setNewBillType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="monthly_fee">Mensalidade Contratual</option>
                      <option value="additional">Taxa de Setup / Adicional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Valor do Faturamento (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={newBillAmount}
                      onChange={(e) => setNewBillAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Data de Vencimento</label>
                    <input
                      type="date"
                      value={newBillDueDate}
                      onChange={(e) => setNewBillDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Descrição de Cobrança</label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Hospedagem e Manutenção em Nuvem"
                      value={newBillDescription}
                      onChange={(e) => setNewBillDescription(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingNewBill}
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#0052FF] hover:bg-[#0040D0] disabled:bg-slate-300 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    {isSubmittingNewBill ? "Registrando..." : "Registrar Faturamento"}
                  </button>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms and Privacy Modal Mount */}
      <AnimatePresence>
        {isTermsOpen && (
          <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}
