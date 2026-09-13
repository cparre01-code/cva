import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Building, Briefcase, Award, Check, AlertCircle, Percent, DollarSign, Trash2 } from 'lucide-react';
import { Profissional } from '../types';

interface ProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'new' | 'edit';
  initialProfissional?: Partial<Profissional>;
  onSave: (prof: Profissional) => Promise<void> | void;
  onDelete?: (idOrNome: string) => Promise<void> | void;
}

const TIPOS_PROFISSIONAL = [
  'Arquiteto(a)',
  'Designer de Interiores',
  'Engenheiro(a) Civil',
  'Paisagista',
  'Construtor(a) / Empreiteiro(a)',
  'Outro Parceiro'
];

export const ProfessionalModal: React.FC<ProfessionalModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialProfissional,
  onSave,
  onDelete,
}) => {
  const [nome, setNome] = useState('');
  const [escritorio, setEscritorio] = useState('');
  const [tipo, setTipo] = useState('Arquiteto(a)');
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('Campo Grande');
  const [uf, setUf] = useState('MS');
  const [cep, setCep] = useState('');
  const [percentualRt, setPercentualRt] = useState<number>(5.0);
  const [chavePix, setChavePix] = useState('');
  const [favorecidoPix, setFavorecidoPix] = useState('');
  const [bancoInfo, setBancoInfo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNome(initialProfissional?.nome || '');
      setEscritorio(initialProfissional?.escritorio || '');
      setTipo(initialProfissional?.tipo || 'Arquiteto(a)');
      setRegistroProfissional(initialProfissional?.registro_profissional || '');
      setCpfCnpj(initialProfissional?.cpf_cnpj || '');
      setTelefone(initialProfissional?.telefone || '');
      setEmail(initialProfissional?.email || '');
      setInstagram(initialProfissional?.instagram || '');
      setEndereco(initialProfissional?.endereco || '');
      setCidade(initialProfissional?.cidade || 'Campo Grande');
      setUf(initialProfissional?.uf || 'MS');
      setCep(initialProfissional?.cep || '');
      setPercentualRt(initialProfissional?.percentual_rt !== undefined ? Number(initialProfissional.percentual_rt) : 5.0);
      setChavePix(initialProfissional?.chave_pix || '');
      setFavorecidoPix(initialProfissional?.favorecido_pix || '');
      setBancoInfo(initialProfissional?.banco_info || '');
      setObservacoes(initialProfissional?.observacoes || '');

      setErrorMsg('');
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [isOpen, initialProfissional]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O nome do profissional é obrigatório.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const profData: Profissional = {
      id: initialProfissional?.id,
      nome: nome.trim(),
      escritorio: escritorio.trim(),
      tipo,
      registro_profissional: registroProfissional.trim(),
      cpf_cnpj: cpfCnpj.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      instagram: instagram.trim(),
      endereco: endereco.trim(),
      cidade: cidade.trim() || 'Campo Grande',
      uf: uf.trim() || 'MS',
      cep: cep.trim(),
      percentual_rt: Number(percentualRt) || 0,
      chave_pix: chavePix.trim(),
      favorecido_pix: favorecidoPix.trim(),
      banco_info: bancoInfo.trim(),
      observacoes: observacoes.trim(),
      status: 'ativo'
    };

    try {
      await onSave(profData);
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro ao salvar profissional: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !initialProfissional) return;
    const target = initialProfissional.id || initialProfissional.nome || nome;
    if (!target) return;

    if (!window.confirm(`Tem certeza que deseja excluir o cadastro do profissional "${nome}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(target);
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro ao excluir profissional: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {mode === 'new' ? 'Cadastrar Profissional Parceiro' : 'Editar Dados do Profissional'}
              </h2>
              <p className="text-xs text-slate-500">
                Arquiteto, designer de interiores ou parceiro comercial especificado
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
          {/* Nome e Escritório */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nome do Profissional *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo do Arquiteto(a)..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Escritório / Razão Social
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={escritorio}
                  onChange={(e) => setEscritorio(e.target.value)}
                  placeholder="Ex: Studio Arquitetura & Design"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Atuação e Registro Profissional */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tipo de Atuação
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none bg-white"
              >
                {TIPOS_PROFISSIONAL.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Registro (CAU / CREA / ABD)
              </label>
              <input
                type="text"
                value={registroProfissional}
                onChange={(e) => setRegistroProfissional(e.target.value)}
                placeholder="Ex: CAU A12345-6"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                CPF / CNPJ
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                E-mail Comercial
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@escritorio.com.br"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Instagram / Portfólio
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@arquiteto"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Reserva Técnica (RT) e Dados de Pagamento */}
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-purple-950 font-bold text-xs uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-purple-700" />
              <span>Reserva Técnica (RT) & Pagamento</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                  % RT Padrão Acordado
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={percentualRt}
                    onChange={(e) => setPercentualRt(parseFloat(e.target.value) || 0)}
                    className="w-full pr-6 pl-2.5 py-1.5 bg-white text-xs font-semibold border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  placeholder="CPF, CNPJ, E-mail ou Telefone"
                  className="w-full px-2.5 py-1.5 bg-white text-xs border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                  Favorecido PIX
                </label>
                <input
                  type="text"
                  value={favorecidoPix}
                  onChange={(e) => setFavorecidoPix(e.target.value)}
                  placeholder="Nome do titular da conta"
                  className="w-full px-2.5 py-1.5 bg-white text-xs border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                Dados Bancários (Opcional)
              </label>
              <input
                type="text"
                value={bancoInfo}
                onChange={(e) => setBancoInfo(e.target.value)}
                placeholder="Banco, Agência e Conta Corrente..."
                className="w-full px-2.5 py-1.5 bg-white text-xs border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Endereço
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, sala, bairro..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cidade / UF
              </label>
              <input
                type="text"
                value={`${cidade} / ${uf}`}
                onChange={(e) => {
                  const parts = e.target.value.split('/');
                  setCidade(parts[0]?.trim() || '');
                  if (parts[1]) setUf(parts[1].trim());
                }}
                placeholder="Campo Grande / MS"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Observações Internas
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Preferências de especificação, histórico de atendimento, projetos em andamento..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-none resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {mode === 'edit' && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Excluindo...' : 'Excluir Profissional'}</span>
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
                <span>{isSaving ? 'Salvando...' : mode === 'new' ? 'Salvar Profissional' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
