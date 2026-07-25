/*
 * foros.js — Forum table. Replaces the old XML + jQuery/Bootstrap version
 * with a JSON fetch, accessible markup and instant filtering.
 */
(function () {
  "use strict";

  var tbody = document.getElementById("foros-body");
  if (!tbody) return;

  var all = [];
  var state = { q: "", tematica: "" };

  var search = document.getElementById("foros-search");
  var select = document.getElementById("foros-tematica");
  var count = document.getElementById("foros-count");

  function row(f) {
    return (
      "<tr>" +
      "<td>" +
      FH.escapeHtml(f.nombre) +
      "</td>" +
      "<td>" +
      FH.escapeHtml(f.tematica) +
      "</td>" +
      "<td>" +
      f.posts +
      "</td>" +
      "<td>" +
      f.miembros +
      "</td>" +
      "</tr>"
    );
  }

  function apply() {
    var q = state.q.trim().toLowerCase();
    var results = all.filter(function (f) {
      var matchesName = !q || f.nombre.toLowerCase().indexOf(q) !== -1;
      var matchesTema = !state.tematica || f.tematica === state.tematica;
      return matchesName && matchesTema;
    });

    tbody.innerHTML = results.length
      ? results.map(row).join("")
      : '<tr><td colspan="4">No se han encontrado foros.</td></tr>';

    if (count) {
      count.textContent =
        results.length + (results.length === 1 ? " foro" : " foros");
    }
  }

  FH.loadJSON("foros.json")
    .then(function (data) {
      all = data.foros;

      // Populate the topic filter from the data itself.
      if (select) {
        var temas = all
          .map(function (f) {
            return f.tematica;
          })
          .filter(function (t, i, arr) {
            return arr.indexOf(t) === i;
          })
          .sort();
        select.innerHTML =
          '<option value="">Todas las temáticas</option>' +
          temas
            .map(function (t) {
              return '<option value="' + t + '">' + t + "</option>";
            })
            .join("");
      }

      apply();
    })
    .catch(function (err) {
      tbody.innerHTML =
        '<tr><td colspan="4">No se pudieron cargar los foros.</td></tr>';
      console.error(err);
    });

  if (search) {
    search.addEventListener("input", function () {
      state.q = search.value;
      apply();
    });
  }

  if (select) {
    select.addEventListener("change", function () {
      state.tematica = select.value;
      apply();
    });
  }
})();
