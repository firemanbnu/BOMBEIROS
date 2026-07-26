"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  createdAt: string;
};

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "CHEFE_SERVICO", label: "Chefe de Serviço" },
  { value: "OPERADOR", label: "Operador" },
  { value: "SOCORRISTA", label: "Socorrista" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  CHEFE_SERVICO: "Chefe de Serviço",
  OPERADOR: "Operador",
  SOCORRISTA: "Socorrista",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-600/20 text-red-400",
  CHEFE_SERVICO: "bg-purple-600/20 text-purple-400",
  OPERADOR: "bg-blue-600/20 text-blue-400",
  SOCORRISTA: "bg-green-600/20 text-green-400",
};

export default function UsuariosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as unknown as Record<string, unknown>)?.role === "ADMIN";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [formDados, setFormDados] = useState({ nome: "", email: "", senha: "", role: "SOCORRISTA" });
  const [salvando, setSalvando] = useState(false);

  const [editando, setEditando] = useState<Usuario | null>(null);
  const [formEdit, setFormEdit] = useState({ nome: "", email: "", role: "", ativo: true, senha: "" });

  const [excluindo, setExcluindo] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/central");
      return;
    }
    carregarUsuarios();
  }, [isAdmin, router]);

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch {
      setErro("Erro ao carregar usuários");
    } finally {
      setCarregando(false);
    }
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!formDados.nome || !formDados.email || !formDados.senha) {
      setErro("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      setSalvando(true);
      setErro("");
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDados),
      });
      if (res.ok) {
        setMostrarForm(false);
        setFormDados({ nome: "", email: "", senha: "", role: "SOCORRISTA" });
        await carregarUsuarios();
      } else {
        const data = await res.json();
        setErro(data.error || "Erro ao criar usuário");
      }
    } catch {
      setErro("Erro ao criar usuário");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    try {
      setSalvando(true);
      setErro("");
      const body: Record<string, unknown> = {
        id: editando.id,
        nome: formEdit.nome,
        email: formEdit.email,
        role: formEdit.role,
        ativo: formEdit.ativo,
      };
      if (formEdit.senha) body.senha = formEdit.senha;
      const res = await fetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditando(null);
        await carregarUsuarios();
      } else {
        const data = await res.json();
        setErro(data.error || "Erro ao atualizar usuário");
      }
    } catch {
      setErro("Erro ao atualizar usuário");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirUsuario() {
    if (!excluindo) return;
    try {
      const res = await fetch(`/api/usuarios?id=${excluindo.id}`, { method: "DELETE" });
      if (res.ok) {
        setExcluindo(null);
        await carregarUsuarios();
      } else {
        const data = await res.json();
        setErro(data.error || "Erro ao excluir usuário");
      }
    } catch {
      setErro("Erro ao excluir usuário");
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-gray-400 text-sm mt-1">Crie e gerencie acessos ao sistema</p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setErro(""); }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {erro && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-400 mt-3">Carregando...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-gray-400">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Perfil</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Criado em</th>
                <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${ROLE_COLORS[u.role] || "bg-gray-600/20 text-gray-400"}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.ativo ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-500"}`}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditando(u);
                          setFormEdit({ nome: u.nome, email: u.email, role: u.role, ativo: u.ativo, senha: "" });
                          setErro("");
                        }}
                        className="text-gray-400 hover:text-blue-400 p-1 rounded transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setExcluindo(u); setErro(""); }}
                        className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Novo Usuário */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Novo Usuário</h2>
              <button onClick={() => setMostrarForm(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={criarUsuario} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formDados.nome}
                  onChange={(e) => setFormDados({ ...formDados, nome: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={formDados.email}
                  onChange={(e) => setFormDados({ ...formDados, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Senha *</label>
                <input
                  type="password"
                  value={formDados.senha}
                  onChange={(e) => setFormDados({ ...formDados, senha: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Perfil de Acesso</label>
                <select
                  value={formDados.role}
                  onChange={(e) => setFormDados({ ...formDados, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {salvando ? "Criando..." : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário */}
      {editando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Editar Usuário</h2>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={salvarEdicao} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={formEdit.nome}
                  onChange={(e) => setFormEdit({ ...formEdit, nome: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formEdit.email}
                  onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nova Senha (deixe vazio para manter)</label>
                <input
                  type="password"
                  value={formEdit.senha}
                  onChange={(e) => setFormEdit({ ...formEdit, senha: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Perfil de Acesso</label>
                <select
                  value={formEdit.role}
                  onChange={(e) => setFormEdit({ ...formEdit, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Status:</label>
                <button
                  type="button"
                  onClick={() => setFormEdit({ ...formEdit, ativo: !formEdit.ativo })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formEdit.ativo ? "bg-red-600" : "bg-gray-600"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formEdit.ativo ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className={`text-sm ${formEdit.ativo ? "text-green-400" : "text-gray-500"}`}>
                  {formEdit.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {salvando ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {excluindo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Confirmar Exclusão</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-300">
                Tem certeza que deseja excluir o usuário <span className="text-white font-medium">{excluindo.nome}</span>?
              </p>
              <p className="text-gray-500 text-sm mt-2">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button
                onClick={() => setExcluindo(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={excluirUsuario}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
