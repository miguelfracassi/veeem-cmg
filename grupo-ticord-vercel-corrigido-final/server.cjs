// Servidor local opcional. No Vercel, as funções em /api são usadas.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = process.env.PORT || 3000;
const ADMIN_SENHA = process.env.ADMIN_SENHA || "ticord123";
const ROOT = __dirname;
const DATA = path.join(ROOT, "data", "envios.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
  catch { return []; }
}
function saveData(data) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", c => { raw += c; if (raw.length > 100000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function send(res, status, data) {
  const text = JSON.stringify(data);
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8"});
  res.end(text);
}
function auth(req) { return (req.headers["x-admin-senha"] || "") === ADMIN_SENHA; }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`).pathname;

  if (url === "/api/enviar" && req.method === "POST") {
    try {
      const d = await body(req);
      if (![d.nome,d.telefone,d.discord,d.motivo,d.mensagem].every(v => typeof v === "string" && v.trim())) {
        return send(res, 400, {erro:"Preencha todos os campos corretamente."});
      }
      const envios = readData();
      const novo = {id:crypto.randomUUID(), nome:d.nome.trim(), telefone:d.telefone.trim(),
        discord:d.discord.trim(), motivo:d.motivo.trim(), mensagem:d.mensagem.trim(), criadoEm:new Date().toISOString()};
      envios.push(novo); saveData(envios);
      return send(res, 201, {ok:true,id:novo.id});
    } catch { return send(res,400,{erro:"JSON inválido."}); }
  }

  if (url === "/api/envios" && req.method === "GET") {
    if (!auth(req)) return send(res,401,{erro:"Senha incorreta."});
    return send(res,200,readData());
  }

  const match = url.match(/^\/api\/envios\/([a-zA-Z0-9-]+)$/);
  if (match && req.method === "DELETE") {
    if (!auth(req)) return send(res,401,{erro:"Senha incorreta."});
    const data = readData();
    const next = data.filter(x => x.id !== match[1]);
    if (next.length === data.length) return send(res,404,{erro:"Envio não encontrado."});
    saveData(next); return send(res,200,{ok:true});
  }

  let file = decodeURIComponent(url);
  if (file === "/") file = "/index.html";
  const target = path.normalize(path.join(ROOT, file));
  if (!target.startsWith(ROOT)) return send(res,403,{erro:"Acesso negado."});
  fs.readFile(target, (err, content) => {
    if (err) {
      fs.readFile(path.join(ROOT,"404.html"), (e404,c404) => {
        res.writeHead(404,{"Content-Type":"text/html; charset=utf-8"});
        res.end(e404 ? "Página não encontrada" : c404);
      });
      return;
    }
    res.writeHead(200,{"Content-Type":MIME[path.extname(target).toLowerCase()] || "application/octet-stream"});
    res.end(content);
  });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
