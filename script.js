/* Champions Barber Shop: behavior pass
   menu, open/closed status, reveals, tape count-up, scrollspy, lightbox */

(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* sticky header shadow, rAF-throttled */
  var bar = $(".topbar");
  if (bar) {
    var ticking = false;
    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          bar.classList.toggle("scrolled", window.scrollY > 8);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* mobile menu */
  var mbtn = $(".menu-btn");
  var menu = $("#mobileMenu");
  if (mbtn && menu) {
    var closeMenu = function () {
      menu.hidden = true;
      mbtn.setAttribute("aria-expanded", "false");
      mbtn.setAttribute("aria-label", "Open menu");
    };
    mbtn.addEventListener("click", function () {
      var open = menu.hidden;
      menu.hidden = !open;
      mbtn.setAttribute("aria-expanded", String(open));
      mbtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) closeMenu();
    });
  }

  /* open/closed badge + today's row */
  var OPEN_H = 9, CLOSE_H = 17;
  var now = new Date();
  var idx = (now.getDay() + 6) % 7; /* table runs Monday first */
  var rows = $$(".hours tbody tr");
  if (rows[idx]) rows[idx].classList.add("is-today");

  var badge = $("#openBadge");
  if (badge) {
    var h = now.getHours() + now.getMinutes() / 60;
    var open = h >= OPEN_H && h < CLOSE_H;
    badge.hidden = false;
    badge.classList.add(open ? "is-open" : "is-closed");
    badge.innerHTML = '<span class="dot" aria-hidden="true"></span>' +
      (open ? "Open now &middot; until 5:00 PM" : "Closed &middot; opens 9:00 AM" + (h >= CLOSE_H ? " tomorrow" : ""));
  }

  /* reveal on scroll */
  var rev = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (el) { io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* tape numbers count up once seen */
  var nums = $$(".tape-num");
  var countUp = function (el) {
    var m = el.textContent.match(/^([\d.]+)(.*)$/);
    if (!m) return;
    var end = parseFloat(m[1]);
    var decimals = m[1].indexOf(".") > -1 ? 1 : 0;
    var suffix = m[2];
    var dur = 900;
    var t0 = null;
    var frame = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      p = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * p).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if ("IntersectionObserver" in window && !reduce) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          countUp(en.target);
          io2.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io2.observe(el); });
  }

  /* scrollspy on the desktop nav */
  var links = $$(".topnav a[href^='#']");
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  var secs = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if ("IntersectionObserver" in window && secs.length) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = map[en.target.id];
        if (!a) return;
        links.forEach(function (l) { l.classList.remove("is-active"); });
        a.classList.add("is-active");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    secs.forEach(function (s) { io3.observe(s); });
  }

  /* lightbox for the room strip */
  var lb = document.createElement("div");
  lb.className = "lightbox";
  lb.hidden = true;
  lb.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close photo view">&times;</button>' +
    '<img alt=""><p class="lightbox-cap"></p>';
  document.body.appendChild(lb);
  var lbImg = $("img", lb);
  var lbCap = $(".lightbox-cap", lb);
  var lastFocus = null;
  var openLb = function (src, alt, cap) {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || "";
    lbCap.textContent = cap || alt || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $(".lightbox-close", lb).focus();
  };
  var closeLb = function () {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };
  $$(".room-frame").forEach(function (b) {
    b.addEventListener("click", function () {
      var img = $("img", b);
      openLb(img.currentSrc || img.src, img.alt, img.alt);
    });
  });
  $(".lightbox-close", lb).addEventListener("click", closeLb);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lb.hidden) closeLb();
  });
})();
