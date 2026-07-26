"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TIPOS = ["APH", "INCENDIO", "RESGATE", "BUSCA_SALVAMENTO", "PREVENCAO", "ALAGAMENTO", "DESABAMENTO", "OUTROS"];
const PRIORIDADES = ["ALTA", "MEDIA", "BAIXA"];

export default function CentralPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as unknown as Record<string, unknown>)?.role === "ADMIN";
  const router = useRouter();
  const [ocorrencias, setOcorrencias] = useState<Array<{
    id: string;
    numeroSequencial: number;
    tipo: string;
    status: string;
    prioridade: string;
    qtdVitimas: number;
    dataHoraChamada: string;
    viaturasEmpenhadas: Array<{
      viatura: { identificacao: string };
      status: string;
    }>;
    fichasAPH: Array<{ id: string; victimas: Array<{ id: string }> }>;
  }>>([]);
  const [abaAtiva, setAbaAtiva] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarNovaOcorrencia, setMostrarNovaOcorrencia] = useState(false);

  useEffect(() => {
    carregarOcorrencias();
    const interval = setInterval(carregarOcorrencias, 5000);
    return () => clearInterval(interval);
  }, []);

  const carregarOcorrencias = async () => {
    try {
      const res = await fetch("/api/ocorrencias?status=ABERTA");
      const res2 = await fetch("/api/ocorrencias?status=EM_ATENDIMENTO");
      const abertas = await res.json();
      const emAtendimento = await res2.json();
      setOcorrencias([...abertas, ...emAtendimento]);
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error);
    } finally {
      setCarregando(false);
    }
  };

  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case "ALTA": return "bg-red-600";
      case "MEDIA": return "bg-yellow-500";
      case "BAIXA": return "bg-green-600";
      default: return "bg-gray-600";
    }
  };

  const getCorStatus = (status: string) => {
    switch (status) {
      case "ABERTA": return "bg-blue-600";
      case "EM_ATENDIMENTO": return "bg-yellow-600";
      case "ENCERRADA": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };

  const podeEncerrar = (oc: typeof ocorrencias[0]) => {
    if (oc.viaturasEmpenhadas.length === 0) return false;
    const todasViaturasRetornaram = oc.viaturasEmpenhadas.every(
      (v) => v.status === "NO_QUARTEL" || v.status === "DESPACHADA"
    );
    if (!todasViaturasRetornaram) return false;
    if (oc.qtdVitimas > 0) {
      const totalVictimasAtendidas = oc.fichasAPH.reduce((acc, f) => acc + f.victimas.length, 0);
      return totalVictimasAtendidas >= oc.qtdVitimas;
    }
    return oc.fichasAPH.length > 0;
  };

  const fichasPendentes = (oc: typeof ocorrencias[0]) => {
    if (oc.qtdVitimas <= 0) return oc.fichasAPH.length === 0 ? 1 : 0;
    const totalVictimasAtendidas = oc.fichasAPH.reduce((acc, f) => acc + f.victimas.length, 0);
    return Math.max(0, oc.qtdVitimas - totalVictimasAtendidas);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Central de Operações</h1>
          <span className="text-gray-400 text-sm">
            {new Date().toLocaleDateString("pt-BR")} - {new Date().toLocaleTimeString("pt-BR")}
          </span>
          {isAdmin && <span className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-0.5 rounded">ADMIN</span>}
        </div>
        <button
          onClick={() => setMostrarNovaOcorrencia(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Chamado
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 flex overflow-x-auto">
        <button
          onClick={() => setAbaAtiva(null)}
          className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            !abaAtiva ? "border-red-500 text-red-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Visão Geral
        </button>
        {ocorrencias.map((oc) => (
          <button
            key={oc.id}
            onClick={() => setAbaAtiva(oc.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              abaAtiva === oc.id ? "border-red-500 text-red-400" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${getCorPrioridade(oc.prioridade)}`} />
            #{oc.numeroSequencial} - {oc.tipo}
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCorStatus(oc.status)}`}>
              {oc.status.replace("_", " ")}
            </span>
            {podeEncerrar(oc) && (
              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                Pronto para encerrar
              </span>
            )}
            {!podeEncerrar(oc) && fichasPendentes(oc) > 0 && oc.status === "EM_ATENDIMENTO" && (
              <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                {fichasPendentes(oc)} ficha(s) pendente(s)
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {carregando ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Carregando...</div>
          </div>
        ) : !abaAtiva ? (
          <VisaoGeral ocorrencias={ocorrencias} isAdmin={isAdmin} onRecarregar={carregarOcorrencias} />
        ) : (
          <AbaOcorrencia
            ocorrenciaId={abaAtiva}
            isAdmin={isAdmin}
            onEncerrar={async () => {
              await fetch("/api/ocorrencias", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: abaAtiva, status: "ENCERRADA" }),
              });
              setAbaAtiva(null);
              carregarOcorrencias();
            }}
            onExcluir={async () => {
              await fetch(`/api/ocorrencias?id=${abaAtiva}`, { method: "DELETE" });
              setAbaAtiva(null);
              carregarOcorrencias();
            }}
          />
        )}
      </div>

      {/* Modal Nova Ocorrência */}
      {mostrarNovaOcorrencia && (
        <ModalNovaOcorrencia
          onClose={() => setMostrarNovaOcorrencia(false)}
          onCriar={async (data) => {
            const res = await fetch("/api/ocorrencias", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            const nova = await res.json();
            setMostrarNovaOcorrencia(false);
            carregarOcorrencias();
            setAbaAtiva(nova.id);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function VisaoGeral({
  ocorrencias,
  isAdmin,
  onRecarregar,
}: {
  ocorrencias: Array<{
    id: string;
    numeroSequencial: number;
    tipo: string;
    status: string;
    prioridade: string;
    qtdVitimas: number;
    dataHoraChamada: string;
    viaturasEmpenhadas: Array<{
      viatura: { identificacao: string };
      status: string;
    }>;
  }>;
  isAdmin: boolean;
  onRecarregar: () => void;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [formEdit, setFormEdit] = useState({ tipo: "", prioridade: "", descricao: "", localizacao: "", bairro: "", qtdVitimas: 0 });
  const [confirmandoDelete, setConfirmandoDelete] = useState<string | null>(null);

  const abertas = ocorrencias.filter((o) => o.status === "ABERTA");
  const emAtendimento = ocorrencias.filter((o) => o.status === "EM_ATENDIMENTO");

  const iniciarEdicao = (oc: typeof ocorrencias[0]) => {
    setFormEdit({ tipo: oc.tipo, prioridade: oc.prioridade, descricao: "", localizacao: "", bairro: "", qtdVitimas: oc.qtdVitimas });
    setEditando(oc.id);
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    await fetch("/api/ocorrencias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editando, ...formEdit }),
    });
    setEditando(null);
    onRecarregar();
  };

  const excluir = async (id: string) => {
    await fetch(`/api/ocorrencias?id=${id}`, { method: "DELETE" });
    setConfirmandoDelete(null);
    onRecarregar();
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Ocorrências Abertas</h3>
          <p className="text-4xl font-bold text-blue-400">{abertas.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Em Atendimento</h3>
          <p className="text-4xl font-bold text-yellow-400">{emAtendimento.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Total Ativas</h3>
          <p className="text-4xl font-bold text-white">{ocorrencias.length}</p>
        </div>

        <div className="col-span-full bg-gray-900 rounded-lg border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold">Ocorrências Recentes</h3>
          </div>
          {ocorrencias.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhuma ocorrência ativa no momento</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {ocorrencias.map((oc) => (
                <div key={oc.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50">
                  <div className="flex items-center gap-4">
                    <span className={`w-3 h-3 rounded-full ${oc.prioridade === "ALTA" ? "bg-red-500" : oc.prioridade === "MEDIA" ? "bg-yellow-500" : "bg-green-500"}`} />
                    <div>
                      <p className="text-white font-medium">#{oc.numeroSequencial} - {oc.tipo}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(oc.dataHoraChamada).toLocaleString("pt-BR")}
                        {oc.qtdVitimas > 0 && ` • ${oc.qtdVitimas} vítima(s)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {oc.viaturasEmpenhadas.map((v, i) => (
                      <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                        {v.viatura.identificacao}
                      </span>
                    ))}
                    {isAdmin && (
                      <>
                        <button onClick={() => iniciarEdicao(oc)} className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-2 py-1 rounded ml-2">Editar</button>
                        <button onClick={() => setConfirmandoDelete(oc.id)} className="text-xs bg-red-600/20 text-red-400 hover:bg-red-600/40 px-2 py-1 rounded">Excluir</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar */}
      {editando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-lg border border-gray-700 p-6">
            <h3 className="text-white font-bold text-lg mb-4">Editar Ocorrência</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                  <select value={formEdit.tipo} onChange={(e) => setFormEdit({ ...formEdit, tipo: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prioridade</label>
                  <select value={formEdit.prioridade} onChange={(e) => setFormEdit({ ...formEdit, prioridade: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Qtd Vítimas</label>
                <input type="number" min="0" value={formEdit.qtdVitimas} onChange={(e) => setFormEdit({ ...formEdit, qtdVitimas: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditando(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg">Cancelar</button>
              <button onClick={salvarEdicao} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmandoDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md border border-red-700 p-6">
            <h3 className="text-white font-bold text-lg mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">Tem certeza que deseja excluir esta ocorrência e todos os dados vinculados?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmandoDelete(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg">Cancelar</button>
              <button onClick={() => excluir(confirmandoDelete)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AbaOcorrencia({
  ocorrenciaId,
  isAdmin,
  onEncerrar,
  onExcluir,
}: {
  ocorrenciaId: string;
  isAdmin: boolean;
  onEncerrar: () => void;
  onExcluir: () => void;
}) {
  const [ocorrencia, setOcorrencia] = useState<{
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
  } | null>(null);
  const [viaturas, setViaturas] = useState<Array<{ id: string; identificacao: string; placa: string; tipo: string }>>([]);
  const [mostrarEmpenho, setMostrarEmpenho] = useState(false);
  const [viaturaSelecionada, setViaturaSelecionada] = useState("");
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({ tipo: "", prioridade: "", descricao: "", localizacao: "", bairro: "", referencias: "", qtdVitimas: 0, dataHoraChamada: "" });
  const [confirmandoDelete, setConfirmandoDelete] = useState(false);

  useEffect(() => {
    carregarOcorrencia();
    carregarViaturas();
  }, [ocorrenciaId]);

  const carregarOcorrencia = async () => {
    const res = await fetch(`/api/ocorrencias?id=${ocorrenciaId}`);
    const data = await res.json();
    setOcorrencia(data);
  };

  const carregarViaturas = async () => {
    const res = await fetch("/api/viaturas");
    const data = await res.json();
    setViaturas(data.filter((v: { ativo: boolean }) => v.ativo));
  };

  const empenharViatura = async () => {
    if (!viaturaSelecionada) return;
    await fetch("/api/viaturas-empenhadas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ocorrenciaId, viaturaId: viaturaSelecionada }),
    });
    setMostrarEmpenho(false);
    setViaturaSelecionada("");
    carregarOcorrencia();
  };

  const atualizarStatusViatura = async (empenhoId: string, status: string) => {
    await fetch("/api/viaturas-empenhadas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: empenhoId, status }),
    });
    carregarOcorrencia();
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
    carregarOcorrencia();
  };

  const iniciarEdicao = () => {
    if (!ocorrencia) return;
    setFormEdit({
      tipo: ocorrencia.tipo,
      prioridade: ocorrencia.prioridade,
      descricao: ocorrencia.descricao || "",
      localizacao: ocorrencia.localizacao || "",
      bairro: ocorrencia.bairro || "",
      referencias: ocorrencia.referencias || "",
      qtdVitimas: ocorrencia.qtdVitimas,
      dataHoraChamada: ocorrencia.dataHoraChamada.slice(0, 16),
    });
    setEditando(true);
  };

  const salvarEdicao = async () => {
    await fetch("/api/ocorrencias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ocorrenciaId, ...formEdit }),
    });
    setEditando(false);
    carregarOcorrencia();
  };

  const todasNoQuartel = ocorrencia?.viaturasEmpenhadas.every(
    (v) => v.status === "NO_QUARTEL" || v.status === "DESPACHADA"
  );

  const totalVictimasAtendidas = ocorrencia?.fichasAPH.reduce((acc, f) => acc + f.victimas.length, 0) || 0;
  const fichasCompletas = ocorrencia
    ? (ocorrencia.qtdVitimas > 0 ? totalVictimasAtendidas >= ocorrencia.qtdVitimas : ocorrencia.fichasAPH.length > 0)
    : false;
  const fichasPendentes = ocorrencia
    ? (ocorrencia.qtdVitimas > 0 ? Math.max(0, ocorrencia.qtdVitimas - totalVictimasAtendidas) : (ocorrencia.fichasAPH.length === 0 ? 1 : 0))
    : 0;

  if (!ocorrencia) {
    return <div className="text-gray-400">Carregando ocorrência...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header da Ocorrência */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Ocorrência #{ocorrencia.numeroSequencial}</h2>
            <p className="text-gray-400 mt-1">{ocorrencia.tipo} • {ocorrencia.status.replace("_", " ")}</p>
            {ocorrencia.descricao && <p className="text-gray-300 mt-2">{ocorrencia.descricao}</p>}
            {ocorrencia.localizacao && (
              <p className="text-gray-400 text-sm mt-1">📍 {ocorrencia.localizacao}{ocorrencia.bairro && `, ${ocorrencia.bairro}`}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={iniciarEdicao} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">Editar</button>
            )}
            {isAdmin && (
              <button onClick={() => setConfirmandoDelete(true)} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-2 rounded-lg text-sm font-medium">Excluir</button>
            )}
            {todasNoQuartel && ocorrencia.viaturasEmpenhadas.length > 0 && fichasCompletas && (
              <button onClick={onEncerrar} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">Encerrar Ocorrência</button>
            )}
            {todasNoQuartel && ocorrencia.viaturasEmpenhadas.length > 0 && !fichasCompletas && (
              <div className="text-yellow-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {fichasPendentes > 0 ? `${fichasPendentes} ficha(s) pendente(s)` : "Preencha pelo menos 1 ficha APH"}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="text-gray-400"><span className="text-gray-500">Chamado:</span> {new Date(ocorrencia.dataHoraChamada).toLocaleString("pt-BR")}</div>
          <div className="text-gray-400"><span className="text-gray-500">Abertura:</span> {new Date(ocorrencia.dataHoraAbertura).toLocaleString("pt-BR")}</div>
          {ocorrencia.qtdVitimas > 0 && (
            <div className="text-yellow-400">⚠ {ocorrencia.qtdVitimas} vítima(s) - Fichas APH: {ocorrencia.fichasAPH.length}/{ocorrencia.qtdVitimas}</div>
          )}
        </div>
      </div>

      {/* Viaturas Empenhadas */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold">Viaturas Empenhadas</h3>
          <button onClick={() => setMostrarEmpenho(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium">+ Empenhar Viatura</button>
        </div>
        {ocorrencia.viaturasEmpenhadas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma viatura empenhada</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {ocorrencia.viaturasEmpenhadas.map((emp) => (
              <div key={emp.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{emp.viatura.identificacao}</span>
                    <span className="text-gray-400 text-sm">{emp.viatura.placa}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${emp.status === "NO_QUARTEL" ? "bg-green-600" : emp.status === "ACIONADA" ? "bg-blue-600" : emp.status === "A_CENA" ? "bg-yellow-600" : emp.status === "EM_ATENDIMENTO" ? "bg-orange-600" : emp.status === "RETORNO" ? "bg-purple-600" : "bg-gray-600"}`}>
                      {emp.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {emp.status === "ACIONADA" && <button onClick={() => atualizarStatusViatura(emp.id, "A_CENA")} className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded">Chegou ao Local</button>}
                    {emp.status === "A_CENA" && <button onClick={() => atualizarStatusViatura(emp.id, "EM_ATENDIMENTO")} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded">Em Atendimento</button>}
                    {emp.status === "EM_ATENDIMENTO" && <button onClick={() => atualizarStatusViatura(emp.id, "RETORNO")} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded">Retornando</button>}
                    {emp.status === "RETORNO" && <button onClick={() => atualizarStatusViatura(emp.id, "NO_QUARTEL")} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">Chegou ao Quartel</button>}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {[["Acionamento", "horaAcionamento"], ["Chegada Local", "horaChegadaLocal"], ["Término", "horaTermino"], ["Desl. Hospital", "horaDeslocamentoHospital"], ["Chegada Quartel", "horaChegadaQuartel"]].map(([label, campo]) => (
                    <div key={campo} onClick={() => !(emp as Record<string, unknown>)[campo] && ocorrencia.status !== "ENCERRADA" && registrarHorario(emp.id, campo)} className={`${(emp as Record<string, unknown>)[campo] ? "text-white" : "text-gray-600 cursor-pointer hover:text-blue-400 hover:bg-gray-800 rounded p-1 transition-colors"}`} title={!(emp as Record<string, unknown>)[campo] ? "Clique para registrar horário" : undefined}>
                      <span className="text-gray-500">{label}:</span><br />
                      {(emp as Record<string, unknown>)[campo] ? new Date((emp as Record<string, unknown>)[campo] as string).toLocaleTimeString("pt-BR") : "--:--"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fichas APH */}
      {ocorrencia.qtdVitimas > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold">Fichas APH ({ocorrencia.fichasAPH.length}/{ocorrencia.qtdVitimas})</h3>
          </div>
          <div className="p-4">
            {ocorrencia.fichasAPH.map((ficha) => (
              <div key={ficha.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded mb-2">
                <span className="text-white">Ficha #{ficha.numeroFicha}</span>
                <span className="text-gray-400 text-sm">{ficha.victimas.length} vítima(s)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-2xl border border-gray-700">
            <div className="border-b border-gray-800 p-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Editar Ocorrência #{ocorrencia.numeroSequencial}</h3>
              <button onClick={() => setEditando(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                  <select value={formEdit.tipo} onChange={(e) => setFormEdit({ ...formEdit, tipo: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prioridade</label>
                  <select value={formEdit.prioridade} onChange={(e) => setFormEdit({ ...formEdit, prioridade: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data/Hora da Chamada</label>
                <input type="datetime-local" value={formEdit.dataHoraChamada} onChange={(e) => setFormEdit({ ...formEdit, dataHoraChamada: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea value={formEdit.descricao} onChange={(e) => setFormEdit({ ...formEdit, descricao: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Localização</label><input type="text" value={formEdit.localizacao} onChange={(e) => setFormEdit({ ...formEdit, localizacao: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Bairro</label><input type="text" value={formEdit.bairro} onChange={(e) => setFormEdit({ ...formEdit, bairro: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Referências</label><input type="text" value={formEdit.referencias} onChange={(e) => setFormEdit({ ...formEdit, referencias: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Qtd Vítimas</label><input type="number" min="0" value={formEdit.qtdVitimas} onChange={(e) => setFormEdit({ ...formEdit, qtdVitimas: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
              </div>
            </div>
            <div className="border-t border-gray-800 p-4 flex justify-end gap-3">
              <button onClick={() => setEditando(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Cancelar</button>
              <button onClick={salvarEdicao} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmandoDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md border border-red-700 p-6">
            <h3 className="text-white font-bold text-lg mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">Tem certeza que deseja excluir esta ocorrência e todos os dados vinculados?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmandoDelete(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg">Cancelar</button>
              <button onClick={onExcluir} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Empenho */}
      {mostrarEmpenho && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-white font-semibold text-lg mb-4">Empenhar Viatura</h3>
            <select value={viaturaSelecionada} onChange={(e) => setViaturaSelecionada(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4">
              <option value="">Selecione uma viatura</option>
              {viaturas.map((v) => <option key={v.id} value={v.id}>{v.identificacao} - {v.placa} ({v.tipo})</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setMostrarEmpenho(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg">Cancelar</button>
              <button onClick={empenharViatura} disabled={!viaturaSelecionada} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50">Empenhar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalNovaOcorrencia({ onClose, onCriar }: { onClose: () => void; onCriar: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ tipo: "APH", descricao: "", localizacao: "", bairro: "", referencias: "", qtdVitimas: 0, prioridade: "MEDIA" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCriar({ ...form, dataHoraChamada: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Novo Chamado</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                <option value="APH">Atendimento Pré-Hospitalar</option>
                <option value="INCENDIO">Incêndio</option>
                <option value="RESGATE">Resgate</option>
                <option value="BUSCA_SALVAMENTO">Busca e Salvamento</option>
                <option value="ALAGAMENTO">Alagamento</option>
                <option value="DESABAMENTO">Desabamento</option>
                <option value="PREVENCAO">Prevenção</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prioridade *</label>
              <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20" placeholder="Descreva a ocorrência..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Localização *</label>
            <input type="text" value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Endereço completo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-400 mb-1">Bairro</label><input type="text" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Referências</label><input type="text" value={form.referencias} onChange={(e) => setForm({ ...form, referencias: e.target.value })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantidade de Vítimas</label>
            <input type="number" min="0" value={form.qtdVitimas} onChange={(e) => setForm({ ...form, qtdVitimas: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
            {form.qtdVitimas > 0 && <p className="text-yellow-400 text-xs mt-1">Será necessário preencher {form.qtdVitimas} ficha(s) de APH</p>}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg">Cancelar</button>
            <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold">Criar Ocorrência</button>
          </div>
        </form>
      </div>
    </div>
  );
}
