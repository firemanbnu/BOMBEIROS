"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Corporacao = {
  id: string;
  nome: string;
  cnpj: string | null;
  nomeFantasia: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
};

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [corporacao, setCorporacao] = useState<Corporacao | null>(null);
  const [form, setForm] = useState<Corporacao>({
    id: "", nome: "", cnpj: null, nomeFantasia: null,
    endereco: null, cidade: null, estado: null, cep: null,
    telefone: null, email: null, logoUrl: null,
    corPrimaria: "#DC2626", corSecundaria: "#1E3A5F",
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [uploadando, setUploadando] = useState(false);

  useEffect(() => {
    carregarCorporacao();
  }, []);

  const carregarCorporacao = async () => {
    try {
      const res = await fetch("/api/corporacao");
      const data = await res.json();
      if (data) {
        setCorporacao(data);
        setForm(data);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await fetch("/api/corporacao", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSalvando(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadando(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.logoUrl) {
        setForm({ ...form, logoUrl: data.logoUrl });
        setCorporacao({ ...corporacao!, logoUrl: data.logoUrl });
      }
    } catch (error) {
      console.error("Erro no upload:", error);
    } finally {
      setUploadando(false);
    }
  };

  if (carregando) {
    return (
      <div className="p-6">
        <div className="text-gray-400">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações da Corporação</h1>
        <p className="text-gray-400">Gerencie os dados e a identidade da sua corporação</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo e Identidade Visual */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Identidade Visual</h2>
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center">
              <div
                className="w-32 h-32 rounded-lg border-2 border-gray-700 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: form.corPrimaria + "20" }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <label className="mt-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                {uploadando ? "Enviando..." : "Alterar Logo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome da Corporação *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={form.nomeFantasia || ""}
                  onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.corPrimaria}
                      onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.corPrimaria}
                      onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.corSecundaria}
                      onChange={(e) => setForm({ ...form, corSecundaria: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.corSecundaria}
                      onChange={(e) => setForm({ ...form, corSecundaria: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dados Cadastrais */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Dados Cadastrais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">CNPJ</label>
              <input
                type="text"
                value={form.cnpj || ""}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Telefone</label>
              <input
                type="text"
                value={form.telefone || ""}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Endereço</label>
              <input
                type="text"
                value={form.endereco || ""}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cidade</label>
              <input
                type="text"
                value={form.cidade || ""}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Estado</label>
              <input
                type="text"
                value={form.estado || ""}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="SC"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">CEP</label>
              <input
                type="text"
                value={form.cep || ""}
                onChange={(e) => setForm({ ...form, cep: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Pré-visualização</h2>
          <div
            className="rounded-lg p-4 flex items-center gap-4"
            style={{ backgroundColor: form.corPrimaria + "15", borderLeft: `4px solid ${form.corPrimaria}` }}
          >
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            )}
            <div>
              <h3 className="font-bold" style={{ color: form.corPrimaria }}>{form.nome || "Nome da Corporação"}</h3>
              <p className="text-sm text-gray-400">{form.cidade || "Cidade"}, {form.estado || "UF"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={salvando}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar Configurações"}
          </button>
          {sucesso && (
            <span className="text-green-400 text-sm">✓ Configurações salvas com sucesso!</span>
          )}
        </div>
      </form>
    </div>
  );
}
