import { Product, Client, Consultant, Profissional } from '../types';

export const COMPANY_INFO = {
  name: 'CVA COMÉRCIO E SERVIÇOS LTDA',
  address: 'Rua Dos Jardins, 276 – Loja 06 - Residencial Damha II',
  city: 'Campo Grande – MS / CEP: 79046-048',
  email: 'cva.comerciocg@gmail.com',
  bank: 'SICREDI UNIÃO MT/TO',
  agency: '0911',
  account: '236635',
  pix: '54890859000142',
  pixName: 'CVA COMERCIO E SERVIÇOS LTDA'
};

export const DEFAULT_CONSULTORES_DETALHES: Consultant[] = [
  {
    nome: 'Carlos Alberto Parré',
    cargo: 'diretor',
    desconto_maximo: 15.0,
    desconto_max_vista: 15.0,
    margem_minima: 10.0,
    comissao_padrao: 2.0,
    pode_alterar_comissao: true,
    pode_aprovar_excecao: true,
    ativo: true,
  },
  {
    nome: 'Fernando Guerra',
    cargo: 'gerente',
    desconto_maximo: 10.0,
    desconto_max_vista: 10.0,
    margem_minima: 12.0,
    comissao_padrao: 2.0,
    pode_alterar_comissao: false,
    pode_aprovar_excecao: true,
    ativo: true,
  },
  {
    nome: 'Mateus Veronese',
    cargo: 'vendedor',
    desconto_maximo: 0.0,
    desconto_max_vista: 5.0,
    margem_minima: 15.0,
    comissao_padrao: 2.0,
    pode_alterar_comissao: false,
    pode_aprovar_excecao: false,
    ativo: true,
  },
  {
    nome: 'Glauco de Oliveira',
    cargo: 'vendedor',
    desconto_maximo: 0.0,
    desconto_max_vista: 5.0,
    margem_minima: 15.0,
    comissao_padrao: 2.0,
    pode_alterar_comissao: false,
    pode_aprovar_excecao: false,
    ativo: true,
  }
];

