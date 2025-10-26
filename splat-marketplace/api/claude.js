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
    const { transcript = "", image_base64 = "", prompt = "" } = await req.json();

    const raw = process.env.ANTHROPIC_API_KEY || "";
    const ANTH_KEY = raw.replace(/^"(.*)"$/, "$1").trim();
    if (!ANTH_KEY) {
      return new Response(JSON.stringify({ error: "missing_server_key:ANTHROPIC_API_KEY" }), {
        status: 500, headers: { "content-type": "application/json", ...cors() }
      });
    }

    const userText = [
      (prompt || "Analyze the image and the transcript. Provide a concise helpful reply.").trim(),
      transcript ? `\n\nUser transcript:\n${transcript}` : ""
    ].join("");

    const body = {
      model: "claude-3-5-sonnet-20241022", // or "claude-3-5-sonnet-latest" if available on your account
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            ...(image_base64 ? [{
              type: "image",
              source: { type: "base64", media_type: "image/png", data: image_base64 }
            }] : [])
          ]
        }
      ]
    };

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTH_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const text = await r.text();
    let payload; try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    if (!r.ok) {
      return new Response(JSON.stringify(payload), {
        status: r.status, headers: { "content-type": "application/json", ...cors() }
      });
    }

    const parts = payload?.content || [];
    const firstText = parts.find(p => p.type === "text")?.text || "";
    return new Response(JSON.stringify({ output: firstText }), {
      status: 200, headers: { "content-type": "application/json", ...cors() }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "claude_failed", detail: String(e) }), {
      status: 500, headers: { "content-type": "application/json", ...cors() }
    });
  }
}
