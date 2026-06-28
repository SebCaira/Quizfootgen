import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { code, text, voice, model } = body;

    // Vérification du code d'accès
    if (code !== Netlify.env.get("ACCESS_CODE")) {
      return new Response(JSON.stringify({ error: "Code d'accès incorrect" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Vérification de l'API key OpenAI
    const apiKey = Netlify.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY non configurée sur Netlify" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Le texte est vide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (text.length > 4000) {
      return new Response(JSON.stringify({ error: "Texte trop long (max 4000 caractères)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Appel OpenAI TTS
    const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "tts-1",
        input: text,
        voice: voice || "echo",
        response_format: "mp3"
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return new Response(JSON.stringify({ 
        error: "OpenAI a refusé : " + errorText.slice(0, 200) 
      }), {
        status: openaiResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Renvoyer directement le MP3
    const audioBuffer = await openaiResponse.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "attachment; filename=quiz-foot-voiceover.mp3"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
