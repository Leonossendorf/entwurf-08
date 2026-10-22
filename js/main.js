/* Tischlerei Nacke – Entwurf. Zollstock, Projekte, Lightbox, Anfrage. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------------- Zollstock ----------------
     Ein Glied ist 200 mm lang (1 Einheit = 1 mm), die Nieten sitzen 200 mm auseinander.
     Glied k zeigt die Zentimeter k*20 bis k*20+20. */
  var L = 200, B = 22;

  function glied(k, opts) {
    var g = el("g", { "class": "glied" });
    var koerper = el("g", { filter: "url(#schatten)" }, g);
    el("rect", { x: -9, y: -B / 2, width: L + 18, height: B, rx: 2.2, fill: "url(#holzlicht)", filter: "url(#maserung)" }, koerper);
    el("rect", { x: -9, y: -B / 2, width: L + 18, height: B, rx: 2.2, fill: "none", stroke: "#a77d45", "stroke-width": 0.8, opacity: 0.8 }, koerper);
    el("line", { x1: -8, y1: -B / 2 + 0.9, x2: L + 8, y2: -B / 2 + 0.9, stroke: "#fff6dc", "stroke-width": 0.9, opacity: 0.8 }, koerper);
    var d = "";
    for (var mm = 0; mm <= L; mm += 1) {
      var h = mm % 10 === 0 ? 6.5 : mm % 5 === 0 ? 4.6 : 2.6;
      d += "M" + mm + " " + (-B / 2) + "v" + h;
      d += "M" + mm + " " + (B / 2) + "v" + (-h);
    }
    el("path", { d: d, stroke: "#1d1712", "stroke-width": 0.45, fill: "none" }, g);
    var schritt = opts.dicht ? 1 : 2;
    for (var cm = schritt; cm < 20; cm += schritt) {
      var zahl = k * 20 + cm;
      var rot = zahl % 10 === 0;
      var t = el("text", {
        x: cm * 10, y: rot ? 3.9 : 3.1, "text-anchor": "middle",
        "font-family": "Oswald, Arial Narrow, sans-serif", "font-size": rot ? 11 : 8.2, "font-weight": rot ? 600 : 500,
        fill: rot ? "#b8322a" : "#1d1712"
      }, g);
      t.textContent = zahl;
    }
    // Endzahl des Glieds (z. B. 20, 40 …) sitzt direkt am Gelenk wie beim echten Zollstock
    var end = el("text", { x: L - 7, y: 3.9, "text-anchor": "middle", "font-family": "Oswald, Arial Narrow, sans-serif", "font-size": 11, "font-weight": 600, fill: "#b8322a" }, g);
    end.textContent = (k + 1) * 20;
    [0, L].forEach(function (x) {
      el("circle", { cx: x, cy: 0, r: 3.6, fill: "url(#niete)", stroke: "#6b4e17", "stroke-width": 0.5 }, g);
      el("circle", { cx: x - 0.8, cy: -0.8, r: 0.9, fill: "#fff8d8", opacity: 0.8 }, g);
    });
    return g;
  }

  // Kette: Startpunkt, Grundwinkel und relative Gelenkwinkel (Grad)
  function lege(glieder, start, rel) {
    var x = start[0], y = start[1], a = 0;
    for (var i = 0; i < glieder.length; i++) {
      a += rel[i];
      glieder[i].setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") rotate(" + a.toFixed(2) + ")");
      var r = a * Math.PI / 180;
      x += L * Math.cos(r);
      y += L * Math.sin(r);
    }
  }

  function zollstock(svg, n, start, opts) {
    var gl = [];
    for (var k = 0; k < n; k++) { gl.push(glied(k, opts || {})); }
    for (var j = 0; j < n; j++) svg.appendChild(gl[j]);
    return {
      glieder: gl,
      jetzt: null,
      setze: function (rel) { this.jetzt = rel.slice(); lege(gl, start, rel); },
      bewege: function (ziel, dauer, fertig) {
        var self = this, von = this.jetzt.slice();
        if (ruhig || !dauer) { self.setze(ziel); if (fertig) fertig(); return; }
        var t0 = null;
        function schritt(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dauer);
          var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          var rel = von.map(function (v, i) { return v + (ziel[i] - v) * e; });
          self.setze(rel);
          if (p < 1) requestAnimationFrame(schritt); else if (fertig) fertig();
        }
        requestAnimationFrame(schritt);
      }
    };
  }

  // Treppenform: Auftritt nach rechts, Steigung nach oben
  var TREPPE = [0, -90, 90, -90, 90, -90];
  function gefaltet(n, offen) {
    var r = [];
    for (var i = 0; i < n; i++) {
      if (i < offen) r.push(TREPPE[i]);
      else r.push((i - offen) % 2 === 0 ? 180 : -180);
    }
    if (offen === 0) r[0] = 0;
    return r;
  }

  function sichtbar(elm, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: 0.35 });
    io.observe(elm);
  }

  // Hero: Zollstock klappt sich einmal ruhig zur Treppe auf
  var heroSvg = document.querySelector('[data-zs="treppe3"]');
  if (heroSvg) {
    var zh = zollstock(heroSvg, 5, [60, 470]);
    zh.setze(gefaltet(5, 1));
    sichtbar(heroSvg, function () {
      setTimeout(function () { zh.bewege(TREPPE.slice(0, 5), 1800); }, 350);
    });
  }

  // Band: gerader Zollstock
  var band = document.querySelector('[data-zs="gerade"]');
  if (band) {
    var zg = zollstock(band, 5, [20, 20], { dicht: true });
    zg.setze([0, 0, 0, 0, 0]);
  }

  // Anfrage: mit jeder Stufe klappt ein Treppenpaar mehr auf
  var stufenSvg = document.querySelector('[data-zs="stufen"]');
  var zs = null;
  var LABELS = ["Was soll entstehen?", "Ein paar Eckdaten", "Wie erreichen wir Sie?"];
  var labelEls = [];
  if (stufenSvg) {
    stufenSvg.setAttribute("viewBox", "0 0 800 640");
    zs = zollstock(stufenSvg, 6, [170, 610]);
    zs.setze(gefaltet(6, 2));
    LABELS.forEach(function (txt, i) {
      var tx = el("text", {
        x: 170 + L * (i + 1) - 26, y: 610 - i * L - 28, "text-anchor": "end",
        "class": "stufen-label" + (i === 0 ? " an" : "")
      }, stufenSvg);
      tx.textContent = (i + 1) + "  " + txt;
      labelEls.push(tx);
    });
  }
  function zeigeStufe(s, fertig) {
    if (zs) zs.bewege(gefaltet(6, Math.min(6, s * 2)), 1100);
    labelEls.forEach(function (t, i) {
      t.setAttribute("class", "stufen-label" + (fertig || i < s - 1 ? " erledigt" : i === s - 1 ? " an" : ""));
    });
  }

  /* ---------------- Projekte ---------------- */
  var P = [
    { id: "eichentreppe", titel: "Eichentreppe", info: "Stufen aus Eiche, Geländer aus Glas", n: 4, f: "treppen", cls: "gross" },
    { id: "altbau", titel: "Treppe im Altbau", info: "Holzstufen an der Backsteinwand", n: 6, f: "treppen" },
    { id: "gaestewc", titel: "Gäste-WC", info: "Waschtisch auf Baumkante", n: 5, f: "innen", cls: "gross" },
    { id: "einbauschrank", titel: "Weißer Einbauschrank", info: "Passgenau unter der Treppe", n: 5, f: "innen" },
    { id: "gelaender", titel: "Treppengeländer", info: "Holzgeländer, gerade und gewendelt", n: 7, f: "treppen" },
    { id: "bad", titel: "Hochglanz Bad", info: "Weiße Fronten, viel Licht", n: 6, f: "innen" },
    { id: "treppe", titel: "Weitere Treppen", info: "Holz, auch mit Beton, Glas oder Stein", n: 13, f: "treppen", cls: "gross breit", titelbild: 3 },
    { id: "moebel", titel: "Unikate und Möbel", info: "Tische, Hocker, Schalen, Schränke", n: 11, f: "moebel", cls: "gross", titelbild: 3 },
    { id: "kleiderschrank", titel: "Kleiderschrank mit Bett", info: "Offener Schrank und Bett aus einem Guss", n: 5, f: "moebel", cls: "gross" }
  ];
  var raster = document.getElementById("projektRaster");
  if (raster) {
    P.forEach(function (p) {
      var b = document.createElement("button");
      b.className = "projekt" + (p.cls ? " " + p.cls : "");
      b.type = "button";
      b.dataset.f = p.f;
      b.setAttribute("aria-label", p.titel + ", " + p.n + " Fotos ansehen");
      b.innerHTML = '<img src="img/' + p.id + '-' + (p.titelbild || 1) + '-k.jpg" alt="" loading="lazy">' +
        '<span class="projekt-anzahl">' + p.n + ' Fotos</span>' +
        '<span class="projekt-info"><b>' + p.titel + '</b><span>' + p.info + '</span></span>';
      b.addEventListener("click", function () { oeffne(p, (p.titelbild || 1) - 1); });
      raster.appendChild(b);
    });
  }
  function filtere(f) {
    document.querySelectorAll(".filter button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.f === f ? "true" : "false"); });
    document.querySelectorAll(".projekt").forEach(function (k) { k.classList.toggle("weg", f !== "alle" && k.dataset.f !== f); });
  }
  document.querySelectorAll(".filter button").forEach(function (b) {
    b.addEventListener("click", function () { filtere(b.dataset.f); });
  });
  document.querySelectorAll("[data-filter]").forEach(function (a) {
    a.addEventListener("click", function () { filtere(a.dataset.filter); });
  });

  /* ---------------- Lightbox ---------------- */
  var lb = document.getElementById("lightbox"), lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
  var akt = null, idx = 0, zuletzt = null;
  function zeige() {
    lbImg.src = "img/" + akt.id + "-" + (idx + 1) + ".jpg";
    lbImg.alt = akt.titel + ", Foto " + (idx + 1);
    lbCap.textContent = akt.titel + " · " + (idx + 1) + " / " + akt.n;
  }
  function oeffne(p, i) { zuletzt = document.activeElement; akt = p; idx = i; zeige(); lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb-zu").focus(); }
  function schliesse() { lb.hidden = true; document.body.style.overflow = ""; if (zuletzt) zuletzt.focus(); }
  function blaettern(d) { idx = (idx + d + akt.n) % akt.n; zeige(); }
  lb.querySelector(".lb-zu").addEventListener("click", schliesse);
  lb.querySelector(".lb-links").addEventListener("click", function () { blaettern(-1); });
  lb.querySelector(".lb-rechts").addEventListener("click", function () { blaettern(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) schliesse(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") schliesse();
    if (e.key === "ArrowLeft") blaettern(-1);
    if (e.key === "ArrowRight") blaettern(1);
  });
  var tx0 = null;
  lb.addEventListener("touchstart", function (e) { tx0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (tx0 === null) return;
    var dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 40) blaettern(dx < 0 ? 1 : -1);
    tx0 = null;
  });

  /* ---------------- Anfrage ---------------- */
  var form = document.getElementById("formular");
  if (form) {
    var stufen = form.querySelectorAll(".stufe"), s = 1;
    function geh(n) {
      stufen.forEach(function (f) { f.classList.toggle("aktiv", +f.dataset.stufe === n); });
      s = n;
      zeigeStufe(n);
      var alt = form.querySelector(".fehlt"); if (alt) alt.remove();
    }
    function fehlt(msg) {
      var alt = form.querySelector(".fehlt"); if (alt) alt.remove();
      var p = document.createElement("p"); p.className = "fehlt"; p.textContent = msg;
      form.querySelector(".stufe.aktiv .stufe-nav").before(p);
    }
    form.querySelectorAll(".weiter").forEach(function (b) {
      b.addEventListener("click", function () {
        if (s === 1 && !form.querySelector('input[name="was"]:checked')) { fehlt("Bitte wählen Sie aus, was entstehen soll."); return; }
        geh(s + 1);
        form.scrollIntoView({ behavior: ruhig ? "auto" : "smooth", block: "start" });
      });
    });
    form.querySelectorAll(".zurueck").forEach(function (b) { b.addEventListener("click", function () { geh(s - 1); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.name.value.trim() || !form.tel.value.trim()) { fehlt("Bitte Name und Telefonnummer angeben, damit wir zurückrufen können."); return; }
      var fd = new FormData(form), dl = document.getElementById("zusammenfassung");
      var felder = [["was", "Projekt"], ["wo", "Wo"], ["holz", "Holz"], ["masse", "Maße"], ["wann", "Start"], ["name", "Name"], ["tel", "Telefon"], ["mail", "E-Mail"], ["text", "Idee"]];
      dl.innerHTML = "";
      felder.forEach(function (f) {
        var v = fd.get(f[0]);
        if (v && String(v).trim()) {
          var dt = document.createElement("dt"); dt.textContent = f[1];
          var dd = document.createElement("dd"); dd.textContent = v;
          dl.appendChild(dt); dl.appendChild(dd);
        }
      });
      var fotos = form.foto.files.length;
      if (fotos) { var dt2 = document.createElement("dt"); dt2.textContent = "Fotos"; var dd2 = document.createElement("dd"); dd2.textContent = fotos + " angehängt"; dl.appendChild(dt2); dl.appendChild(dd2); }
      stufen.forEach(function (f) { f.classList.remove("aktiv"); });
      document.getElementById("fertig").hidden = false;
      zeigeStufe(3, true);
    });
    var dn = document.getElementById("dateiName");
    form.foto.addEventListener("change", function () {
      var n = form.foto.files.length;
      dn.textContent = n ? (n === 1 ? form.foto.files[0].name : n + " Fotos gewählt") : "noch kein Foto gewählt";
    });
    document.getElementById("neu").addEventListener("click", function () {
      form.reset(); dn.textContent = "noch kein Foto gewählt"; document.getElementById("fertig").hidden = true; geh(1);
    });
  }
})();
