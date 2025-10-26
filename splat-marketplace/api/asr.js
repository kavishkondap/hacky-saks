export const config = { runtime: "edge" };

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { "content-type": "application/json", ...cors() }
    });
  }

  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!audio) {
      return new Response(JSON.stringify({ error: "missing audio" }), {
        status: 400, headers: { "content-type": "application/json", ...cors() }
      });
    }

    const raw = process.env.FISH_API_KEY || "";
    const FISH_KEY = raw.replace(/^"(.*)"$/, "$1").trim();
    if (!FISH_KEY) {
      return new Response(JSON.stringify({ error: "missing_server_key:FISH_API_KEY" }), {
        status: 500, headers: { "content-type": "application/json", ...cors() }
      });
    }

    const out = new FormData();
    out.append("audio", audio, "clip.webm");
    if (form.get("language")) out.append("language", form.get("language"));
    out.append("ignore_timestamps", "true");

    const r = await fetch("https://api.fish.audio/v1/asr", {
      method: "POST",
      headers: { Authorization: `Bearer ${FISH_KEY}` },
      body: out
    });

    const text = await r.text();
    let payload; try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    if (!r.ok) {
      return new Response(JSON.stringify(payload), {
        status: r.status, headers: { "content-type": "application/json", ...cors() }
      });
    }

    return new Response(JSON.stringify({ text: payload.text || payload.transcript || "" }), {
      status: 200, headers: { "content-type": "application/json", ...cors() }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "asr_failed", detail: String(e) }), {
      status: 500, headers: { "content-type": "application/json", ...cors() }
    });
  }
}
