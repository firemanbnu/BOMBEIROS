"use client";

import { useState, useEffect } from "react";

type Guarnicao = {
  id: string;
  nome: string;
  matricula: string;
  funcao: string;
  habilitacoes: string[];
  ativo: boolean;
};

const FUNCOES = [
  { value: "COMANDANTE", label: "Comandante" },
  { value: "SOCORRISTA_1", label: "Socorrista 1 (S1)" },
  { value: "SOCORRISTA_2", label: "Socorrista 2 (S2)" },
  { value: "SOCORRISTA_3", label: "Socorrista 3 (S3)" },
  { value: "MOTORISTA", label: "Motorista" },
  { value: "BOMBEIRO", label: "Bombeiro" },
];

const HABILITACOES = [
  "APH Básico",
  "APH Avançado",
  "Resgate",
  "Incêndio",
  "Busca e Salvamento",
  "Produtos Perigosos",
  "Motorista Viatura",
];

export default function GuarnicoesPage() {
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Guarnicao | null>(null);
  const [form, setForm] = useState({
    nome: "",
    matricula: "",
    funcao: "SOCORRISTA_1",
    habilitacoes: [] as string[],
  });

  useEffect(() => {
    carregarGuarnicoes();
  }, []);

  const carregarGuarnicoes = async () => {
    const res = await fetch("/api/guarnicoes");
    const data = await res.json();
    setGuarnicoes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await fetch("/api/guarnicoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editando.id }),
      });
    } else {
      await fetch("/api/guarnicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setMostrarForm(false);
    setEditando(null);
    setForm({ nome: "", matricula: "", funcao: "SOCORRISTA_1", habilitacoes: [] });
    carregarGuarnicoes();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta guarnição?")) {
      await fetch(`/api/guarnicoes?id=${id}`, { method: "DELETE" });
      carregarGuarnicoes();
    }
  };

  const handleEdit = (g: Guarnicao) => {
    setForm({
      nome: g.nome,
      matricula: g.matricula,
      funcao: g.funcao,
      habilitacoes: g.habilitacoes || [],
    });
    setEditando(g);
    setMostrarForm(true);
  };

  const toggleHabilitacao = (hab: string) => {
    setForm({
      ...form,
      habilitacoes: form.habilitacoes.includes(hab)
        ? form.habilitacoes.filter((h) => h !== hab)
        : [...form.habilitacoes, hab],
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Guarnições</h1>
          <p className="text-gray-400">Gerencie os membros da corporação</p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditando(null); setForm({ nome: "", matricula: "", funcao: "SOCORRISTA_1", habilitacoes: [] }); }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          + Nova Guarnição
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Matrícula</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Função</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Habilitações</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Status</th>
              <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {guarnicoes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma guarnição cadastrada
                </td>
              </tr>
            ) : (
              guarnicoes.map((g) => (
                <tr key={g.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white font-medium">{g.nome}</td>
                  <td className="px-4 py-3 text-gray-300">{g.matricula}</td>
                  <td className="px-4 py-3 text-gray-300">{FUNCOES.find(f => f.value === g.funcao)?.label || g.funcao}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(g.habilitacoes || []).slice(0, 2).map((h, i) => (
                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                          {h}
                        </span>
                      ))}
                      {(g.habilitacoes || []).length > 2 && (
                        <span className="text-xs text-gray-500">+{(g.habilitacoes || []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${g.ativo ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}`}>
                      {g.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(g)} className="text-blue-400 hover:text-blue-300 text-sm mr-3">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="text-red-400 hover:text-red-300 text-sm">
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
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-semibold text-lg mb-4">
              {editando ? "Editar Guarnição" : "Nova Guarnição"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Matrícula *</label>
                <input
                  type="text"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Função *</label>
                <select
                  value={form.funcao}
                  onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {FUNCOES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Habilitações</label>
                <div className="grid grid-cols-2 gap-2">
                  {HABILITACOES.map((hab) => (
                    <label key={hab} className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.habilitacoes.includes(hab)}
                        onChange={() => toggleHabilitacao(hab)}
                        className="w-4 h-4 rounded"
                      />
                      {hab}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setMostrarForm(false); setEditando(null); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                >
                  {editando ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
