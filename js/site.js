/*
 * site.js — Shared site chrome (header + footer).
 *
 * Injects the same accessible header and footer into every page from a single
 * source of truth, so the navigation is defined once instead of copy-pasted
 * across 8 HTML files. Also wires up the accessible mobile menu, dropdown,
 * active-link highlighting and the header search box.
 */
(function () {
  "use strict";

  // Pages under /pages/ need to walk one level up to reach the site root.
  var inPages = location.pathname.includes("/pages/");
  var BASE = inPages ? "../" : "./";

  // Nav items. `href` is relative to the site root; BASE is prefixed at render.
  var NAV = [
    { label: "Inicio", href: "index.html" },
    { label: "Películas", href: "pages/busqueda.html" },
    { label: "Series", href: "pages/sin-crear.html" },
    { label: "Juegos", href: "pages/sin-crear.html" },
    { label: "Foros", href: "pages/foros.html" },
    {
      label: "Información",
      children: [
        { label: "Sobre nosotros", href: "pages/sobre-nosotros.html" },
        { label: "Ayuda", href: "pages/ayuda.html" },
        { label: "Contacto", href: "pages/contacto.html" }
      ]
    }
  ];

  var currentFile = location.pathname.split("/").pop() || "index.html";

  function isActive(href) {
    return href.split("/").pop() === currentFile;
  }

  function navLink(item) {
    var active = isActive(item.href) ? ' aria-current="page"' : "";
    return (
      '<li><a class="nav-link" href="' +
      BASE +
      item.href +
      '"' +
      active +
      ">" +
      item.label +
      "</a></li>"
    );
  }

  function dropdown(item, idx) {
    var id = "submenu-" + idx;
    var links = item.children
      .map(function (c) {
        var active = isActive(c.href) ? ' aria-current="page"' : "";
        return (
          '<li><a class="dropdown-link" href="' +
          BASE +
          c.href +
          '"' +
          active +
          ">" +
          c.label +
          "</a></li>"
        );
      })
      .join("");
    return (
      '<li class="has-dropdown">' +
      '<button class="nav-link dropdown-toggle" aria-expanded="false" aria-haspopup="true" aria-controls="' +
      id +
      '">' +
      item.label +
      ' <span aria-hidden="true">▾</span></button>' +
      '<ul class="dropdown" id="' +
      id +
      '">' +
      links +
      "</ul>" +
      "</li>"
    );
  }

  function buildHeader() {
    var items = NAV.map(function (item, idx) {
      return item.children ? dropdown(item, idx) : navLink(item);
    }).join("");

    return (
      "<header class=\"site-header\">" +
      '<a class="logo" href="' +
      BASE +
      'index.html" aria-label="FilmHive — inicio">' +
      '<img src="' +
      BASE +
      'assets/images/FilmHive.gif" alt="FilmHive" width="159" height="59">' +
      "</a>" +
      '<button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="primary-nav">' +
      '<span class="menu-toggle-icon" aria-hidden="true">☰</span> Menú' +
      "</button>" +
      '<nav class="primary-nav" id="primary-nav" aria-label="Principal">' +
      '<ul class="nav-list">' +
      items +
      "</ul>" +
      '<form class="nav-search" role="search" action="' +
      BASE +
      'pages/busqueda.html" method="get">' +
      '<label class="visually-hidden" for="nav-search-input">Buscar películas</label>' +
      '<input id="nav-search-input" name="q" type="search" placeholder="Buscar películas…" autocomplete="off">' +
      "</form>" +
      "</nav>" +
      "</header>"
    );
  }

  function buildFooter() {
    var year = new Date().getFullYear();
    return (
      '<footer class="site-footer">' +
      '<div class="footer-inner">' +
      '<div class="footer-brand">' +
      '<img src="' +
      BASE +
      'assets/images/FilmHive.gif" alt="FilmHive" width="120" height="45">' +
      "<p>Comunidad para cinéfilos: reseñas, valoraciones y veredictos con IA.</p>" +
      "</div>" +
      '<nav class="footer-nav" aria-label="Pie de página">' +
      "<ul>" +
      '<li><a href="' + BASE + 'pages/busqueda.html">Películas</a></li>' +
      '<li><a href="' + BASE + 'pages/foros.html">Foros</a></li>' +
      '<li><a href="' + BASE + 'pages/sobre-nosotros.html">Sobre nosotros</a></li>' +
      '<li><a href="' + BASE + 'pages/ayuda.html">Ayuda</a></li>' +
      '<li><a href="' + BASE + 'pages/contacto.html">Contacto</a></li>' +
      "</ul>" +
      "</nav>" +
      "</div>" +
      '<p class="footer-legal">© ' +
      year +
      " FilmHive · Proyecto académico (USC) rehecho como pieza de portfolio.</p>" +
      "</footer>"
    );
  }

  function wireMobileMenu(header) {
    var toggle = header.querySelector("#menu-toggle");
    var nav = header.querySelector("#primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close on Escape and return focus to the toggle.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close when a nav link is followed (mobile).
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
  }

  function wireDropdowns(header) {
    var toggles = header.querySelectorAll(".dropdown-toggle");
    Array.prototype.forEach.call(toggles, function (toggle) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        // Close any other open dropdown first.
        Array.prototype.forEach.call(toggles, function (t) {
          t.setAttribute("aria-expanded", "false");
          t.parentElement.classList.remove("open");
        });
        toggle.setAttribute("aria-expanded", String(!open));
        toggle.parentElement.classList.toggle("open", !open);
      });
    });

    // Click outside closes desktop dropdowns.
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".has-dropdown")) {
        Array.prototype.forEach.call(toggles, function (t) {
          t.setAttribute("aria-expanded", "false");
          t.parentElement.classList.remove("open");
        });
      }
    });
  }

  function render() {
    var headerSlot = document.getElementById("site-header");
    var footerSlot = document.getElementById("site-footer");
    if (headerSlot) {
      headerSlot.outerHTML = buildHeader();
    }
    if (footerSlot) {
      footerSlot.outerHTML = buildFooter();
    }
    var header = document.querySelector(".site-header");
    if (header) {
      wireMobileMenu(header);
      wireDropdowns(header);
      // Pre-fill the search box from ?q= so the header reflects the query.
      var params = new URLSearchParams(location.search);
      var q = params.get("q");
      var input = header.querySelector("#nav-search-input");
      if (q && input) input.value = q;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
