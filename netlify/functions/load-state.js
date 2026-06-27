import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { code } = body;

    // Vérifier le code d'accès
    if (code !== Netlify.env.get("ACCESS_CODE")) {
      return new Response(JSON.stringify({ error: "Code incorrect" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Récupérer le state depuis Netlify Blobs
    const store = getStore("quiz-data");
    const state = await store.get("shared-state", { type: "json" });

    return new Response(JSON.stringify({ state: state || null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
