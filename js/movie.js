/*
 * movie.js — Movie detail page (?id=slug).
 *
 * Renders the film, the community score, an accessible star rating, the
 * trailer modal, the review list/form and the AI Verdict panel.
 *
 * AI Verdict: the verdict is COMPUTED FROM THE REVIEWS, not a static blurb.
 * Clicking "Regenerar" posts the current review list to /api/verdict, which
 * asks Gemini to synthesise them. If that endpoint is unavailable (no key,
 * rate limited, opened as a static file) we fall back to the cached verdict
 * shipped in movies.json so the page is never broken.
 */
(function () {
  "use strict";

  var VERDICT_ENDPOINT = "/api/verdict";
  var root = document.getElementById("movie-root");
  if (!root) return;

  var movie = null;
  var reviews = [];

  /* ---------------- localStorage helpers ---------------- */
  function storeKey(kind, id) {
    return "fh:" + kind + ":" + id;
  }

  function readStored(kind, id, fallback) {
    try {
      var raw = localStorage.getItem(storeKey(kind, id));
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeStored(kind, id, value) {
    try {
      localStorage.setItem(storeKey(kind, id), JSON.stringify(value));
    } catch (e) {
      /* storage disabled — feature degrades silently */
    }
  }

  /* ---------------- Rendering ---------------- */
  function metaItem(text) {
    return "<li>" + FH.escapeHtml(text) + "</li>";
  }

  function render() {
    var avg = FH.average(reviews);
    var userRating = readStored("rating", movie.id, null);

    root.innerHTML =
      '<article class="movie-detail">' +
      /* ---- Aside: poster, score, rating, trailer ---- */
      "<aside>" +
      '<figure><img src="' +
      FH.asset(movie.poster) +
      '" alt="Póster de ' +
      FH.escapeHtml(movie.title) +
      '" width="340" height="510" style="border-radius:var(--radius);width:100%;height:auto"></figure>' +
      '<div class="aside-panel" style="margin-top:var(--space-4)">' +
      '<h2 style="font-size:1rem">Nota de la comunidad</h2>' +
      '<div class="card-rating">' +
      FH.starsMarkup(avg) +
      '<span class="stars-value">' +
      avg.toFixed(1) +
      " · " +
      reviews.length +
      (reviews.length === 1 ? " reseña" : " reseñas") +
      "</span>" +
      "</div>" +
      '<h2 style="font-size:1rem;margin-top:var(--space-4)">Tu valoración</h2>' +
      '<fieldset class="rate" id="rate">' +
      '<legend class="visually-hidden">Puntúa esta película del 1 al 5</legend>' +
      [1, 2, 3, 4, 5]
        .map(function (n) {
          var checked = userRating === n ? " checked" : "";
          return (
            '<input class="visually-hidden" type="radio" name="user-rating" id="star-' +
            n +
            '" value="' +
            n +
            '"' +
            checked +
            ">" +
            '<label for="star-' +
            n +
            '" title="' +
            n +
            (n === 1 ? " estrella" : " estrellas") +
            '"><span aria-hidden="true">★</span>' +
            '<span class="visually-hidden">' +
            n +
            (n === 1 ? " estrella" : " estrellas") +
            "</span></label>"
          );
        })
        .join("") +
      "</fieldset>" +
      '<p class="rate-status" id="rate-status" role="status">' +
      (userRating ? "Tu valoración: " + userRating + "/5" : "") +
      "</p>" +
      (movie.trailer
        ? '<button class="btn btn-outline" id="open-trailer" style="margin-top:var(--space-3)">▶ Ver tráiler</button>'
        : "") +
      "</div>" +
      "</aside>" +
      /* ---- Main column ---- */
      "<section>" +
      "<h1>" +
      FH.escapeHtml(movie.title) +
      "</h1>" +
      '<ul class="meta-list">' +
      metaItem(movie.year) +
      metaItem(movie.genre) +
      metaItem(movie.duration) +
      "</ul>" +
      "<h2>Sinopsis</h2>" +
      "<p>" +
      FH.escapeHtml(movie.synopsis) +
      "</p>" +
      '<h2 style="margin-top:var(--space-5)">Reparto</h2>' +
      "<p>" +
      FH.escapeHtml((movie.cast || []).join(", ")) +
      "</p>" +
      /* ---- AI verdict ---- */
      '<section class="ai-verdict" id="ai-verdict" aria-live="polite"></section>' +
      /* ---- Reviews ---- */
      '<section class="reviews">' +
      '<h2 id="reviews-heading">Reseñas (' +
      reviews.length +
      ")</h2>" +
      '<form class="review-form" id="review-form">' +
      '<div class="field">' +
      '<label for="review-author">Tu nombre</label>' +
      '<input type="text" id="review-author" name="author" required maxlength="40" placeholder="cinefilo_anonimo">' +
      "</div>" +
      '<div class="field">' +
      '<label for="review-rating">Tu nota</label>' +
      '<select id="review-rating" name="rating">' +
      [5, 4, 3, 2, 1]
        .map(function (n) {
          return '<option value="' + n + '">' + n + " / 5</option>";
        })
        .join("") +
      "</select>" +
      "</div>" +
      '<div class="field">' +
      '<label for="review-text">Tu reseña</label>' +
      '<textarea id="review-text" name="text" required maxlength="600" placeholder="¿Qué te ha parecido?"></textarea>' +
      "</div>" +
      '<div class="form-actions">' +
      '<button class="btn btn-primary" type="submit">Publicar reseña</button>' +
      '<span class="stars-value">Se guarda en tu navegador y alimenta el veredicto IA.</span>' +
      "</div>" +
      "</form>" +
      '<div id="review-list"></div>' +
      "</section>" +
      "</section>" +
      "</article>" +
      /* ---- Trailer modal ---- */
      (movie.trailer
        ? '<div class="modal" id="trailer-modal" role="dialog" aria-modal="true" aria-labelledby="trailer-title">' +
          '<div class="modal-dialog">' +
          '<div class="modal-head">' +
          '<h2 id="trailer-title">Tráiler · ' +
          FH.escapeHtml(movie.title) +
          "</h2>" +
          '<button class="modal-close" id="close-trailer" aria-label="Cerrar tráiler">✕</button>' +
          "</div>" +
          '<div class="modal-body" id="trailer-body"></div>' +
          "</div>" +
          "</div>"
        : "");

    renderReviews();
    renderVerdict(movie.aiVerdict, { live: false });
    wireRating();
    wireReviewForm();
    wireTrailer();
  }

  function renderReviews() {
    var list = document.getElementById("review-list");
    if (!list) return;
    if (!reviews.length) {
      list.innerHTML = '<p class="stars-value">Todavía no hay reseñas.</p>';
      return;
    }
    list.innerHTML = reviews
      .map(function (r) {
        return (
          '<article class="review">' +
          '<div class="review-head">' +
          '<span class="review-author">' +
          FH.escapeHtml(r.author) +
          "</span>" +
          FH.starsMarkup(r.rating) +
          "</div>" +
          "<p>" +
          FH.escapeHtml(r.text) +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------------- AI Verdict ---------------- */
  function verdictSkeleton(bodyHtml, headExtra) {
    return (
      '<div class="ai-verdict-head">' +
      "<h2>✨ Veredicto IA</h2>" +
      (headExtra || "") +
      "</div>" +
      bodyHtml
    );
  }

  function renderVerdict(verdict, opts) {
    var panel = document.getElementById("ai-verdict");
    if (!panel) return;
    opts = opts || {};

    var button =
      '<button class="btn btn-primary" id="gen-verdict">' +
      (verdict ? "Regenerar con IA" : "Generar veredicto con IA") +
      "</button>";

    if (!verdict) {
      panel.innerHTML = verdictSkeleton(
        '<p class="ai-tldr">Genera un resumen de las ' +
          reviews.length +
          " reseñas de esta película.</p>",
        button
      );
    } else {
      var badge = opts.live
        ? '<span class="ai-badge">Generado ahora con Gemini</span>'
        : '<span class="ai-badge">Veredicto en caché</span>';
      panel.innerHTML = verdictSkeleton(
        '<p class="ai-tldr">' +
          FH.escapeHtml(verdict.tldr) +
          "</p>" +
          '<div class="ai-proscons">' +
          '<div class="pros"><h3>A favor</h3><ul>' +
          (verdict.pros || [])
            .map(function (p) {
              return "<li>" + FH.escapeHtml(p) + "</li>";
            })
            .join("") +
          "</ul></div>" +
          '<div class="cons"><h3>En contra</h3><ul>' +
          (verdict.cons || [])
            .map(function (c) {
              return "<li>" + FH.escapeHtml(c) + "</li>";
            })
            .join("") +
          "</ul></div>" +
          "</div>" +
          '<div class="ai-score">' +
          "<span>Nota sugerida por la IA:</span>" +
          FH.starsMarkup(verdict.score) +
          "<strong>" +
          Number(verdict.score).toFixed(1) +
          "</strong>" +
          "</div>",
        '<div style="display:flex;gap:var(--space-2);align-items:center">' +
          badge +
          button +
          "</div>"
      );
    }

    var btn = document.getElementById("gen-verdict");
    if (btn) btn.addEventListener("click", generateVerdict);
  }

  function generateVerdict() {
    var panel = document.getElementById("ai-verdict");
    var btn = document.getElementById("gen-verdict");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Analizando reseñas…';
    }

    fetch(VERDICT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: movie.title,
        year: movie.year,
        reviews: reviews.map(function (r) {
          return { rating: r.rating, text: r.text };
        })
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (verdict) {
        renderVerdict(verdict, { live: true });
      })
      .catch(function (err) {
        console.warn("Veredicto en vivo no disponible:", err.message);
        // Graceful degradation: show the cached verdict plus an explanation.
        renderVerdict(movie.aiVerdict, { live: false });
        var p = document.createElement("p");
        p.className = "ai-error";
        p.style.marginTop = "var(--space-3)";
        p.textContent =
          "No se pudo generar en vivo (falta la API key de Gemini o se alcanzó el límite). Mostrando el veredicto en caché.";
        if (panel) panel.appendChild(p);
      });
  }

  /* ---------------- Interactions ---------------- */
  function wireRating() {
    var fieldset = document.getElementById("rate");
    var status = document.getElementById("rate-status");
    if (!fieldset) return;

    function paint() {
      var checked = fieldset.querySelector("input:checked");
      var value = checked ? Number(checked.value) : 0;
      Array.prototype.forEach.call(
        fieldset.querySelectorAll("label"),
        function (label, idx) {
          label.classList.toggle("is-on", idx < value);
        }
      );
      return value;
    }

    fieldset.addEventListener("change", function () {
      var value = paint();
      writeStored("rating", movie.id, value);
      if (status) status.textContent = "Tu valoración: " + value + "/5";
    });

    paint();
  }

  function wireReviewForm() {
    var form = document.getElementById("review-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var author = form.author.value.trim();
      var text = form.text.value.trim();
      if (!author || !text) return;

      var review = {
        author: author,
        rating: Number(form.rating.value),
        text: text,
        user: true
      };
      reviews.push(review);

      // Persist only the user's own reviews; base ones live in movies.json.
      var mine = readStored("reviews", movie.id, []);
      mine.push(review);
      writeStored("reviews", movie.id, mine);

      render();
      // Nudge: the verdict is now stale relative to the reviews.
      var panel = document.getElementById("ai-verdict");
      if (panel) {
        var note = document.createElement("p");
        note.className = "stars-value";
        note.style.marginTop = "var(--space-3)";
        note.textContent =
          "Has añadido una reseña — pulsa «Regenerar con IA» para recalcular el veredicto.";
        panel.appendChild(note);
        panel.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  function wireTrailer() {
    var openBtn = document.getElementById("open-trailer");
    var modal = document.getElementById("trailer-modal");
    if (!openBtn || !modal) return;
    var closeBtn = document.getElementById("close-trailer");
    var body = document.getElementById("trailer-body");
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      // Insert the iframe on demand so YouTube isn't loaded until requested.
      body.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' +
        encodeURIComponent(movie.trailer) +
        '?autoplay=1" title="Tráiler de ' +
        FH.escapeHtml(movie.title) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      modal.classList.add("is-open");
      closeBtn.focus();
    }

    function close() {
      modal.classList.remove("is-open");
      body.innerHTML = ""; // stops playback
      if (lastFocus) lastFocus.focus();
    }

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  /* ---------------- Boot ---------------- */
  function init() {
    var id = new URLSearchParams(location.search).get("id");

    FH.loadMovies()
      .then(function (movies) {
        movie = movies.filter(function (m) {
          return m.id === id;
        })[0];

        if (!movie) {
          root.innerHTML =
            '<div class="centered"><h1>Película no encontrada</h1>' +
            '<p>No existe ninguna ficha para ese identificador.</p>' +
            '<p style="margin-top:var(--space-4)"><a class="btn btn-outline" href="' +
            FH.BASE +
            'pages/busqueda.html">Ver todo el catálogo</a></p></div>';
          return;
        }

        document.title = movie.title + " · FilmHive";
        // Base reviews + any the visitor added on this device.
        reviews = (movie.reviews || []).concat(
          readStored("reviews", movie.id, [])
        );
        render();
      })
      .catch(function (err) {
        root.innerHTML =
          '<div class="centered"><h1>Error</h1><p>No se pudo cargar la ficha.</p></div>';
        console.error(err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
