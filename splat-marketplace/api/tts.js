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
      status: 405,
      headers: { "content-type": "application/json", ...cors() }
    });
  }

  try {
    const { text, format = "mp3", model = "s1" } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "missing text" }), {
        status: 400, headers: { "content-type": "application/json", ...cors() }
      });
    }

    const r = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FISH_API_KEY}`,
        "Content-Type": "application/json",
        "model": model
      },
      body: JSON.stringify({ text, format })
    });

    if (!r.ok) {
      const err = await r.text();
      return new Response(err, {
        status: r.status,
        headers: { "content-type": "application/json", ...cors() }
      });
    }

    const headers = new Headers(r.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    if (!headers.get("content-type")) {
      headers.set("content-type", format === "mp3" ? "audio/mpeg" : "application/octet-stream");
    }

    return new Response(r.body, { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: "tts_failed", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json", ...cors() }
    });
  }
}
