/*
 * data.js — Shared helpers: path resolution, data loading, ratings and stars.
 * Exposed as window.FH so plain <script> pages can share it without a bundler.
 */
window.FH = (function () {
  "use strict";

  var inPages = location.pathname.includes("/pages/");
  var BASE = inPages ? "../" : "./";

  /** Resolve a root-relative asset path for the current page depth. */
  function asset(path) {
    return BASE + path;
  }

  /** Link to a movie detail page. */
  function movieHref(id) {
    return BASE + "pages/pelicula.html?id=" + encodeURIComponent(id);
  }

  function loadJSON(name) {
    return fetch(BASE + "data/" + name).then(function (res) {
      if (!res.ok) throw new Error("No se pudo cargar " + name);
      return res.json();
    });
  }

  function loadMovies() {
    return loadJSON("movies.json").then(function (d) {
      return d.movies;
    });
  }

  /** Average rating of a review list (0 when there are none). */
  function average(reviews) {
    if (!reviews || !reviews.length) return 0;
    var sum = reviews.reduce(function (acc, r) {
      return acc + (Number(r.rating) || 0);
    }, 0);
    return sum / reviews.length;
  }

  /** Fractional star display built from two stacked layers. */
  function starsMarkup(value) {
    var v = Math.max(0, Math.min(5, Number(value) || 0));
    var pct = (v / 5) * 100;
    return (
      '<span class="stars" style="--pct:' +
      pct.toFixed(1) +
      '%" role="img" aria-label="' +
      v.toFixed(1) +
      ' de 5 estrellas">' +
      '<span class="stars-empty" aria-hidden="true">★★★★★</span>' +
      '<span class="stars-fill" aria-hidden="true">★★★★★</span>' +
      "</span>"
    );
  }

  /** Escape untrusted text (user-submitted reviews) before injecting as HTML. */
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  }

  return {
    BASE: BASE,
    asset: asset,
    movieHref: movieHref,
    loadJSON: loadJSON,
    loadMovies: loadMovies,
    average: average,
    starsMarkup: starsMarkup,
    escapeHtml: escapeHtml
  };
})();
