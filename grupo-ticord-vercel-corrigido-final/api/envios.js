import { readSubmissions, getAdminPassword } from "../lib/storage.js";

function json(res, status, data) {
  res.status(status).json(data);
}

function autorizado(req) {
  const senha = getAdminPassword();
  const enviada = req.headers["x-admin-senha"] || "";
  return Boolean(senha) && enviada === senha;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { erro: "Método não permitido." });
  }

  if (!autorizado(req)) {
    return json(res, 401, { erro: "Senha incorreta." });
  }

  try {
    const envios = await readSubmissions();
    return json(res, 200, envios);
  } catch (error) {
    console.error("Erro ao ler formulários:", error);
    return json(res, 500, { erro: "Não foi possível carregar os formulários." });
  }
}
