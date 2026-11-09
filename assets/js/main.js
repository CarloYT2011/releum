/* Clan Releum — comportamiento de la interfaz */
(function () {
  "use strict";

  // Menú en móvil
  var btn = document.querySelector(".menu-btn");
  var menu = document.getElementById("menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var abierto = menu.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", String(abierto));
    });
  }

  // Aparición de secciones al hacer scroll
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("visible"); });
  }
})();

/* Cabezas 3D: las skins de los fundadores vienen incrustadas en la web
   (assets/img/skins). Como complemento, se consulta la skin real de cada jugador
   y solo se usa si su cara coincide con la incrustada; en caso contrario se descarta. */
(function () {
  "use strict";
  var FUENTES = ["https://mc-heads.net/skin/", "https://minotar.net/skin/"];

  function cargar(url) {
    return new Promise(function (ok, no) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { ok(img); };
      img.onerror = no;
      img.src = url;
    });
  }

  // Cara frontal (capa base + capa exterior) reducida a una cuadrícula de 4x4
  function firma(skin) {
    var c = document.createElement("canvas");
    c.width = c.height = 8;
    var x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.fillStyle = "#000";
    x.fillRect(0, 0, 8, 8);
    x.drawImage(skin, 8, 8, 8, 8, 0, 0, 8, 8);
    x.drawImage(skin, 40, 8, 8, 8, 0, 0, 8, 8);
    var d = x.getImageData(0, 0, 8, 8).data, r = [], bx, by, i, a, b;
    for (by = 0; by < 4; by++) for (bx = 0; bx < 4; bx++) for (i = 0; i < 3; i++) {
      var s = 0;
      for (a = 0; a < 2; a++) for (b = 0; b < 2; b++) s += d[((by * 2 + b) * 8 + bx * 2 + a) * 4 + i];
      r.push(s / 4);
    }
    return r;
  }

  function coincide(a, b) {
    var la = [], lb = [], i, dist = 0;
    for (i = 0; i < 16; i++) {
      la.push(.3 * a[i * 3] + .59 * a[i * 3 + 1] + .11 * a[i * 3 + 2]);
      lb.push(.3 * b[i * 3] + .59 * b[i * 3 + 1] + .11 * b[i * 3 + 2]);
    }
    for (i = 0; i < 48; i++) dist += Math.abs(a[i] - b[i]);
    var ma = la.reduce(function (s, v) { return s + v; }, 0) / 16;
    var mb = lb.reduce(function (s, v) { return s + v; }, 0) / 16;
    var cov = 0, va = 0, vb = 0;
    for (i = 0; i < 16; i++) {
      cov += (la[i] - ma) * (lb[i] - mb);
      va += Math.pow(la[i] - ma, 2);
      vb += Math.pow(lb[i] - mb, 2);
    }
    var corr = cov / Math.sqrt((va * vb) || 1);
    return corr > 0.75 && (dist / 48) < 45;
  }

  function intentar(cabeza, i) {
    if (i >= FUENTES.length) return;
    cargar(FUENTES[i] + encodeURIComponent(cabeza.dataset.jugador))
      .then(function (skin) {
        if (skin.naturalWidth !== 64) return;
        if (!coincide(firma(skin), JSON.parse(cabeza.dataset.ref))) return; // no coincide: se descarta
        var c = document.createElement("canvas");
        c.width = c.height = 64;
        c.getContext("2d").drawImage(skin, 0, 0);
        cabeza.style.setProperty("--skin", "url(" + c.toDataURL() + ")");
      })
      .catch(function () { intentar(cabeza, i + 1); });
  }

  document.querySelectorAll(".cabeza[data-jugador]").forEach(function (c) {
    try { intentar(c, 0); } catch (e) { /* se mantienen las skins incrustadas */ }
  });
})();
