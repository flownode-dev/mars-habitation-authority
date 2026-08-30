/* =========================================================
   Mars Habitation Authority (MHA) — shared site behavior
   Injects header (seal + nav + live telemetry) and footer
   on every page. No build step, no framework.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     0. Site root detection
     GitHub Pages project sites are served from a subpath
     (https://<user>.github.io/<repo>/), so header/footer links
     must be relative to that subpath, not domain-absolute.
     We derive it from this script's own <script src> location —
     site.js always lives at the site root.
     --------------------------------------------------------- */

  var SITE_ROOT = (function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src") || "";
      var idx = src.indexOf("site.js");
      if (idx !== -1) return src.slice(0, idx);
    }
    return "./";
  })();

  var onSystemsPage = /\/systems\//.test(location.pathname);

  /* ---------------------------------------------------------
     1. Header / footer markup
     --------------------------------------------------------- */

  var headerHTML =
    '<header class="mha-header">' +
      '<div class="mha-header__top">' +
        '<a class="mha-seal" href="' + SITE_ROOT + '">' +
          '<span class="mha-seal__ring" aria-hidden="true">M</span>' +
          '<span class="mha-seal__text">' +
            '<span class="mha-seal__name">Mars Habitation Authority</span>' +
            '<span class="mha-seal__sub">Field Manual for Living on Mars</span>' +
          '</span>' +
        '</a>' +
        '<nav class="mha-nav" aria-label="Primary">' +
          '<a href="' + SITE_ROOT + '"' + (onSystemsPage ? "" : ' aria-current="page"') + '>Home</a>' +
          '<a href="' + SITE_ROOT + '#systems"' + (onSystemsPage ? ' aria-current="page"' : "") + '>Life-Support Systems</a>' +
          '<a href="' + SITE_ROOT + '#about">The Authority</a>' +
        '</nav>' +
      '</div>' +
      '<div class="mha-telemetry">' +
        '<div class="mha-telemetry__row tabular-nums" id="mha-telemetry-row" role="status" aria-label="Live Mars environmental telemetry">' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">MSD</span><span class="mha-telemetry__value" data-field="msd">&mdash;</span></span>' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">MTC</span><span class="mha-telemetry__value" data-field="mtc">&mdash;</span></span>' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">Surface Temp (typ.)</span><span class="mha-telemetry__value" data-field="temp">&mdash;</span></span>' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">Pressure (mean)</span><span class="mha-telemetry__value" data-field="pressure">&mdash;</span></span>' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">Radiation (surface avg)</span><span class="mha-telemetry__value" data-field="rad">&mdash;</span></span>' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">Dust Opacity &tau; (typ.)</span><span class="mha-telemetry__value" data-field="tau">&mdash;</span></span>' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">Comms Delay (one-way, est.)</span><span class="mha-telemetry__value" data-field="comms">&mdash;</span></span>' +
          '<span class="mha-telemetry__item"><span class="mha-telemetry__label">Gravity</span><span class="mha-telemetry__value" data-field="gravity">3.72 m/s&sup2; (0.38 g)</span></span>' +
        '</div>' +
      '</div>' +
    '</header>';

  var footerHTML =
    '<footer class="mha-footer">' +
      '<div class="wrap">' +
        '<div class="mha-footer__grid">' +
          '<div class="mha-footer__col">' +
            '<h4>Mars Habitation Authority</h4>' +
            'Field Manual for Living on Mars.<br>' +
            'For the next planet humanity lives on.' +
          '</div>' +
          '<div class="mha-footer__col">' +
            '<h4>Reference</h4>' +
            '<a href="' + SITE_ROOT + 'glossary/">Glossary</a>' +
            '<a href="' + SITE_ROOT + 'faq/">FAQ</a>' +
            '<a href="' + SITE_ROOT + 'hazards/">Hazard Reference</a>' +
          '</div>' +
          '<div class="mha-footer__col">' +
            '<h4>Authority</h4>' +
            '<a href="' + SITE_ROOT + 'about/">About the Authority</a>' +
            '<a href="' + SITE_ROOT + 'arrival/">Your First 100 Sols</a>' +
          '</div>' +
        '</div>' +
        '<div class="mha-punchline">' +
          'Note: there are currently no residents on Mars.' +
          '<div class="mha-punchline__meta">Established on the occasion of the public-market listing of a private spaceflight company (2026) &middot; Document status: system operational</div>' +
        '</div>' +
      '</div>' +
    '</footer>';

  function mountLayout() {
    var headerMount = document.getElementById("mha-header");
    var footerMount = document.getElementById("mha-footer");
    if (headerMount) headerMount.outerHTML = headerHTML;
    if (footerMount) footerMount.outerHTML = footerHTML;
  }

  /* ---------------------------------------------------------
     2. Mars Sol Date (MSD) / Coordinated Mars Time (MTC)
     Formula per MHA reference standard (Allison & McEwen, 2000).
     --------------------------------------------------------- */

  function marsTime() {
    var jdUT = Date.now() / 86400000 + 2440587.5;
    var jdTT = jdUT + (37 + 32.184) / 86400; // UTC -> TT (leap seconds + TAI offset)
    var dJ2000 = jdTT - 2451545.0;
    var msd = (dJ2000 - 4.5) / 1.0274912517 + 44796.0 - 0.0009626;
    var mtc = (24 * msd) % 24;
    if (mtc < 0) mtc += 24;
    return { msd: msd, mtc: mtc };
  }

  function formatMTC(mtc) {
    var totalSeconds = Math.round(mtc * 3600);
    var h = Math.floor(totalSeconds / 3600) % 24;
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    function pad(n) { return String(n).padStart(2, "0"); }
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  }

  /* ---------------------------------------------------------
     3. One-way comms delay
     Approximate heliocentric positions of Earth and Mars using
     published low-precision Keplerian mean-longitude elements
     (JPL, Standish 2006), circular-orbit approximation.
     --------------------------------------------------------- */

  var AU_LIGHT_SECONDS = 499.004784;

  var ELEMENTS = {
    earth: { a: 1.00000261, L0: 100.46457166, Lrate: 35999.37244981 },
    mars:  { a: 1.52371034, L0: -4.55343205,  Lrate: 19140.30268499 }
  };

  function centuriesSinceJ2000() {
    var jdUT = Date.now() / 86400000 + 2440587.5;
    return (jdUT - 2451545.0) / 36525;
  }

  function heliocentricXY(body, T) {
    var Ldeg = body.L0 + body.Lrate * T;
    var Lrad = (Ldeg % 360) * (Math.PI / 180);
    return { x: body.a * Math.cos(Lrad), y: body.a * Math.sin(Lrad) };
  }

  function oneWayCommsDelayMinutes() {
    var T = centuriesSinceJ2000();
    var e = heliocentricXY(ELEMENTS.earth, T);
    var m = heliocentricXY(ELEMENTS.mars, T);
    var dAU = Math.sqrt(Math.pow(e.x - m.x, 2) + Math.pow(e.y - m.y, 2));
    return (dAU * AU_LIGHT_SECONDS) / 60;
  }

  /* ---------------------------------------------------------
     4. Reference environmental figures (canonical, static)
     These are typical/reference values, not live sensor feed —
     the site has no orbital or surface telemetry source.
     --------------------------------------------------------- */

  var REFERENCE = {
    temp: "&minus;63&deg;C (range &minus;125 to +20&deg;C)",
    pressure: "0.61 kPa (0.6% of Earth)",
    rad: "0.7 mSv/sol (&asymp;250 mSv/yr)",
    tau: "0.3&ndash;0.9 (variable, dust-season dependent)"
  };

  /* ---------------------------------------------------------
     5. Tick loop
     --------------------------------------------------------- */

  function updateTelemetry() {
    var row = document.getElementById("mha-telemetry-row");
    if (!row) return;
    var t = marsTime();

    setField(row, "msd", Math.floor(t.msd).toLocaleString());
    setField(row, "mtc", formatMTC(t.mtc));
    setField(row, "temp", REFERENCE.temp);
    setField(row, "pressure", REFERENCE.pressure);
    setField(row, "rad", REFERENCE.rad);
    setField(row, "tau", REFERENCE.tau);
  }

  function updateComms() {
    var row = document.getElementById("mha-telemetry-row");
    if (!row) return;
    var minutes = oneWayCommsDelayMinutes();
    var m = Math.floor(minutes);
    var s = Math.round((minutes - m) * 60);
    if (s === 60) { m += 1; s = 0; }
    setField(row, "comms", m + "m " + s + "s");
  }

  function setField(row, field, html) {
    var el = row.querySelector('[data-field="' + field + '"]');
    if (el) el.innerHTML = html;
  }

  /* ---------------------------------------------------------
     6. Scroll reveal (respects prefers-reduced-motion)
     --------------------------------------------------------- */

  function initReveal() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var items = document.querySelectorAll(".mha-reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------
     7. Init
     --------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", function () {
    mountLayout();
    updateTelemetry();
    updateComms();
    setInterval(updateTelemetry, 1000);
    setInterval(updateComms, 60000);
    initReveal();
  });
})();
