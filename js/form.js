/*
 * form.js — Client-side validation + feedback for the help form.
 * There is no backend for support tickets, so we validate, give accessible
 * feedback and make clear that this is a demo submission.
 */
(function () {
  "use strict";

  var form = document.getElementById("help-form");
  if (!form) return;
  var feedback = document.getElementById("help-feedback");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Use the browser's own constraint validation, then surface the result.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var name = form.nombre.value.trim().split(" ")[0];
    feedback.hidden = false;
    feedback.textContent =
      "¡Gracias, " +
      name +
      "! Hemos recibido tu consulta (demo: no se envía a ningún servidor).";
    form.reset();
    feedback.focus();
  });

  form.addEventListener("reset", function () {
    if (feedback) feedback.hidden = true;
  });
})();
