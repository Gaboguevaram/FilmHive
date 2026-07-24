/*
 * verdict.js — Netlify serverless function: POST /api/verdict
 *
 * Receives a movie title + its reviews and returns an AI-generated verdict
 * (tldr, pros, cons, score) synthesised live by Google Gemini.
 *
 * The GEMINI_API_KEY lives ONLY in this server-side environment variable — it
 * is never sent to the browser. The client calls this endpoint; this endpoint
 * calls Gemini. If the key is missing or Gemini fails, we return an error and
 * the client falls back to the cached verdict shipped in movies.json.
 */
var gemini = require("./_gemini");

var JSON_HEADERS = { "Content-Type": "application/json" };

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Método no permitido" })
    };
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        error: "GEMINI_API_KEY no configurada en el servidor"
      })
    };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "JSON inválido" })
    };
  }

  var title = payload.title;
  var reviews = payload.reviews;
  if (!title || !Array.isArray(reviews) || reviews.length === 0) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Faltan 'title' o 'reviews'" })
    };
  }

  // Bound the payload so a crafted request can't send an enormous prompt.
  reviews = reviews.slice(0, 40).map(function (r) {
    return { rating: r.rating, text: String(r.text || "").slice(0, 800) };
  });

  try {
    var verdict = await gemini.callGemini({
      apiKey: apiKey,
      model: process.env.GEMINI_MODEL,
      prompt: gemini.buildPrompt(title, payload.year, reviews)
    });
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(verdict) };
  } catch (err) {
    console.error("Fallo al generar el veredicto:", err.status, err.detail || err.message);
    var status = err.status === 429 ? 429 : 502;
    return {
      statusCode: status,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "No se pudo generar el veredicto con Gemini" })
    };
  }
};
