"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ViaturaEmpenhada = {
  id: string;
  viatura: { id: string; identificacao: string; placa: string };
};

type FichaVitima = {
  nomeVitima: string;
  idadeVitima: string;
  sexoVitima: string;
  documentoVitima: string;
  queixaPrincipal: string;
  alergias: string;
  medicacoes: string;
  pressaoArterial: string;
  pulso: string;
  respiracao: string;
  temperatura: string;
  spO2: string;
  glasgow: string;
  procedimentos: string[];
  desfecho: string;
  hospitalDestino: string;
  dispositivoSeguranca: string;
  observacoes: string;
};

type VeiculoEnv = { placa: string; tipo: string; descricao: string };
type Testemunha = { nome: string; cpf: string };

const PROCEDIMENTOS_VA = [
  "Abertura de VA",
  "Aspiração",
  "Desobstrução",
  "Oxigenoterapia",
  "Ventilação de resgate",
];
const PROCEDIMENTOS_CARDIO = [
  "RCP",
  "Desfibrilação DEA",
  "Controle de hemorragia",
];
const PROCEDIMENTOS_MOBILIZACAO = [
  "Elevação a cavaleiro",
  "Imobilização de membro",
  "Imobilização pélvica",
  "Restrição de mobilidade",
  "Rolamento",
  "Remoção de local",
  "Retirada de capacete",
];
const PROCEDIMENTOS_DIVERSOS = [
  "Curativo compressivo",
  "Curativo simples",
  "Estabilização de objeto",
  "Limpeza de ferimento",
  "Parto emergencial",
  "Prevenção hipotermia",
  "Prevenção estado de choque",
  "Base",
  "Maca rígida",
  "Maca articulada",
  "Talas de madeira",
  "TTF",
  "Torniquete",
  "Cânula orofaríngea",
  "Colar cervical",
  "Coxim",
  "Tirante",
  "Deambulando",
];

const LESOES = [
  "A. Queimadura",
  "B. Escoriação/Abrasão",
  "C. Ferimento contuso",
  "D. Ferimento corte contuso",
  "E. Ferimento perfurante",
  "F. Ferimento cortante",
  "G. Contusão",
  "H. Fratura aberta",
  "I. Fratura fechada",
  "J. Luxação",
  "K. Hemorragia",
  "L. Amputação",
];

const DESFECHOS = [
  { value: "TRANSPORTADO", label: "Transportado" },
  { value: "NAO_TRANSPORTADO", label: "Não Transportado" },
  { value: "OBITO", label: "Óbito" },
  { value: "RECUSA", label: "Recusa de Atendimento" },
  { value: "DISPENSA", label: "Dispensa" },
];

const DISPOSITIVOS = [
  { value: "CINTO", label: "Cinto de Segurança" },
  { value: "CADEIRINHA", label: "Cadeirinha" },
  { value: "BEBE_CONCHINHA", label: "Bebê/Conchinha" },
  { value: "NENHUM", label: "Nenhum" },
  { value: "OUTRO", label: "Outro" },
];

const TABS = [
  "Guarnição",
  "Paciente",
  "Avaliação",
  "Tipo Ocorrência",
  "Procedimentos",
  "Desfecho",
  "Vítimas",
] as const;

