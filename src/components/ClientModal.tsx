import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Building, Briefcase, FileText, Check, AlertCircle } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'new' | 'edit';
  initialClient?: Partial<Client>;
  onSave: (client: Client) => Promise<void> | void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialClient,
  onSave,
}) => {
  const [nome, setNome] = useState('');
  const [razao, setRazao] = useState('');
  const [doc, setDoc] = useState('');
  const [ie, setIe] = useState('');
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [num, setNum] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidadeUf, setCidadeUf] = useState('Campo Grande / MS');
  const [cep, setCep] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNome(initialClient?.nome || '');
      setRazao(initialClient?.razao || initialClient?.nome || '');
      setDoc(initialClient?.doc || initialClient?.cnpj || initialClient?.cpf || '');
      setIe(initialClient?.ie || '');
      setTel(initialClient?.tel || '');
      setEmail(initialClient?.email || '');

      // Decompõe endereço ou usa campos individuais
      const initNum = initialClient?.num || '';
      const initBairro = initialClient?.bairro || '';
      const rawEnd = initialClient?.endereco || '';
      let initLogradouro = initialClient?.logradouro || '';

      if (!initLogradouro && rawEnd) {
        initLogradouro = rawEnd;
      }

      setLogradouro(initLogradouro);
      setNum(initNum);
      setBairro(initBairro);
      setCidadeUf(initialClient?.cidade_uf || 'Campo Grande / MS');
      setCep(initialClient?.cep || '');
      setErrorMsg('');
      setIsSaving(false);
    }
  }, [isOpen, initialClient]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O nome do cliente é obrigatório.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    // Monta endereço completo consolidado caso campos separados sejam preenchidos
    let fullEndereco = logradouro.trim();
    if (num.trim()) {
      fullEndereco += (fullEndereco ? `, ${num.trim()}` : num.trim());
    }
    if (bairro.trim()) {
      fullEndereco += (fullEndereco ? ` - ${bairro.trim()}` : bairro.trim());
    }

    const clientData: Client = {
      id: initialClient?.id,
      nome: nome.trim(),
      razao: razao.trim() || nome.trim(),
      doc: doc.trim(),
      cnpj: doc.includes('/') ? doc.trim() : '',
      cpf: !doc.includes('/') ? doc.trim() : '',
      ie: ie.trim(),
      tel: tel.trim(),
      email: email.trim(),
      logradouro: logradouro.trim(),
      num: num.trim(),
      bairro: bairro.trim(),
      endereco: fullEndereco || logradouro.trim(),
      cidade_uf: cidadeUf.trim() || 'Campo Grande / MS',
      cep: cep.trim(),
      status: initialClient?.status || 'ativado',
    };

    try {
      await onSave(clientData);
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro ao salvar cliente: ' + (err.message || 'Tente novamente.'));
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
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {mode === 'new' ? 'Cadastrar Novo Cliente' : 'Editar Dados do Cliente'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'new' ? 'Preencha os dados cadastrais para salvar no Supabase' : 'Atualize as informações do cliente'}
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

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Nome do Cliente / Razão Social *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: ACROPOLE EMPREENDIMENTOS ou NOME DA PESSOA"
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                CPF / CNPJ
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={doc}
                  onChange={(e) => setDoc(e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Inscrição Estadual (IE)
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ie}
                  onChange={(e) => setIe(e.target.value)}
                  placeholder="Ex: 28.123.456-7 ou Isento"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="(67) 99999-9999"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Endereço separado: Logradouro, Número, Bairro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Logradouro (Rua / Av.)
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  placeholder="Ex: Rua Dos Jardins, Av. Afonso Pena"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Número
              </label>
              <input
                type="text"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                placeholder="Ex: 276 / S/N"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Ex: Residencial Damha II"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cidade / UF
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cidadeUf}
                  onChange={(e) => setCidadeUf(e.target.value)}
                  placeholder="Campo Grande / MS"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="79000-000"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
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
              className="px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : mode === 'new' ? 'Salvar Novo Cliente' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
