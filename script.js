/* Champions Barber Shop - interactions */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header shadow + belt progress ---------- */
  var topbar = $(".topbar");
  var beltFill = $("#beltFill");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      topbar.classList.toggle("is-scrolled", y > 8);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, y / max) : 0;
      beltFill.style.width = (pct * 100).toFixed(2) + "%";
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var navToggle = $("#navToggle");
  var topnav = $("#topnav");
  navToggle.addEventListener("click", function () {
    var open = topnav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("a", topnav).forEach(function (a) {
    a.addEventListener("click", function () {
      topnav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- scroll reveal ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- services tabs ---------- */
  var tabs = $$(".stab");
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); selectTab(next);
      }
    });
  });
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }

  /* ---------- open / closed badge ---------- */
  var openText = $("#openText");
  var openBadge = $("#openBadge");
  var OPEN = 9, CLOSE = 17;
  function hartfordNow() {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", weekday: "long", hour: "numeric", minute: "numeric", hour12: false
    });
    var parts = {};
    fmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return { day: parts.weekday, hour: parseInt(parts.hour, 10) % 24, minute: parseInt(parts.minute, 10) };
  }
  function updateOpenBadge() {
    try {
      var now = hartfordNow();
      var t = now.hour + now.minute / 60;
      var open = t >= OPEN && t < CLOSE;
      openBadge.classList.toggle("is-open", open);
      openBadge.classList.toggle("is-closed", !open);
      if (open) {
        openText.textContent = "Open now \u00b7 until 5:00 PM";
      } else if (t < OPEN) {
        openText.textContent = "Closed \u00b7 opens 9:00 AM today";
      } else {
        openText.textContent = "Closed \u00b7 opens 9:00 AM tomorrow";
      }
      var rows = $$(".hours tr");
      var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var idx = names.indexOf(now.day);
      rows.forEach(function (r, i) { r.classList.toggle("is-today", i === idx); });
    } catch (e) {
      openText.textContent = "Open daily \u00b7 9:00 AM - 5:00 PM";
    }
  }
  updateOpenBadge();
  setInterval(updateOpenBadge, 60000);

  /* ---------- booking wizard ---------- */
  var services = [];
  $$(".svc").forEach(function (card) {
    services.push({
      name: card.getAttribute("data-svc"),
      dur: parseInt(card.getAttribute("data-dur"), 10),
      price: card.getAttribute("data-price"),
      el: card
    });
  });

  var svcPicks = $("#svcPicks");
  var picked = {}; /* name -> true */
  services.forEach(function (s) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "bw-chip";
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = s.name + ' <span class="chip-price">' + s.price + "</span>";
    b.addEventListener("click", function () { toggleSvc(s, b); });
    s.chip = b;
    svcPicks.appendChild(b);
  });

  function toggleSvc(s, chip) {
    picked[s.name] = !picked[s.name];
    chip.setAttribute("aria-pressed", picked[s.name] ? "true" : "false");
    s.el.classList.toggle("is-picked", picked[s.name]);
    syncHint();
  }
  function syncHint() {
    var n = Object.keys(picked).filter(function (k) { return picked[k]; }).length;
    $("#svcHint").textContent = n === 0
      ? "Tap a service to add it. Tap again to remove."
      : n + " service" + (n > 1 ? "s" : "") + " selected \u00b7 about " + totalDur() + " min in the chair";
  }
  function pickedList() {
    return services.filter(function (s) { return picked[s.name]; });
  }
  function totalDur() {
    return pickedList().reduce(function (a, s) { return a + s.dur; }, 0) || 0;
  }

  /* add-to-booking buttons on service cards */
  $$(".btn-add").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".svc");
      var s = services.filter(function (x) { return x.el === card; })[0];
      if (s) { toggleSvc(s, s.chip); }
      document.getElementById("decision").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* dates: next 14 days, Hartford time */
  var dateStrip = $("#dateStrip");
  var chosenDate = null;
  var fmtDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" });
  var fmtNum = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", day: "numeric" });
  var fmtMon = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short" });
  var fmtLong = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" });
  for (var i = 0; i < 14; i++) {
    var d = new Date(Date.now() + i * 86400000);
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "date-chip";
    chip.setAttribute("aria-pressed", "false");
    chip.innerHTML = '<span class="dc-dow">' + (i === 0 ? "Today" : fmtDay.format(d)) + "</span>" +
      '<span class="dc-num">' + fmtNum.format(d) + "</span>" +
      '<span class="dc-mon">' + fmtMon.format(d) + "</span>";
    (function (date, el, isFirst) {
      el.addEventListener("click", function () {
        chosenDate = date;
        $$(".date-chip").forEach(function (c) { c.setAttribute("aria-pressed", c === el ? "true" : "false"); });
        buildTimes(isFirst);
      });
    })(d, chip, i === 0);
    dateStrip.appendChild(chip);
  }
  function buildTimes(isToday) {
    var grid = $("#timeGrid");
    grid.innerHTML = "";
    var nowH = hartfordNow().hour + hartfordNow().minute / 60;
    var slots = [];
    for (var h = 9; h <= 16; h++) {
      slots.push([h, 0]); slots.push([h, 30]);
    }
    slots = slots.filter(function (s) {
      var t = s[0] + s[1] / 60 + totalDur() / 60;
      if (t > 17) return false;
      if (isToday && s[0] + s[1] / 60 <= nowH) return false;
      return true;
    });
    if (!slots.length) {
      grid.innerHTML = '<p class="date-hint">No slots left today. Pick another day.</p>';
      return;
    }
    slots.forEach(function (s) {
      var hr = s[0], mm = s[1];
      var label = ((hr % 12) || 12) + ":" + (mm === 0 ? "00" : "30") + (hr < 12 ? " AM" : " PM");
      var b = document.createElement("button");
      b.type = "button"; b.className = "time-chip"; b.textContent = label;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        chosenTime = label;
        $$(".time-chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      });
      grid.appendChild(b);
    });
  }

  var chosenTime = null;
  var step = 1;
  var back = $("#bwBack"), next = $("#bwNext");
  var steps = $$(".bstep");

  function setStep(n) {
    step = n;
    $$(".bw-panel").forEach(function (p) { p.hidden = parseInt(p.getAttribute("data-panel"), 10) !== n; });
    steps.forEach(function (s) {
      var sn = parseInt(s.getAttribute("data-step"), 10);
      s.classList.toggle("is-done", sn < n);
      if (sn === n) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current");
    });
    back.disabled = n === 1;
    next.textContent = n === 4 ? "Finish" : "Continue";
    if (n === 3) buildTimes(chosenDateIsToday());
    if (n === 4) renderSummary();
    next.focus({ preventScroll: true });
  }
  function chosenDateIsToday() {
    if (!chosenDate) return false;
    var today = new Date();
    return fmtNum.format(today) === fmtNum.format(chosenDate) && fmtMon.format(today) === fmtMon.format(chosenDate);
  }

  next.addEventListener("click", function () {
    if (step === 1 && !pickedList().length) {
      $("#svcHint").textContent = "Pick at least one service to continue.";
      return;
    }
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      if (!chosenDate || !chosenTime) {
        var grid = $("#timeGrid");
        if (!chosenDate) {
          /* default to first available date */
          var first = $$(".date-chip")[0];
          if (first) first.click();
        } else {
          var hint = grid.querySelector(".date-hint");
          if (!hint) {
            hint = document.createElement("p");
            hint.className = "date-hint";
            grid.appendChild(hint);
          }
          hint.textContent = "Choose a time to continue.";
        }
        return;
      }
      setStep(4); return;
    }
    if (step === 4) {
      document.getElementById("callConfirm").focus();
    }
  });
  back.addEventListener("click", function () { if (step > 1) setStep(step - 1); });

  function renderSummary() {
    var barber = ($('input[name="barber"]:checked') || {}).value || "Any available specialist";
    var list = pickedList();
    var total = list.reduce(function (a, s) {
      var num = parseFloat(s.price.replace(/[^0-9.]/g, ""));
      return a + (isNaN(num) ? 0 : num);
    }, 0);
    var sum = $("#bwSummary");
    sum.innerHTML =
      "<dl>" +
      "<dt>Services</dt><dd class='sum-services'>" + list.map(function (s) { return s.name; }).join(" + ") + "</dd>" +
      "<dt>Barber</dt><dd>" + barber + "</dd>" +
      "<dt>When</dt><dd>" + fmtLong.format(chosenDate) + " at " + chosenTime + "</dd>" +
      "<dt>Length</dt><dd>about " + totalDur() + " minutes</dd>" +
      (total > 0 ? "<dt>Estimated total</dt><dd>$" + (total % 1 ? total.toFixed(2) : total) + "</dd>" : "") +
      "</dl>";
    sum.setAttribute("tabindex", "-1");
  }

  $("#copySummary").addEventListener("click", function () {
    var barber = ($('input[name="barber"]:checked') || {}).value || "Any available specialist";
    var list = pickedList();
    var text = "Hi Champions Barber Shop, I'd like to book: " +
      list.map(function (s) { return s.name; }).join(" + ") +
      " with " + barber + ", " + fmtLong.format(chosenDate) + " at " + chosenTime + ".";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        $("#copySummary").textContent = "Copied \u2713";
        setTimeout(function () { $("#copySummary").textContent = "Copy my summary"; }, 2000);
      });
    }
  });

  /* ---------- gallery lightbox ---------- */
  var lightbox = $("#lightbox"), lbImg = $("#lbImg"), lbClose = $("#lbClose");
  $$(".g-item").forEach(function (b) {
    b.addEventListener("click", function () {
      lbImg.src = b.getAttribute("data-full");
      lbImg.alt = $("img", b).alt;
      lightbox.hidden = false;
      lbClose.focus();
      document.body.style.overflow = "hidden";
    });
  });
  function closeLb() {
    lightbox.hidden = true;
    lbImg.src = "";
    document.body.style.overflow = "";
  }
  lbClose.addEventListener("click", closeLb);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lightbox.hidden) closeLb();
  });

  /* ---------- before / after slider ---------- */
  var ba = $("#baSlider"), baBefore = $("#baBefore"), baHandle = $("#baHandle");
  function setBa(pct) {
    pct = Math.max(0, Math.min(100, pct));
    ba.setAttribute("aria-valuenow", Math.round(pct));
    baBefore.style.width = pct + "%";
    baHandle.style.left = pct + "%";
  }
  function baFromEvent(e) {
    var r = ba.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setBa((x / r.width) * 100);
  }
  var dragging = false;
  ba.addEventListener("pointerdown", function (e) { dragging = true; ba.setPointerCapture(e.pointerId); baFromEvent(e); });
  ba.addEventListener("pointermove", function (e) { if (dragging) baFromEvent(e); });
  ba.addEventListener("pointerup", function () { dragging = false; });
  ba.addEventListener("pointercancel", function () { dragging = false; });
  ba.addEventListener("keydown", function (e) {
    var now = parseFloat(ba.getAttribute("aria-valuenow"));
    if (e.key === "ArrowLeft") { e.preventDefault(); setBa(now - 5); }
    if (e.key === "ArrowRight") { e.preventDefault(); setBa(now + 5); }
  });
  setBa(50);
})();
