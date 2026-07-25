/*
 * lib/gemini.js — Shared helper (lives outside /api, so Vercel bundles it when
 * imported but never exposes it as its own endpoint).
 *
 * Builds the prompt and calls the Google Gemini REST API to turn a movie's
 * reviews into a structured verdict. Used by both the serverless function
 * (live generation) and scripts/seed-verdicts.mjs (offline cache seeding).
 *
 * Requires Node 18+ (global fetch). No npm dependencies.
 */

var SCHEMA = {
  type: "object",
  properties: {
    tldr: { type: "string" },
    pros: { type: "array", items: { type: "string" } },
    cons: { type: "array", items: { type: "string" } },
    score: { type: "number" }
  },
  required: ["tldr", "pros", "cons", "score"]
};

function buildPrompt(title, year, reviews) {
  var list = reviews
    .map(function (r, i) {
      var rating = r.rating != null ? "[" + r.rating + "/5] " : "";
      return i + 1 + ". " + rating + '"' + String(r.text).replace(/"/g, "'") + '"';
    })
    .join("\n");

  return (
    "Eres un crítico de cine que sintetiza las reseñas de los usuarios en un " +
    "veredicto breve, honesto y en español.\n\n" +
    'Película: "' + title + '"' + (year ? " (" + year + ")" : "") + ".\n\n" +
    "Reseñas de los usuarios (nota sobre 5 y texto):\n" +
    list +
    "\n\n" +
    "Tarea: resume el CONSENSO de estas reseñas. Devuelve un JSON con:\n" +
    "- tldr: una sola frase con la valoración global.\n" +
    "- pros: 2 o 3 aspectos positivos recurrentes (frases muy cortas, 2-4 palabras).\n" +
    "- cons: 1 a 3 aspectos negativos recurrentes (frases muy cortas, 2-4 palabras).\n" +
    "- score: una nota de 0 a 5 con un decimal, coherente con las notas de las reseñas.\n\n" +
    "Basa el veredicto ÚNICAMENTE en las reseñas proporcionadas. No inventes datos " +
    "ni menciones que eres una IA. Responde en español."
  );
}

function sanitize(v) {
  function strList(arr, max) {
    return (Array.isArray(arr) ? arr : [])
      .map(function (s) {
        return String(s).trim();
      })
      .filter(Boolean)
      .slice(0, max);
  }
  var score = Number(v && v.score);
  if (!isFinite(score)) score = 0;
  score = Math.max(0, Math.min(5, Math.round(score * 10) / 10));
  return {
    tldr: String((v && v.tldr) || "").trim(),
    pros: strList(v && v.pros, 3),
    cons: strList(v && v.cons, 3),
    score: score,
    source: "gemini"
  };
}

async function callGemini(options) {
  var apiKey = options.apiKey;
  var model = options.model || "gemini-2.0-flash";
  var prompt = options.prompt;

  var url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  var body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: "application/json",
      responseSchema: SCHEMA
    }
  };

  var res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    var detail = await res.text();
    var err = new Error("Gemini respondió " + res.status);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }

  var data = await res.json();
  var text =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;

  if (!text) {
    var empty = new Error("Respuesta vacía de Gemini");
    empty.detail = JSON.stringify(data).slice(0, 500);
    throw empty;
  }

  return sanitize(JSON.parse(text));
}

module.exports = { buildPrompt: buildPrompt, callGemini: callGemini, SCHEMA: SCHEMA };
