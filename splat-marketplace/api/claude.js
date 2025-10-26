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
    const { transcript = "", image_base64 = "", prompt = "" } = await req.json();

    const userText = [
      prompt.trim() || "Analyze the image and the transcript and provide a concise helpful reply.",
      transcript ? `\n\nUser transcript:\n${transcript}` : ""
    ].join("");

    const body = {
      model: "claude-3-5-sonnet-20241022",          // or a current model available to your key
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
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const payload = await r.json();

    if (!r.ok) {
      // Pass through Anthropic's error with status
      return new Response(JSON.stringify(payload), {
        status: r.status,
        headers: { "content-type": "application/json", ...cors() }
      });
    }

    // Extract the first text block
    const parts = payload?.content || [];
    const firstText = parts.find(p => p.type === "text")?.text || "";
    return new Response(JSON.stringify({ output: firstText }), {
      status: 200,
      headers: { "content-type": "application/json", ...cors() }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "claude_failed", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json", ...cors() }
    });
  }
}
