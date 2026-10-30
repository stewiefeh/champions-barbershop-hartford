// Champions Barber Shop
// One scroll reveal for figures, nothing else. The hero does its one
// orchestrated stamp on load; everything past that stays quiet.

(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduced) {
    targets.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  targets.forEach(function (el) { io.observe(el); });
})();