export const DEFAULT_CONSULTORES: string[] = DEFAULT_CONSULTORES_DETALHES.map(c => c.nome);

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 0, brand: "Crissair", category: "Coifas", code: "072500", name: "Coifa Dow Draft (WD41G3) 220V", line: "Signature ITA", tensao: "220V", status: "DISPONÍVEL", price_direto: 27990.0, price_revenda: 16794.0, price_vista: 16794.0, price_28: 16794.0, price_56: 16794.0, price_84: 16794.0, medidas: "-", link: "https://crissair.com.br" },
  { id: 1, brand: "Crissair", category: "Coifas", code: "072501", name: "Coifa Roof Plane (WD662) 220V", line: "Signature ITA", tensao: "220V", status: "AGUARDANDO PRAZO", price_direto: 22990.0, price_revenda: 13794.0, price_vista: 13794.0, price_28: 13794.0, price_56: 13794.0, price_84: 13794.0, medidas: "-", link: "" },
  { id: 2, brand: "Crissair", category: "Coifas", code: "035903", name: "Coifa Drito Plane Black (CRR08.9G3 Black) 220V", line: "All Black ITA", tensao: "220V", status: "DISPONÍVEL", price_direto: 12970.0, price_revenda: 7782.0, price_vista: 7782.0, price_28: 7782.0, price_56: 7782.0, price_84: 7782.0, medidas: "-", link: "" },
  { id: 3, brand: "Crissair", category: "Coifas", code: "070194", name: "Coifa Drito Plane Inox (CRR08.9G3 Inox) 220V", line: "Signature ITA", tensao: "220V", status: "DISPONÍVEL", price_direto: 14140.0, price_revenda: 8484.0, price_vista: 8484.0, price_28: 8484.0, price_56: 8484.0, price_84: 8484.0, medidas: "-", link: "" },
  { id: 4, brand: "Crissair", category: "Coifas", code: "071320", name: "Coifa Isola Cilindro Black 220V", line: "All Black ITA", tensao: "220V", status: "DISPONÍVEL", price_direto: 13790.0, price_revenda: 8274.0, price_vista: 8274.0, price_28: 8274.0, price_56: 8274.0, price_84: 8274.0, medidas: "-", link: "" },
  { id: 5, brand: "Crissair", category: "Coifas", code: "071687", name: "Coifa Soft Isola (N139 Black G5) 220V", line: "Signature", tensao: "220V", status: "DISPONÍVEL", price_direto: 9450.0, price_revenda: 4914.0, price_vista: 4914.0, price_28: 4914.0, price_56: 4914.0, price_84: 4914.0, medidas: "-", link: "" },
  { id: 6, brand: "Crissair", category: "Coifas", code: "071980", name: "Coifa de Embutir 90 Inox (127V / 220V)", line: "Versatile", tensao: "220V", status: "DISPONÍVEL", price_direto: 4790.0, price_revenda: 2491.0, price_vista: 2491.0, price_28: 2491.0, price_56: 2491.0, price_84: 2491.0, medidas: "-", link: "" },
  { id: 7, brand: "Crissair", category: "Cooktops", code: "035935", name: "Cooktop Semifilo 90 (CCP900) Bivolt", line: "Signature", tensao: "Bivolt", status: "DISPONÍVEL", price_direto: 8990.0, price_revenda: 5574.0, price_vista: 5574.0, price_28: 5574.0, price_56: 5574.0, price_84: 5574.0, medidas: "860x500 mm", link: "" },
  { id: 8, brand: "Crissair", category: "Cooktops", code: "035934", name: "Cooktop Semi-filo 75 (CCP750) Bivolt", line: "Signature", tensao: "Bivolt", status: "DISPONÍVEL", price_direto: 7990.0, price_revenda: 4954.0, price_vista: 4954.0, price_28: 4954.0, price_56: 4954.0, price_84: 4954.0, medidas: "750x510 mm", link: "" },
  { id: 9, brand: "Crissair", category: "Cooktops", code: "071659", name: "Cooktop Induzione 90 (CCI90) 220V", line: "All Black", tensao: "220V", status: "DISPONÍVEL", price_direto: 11990.0, price_revenda: 6235.0, price_vista: 6235.0, price_28: 6235.0, price_56: 6235.0, price_84: 6235.0, medidas: "900x520 mm", link: "" },
  { id: 10, brand: "Crissair", category: "Cooktops", code: "071658", name: "Cooktop Induzione 60 (CCI60) 220V", line: "All Black", tensao: "220V", status: "DISPONÍVEL", price_direto: 7990.0, price_revenda: 4155.0, price_vista: 4155.0, price_28: 4155.0, price_56: 4155.0, price_84: 4155.0, medidas: "590x520 mm", link: "" },
  { id: 11, brand: "Crissair", category: "Fornos/Fogões", code: "070466", name: "Forno Combinado Oven Grill Combinato (CFM94) 220V", line: "Signature", tensao: "220V", status: "DISPONÍVEL", price_direto: 14890.0, price_revenda: 7743.0, price_vista: 7743.0, price_28: 7743.0, price_56: 7743.0, price_84: 7743.0, medidas: "594x455x533 mm", link: "" },
  { id: 12, brand: "Crissair", category: "Fornos/Fogões", code: "070467", name: "Forno Oven Grill (CT093) 220V", line: "Signature", tensao: "220V", status: "DISPONÍVEL", price_direto: 9990.0, price_revenda: 5594.0, price_vista: 5594.0, price_28: 5594.0, price_56: 5594.0, price_84: 5594.0, medidas: "594x594x568 mm", link: "" },
  { id: 13, brand: "Crissair", category: "Fornos/Fogões", code: "071953", name: "Forno BIG 90 (CFE60G5/E) 220V", line: "Signature ITA", tensao: "220V", status: "DISPONÍVEL", price_direto: 20990.0, price_revenda: 12594.0, price_vista: 12594.0, price_28: 12594.0, price_56: 12594.0, price_84: 12594.0, medidas: "895x595 mm", link: "" },
  { id: 14, brand: "Crissair", category: "Lava-Louças", code: "071708", name: "Lava-Louças Freestanding (CLL14 new) 220V", line: "Signature", tensao: "220V", status: "DISPONÍVEL", price_direto: 12970.0, price_revenda: 7263.0, price_vista: 7263.0, price_28: 7263.0, price_56: 7263.0, price_84: 7263.0, medidas: "598x845x600 mm", link: "" },
  { id: 15, brand: "Crissair", category: "Refrigerador/Adega/Beer Center", code: "071984", name: "Adega Duo 46Di 220V", line: "Signature", tensao: "220V", status: "DISPONÍVEL", price_direto: 15990.0, price_revenda: 8954.0, price_vista: 8954.0, price_28: 8954.0, price_56: 8954.0, price_84: 8954.0, medidas: "595x820x570 mm", link: "" },
  { id: 16, brand: "Crissair", category: "Refrigerador/Adega/Beer Center", code: "071986", name: "Beer Center MEDIUM 135L Embutir 220V", line: "Signature", tensao: "220V", status: "DISPONÍVEL", price_direto: 15990.0, price_revenda: 8954.0, price_vista: 8954.0, price_28: 8954.0, price_56: 8954.0, price_84: 8954.0, medidas: "595x820x570 mm", link: "" },
  { id: 17, brand: "DeBacco", category: "Fornos/Fogões", code: "20.07.11506", name: "Forno Montreal Steam Assistant 60cm 220V - 21 Funções", line: "Montreal", tensao: "220V", status: "DISPONÍVEL", price_direto: 11260.0, price_revenda: 8119.12, price_vista: 8119.12, price_28: 8119.12, price_56: 8119.12, price_84: 8119.12, medidas: "595x595x565 mm", link: "" },
  { id: 18, brand: "DeBacco", category: "Coifas", code: "20.07.32400", name: "Coifa DeBacco de Embutir 90cm 220V", line: "Eletros", tensao: "220V", status: "DISPONÍVEL", price_direto: 5175.0, price_revenda: 3287.73, price_vista: 3287.73, price_28: 3287.73, price_56: 3287.73, price_84: 3287.73, medidas: "900 mm", link: "" },
  { id: 19, brand: "DeBacco", category: "Cooktops", code: "20.07.41109", name: "Cooktop Montreal Vidro 90cm Gás 5 Bocas Bivolt", line: "Montreal", tensao: "Bivolt", status: "DISPONÍVEL", price_direto: 5800.0, price_revenda: 4140.06, price_vista: 4140.06, price_28: 4140.06, price_56: 4140.06, price_84: 4140.06, medidas: "860x510 mm", link: "" },
  { id: 20, brand: "DeBacco", category: "Cooktops", code: "20.07.48309", name: "Cooktop de Indução 5 Zonas 90cm 10800W 220V", line: "Indução", tensao: "220V", status: "DISPONÍVEL", price_direto: 11805.0, price_revenda: 7445.77, price_vista: 7445.77, price_28: 7445.77, price_56: 7445.77, price_84: 7445.77, medidas: "900x520 mm", link: "" },
  { id: 21, brand: "DeBacco", category: "Refrigerador/Adega/Beer Center", code: "20.07.53380", name: "Adega 85 Litros 31 Garrafas 220V", line: "Adegas", tensao: "220V", status: "DISPONÍVEL", price_direto: 11165.0, price_revenda: 7809.26, price_vista: 7809.26, price_28: 7809.26, price_56: 7809.26, price_84: 7809.26, medidas: "380x820x575 mm", link: "" },
  { id: 22, brand: "DeBacco", category: "Lava-Louças", code: "20.07.67140", name: "Lava-louças 14 Serviços Para Revestimento 220V", line: "Lava-Louças", tensao: "220V", status: "DISPONÍVEL", price_direto: 13375.0, price_revenda: 10185.97, price_vista: 10185.97, price_28: 10185.97, price_56: 10185.97, price_84: 10185.97, medidas: "598x815x550 mm", link: "" }
];

