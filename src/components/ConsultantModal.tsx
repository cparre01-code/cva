import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Shield, Percent, Check, AlertCircle, Award, Trash2 } from 'lucide-react';
import { Consultant, CargoConsultor } from '../types';

interface ConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'new' | 'edit';
  initialConsultant?: Partial<Consultant>;
  onSave: (consultant: Consultant) => Promise<void> | void;
  onDelete?: (idOrNome: string) => Promise<void> | void;
}

// Preset defaults for negotiation powers according to cargo
const CARGO_PRESETS: Record<CargoConsultor, {
  desconto_maximo: number;
  desconto_max_vista: number;
  margem_minima: number;
  comissao_padrao: number;
  pode_alterar_comissao: boolean;
  pode_aprovar_excecao: boolean;
  descricao: string;
}> = {
  diretor: {
    desconto_maximo: 25.0,
    desconto_max_vista: 15.0,
    margem_minima: 5.0,
    comissao_padrao: 3.0,
    pode_alterar_comissao: true,
    pode_aprovar_excecao: true,
    descricao: 'Alçada máxima: flexibilidade total para fechar parcerias, grandes contratos e aprovar exceções.',
  },
  gerente: {
    desconto_maximo: 12.0,
    desconto_max_vista: 8.0,
    margem_minima: 10.0,
    comissao_padrao: 2.5,
    pode_alterar_comissao: true,
    pode_aprovar_excecao: true,
    descricao: 'Alçada tática: autonomia intermediária de descontos e suporte às negociações dos vendedores.',
  },
  vendedor: {
    desconto_maximo: 5.0,
    desconto_max_vista: 5.0,
    margem_minima: 15.0,
    comissao_padrao: 2.0,
    pode_alterar_comissao: false,
    pode_aprovar_excecao: false,
    descricao: 'Alçada operacional: descontos padrão de tabela com foco em manter a margem comercial mínima.',
  },
};

