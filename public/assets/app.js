/* alvadev — app.js
   Every interaction on this site, hand-rolled in vanilla JS:
   entrance choreography, text scramble, a self-typing editor, scroll reveals,
   3D tilt, magnetic buttons, counters, a ⌘K palette and a clipboard toast.
   ~zero dependencies. */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var INSTANT = new URLSearchParams(location.search).has("instant");
  if (INSTANT) root.classList.add("instant");
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches || INSTANT;
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var EMAIL = ["hello", "alvadev.com"].join("@");
  var GITHUB = "https://github.com/marc5dev";

  /* ---------- entrance: flip .is-loaded once the font is in (or fast) ---------- */
  function loaded() { root.classList.add("is-loaded"); }
  if (INSTANT) {
    loaded();
  } else {
    var armed = false;
    var arm = function () { if (!armed) { armed = true; requestAnimationFrame(loaded); } };
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(arm);
    setTimeout(arm, 420); /* never block the show on a slow font */
  }

  /* ---------- scroll: progress bar + sticky nav ---------- */
  var nav = $(".nav");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      if (nav) nav.classList.toggle("is-stuck", window.scrollY > 12);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = $(".burger");
  var menu = $("#menu");
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.classList.toggle("open", open);
    doc.body.style.overflow = open ? "hidden" : "";
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- pointer glow ---------- */
  var glow = $(".glow");
  if (glow && FINE && !REDUCED) {
    var gx = -600, gy = -600, tx = -600, ty = -600, seen = false;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; gx = tx; gy = ty; root.classList.add("has-pointer"); }
    }, { passive: true });
    (function glowLoop() {
      gx += (tx - gx) * 0.09;
      gy += (ty - gy) * 0.09;
      glow.style.transform = "translate(" + (gx - 260) + "px," + (gy - 260) + "px)";
      requestAnimationFrame(glowLoop);
    })();
  }

  /* ---------- text scramble rotator ---------- */
  var rotator = $("#rotator");
  if (rotator) {
    var words = [];
    try { words = JSON.parse(rotator.getAttribute("data-words") || "[]"); } catch (_) {}
    if (words.length > 1 && !REDUCED) {
      var GLYPHS = "!<>-_\\/[]{}—=+*^?#";
      var wi = 0, frame = 0, queue = [], rafId = 0;
      var setText = function (next) {
        var prev = rotator.textContent;
        var len = Math.max(prev.length, next.length);
        queue = [];
        for (var i = 0; i < len; i++) {
          queue.push({
            from: prev[i] || "",
            to: next[i] || "",
            start: Math.floor(Math.random() * 22),
            end: Math.floor(Math.random() * 22) + 18,
            ch: ""
          });
        }
        cancelAnimationFrame(rafId);
        frame = 0;
        update();
      };
      var update = function () {
        var out = "", done = 0;
        for (var i = 0; i < queue.length; i++) {
          var q = queue[i];
          if (frame >= q.end) { done++; out += q.to; }
          else if (frame >= q.start) {
            if (!q.ch || Math.random() < 0.28) q.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            out += q.ch;
          } else out += q.from;
        }
        rotator.textContent = out;
        if (done < queue.length) { frame++; rafId = requestAnimationFrame(update); }
      };
      var tick = function () { wi = (wi + 1) % words.length; setText(words[wi]); };
      /* only rotate while the hero is on screen */
      var heroVisible = true;
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }).observe(rotator);
      setInterval(function () { if (heroVisible && !doc.hidden) tick(); }, 3100);
    }
  }

  /* ---------- self-typing editor ---------- */
  var typer = $("#typer");
  if (typer) {
    var TOKENS = [
      ["t-com", "// wow.config.js — how this site ships\n"],
      ["t-kw", "export default"], [null, " "], ["t-pun", "{\n"],
      [null, "  "], ["t-key", "stack"], ["t-pun", ": ["], ["t-str", "\"html\""], ["t-pun", ", "], ["t-str", "\"css\""], ["t-pun", ", "], ["t-str", "\"vanilla js\""], ["t-pun", "],\n"],
      [null, "  "], ["t-key", "frameworks"], ["t-pun", ": "], ["t-num", "0"], ["t-pun", ",\n"],
      [null, "  "], ["t-key", "buildStep"], ["t-pun", ": "], ["t-num", "null"], ["t-pun", ","], ["t-com", "  // git push → live in ~60s\n"],
      [null, "  "], ["t-key", "runtime"], ["t-pun", ": "], ["t-str", "\"cloudflare edge\""], ["t-pun", ",\n"],
      [null, "  "], ["t-key", "animations"], ["t-pun", ": "], ["t-str", "\"hand-rolled webgl + css\""], ["t-pun", ",\n"],
      [null, "  "], ["t-key", "wowFactor"], ["t-pun", ": "], ["t-num", "Infinity"], ["t-pun", ",\n"],
      ["t-pun", "};"]
    ];

    var renderAll = function () {
      typer.textContent = "";
      TOKENS.forEach(function (t) {
        var span = doc.createElement("span");
        if (t[0]) span.className = t[0];
        span.textContent = t[1];
        typer.appendChild(span);
      });
    };

    if (REDUCED || !("requestAnimationFrame" in window)) {
      renderAll();
    } else {
      typer.textContent = "";
      var cursor = doc.createElement("span");
      cursor.className = "cursor";
      typer.appendChild(cursor);

      var ti = 0, ci = 0, current = null;
      var typeStep = function () {
        if (ti >= TOKENS.length) { return; } /* leave the cursor blinking at the end */
        var tok = TOKENS[ti];
        if (!current) {
          current = doc.createElement("span");
          if (tok[0]) current.className = tok[0];
          typer.insertBefore(current, cursor);
        }
        var ch = tok[1][ci];
        current.textContent += ch;
        ci++;
        var delay = 16 + Math.random() * 26;
        if (ch === "\n") delay = 110;
        if (ci >= tok[1].length) { ti++; ci = 0; current = null; }
        setTimeout(typeStep, delay);
      };
      setTimeout(typeStep, 1250);
    }
  }

  /* ---------- scroll reveals ---------- */
  var toReveal = $$(".reveal");
  if ("IntersectionObserver" in window && toReveal.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    toReveal.forEach(function (el) { io.observe(el); });
  } else {
    toReveal.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- counters ---------- */
  var counters = $$("[data-count]");
  if (counters.length) {
    var finalize = function (el) { el.textContent = el.getAttribute("data-count") || "0"; };
    var animate = function (el) {
      el.setAttribute("data-started", "1");
      var to = parseFloat(el.getAttribute("data-count")) || 0;
      var from = parseFloat(el.getAttribute("data-from") || "0");
      var t0 = performance.now(), dur = 1500;
      var step = function (now) {
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(from + (to - from) * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (REDUCED || !("IntersectionObserver" in window)) {
      counters.forEach(finalize);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animate(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- 3D tilt + glare ---------- */
  if (FINE && !REDUCED) {
    $$(".tilt").forEach(function (card) {
      var max = parseFloat(card.getAttribute("data-tilt-max") || "6");
      var rect = null;
      card.addEventListener("pointerenter", function () { rect = card.getBoundingClientRect(); });
      card.addEventListener("pointermove", function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        card.style.transform =
          "perspective(900px) rotateX(" + ((0.5 - py) * max).toFixed(2) + "deg)" +
          " rotateY(" + ((px - 0.5) * max).toFixed(2) + "deg)";
        card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () {
        rect = null;
        card.style.transform = "";
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (FINE && !REDUCED) {
    $$(".magnetic").forEach(function (btn) {
      var strength = 0.28;
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (dx * strength).toFixed(1) + "px," + (dy * strength).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transition = "transform .5s cubic-bezier(.19,1,.22,1)";
        btn.style.transform = "";
        setTimeout(function () { btn.style.transition = ""; }, 500);
      });
    });
  }

  /* ---------- toast + clipboard ---------- */
  var toast = $("#toast");
  var toastTimer = 0;
  function showToast(html) {
    if (!toast) return;
    toast.innerHTML = html;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2100);
  }
  function copyEmail() {
    var done = function () { showToast("<span class=\"grad\">" + EMAIL + "</span>&nbsp; copied to clipboard ✓"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(done, function () { showToast(EMAIL); });
    } else { showToast(EMAIL); }
  }
  $$("[data-copy-email]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); copyEmail(); });
  });

  /* ---------- command palette (⌘K / Ctrl+K) ---------- */
  var palette = $("#palette");
  if (palette) {
    var input = $(".palette-input", palette);
    var list = $(".palette-list", palette);
    var lastFocus = null;
    var selected = 0;

    var actions = [
      { label: "Go to — What I build", hint: "01", ico: "01", kw: "work services build", run: function () { go("#work"); } },
      { label: "Go to — Process", hint: "02", ico: "02", kw: "process how", run: function () { go("#process"); } },
      { label: "Go to — Toolbox", hint: "03", ico: "03", kw: "stack tools tech", run: function () { go("#stack"); } },
      { label: "Go to — Contact", hint: "04", ico: "04", kw: "contact email hire", run: function () { go("#contact"); } },
      { label: "Copy email address", hint: "⏎", ico: "@", kw: "mail copy " + EMAIL, run: copyEmail },
      { label: "Open GitHub profile", hint: "↗", ico: "gh", kw: "github code source", run: function () { window.open(GITHUB, "_blank", "noopener"); } },
      {
        label: "Toggle aurora background", hint: "✦", ico: "✦", kw: "aurora webgl background animation",
        run: function () {
          if (window.ALVADEV && window.ALVADEV.aurora) {
            var on = !window.ALVADEV.aurora.enabled();
            window.ALVADEV.aurora.set(on);
            showToast(on ? "aurora <span class=\"grad\">on</span>" : "aurora off — batteries thank you");
          }
        }
      }
    ];

    var go = function (sel) {
      var el = $(sel);
      if (el) el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    };

    var visible = actions.slice();
    var render = function () {
      list.innerHTML = "";
      if (!visible.length) {
        var empty = doc.createElement("div");
        empty.className = "palette-empty";
        empty.textContent = "Nothing found — it's a small site.";
        list.appendChild(empty);
        return;
      }
      visible.forEach(function (a, i) {
        var li = doc.createElement("li");
        var btn = doc.createElement("button");
        btn.className = "palette-item";
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", i === selected ? "true" : "false");
        btn.innerHTML = "<span class=\"pi-ico\">" + a.ico + "</span><span>" + a.label + "</span><span class=\"pi-hint\">" + a.hint + "</span>";
        btn.addEventListener("click", function () { close(); a.run(); });
        btn.addEventListener("pointerenter", function () { select(i); });
        li.appendChild(btn);
        list.appendChild(li);
      });
    };
    var select = function (i) {
      selected = Math.max(0, Math.min(i, visible.length - 1));
      $$(".palette-item", list).forEach(function (b, j) {
        b.setAttribute("aria-selected", j === selected ? "true" : "false");
      });
    };
    var filter = function () {
      var q = input.value.trim().toLowerCase();
      visible = actions.filter(function (a) {
        return !q || (a.label + " " + a.kw).toLowerCase().indexOf(q) !== -1;
      });
      selected = 0;
      render();
    };
    var open = function () {
      lastFocus = doc.activeElement;
      palette.hidden = false;
      input.value = "";
      filter();
      input.focus();
    };
    var close = function () {
      palette.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    var toggle = function () { palette.hidden ? open() : close(); };

    input.addEventListener("input", filter);
    doc.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        toggle();
        return;
      }
      if (palette.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); select(selected + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); select(selected - 1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (visible[selected]) { close(); visible[selected].run(); }
      } else if (e.key === "Tab") {
        e.preventDefault(); /* tiny dialog: keep focus in the input, arrows navigate */
        input.focus();
      }
    });
    $(".palette-backdrop", palette).addEventListener("click", close);
    $$("[data-palette]").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); open(); });
    });
  }

  /* ---------- housekeeping ---------- */
  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- a note for fellow devs ---------- */
  try {
    var badge = "background:linear-gradient(92deg,#7dd3fc,#a78bfa,#f0abfc);color:#05060b;padding:4px 10px;border-radius:6px 0 0 6px;font-weight:700";
    var tail = "background:#12151f;color:#e9edf5;padding:4px 10px;border-radius:0 6px 6px 0";
    console.log("%calvadev%chand-rolled · zero frameworks · zero trackers", badge, tail);
    console.log("Curious how it's made? Every line is readable: view-source is the docs.\nTry ⌘K, too.");
  } catch (_) {}
})();
