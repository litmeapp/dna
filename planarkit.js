// ══════════════════════════════════════════════════════════════
// PlanarKit — Canvas 2D Reference Implementation
// Source of truth: iOS PlanarKit (Metal compute + point sprites)
// ══════════════════════════════════════════════════════════════
// Features: spring-damped particles, 5 field types (attract, outline,
// repulse, vortex, magnetic), displacement ripples, color effects
// (ring/bloom/noise), drag trail, per-field color, two-radius field
// model, delta-time normalization, node system (PlaneFieldAttachment),
// ambient color waves (ring/bloom/noise).
// ──────────────────────────────────────────────────────────────
(function(G) {
  'use strict';

  // ── Reduced Motion ──
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(e) { reducedMotion = e.matches; }); } catch(e) {}

  // ── PlanarKit Constants (PlaneScene.swift / PhysicsWorld.swift) ──
  var DOT_R = 1.5, SPACING = 21, SPRING = 0.03, DAMP = 0.88, RELAX = 0.02, TWO_PI = 6.283185;

  // ── 2D Value Noise (for flow field + noise color wave) ──
  var _p = new Uint8Array(512);
  (function() {
    var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,
      69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,
      203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,
      165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,
      92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
      89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,
      226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,
      182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,
      43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
      228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,
      49,192,214,31,181,199,106,157,4,184,156,180,254,132,243,215,121,176,127,78,114,
      115,66,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (var i = 0; i < 256; i++) _p[i] = _p[i + 256] = p[i % p.length];
  })();
  function noise2D(x, y) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    var xf = x - Math.floor(x), yf = y - Math.floor(y);
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = _p[X] + Y, b = _p[X + 1] + Y;
    return (_p[a] + u * (_p[b] - _p[a]) + v * ((_p[a+1] + u * (_p[b+1] - _p[a+1])) - (_p[a] + u * (_p[b] - _p[a])))) / 255;
  }

  // ── Shared Color State (from CSS tokens) ──
  var idleC = {r:26,g:26,b:24,a:0.05};
  var tapC  = {r:26,g:26,b:24,a:0.17};
  var fieldC= {r:26,g:26,b:24,a:0.30};
  var tintC = {r:232,g:100,b:32};
  // All 5 tint presets — read from CSS tokens, updated by syncColors()
  var tintOrange = {r:232,g:100,b:32};
  var tintCoral  = {r:224,g:82,b:72};
  var tintIndigo = {r:88,g:86,b:214};
  var tintTeal   = {r:44,g:168,b:152};
  var tintAmber  = {r:204,g:133,b:16};
  // Ambient palette = all tints at ~40% brightness (mixed toward idle base)
  var ambientPalette = [];
  function rebuildAmbient() {
    ambientPalette.length = 0;
    ambientPalette.push(tintOrange, tintCoral, tintIndigo, tintTeal, tintAmber);
  }
  rebuildAmbient();

  function parseC(s) {
    if (!s) return null;
    if (s.charAt(0) === '#') return {r:parseInt(s.slice(1,3),16), g:parseInt(s.slice(3,5),16), b:parseInt(s.slice(5,7),16), a:1};
    var m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\/\s]+([\d.]+))?\s*\)/);
    return m ? {r:+m[1], g:+m[2], b:+m[3], a:m[4] != null ? +m[4] : 1} : null;
  }

  function syncColors() {
    var s = getComputedStyle(document.documentElement);
    idleC  = parseC(s.getPropertyValue('--dotIdle').trim())  || idleC;
    tapC   = parseC(s.getPropertyValue('--dotTap').trim())   || tapC;
    fieldC = parseC(s.getPropertyValue('--dotField').trim()) || fieldC;
    tintC      = parseC(s.getPropertyValue('--tint').trim())       || tintC;
    tintOrange = parseC(s.getPropertyValue('--tint').trim())       || tintOrange;
    tintCoral  = parseC(s.getPropertyValue('--tintCoral').trim())  || tintCoral;
    tintIndigo = parseC(s.getPropertyValue('--tintIndigo').trim()) || tintIndigo;
    tintTeal   = parseC(s.getPropertyValue('--tintTeal').trim())   || tintTeal;
    tintAmber  = parseC(s.getPropertyValue('--tintAmber').trim())  || tintAmber;
    rebuildAmbient();
  }

  // ══════════════════════════════════════════
  // Scene
  // ══════════════════════════════════════════
  function Scene(cvs) {
    this.cvs = cvs;
    this.ctx = cvs.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.W = 0; this.H = 0;
    this.dots = []; this.cols = 0; this.rows = 0; this.offX = 0; this.offY = 0;
    this.ripples = [];
    this.colorEffects = [];
    this.fields = [];
    this.nodes = [];
    this.active = false;
    this.keepAlive = false; // prevent auto-settle (for ambient waves)
    this.idleAlpha = null; // per-scene idle alpha override (null = use global idleC.a)
    this.dotRadius = null; // per-scene dot radius override (null = use global DOT_R)
    this.totalTime = 0;
  }

  // ── Grid (matches Renderer.buildGrid) ──
  Scene.prototype.buildGrid = function() {
    var ov = Math.max(SPACING * 3, 60);
    var tw = this.W + 2 * ov, th = this.H + 2 * ov;
    this.cols = Math.max(1, Math.floor(tw / SPACING) + 1);
    this.rows = Math.max(1, Math.floor(th / SPACING) + 1);
    this.offX = -ov + (tw - (this.cols - 1) * SPACING) / 2;
    this.offY = -ov + (th - (this.rows - 1) * SPACING) / 2;
    this.dots = [];
    for (var r = 0; r < this.rows; r++)
      for (var c = 0; c < this.cols; c++) {
        var hx = this.offX + c * SPACING, hy = this.offY + r * SPACING;
        this.dots.push({hx:hx, hy:hy, x:hx, y:hy, vx:0, vy:0, row:r, col:c});
      }
  };

  Scene.prototype.dotAt = function(r, c) {
    return (r < 0 || r >= this.rows || c < 0 || c >= this.cols) ? null : this.dots[r * this.cols + c];
  };

  Scene.prototype.resize = function() {
    var r = this.cvs.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    this.cvs.width = Math.round(this.W * this.dpr);
    this.cvs.height = Math.round(this.H * this.dpr);
    this.buildGrid();
  };

  // ── Ripple (with optional color + stagger delay) ──
  Scene.prototype.addRipple = function(x, y, str, spd, w, dur, color, delay) {
    this.ripples.push({x:x, y:y, radius:0, str:str||4, spd:spd||8, w:w||20, dur:dur||2, life:-(delay||0), color:color||null});
    if (color) this.addColorEffect(x, y, 'ring', color, (spd||8) * 0.55, (w||20) * 6, dur || 2, delay);
  };

  // ── Color effect (ring / bloom / noise) ──
  Scene.prototype.addColorEffect = function(x, y, type, color, spd, w, dur, delay) {
    this.colorEffects.push({x:x, y:y, type:type||'ring', color:color||tintC, spd:spd||2, w:w||80, dur:dur||3, life:-(delay||0), radius:0});
  };

  // ── Field (two-radius model + per-field color) ──
  Scene.prototype.addField = function(x, y, type, str, radius, held, fieldRadius, innerFalloff, fieldColor) {
    var f = {x:x, y:y, type:type||'attract', str:str||0.8, radius:radius||0,
      fieldRadius: fieldRadius != null ? fieldRadius : (radius || 160),
      innerFalloff: innerFalloff != null ? innerFalloff : 2,
      fieldColor: fieldColor || null, held: held !== false, life: 0};
    this.fields.push(f);
    return f;
  };

  // ── Node with attached field (PlaneFieldAttachment) ──
  Scene.prototype.addNode = function(x, y, shape, opts) {
    opts = opts || {};
    var nd = {x:x, y:y, shape:shape||'circle', w:opts.w||36, h:opts.h||36,
      cornerRadius:opts.cornerRadius||8,
      color:opts.color||{r:tintC.r, g:tintC.g, b:tintC.b, a:0.12},
      label:opts.label||null, draggable:opts.draggable!==false, visible:true, field:null};
    nd.field = this.addField(x, y, opts.fieldType||'attract', opts.fieldStrength||0.5,
      Math.max(nd.w, nd.h) * 0.5, true, opts.fieldRadius||100, opts.innerFalloff||1, opts.fieldColor||tintC);
    this.nodes.push(nd);
    return nd;
  };

  // ── Physics step (delta-time normalized) ──
  Scene.prototype.step = function(dt) {
    var dtF = dt * 60, dampPow = Math.pow(DAMP, dtF);
    var rips = this.ripples, ces = this.colorEffects, flds = this.fields, dots = this.dots;
    var i, d, f, dx, dy, dist, dist2, t, fade, force;
    this.totalTime += dt;

    // Advance ripples
    for (i = rips.length - 1; i >= 0; i--) {
      rips[i].life += dt;
      if (rips[i].life >= 0) rips[i].radius += rips[i].spd * dtF;
      if (rips[i].life >= rips[i].dur) rips.splice(i, 1);
    }
    // Advance color effects
    for (i = ces.length - 1; i >= 0; i--) {
      ces[i].life += dt;
      if (ces[i].life >= 0) ces[i].radius += ces[i].spd * dtF;
      if (ces[i].life >= ces[i].dur) ces.splice(i, 1);
    }
    // Advance released fields
    for (i = flds.length - 1; i >= 0; i--) {
      if (!flds[i].held) flds[i].life += dt;
      if (!flds[i].held && flds[i].life >= 0.6) flds.splice(i, 1);
    }
    // Sync node → field positions
    for (i = 0; i < this.nodes.length; i++) {
      var nd = this.nodes[i];
      if (nd.field) { nd.field.x = nd.x; nd.field.y = nd.y; }
    }

    var hasEffects = rips.length > 0 || flds.length > 0 || ces.length > 0;

    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      d.vx += (d.hx - d.x) * SPRING * dtF;
      d.vy += (d.hy - d.y) * SPRING * dtF;

      // Field forces — two-radius model
      for (var fi = 0; fi < flds.length; fi++) {
        f = flds[fi]; dx = f.x - d.x; dy = f.y - d.y; dist2 = dx * dx + dy * dy;
        var totalR = f.radius + f.fieldRadius;
        if (dist2 >= totalR * totalR || dist2 < 0.25) continue;
        dist = Math.sqrt(dist2);
        fade = f.held ? 1 : Math.max(0, 1 - f.life / 0.6);
        if (dist <= f.radius && f.radius > 0.1) t = Math.pow(1 - dist / f.radius, f.innerFalloff);
        else if (f.radius < 0.1) t = Math.max(0, 1 - dist / f.fieldRadius);
        else t = Math.max(0, 1 - (dist - f.radius) / f.fieldRadius);
        var ff = f.str * t * fade * dtF;

        if (f.type === 'attract') { d.vx += (dx/dist)*ff; d.vy += (dy/dist)*ff; }
        else if (f.type === 'repulse') { d.vx -= (dx/dist)*ff; d.vy -= (dy/dist)*ff; }
        else if (f.type === 'vortex') { d.vx += (-dy/dist)*ff; d.vy += (dx/dist)*ff; }
        else if (f.type === 'outline') {
          var rR = Math.max(f.radius, f.fieldRadius * 0.4);
          if (dist > 0.5) {
            var nx = f.x-(dx/dist)*rR, ny = f.y-(dy/dist)*rR, tox = nx-d.x, toy = ny-d.y;
            var toD = Math.sqrt(tox*tox + toy*toy);
            if (toD > 0.5 && toD < f.fieldRadius) {
              var rT = 1 - toD / f.fieldRadius;
              force = f.str * rT * rT * fade * dtF;
              d.vx += (tox/toD)*force; d.vy += (toy/toD)*force;
            }
          }
        }
        else if (f.type === 'magnetic') {
          var spd = Math.sqrt(d.vx*d.vx + d.vy*d.vy);
          if (spd > 0.1) { var pvx=d.vx, pvy=d.vy; d.vx += (-pvy/spd)*ff; d.vy += (pvx/spd)*ff; }
          else { d.vx += (dx/dist)*ff*0.15; d.vy += (dy/dist)*ff*0.15; }
        }
      }

      // Ripples (skip stagger-delayed)
      for (var ri = 0; ri < rips.length; ri++) {
        var rp = rips[ri]; if (rp.life < 0) continue;
        dx = d.x-rp.x; dy = d.y-rp.y; dist = Math.sqrt(dx*dx + dy*dy);
        var rd = Math.abs(dist - rp.radius);
        if (rd < rp.w && dist > 0.5) {
          fade = 1 - rp.life / rp.dur; var prox = 1 - rd / rp.w;
          force = rp.str * prox*prox * fade*fade * dtF;
          d.vx += (dx/dist)*force; d.vy += (dy/dist)*force;
        }
      }

      // Relaxation
      var up = this.dotAt(d.row-1,d.col), dn = this.dotAt(d.row+1,d.col);
      var lt = this.dotAt(d.row,d.col-1), rt = this.dotAt(d.row,d.col+1);
      var cx = 0, cy = 0, n = 0;
      if (up) { cx+=up.x; cy+=up.y; n++; } if (dn) { cx+=dn.x; cy+=dn.y; n++; }
      if (lt) { cx+=lt.x; cy+=lt.y; n++; } if (rt) { cx+=rt.x; cy+=rt.y; n++; }
      if (n) { d.vx += (cx/n - d.x) * RELAX * dtF; d.vy += (cy/n - d.y) * RELAX * dtF; }

      d.vx *= dampPow; d.vy *= dampPow; d.x += d.vx; d.y += d.vy;
    }
    return hasEffects;
  };

  // ── Render: dots + color effects + nodes ──
  Scene.prototype.render = function() {
    var ctx = this.ctx, W = this.W, H = this.H, dots = this.dots;
    var rips = this.ripples, flds = this.fields, ces = this.colorEffects, nodes = this.nodes;
    ctx.save(); ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    var hasEffects = rips.length > 0 || flds.length > 0 || ces.length > 0;
    var i, d;
    var iA = this.idleAlpha != null ? this.idleAlpha : idleC.a;
    var dR = this.dotRadius != null ? this.dotRadius : DOT_R;

    if (!hasEffects) {
      ctx.fillStyle = 'rgba('+idleC.r+','+idleC.g+','+idleC.b+','+iA+')';
      ctx.beginPath();
      for (i = 0; i < dots.length; i++) {
        d = dots[i];
        if (d.x < -dR || d.x > W+dR || d.y < -dR || d.y > H+dR) continue;
        ctx.moveTo(d.x+dR, d.y); ctx.arc(d.x, d.y, dR, 0, TWO_PI);
      }
      ctx.fill();
    } else {
      for (i = 0; i < dots.length; i++) {
        d = dots[i];
        if (d.x < -dR || d.x > W+dR || d.y < -dR || d.y > H+dR) continue;
        var a = iA, cr = idleC.r, cg = idleC.g, cb = idleC.b;

        // Field color (per-field fieldColor)
        for (var fi = 0; fi < flds.length; fi++) {
          var f = flds[fi], fdx = f.x-d.x, fdy = f.y-d.y, fd2 = fdx*fdx+fdy*fdy, fTR = f.radius+f.fieldRadius;
          if (fd2 < fTR*fTR) {
            var fd = Math.sqrt(fd2), ff = f.held?1:Math.max(0,1-f.life/0.6);
            var ft = Math.pow(Math.max(0, 1-fd/fTR), 2) * ff;
            a = a + (fieldC.a-a)*ft; var fc = f.fieldColor||tintC;
            cr = cr+(fc.r-cr)*ft; cg = cg+(fc.g-cg)*ft; cb = cb+(fc.b-cb)*ft;
          }
        }
        // Ripple color
        for (var ri = 0; ri < rips.length; ri++) {
          var rp = rips[ri]; if (rp.life < 0) continue;
          var rdx=d.x-rp.x, rdy=d.y-rp.y, rdist=Math.sqrt(rdx*rdx+rdy*rdy);
          var rband = Math.abs(rdist-rp.radius), rbw = rp.w*2.5;
          if (rband < rbw) {
            var rf = 1-rp.life/rp.dur, rp2 = 1-rband/rbw, blend = rp2*rf;
            a = Math.max(a, tapC.a*blend);
            var rc = rp.color||tintC;
            cr = cr+(rc.r-cr)*blend*0.5; cg = cg+(rc.g-cg)*blend*0.5; cb = cb+(rc.b-cb)*blend*0.5;
          }
        }
        // Color effects (ring/bloom/noise)
        for (var ci = 0; ci < ces.length; ci++) {
          var ce = ces[ci]; if (ce.life < 0) continue;
          var cdx=d.x-ce.x, cdy=d.y-ce.y, cdist=Math.sqrt(cdx*cdx+cdy*cdy), bl = 0;
          if (ce.type === 'ring') { var cb2=Math.abs(cdist-ce.radius); if(cb2<ce.w){var cp=1-cb2/ce.w; bl=cp*cp*(1-ce.life/ce.dur);} }
          else if (ce.type === 'bloom') { if(cdist<ce.radius){var bp=1-cdist/ce.radius; bl=bp*bp*(1-ce.life/ce.dur);} }
          else if (ce.type === 'noise') { if(cdist<ce.radius){ bl=noise2D(d.x*0.02+this.totalTime*0.5,d.y*0.02)*(1-cdist/ce.radius)*(1-ce.life/ce.dur);} }
          if (bl > 0.01) { a=a+(fieldC.a-a)*bl*0.5; cr=cr+(ce.color.r-cr)*bl; cg=cg+(ce.color.g-cg)*bl; cb=cb+(ce.color.b-cb)*bl; }
        }

        ctx.fillStyle = 'rgba('+Math.round(cr)+','+Math.round(cg)+','+Math.round(cb)+','+a+')';
        ctx.beginPath(); ctx.arc(d.x, d.y, dR, 0, TWO_PI); ctx.fill();
      }
    }

    // Render nodes
    for (i = 0; i < nodes.length; i++) {
      var nd = nodes[i]; if (!nd.visible) continue;
      ctx.save(); ctx.translate(nd.x, nd.y);
      if (nd.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, nd.w/2, 0, TWO_PI); }
      else {
        var hw=nd.w/2, hh=nd.h/2, cr2=Math.min(nd.cornerRadius, hw, hh);
        ctx.beginPath(); ctx.moveTo(-hw+cr2,-hh); ctx.lineTo(hw-cr2,-hh);
        ctx.quadraticCurveTo(hw,-hh,hw,-hh+cr2); ctx.lineTo(hw,hh-cr2);
        ctx.quadraticCurveTo(hw,hh,hw-cr2,hh); ctx.lineTo(-hw+cr2,hh);
        ctx.quadraticCurveTo(-hw,hh,-hw,hh-cr2); ctx.lineTo(-hw,-hh+cr2);
        ctx.quadraticCurveTo(-hw,-hh,-hw+cr2,-hh); ctx.closePath();
      }
      ctx.fillStyle = 'rgba('+nd.color.r+','+nd.color.g+','+nd.color.b+','+(nd.color.a||0.12)+')';
      ctx.fill();
      ctx.strokeStyle = 'rgba('+nd.color.r+','+nd.color.g+','+nd.color.b+','+Math.min((nd.color.a||0.12)*2.5,0.4)+')';
      ctx.lineWidth = 1; ctx.stroke();
      if (nd.label) {
        ctx.fillStyle = 'rgba('+nd.color.r+','+nd.color.g+','+nd.color.b+',0.8)';
        ctx.font = '600 9px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(nd.label, 0, 0);
      }
      ctx.restore();
    }
    ctx.restore();
  };

  // ══════════════════════════════════════════
  // Global Animation Loop (shared across all scenes)
  // ══════════════════════════════════════════
  var allScenes = [], looping = false, lastTick = 0;

  function tick(ts) {
    var dt = lastTick ? Math.min(Math.max(ts - lastTick, 8.33), 50) / 1000 : (1/60);
    lastTick = ts;
    var any = false;
    for (var i = 0; i < allScenes.length; i++) {
      var sc = allScenes[i]; if (!sc.active) continue;
      var hasEff = sc.step(dt); sc.render();
      if (hasEff) { any = true; continue; }
      var maxV = 0;
      for (var j = 0; j < sc.dots.length; j += 8) {
        var v2 = sc.dots[j].vx*sc.dots[j].vx + sc.dots[j].vy*sc.dots[j].vy;
        if (v2 > maxV) maxV = v2;
      }
      if (maxV > 0.00001 || sc.keepAlive) any = true; else sc.active = false;
    }
    if (any) requestAnimationFrame(tick); else { looping = false; lastTick = 0; }
  }

  function wake(sc) {
    sc.active = true;
    if (reducedMotion) { sc.render(); sc.active = false; return; }
    if (!looping) { looping = true; requestAnimationFrame(tick); }
  }

  // ══════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════

  // Field color presets — mapped to tint palette tokens
  function fieldColorMap() {
    return {
      attract: tintC,
      repulse: tintCoral,
      vortex:  tintIndigo,
      magnetic: tintTeal,
      outline: tintAmber
    };
  }

  var fieldStrengths = {attract:0.8, repulse:1.5, vortex:1.2, outline:1.0, magnetic:1.0};

  function strengthFor(type) { return fieldStrengths[type] || 0.8; }
  function colorFor(type) { return fieldColorMap()[type] || tintC; }

  /**
   * Create a PlanarKit scene on a canvas element.
   * @param {HTMLCanvasElement} canvas
   * @returns {Scene}
   */
  function create(canvas) {
    var sc = new Scene(canvas);
    allScenes.push(sc);
    return sc;
  }

  /**
   * Create a background PlanarKit scene with auto hover field.
   * Canvas should have pointer-events:none; events tracked on parent.
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [opts] - Ambient options
   * @param {boolean} [opts.ambient=true] - Enable ambient color waves
   * @param {number} [opts.ambientInterval=8] - Average seconds between ambient waves
   * @returns {Scene}
   */
  function background(canvas, opts) {
    opts = opts || {};
    var sc = create(canvas);
    var parent = canvas.parentElement;
    var hoverField = null;
    var ambientTimer = 0, ambientNext = 3 + Math.random() * 7;
    var doAmbient = opts.ambient !== false;
    var ambientAvg = opts.ambientInterval || 8;

    // Hover field — tracked on parent (canvas has pointer-events:none)
    function pos(e) { var r = canvas.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; }
    parent.addEventListener('mouseenter', function(e) {
      var p = pos(e);
      hoverField = sc.addField(p.x, p.y, 'attract', 0.4, 0, true, 160, 0.3, null);
      wake(sc);
    });
    parent.addEventListener('mousemove', function(e) {
      if (hoverField) { var p = pos(e); hoverField.x = p.x; hoverField.y = p.y; }
      wake(sc);
    });
    parent.addEventListener('mouseleave', function() {
      if (hoverField) { hoverField.held = false; hoverField.life = 0; hoverField = null; }
    });

    // Keep alive for ambient waves
    if (doAmbient) sc.keepAlive = true;

    // Ambient color waves
    if (doAmbient) {
      var baseStep = sc.step.bind(sc);
      sc.step = function(dt) {
        ambientTimer += dt;
        if (ambientTimer >= ambientNext) {
          ambientTimer = 0; ambientNext = ambientAvg * 0.5 + Math.random() * ambientAvg;
          var ax = sc.W * 0.15 + Math.random() * sc.W * 0.7;
          var ay = sc.H * 0.15 + Math.random() * sc.H * 0.7;
          var ac = ambientPalette[Math.floor(Math.random() * ambientPalette.length)];
          sc.addColorEffect(ax, ay, Math.random() > 0.5 ? 'bloom' : 'ring', ac, 2.5, Math.random()>0.5?200:120, 5);
        }
        return baseStep(dt);
      };
    }

    // Visibility
    var visible = false;
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        visible = entry.isIntersecting;
        if (visible) { syncColors(); sc.resize(); sc.render(); wake(sc); }
      });
    }, {threshold: 0.05});
    obs.observe(parent);

    // Resize
    function onResize() { sc.resize(); if (visible) { sc.render(); wake(sc); } }
    window.addEventListener('resize', onResize);
    sc.resize();

    return sc;
  }

  // Theme / tint reactivity (auto-installed once)
  var themeObsInstalled = false;
  function installThemeObs() {
    if (themeObsInstalled) return;
    themeObsInstalled = true;
    new MutationObserver(function() {
      syncColors();
      allScenes.forEach(function(sc) { if (sc.active) sc.render(); });
    }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme', 'style']});
  }

  // ══════════════════════════════════════════
  // Export
  // ══════════════════════════════════════════
  G.PlanarKit = {
    Scene: Scene,
    create: create,
    background: background,
    wake: wake,
    syncColors: syncColors,
    installThemeObs: installThemeObs,
    strengthFor: strengthFor,
    colorFor: colorFor,
    ambientPalette: ambientPalette,
    // Expose constants for reference
    DOT_RADIUS: DOT_R,
    SPACING: SPACING,
    SPRING: SPRING,
    DAMPING: DAMP,
    RELAXATION: RELAX
  };

})(window);
