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

const PROCEDIMENTOS = [
  "Avaliação Geral (AVDI)",
  "Via Aérea Permeável",
  "Oxigenoterapia",
  "Aspiração de Vias Aéreas",
  "Imobilização",
  "Compressões Torácicas",
  "Desfibrilação",
  "Acesso Venoso",
  "Glicotest",
  "Aspiração Orogástrica",
  "Monitorização",
  "PFE",
  "Caneta Traqueal",
  "DRE",
  "Ventilação Mecânica",
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
  { value: "BEBE_CONCHINHA", label: " bebê/conchinha" },
  { value: "NENHUM", label: "Nenhum" },
  { value: "OUTRO", label: "Outro" },
];

export default function FichaAPHPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [ocorrenciaId, setOcorrenciaId] = useState("");
  const [viaturaEmpId, setViaturaEmpId] = useState("");
  const [ocorrencia, setOcorrencia] = useState<{
    id: string;
    numeroSequencial: number;
    tipo: string;
    qtdVitimas: number;
    localizacao: string | null;
    bairro: string | null;
    viaturasEmpenhadas: ViaturaEmpenhada[];
    fichasAPH: Array<{ id: string; victimas: Array<{ id: string }> }>;
  } | null>(null);
  const [viaturaEmpenhadas, setViaturaEmpenhadas] = useState<ViaturaEmpenhada[]>([]);

  const [form, setForm] = useState({
    hora: new Date().toTimeString().slice(0, 5),
    localOcorrencia: "",
    municipio: "",
    uf: "SC",
    NaturezaChamada: "",
    NumeroSAMU: "",
    NumeroPM: "",
    NumeroPC: "",
    materiaisDeixados: "",
    nomePaciente: "",
    idadePaciente: "",
    sexoPaciente: "M",
    documentoPaciente: "",
    enderecoPaciente: "",
    telefonePaciente: "",
    nomeMaePaciente: "",
    pesoPaciente: "",
    alturaPaciente: "",
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
    procedimentosRealizados: [] as string[],
    desfecho: "TRANSPORTADO",
    hospitalDestino: "",
    horaChegadaHospital: "",
    horaEntregaPaciente: "",
    medicoRecebedor: "",
    dispositivoSeguranca: "NENHUM",
    termoRecusa: false,
    textoRecusa: "",
    observacoes: "",
    recursosAdicionais: "",
  });

  const [victimas, setVictimas] = useState<FichaVitima[]>([]);
  const [viaturaVitimaMap, setViaturaVitimaMap] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);

  // Buscar ocorrências abertas
  const [ocorrenciasAbertas, setOcorrenciasAbertas] = useState<Array<{
    id: string;
    numeroSequencial: number;
    tipo: string;
    qtdVitimas: number;
    localizacao: string | null;
    bairro: string | null;
    viaturasEmpenhadas: ViaturaEmpenhada[];
    fichasAPH: Array<{ id: string; victimas: Array<{ id: string }> }>;
  }>>([]);

  useEffect(() => {
    fetch("/api/ocorrencias?status=ABERTA")
      .then((r) => r.json())
      .then(setOcorrenciasAbertas);
    fetch("/api/ocorrencias?status=EM_ATENDIMENTO")
      .then((r) => r.json())
      .then((data) => setOcorrenciasAbertas((prev) => [...prev, ...data]));
  }, []);

  useEffect(() => {
    if (ocorrenciaId) {
      const oc = ocorrenciasAbertas.find((o) => o.id === ocorrenciaId);
      if (oc) {
        setOcorrencia(oc);
        setViaturaEmpenhadas(oc.viaturasEmpenhadas);
        setForm((f) => ({
          ...f,
          localOcorrencia: oc.localizacao || "",
          bairro: oc.bairro || "",
        }));

        // Inicializar víctimas baseado na qtdVitimas
        const novasVictimas: FichaVitima[] = [];
        for (let i = 0; i < oc.qtdVitimas; i++) {
          novasVictimas.push({
            nomeVitima: "", idadeVitima: "", sexoVitima: "M", documentoVitima: "",
            queixaPrincipal: "", alergias: "", medicacoes: "",
            pressaoArterial: "", pulso: "", respiracao: "", temperatura: "", spO2: "", glasgow: "",
            procedimentos: [], desfecho: "TRANSPORTADO", hospitalDestino: "",
            dispositivoSeguranca: "NENHUM", observacoes: "",
          });
        }
        setVictimas(novasVictimas);
      }
    }
  }, [ocorrenciaId, ocorrenciasAbertas]);

  const toggleProcedimento = (proc: string) => {
    setForm((f) => ({
      ...f,
      procedimentosRealizados: f.procedimentosRealizados.includes(proc)
        ? f.procedimentosRealizados.filter((p) => p !== proc)
        : [...f.procedimentosRealizados, proc],
    }));
  };

  const toggleVictimaProcedimento = (index: number, proc: string) => {
    setVictimas((prev) => {
      const novas = [...prev];
      novas[index].procedimentos = novas[index].procedimentos.includes(proc)
        ? novas[index].procedimentos.filter((p) => p !== proc)
        : [...novas[index].procedimentos, proc];
      return novas;
    });
  };

  const atualizarVictima = (index: number, campo: string, valor: string) => {
    setVictimas((prev) => {
      const novas = [...prev];
      (novas[index] as Record<string, unknown>)[campo] = valor;
      return novas;
    });
  };

  const handleSalvar = async () => {
    if (!ocorrenciaId || !viaturaEmpId) {
      alert("Selecione a ocorrência e a viatura");
      return;
    }

    setSalvando(true);
    try {
      // Salvar ficha principal
      const res = await fetch("/api/ficha-aph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ocorrenciaId,
          viaturaEmpenhadaId: viaturaEmpId,
          hora: form.hora,
          localOcorrencia: form.localOcorrencia,
          municipio: form.municipio,
          uf: form.uf,
          NaturezaChamada: form.NaturezaChamada,
          NumeroSAMU: form.NumeroSAMU,
          NumeroPM: form.NumeroPM,
          NumeroPC: form.NumeroPC,
          materiaisDeixados: form.materiaisDeixados,
          nomePaciente: form.nomePaciente,
          idadePaciente: form.idadePaciente,
          sexoPaciente: form.sexoPaciente,
          documentoPaciente: form.documentoPaciente,
          enderecoPaciente: form.enderecoPaciente,
          telefonePaciente: form.telefonePaciente,
          nomeMaePaciente: form.nomeMaePaciente,
          pesoPaciente: form.pesoPaciente,
          alturaPaciente: form.alturaPaciente,
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
          procedimentosRealizados: form.procedimentosRealizados,
          desfecho: form.desfecho,
          hospitalDestino: form.hospitalDestino,
          horaChegadaHospital: form.horaChegadaHospital,
          horaEntregaPaciente: form.horaEntregaPaciente,
          medicoRecebedor: form.medicoRecebedor,
          dispositivoSeguranca: form.dispositivoSeguranca,
          termoRecusa: form.termoRecusa,
          textoRecusa: form.textoRecusa,
          observacoes: form.observacoes,
          recursosAdicionais: form.recursosAdicionais,
          victimas: victimas.map((v) => ({
            ...v,
            idadeVitima: v.idadeVitima ? parseInt(v.idadeVitima) : null,
          })),
        }),
      });

      if (res.ok) {
        alert("Ficha APH salva com sucesso!");
        router.push("/central");
      } else {
        const data = await res.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      alert("Erro ao salvar ficha APH");
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ficha de Atendimento Pré-Hospitalar</h1>
          <p className="text-gray-400">Portaria MS nº 2048 / Diretriz Operacional CBMSC nº 02</p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={salvando || !ocorrenciaId || !viaturaEmpId}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar Ficha"}
        </button>
      </div>

      {/* Seleção da Ocorrência */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ocorrência *</label>
            <select
              value={ocorrenciaId}
              onChange={(e) => setOcorrenciaId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">Selecione a ocorrência</option>
              {ocorrenciasAbertas.map((oc) => (
                <option key={oc.id} value={oc.id}>
                  #{oc.numeroSequencial} - {oc.tipo} ({oc.qtdVitimas} vítima(s))
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Viatura *</label>
            <select
              value={viaturaEmpId}
              onChange={(e) => setViaturaEmpId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">Selecione a viatura</option>
              {viaturaEmpenhadas.map((ve) => (
                <option key={ve.id} value={ve.id}>
                  {ve.viatura.identificacao} - {ve.viatura.placa}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {ocorrencia && (
        <div className="space-y-6">
          {/* Dados da Ocorrência */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Dados da Ocorrência</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nº Ocorrência</label>
                <input
                  type="text"
                  value={`#${ocorrencia.numeroSequencial}`}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("pt-BR")}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hora *</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nº Ficha</label>
                <input
                  type="text"
                  value={`${(ocorrencia.fichasAPH?.length || 0) + 1}`}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Local da Ocorrência */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Local da Ocorrência</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Endereço</label>
                <input
                  type="text"
                  value={form.localOcorrencia}
                  onChange={(e) => setForm({ ...form, localOcorrencia: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Município</label>
                <input
                  type="text"
                  value={form.municipio}
                  onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">UF</label>
                <input
                  type="text"
                  value={form.uf}
                  onChange={(e) => setForm({ ...form, uf: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Natureza da Chamada</label>
                <input
                  type="text"
                  value={form.NaturezaChamada}
                  onChange={(e) => setForm({ ...form, NaturezaChamada: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nº SAMU</label>
                <input
                  type="text"
                  value={form.NumeroSAMU}
                  onChange={(e) => setForm({ ...form, NumeroSAMU: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nº PM</label>
                <input
                  type="text"
                  value={form.NumeroPM}
                  onChange={(e) => setForm({ ...form, NumeroPM: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nº PC</label>
                <input
                  type="text"
                  value={form.NumeroPC}
                  onChange={(e) => setForm({ ...form, NumeroPC: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Informações do Paciente */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Informações do Paciente</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nomePaciente}
                  onChange={(e) => setForm({ ...form, nomePaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Idade</label>
                <input
                  type="number"
                  value={form.idadePaciente}
                  onChange={(e) => setForm({ ...form, idadePaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sexo</label>
                <select
                  value={form.sexoPaciente}
                  onChange={(e) => setForm({ ...form, sexoPaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Documento</label>
                <input
                  type="text"
                  value={form.documentoPaciente}
                  onChange={(e) => setForm({ ...form, documentoPaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={form.pesoPaciente}
                  onChange={(e) => setForm({ ...form, pesoPaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={form.alturaPaciente}
                  onChange={(e) => setForm({ ...form, alturaPaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={form.telefonePaciente}
                  onChange={(e) => setForm({ ...form, telefonePaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Endereço</label>
                <input
                  type="text"
                  value={form.enderecoPaciente}
                  onChange={(e) => setForm({ ...form, enderecoPaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Nome da Mãe</label>
                <input
                  type="text"
                  value={form.nomeMaePaciente}
                  onChange={(e) => setForm({ ...form, nomeMaePaciente: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Avaliação do Paciente */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Avaliação do Paciente</h2>
            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">P.A.</label>
                <input
                  type="text"
                  value={form.pressaoArterial}
                  onChange={(e) => setForm({ ...form, pressaoArterial: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="120x80"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pulso</label>
                <input
                  type="text"
                  value={form.pulso}
                  onChange={(e) => setForm({ ...form, pulso: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">FR</label>
                <input
                  type="text"
                  value={form.respiracaoFrequencia}
                  onChange={(e) => setForm({ ...form, respiracaoFrequencia: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Temp</label>
                <input
                  type="text"
                  value={form.temperatura}
                  onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">SpO2</label>
                <input
                  type="text"
                  value={form.spO2}
                  onChange={(e) => setForm({ ...form, spO2: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Glasgow</label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={form.glasgow}
                  onChange={(e) => setForm({ ...form, glasgow: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Via Aérea</label>
                <input
                  type="text"
                  value={form.viaAerea}
                  onChange={(e) => setForm({ ...form, viaAerea: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Respiração</label>
                <input
                  type="text"
                  value={form.respiracao}
                  onChange={(e) => setForm({ ...form, respiracao: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Circulação</label>
                <input
                  type="text"
                  value={form.circulacao}
                  onChange={(e) => setForm({ ...form, circulacao: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Escala Dor</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.DorEscala}
                  onChange={(e) => setForm({ ...form, DorEscala: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">Histórico Clínico</label>
              <textarea
                value={form.historicoClinico}
                onChange={(e) => setForm({ ...form, historicoClinico: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20"
              />
            </div>
          </div>

          {/* Procedimentos Realizados */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Procedimentos Realizados</h2>
            <div className="grid grid-cols-3 gap-2">
              {PROCEDIMENTOS.map((proc) => (
                <label key={proc} className="flex items-center gap-2 text-sm text-gray-300 p-2 rounded hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={form.procedimentosRealizados.includes(proc)}
                    onChange={() => toggleProcedimento(proc)}
                    className="w-4 h-4 rounded"
                  />
                  {proc}
                </label>
              ))}
            </div>
          </div>

          {/* Desfecho e Destino */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Desfecho e Destino</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Desfecho *</label>
                <select
                  value={form.desfecho}
                  onChange={(e) => setForm({ ...form, desfecho: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {DESFECHOS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hospital Destino</label>
                <input
                  type="text"
                  value={form.hospitalDestino}
                  onChange={(e) => setForm({ ...form, hospitalDestino: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Médico Recebedor</label>
                <input
                  type="text"
                  value={form.medicoRecebedor}
                  onChange={(e) => setForm({ ...form, medicoRecebedor: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Dispositivo Segurança</label>
                <select
                  value={form.dispositivoSeguranca}
                  onChange={(e) => setForm({ ...form, dispositivoSeguranca: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {DISPOSITIVOS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20"
              />
            </div>
          </div>

          {/* Vítimas (se houver) */}
          {victimas.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4">
                Vítimas ({victimas.length})
              </h2>
              <div className="space-y-6">
                {victimas.map((vitima, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-white font-medium mb-3">Vítima {idx + 1}</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Nome</label>
                        <input
                          type="text"
                          value={vitima.nomeVitima}
                          onChange={(e) => atualizarVictima(idx, "nomeVitima", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Idade</label>
                        <input
                          type="number"
                          value={vitima.idadeVitima}
                          onChange={(e) => atualizarVictima(idx, "idadeVitima", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Sexo</label>
                        <select
                          value={vitima.sexoVitima}
                          onChange={(e) => atualizarVictima(idx, "sexoVitima", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        >
                          <option value="M">M</option>
                          <option value="F">F</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">P.A.</label>
                        <input
                          type="text"
                          value={vitima.pressaoArterial}
                          onChange={(e) => atualizarVictima(idx, "pressaoArterial", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">SpO2</label>
                        <input
                          type="text"
                          value={vitima.spO2}
                          onChange={(e) => atualizarVictima(idx, "spO2", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Glasgow</label>
                        <input
                          type="number"
                          min="3"
                          max="15"
                          value={vitima.glasgow}
                          onChange={(e) => atualizarVictima(idx, "glasgow", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Queixa</label>
                        <input
                          type="text"
                          value={vitima.queixaPrincipal}
                          onChange={(e) => atualizarVictima(idx, "queixaPrincipal", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Desfecho</label>
                        <select
                          value={vitima.desfecho}
                          onChange={(e) => atualizarVictima(idx, "desfecho", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        >
                          <option value="TRANSPORTADO">Transportado</option>
                          <option value="NAO_TRANSPORTADO">Não Transportado</option>
                          <option value="OBITO">Óbito</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Hospital</label>
                        <input
                          type="text"
                          value={vitima.hospitalDestino}
                          onChange={(e) => atualizarVictima(idx, "hospitalDestino", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Obs.</label>
                        <input
                          type="text"
                          value={vitima.observacoes}
                          onChange={(e) => atualizarVictima(idx, "observacoes", e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
