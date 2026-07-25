"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Ocorrencia = {
  id: string;
  numeroSequencial: number;
  tipo: string;
  status: string;
  prioridade: string;
  descricao: string | null;
  localizacao: string | null;
  bairro: string | null;
  referencias: string | null;
  qtdVitimas: number;
  dataHoraChamada: string;
  dataHoraAbertura: string;
  dataHoraFechamento: string | null;
  viaturasEmpenhadas: Array<{
    id: string;
    viatura: { id: string; identificacao: string; placa: string; tipo: string };
    horaAcionamento: string | null;
    horaChegadaLocal: string | null;
    horaTermino: string | null;
    horaChegadaQuartel: string | null;
    horaDeslocamentoHospital: string | null;
    horaChegadaHospital: string | null;
    status: string;
  }>;
  fichasAPH: Array<{ id: string; numeroFicha: string; victimas: Array<{ id: string }> }>;
  operador: { nome: string } | null;
};

type Viatura = {
  id: string;
  identificacao: string;
  placa: string;
  tipo: string;
};

export default function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [filtro, setFiltro] = useState("TODAS");
  const [carregando, setCarregando] = useState(true);
  const [ocorrenciaDetalhe, setOcorrenciaDetalhe] = useState<Ocorrencia | null>(null);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [mostrarEmpenho, setMostrarEmpenho] = useState(false);
  const [viaturaSelecionada, setViaturaSelecionada] = useState("");

  useEffect(() => {
    carregarOcorrencias();
  }, [filtro]);

  const carregarOcorrencias = async () => {
    setCarregando(true);
    try {
      const url = filtro === "TODAS" ? "/api/ocorrencias" : `/api/ocorrencias?status=${filtro}`;
      const res = await fetch(url);
      const data = await res.json();
      setOcorrencias(data);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setCarregando(false);
    }
  };

  const abrirDetalhe = async (id: string) => {
    const res = await fetch(`/api/ocorrencias?id=${id}`);
    const data = await res.json();
    setOcorrenciaDetalhe(data);

    const resV = await fetch("/api/viaturas");
    const vData = await resV.json();
    setViaturas(vData.filter((v: Viatura & { ativo: boolean }) => v.ativo));
  };

  const encerrarOcorrencia = async (id: string) => {
    await fetch("/api/ocorrencias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "ENCERRADA" }),
    });
    setOcorrenciaDetalhe(null);
    carregarOcorrencias();
  };

  const empenharViatura = async () => {
    if (!viaturaSelecionada || !ocorrenciaDetalhe) return;
    await fetch("/api/viaturas-empenhadas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ocorrenciaId: ocorrenciaDetalhe.id,
        viaturaId: viaturaSelecionada,
      }),
    });
    setMostrarEmpenho(false);
    setViaturaSelecionada("");
    abrirDetalhe(ocorrenciaDetalhe.id);
    carregarOcorrencias();
  };

  const atualizarStatusViatura = async (empenhoId: string, status: string) => {
    await fetch("/api/viaturas-empenhadas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: empenhoId, status }),
    });
    if (ocorrenciaDetalhe) abrirDetalhe(ocorrenciaDetalhe.id);
    carregarOcorrencias();
  };

  const registrarHorario = async (empenhoId: string, campo: string) => {
    const statusMap: Record<string, string> = {
      horaAcionamento: "ACIONADA",
      horaChegadaLocal: "A_CENA",
      horaTermino: "EM_ATENDIMENTO",
      horaDeslocamentoHospital: "RETORNO",
      horaChegadaQuartel: "NO_QUARTEL",
    };
    await fetch("/api/viaturas-empenhadas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: empenhoId, [campo]: new Date().toISOString(), status: statusMap[campo] }),
    });
    if (ocorrenciaDetalhe) abrirDetalhe(ocorrenciaDetalhe.id);
    carregarOcorrencias();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ocorrências</h1>
          <p className="text-gray-400">Histórico e acompanhamento de ocorrências</p>
        </div>
        <Link
          href="/central"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Ir para Central
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {["TODAS", "ABERTA", "EM_ATENDIMENTO", "ENCERRADA"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">#</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Tipo</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Prioridade</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Data/Hora</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Viaturas</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">APH</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Carregando...</td></tr>
            ) : ocorrencias.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhuma ocorrência encontrada</td></tr>
            ) : (
              ocorrencias.map((oc) => (
                <tr
                  key={oc.id}
                  onDoubleClick={() => abrirDetalhe(oc.id)}
                  className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer select-none"
                >
                  <td className="px-4 py-3 text-white font-medium">#{oc.numeroSequencial}</td>
                  <td className="px-4 py-3 text-gray-300">{oc.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      oc.prioridade === "ALTA" ? "bg-red-600/20 text-red-400" :
                      oc.prioridade === "MEDIA" ? "bg-yellow-600/20 text-yellow-400" :
                      "bg-green-600/20 text-green-400"
                    }`}>
                      {oc.prioridade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      oc.status === "ABERTA" ? "bg-blue-600/20 text-blue-400" :
                      oc.status === "EM_ATENDIMENTO" ? "bg-yellow-600/20 text-yellow-400" :
                      "bg-gray-600/20 text-gray-400"
                    }`}>
                      {oc.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {new Date(oc.dataHoraChamada).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {oc.viaturasEmpenhadas.map((v, i) => (
                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                          {v.viatura.identificacao}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {oc.qtdVitimas > 0 ? (
                      <span className={`${oc.fichasAPH.length >= oc.qtdVitimas ? "text-green-400" : "text-yellow-400"}`}>
                        {oc.fichasAPH.length}/{oc.qtdVitimas}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalhe da Ocorrência */}
      {ocorrenciaDetalhe && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Ocorrência #{ocorrenciaDetalhe.numeroSequencial}
                </h2>
                <p className="text-gray-400 text-sm">
                  {ocorrenciaDetalhe.tipo} • {ocorrenciaDetalhe.status.replace("_", " ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {ocorrenciaDetalhe.viaturasEmpenhadas.length > 0 &&
                  ocorrenciaDetalhe.viaturasEmpenhadas.every(
                    (v) => v.status === "NO_QUARTEL" || v.status === "DESPACHADA"
                  ) && ocorrenciaDetalhe.status !== "ENCERRADA" && (
                  <button
                    onClick={() => encerrarOcorrencia(ocorrenciaDetalhe.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                  >
                    Encerrar Ocorrência
                  </button>
                )}
                <button
                  onClick={() => setOcorrenciaDetalhe(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Info Geral */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Descrição:</span>
                    <p className="text-white">{ocorrenciaDetalhe.descricao || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Prioridade:</span>
                    <p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ocorrenciaDetalhe.prioridade === "ALTA" ? "bg-red-600/20 text-red-400" :
                        ocorrenciaDetalhe.prioridade === "MEDIA" ? "bg-yellow-600/20 text-yellow-400" :
                        "bg-green-600/20 text-green-400"
                      }`}>
                        {ocorrenciaDetalhe.prioridade}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Local:</span>
                    <p className="text-white">
                      {ocorrenciaDetalhe.localizacao || "—"}
                      {ocorrenciaDetalhe.bairro && `, ${ocorrenciaDetalhe.bairro}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Chamado:</span>
                    <p className="text-white">
                      {new Date(ocorrenciaDetalhe.dataHoraChamada).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Viaturas Empenhadas */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Viaturas Empenhadas</h3>
                  {ocorrenciaDetalhe.status !== "ENCERRADA" && (
                    <button
                      onClick={() => setMostrarEmpenho(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      + Empenhar
                    </button>
                  )}
                </div>

                {ocorrenciaDetalhe.viaturasEmpenhadas.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma viatura empenhada</p>
                ) : (
                  <div className="space-y-3">
                    {ocorrenciaDetalhe.viaturasEmpenhadas.map((emp) => (
                      <div key={emp.id} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold">{emp.viatura.identificacao}</span>
                            <span className="text-gray-400 text-sm">{emp.viatura.placa}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              emp.status === "NO_QUARTEL" ? "bg-green-600" :
                              emp.status === "ACIONADA" ? "bg-blue-600" :
                              emp.status === "A_CENA" ? "bg-yellow-600" :
                              emp.status === "EM_ATENDIMENTO" ? "bg-orange-600" :
                              emp.status === "RETORNO" ? "bg-purple-600" :
                              "bg-gray-600"
                            }`}>
                              {emp.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          {ocorrenciaDetalhe.status !== "ENCERRADA" && (
                            <div className="flex gap-2">
                              {emp.status === "ACIONADA" && (
                                <button onClick={() => atualizarStatusViatura(emp.id, "A_CENA")} className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded">
                                  Chegou ao Local
                                </button>
                              )}
                              {emp.status === "A_CENA" && (
                                <button onClick={() => atualizarStatusViatura(emp.id, "EM_ATENDIMENTO")} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded">
                                  Em Atendimento
                                </button>
                              )}
                              {emp.status === "EM_ATENDIMENTO" && (
                                <button onClick={() => atualizarStatusViatura(emp.id, "RETORNO")} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded">
                                  Retornando
                                </button>
                              )}
                              {emp.status === "RETORNO" && (
                                <button onClick={() => atualizarStatusViatura(emp.id, "NO_QUARTEL")} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">
                                  Chegou ao Quartel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div
                            onClick={() => !emp.horaAcionamento && ocorrenciaDetalhe.status !== "ENCERRADA" && registrarHorario(emp.id, "horaAcionamento")}
                            className={`${emp.horaAcionamento ? "text-white" : "text-gray-600 cursor-pointer hover:text-blue-400 hover:bg-gray-800 rounded p-1 transition-colors"}`}
                            title={!emp.horaAcionamento ? "Clique para registrar horário" : undefined}
                          >
                            <span className="text-gray-500">Acionamento:</span><br />
                            {emp.horaAcionamento ? new Date(emp.horaAcionamento).toLocaleTimeString("pt-BR") : "--:--"}
                          </div>
                          <div
                            onClick={() => !emp.horaChegadaLocal && ocorrenciaDetalhe.status !== "ENCERRADA" && registrarHorario(emp.id, "horaChegadaLocal")}
                            className={`${emp.horaChegadaLocal ? "text-white" : "text-gray-600 cursor-pointer hover:text-blue-400 hover:bg-gray-800 rounded p-1 transition-colors"}`}
                            title={!emp.horaChegadaLocal ? "Clique para registrar horário" : undefined}
                          >
                            <span className="text-gray-500">Chegada Local:</span><br />
                            {emp.horaChegadaLocal ? new Date(emp.horaChegadaLocal).toLocaleTimeString("pt-BR") : "--:--"}
                          </div>
                          <div
                            onClick={() => !emp.horaTermino && ocorrenciaDetalhe.status !== "ENCERRADA" && registrarHorario(emp.id, "horaTermino")}
                            className={`${emp.horaTermino ? "text-white" : "text-gray-600 cursor-pointer hover:text-blue-400 hover:bg-gray-800 rounded p-1 transition-colors"}`}
                            title={!emp.horaTermino ? "Clique para registrar horário" : undefined}
                          >
                            <span className="text-gray-500">Término:</span><br />
                            {emp.horaTermino ? new Date(emp.horaTermino).toLocaleTimeString("pt-BR") : "--:--"}
                          </div>
                          <div
                            onClick={() => !emp.horaDeslocamentoHospital && ocorrenciaDetalhe.status !== "ENCERRADA" && registrarHorario(emp.id, "horaDeslocamentoHospital")}
                            className={`${emp.horaDeslocamentoHospital ? "text-white" : "text-gray-600 cursor-pointer hover:text-blue-400 hover:bg-gray-800 rounded p-1 transition-colors"}`}
                            title={!emp.horaDeslocamentoHospital ? "Clique para registrar horário" : undefined}
                          >
                            <span className="text-gray-500">Desl. Hospital:</span><br />
                            {emp.horaDeslocamentoHospital ? new Date(emp.horaDeslocamentoHospital).toLocaleTimeString("pt-BR") : "--:--"}
                          </div>
                          <div
                            onClick={() => !emp.horaChegadaQuartel && ocorrenciaDetalhe.status !== "ENCERRADA" && registrarHorario(emp.id, "horaChegadaQuartel")}
                            className={`${emp.horaChegadaQuartel ? "text-white" : "text-gray-600 cursor-pointer hover:text-blue-400 hover:bg-gray-800 rounded p-1 transition-colors"}`}
                            title={!emp.horaChegadaQuartel ? "Clique para registrar horário" : undefined}
                          >
                            <span className="text-gray-500">Chegada Quartel:</span><br />
                            {emp.horaChegadaQuartel ? new Date(emp.horaChegadaQuartel).toLocaleTimeString("pt-BR") : "--:--"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fichas APH */}
              {ocorrenciaDetalhe.qtdVitimas > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Fichas APH ({ocorrenciaDetalhe.fichasAPH.length}/{ocorrenciaDetalhe.qtdVitimas})
                  </h3>
                  {ocorrenciaDetalhe.fichasAPH.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhuma ficha preenchida</p>
                  ) : (
                    <div className="space-y-2">
                      {ocorrenciaDetalhe.fichasAPH.map((ficha) => (
                        <div key={ficha.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700">
                          <span className="text-white font-medium">Ficha #{ficha.numeroFicha}</span>
                          <span className="text-gray-400 text-sm">{ficha.victimas.length} vítima(s)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Empenho */}
          {mostrarEmpenho && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
              <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
                <h3 className="text-white font-semibold text-lg mb-4">Empenhar Viatura</h3>
                <select
                  value={viaturaSelecionada}
                  onChange={(e) => setViaturaSelecionada(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
                >
                  <option value="">Selecione uma viatura</option>
                  {viaturas.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.identificacao} - {v.placa} ({v.tipo})
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMostrarEmpenho(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={empenharViatura}
                    disabled={!viaturaSelecionada}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Empenhar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
