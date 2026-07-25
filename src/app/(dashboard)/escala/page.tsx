"use client";

import { useState, useEffect } from "react";

type Viatura = { id: string; identificacao: string; placa: string; tipo: string };
type Guarnicao = { id: string; nome: string; matricula: string; funcao: string };
type Escala = {
  id: string;
  viatura: { identificacao: string };
  guarnicao: { nome: string; funcao: string };
  funcaoNaViatura: string;
  dataInicio: string;
  dataFim: string;
};

const FUNCOES_VIATURA = [
  { value: "CMT", label: "Comandante (CMT)" },
  { value: "S1", label: "Socorrista 1 (S1)" },
  { value: "S2", label: "Socorrista 2 (S2)" },
  { value: "S3", label: "Socorrista 3 (S3)" },
  { value: "MOTORISTA_ESC", label: "Motorista" },
];

export default function EscalaPage() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    viaturaId: "",
    guarnicaoId: "",
    funcaoNaViatura: "S1",
    dataInicio: "",
    dataFim: "",
    observacoes: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [resEscalas, resViaturas, resGuarnicoes] = await Promise.all([
      fetch("/api/escalas"),
      fetch("/api/viaturas"),
      fetch("/api/guarnicoes"),
    ]);
    setEscalas(await resEscalas.json());
    setViaturas((await resViaturas.json()).filter((v: Viatura & { ativo: boolean }) => v.ativo));
    setGuarnicoes((await resGuarnicoes.json()).filter((g: Guarnicao & { ativo: boolean }) => g.ativo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/escalas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMostrarForm(false);
    setForm({ viaturaId: "", guarnicaoId: "", funcaoNaViatura: "S1", dataInicio: "", dataFim: "", observacoes: "" });
    carregarDados();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover esta escala?")) {
      await fetch(`/api/escalas?id=${id}`, { method: "DELETE" });
      carregarDados();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Escala de Serviço</h1>
          <p className="text-gray-400">Atribua guarnições às viaturas</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          + Nova Escala
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Viatura</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Guarnição</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Função na Viatura</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Início</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Fim</th>
              <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {escalas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma escala cadastrada
                </td>
              </tr>
            ) : (
              escalas.map((e) => (
                <tr key={e.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white font-medium">{e.viatura.identificacao}</td>
                  <td className="px-4 py-3 text-gray-300">{e.guarnicao.nome}</td>
                  <td className="px-4 py-3 text-gray-300">{FUNCOES_VIATURA.find(f => f.value === e.funcaoNaViatura)?.label || e.funcaoNaViatura}</td>
                  <td className="px-4 py-3 text-gray-300">{new Date(e.dataInicio).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-gray-300">{new Date(e.dataFim).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-300 text-sm">
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-white font-semibold text-lg mb-4">Nova Escala</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Viatura *</label>
                <select
                  value={form.viaturaId}
                  onChange={(e) => setForm({ ...form, viaturaId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option value="">Selecione</option>
                  {viaturas.map((v) => (
                    <option key={v.id} value={v.id}>{v.identificacao} - {v.placa}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Guarnição *</label>
                <select
                  value={form.guarnicaoId}
                  onChange={(e) => setForm({ ...form, guarnicaoId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option value="">Selecione</option>
                  {guarnicoes.map((g) => (
                    <option key={g.id} value={g.id}>{g.nome} ({g.matricula})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Função na Viatura *</label>
                <select
                  value={form.funcaoNaViatura}
                  onChange={(e) => setForm({ ...form, funcaoNaViatura: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {FUNCOES_VIATURA.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data/Hora Início *</label>
                  <input
                    type="datetime-local"
                    value={form.dataInicio}
                    onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data/Hora Fim *</label>
                  <input
                    type="datetime-local"
                    value={form.dataFim}
                    onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-16"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
