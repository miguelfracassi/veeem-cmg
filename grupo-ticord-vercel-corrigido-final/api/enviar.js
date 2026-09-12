import crypto from "node:crypto";
import { readSubmissions, writeSubmissions } from "../lib/storage.js";

const MAX_BODY = 100 * 1024;

function validText(value, max = 2000) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function json(res, status, data) {
  res.status(status).json(data);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { erro: "Método não permitido." });
  }

  try {
    const rawLength = Number(req.headers["content-length"] || 0);
    if (rawLength > MAX_BODY) {
      return json(res, 413, { erro: "Requisição muito grande." });
    }

    const body = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

    const { nome, telefone, discord, motivo, mensagem } = body;

    if (![nome, telefone, discord, motivo, mensagem].every((campo) => validText(campo))) {
      return json(res, 400, { erro: "Preencha todos os campos corretamente." });
    }

    const envios = await readSubmissions();

    const novoEnvio = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      telefone: telefone.trim(),
      discord: discord.trim(),
      motivo: motivo.trim(),
      mensagem: mensagem.trim(),
      criadoEm: new Date().toISOString(),
    };

    envios.push(novoEnvio);
    await writeSubmissions(envios);

    return json(res, 201, { ok: true, id: novoEnvio.id });
  } catch (error) {
    console.error("Erro ao salvar formulário:", error);
    return json(res, 500, {
      erro: "Não foi possível salvar o formulário.",
    });
  }
}
