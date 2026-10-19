/* kairo3d.js: a small hand-built WebGL model of Kairo (no libraries). Drag to rotate, pinch or +/- to zoom. */
(function () {
  'use strict';
  function boot() {
    var cv = document.getElementById('glKairo'); if (!cv) return;
    var fail = document.getElementById('glFail');
    var gl = cv.getContext('webgl', { antialias: true, alpha: true }) || cv.getContext('experimental-webgl');
    if (!gl) { if (fail) fail.hidden = false; cv.hidden = true; return; }

    /* ---------- tiny matrix helpers (column-major) ---------- */
    function ident() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
    function mul(a, b) { var o = new Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
    function trans(x, y, z) { var m = ident(); m[12] = x; m[13] = y; m[14] = z; return m; }
    function scl(x, y, z) { var m = ident(); m[0] = x; m[5] = y; m[10] = z; return m; }
    function rotY(a) { var c = Math.cos(a), s = Math.sin(a), m = ident(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
    function rotX(a) { var c = Math.cos(a), s = Math.sin(a), m = ident(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
    function rotZ(a) { var c = Math.cos(a), s = Math.sin(a), m = ident(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
    function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), m = new Array(16).fill(0); m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m; }

    /* ---------- geometry: interleaved pos(3) normal(3) uv(2) ---------- */
    function sphere(la, lo) {
      var v = [], ix = [];
      for (var i = 0; i <= la; i++) { var th = i * Math.PI / la, st = Math.sin(th), ct = Math.cos(th); for (var j = 0; j <= lo; j++) { var ph = j * 2 * Math.PI / lo, x = Math.cos(ph) * st, z = Math.sin(ph) * st; v.push(x, ct, z, x, ct, z, j / lo, i / la); } }
      for (i = 0; i < la; i++) for (j = 0; j < lo; j++) { var a = i * (lo + 1) + j, b = a + lo + 1; ix.push(a, b, a + 1, b, b + 1, a + 1); }
      return { v: v, i: ix };
    }
    function cone(seg, rBot, rTop, h) { /* open cone/cylinder from y=0 to y=h */
      var v = [], ix = [], sl = (rBot - rTop) / h, ny = sl, len = Math.sqrt(1 + sl * sl);
      for (var j = 0; j <= seg; j++) { var ph = j * 2 * Math.PI / seg, c = Math.cos(ph), s = Math.sin(ph); v.push(c * rBot, 0, s * rBot, c / len, ny / len, s / len, j / seg, 0); v.push(c * rTop, h, s * rTop, c / len, ny / len, s / len, j / seg, 1); }
      for (j = 0; j < seg; j++) { var a = j * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      return { v: v, i: ix };
    }
    function disc(seg) { var v = [0, 0, 0, 0, 0, 1, .5, .5], ix = []; for (var j = 0; j <= seg; j++) { var ph = j * 2 * Math.PI / seg, c = Math.cos(ph), s = Math.sin(ph); v.push(c, s, 0, 0, 0, 1, .5 + c * .5, .5 - s * .5); if (j > 0) ix.push(0, j, j + 1); } return { v: v, i: ix }; }
    function star4(r) { /* flat 4-point star made of triangles, one point shorter */ var v = [0, 0, 0, 0, 0, 1, .5, .5], ix = [], n = 8; for (var j = 0; j < n; j++) { var a = j * Math.PI * 2 / n, rr = j % 2 === 0 ? r : r * .45; if (j === 0) rr = r * .5; v.push(Math.cos(a) * rr, Math.sin(a) * rr, 0, 0, 0, 1, .5, .5); } for (j = 1; j <= n; j++) ix.push(0, j, j % n + 1); return { v: v, i: ix }; }

    /* ---------- shaders ---------- */
    var VS = 'attribute vec3 aP;attribute vec3 aN;attribute vec2 aT;uniform mat4 uMVP;uniform mat4 uM;varying vec3 vN;varying vec2 vT;varying vec3 vW;void main(){vN=mat3(uM[0].xyz,uM[1].xyz,uM[2].xyz)*aN;vT=aT;vW=(uM*vec4(aP,1.)).xyz;gl_Position=uMVP*vec4(aP,1.);}';
    var FS = 'precision mediump float;varying vec3 vN;varying vec2 vT;varying vec3 vW;uniform vec3 uC;uniform vec3 uE;uniform float uA;uniform float uUseTex;uniform sampler2D uTex;uniform vec3 uCam;' +
      'void main(){vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;vec3 L=normalize(vec3(-.5,.8,.7));float d=max(dot(n,L),0.);vec3 V=normalize(uCam-vW);float rim=pow(1.-max(dot(n,V),0.),2.5);' +
      'vec3 base=uC;if(uUseTex>.5){vec4 t=texture2D(uTex,vT);base=mix(uC,t.rgb,t.a);}' +
      'vec3 col=base*(.42+.8*d)+uE+vec3(.25,.35,.7)*rim*.45;gl_FragColor=vec4(col,uA);}';
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var prog, U = {}, A = {};
    try {
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { if (fail) fail.hidden = false; cv.hidden = true; return; }
    gl.useProgram(prog);
    ['uMVP', 'uM', 'uC', 'uE', 'uA', 'uUseTex', 'uTex', 'uCam'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    ['aP', 'aN', 'aT'].forEach(function (n) { A[n] = gl.getAttribLocation(prog, n); });

    function mesh(g) { var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.v), gl.STATIC_DRAW); var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g.i), gl.STATIC_DRAW); return { vb: vb, ib: ib, n: g.i.length }; }
    var M = { sph: mesh(sphere(18, 24)), cone: mesh(cone(28, 1, 0, 1)), cyl: mesh(cone(20, 1, 1, 1)), disc: mesh(disc(32)), star: mesh(star4(1)), tcone: mesh(cone(28, 1, .55, 1)) };

    /* clock face texture: twelve gold ticks, no hands */
    var tc = document.createElement('canvas'); tc.width = tc.height = 128; var cx = tc.getContext('2d');
    cx.fillStyle = '#1b1f4d'; cx.beginPath(); cx.arc(64, 64, 62, 0, 7); cx.fill(); cx.strokeStyle = '#f2c768'; cx.lineWidth = 5; cx.stroke();
    for (var k = 0; k < 12; k++) { var a = k * Math.PI / 6; cx.beginPath(); cx.moveTo(64 + Math.sin(a) * 46, 64 - Math.cos(a) * 46); cx.lineTo(64 + Math.sin(a) * 56, 64 - Math.cos(a) * 56); cx.lineWidth = 4; cx.stroke(); }
    cx.fillStyle = '#fff1c4'; cx.beginPath(); cx.arc(64, 64, 5, 0, 7); cx.fill();
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    /* ---------- the model: list of parts, each {m: mesh, t: local transform fn(time), c: color, e: emissive, a: alpha} ---------- */
    function hex(h) { return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]; }
    var INDIGO = hex('#26307a'), DEEP = hex('#171c52'), SKIN = hex('#f2d6c2'), SILVER = hex('#e9ecf7'), GOLD = hex('#e8b84a'), CYAN = hex('#5de8f5'), VIOLET = hex('#a98bff');
    var parts = [
      { m: 'tcone', c: INDIGO, t: function () { return mul(trans(0, -1.45, 0), scl(1.1, 1.7, 1.1)); } },                         /* cloak */
      { m: 'cone', c: DEEP, t: function () { return mul(trans(0, -1.47, 0), scl(1.2, .12, 1.2)); } },                  /* hem */
      { m: 'sph', c: SKIN, t: function () { return mul(trans(0, .72, .08), scl(.5, .52, .5)); } },                                     /* face */
      { m: 'sph', c: SILVER, t: function () { return mul(trans(0, .82, -.06), scl(.56, .56, .54)); } },                                /* hair */
      { m: 'sph', c: INDIGO, t: function () { return mul(trans(0, .95, -.2), scl(.64, .7, .6)); } },                                   /* hood back */
      { m: 'cone', c: INDIGO, t: function () { return mul(trans(0, 1.35, -.3), mul(rotX(-.55), scl(.38, .8, .38))); } },               /* hood tip */
      { m: 'star', c: GOLD, e: [.35, .28, .05], t: function () { return mul(trans(0, 1.95, -.72), scl(.17, .17, .17)); }, ds: true },    /* tip star */
      { m: 'sph', c: GOLD, e: [.55, .42, .05], t: function () { return mul(trans(-.17, .74, .49), scl(.12, .17, .05)); } },             /* eyes */
      { m: 'sph', c: GOLD, e: [.55, .42, .05], t: function () { return mul(trans(.17, .74, .49), scl(.12, .17, .05)); } },
      { m: 'sph', c: [1, .6, .6], t: function () { return mul(trans(0, .6, .52), scl(.05, .022, .03)); } },                            /* mouth */
      { m: 'cyl', c: GOLD, t: function () { return mul(trans(1.0, -.5, .45), scl(.3, .6, .3)); } },                                  /* lantern body */
      { m: 'cone', c: GOLD, t: function () { return mul(trans(1.0, .1, .45), scl(.34, .2, .34)); } },                                 /* lantern cap */
      { m: 'disc', c: [1, 1, 1], tex: true, e: [.1, .08, .02], t: function () { return mul(trans(1.0, -.2, .755), scl(.23, .23, .23)); } }, /* clock face (no hands) */
      { m: 'cyl', c: hex('#caa24a'), t: function () { return mul(trans(1.0, .3, .45), scl(.02, .5, .02)); } },                     /* chain */
      { m: 'sph', c: [1, .9, .55], e: [.7, .55, .15], t: function (t) { return mul(trans(1.0, -.5, .45), scl(.15 + .015 * Math.sin(t * 3), .15 + .015 * Math.sin(t * 3), .15)); } }, /* flame */
      { m: 'cone', c: CYAN, e: [.05, .2, .22], a: .55, t: function () { return mul(trans(-.34, .98, .02), mul(rotZ(.45), scl(.14, .7, .1))); }, tr: true },   /* ear L (taller) */
      { m: 'cone', c: VIOLET, e: [.12, .08, .22], a: .55, t: function () { return mul(trans(.34, .98, .02), mul(rotZ(-.5), scl(.14, .5, .1))); }, tr: true }  /* ear R (shorter) */
    ];
    var orbs = []; for (var q = 0; q < 8; q++) orbs.push({ a: q * Math.PI / 4, r: 1.5 + (q % 3) * .22, y: -.4 + (q * .27) % 2, s: .035 + (q % 2) * .02 });

    /* ---------- state + interaction ---------- */
    var yaw = .5, pitch = .05, vy = 0, dist = 5.4, auto = true, drag = null, pointers = {}, pinch0 = 0, dist0 = 5.4, t0 = performance.now(), raf = 0, visible = true;
    var spinBtn = document.getElementById('glSpin'), resetBtn = document.getElementById('glReset');
    function motionOK() { return window.K ? K.motionOK() : !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pointers[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(pointers); if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = dist; } drag = { x: e.clientX, y: e.clientY }; auto = false; sync(); });
    cv.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return; pointers[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(pointers);
      if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; dist = Math.max(3.2, Math.min(8, dist0 * pinch0 / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)))); draw(); return; }
      if (drag) { var dx = e.clientX - drag.x, dy = e.clientY - drag.y; yaw += dx * .01; pitch = Math.max(-.6, Math.min(.6, pitch + dy * .006)); vy = dx * .002; drag = { x: e.clientX, y: e.clientY }; draw(); }
    });
    function up(e) { delete pointers[e.pointerId]; if (!Object.keys(pointers).length) drag = null; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('keydown', function (e) {
      var h = true;
      if (e.key === 'ArrowLeft') yaw -= .12; else if (e.key === 'ArrowRight') yaw += .12; else if (e.key === 'ArrowUp') pitch = Math.max(-.6, pitch - .06); else if (e.key === 'ArrowDown') pitch = Math.min(.6, pitch + .06);
      else if (e.key === '+' || e.key === '=') dist = Math.max(3.2, dist - .3); else if (e.key === '-') dist = Math.min(8, dist + .3); else h = false;
      if (h) { e.preventDefault(); auto = false; sync(); draw(); }
    });
    function sync() { if (spinBtn) { spinBtn.setAttribute('aria-pressed', String(auto)); spinBtn.textContent = auto ? 'Auto-spin on' : 'Auto-spin off'; } }
    if (spinBtn) spinBtn.addEventListener('click', function () { auto = !auto; sync(); loop(); });
    if (resetBtn) resetBtn.addEventListener('click', function () { yaw = .5; pitch = .05; dist = 5.4; auto = true; sync(); draw(); loop(); });

    /* ---------- draw ---------- */
    function bind(m) { gl.bindBuffer(gl.ARRAY_BUFFER, m.vb); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.enableVertexAttribArray(A.aP); gl.vertexAttribPointer(A.aP, 3, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(A.aN); gl.vertexAttribPointer(A.aN, 3, gl.FLOAT, false, 32, 12); gl.enableVertexAttribArray(A.aT); gl.vertexAttribPointer(A.aT, 2, gl.FLOAT, false, 32, 24); }
    function put(p, scene, vp, t, cam) {
      var model = mul(scene, p.t(t)); gl.uniformMatrix4fv(U.uM, false, new Float32Array(model)); gl.uniformMatrix4fv(U.uMVP, false, new Float32Array(mul(vp, model)));
      gl.uniform3fv(U.uC, p.c); gl.uniform3fv(U.uE, p.e || [0, 0, 0]); gl.uniform1f(U.uA, p.a || 1); gl.uniform1f(U.uUseTex, p.tex ? 1 : 0); gl.uniform3fv(U.uCam, cam);
      bind(M[p.m]); gl.drawElements(gl.TRIANGLES, M[p.m].n, gl.UNSIGNED_SHORT, 0);
    }
    function draw() {
      var t = (performance.now() - t0) / 1000, w = cv.width, h = cv.height;
      gl.viewport(0, 0, w, h); gl.clearColor(0.04, 0.05, 0.16, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
      var float = motionOK() ? Math.sin(t * 1.4) * .05 : 0;
      var scene = mul(trans(0, float, 0), mul(rotX(pitch), rotY(yaw)));
      var vp = mul(persp(.85, w / h, .1, 30), trans(0, -.1, -dist)), cam = [0, 0, dist];
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uTex, 0);
      gl.disable(gl.BLEND); gl.depthMask(true);
      parts.forEach(function (p) { if (!p.tr) put(p, scene, vp, t, cam); });
      orbs.forEach(function (o) { var a = o.a + t * .6; put({ m: 'sph', c: GOLD, e: [.6, .5, .1], t: function () { return mul(trans(Math.cos(a) * o.r, o.y + Math.sin(t + o.a) * .1, Math.sin(a) * o.r), scl(o.s, o.s, o.s)); } }, mul(trans(0, float, 0), mul(rotX(pitch), ident())), vp, t, cam); });
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      parts.forEach(function (p) { if (p.tr) put(p, scene, vp, t, cam); });
      gl.depthMask(true);
    }
    function loop() {
      cancelAnimationFrame(raf); raf = 0;
      function f() {
        raf = 0; if (!visible || document.hidden) return;
        if (!drag && Math.abs(vy) > .0002) { yaw += vy; vy *= .94; }
        if (auto && motionOK()) yaw += .006;
        draw();
        if ((auto && motionOK()) || Math.abs(vy) > .0002 || motionOK()) raf = requestAnimationFrame(f);
      }
      raf = requestAnimationFrame(f);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) loop(); }, { threshold: 0.05 }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loop(); });
    document.addEventListener('kairo:settings', function () { draw(); loop(); });
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (fail) fail.hidden = false; });
    draw(); loop();
    window.KairoGL = { ok: true, draw: draw };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
