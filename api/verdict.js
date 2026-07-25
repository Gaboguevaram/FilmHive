/*
 * api/verdict.js — Vercel serverless function: POST /api/verdict
 *
 * Receives a movie title + its reviews and returns an AI-generated verdict
 * (tldr, pros, cons, score) synthesised live by Google Gemini.
 *
 * The GEMINI_API_KEY lives ONLY in this server-side environment variable — it
 * is never sent to the browser. The client calls this endpoint; this endpoint
 * calls Gemini. If the key is missing or Gemini fails, we return an error and
 * the client falls back to the cached verdict shipped in movies.json.
 *
 * On Vercel, any file in /api is a serverless function and is reachable at the
 * matching path (/api/verdict) with no extra routing config.
 */
var gemini = require("../lib/gemini");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "GEMINI_API_KEY no configurada en el servidor" });
    return;
  }

  // Vercel parses JSON bodies automatically, but guard for string/empty too.
  var payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      res.status(400).json({ error: "JSON inválido" });
      return;
    }
  }
  payload = payload || {};

  var title = payload.title;
  var reviews = payload.reviews;
  if (!title || !Array.isArray(reviews) || reviews.length === 0) {
    res.status(400).json({ error: "Faltan 'title' o 'reviews'" });
    return;
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
    res.status(200).json(verdict);
  } catch (err) {
    console.error("Fallo al generar el veredicto:", err.status, err.detail || err.message);
    res.status(err.status === 429 ? 429 : 502).json({
      error: "No se pudo generar el veredicto con Gemini"
    });
  }
};
