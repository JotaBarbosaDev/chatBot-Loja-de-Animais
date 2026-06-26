import "dotenv/config";

import http from "node:http";

const PORT = Number(process.env.CHAT_SERVER_PORT || 4174);
function normalizeOllamaBaseUrl(value) {
  const raw =
    value || process.env.VITE_OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

const OLLAMA_API_BASE_URL = normalizeOllamaBaseUrl(
  process.env.OLLAMA_API_BASE_URL,
);
const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ||
  process.env.VITE_OLLAMA_MODEL ||
  "llama3.1:8b";
const OLLAMA_API_KEY =
  process.env.OLLAMA_API_KEY || process.env.VITE_OLLAMA_API_KEY || "";
const USING_PLACEHOLDER_URL = OLLAMA_API_BASE_URL.includes(
  "your-remote-ollama-api.example.com",
);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(payload));
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload demasiado grande."));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleChat(request, response) {
  try {
    if (USING_PLACEHOLDER_URL) {
      sendJson(response, 500, {
        error:
          "OLLAMA_API_BASE_URL ainda está com o valor de exemplo. Define o URL real da tua API remota no `.env`.",
      });
      return;
    }

    const rawBody = await collectBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const messages = Array.isArray(payload.messages) ? payload.messages : [];

    if (!messages.length) {
      sendJson(response, 400, {
        error: "É obrigatório enviar um array `messages`.",
      });
      return;
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (OLLAMA_API_KEY) {
      headers.Authorization = `Bearer ${OLLAMA_API_KEY}`;
    }

    const upstreamResponse = await fetch(`${OLLAMA_API_BASE_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: payload.model || OLLAMA_MODEL,
        stream: false,
        messages,
      }),
    });

    if (!upstreamResponse.ok) {
      const text = await upstreamResponse.text();
      sendJson(response, upstreamResponse.status, {
        error: text || "Falha ao contactar o endpoint Ollama remoto.",
      });
      return;
    }

    const upstreamPayload = await upstreamResponse.json();
    sendJson(response, 200, {
      content: upstreamPayload?.message?.content?.trim() || "",
      model: payload.model || OLLAMA_MODEL,
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error?.message || "Erro interno na API de chat.",
    });
  }
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      configured: !USING_PLACEHOLDER_URL,
      ollamaApiBaseUrl: OLLAMA_API_BASE_URL,
      model: OLLAMA_MODEL,
    });
    return;
  }

  if (request.method === "POST" && request.url === "/api/ollama-chat") {
    handleChat(request, response);
    return;
  }

  sendJson(response, 404, { error: "Endpoint não encontrado." });
});

server.listen(PORT, () => {
  console.log(`Atlas Assist API a escutar na porta ${PORT}`);
});
