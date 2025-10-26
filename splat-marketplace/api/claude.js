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
      status: 405, headers: { "content-type": "application/json", ...corsHeaders() }
    });
  }

  try {
    const { prompt, transcript, image_base64 } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "missing image_base64" }), {
        status: 400, headers: { "content-type": "application/json", ...corsHeaders() }
      });
    }

    const body = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: (prompt || "Analyze the image and transcript for salient details.") },
          { type: "text", text: "User transcript:\n" + (transcript || "(none)") },
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: image_base64 }
          }
        ]
      }]
    };

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify(data), {
        status: r.status, headers: { "content-type": "application/json", ...corsHeaders() }
      });
    }

    const output = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : "";
    return new Response(JSON.stringify({ output }), {
      status: 200, headers: { "content-type": "application/json", ...corsHeaders() }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "claude_failed", detail: String(e) }), {
      status: 500, headers: { "content-type": "application/json", ...corsHeaders() }
    });
  }
}
