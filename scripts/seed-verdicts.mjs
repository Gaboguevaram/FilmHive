/*
 * seed-verdicts.mjs — Regenerate the cached AI verdicts in data/movies.json
 * by running the SAME Gemini prompt the live endpoint uses, once per film.
 *
 * This keeps the offline fallback genuinely AI-generated (by Gemini) rather
 * than hand-written. The live "Regenerar" button is still the primary path;
 * this just seeds the cache so the site is never empty without a key.
 *
 * Usage:
 *   GEMINI_API_KEY=xxxx npm run seed
 *   (or put GEMINI_API_KEY in a local .env file)
 *
 * Requires Node 18+.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import gemini from "../lib/gemini.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const moviesPath = join(root, "data", "movies.json");

// Minimal .env loader (no dependency) so `npm run seed` picks up the key.
function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "✗ Falta GEMINI_API_KEY. Ejecuta:  GEMINI_API_KEY=tu_clave npm run seed\n" +
        "  o crea un archivo .env con GEMINI_API_KEY=..."
    );
    process.exit(1);
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const db = JSON.parse(readFileSync(moviesPath, "utf8"));
  console.log(`Sembrando ${db.movies.length} veredictos con ${model}…\n`);

  let ok = 0;
  for (const movie of db.movies) {
    process.stdout.write(`• ${movie.title} … `);
    try {
      const verdict = await gemini.callGemini({
        apiKey,
        model,
        prompt: gemini.buildPrompt(movie.title, movie.year, movie.reviews)
      });
      movie.aiVerdict = verdict;
      ok++;
      console.log(`✔ (${verdict.score})`);
    } catch (err) {
      console.log(`✗ ${err.status || ""} ${err.message}`);
    }
    // Stay well under the free-tier rate limit (~15 req/min).
    await sleep(4500);
  }

  writeFileSync(moviesPath, JSON.stringify(db, null, 2) + "\n", "utf8");
  console.log(`\nHecho: ${ok}/${db.movies.length} veredictos actualizados en data/movies.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