export const DEFAULT_CLIENTS: Client[] = [
  { nome: "ACROPOLE EMPREENDIMENTOS IMOBILIARIOS SPE LTDA", razao: "ACROPOLE EMPREENDIMENTOS IMOBILIARIOS SPE LTDA", doc: "41.831.060/0001-33", cnpj: "41.831.060/0001-33", tel: "(67) 3361-9874", email: "contato@acropole.com.br", cep: "79046-048", cidade_uf: "Campo Grande / MS", endereco: "Loja 07, Residencial Damha II", status: "ativado" },
  { nome: "CARLOS ALBERTO PARRE", razao: "CARLOS ALBERTO PARRE", doc: "050.128.078-20", cpf: "050.128.078-20", tel: "(67) 99988-7766", email: "cparre01@gmail.com", cep: "79046-048", cidade_uf: "Campo Grande / MS", endereco: "Residencial Damha II", status: "ativado" },
  { nome: "DANIEL CHINZARIAN", razao: "DANIEL CHINZARIAN", doc: "047.474.841-32", cpf: "047.474.841-32", tel: "(11) 97343-7776", email: "daniel.chinzarian@outliers.adv.br", cep: "79046-130", cidade_uf: "Campo Grande / MS", endereco: "Residencial Damha", status: "ativado" },
  { nome: "ROGERIO FONSECA MATSUMOTO", razao: "ROGERIO FONSECA MATSUMOTO", doc: "001.419.321-39", cpf: "001.419.321-39", tel: "(67) 9906-1606", email: "rogerio.matsumoto@gmail.com", cep: "79051-300", cidade_uf: "Campo Grande / MS", endereco: "Vila Vilas Boas", status: "ativado" },
  { nome: "VIZZE ARQUITETURA, CONSTRUCOES E IMOVEIS LTDA", razao: "VIZZE ARQUITETURA", doc: "27.883.379/0001-81", cnpj: "27.883.379/0001-81", tel: "(67) 3361-9874", email: "contato@vizzearquitetura.com.br", cep: "79046-048", cidade_uf: "Campo Grande / MS", endereco: "Loja 07, Residencial Damha II", status: "ativado" }
];

export const DEFAULT_PROFISSIONAIS: Profissional[] = [];

