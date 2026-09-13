import React, { useRef } from 'react';
import { X, FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, Client } from '../types';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  clients: Client[];
  consultores: string[];
  onImportData: (products: Product[], clients: Client[], consultores: string[]) => void;
}

export const ExcelSyncModal: React.FC<ExcelSyncModalProps> = ({
  isOpen,
  onClose,
  products,
  clients,
  consultores,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        let parsedProducts: Product[] = [];
        let parsedClients: Client[] = [];
        let parsedConsultores: string[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const sNameLower = sheetName.trim().toLowerCase();
          const sheet = workbook.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
          if (!rows || rows.length < 2) return;

          // Parse Clients
          if (sNameLower.includes('cliente')) {
            for (let r = 1; r < rows.length; r++) {
              const row = rows[r];
              if (!row || !row[0]) continue;
              const nome = String(row[0]).trim();
              if (!nome || nome.toLowerCase() === 'nan') continue;
              parsedClients.push({
                nome,
                razao: row[1] ? String(row[1]).trim() : nome,
                cnpj: row[2] ? String(row[2]).trim() : '',
                cpf: row[3] ? String(row[3]).trim() : '',
                doc: (row[2] || row[3]) ? String(row[2] || row[3]).trim() : '',
                ie: row[9] ? String(row[9]).trim() : '',
                email: row[10] ? String(row[10]).trim() : '',
                tel: row[11] ? String(row[11]).trim() : '',
                cep: row[13] ? String(row[13]).trim() : '',
                cidade_uf: `${row[15] || 'Campo Grande'} / ${row[14] || 'MS'}`,
                endereco: row[16] ? String(row[16]).trim() : '',
                status: row[7] ? String(row[7]).trim() : 'ativado',
              });
            }
          }

          // Parse Consultores
          if (sNameLower.includes('consultor')) {
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r];
              if (!row) continue;
              for (let c = 0; c < row.length; c++) {
                const val = row[c] ? String(row[c]).trim() : '';
                if (val && !/consultor/i.test(val) && !parsedConsultores.includes(val)) {
                  parsedConsultores.push(val);
                }
              }
            }
          }

          // Parse Products
          if (sNameLower.includes('produto') || sNameLower.includes('consolidada') || sNameLower.includes('crissair') || sNameLower.includes('debacco')) {
            for (let r = 1; r < rows.length; r++) {
              const row = rows[r];
              if (!row || !row[1]) continue;
              const code = String(row[1] || row[0] || '').trim();
              const name = String(row[2] || row[1] || '').trim();
              if (!code || !name || /código/i.test(code)) continue;

              const toNum = (v: any) => {
                if (typeof v === 'number') return v;
                if (!v) return 0;
                const n = parseFloat(String(v).replace(/[^\d,-]/g, '').replace(',', '.'));
                return isNaN(n) ? 0 : n;
              };

              parsedProducts.push({
                id: parsedProducts.length,
                brand: row[3] ? String(row[3]).trim() : (sheetName || 'Geral'),
                category: row[4] ? String(row[4]).trim() : 'Geral',
                code,
                name,
                line: row[5] ? String(row[5]).trim() : '-',
                status: 'DISPONÍVEL',
                price_direto: toNum(row[6]),
                price_revenda: toNum(row[7]),
                price_vista: toNum(row[7]),
                price_28: toNum(row[7]),
                price_56: toNum(row[7]),
                price_84: toNum(row[7]),
                tensao: '220V',
                medidas: '-',
                link: '',
              });
            }
          }
        });

        onImportData(parsedProducts, parsedClients, parsedConsultores);
        alert(`Planilha importada com sucesso!\nProdutos: ${parsedProducts.length}\nClientes: ${parsedClients.length}\nConsultores: ${parsedConsultores.length}`);
        onClose();
      } catch (err: any) {
        console.error('Erro ao importar planilha:', err);
        alert('Erro ao ler a planilha Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Products Sheet
      const prodRows = products.map(p => ({
        Marca: p.brand,
        Categoria: p.category,
        Código: p.code,
        Produto: p.name,
        Linha: p.line,
        Tensão: p.tensao,
        'Preço Direto': p.price_direto,
        'Preço Revenda': p.price_revenda,
        Medidas: p.medidas,
        Link: p.link,
      }));
      const wsProd = XLSX.utils.json_to_sheet(prodRows);
      XLSX.utils.book_append_sheet(wb, wsProd, 'Tabela Consolidada');

      // Clients Sheet
      const cliRows = clients.map(c => ({
        Nome: c.nome,
        'Razão Social': c.razao || c.nome,
        'CPF / CNPJ': c.doc,
        'Inscrição Estadual': c.ie || '',
        'Telefone': c.tel,
        'Email': c.email,
        'Cidade / UF': c.cidade_uf,
        Endereço: c.endereco,
        CEP: c.cep,
        Status: c.status || 'ativado',
      }));
      const wsCli = XLSX.utils.json_to_sheet(cliRows);
      XLSX.utils.book_append_sheet(wb, wsCli, 'Clientes');

      // Consultores Sheet
      const consRows = consultores.map(name => ({ 'Consultor de Venda': name }));
      const wsCons = XLSX.utils.json_to_sheet(consRows);
      XLSX.utils.book_append_sheet(wb, wsCons, 'Consultores');

      XLSX.writeFile(wb, 'TABELA CVA.xlsx');
    } catch (err: any) {
      alert('Erro ao exportar planilha: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Sincronização Excel</h2>
              <p className="text-xs text-slate-500">Importar ou exportar TABELA CVA.xlsx</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <h3 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Dados Atuais Carregados</span>
            </h3>
            <div className="grid grid-cols-3 gap-2 text-slate-700">
              <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                <div className="font-bold text-emerald-900 text-sm">{products.length}</div>
                <div className="text-[10px] text-slate-500">Produtos</div>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                <div className="font-bold text-emerald-900 text-sm">{clients.length}</div>
                <div className="text-[10px] text-slate-500">Clientes</div>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                <div className="font-bold text-emerald-900 text-sm">{consultores.length}</div>
                <div className="text-[10px] text-slate-500">Consultores</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Carregar Nova Planilha (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Baixar Planilha Atualizada (TABELA CVA.xlsx)</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
