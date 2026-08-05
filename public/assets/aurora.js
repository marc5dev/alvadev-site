/* alvadev — aurora.js
   A hand-rolled WebGL shader background: domain-warped noise drifting like
   an aurora, tinted in the brand palette, gently following the pointer.
   No libraries. If WebGL is unavailable, the CSS .sky fallback stays visible. */

(function () {
  "use strict";

  var canvas = document.getElementById("aurora");
  if (!canvas) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || document.documentElement.classList.contains("instant");

  var gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power"
  });
  if (!gl) return;

  var VERT = [
    "attribute vec2 aPos;",
    "void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uT;",
    "uniform vec2 uMouse;",

    "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",

    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  f = f * f * (3.0 - 2.0 * f);",
    "  float a = hash(i);",
    "  float b = hash(i + vec2(1.0, 0.0));",
    "  float c = hash(i + vec2(0.0, 1.0));",
    "  float d = hash(i + vec2(1.0, 1.0));",
    "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
    "}",

    "float fbm(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);",
    "  for (int i = 0; i < 5; i++){ v += a * noise(p); p = rot * p; a *= 0.5; }",
    "  return v;",
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;",
    "  float t = uT * 0.045;",

    "  vec2 q = vec2(fbm(uv * 1.3 + vec2(0.0, t)), fbm(uv * 1.3 - vec2(t * 0.7, 0.0)));",
    "  vec2 r = vec2(fbm(uv * 1.9 + q * 1.4 + vec2(1.7, 9.2) + t * 0.5),",
    "                fbm(uv * 1.9 + q * 1.4 + vec2(8.3, 2.8) - t * 0.35));",
    "  float f = fbm(uv * 2.1 + r * 1.7);",

    "  float md = length(uv - uMouse);",
    "  float m = exp(-md * 2.6);",

    "  vec3 base   = vec3(0.016, 0.020, 0.038);",
    "  vec3 cyan   = vec3(0.070, 0.320, 0.420);",
    "  vec3 violet = vec3(0.260, 0.190, 0.550);",
    "  vec3 pink   = vec3(0.450, 0.180, 0.420);",

    "  vec3 col = base;",
    "  col = mix(col, cyan,   smoothstep(0.25, 0.85, f) * 0.82);",
    "  col = mix(col, violet, smoothstep(0.30, 0.90, q.y) * 0.72);",
    "  col = mix(col, pink,   smoothstep(0.55, 0.95, r.x) * 0.58);",
    "  col += vec3(0.10, 0.14, 0.25) * m * 0.55;",
    "  col *= 0.85 + 0.45 * f;",

    "  float vig = smoothstep(1.25, 0.35, length(uv * vec2(0.9, 1.15)));",
    "  col = mix(vec3(0.020, 0.023, 0.043), col, vig);",

    "  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;", /* de-banding dither */

    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  /* one big triangle covers the screen */
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "uRes");
  var uT = gl.getUniformLocation(prog, "uT");
  var uMouse = gl.getUniformLocation(prog, "uMouse");

  /* render at reduced resolution — it's soft gradients, nobody can tell */
  var SCALE = window.innerWidth < 768 ? 0.55 : 0.6;
  var running = false;
  var enabled = !document.documentElement.classList.contains("aurora-off");
  var raf = 0;
  var t0 = (window.performance || Date).now();

  var mx = 0, my = 0, tmx = 0, tmy = 0; /* smoothed pointer in shader uv space */

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    if (window.innerWidth < 768) dpr = 1;
    var w = Math.max(1, Math.round(window.innerWidth * dpr * SCALE));
    var h = Math.max(1, Math.round(window.innerHeight * dpr * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function frame() {
    resize();
    mx += (tmx - mx) * 0.055;
    my += (tmy - my) * 0.055;
    var t = reduced ? 13700 : (window.performance || Date).now() - t0;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uT, t / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop() {
    if (!running) return;
    frame();
    raf = window.requestAnimationFrame(loop);
  }

  function start() {
    if (running || !enabled || gl.isContextLost()) return;
    running = true;
    if (reduced) { running = false; frame(); return; } /* one pretty still frame */
    raf = window.requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(raf);
  }

  window.addEventListener("pointermove", function (e) {
    var w = window.innerWidth, h = window.innerHeight;
    tmx = (e.clientX - 0.5 * w) / h;
    tmy = (0.5 * h - e.clientY) / h;
  }, { passive: true });

  window.addEventListener("resize", function () {
    if (reduced) frame(); /* keep the still frame crisp */
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    stop();
  });

  /* tiny public API for the command palette */
  window.ALVADEV = window.ALVADEV || {};
  window.ALVADEV.aurora = {
    enabled: function () { return enabled; },
    set: function (on) {
      enabled = !!on;
      document.documentElement.classList.toggle("aurora-off", !enabled);
      if (enabled) { start(); if (reduced) frame(); } else { stop(); }
      try { localStorage.setItem("alvadev:aurora", enabled ? "1" : "0"); } catch (_) {}
    }
  };

  try {
    if (localStorage.getItem("alvadev:aurora") === "0") {
      enabled = false;
      document.documentElement.classList.add("aurora-off");
    }
  } catch (_) {}

  start();
})();
