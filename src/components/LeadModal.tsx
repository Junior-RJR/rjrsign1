import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Search, ShieldCheck, CheckCircle2, Paintbrush, Loader } from "lucide-react";
import { maskCNPJ, maskPhone } from "../utils";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: string;
}

export default function LeadModal({ isOpen, onClose, selectedProduct = "" }: LeadModalProps) {
  const [cnpj, setCnpj] = useState("");
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [businessType, setBusinessType] = useState("Construtora");
  const [targetProduct, setTargetProduct] = useState(selectedProduct || "Bellacor Super Rendimento Matte");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set target product when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      setTargetProduct(selectedProduct);
    }
  }, [selectedProduct]);

  if (!isOpen) return null;

  // Retrieve UTM tags from session storage to populate metrics routing
  const getUtmParams = () => {
    return {
      utmSource: sessionStorage.getItem("utm_source") || "Direct Bio Link",
      utmMedium: sessionStorage.getItem("utm_medium") || "organic",
      utmCampaign: sessionStorage.getItem("utm_campaign") || "default_organic_traffic",
      utmContent: sessionStorage.getItem("utm_content") || "landing_cta"
    };
  };

  const handleCnpjLookup = async () => {
    const numeric = cnpj.replace(/\D/g, "");
    if (numeric.length !== 14) {
      setCnpjError("Digite um CNPJ válido com 14 dígitos.");
      return;
    }

    setCnpjError("");
    setSearchingCnpj(true);

    try {
      const res = await fetch(`/api/cnpj/${numeric}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") {
          setCompanyName(data.nome);
          if (data.telefone) setPhone(maskPhone(data.telefone));
          const fullAddress = `${data.logradouro || ""}${data.numero ? `, ${data.numero}` : ""}${data.bairro ? ` - ${data.bairro}` : ""}`;
          setAddress(fullAddress);
          setCity(data.municipio || "");
          setState(data.uf || "");
        } else {
          setCnpjError("Não foi possível localizar o CNPJ de forma automatizada. Digite manualmente.");
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      setCnpjError("Erro ao pesquisar CNPJ. Preencha os campos da empresa abaixo.");
    } finally {
      setSearchingCnpj(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone || !cnpj) {
      alert("Por favor, preencha os dados essenciais da empresa.");
      return;
    }

    setLoading(true);
    const utm = getUtmParams();

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnpj,
          companyName,
          phone,
          address,
          city,
          state,
          businessType,
          targetProduct,
          message,
          ...utm
        })
      });

      if (response.ok) {
        // Log click metric
        await fetch("/api/metrics/clicks", { method: "POST" });
        setSubmitted(true);
      } else {
        alert("Ocorreu um erro ao registrar as informações.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-slate-900 font-bold text-sm tracking-widest">
              B2B
            </div>
            <div>
              <h3 className="font-sans font-semibold text-lg tracking-tight">Canal de Venda Direta Industrial</h3>
              <p className="text-xs text-slate-330">Fábrica Bellacor Tintas — Atendimento Comercial Atacado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h4 className="text-2xl font-bold text-gray-900 tracking-tight">Lead Comercial Registrado!</h4>
            <p className="text-gray-600 mt-2 max-w-md text-sm leading-relaxed">
              Os dados corporativos da empresa <strong>{companyName}</strong> foram validados e indexados com as tags UTM de rastreio de campanha.
            </p>
            <div className="my-6 p-4 bg-slate-50 rounded-xl border border-gray-100 text-xs text-left w-full max-w-md">
              <span className="font-semibold text-gray-800 block mb-1">🔍 Metadados do Funil Gravados:</span>
              <p className="text-gray-500 font-mono">CNPJ: {cnpj}</p>
              <p className="text-gray-500 font-mono">Produto Selecionado: {targetProduct}</p>
              <p className="text-gray-500 font-mono">Rastreio: {getUtmParams().utmSource} / {getUtmParams().utmCampaign}</p>
            </div>
            <p className="text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full text-xs font-semibold">
              SLA de Contato Comercial: Até 2 horas via WhatsApp.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
            >
              Fechar Catálogo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2.5 text-xs text-amber-850">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                O sistema efetuará consulta em tempo real à Receitaws Federal e cadastrará o lead com auditoria UTM.
              </div>
            </div>

            {/* CNPJ Input with Auto-Lookup Block */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                CNPJ da Revenda ou Construtora <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => {
                      setCnpj(maskCNPJ(e.target.value));
                      setCnpjError("");
                    }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCnpjLookup}
                  disabled={searchingCnpj}
                  className="px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {searchingCnpj ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Puxar Dados
                </button>
              </div>
              {cnpjError && <p className="text-rose-500 text-xxs mt-1 font-medium">{cnpjError}</p>}
              <p className="text-gray-400 text-xxs mt-1">Dica: Digite <strong>04346443000190</strong> para validar a consulta instantânea.</p>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Razão Social Cadastrada <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome corporativo oficial"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Telefone Principal de Contato <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Endereço Comercial Completo</label>
              <input
                type="text"
                placeholder="Rua, Número, Bairro"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="Boituva"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  placeholder="SP"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Seu Ramo de Atuação comercial</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                >
                  <option value="Construtora">Construtora Civil</option>
                  <option value="Distribuidora">Distribuidora de Tintas</option>
                  <option value="Lojista de Tintas">Lojista / Revenda Materiais</option>
                  <option value="Pintor de Obras Consumidor">Pintor Profissional / Empreiteiro</option>
                  <option value="Uso Próprio">Uso Próprio / Indústria</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Produto com Alvo de Conversão</label>
                <input
                  type="text"
                  disabled
                  value={targetProduct}
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mensagem ou Volume de Compra Desejado</label>
              <textarea
                rows={3}
                placeholder="Informe as quantidades ou observações para acelerar a cotação..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-slate-950 to-slate-850 hover:from-slate-900 hover:to-slate-800 disabled:from-slate-400 disabled:to-slate-300 text-white font-sans font-medium rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Paintbrush className="w-4 h-4" />
                    Enviar Proposta de Tintas para Fábrica
                  </>
                )}
              </button>
              <p className="text-center text-gray-400 text-[10px] mt-2.5">
                Ao preencher, você aceita o monitoramento UTM do Google Analytics 4 e concorda com a LGPD Brasileira.
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
