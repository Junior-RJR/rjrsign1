import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Search, SlidersHorizontal, ArrowUpRight, 
  Download, Sparkles, FileText, Check, ShieldAlert,
  Paintbrush, ChevronRight, HelpCircle, PhoneCall
} from "lucide-react";
import { Product, Category } from "../types";
import { parseGoogleDriveLink } from "../utils";

interface PublicCatalogProps {
  onOpenLeadModal: (product?: string) => void;
  onNavigateToLogin: () => void;
}

export default function PublicCatalog({ onOpenLeadModal, onNavigateToLogin }: PublicCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  
  // Rotating banners for home
  const [activeBanner, setActiveBanner] = useState(0);
  const banners = [
    {
      title: "Nova Linha Bellacor Protect Esmaltes",
      subtitle: "Fórmula anticorrosiva de alto brilho para madeiras e metais com acabamento impecável.",
      bg: "bg-slate-900",
      accent: "text-amber-500",
      cta: "Conhecer Linha Protect"
    },
    {
      title: "Super Rendimento Acrílico Matte",
      subtitle: "Sua pintura rende muito mais! Diluição de até 60% com água mantendo cobertura perfeita.",
      bg: "bg-slate-950",
      accent: "text-emerald-400",
      cta: "Ver Detalhes Técnicos"
    },
    {
      title: "Selo de Qualidade e Durabilidade Fabril",
      subtitle: "Certificação de Baixo Odor e proteção antimofo de longa duração para sua obra.",
      bg: "bg-slate-900",
      accent: "text-blue-400",
      cta: "Falar com Consultor"
    }
  ];

  // LGPD cookie banner trigger
  const [showCookies, setShowCookies] = useState(false);

  useEffect(() => {
    // Read UTM codes and save in session storage
    const query = new URLSearchParams(window.location.search);
    const utmTags = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
    utmTags.forEach(tag => {
      const val = query.get(tag);
      if (val) {
        sessionStorage.setItem(tag, val);
      }
    });

    // Carousel interval
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 6000);

    // Fetch catalog products and categories list
    fetchData();

    // Check cookie consent
    const consent = localStorage.getItem("rjr_cookie_consent");
    if (!consent) {
      setShowCookies(true);
    }

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories")
      ]);
      if (resProd.ok) {
        const prodData = await resProd.json();
        setProducts(prodData);
      }
      if (resCat.ok) {
        const catData = await resCat.json();
        setCategories(catData);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do catálogo público", err);
    }
  };

  const handleAcceptCookies = () => {
    localStorage.setItem("rjr_cookie_consent", "accepted");
    setShowCookies(false);
  };

  // Metric tracking helper for CTAs
  const trackLandingClick = async () => {
    try {
      await fetch("/api/metrics/clicks", { method: "POST" });
    } catch (e) {}
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
                          
    const matchesCategory = selectedCategory === "Todos" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const essentialProducts = products.filter(p => p.isEssential);

  return (
    <div className="bg-[#fbfcff] text-slate-900 min-h-screen flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xxs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white font-mono font-black text-xl shadow-md border border-slate-800">
              B
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight text-slate-950 block leading-none">BELLACOR</span>
              <span className="text-[10px] tracking-widest text-[#0088FE] font-bold uppercase">Tintas Industriais</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#home" className="hover:text-slate-950 transition-colors">Início</a>
            <a href="#destaques" className="hover:text-slate-950 transition-colors">Destaques</a>
            <a href="#catalogo" className="hover:text-slate-950 transition-colors">Produtos</a>
            <a href="#documental" className="hover:text-slate-950 transition-colors">Fichas Técnicas & FDS</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                trackLandingClick();
                onOpenLeadModal();
              }}
              className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer focus:ring-2 focus:ring-slate-950"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              Atendimento B2B
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-3.5 py-2 border border-gray-200 text-slate-700 bg-gray-50 rounded-xl text-xs font-semibold hover:bg-slate-100 hover:text-slate-950 transition-all flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              RJR Sync Login
            </button>
          </div>
        </div>
      </header>

      {/* ROTATING HERO BANNER */}
      <section id="home" className="relative min-h-[440px] md:min-h-[480px] bg-slate-950 text-white flex items-center overflow-hidden">
        {/* Abstract subtle details */}
        <div className="absolute inset-0 bg-radial-at-t from-slate-900 via-slate-950 to-black opacity-90 z-0" />
        <div className="absolute top-20 right-20 w-80 h-80 bg-[#0088FE]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-[#00C49F]/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xxs font-semibold tracking-wider text-amber-400 uppercase border border-white/10">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              RJR Sync Plataforma Registradora
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeBanner}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <h1 className="text-4xl sm:text-5xl font-sans font-black tracking-tight leading-none text-white max-w-3xl">
                  {banners[activeBanner].title}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                  {banners[activeBanner].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  trackLandingClick();
                  onOpenLeadModal();
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md transform hover:-translate-y-0.5"
              >
                Solicitar Cotação Industrial
              </button>
              <a
                href="#catalogo"
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                Navegar no Catálogo
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Quick Metrics display on Banner */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md hidden lg:block">
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold block mb-4">Selo Técnico de Confiança</span>
            <ul className="space-y-3.5 text-xs text-slate-200">
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0">✔</div>
                <span>Direto da Fábrica em Boituva - SP</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0">✔</div>
                <span>Consulta instantânea via CNPJ</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0">✔</div>
                <span>Proteção Antimofo & Baixo Odor</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0">✔</div>
                <span>SLA de Atendimento em Minutos</span>
              </li>
            </ul>
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-slate-400 text-xxs">
              <span>RJR Sync Gestão ativa</span>
              <span className="text-emerald-400 font-semibold">• ONLINE</span>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIAL BLOCKS */}
      <section className="bg-slate-50 border-b border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div className="bg-white p-5 rounded-xl shadow-3xs border border-gray-150/40 flex items-start gap-3.5">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-950 text-sm">Fins Estéticos Aveludados</h4>
              <p className="text-xs text-slate-400 mt-1">Nossa linha de tintas oferece excelente acabamento fosco e brilhos intensos de alta durabilidade.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-3xs border border-gray-150/40 flex items-start gap-3.5">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-950 text-sm">Central de Boletins Oficiais</h4>
              <p className="text-xs text-slate-400 mt-1">Download instantâneo de boletins técnicos e termos de segurança fiscal ANVISA.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-3xs border border-gray-150/40 flex items-start gap-3.5">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-950 text-sm">Cotações Automatizadas B2B</h4>
              <p className="text-xs text-slate-400 mt-1">Insira seu CNPJ corporativo e receba assessoria comercial personalizada com preços direto da fonte.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOME ESSENTIAL PRODUCTS BENTO GRID - MAX 3 EXCLUSIVES RULE */}
      {essentialProducts.length > 0 && (
        <section id="destaques" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
          <div className="text-center mb-10">
            <span className="text-xxs uppercase tracking-wider text-[#0088FE] font-bold">Vitrine de Altíssima Venda</span>
            <h2 className="text-3xl font-sans font-extrabold text-slate-900 tracking-tight mt-1">Destaques Essenciais da Fábrica</h2>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xl mx-auto leading-relaxed">
              Os três itens indispensáveis para lojistas e revendas mais fabricados pela Bellacor Tintas neste trimestre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {essentialProducts.slice(0, 3).map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-all"
              >
                <div className="relative h-48 bg-slate-100/50 overflow-hidden">
                  <img
                    referrerPolicy="no-referrer"
                    src={parseGoogleDriveLink(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950 text-white text-[9px] font-bold px-2 py-1 uppercase rounded-md tracking-wider">
                    Destaque Essencial
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#0088FE]">{product.category}</span>
                    <h3 className="font-semibold text-slate-900 text-base mt-0.5 group-hover:text-amber-600 transition-colors">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{product.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block leading-tight">Uso Indicado</span>
                      <span className="text-xs font-semibold text-slate-800">{product.areaOfUse}</span>
                    </div>
                    <button
                      onClick={() => {
                        trackLandingClick();
                        onOpenLeadModal(product.name);
                      }}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Cotação Atacado
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* FULL CATOLOGUE WITH PHONETIC AND KEYWORD SEARCH */}
      <section id="catalogo" className="bg-slate-50 border-t border-b border-gray-100 py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between items-stretch gap-4 mb-8">
            <div>
              <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Catálogo Completo</span>
              <h2 className="text-2xl font-bold font-sans text-gray-950 tracking-tight mt-0.5">Explore Nossos Revestimentos</h2>
              <p className="text-xs text-slate-400 mt-1">Busque rapidamente por acabamento, nome ou propriedades técnicas.</p>
            </div>

            {/* Live filter parameters */}
            <div className="flex flex-col sm:flex-row gap-3.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou detalhes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-950"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-250 px-3 py-1.5 rounded-xl">
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-0 text-xs text-slate-700 outline-none focus:ring-0"
                >
                  <option value="Todos">Todas as Categorias</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-150 max-w-md mx-auto my-6 shadow-xxs">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">Nenhum produto localizado</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-4">
                Não encontramos tintas que correspondem aos critérios de busca "{search}". Abra a consulta ou selecione outra categoria.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("Todos");
                }}
                className="px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-xxs border border-gray-150 overflow-hidden hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 bg-slate-100 overflow-hidden">
                      <img
                        referrerPolicy="no-referrer"
                        src={parseGoogleDriveLink(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.isEssential && (
                        <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
                          Home Destaque
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-[9px] uppercase tracking-wide text-slate-400 font-bold block">{product.category}</span>
                      <h3 className="font-semibold text-slate-900 text-sm mt-0.5 line-clamp-1">{product.name}</h3>
                      <p className="text-xxs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => {
                        setSelectedProductDetails(product);
                        trackLandingClick();
                      }}
                      className="w-full py-1.5 border border-gray-200 text-slate-700 bg-gray-50/50 hover:bg-slate-950 hover:text-white hover:border-slate-950 font-bold rounded-lg text-xxs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Ficha Técnica & Amostras de Cor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CENTRAL TÉCNICA DOCUMENTAL - BULLETINS DOWNLOAD & VIEW */}
      <section id="documental" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <div className="bg-slate-900 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden shadow-xl border border-slate-850">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0088FE]/10 rounded-full blur-3xl z-0" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xxs font-bold text-amber-400 uppercase tracking-wider">Suporte Regulatório de Fábrica</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">Consulte e Baixe de Forma Livre as FDS (FISPq) e Boletins de Testes</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Nossos produtos químicos atendem de forma integral à legislação do Ministério do Trabalho e à ANVISA. Disponibilizamos arquivos oficiais estáticos e fichas técnicas instantâneas. O conversor integrado RJR Sync garante downloads rápidos e visualização limpa de documentos unificados.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#catalogo"
                  className="px-5 py-2.5 bg-white text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  Visualizar no Catálogo
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xs space-y-3">
              <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold block mb-2">Manuais Disponíveis para Download</span>
              
              <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl hover:bg-slate-950/60 transition-colors border border-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00C49F]" />
                  <span className="text-xxs font-mono font-medium">FISPq_esmalte_sintetico_protect.pdf</span>
                </div>
                <button
                  onClick={() => {
                    trackLandingClick();
                    alert("Download iniciado pelo RJR Asset Parser");
                  }}
                  className="p-1 rounded bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl hover:bg-slate-950/60 transition-colors border border-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00C49F]" />
                  <span className="text-xxs font-mono font-medium">Boletim_Tecnico_Super_Rendimento.pdf</span>
                </div>
                <button
                  onClick={() => {
                    trackLandingClick();
                    alert("Download iniciado pelo RJR Asset Parser");
                  }}
                  className="p-1 rounded bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl hover:bg-slate-950/60 transition-colors border border-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00C49F]" />
                  <span className="text-xxs font-mono font-medium">FDS_selador_acrilico_primer.pdf</span>
                </div>
                <button
                  onClick={() => {
                    trackLandingClick();
                    alert("Download iniciado pelo RJR Asset Parser");
                  }}
                  className="p-1 rounded bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER AREA */}
      <footer className="mt-auto bg-slate-950 text-slate-400 border-t border-slate-900 py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white text-slate-950 rounded-lg flex items-center justify-center font-bold text-lg font-mono">B</div>
              <span className="font-sans font-bold text-base text-white tracking-tight">BELLACOR</span>
            </div>
            <p className="text-xxs leading-relaxed text-slate-500">
              Fábrica de Tintas e revestimentos de alta durabilidade e rendimento extremo homologado pela RJR Sync.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xxs">Fábrica Boituva</h4>
            <p className="text-xxs leading-relaxed text-slate-500">
              Rua Domingos Waldemar Bellucci, 200<br />
              Campo de Boituva, Boituva - SP<br />
              CEP: 18555-004<br />
              CNPJ: 04.346.443/0001-90
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xxs">Links Rápidos</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="#destaques" className="hover:text-white transition-colors">Produtos Estrelares</a></li>
              <li><a href="#catalogo" className="hover:text-white transition-colors">Vitrine de Cores</a></li>
              <li><a href="#documental" className="hover:text-white transition-colors">Segurança FDS</a></li>
              <li><button onClick={onNavigateToLogin} className="hover:text-white text-left transition-colors font-medium">Portal RJR Sync</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xxs">Newsletter Bellacor</h4>
            <p className="text-xxs text-slate-500 mb-3">Receba informes regulatórios e lançamentos de catálogo químicos.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const emInput = (e.target as any).email.value;
                if (!emInput) return;
                try {
                  const res = await fetch("/api/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emInput })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    alert(data.message);
                    (e.target as any).reset();
                  }
                } catch (err) {}
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="Seu e-mail corporativo"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-xxs text-white"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 hover:text-white px-3 text-xxs rounded-lg font-bold text-slate-200"
              >
                Inscrição
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[10px]">
          <p>© 2026 Bellacor Tintas Ltda. Todos os direitos reservados. Plataforma de contratos e leads monitorada por RJR Sync.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span>Boituva - SP, Brasil</span>
            <span>Estabilidade 99.9% Uptime</span>
          </div>
        </div>
      </footer>

      {/* DETAILED TECHNICAL CATALOG SPECS MODAL */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col border border-gray-150 max-h-[90vh]"
          >
            {/* Modal Title ribbon */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#0088FE] font-bold">{selectedProductDetails.category}</span>
                <h3 className="font-sans font-extrabold text-base leading-tight">{selectedProductDetails.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white text-xs border border-white/10 px-2 hover:bg-white/10"
              >
                Fechar [X]
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Images Swatch layout */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-slate-50 aspect-square rounded-xl overflow-hidden border border-gray-150 relative">
                    <img
                      referrerPolicy="no-referrer"
                      src={parseGoogleDriveLink(selectedProductDetails.image)}
                      alt={selectedProductDetails.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Colors dynamic swatch list */}
                  {selectedProductDetails.colors && selectedProductDetails.colors.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-150">
                      <span className="text-xxs uppercase tracking-wider font-bold text-slate-400 block mb-2">Amostragem de Cores de Catálogo</span>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProductDetails.colors.map((color, cIdx) => {
                          const parts = color.split("#");
                          const colorName = parts[0].trim();
                          const hex = parts[1] ? `#${parts[1].trim()}` : "#e2e8f0";
                          return (
                            <div key={cIdx} className="flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-md">
                              <span
                                className="w-4 h-4 rounded-full border border-gray-300 shrink-0 shadow-3xs"
                                style={{ backgroundColor: hex }}
                              />
                              <span className="text-[10px] text-slate-700 truncate font-medium title={colorName}">{colorName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Technical sheets grid details */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <h4 className="text-xs uppercase text-slate-400 font-bold">Descrição Comercial</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedProductDetails.description}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 grid grid-cols-2 gap-4 text-xxs">
                    <div>
                      <span className="text-[#0088FE] font-bold block">Diluição Oficial</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.dilution}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Diluente Recomendado</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.diluent}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Fim / Acabamento</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.finish}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Rendimento m²/demão</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.yieldPerM2}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Tempo de Secagem</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.dryingTime}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Cobertura de Volume</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.yieldTotal}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Área de Uso</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.areaOfUse}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Demãos Recomendadas</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.recommendedCoats} demãos de trabalho</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Propriedades de Odor</span>
                      <span className="text-slate-700 font-medium">{selectedProductDetails.odor}</span>
                    </div>
                    <div>
                      <span className="text-[#0088FE] font-bold block">Ação Antimofo</span>
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        {selectedProductDetails.antimold ? (
                          <span className="text-emerald-600 font-bold">✔ Ativo de Proteção</span>
                        ) : (
                          <span className="text-slate-400">Não aplicável</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Packaging variants list */}
                  {selectedProductDetails.variants && selectedProductDetails.variants.length > 0 && (
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-bold text-slate-400 block mb-2">Recipientes e Variante Prática</span>
                      <div className="space-y-1.5">
                        {selectedProductDetails.variants.map((v, vIdx) => (
                          <div key={vIdx} className="flex items-center justify-between text-xxs p-2 bg-slate-50 border border-gray-150 rounded-lg">
                            <span className="font-semibold text-slate-800">{v.size} ({v.colorName || "Branco Padrão"})</span>
                            <span className="font-mono text-[#00C49F] font-bold">Consulte Atacado</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedProductDetails(null);
                        onOpenLeadModal(selectedProductDetails.name);
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      Solicitar Cotação Direta do Item
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert("Exibição direta de boletins de testes em ambiente sandbox")}
                      className="px-4 py-2.5 border border-gray-200 text-slate-700 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Boletim Técnico PDF
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* LGPD COOKIE BAR CONSENT TRIGGER */}
      {showCookies && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950 text-white p-4 border-t border-slate-900/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto md:mb-4 md:rounded-2xl">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
            <p className="text-xxs text-slate-300 leading-normal max-w-2xl">
              Nossa plataforma armazena cookies e decodifica parâmetros de campanhas publicitárias do Google Analytics 4 por meio de URLs de rastreio (UTM) para monitorar cliques nos canais de Venda Direta de tintas, de acordo com o Manual de Regras da Bellacor e a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleAcceptCookies}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xxs font-bold rounded-lg transition-all"
            >
              Aceitar Rastreio
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
