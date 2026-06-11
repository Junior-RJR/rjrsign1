import React from "react";
import { motion } from "motion/react";
import { X, ShieldAlert, FileText, Lock } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="terms-modal-wrapper">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        id="terms-modal-card"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-[#0052FF] rounded-lg flex items-center justify-center border border-blue-105/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-sm text-slate-900 leading-tight">Termos de Uso & Privacidade</h3>
              <span className="text-[10px] text-slate-400 font-mono">Última atualização: Junho 2026</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-lg transition-colors cursor-pointer"
            id="terms-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 leading-relaxed font-sans" id="terms-modal-body">
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              1. Termos de Uso do Portal RJR Sign
            </h4>
            <p>
              O portal <strong>RJR Sign Portal</strong> é uma plataforma proprietária de gestão, arquivamento e colheita de assinaturas de contratos eletrônicos privados e de faturas mensais, sob operação técnica da contratada do Desenvolvedor <strong>Rogério Júnior</strong>.
            </p>
            <p>
              Ao acessar este portal, as partes concordam integralmente que as assinaturas aqui colhidas revestem-se de validade jurídica plena civil, com amparo legal nas diretrizes da MP nº 2.200-2/2001 e legislações correlatas brasileiras. A assinatura digital colhida por rastreamento de escrita ativa ou autenticada por firma digital constitui manifestação de vontade tácita livre e acordada entre as partes envolvidas.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              2. Política de Privacidade & Proteção de Dados (LGPD)
            </h4>
            <p>
              Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>, declaramos que os dados cadastrados, e-mails de acesso, registros de assinaturas digitais, carimbos de data/hora oficiais, metadados de IP, dados corporativos e de faturas recolhidos são estritamente confidenciais.
            </p>
            <p>
              <strong>Finalidade exclusiva do tratamento:</strong> As informações são armazenadas de forma segura e criptografada com o único objetivo de operacionalizar a assinatura de contratos e manter o controle de demonstrativos financeiros das mensalidades. Sob nenhuma hipótese os dados das empresas licenciadas, leads de captação industrial de produtos Bellacor ou representantes legais cadastrados serão transmitidos ou vendidos a terceiros sem consentimento formal prévio.
            </p>
            <p>
              <strong>Auditoria e Segurança Digital:</strong> Cada operação de assinatura colhe o endereço IP público de conexão correspondente ao terminal do signatário, hora exata via servidores globais padrão UTC, e hashes SHA-512 de segurança adicionados em banco para garantir a integridade indelével do documento.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-100 pt-4">
            <h4 className="font-bold text-slate-900 text-xs text-center">Responsabilidade Técnica</h4>
            <p className="text-center text-[11px] text-slate-400">
              Ambiente de sandbox empresarial e gestão comercial desenvolvido pelo Engenheiro Rogério Júnior.<br />
              Dúvidas ou solicitações de direitos de exclusão conforme a LGPD: <strong className="text-slate-600">contact@devrogeriojunior.com.br</strong>
            </p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xxs font-bold transition-colors cursor-pointer shadow-sm"
            id="terms-modal-ok-btn"
          >
            Entendido e De Acordo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
