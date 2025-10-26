export const config = { runtime: "edge" };

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json", ...corsHeaders() }
    });
  }

  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!audio) {
      return new Response(JSON.stringify({ error: "missing audio" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders() }
      });
    }

    const out = new FormData();
    out.append("audio", audio, "clip.webm");
    if (form.get("language")) out.append("language", form.get("language"));
    out.append("ignore_timestamps", "true");

    const r = await fetch("https://api.fish.audio/v1/asr", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}` },
      body: out
    });

    const data = await r.json();
    const body = r.ok ? { text: data.text || data.transcript || "" } : data;

    return new Response(JSON.stringify(body), {
      status: r.status,
      headers: { "content-type": "application/json", ...corsHeaders() }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "asr_failed", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders() }
    });
  }
}
