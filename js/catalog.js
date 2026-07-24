/*
 * catalog.js — Renders the poster grids on the home page and powers the real
 * search page (the old version had hard-coded results and no actual search).
 */
(function () {
  "use strict";

  function movieCard(m) {
    var avg = FH.average(m.reviews);
    return (
      '<li class="movie-card">' +
      '<a href="' +
      FH.movieHref(m.id) +
      '">' +
      '<div class="poster">' +
      '<img src="' +
      FH.asset(m.poster) +
      '" alt="Póster de ' +
      FH.escapeHtml(m.title) +
      '" loading="lazy">' +
      "</div>" +
      '<div class="card-body">' +
      '<p class="card-title">' +
      FH.escapeHtml(m.title) +
      "</p>" +
      '<p class="card-sub">' +
      m.year +
      " · " +
      FH.escapeHtml(m.genre) +
      "</p>" +
      '<div class="card-rating">' +
      FH.starsMarkup(avg) +
      '<span class="stars-value">' +
      avg.toFixed(1) +
      "</span>" +
      "</div>" +
      "</div>" +
      "</a>" +
      "</li>"
    );
  }

  /* ---------------- Home page ---------------- */
  function renderHome(movies) {
    var grids = {
      cartelera: document.getElementById("grid-cartelera"),
      estrenos: document.getElementById("grid-estrenos")
    };
    Object.keys(grids).forEach(function (section) {
      var grid = grids[section];
      if (!grid) return;
      var list = movies.filter(function (m) {
        return m.section === section;
      });
      grid.innerHTML = list.map(movieCard).join("");
    });
  }

  /* ---------------- Search page ---------------- */
  function initSearch(movies) {
    var input = document.getElementById("search-input");
    var list = document.getElementById("result-list");
    var count = document.getElementById("result-count");
    var sortSelect = document.getElementById("sort-select");
    var chips = Array.prototype.slice.call(
      document.querySelectorAll(".chip[data-section]")
    );
    if (!input || !list) return;

    var state = { q: "", section: "todas", sort: "nota" };

    // Seed the query from ?q= so the header search box lands here properly.
    var params = new URLSearchParams(location.search);
    if (params.get("q")) {
      state.q = params.get("q");
      input.value = state.q;
    }

    function resultItem(m) {
      var avg = FH.average(m.reviews);
      var href = FH.movieHref(m.id);
      return (
        '<li class="result-item">' +
        '<a href="' +
        href +
        '" tabindex="-1" aria-hidden="true">' +
        '<img src="' +
        FH.asset(m.poster) +
        '" alt="" loading="lazy">' +
        "</a>" +
        "<div>" +
        '<a class="title" href="' +
        href +
        '">' +
        FH.escapeHtml(m.title) +
        " <span>(" +
        m.year +
        ")</span></a>" +
        '<p class="card-sub">' +
        FH.escapeHtml(m.genre) +
        " · " +
        FH.escapeHtml(m.duration) +
        "</p>" +
        '<div class="card-rating">' +
        FH.starsMarkup(avg) +
        '<span class="stars-value">' +
        avg.toFixed(1) +
        "</span>" +
        "</div>" +
        "</div>" +
        "</li>"
      );
    }

    function apply() {
      var q = state.q.trim().toLowerCase();
      var results = movies.filter(function (m) {
        var matchesSection =
          state.section === "todas" || m.section === state.section;
        var haystack = (m.title + " " + m.genre + " " + m.synopsis).toLowerCase();
        return matchesSection && (!q || haystack.indexOf(q) !== -1);
      });

      results.sort(function (a, b) {
        if (state.sort === "nota") return FH.average(b.reviews) - FH.average(a.reviews);
        if (state.sort === "anio") return b.year - a.year;
        return a.title.localeCompare(b.title, "es");
      });

      count.textContent =
        results.length === 0
          ? "No se han encontrado resultados."
          : results.length + (results.length === 1 ? " resultado" : " resultados");
      list.innerHTML = results.map(resultItem).join("");
    }

    input.addEventListener("input", function () {
      state.q = input.value;
      apply();
    });

    // Prevent a full page reload; filtering is instant.
    var form = document.getElementById("search-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        apply();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.section = chip.dataset.section;
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", String(c === chip));
        });
        apply();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        apply();
      });
    }

    apply();
  }

  function init() {
    var isHome = document.getElementById("grid-cartelera");
    var isSearch = document.getElementById("result-list");
    if (!isHome && !isSearch) return;

    FH.loadMovies()
      .then(function (movies) {
        if (isHome) renderHome(movies);
        if (isSearch) initSearch(movies);
      })
      .catch(function (err) {
        var target = document.getElementById("result-count");
        if (target) target.textContent = "No se pudo cargar el catálogo.";
        console.error("Error cargando el catálogo:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
