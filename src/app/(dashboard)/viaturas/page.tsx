"use client";

import { useState, useEffect } from "react";

type Viatura = {
  id: string;
  placa: string;
  identificacao: string;
  tipo: string;
  capacidadeGuarnicao: number;
  equipamentoAPH: boolean;
  ativo: boolean;
};

const TIPOS_VIATURA = [
  { value: "ASU", label: "ASU - Auto Socorro de Urgência" },
  { value: "ABT", label: "ABT - Auto Bombeiro Tanque" },
  { value: "ABTC", label: "ABTC - Auto Bombeiro Tanque C" },
  { value: "APH", label: "APH - Atendimento Pré-Hospitalar" },
  { value: "CAVALO_MECANICO", label: "Cavalo Mecânico" },
  { value: "CAPOEIRA", label: "Capoeira" },
  { value: "MOTORREDATOR", label: "Motorredator" },
  { value: "SOCORRO_RAPIDO", label: "Socorro Rápido" },
  { value: "OUTROS", label: "Outros" },
];

export default function ViaturasPage() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Viatura | null>(null);
  const [form, setForm] = useState({
    placa: "",
    identificacao: "",
    tipo: "ASU",
    capacidadeGuarnicao: 3,
    equipamentoAPH: false,
  });

  useEffect(() => {
    carregarViaturas();
  }, []);

  const carregarViaturas = async () => {
    const res = await fetch("/api/viaturas");
    const data = await res.json();
    setViaturas(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await fetch("/api/viaturas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editando.id }),
      });
    } else {
      await fetch("/api/viaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setMostrarForm(false);
    setEditando(null);
    setForm({ placa: "", identificacao: "", tipo: "ASU", capacidadeGuarnicao: 3, equipamentoAPH: false });
    carregarViaturas();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta viatura?")) {
      await fetch(`/api/viaturas?id=${id}`, { method: "DELETE" });
      carregarViaturas();
    }
  };

  const handleEdit = (v: Viatura) => {
    setForm({
      placa: v.placa,
      identificacao: v.identificacao,
      tipo: v.tipo,
      capacidadeGuarnicao: v.capacidadeGuarnicao,
      equipamentoAPH: v.equipamentoAPH,
    });
    setEditando(v);
    setMostrarForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Viaturas</h1>
          <p className="text-gray-400">Gerencie as viaturas da corporação</p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditando(null); setForm({ placa: "", identificacao: "", tipo: "ASU", capacidadeGuarnicao: 3, equipamentoAPH: false }); }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          + Nova Viatura
        </button>
      </div>

      {/* Lista */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Identificação</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Placa</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Tipo</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Capacidade</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">APH</th>
              <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Status</th>
              <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {viaturas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma viatura cadastrada
                </td>
              </tr>
            ) : (
              viaturas.map((v) => (
                <tr key={v.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white font-medium">{v.identificacao}</td>
                  <td className="px-4 py-3 text-gray-300">{v.placa}</td>
                  <td className="px-4 py-3 text-gray-300">{TIPOS_VIATURA.find(t => t.value === v.tipo)?.label || v.tipo}</td>
                  <td className="px-4 py-3 text-gray-300">{v.capacidadeGuarnicao}</td>
                  <td className="px-4 py-3">
                    {v.equipamentoAPH ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${v.ativo ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}`}>
                      {v.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(v)} className="text-blue-400 hover:text-blue-300 text-sm mr-3">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-300 text-sm">
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-white font-semibold text-lg mb-4">
              {editando ? "Editar Viatura" : "Nova Viatura"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Identificação *</label>
                <input
                  type="text"
                  value={form.identificacao}
                  onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ex: ABT-01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Placa *</label>
                <input
                  type="text"
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="ABC-1234"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {TIPOS_VIATURA.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Capacidade Guarnição</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={form.capacidadeGuarnicao}
                  onChange={(e) => setForm({ ...form, capacidadeGuarnicao: parseInt(e.target.value) || 3 })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="equipamentoAPH"
                  checked={form.equipamentoAPH}
                  onChange={(e) => setForm({ ...form, equipamentoAPH: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="equipamentoAPH" className="text-sm text-gray-300">
                  Viatura equipada para APH
                </label>
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
