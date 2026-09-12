import { readSubmissions, writeSubmissions, getAdminPassword } from "../../lib/storage.js";

function json(res, status, data) {
  res.status(status).json(data);
}

function autorizado(req) {
  const senha = getAdminPassword();
  const enviada = req.headers["x-admin-senha"] || "";
  return Boolean(senha) && enviada === senha;
}

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return json(res, 405, { erro: "Método não permitido." });
  }

  if (!autorizado(req)) {
    return json(res, 401, { erro: "Senha incorreta." });
  }

  const id = req.query?.id;
  if (!id || typeof id !== "string") {
    return json(res, 400, { erro: "ID inválido." });
  }

  try {
    const envios = await readSubmissions();
    const restantes = envios.filter((envio) => envio.id !== id);

    if (restantes.length === envios.length) {
      return json(res, 404, { erro: "Envio não encontrado." });
    }

    await writeSubmissions(restantes);
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error("Erro ao excluir formulário:", error);
    return json(res, 500, { erro: "Não foi possível excluir o formulário." });
  }
}
