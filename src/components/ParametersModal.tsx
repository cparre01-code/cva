import React from 'react';
import { X, Sliders, Tags, Truck, Check, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ProposalData, Consultant } from '../types';

interface ParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ProposalData;
  onUpdateProposal: (updates: Partial<ProposalData>) => void;
  consultant?: Consultant;
}

export const ParametersModal: React.FC<ParametersModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateProposal,
  consultant,
}) => {
  if (!isOpen) return null;

  const cargo = consultant?.cargo || 'vendedor';
  const cargoLabel = cargo === 'diretor' ? 'Diretoria' : cargo === 'gerente' ? 'Gerência' : 'Vendedor';
  const maxDescVista = consultant?.desconto_max_vista ?? 5.0;
  const isDescVistaExceeded = proposal.desc_vista_percent > maxDescVista;
  const hasAlcadaAlert = isDescVistaExceeded;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1a365d] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Parâmetros Comerciais da Proposta
              </h3>
              <p className="text-xs text-blue-200">
                Ajuste os percentuais de desconto, juros e condições contratuais
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Descontos e Pagamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Tags className="w-4 h-4 text-blue-900" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Descontos &amp; Regras de Pagamento
                </h4>
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                Alçada ativa: <span className="font-bold text-slate-800">{cargoLabel} ({consultant?.nome || proposal.consultor || 'Padrão'})</span>
              </div>
            </div>

            {/* Banner de Validação de Alçada */}
            {hasAlcadaAlert ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-900 animate-in fade-in duration-150">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed flex-1">
                  <span className="font-bold block text-red-950">
                    ⚠️ Alçada de Desconto Excedida!
                  </span>
                  <div>
                    • <strong>Desconto À Vista ({proposal.desc_vista_percent}%):</strong> Ultrapassa o limite de <strong>{maxDescVista}%</strong> configurado para {cargoLabel}.
                  </div>
                  <span className="text-[11px] text-red-700 block mt-1 font-semibold">
                    Esta proposta requer autorização formal de Gerência ou Diretoria para emissão.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Desconto à vista dentro da alçada autorizada para <strong>{cargoLabel}</strong> (Máx. À Vista: {maxDescVista}%).
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Desconto à Vista */}
              <div className={`border rounded-lg p-3 space-y-2 ${isDescVistaExceeded ? 'bg-red-50/50 border-red-300 ring-1 ring-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Desconto À Vista (PIX / Transf.)
                  </label>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isDescVistaExceeded
                      ? 'text-red-700 bg-red-100 border-red-300'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {proposal.desc_vista_percent}%
                  </span>
                </div>
                {isDescVistaExceeded && (
                  <div className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Excede alçada de {maxDescVista}% para {cargoLabel}!</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={proposal.desc_vista_percent}
                    onChange={(e) => onUpdateProposal({ desc_vista_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold text-sm">%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span>Atalhos:</span>
                  {[3, 5, 7, 10].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateProposal({ desc_vista_percent: val })}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        proposal.desc_vista_percent === val 
                          ? 'bg-blue-900 text-white border-blue-900 font-bold' 
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Juros Cartão de Crédito */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Juros de Cartão de Crédito (% a.m.)
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {proposal.juros_revenda_percent}% a.m.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={proposal.juros_revenda_percent}
                    onChange={(e) => onUpdateProposal({ juros_revenda_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold text-xs shrink-0">% a.m.</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span>Atalhos:</span>
                  {[0.5, 1.0, 1.5, 2.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateProposal({ juros_revenda_percent: val })}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        proposal.juros_revenda_percent === val 
                          ? 'bg-blue-900 text-white border-blue-900 font-bold' 
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {val}% {val === 1.0 ? '(Padrão)' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Taxa padrão fixada em 1% a.m. para parcelamento em cartão na Revenda.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Observações Comerciais */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <Truck className="w-4 h-4 text-blue-900" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Observações Comerciais &amp; Contratuais
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Instalação */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instalação</label>
                <input
                  type="text"
                  value={proposal.obs_instalacao}
                  onChange={(e) => onUpdateProposal({ obs_instalacao: e.target.value })}
                  placeholder="Ex: Não Incluso / Incluso sob agendamento"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-slate-800"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Não Incluso', 'Incluso (Campo Grande)', 'Sob Consulta'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => onUpdateProposal({ obs_instalacao: sug })}
                      className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entrega */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entrega</label>
                <input
                  type="text"
                  value={proposal.obs_entrega}
                  onChange={(e) => onUpdateProposal({ obs_entrega: e.target.value })}
                  placeholder="Ex: Incluso (Dentro da cidade de Campo Grande / MS)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-slate-800"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Incluso (Dentro de Campo Grande / MS)', 'Frete CIF Incluso', 'FOB (Retirada na Loja)'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => onUpdateProposal({ obs_entrega: sug })}
                      className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prazo de Entrega */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prazo de Entrega</label>
                <input
                  type="text"
                  value={proposal.obs_prazo}
                  onChange={(e) => onUpdateProposal({ obs_prazo: e.target.value })}
                  placeholder="Ex: Sob consulta - verificar a disponibilidade do produto."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-slate-800"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Sob consulta - verificar disponibilidade', 'Pronta Entrega (em até 3 dias úteis)', '20 a 30 dias úteis'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => onUpdateProposal({ obs_prazo: sug })}
                      className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Garantia */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Garantia de Fábrica</label>
                <input
                  type="text"
                  value={proposal.obs_garantia}
                  onChange={(e) => onUpdateProposal({ obs_garantia: e.target.value })}
                  placeholder="Ex: 03 ANOS"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-slate-800"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {['03 ANOS', '01 ANO', '02 ANOS', '05 ANOS'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => onUpdateProposal({ obs_garantia: sug })}
                      className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Concluir &amp; Aplicar Parâmetros</span>
          </button>
        </div>
      </div>
    </div>
  );
};
