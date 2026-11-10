/* Virtual Dog Park - Round 1 JavaScript
   This file is linked from index.html with <script src="script.js"></script>.
   It only keeps the footer copyright year up to date, so you can confirm the
   JavaScript file is connected to the page.

   The interactive pet-game features belong to a later round and are
   intentionally not included here. */

// Wait until the HTML is loaded before changing anything on the page.
document.addEventListener("DOMContentLoaded", function () {
  // Find the <span id="year"> in the footer and write the current year into it.
  var yearSpan = document.getElementById("year");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