export default function FichaAPHPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<string>(TABS[0]);
  const [ocorrenciaId, setOcorrenciaId] = useState("");
  const [viaturaEmpId, setViaturaEmpId] = useState("");
  const [ocorrencia, setOcorrencia] = useState<{
    id: string;
    numeroSequencial: number;
    tipo: string;
    qtdVitimas: number;
    localizacao: string | null;
    bairro: string | null;
    dataHoraChamada: string;
    viaturasEmpenhadas: ViaturaEmpenhada[];
    fichasAPH: Array<{ id: string; victimas: Array<{ id: string }> }>;
  } | null>(null);
  const [viaturaEmpenhadas, setViaturaEmpenhadas] = useState<ViaturaEmpenhada[]>([]);
  const [ocorrenciasAbertas, setOcorrenciasAbertas] = useState<Array<{
    id: string;
    numeroSequencial: number;
    tipo: string;
    qtdVitimas: number;
    localizacao: string | null;
    bairro: string | null;
    dataHoraChamada: string;
    viaturasEmpenhadas: ViaturaEmpenhada[];
    fichasAPH: Array<{ id: string; victimas: Array<{ id: string }> }>;
  }>>([]);

  const [form, setForm] = useState({
    hora: new Date().toTimeString().slice(0, 5),
    localOcorrencia: "",
    bairro: "",
    municipio: "",
    uf: "SC",
    cepLocal: "",
    referencias: "",
    NaturezaChamada: "",
    NumeroSAMU: "",
    NumeroPM: "",
    NumeroPC: "",
    materiaisDeixados: "",
    caracterizacaoLocal: [] as string[],
    acidenteTrabalho: false,
    produtosPerigosos: "",
    tipoTrauma: "",
    violenciaTipo: "",
    quedaDetalhes: "",
    afogamentoLocal: "",
    nomePaciente: "",
    idadePaciente: "",
    sexoPaciente: "M",
    documentoPaciente: "",
    enderecoPaciente: "",
    telefonePaciente: "",
    nomeMaePaciente: "",
    pesoPaciente: "",
    alturaPaciente: "",
    dataNascimento: "",
    passadoMedico: [] as string[],
    alergias: "",
    medicacoesEmUso: "",
    nivelConscienciaDet: "CONSCIENTE_ORIENTADO",
    posicaoPaciente: "",
    caracteristicasPele: [] as string[],
    viaAerea: "",
    respiracao: "",
    circulacao: "",
    pele: "",
    estadoConsciencia: "",
    pressaoArterial: "",
    pulso: "",
    respiracaoFrequencia: "",
    temperatura: "",
    spO2: "",
    glasgow: "",
    DorEscala: "",
    historicoClinico: "",
    glasgowDetalhe: { aberturaOcular: "", respostaVerbal: "", respostaMotora: "" },
    avaliacaoPupilar: "",
    abdome: "",
    lesaoCervical: "",
    perfusao: "",
    procedimentosVA: [] as string[],
    procedimentosCardio: [] as string[],
    procedimentosMobilizacao: [] as string[],
    procedimentosDiversos: [] as string[],
    lesoes: [] as string[],
    desfecho: "TRANSPORTADO",
    hospitalDestino: "",
    horaChegadaHospital: "",
    horaEntregaPaciente: "",
    medicoRecebedor: "",
    dispositivoSeguranca: "NENHUM",
    tipoEncarceramento: "",
    segurancaDetalhes: { cinto: false, airBag: false, capacete: false },
    desfechoOcorrencia: "",
    destinoPaciente: "",
    recursosAdicionais: [] as string[],
    termoRecusa: false,
    textoRecusa: "",
    observacoes: "",
  });

  const [victimas, setVictimas] = useState<FichaVitima[]>([]);
  const [veiculosEnvolvidos, setVeiculosEnvolvidos] = useState<VeiculoEnv[]>([{ placa: "", tipo: "", descricao: "" }]);
  const [testemunhas, setTestemunhas] = useState<Testemunha[]>([{ nome: "", cpf: "" }]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/ocorrencias?status=ABERTA").then((r) => r.json()),
      fetch("/api/ocorrencias?status=EM_ATENDIMENTO").then((r) => r.json()),
    ]).then(([abertas, emAtendimento]) => {
      setOcorrenciasAbertas([...(abertas || []), ...(emAtendimento || [])]);
    });
  }, []);

  useEffect(() => {
    if (ocorrenciaId) {
      const oc = ocorrenciasAbertas.find((o) => o.id === ocorrenciaId);
      if (oc) {
        setOcorrencia(oc);
        setViaturaEmpenhadas(oc.viaturasEmpenhadas);
        const horaChamada = oc.dataHoraChamada
          ? new Date(oc.dataHoraChamada).toTimeString().slice(0, 5)
          : form.hora;
        setForm((f) => ({
          ...f,
          localOcorrencia: oc.localizacao || f.localOcorrencia,
          bairro: oc.bairro || f.bairro,
          NaturezaChamada: oc.tipo || f.NaturezaChamada,
          hora: horaChamada,
        }));
        const novas: FichaVitima[] = [];
        for (let i = 0; i < Math.max(oc.qtdVitimas, 1); i++) {
          novas.push({
            nomeVitima: "", idadeVitima: "", sexoVitima: "M", documentoVitima: "",
            queixaPrincipal: "", alergias: "", medicacoes: "",
            pressaoArterial: "", pulso: "", respiracao: "", temperatura: "", spO2: "", glasgow: "",
            procedimentos: [], desfecho: "TRANSPORTADO", hospitalDestino: "",
            dispositivoSeguranca: "NENHUM", observacoes: "",
          });
        }
        setVictimas(novas);
      }
    }
  }, [ocorrenciaId, ocorrenciasAbertas]);

  const set = (campo: string, valor: unknown) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const toggleArrayItem = (campo: string, item: string) =>
    setForm((f) => {
      const arr = f[campo as keyof typeof f] as string[];
      return {
        ...f,
        [campo]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });

  const buscarCEP = async (cep: string) => {
    const onlyNum = cep.replace(/\D/g, "");
    if (onlyNum.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${onlyNum}/json/`);
      const data = await res.json();
      if (data.erro) return;
      setForm((f) => ({
        ...f,
        localOcorrencia: data.logradouro || f.localOcorrencia,
        bairro: data.bairro || f.bairro,
        municipio: data.localidade || f.municipio,
        uf: data.uf || f.uf,
      }));
    } catch {
      // CEP não encontrado, ignora
    }
  };

  const handleSalvar = async () => {
    if (!ocorrenciaId || !viaturaEmpId) {
      alert("Selecione a ocorrência e a viatura");
      return;
    }
    setSalvando(true);
    try {
      const allProcedimentos = [
        ...form.procedimentosVA,
        ...form.procedimentosCardio,
        ...form.procedimentosMobilizacao,
        ...form.procedimentosDiversos,
        ...form.lesoes,
      ];
      const payload = {
        ocorrenciaId,
        viaturaEmpenhadaId: viaturaEmpId,
        hora: form.hora,
        localOcorrencia: form.localOcorrencia,
        bairro: form.bairro,
        municipio: form.municipio,
        uf: form.uf,
        cepLocal: form.cepLocal,
        referencias: form.referencias,
        NaturezaChamada: form.NaturezaChamada,
        NumeroSAMU: form.NumeroSAMU,
        NumeroPM: form.NumeroPM,
        NumeroPC: form.NumeroPC,
        materiaisDeixados: form.materiaisDeixados,
        caracterizacaoLocal: form.caracterizacaoLocal.join(","),
        acidenteTrabalho: form.acidenteTrabalho,
        produtosPerigosos: form.produtosPerigosos,
        tipoTrauma: form.tipoTrauma,
        violenciaTipo: form.violenciaTipo,
        quedaDetalhes: form.quedaDetalhes,
        afogamentoLocal: form.afogamentoLocal,
        veiculosEnvolvidos: veiculosEnvolvidos.filter((v) => v.placa || v.descricao),
        nomePaciente: form.nomePaciente,
        idadePaciente: form.idadePaciente,
        sexoPaciente: form.sexoPaciente,
        documentoPaciente: form.documentoPaciente,
        enderecoPaciente: form.enderecoPaciente,
        telefonePaciente: form.telefonePaciente,
        nomeMaePaciente: form.nomeMaePaciente,
        pesoPaciente: form.pesoPaciente,
        alturaPaciente: form.alturaPaciente,
        dataNascimento: form.dataNascimento,
        passadoMedico: form.passadoMedico,
        alergias: form.alergias,
        medicacoesEmUso: form.medicacoesEmUso,
        nivelConscienciaDet: form.nivelConscienciaDet,
        posicaoPaciente: form.posicaoPaciente,
        caracteristicasPele: form.caracteristicasPele.join(","),
        viaAerea: form.viaAerea,
        respiracao: form.respiracao,
        circulacao: form.circulacao,
        pele: form.pele,
        estadoConsciencia: form.estadoConsciencia,
        pressaoArterial: form.pressaoArterial,
        pulso: form.pulso,
        respiracaoFrequencia: form.respiracaoFrequencia,
        temperatura: form.temperatura,
        spO2: form.spO2,
        glasgow: form.glasgow,
        DorEscala: form.DorEscala,
        historicoClinico: form.historicoClinico,
        glasgowDetalhe: form.glasgowDetalhe,
        avaliacaoPupilar: form.avaliacaoPupilar,
        abdome: form.abdome,
        lesaoCervical: form.lesaoCervical,
        perfusao: form.perfusao,
        procedimentosRealizados: allProcedimentos,
        desfecho: form.desfecho,
        hospitalDestino: form.hospitalDestino,
        horaChegadaHospital: form.horaChegadaHospital,
        horaEntregaPaciente: form.horaEntregaPaciente,
        medicoRecebedor: form.medicoRecebedor,
        dispositivoSeguranca: form.dispositivoSeguranca,
        tipoEncarceramento: form.tipoEncarceramento,
        segurancaDetalhes: form.segurancaDetalhes,
        desfechoOcorrencia: form.desfechoOcorrencia,
        destinoPaciente: form.destinoPaciente,
        recursosAdicionais: form.recursosAdicionais.join(","),
        termoRecusa: form.termoRecusa,
        textoRecusa: form.textoRecusa,
        observacoes: form.observacoes,
        testemunhas: testemunhas.filter((t) => t.nome),
        victimas: victimas.map((v) => ({
          ...v,
          idadeVitima: v.idadeVitima ? parseInt(v.idadeVitima) : null,
        })),
      };

      const res = await fetch("/api/ficha-aph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Ficha APH salva com sucesso!");
        router.push("/central");
      } else {
        const d = await res.json();
        alert(`Erro: ${d.error}`);
      }
    } catch (error) {
      alert("Erro ao salvar ficha APH");
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const icheck = (campo: string, item: string) => {
    const arr = form[campo as keyof typeof form] as string[];
    return arr?.includes(item) ?? false;
  };

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ficha de Atendimento Pré-Hospitalar</h1>
          <p className="text-gray-400">Diretriz Operacional - Padrão CBMSC</p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={salvando || !ocorrenciaId || !viaturaEmpId}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar Ficha"}
        </button>
      </div>

      {/* Seleção Ocorrência / Viatura */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ocorrência *</label>
            <select value={ocorrenciaId} onChange={(e) => setOcorrenciaId(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              <option value="">Selecione</option>
              {ocorrenciasAbertas.map((oc) => (
                <option key={oc.id} value={oc.id}>#{oc.numeroSequencial} - {oc.tipo} ({oc.qtdVitimas} vítima(s))</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Viatura *</label>
            <select value={viaturaEmpId} onChange={(e) => setViaturaEmpId(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              <option value="">Selecione</option>
              {viaturaEmpenhadas.map((ve) => (
                <option key={ve.id} value={ve.id}>{ve.viatura.identificacao} - {ve.viatura.placa}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data</label>
              <input type="text" value={new Date().toLocaleDateString("pt-BR")} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" disabled />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Hora *</label>
              <input type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
            </div>
          </div>
        </div>
      </div>

      {ocorrencia && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setAbaAtiva(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  abaAtiva === tab ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* ===== ABA GUARNIÇÃO ===== */}
            {abaAtiva === "Guarnição" && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Dados da Ocorrência</h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Nº Ocorrência</label><input type="text" value={`#${ocorrencia.numeroSequencial}`} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" disabled /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Nº Ficha</label><input type="text" value={`${(ocorrencia.fichasAPH?.length || 0) + 1}`} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" disabled /></div>
                    <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">Natureza da Chamada</label><input type="text" value={form.NaturezaChamada} onChange={(e) => set("NaturezaChamada", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Nº SAMU</label><input type="text" value={form.NumeroSAMU} onChange={(e) => set("NumeroSAMU", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Nº PM</label><input type="text" value={form.NumeroPM} onChange={(e) => set("NumeroPM", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Nº PC</label><input type="text" value={form.NumeroPC} onChange={(e) => set("NumeroPC", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">CEP Local</label><input type="text" value={form.cepLocal} onChange={(e) => { const v = e.target.value; set("cepLocal", v); const num = v.replace(/\D/g, ""); if (num.length === 8) buscarCEP(num); }} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="00000-000" maxLength={9} /></div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Local da Ocorrência</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">Endereço</label><input type="text" value={form.localOcorrencia} onChange={(e) => set("localOcorrencia", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">UF</label><input type="text" value={form.uf} onChange={(e) => set("uf", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" maxLength={2} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Bairro</label><input type="text" value={form.bairro} onChange={(e) => set("bairro", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Município</label><input type="text" value={form.municipio} onChange={(e) => set("municipio", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Referências</label><input type="text" value={form.referencias} onChange={(e) => set("referencias", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Ptos de referência" /></div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-2">Caracterização do Local</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Residência", "Comércio/Serviços", "Escola", "Via pública", "Local de prática esportiva", "Bar/Restaurante", "Área rural", "Indústria/Construção", "Hotel", "Outros"].map((loc) => (
                        <label key={loc} className="flex items-center gap-2 text-sm text-gray-300 p-1.5 rounded hover:bg-gray-800 cursor-pointer">
                          <input type="checkbox" checked={form.caracterizacaoLocal.includes(loc)} onChange={() => toggleArrayItem("caracterizacaoLocal", loc)} className="w-4 h-4 rounded" />
                          {loc}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input type="checkbox" checked={form.acidenteTrabalho} onChange={(e) => set("acidenteTrabalho", e.target.checked)} className="w-4 h-4 rounded" />
                      Acidente de Trabalho
                    </label>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Produtos Perigosos</label>
                      <input type="text" value={form.produtosPerigosos} onChange={(e) => set("produtosPerigosos", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Descreva ou deixe vazio" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Veículos Envolvidos</h2>
                  {veiculosEnvolvidos.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-3 mb-3">
                      <div><label className="block text-xs text-gray-500 mb-1">Veículo {idx + 1}</label><input type="text" value={v.descricao} onChange={(e) => { const n = [...veiculosEnvolvidos]; n[idx].descricao = e.target.value; setVeiculosEnvolvidos(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" placeholder="Tipo/Modelo" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Placa</label><input type="text" value={v.placa} onChange={(e) => { const n = [...veiculosEnvolvidos]; n[idx].placa = e.target.value; setVeiculosEnvolvidos(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Tipo</label>
                        <select value={v.tipo} onChange={(e) => { const n = [...veiculosEnvolvidos]; n[idx].tipo = e.target.value; setVeiculosEnvolvidos(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                          <option value="">Selecione</option>
                          <option value="Automóvel">Automóvel</option>
                          <option value="Motocicleta">Motocicleta</option>
                          <option value="Caminhão/Carreta">Caminhão/Carreta</option>
                          <option value="Ônibus">Ônibus</option>
                          <option value="Bicicleta">Bicicleta</option>
                          <option value="Animal">Animal</option>
                          <option value="Objeto fixo">Objeto fixo</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        {idx > 0 && <button onClick={() => setVeiculosEnvolvidos(veiculosEnvolvidos.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 text-sm">Remover</button>}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setVeiculosEnvolvidos([...veiculosEnvolvidos, { placa: "", tipo: "", descricao: "" }])} className="text-blue-400 hover:text-blue-300 text-sm mt-2">+ Adicionar Veículo</button>
                </div>
              </div>
            )}

            {/* ===== ABA PACIENTE ===== */}
            {abaAtiva === "Paciente" && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Informações do Paciente</h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={form.nomePaciente} onChange={(e) => set("nomePaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Sexo</label><select value={form.sexoPaciente} onChange={(e) => set("sexoPaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Data Nascimento</label><input type="date" value={form.dataNascimento} onChange={(e) => set("dataNascimento", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Idade</label><input type="number" value={form.idadePaciente} onChange={(e) => set("idadePaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">CPF</label><input type="text" value={form.documentoPaciente} onChange={(e) => set("documentoPaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Telefone</label><input type="text" value={form.telefonePaciente} onChange={(e) => set("telefonePaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Peso (kg)</label><input type="number" value={form.pesoPaciente} onChange={(e) => set("pesoPaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">Endereço</label><input type="text" value={form.enderecoPaciente} onChange={(e) => set("enderecoPaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Altura (cm)</label><input type="number" value={form.alturaPaciente} onChange={(e) => set("alturaPaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                  </div>
                  <div className="mt-4"><label className="block text-sm text-gray-400 mb-1">Nome da Mãe</label><input type="text" value={form.nomeMaePaciente} onChange={(e) => set("nomeMaePaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Passado Médico</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {["Diabetes", "Neoplasia", "Tabagismo", "Etilismo", "Problemas respiratórios", "Problemas cardiovasculares", "Problemas neurológicos", "Outros"].map((item) => (
                      <label key={item} className="flex items-center gap-2 text-sm text-gray-300 p-1.5 rounded hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" checked={form.passadoMedico.includes(item)} onChange={() => toggleArrayItem("passadoMedico", item)} className="w-4 h-4 rounded" />
                        {item}
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Alergias</label><input type="text" value={form.alergias} onChange={(e) => set("alergias", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Nega / Não informou / Descreva" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Medicamentos em Uso</label><input type="text" value={form.medicacoesEmUso} onChange={(e) => set("medicacoesEmUso", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Nenhum / Não informado / Descreva" /></div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Estado do Paciente</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Nível de Consciência</label>
                      <div className="space-y-1">
                        {[
                          { value: "CONSCIENTE_ORIENTADO", label: "Consciente Orientado" },
                          { value: "CONSCIENTE_DESORIENTADO", label: "Consciente Desorientado" },
                          { value: "INCONSCIENTE", label: "Inconsciente" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="nivelConsciencia" value={opt.value} checked={form.nivelConscienciaDet === opt.value} onChange={(e) => set("nivelConscienciaDet", e.target.value)} className="w-4 h-4" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Posição do Paciente</label>
                      <div className="space-y-1">
                        {["Sentado/Semi sentado", "Decúbito ventral", "Decúbito lateral D", "Decúbito lateral E", "Decúbito dorsal"].map((pos) => (
                          <label key={pos} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="posicao" value={pos} checked={form.posicaoPaciente === pos} onChange={(e) => set("posicaoPaciente", e.target.value)} className="w-4 h-4" />
                            {pos}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Características da Pele</label>
                      <div className="grid grid-cols-2 gap-1">
                        {["Úmida", "Seca", "Quente", "Fria", "Pálida", "Ruborizada", "Pegajosa", "Cianótica", "Sem alteração"].map((p) => (
                          <label key={p} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={form.caracteristicasPele.includes(p)} onChange={() => toggleArrayItem("caracteristicasPele", p)} className="w-3 h-3 rounded" />
                            {p}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ABA AVALIAÇÃO ===== */}
            {abaAtiva === "Avaliação" && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Sinais Vitais</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left px-3 py-2 text-gray-400 font-medium">Medida</th>
                          <th className="text-center px-3 py-2 text-gray-400 font-medium">1ª Medição</th>
                          <th className="text-center px-3 py-2 text-gray-400 font-medium">2ª Medição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "P.A. (mmHg)", campo: "pressaoArterial" },
                          { label: "F.C. (bpm)", campo: "pulso" },
                          { label: "F.R. (rpm)", campo: "respiracaoFrequencia" },
                          { label: "SpO2 (%)", campo: "spO2" },
                          { label: "Temp. (°C)", campo: "temperatura" },
                        ].map((sv) => (
                          <tr key={sv.campo} className="border-b border-gray-800">
                            <td className="px-3 py-2 text-gray-300">{sv.label}</td>
                            <td className="px-3 py-2"><input type="text" value={form[sv.campo as keyof typeof form] as string} onChange={(e) => set(sv.campo, e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-center" placeholder="-" /></td>
                            <td className="px-3 py-2"><input type="text" className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-center" placeholder="2ª medição" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Escala de Coma de Glasgow</h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Abertura Ocular (QSE)</label>
                      <div className="space-y-1">
                        {[
                          { v: "6", l: "Espontânea" },
                          { v: "5", l: "Ao comando verbal" },
                          { v: "4", l: "À pressão" },
                          { v: "3", l: "Nenhuma" },
                          { v: "NT", l: "Não testável" },
                        ].map((o) => (
                          <label key={o.v} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="gcEO" value={o.v} checked={form.glasgowDetalhe.aberturaOcular === o.v} onChange={(e) => set("glasgowDetalhe", { ...form.glasgowDetalhe, aberturaOcular: e.target.value })} className="w-4 h-4" />
                            {o.v} - {o.l}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Resposta Verbal (QID)</label>
                      <div className="space-y-1">
                        {[
                          { v: "5", l: "Orientada" },
                          { v: "4", l: "Desorientada" },
                          { v: "3", l: "Palavras" },
                          { v: "2", l: "Sons" },
                          { v: "1", l: "Nenhuma" },
                          { v: "NT", l: "Não testável" },
                        ].map((o) => (
                          <label key={o.v} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="gcRV" value={o.v} checked={form.glasgowDetalhe.respostaVerbal === o.v} onChange={(e) => set("glasgowDetalhe", { ...form.glasgowDetalhe, respostaVerbal: e.target.value })} className="w-4 h-4" />
                            {o.v} - {o.l}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Resposta Motora (QSD)</label>
                      <div className="space-y-1">
                        {[
                          { v: "6", l: "Ao comando" },
                          { v: "5", l: "Localiza dor" },
                          { v: "4", l: "Flexão normal" },
                          { v: "3", l: "Flexão anormal" },
                          { v: "2", l: "Extensão" },
                          { v: "1", l: "Nenhuma" },
                          { v: "NT", l: "Não testável" },
                        ].map((o) => (
                          <label key={o.v} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="gcRM" value={o.v} checked={form.glasgowDetalhe.respostaMotora === o.v} onChange={(e) => set("glasgowDetalhe", { ...form.glasgowDetalhe, respostaMotora: e.target.value })} className="w-4 h-4" />
                            {o.v} - {o.l}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Glasgow Total</label><input type="number" min="3" max="15" value={form.glasgow} onChange={(e) => set("glasgow", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Escala de Dor (0-10)</label><input type="number" min="0" max="10" value={form.DorEscala} onChange={(e) => set("DorEscala", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Avaliação Física</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Avaliação Pupilar</label>
                      <div className="space-y-1">
                        {["Isocóricas", "Anisocóricas", "Não reativas"].map((p) => (
                          <label key={p} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="pupila" value={p} checked={form.avaliacaoPupilar === p} onChange={(e) => set("avaliacaoPupilar", e.target.value)} className="w-4 h-4" />
                            {p}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Abdômen</label>
                      <div className="space-y-1">
                        {["Distendido", "Evisceração", "Rígido", "Dor à palpação", "Sem particularidade"].map((a) => (
                          <label key={a} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="abdome" value={a} checked={form.abdome === a} onChange={(e) => set("abdome", e.target.value)} className="w-4 h-4" />
                            {a}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Lesão Cervical</label>
                      <div className="space-y-1">
                        {["Suspeita", "Sem indicação"].map((l) => (
                          <label key={l} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="cervical" value={l} checked={form.lesaoCervical === l} onChange={(e) => set("lesaoCervical", e.target.value)} className="w-4 h-4" />
                            {l}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Via Aérea</label>
                      <select value={form.viaAerea} onChange={(e) => set("viaAerea", e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                        <option value="">-</option>
                        <option value="Permeável">Permeável</option>
                        <option value="Obstruída">Obstruída</option>
                        <option value="Intubada">Intubada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Respiração</label>
                      <select value={form.respiracao} onChange={(e) => set("respiracao", e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                        <option value="">-</option>
                        <option value="Presente">Presente</option>
                        <option value="Ausente">Ausente</option>
                        <option value="Superficial">Superficial</option>
                        <option value="Irregular">Irregular</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Circulação</label>
                      <select value={form.circulacao} onChange={(e) => set("circulacao", e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                        <option value="">-</option>
                        <option value="Pulsos presentes">Pulsos presentes</option>
                        <option value="Pulsos fracos">Pulsos fracos</option>
                        <option value="Pulsos ausentes">Pulsos ausentes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Perfusão (&gt;2seg)</label>
                      <select value={form.perfusao} onChange={(e) => set("perfusao", e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                        <option value="">-</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4"><label className="block text-sm text-gray-400 mb-1">Histórico Clínico / Observações</label><textarea value={form.historicoClinico} onChange={(e) => set("historicoClinico", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20" /></div>
                </div>
              </div>
            )}

            {/* ===== ABA TIPO DE OCORRÊNCIA ===== */}
            {abaAtiva === "Tipo Ocorrência" && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Classificação da Ocorrência</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Tipo Principal</label>
                      <div className="space-y-1">
                        {["Clínico", "Trauma", "Afogamento"].map((t) => (
                          <label key={t} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="tipoPrincipal" value={t} checked={form.tipoTrauma === t} onChange={(e) => set("tipoTrauma", e.target.value)} className="w-4 h-4" />
                            {t}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      {form.tipoTrauma === "Clínico" && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Subtipo Clínico</label>
                          <div className="space-y-1">
                            {["Intoxicação", "Obstétrico", "PCR", "Problemas respiratórios", "Problemas cardiovasculares", "Problemas neurológicos", "Problemas endócrinos", "Outros"].map((s) => (
                              <label key={s} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input type="radio" name="subtipoClinico" value={s} checked={form.NaturezaChamada === s} onChange={(e) => set("NaturezaChamada", e.target.value)} className="w-4 h-4" />
                                {s}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {form.tipoTrauma === "Trauma" && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Subtipo Trauma</label>
                          <div className="space-y-1">
                            {[
                              "Acidente de trânsito",
                              "Queda",
                              "Violência",
                              "Asfixia",
                              "Acidentes com animais",
                              "Choque elétrico",
                              "Explosão",
                              "F.A.F",
                              "F.A.B",
                              "Engasgamento",
                              "Tentativa de suicídio",
                            ].map((s) => (
                              <label key={s} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input type="radio" name="subtipoTrauma" value={s} checked={form.NaturezaChamada === s} onChange={(e) => set("NaturezaChamada", e.target.value)} className="w-4 h-4" />
                                {s}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {form.tipoTrauma === "Afogamento" && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Local do Afogamento</label>
                          <div className="space-y-1">
                            {["Piscina", "Mar", "Rio", "Lago/Lagoa", "Represa", "Açude", "Outros"].map((l) => (
                              <label key={l} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input type="radio" name="afogamento" value={l} checked={form.afogamentoLocal === l} onChange={(e) => set("afogamentoLocal", e.target.value)} className="w-4 h-4" />
                                {l}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Lesões Identificadas</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {LESOES.map((lesao) => (
                      <label key={lesao} className="flex items-center gap-2 text-sm text-gray-300 p-1.5 rounded hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" checked={form.lesoes.includes(lesao)} onChange={() => toggleArrayItem("lesoes", lesao)} className="w-4 h-4 rounded" />
                        {lesao}
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Violência - Tipo</label>
                      <select value={form.violenciaTipo} onChange={(e) => set("violenciaTipo", e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                        <option value="">Não se aplica</option>
                        <option value="Física">Física</option>
                        <option value="Sexual">Sexual</option>
                        <option value="Prejudicado">Prejudicado</option>
                      </select>
                    </div>
                    <div><label className="block text-sm text-gray-400 mb-1">Detalhes - Queda / Outros</label><input type="text" value={form.quedaDetalhes} onChange={(e) => set("quedaDetalhes", e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" placeholder="Ex: Própria altura, 3m, Escada..." /></div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Materiais Deixados no Hospital</h2>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="radio" name="materiais" value="SIM" checked={form.materiaisDeixados === "SIM"} onChange={() => set("materiaisDeixados", "SIM")} className="w-4 h-4" /> Sim</label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="radio" name="materiais" value="NAO" checked={form.materiaisDeixados === "NAO"} onChange={() => set("materiaisDeixados", "NAO")} className="w-4 h-4" /> Não</label>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ABA PROCEDIMENTOS ===== */}
            {abaAtiva === "Procedimentos" && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Vias Aéreas / Respiração</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {PROCEDIMENTOS_VA.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm text-gray-300 p-2 rounded hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" checked={form.procedimentosVA.includes(p)} onChange={() => toggleArrayItem("procedimentosVA", p)} className="w-4 h-4 rounded" />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Cardiovascular</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {PROCEDIMENTOS_CARDIO.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm text-gray-300 p-2 rounded hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" checked={form.procedimentosCardio.includes(p)} onChange={() => toggleArrayItem("procedimentosCardio", p)} className="w-4 h-4 rounded" />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Mobilização / Manipulação</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {PROCEDIMENTOS_MOBILIZACAO.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm text-gray-300 p-2 rounded hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" checked={form.procedimentosMobilizacao.includes(p)} onChange={() => toggleArrayItem("procedimentosMobilizacao", p)} className="w-4 h-4 rounded" />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Procedimentos Diversos</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {PROCEDIMENTOS_DIVERSOS.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm text-gray-300 p-2 rounded hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" checked={form.procedimentosDiversos.includes(p)} onChange={() => toggleArrayItem("procedimentosDiversos", p)} className="w-4 h-4 rounded" />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== ABA DESFECHO ===== */}
            {abaAtiva === "Desfecho" && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Desfecho e Destino</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Desfecho do Atendimento</label>
                      <div className="space-y-1">
                        {DESFECHOS.map((d) => (
                          <label key={d.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="desfecho" value={d.value} checked={form.desfecho === d.value} onChange={(e) => set("desfecho", e.target.value)} className="w-4 h-4" />
                            {d.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Desfecho da Ocorrência</label>
                      <div className="space-y-1">
                        {["Recusa de atendimento", "Dispensa de atendimento", "Sinais evidentes de morte", "Atendimento e transporte", "Recusa de transporte", "Dispensa de transporte"].map((d) => (
                          <label key={d} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="desfechoOcorr" value={d} checked={form.desfechoOcorrencia === d} onChange={(e) => set("desfechoOcorrencia", e.target.value)} className="w-4 h-4" />
                            {d}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Destino do Paciente</label>
                      <div className="space-y-1">
                        {["Hospital", "UPA", "Unidade de saúde", "P.A"].map((d) => (
                          <label key={d} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="radio" name="destino" value={d} checked={form.destinoPaciente === d} onChange={(e) => set("destinoPaciente", e.target.value)} className="w-4 h-4" />
                            {d}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Hospital Destino</label><input type="text" value={form.hospitalDestino} onChange={(e) => set("hospitalDestino", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Hora Chegada Hospital</label><input type="time" value={form.horaChegadaHospital} onChange={(e) => set("horaChegadaHospital", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">Hora Entrega Paciente</label><input type="time" value={form.horaEntregaPaciente} onChange={(e) => set("horaEntregaPaciente", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div><label className="block text-sm text-gray-400 mb-1">Médico Recebedor</label><input type="text" value={form.medicoRecebedor} onChange={(e) => set("medicoRecebedor", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Dispositivo de Segurança</label>
                      <select value={form.dispositivoSeguranca} onChange={(e) => set("dispositivoSeguranca", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        {DISPOSITIVOS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Segurança e Encarceramento</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={form.segurancaDetalhes.cinto} onChange={(e) => set("segurancaDetalhes", { ...form.segurancaDetalhes, cinto: e.target.checked })} className="w-4 h-4 rounded" />
                      Retirada do cinto
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={form.segurancaDetalhes.airBag} onChange={(e) => set("segurancaDetalhes", { ...form.segurancaDetalhes, airBag: e.target.checked })} className="w-4 h-4 rounded" />
                      Air Bag deflagrado
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={form.segurancaDetalhes.capacete} onChange={(e) => set("segurancaDetalhes", { ...form.segurancaDetalhes, capacete: e.target.checked })} className="w-4 h-4 rounded" />
                      Retirada do capacete
                    </label>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-1">Tipo de Encarceramento</label>
                    <div className="flex gap-4">
                      {["", "Mecânico", "Tipo I", "Tipo II"].map((t) => (
                        <label key={t} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input type="radio" name="encarceramento" value={t} checked={form.tipoEncarceramento === t} onChange={(e) => set("tipoEncarceramento", e.target.value)} className="w-4 h-4" />
                          {t || "Não se aplica"}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Recursos Adicionais na Cena</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {["SAMU", "PM", "PC", "PRF", "Polícia Científica", "CELESC", "GM", "PMRv", "Mecânico", "Profissional de Saúde", "Outro"].map((r) => (
                      <label key={r} className="flex items-center gap-2 text-sm text-gray-300 p-1.5 rounded hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox" checked={form.recursosAdicionais.includes(r)} onChange={() => toggleArrayItem("recursosAdicionais", r)} className="w-4 h-4 rounded" />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Termo de Recusa / Dispensa</h2>
                  <label className="flex items-center gap-2 text-sm text-gray-300 mb-3 cursor-pointer">
                    <input type="checkbox" checked={form.termoRecusa} onChange={(e) => set("termoRecusa", e.target.checked)} className="w-4 h-4 rounded" />
                    Possui termo de recusa/dispensa
                  </label>
                  {form.termoRecusa && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">Termo: &quot;Eu, ______________________, portador(a) do CPF no __________________, assumo inteira responsabilidade pela recusa ou dispensa do atendimento ou transporte prestado pelo CBMSC, à minha pessoa ou a que acompanhei para este atendimento, mesmo que isto traga danos à minha saúde ou da pessoa acima relacionada.&quot;</p>
                      <textarea value={form.textoRecusa} onChange={(e) => set("textoRecusa", e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm h-16" placeholder="Observações adicionais sobre a recusa/dispensa" />
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Observações</h2>
                  <textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24" />
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-lg font-semibold text-white mb-4">Testemunhas</h2>
                  {testemunhas.map((t, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-3 mb-3">
                      <div><label className="block text-xs text-gray-500 mb-1">Testemunha {idx + 1}</label><input type="text" value={t.nome} onChange={(e) => { const n = [...testemunhas]; n[idx].nome = e.target.value; setTestemunhas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" placeholder="Nome" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">CPF</label><input type="text" value={t.cpf} onChange={(e) => { const n = [...testemunhas]; n[idx].cpf = e.target.value; setTestemunhas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div className="flex items-end">
                        {idx > 0 && <button onClick={() => setTestemunhas(testemunhas.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 text-sm">Remover</button>}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setTestemunhas([...testemunhas, { nome: "", cpf: "" }])} className="text-blue-400 hover:text-blue-300 text-sm mt-2">+ Adicionar Testemunha</button>
                </div>
              </div>
            )}

            {/* ===== ABA VÍTIMAS ===== */}
            {abaAtiva === "Vítimas" && (
              <div className="space-y-4">
                {victimas.map((vitima, idx) => (
                  <div key={idx} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <h2 className="text-lg font-semibold text-white mb-4">Vítima {idx + 1}</h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={vitima.nomeVitima} onChange={(e) => { const n = [...victimas]; n[idx].nomeVitima = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Idade</label><input type="number" value={vitima.idadeVitima} onChange={(e) => { const n = [...victimas]; n[idx].idadeVitima = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Sexo</label><select value={vitima.sexoVitima} onChange={(e) => { const n = [...victimas]; n[idx].sexoVitima = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm"><option value="M">M</option><option value="F">F</option></select></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      <div><label className="block text-sm text-gray-400 mb-1">Documento</label><input type="text" value={vitima.documentoVitima} onChange={(e) => { const n = [...victimas]; n[idx].documentoVitima = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Queixa Principal</label><input type="text" value={vitima.queixaPrincipal} onChange={(e) => { const n = [...victimas]; n[idx].queixaPrincipal = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Alergias</label><input type="text" value={vitima.alergias} onChange={(e) => { const n = [...victimas]; n[idx].alergias = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Medicacoes</label><input type="text" value={vitima.medicacoes} onChange={(e) => { const n = [...victimas]; n[idx].medicacoes = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-5 gap-3 mt-3">
                      <div><label className="block text-sm text-gray-400 mb-1">PA</label><input type="text" value={vitima.pressaoArterial} onChange={(e) => { const n = [...victimas]; n[idx].pressaoArterial = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Pulso</label><input type="text" value={vitima.pulso} onChange={(e) => { const n = [...victimas]; n[idx].pulso = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">FR</label><input type="text" value={vitima.respiracao} onChange={(e) => { const n = [...victimas]; n[idx].respiracao = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">SpO2</label><input type="text" value={vitima.spO2} onChange={(e) => { const n = [...victimas]; n[idx].spO2 = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Glasgow</label><input type="number" min="3" max="15" value={vitima.glasgow} onChange={(e) => { const n = [...victimas]; n[idx].glasgow = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Desfecho</label>
                        <select value={vitima.desfecho} onChange={(e) => { const n = [...victimas]; n[idx].desfecho = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                          <option value="TRANSPORTADO">Transportado</option>
                          <option value="NAO_TRANSPORTADO">Não Transportado</option>
                          <option value="OBITO">Óbito</option>
                        </select>
                      </div>
                      <div><label className="block text-sm text-gray-400 mb-1">Hospital</label><input type="text" value={vitima.hospitalDestino} onChange={(e) => { const n = [...victimas]; n[idx].hospitalDestino = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Observações</label><input type="text" value={vitima.observacoes} onChange={(e) => { const n = [...victimas]; n[idx].observacoes = e.target.value; setVictimas(n); }} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm" /></div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setVictimas([...victimas, {
                  nomeVitima: "", idadeVitima: "", sexoVitima: "M", documentoVitima: "",
                  queixaPrincipal: "", alergias: "", medicacoes: "",
                  pressaoArterial: "", pulso: "", respiracao: "", temperatura: "", spO2: "", glasgow: "",
                  procedimentos: [], desfecho: "TRANSPORTADO", hospitalDestino: "",
                  dispositivoSeguranca: "NENHUM", observacoes: "",
                }])} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm w-full">
                  + Adicionar Vítima
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