export const ConsultantModal: React.FC<ConsultantModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialConsultant,
  onSave,
  onDelete,
}) => {
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState<CargoConsultor>('vendedor');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Negotiation parameters
  const [descontoMaximo, setDescontoMaximo] = useState<number>(5.0);
  const [descontoMaxVista, setDescontoMaxVista] = useState<number>(5.0);
  const [margemMinima, setMargemMinima] = useState<number>(15.0);
  const [comissaoPadrao, setComissaoPadrao] = useState<number>(2.0);
  const [podeAlterarComissao, setPodeAlterarComissao] = useState<boolean>(false);
  const [podeAprovarExcecao, setPodeAprovarExcecao] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialCargo = (initialConsultant?.cargo as CargoConsultor) || 'vendedor';
      const preset = CARGO_PRESETS[initialCargo];

      setNome(initialConsultant?.nome || '');
      setCargo(initialCargo);
      setEmail(initialConsultant?.email || '');
      setTelefone(initialConsultant?.telefone || '');
      setCpf(initialConsultant?.cpf || '');
      
      setDescontoMaximo(initialConsultant?.desconto_maximo !== undefined ? Number(initialConsultant.desconto_maximo) : preset.desconto_maximo);
      setDescontoMaxVista(initialConsultant?.desconto_max_vista !== undefined ? Number(initialConsultant.desconto_max_vista) : preset.desconto_max_vista);
      setMargemMinima(initialConsultant?.margem_minima !== undefined ? Number(initialConsultant.margem_minima) : preset.margem_minima);
      setComissaoPadrao(initialConsultant?.comissao_padrao !== undefined ? Number(initialConsultant.comissao_padrao) : preset.comissao_padrao);
      setPodeAlterarComissao(initialConsultant?.pode_alterar_comissao !== undefined ? Boolean(initialConsultant.pode_alterar_comissao) : preset.pode_alterar_comissao);
      setPodeAprovarExcecao(initialConsultant?.pode_aprovar_excecao !== undefined ? Boolean(initialConsultant.pode_aprovar_excecao) : preset.pode_aprovar_excecao);
      setAtivo(initialConsultant?.ativo !== undefined ? Boolean(initialConsultant.ativo) : true);

      setErrorMsg('');
      setIsSaving(false);
    }
  }, [isOpen, initialConsultant]);

  const handleCargoChange = (newCargo: CargoConsultor) => {
    setCargo(newCargo);
    const preset = CARGO_PRESETS[newCargo];
    setDescontoMaximo(preset.desconto_maximo);
    setDescontoMaxVista(preset.desconto_max_vista);
    setMargemMinima(preset.margem_minima);
    setComissaoPadrao(preset.comissao_padrao);
    setPodeAlterarComissao(preset.pode_alterar_comissao);
    setPodeAprovarExcecao(preset.pode_aprovar_excecao);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O nome do consultor é obrigatório.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const consultantData: Consultant = {
      id: initialConsultant?.id,
      nome: nome.trim(),
      cargo,
      email: email.trim(),
      telefone: telefone.trim(),
      cpf: cpf.trim(),
      desconto_maximo: Number(descontoMaximo),
      desconto_max_vista: Number(descontoMaxVista),
      margem_minima: Number(margemMinima),
      comissao_padrao: Number(comissaoPadrao),
      pode_alterar_comissao: podeAlterarComissao,
      pode_aprovar_excecao: podeAprovarExcecao,
      ativo,
    };

    try {
      await onSave(consultantData);
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro ao salvar consultor: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {mode === 'new' ? 'Cadastrar Consultor de Vendas' : 'Editar Consultor de Vendas'}
              </h2>
              <p className="text-xs text-slate-500">
                Classificação por nível de alçada comercial e poder de negociação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {/* Nome e Cargo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Nome do Consultor *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo do vendedor, gerente ou diretor"
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Seleção do Cargo / Classificação */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Cargo / Classificação de Alçada *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCargoChange('diretor')}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${
                  cargo === 'diretor'
                    ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-300 font-bold text-purple-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Diretor</span>
                  {cargo === 'diretor' && <Check className="w-3.5 h-3.5 text-purple-700" />}
                </div>
                <div className="text-[10px] text-purple-700 mt-0.5">Alçada 25% desc.</div>
              </button>

              <button
                type="button"
                onClick={() => handleCargoChange('gerente')}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${
                  cargo === 'gerente'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-300 font-bold text-blue-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Gerente</span>
                  {cargo === 'gerente' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                </div>
                <div className="text-[10px] text-blue-700 mt-0.5">Alçada 12% desc.</div>
              </button>

              <button
                type="button"
                onClick={() => handleCargoChange('vendedor')}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${
                  cargo === 'vendedor'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-300 font-bold text-emerald-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Vendedor</span>
                  {cargo === 'vendedor' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Alçada 5% desc.</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
              {CARGO_PRESETS[cargo].descricao}
            </p>
          </div>

          {/* Dados de Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(67) 99999-9999"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="consultor@cva.com.br"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Painel de Alçadas e Poder de Negociação */}
          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-purple-950 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span>Poder de Negociação e Parâmetros</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                  Desc. Máx Geral (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={descontoMaximo}
                    onChange={(e) => setDescontoMaximo(parseFloat(e.target.value) || 0)}
                    className="w-full pr-6 pl-2.5 py-1.5 bg-white text-xs font-semibold border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                  Desc. Máx à Vista (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={descontoMaxVista}
                    onChange={(e) => setDescontoMaxVista(parseFloat(e.target.value) || 0)}
                    className="w-full pr-6 pl-2.5 py-1.5 bg-white text-xs font-semibold border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                  Margem Mínima (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={margemMinima}
                    onChange={(e) => setMargemMinima(parseFloat(e.target.value) || 0)}
                    className="w-full pr-6 pl-2.5 py-1.5 bg-white text-xs font-semibold border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                  Comissão Padrão (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={comissaoPadrao}
                    onChange={(e) => setComissaoPadrao(parseFloat(e.target.value) || 0)}
                    className="w-full pr-6 pl-2.5 py-1.5 bg-white text-xs font-semibold border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={podeAlterarComissao}
                  onChange={(e) => setPodeAlterarComissao(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-700 font-medium">Pode negociar comissão própria</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={podeAprovarExcecao}
                  onChange={(e) => setPodeAprovarExcecao(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-700 font-medium">Pode aprovar exceção comercial</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-emerald-800 font-semibold">Consultor Ativo</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {mode === 'edit' && onDelete && initialConsultant?.nome ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Tem certeza que deseja excluir o consultor "${nome}"?`)) {
                    await onDelete(initialConsultant.id || initialConsultant.nome || nome);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Consultor</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : mode === 'new' ? 'Salvar Consultor' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
