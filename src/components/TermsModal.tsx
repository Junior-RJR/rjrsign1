import React from "react";
import { motion } from "motion/react";
import { X, Shield, Lock, FileText, CheckCircle } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm leading-tight">Termos de Uso e Privacidade</h3>
              <p className="text-[10px] text-slate-400 font-mono">Última atualização: Junho 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all text-xs flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Fechar
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-600 text-xs leading-relaxed font-sans">
          
          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <FileText className="w-4.5 h-4.5 text-blue-500" />
              1. Objeto e Declaração Legal
            </h4>
            <p>
              O presente instrumento regula o acesso e utilização do ecossistema tecnológico <strong>RJR SIGN</strong>.
              Nossa plataforma atua como facilitadora de ordens de assinaturas eletrônicas autenticadas e 100% legalizadas
              para prestação de serviços civis, faturamentos corporativos recorrentes e relatórios analíticos, respeitando
              toda a legislação em vigor em solo nacional.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Shield className="w-4.5 h-4.5 text-emerald-500" />
              2. Validade das Assinaturas Eletrônicas
            </h4>
            <p>
              Todas as firmas declaradas na plataforma RJR SIGN — sejam digitadas ou desenhadas por lousa virtual — 
              são homologadas nos termos da <strong>Medida Provisória nº 2.200-2/2001</strong> e da <strong>Lei nº 14.063/2020</strong>.
              Para fins de blindagem jurídica e conformidade civil, gravamos em log imutável: o endereço IP de origem do signatário, 
              o carimbo de data/hora (UTC), metadados do agente de usuário e imagens rasterizadas do consentimento.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Lock className="w-4.5 h-4.5 text-indigo-500" />
              3. Privacidade, Segurança e LGPD
            </h4>
            <p>
              Em conformidade estrita com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>, 
              garantimos que as informações cadastrais corporativas, termos pactuados, históricos financeiros e dados de representantes 
              são armazenados em servidores seguros, com controle restrito de credenciais físicas e lógicas. Seus dados cadastrais 
              apenas são utilizados para as finalidades contratuais pactuadas e nunca comercializados com terceiras partes.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4.5 h-4.5 text-blue-500" />
              4. Responsabilidades do Usuário
            </h4>
            <p>
              O usuário cadastrado compromete-se a prover dados verídicos e a resguardar a integridade de sua credencial primária 
              de acesso (senha de primeiro acesso e senhas redefinidas). Qualquer transação eletrônica realizada com êxito sob uma 
              credencial autenticada carrega valor civil pleno pela manifestação inequívoca de interesse.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 font-sans flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-550 text-white rounded-xl text-xxs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Li e Concordo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
