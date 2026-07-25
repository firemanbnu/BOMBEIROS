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
  qtdVitimas: number;
  dataHoraChamada: string;
  dataHoraFechamento: string | null;
  viaturasEmpenhadas: Array<{ viatura: { identificacao: string } }>;
  fichasAPH: Array<{ id: string; victimas: Array<{ id: string }> }>;
};

export default function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [filtro, setFiltro] = useState("TODAS");
  const [carregando, setCarregando] = useState(true);

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
                <tr key={oc.id} className="border-b border-gray-800 hover:bg-gray-800/50">
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
    </div>
  );
}
