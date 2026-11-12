/*
  Shopfloor-Status · vereinfachte Einstellungen
  - Ein Reiter "Wer ist zuständig?": Baum Werk → Hauptabteilung → Betrieb → Schicht → Kostenstelle,
    pro Box eine (oder mehrere) Personen. Kostenstellen (Level 0) melden nur, ohne Person.
  - "Personen", "Fachbereiche & Teams", "Wer bekommt was?" und "Menü" entfallen in den Werk-Einstellungen.
  - "Menü dieses Standorts" (ein-/ausblenden) steht jetzt unter Board-Einstellungen.
  - Laden der Personen bricht nach 8 s ab, damit die Seite nie hängen bleibt.
  Speichert in dieselben Felder wie bisher (wp_config: owners / persons / nav_hidden),
  daher funktionieren Zustellung und Eskalation unverändert weiter.
*/
(function () {
  "use strict";

  var ROLE = { 4: "Werkleiter", 3: "Hauptabteilungsleiter", 2: "Betriebsleiter", 1: "Schichtmeister" };
  var TABS = [["zust", "Wer ist zuständig?"], ["ablauf", "Eskalation"], ["gruende", "Gründe"]];

  function ready() {
    try {
      return typeof ǀ158 === "function" && typeof ǀ131 === "function" && typeof ǀ11i === "object" &&
        typeof ǀ157 === "function" && typeof ǀ14u === "function" && typeof esc === "function" &&
        typeof ǀ13q === "function" && typeof ǀqb === "function" &&
        typeof ǀqg === "function" && typeof ǀ13w === "function" && typeof ǀ13v === "function";
    } catch (e) { return false; }
  }

  function install() {
    var origRender = ǀ158;
    var origPeople = ǀ14u;

    /* 1) Personen laden: nie endlos warten */
    ǀ14u = function () {
      var timeout = new Promise(function (res) { setTimeout(res, 8000); });
      return Promise.race([Promise.resolve().then(origPeople), timeout])
        .catch(function (err) { console.warn("[Shopfloor] Personen laden:", err); })
        .then(function () {
          if (!ǀ11i.people) { ǀ11i.people = []; try { ǀ11i.peopleSite = ǀpd(); } catch (e) {} }
        });
    };

    /* 2) Einstellungen: nur noch drei Reiter */
    ǀ158 = function () {
      var tab = ǀ11i.sfxTab || "zust";
      var keep = ǀ11i.setTab;
      var html;
      try {
        ǀ11i.setTab = tab === "zust" ? "gruende" : tab;
        html = origRender();
      } catch (err) {
        console.error("[Shopfloor] Einstellungen:", err);
        return '<div class="wp-card wp-none">Die Einstellungen konnten nicht angezeigt werden. Bitte Seite neu laden.</div>';
      } finally {
        ǀ11i.setTab = keep;
      }
      if (html.indexOf("wp-set") < 0) return html; /* lädt noch / keine Berechtigung */

      try {
        var tpl = document.createElement("template");
        tpl.innerHTML = html;
        var root = tpl.content.querySelector(".wp-set");
        var sub = root.querySelector(".wp-th .wp-mut");
        if (sub) sub.textContent = "Pro Box die zuständige Person eintragen. Die Kostenstelle meldet, die Meldung geht von unten nach oben.";
        var nav = root.querySelector("nav.wp-stabs");
        if (nav) {
          nav.innerHTML = TABS.map(function (t) {
            return '<button type="button" data-sfxtab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + esc(t[1]) + "</button>";
          }).join("");
        }
        if (tab === "zust") {
          root.querySelectorAll(".wp-card").forEach(function (c) { c.remove(); });
          root.insertAdjacentHTML("beforeend", treeCard());
        }
        return tpl.innerHTML;
      } catch (err) {
        console.error("[Shopfloor] Einstellungen:", err);
        return html;
      }
    };

    /* 3) Leitstand: Endlosschleife beim Einpassen stoppen */
    fixBoardResize();

    /* 4) Shopfloor-Reiter: nur Leitstand, Melden, Einstellungen (Rest in Board-Einstellungen einschaltbar) */
    var origTabs = ǀ13q;
    ǀ13q = function (cur) {
      var html = origTabs(cur);
      try {
        var hide = hiddenTabs();
        return html.replace(/<a href="#\/werkpuls\/([a-z]+)"[^>]*>[^<]*<\/a>/g, function (m, id) {
          return hide.indexOf(id) >= 0 && id !== cur ? "" : m;
        });
      } catch (e) { return html; }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("change", onChange, true);
    startMenuCard();
    startSideMenu();
    startTour();
    startLegend();
    startLogo();
    window.addEventListener("hashchange", syncTour);
    syncTour();
    injectCss();

    /* falls die Einstellungen gerade offen sind: neu zeichnen */
    try { if (ǀ11i.view === "einstellungen") ǀ131(false); } catch (e) {}
  }

  /* ---------- Leitstand-Größe ---------- */

  function fixBoardResize() {
    if (!window.ResizeObserver) return;
    try { if (ǀqd) ǀqd.disconnect(); } catch (e) {}
    var lastW = -1, raf = 0;
    ǀqd = new ResizeObserver(function (entries) {
      var w = Math.round(entries[0].contentRect.width);
      if (Math.abs(w - lastW) < 30) return; /* Scrollbalken & Co. lösen kein neues Einpassen aus */
      lastW = w;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        try { if (/^#\/shopfloor/.test(location.hash) && ǀp4.fit) ǀqb(); } catch (e) {}
      });
    });
    var out = document.getElementById("sfOut");
    if (out) ǀqd.observe(out);
  }

  /* ---------- Abspielen: alle Abteilungen, ganzer Bildschirm ---------- */

  function startTour() {
    /* alle Abteilungen der Reihe nach, nicht nur die mit Problemen */
    ǀ13v = function () {
      var top = ǀph();
      var only = (typeof ǀ13f === "function") ? ǀ13f() : null;
      var deps = only || ǀ123(top.id).filter(function (a) { return a.level === 3 && ǀ126(a).length; });
      return (only ? [] : [""]).concat(deps.map(function (a) { return a.id; }));
    };

    /* Board in der Höhe UND Breite einpassen, solange abgespielt wird */
    var origFit = ǀqb;
    ǀqb = function () {
      var r = origFit.apply(this, arguments);
      try { if (ǀ11i.tour) fitHeight(); } catch (e) {}
      return r;
    };

    var origFocus = ǀqg;
    ǀqg = function () {
      var r = origFocus.apply(this, arguments);
      if (ǀ11i.tour) { setTimeout(refit, 80); setTimeout(refit, 700); }
      return r;
    };

    var origTour = ǀ13w;
    ǀ13w = function (on) {
      var r = origTour.apply(this, arguments);
      syncTour();
      setTimeout(refit, 300);
      return r;
    };

    setInterval(syncTour, 1000);
    window.addEventListener("resize", function () { if (ǀ11i.tour) setTimeout(refit, 150); });
    document.addEventListener("fullscreenchange", function () { setTimeout(refit, 250); });

    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("#sfxTourStop")) { e.preventDefault(); try { ǀ13w(false); } catch (x) {} }
    });
  }

  function refit() { try { if (ǀ11i.tour && /^#\/shopfloor/.test(location.hash)) { ǀp4.fit = true; ǀqb(); } } catch (e) {} }

  function fitHeight() {
    var out = document.getElementById("sfOut"), inner = document.getElementById("sfIn"), size = document.getElementById("sfSize");
    if (!out || !inner || !size) return;
    var avail = window.innerHeight - out.getBoundingClientRect().top - 10;
    var h = inner.offsetHeight, w = inner.offsetWidth;
    if (!h || avail < 120) return;
    var z = Math.min(ǀp4.zoom || 1, avail / h);
    z = Math.max(0.15, z);
    ǀp4.zoom = z;
    inner.style.transform = z === 1 ? "none" : "scale(" + z + ")";
    size.style.width = Math.ceil(w * z) + "px";
    size.style.height = Math.ceil(h * z) + "px";
    var zv = document.getElementById("sfZv"); if (zv) zv.textContent = Math.round(z * 100) + " %";
  }

  function syncTour() {
    var on = false;
    try { on = !!ǀ11i.tour && ǀ13h(); } catch (e) {}
    document.body.classList.toggle("sfx-tour", on);
    var btn = document.getElementById("sfxTourStop");
    if (on && !btn) document.body.insertAdjacentHTML("beforeend", '<button type="button" id="sfxTourStop">■ Stopp</button>');
    if (!on && btn) btn.remove();
    /* weißer Seitenkopf auf den Shopfloor-Seiten: doppelt, daher weg */
    document.body.classList.toggle("sfx-sfpage", /^#\/(shopfloor|werkpuls)/.test(location.hash));
  }

  /* ---------- Legende in die Kopfleiste (Zähler) verschieben ---------- */

  function startLegend() {
    var queued = false;
    var run = function () {
      queued = false;
      var cnt = document.querySelector(".sf-hd .sf-cnt");
      var leg = document.querySelector(".sf-leg");
      if (!cnt || !leg || cnt.dataset.sfx) return;
      cnt.dataset.sfx = "1";
      var items = Array.prototype.filter.call(leg.children, function (el) { return el.tagName === "DIV"; }).map(function (el) {
        var t = el.querySelector("b");
        var title = t ? t.textContent.trim() : "";
        var desc = el.textContent.replace(title, "").trim();
        return { title: title, desc: desc, color: el.style.getPropertyValue("--c") };
      });
      var spans = Array.prototype.slice.call(cnt.children);
      spans.forEach(function (sp, i) {
        if (!items[i]) return;
        sp.classList.add("sfx-c");
        sp.insertAdjacentHTML("beforeend", "<small>" + esc(items[i].desc) + "</small>");
      });
      items.slice(spans.length).forEach(function (it) {
        var label = it.title.charAt(0) + it.title.slice(1).toLowerCase();
        cnt.insertAdjacentHTML("beforeend", '<span class="sfx-c sfx-x"><i style="background:' + esc(it.color) + '"></i><b>' + esc(label) + "</b><small>" + esc(it.desc) + "</small></span>");
      });
    };
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }).observe(document.body, { childList: true, subtree: true });
    run();
  }

  /* ---------- Bischof+Klein-Logo überall gut sichtbar ---------- */

  var LOGO_SPOTS = [
    { sel: "#topbar", cls: "sfx-bk-top", where: "afterbegin" },            /* Kopfzeile jeder Seite (hell) */
    { sel: ".wp .wp-hd", cls: "sfx-bk-dark sfx-bk-wp", where: "afterbegin" }, /* dunkle Shopfloor-Leiste */
    { sel: ".sf-hd", cls: "sfx-bk-dark sfx-bk-sf", where: "afterbegin" },     /* Leitstand-Kopf, auch beim Abspielen */
    { sel: ".bc-hd", cls: "sfx-bk-bc", where: "afterbegin" }                 /* Board-Einstellungen */
  ];

  function startLogo() {
    if (typeof ǀ11f !== "function") return;
    var queued = false;
    var run = function () {
      queued = false;
      LOGO_SPOTS.forEach(function (spot) {
        document.querySelectorAll(spot.sel).forEach(function (el) {
          if (el.querySelector(":scope > .sfx-bk")) return;
          el.insertAdjacentHTML(spot.where, ǀ11f("sfx-bk " + spot.cls));
        });
      });
    };
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }).observe(document.body, { childList: true, subtree: true });
    run();
  }

  /* ---------- Reiter ---------- */

  var OPT_TABS = [["runde", "Runde"], ["einsaetze", "Einsätze"], ["tagesabschluss", "Tagesabschluss"], ["regeln", "Spielregeln"]];
  function hiddenTabs() {
    var c = ǀ11i.cfg || {};
    return Array.isArray(c.wp_tabs_hidden) ? c.wp_tabs_hidden : OPT_TABS.map(function (x) { return x[0]; });
  }

  /* ---------- Baum ---------- */

  function draft() { return ǀ157(); }

  function namesFor(node, d) {
    var chips = [];
    ((d.owners || {})[node.id] || []).forEach(function (uid) {
      chips.push(ǀ14x(wpPName(uid), 'data-wpcx="own" data-wpn="' + node.id + '" data-wpu="' + uid + '"'));
    });
    (d.persons || []).forEach(function (p) {
      if ((p.areas || []).length === 1 && p.areas[0] === node.id && p.name) {
        chips.push(ǀ14x(p.name + (p.uid ? "" : " (ohne Konto)"), 'data-sfxdel="' + esc(p.id) + '"'));
      }
    });
    return chips;
  }

  function row(node, depth, d) {
    var chips = namesFor(node, d);
    var owned = (d.owners || {})[node.id] || [];
    var kids = ǀ123(node.id);
    var kst = node.level === 1 ? kids.filter(function (k) { return k.level === 0; }) : [];
    var subs = kids.filter(function (k) { return k.level >= 1; });
    var toggle = "";
    if (node.level === 3 && subs.length) {
      var all = [], filled = 0;
      (function walk(n) { ǀ123(n.id).forEach(function (k) { if (k.level >= 1) { all.push(k); walk(k); } }); })(node);
      all.forEach(function (k) { if (namesFor(k, d).length) filled++; });
      var open = isOpen(node.id);
      toggle = '<button type="button" class="sfx-tog" data-sfxtog="' + node.id + '" aria-expanded="' + open + '">' +
        (open ? "▾" : "▸") + " " + filled + " von " + all.length + " besetzt</button>";
    }
    var out = '<div class="sfx-row" style="--sfx-d:' + depth + '">' +
      '<span class="sfx-lv sfx-l' + node.level + '">L' + node.level + " · " + esc(ROLE[node.level] || "") + "</span>" +
      '<span class="sfx-nm">' + esc(ǀ125(node)) + toggle + "</span>" +
      '<span class="sfx-who">' + (chips.length ? chips.join("") : '<span class="sfx-gap">nicht besetzt</span>') + "</span>" +
      '<span class="sfx-add">' + ǀ14w('data-wpcadd="own" data-wpn="' + node.id + '"', owned) +
      '<input type="text" maxlength="60" data-sfxname="' + node.id + '" placeholder="oder Name tippen ↵" aria-label="Name ohne Benutzerkonto"></span>' +
      "</div>";
    if (kst.length) {
      out += '<div class="sfx-kst" style="--sfx-d:' + (depth + 1) + '"><span>L0 · Kostenstellen melden:</span>' +
        kst.map(function (k) { return "<i>" + esc(ǀ125(k)) + "</i>"; }).join("") + "</div>";
    }
    if (node.level !== 3 || isOpen(node.id)) {
      subs.forEach(function (k) { out += row(k, depth + 1, d); });
    }
    return out;
  }

  function isOpen(id) { return !!(ǀ11i.sfxOpen && ǀ11i.sfxOpen[id]); }

  function treeCard() {
    var d = draft();
    var top = (typeof ǀph === "function") ? ǀph() : null;
    if (!top) return '<div class="wp-card wp-none">Noch keine Struktur angelegt. Zuerst im Leitstand „Struktur bearbeiten“.</div>';
    var legacy = (d.persons || []).filter(function (p) { return !(p.areas || []).length && (p.name || p.uid); });
    var hint = (ǀ11i.people || []).length ? "" :
      '<p class="wp-mut">Hinweis: Es wurden keine Benutzerkonten gefunden. Namen können trotzdem eingetragen werden, bekommen aber keine Benachrichtigung.</p>';
    return '<div class="wp-card"><div class="wp-h3">Wer ist zuständig?</div>' +
      '<p class="wp-mut">Eine Person pro Box auswählen. Leere Box: Die Meldung geht direkt zur nächsten Ebene. Ohne Reaktion geht sie ebenfalls eine Ebene höher. Benachrichtigt werden nur Personen mit Benutzerkonto.</p>' +
      hint + '<div class="sfx-tree">' + row(top, 0, d) + "</div>" +
      (legacy.length ? '<p class="wp-mut" style="margin-top:12px">Früher angelegt (gilt fürs ganze Werk): ' +
        legacy.map(function (p) { return ǀ14x((p.name || wpPName(p.uid)) + " · L" + (p.level || 0), 'data-sfxdel="' + esc(p.id) + '"'); }).join("") + "</p>" : "") +
      "</div>";
  }

  /* ---------- Ereignisse ---------- */

  function rerender() { try { ǀ131(true); } catch (e) { console.error(e); } }

  function addName(input) {
    var name = (input.value || "").trim().slice(0, 60);
    input.value = "";
    if (!name) return;
    var node = ǀ122(input.dataset.sfxname);
    if (!node) return;
    var d = draft();
    var uid = "";
    (ǀ11i.people || []).forEach(function (p) { if (p.n.toLowerCase() === name.toLowerCase()) uid = p.id; });
    if (uid) {
      d.owners[node.id] = ((d.owners[node.id] || []).filter(function (x) { return x !== uid; })).concat([uid]);
    } else {
      d.persons.push({ id: "p" + Date.now().toString(36), name: name, uid: "", level: node.level, groups: [], areas: [node.id] });
    }
    rerender();
  }

  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-sfxtab],[data-sfxtog],[data-sfxdel]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.dataset.sfxtab) { ǀ11i.sfxTab = b.dataset.sfxtab; try { ǀ131(false); } catch (x) {} return; }
    if (b.dataset.sfxtog) { ǀ11i.sfxOpen = ǀ11i.sfxOpen || {}; ǀ11i.sfxOpen[b.dataset.sfxtog] = !isOpen(b.dataset.sfxtog); rerender(); return; }
    if (b.dataset.sfxdel) {
      var d = draft();
      d.persons = d.persons.filter(function (p) { return p.id !== b.dataset.sfxdel; });
      rerender();
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && e.target && e.target.dataset && e.target.dataset.sfxname) { e.preventDefault(); addName(e.target); }
  }
  function onChange(e) {
    if (e.target && e.target.dataset && e.target.dataset.sfxname) { e.stopPropagation(); addName(e.target); }
  }

  /* ---------- gemeinsames Speichern (wp_config des Standorts) ---------- */

  async function saveCfg(patch) {
    var site = ǀpd();
    var res = await sb.from("wp_config").select("data").eq("site", site).maybeSingle();
    if (res.error) throw res.error;
    var data = (res.data && res.data.data) || {};
    Object.keys(patch).forEach(function (k) { data[k] = patch[k]; });
    var up = await sb.from("wp_config").upsert({ site: site, data: data, updated_at: new Date().toISOString(), updated_by: ǀ1bn });
    if (up.error) throw up.error;
    ǀ11i.cfg = data;
    if (ǀ11i.draft) Object.keys(patch).forEach(function (k) { ǀ11i.draft[k] = JSON.parse(JSON.stringify(patch[k])); });
    return data;
  }

  /* ---------- Board-Einstellungen: optionale Shopfloor-Reiter ---------- */

  function startMenuCard() {
    var busy = false;
    new MutationObserver(function () {
      if (busy) return;
      var bc = document.querySelector(".bc");
      if (!bc || bc.querySelector("#sfxNavCard")) return;
      busy = true;
      try { bc.insertAdjacentHTML("beforeend", menuCard()); } catch (e) { console.error(e); }
      busy = false;
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", async function (e) {
      var b = e.target.closest && e.target.closest("#sfxNavSave");
      if (!b) return;
      e.preventDefault();
      var tabsHidden = [];
      document.querySelectorAll("#sfxNavCard input[data-sfxwt]").forEach(function (c) { if (!c.checked) tabsHidden.push(c.dataset.sfxwt); });
      b.disabled = true; b.textContent = "Speichert …";
      try {
        await saveCfg({ wp_tabs_hidden: tabsHidden });
        if (typeof gbToast === "function") gbToast("Gespeichert");
      } catch (err) {
        if (typeof gbToast === "function") gbToast("Speichern fehlgeschlagen: " + (err && err.message || err), true);
      }
      b.disabled = false; b.textContent = "Speichern";
    });
  }

  function menuCard() {
    var allowed = false;
    try { allowed = ǀpe(); } catch (e) {}
    if (!allowed) return '<div id="sfxNavCard" hidden></div>';
    return '<section id="sfxNavCard" class="sfx-navcard"><h3>Shopfloor-Status: Reiter</h3>' +
      "<p>Leitstand, Melden und Einstellungen sind immer da. Diese Reiter bei Bedarf einschalten. (Das linke Menü passen Sie direkt im Menü unten mit „Menü anpassen“ an.)</p>" +
      '<div class="sfx-navs">' + OPT_TABS.map(function (x) {
        return '<label><input type="checkbox" data-sfxwt="' + x[0] + '"' + (hiddenTabs().indexOf(x[0]) < 0 ? " checked" : "") + "><span>" + esc(x[1]) + "</span></label>";
      }).join("") + '</div><button type="button" id="sfxNavSave">Speichern</button></section>';
  }

  /* ---------- Linkes Menü: aus- und einblenden ---------- */

  var NEVER_HIDE = ["admin", "boardcfg"]; /* damit man sich nicht aussperrt */
  var side = { edit: false, hidden: null, loaded: false };

  function navEl() { return document.querySelector('nav.nav[aria-label="Hauptnavigation"]'); }
  function isAdmin() { try { return ǀ1bk === "admin" || ǀ1bk === "leader"; } catch (e) { return false; } }

  function applySide() {
    var nav = navEl();
    if (!nav) return;
    var hid = side.hidden || ((ǀ11i.cfg || {}).nav_hidden) || [];
    nav.classList.toggle("sfx-edit", side.edit);
    var grp = null, grpVisible = false;
    var closeGrp = function () { if (grp) grp.classList.toggle("sfx-hide", !side.edit && !grpVisible); };
    Array.prototype.forEach.call(nav.children, function (el) {
      if (el.classList.contains("nav-grp")) { closeGrp(); grp = el; grpVisible = false; return; }
      var key = el.dataset && el.dataset.nav;
      if (!key) return;
      var off = hid.indexOf(key) >= 0 && NEVER_HIDE.indexOf(key) < 0;
      el.classList.toggle("sfx-off", off);
      el.classList.toggle("sfx-hide", off && !side.edit);
      if (side.edit && NEVER_HIDE.indexOf(key) < 0 && !el.querySelector(".sfx-eye")) {
        el.insertAdjacentHTML("beforeend", '<i class="sfx-eye" aria-hidden="true"></i>');
      }
      if (!side.edit) { var eye = el.querySelector(".sfx-eye"); if (eye) eye.remove(); }
      if (!off && !el.hidden && getComputedStyle(el).display !== "none") grpVisible = true;
    });
    closeGrp();
    var btn = document.getElementById("sfxSideBtn");
    if (btn) btn.textContent = side.edit ? "Fertig – speichern" : "Menü anpassen";
  }

  async function loadSide() {
    if (side.loaded) return;
    try {
      if (!(ǀ11i.cfg && Object.keys(ǀ11i.cfg).length)) {
        var r = await sb.from("wp_config").select("data").eq("site", ǀpd()).maybeSingle();
        if (r.data && r.data.data) ǀ11i.cfg = r.data.data;
      }
      side.loaded = true;
    } catch (e) {}
    applySide();
  }

  function startSideMenu() {
    var nav = navEl();
    if (!nav) return;
    var mo = new MutationObserver(function () { mo.disconnect(); applySide(); mo.observe(nav, { attributes: true, subtree: true, attributeFilter: ["hidden", "class"] }); });
    mo.observe(nav, { attributes: true, subtree: true, attributeFilter: ["hidden", "class"] });

    var tries = 0;
    (function addBtn() {
      if (document.getElementById("sfxSideBtn")) return;
      if (!isAdmin()) { if (++tries < 120) setTimeout(addBtn, 1000); return; } /* Rolle steht erst nach dem Anmelden fest */
      nav.insertAdjacentHTML("afterend", '<button type="button" id="sfxSideBtn" class="sfx-sidebtn">Menü anpassen</button>' +
        '<p id="sfxSideHint" class="sfx-sidehint" hidden>Punkt antippen = ein- oder ausblenden. Gilt für alle Benutzer dieses Standorts, die Daten bleiben erhalten.</p>');
      side.loaded = false; loadSide();
    })();

    document.addEventListener("click", async function (e) {
      var btn = e.target.closest && e.target.closest("#sfxSideBtn");
      if (btn) {
        e.preventDefault();
        if (!side.edit) {
          side.hidden = (((ǀ11i.cfg || {}).nav_hidden) || []).slice();
          side.edit = true;
        } else {
          btn.disabled = true; btn.textContent = "Speichert …";
          try {
            await saveCfg({ nav_hidden: side.hidden });
            if (typeof gbToast === "function") gbToast("Menü gespeichert");
            side.edit = false;
          } catch (err) {
            if (typeof gbToast === "function") gbToast("Speichern fehlgeschlagen: " + (err && err.message || err), true);
          }
          btn.disabled = false;
        }
        var hint = document.getElementById("sfxSideHint");
        if (hint) hint.hidden = !side.edit;
        applySide();
        return;
      }
      if (!side.edit) return;
      var item = e.target.closest && e.target.closest('nav.nav[aria-label="Hauptnavigation"] [data-nav]');
      if (!item) return;
      e.preventDefault(); e.stopPropagation();
      var key = item.dataset.nav;
      if (NEVER_HIDE.indexOf(key) >= 0) return;
      var i = side.hidden.indexOf(key);
      if (i >= 0) side.hidden.splice(i, 1); else side.hidden.push(key);
      applySide();
    }, true);

    loadSide();
    setTimeout(function () { side.loaded = false; loadSide(); }, 4000); /* nach dem Laden der App noch einmal */
  }

  function injectCss() {
    var css =
      ".sfx-tree{border:1px solid var(--wp-line,#dde3ea);border-radius:10px;overflow:hidden}" +
      ".sfx-row{display:grid;grid-template-columns:minmax(150px,auto) minmax(140px,1fr) minmax(160px,1.2fr) minmax(260px,auto);gap:10px;align-items:center;padding:8px 12px 8px calc(12px + var(--sfx-d)*22px);border-bottom:1px solid var(--wp-line,#eef1f4)}" +
      ".sfx-row:last-child{border-bottom:0}" +
      ".sfx-lv{font-size:11.5px;font-weight:600;padding:3px 8px;border-radius:6px;white-space:nowrap;justify-self:start}" +
      ".sfx-l4{background:#fdecec;color:#9b2c2c}.sfx-l3{background:#efedfd;color:#4c3fae}.sfx-l2{background:#e6f1fb;color:#185fa5}.sfx-l1{background:#e8f5ec;color:#2b6b3f}" +
      ".sfx-nm{font-weight:600;display:flex;gap:10px;align-items:center;flex-wrap:wrap}" +
      ".sfx-tog{border:1px solid var(--wp-line,#dde3ea);background:none;border-radius:6px;font-size:12px;padding:2px 8px;cursor:pointer;font-weight:500}" +
      ".sfx-who{display:flex;flex-wrap:wrap;gap:6px}.sfx-gap{color:#c05621;font-size:13px}" +
      ".sfx-add{display:flex;gap:6px}.sfx-add input,.sfx-add select{height:32px;font-size:13px;min-width:0}.sfx-add input{width:150px}" +
      ".sfx-kst{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 12px 10px calc(12px + var(--sfx-d)*22px);border-bottom:1px solid var(--wp-line,#eef1f4);font-size:12px;color:var(--wp-muted,#64748b)}" +
      ".sfx-kst i{font-style:normal;border:1px solid var(--wp-line,#dde3ea);border-radius:6px;padding:1px 7px}" +
      "@media(max-width:900px){.sfx-row{grid-template-columns:1fr;padding-left:calc(12px + var(--sfx-d)*10px)}}" +
      ".sfx-navcard{margin-top:18px;padding:16px;border:1px solid #dde3ea;border-radius:12px}.sfx-navcard h3{margin:0 0 4px}.sfx-navcard p{margin:0 0 10px;color:#64748b;font-size:13px}" +
      ".sfx-navs{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px 14px;margin-bottom:12px}" +
      "nav.nav .sfx-hide{display:none!important}" +
      "nav.sfx-edit [data-nav]{position:relative}nav.sfx-edit .sfx-off{opacity:.45;text-decoration:line-through}" +
      "nav.sfx-edit [data-nav] .sfx-eye{position:absolute;right:10px;top:50%;width:9px;height:9px;margin-top:-5px;border-radius:50%;background:#3cae49}" +
      "nav.sfx-edit .sfx-off .sfx-eye{background:transparent;border:1.5px solid #94a3b8}" +
      ".sfx-sidebtn{display:block;margin:10px 14px 0;width:calc(100% - 28px);padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:transparent;color:inherit;font-size:13px;cursor:pointer}" +
      ".sfx-sidebtn:hover{background:rgba(255,255,255,.08)}.sfx-sidehint{margin:6px 14px 0;font-size:11.5px;opacity:.75;line-height:1.35}" +
      "body.sfx-sfpage .pagehead{display:none!important}" +
      ".sf-leg{display:none!important}" +
      ".bk-logo.sfx-bk{height:34px}.bk-logo.sfx-bk-top{height:32px;margin:0 14px 0 4px;padding-right:14px;border-right:1px solid var(--line,#DCE4EC)}" +
      "#topbar{align-items:center}" +
      ".bk-logo.sfx-bk-dark .bk-l{display:none!important}.bk-logo.sfx-bk-dark .bk-d{display:block!important}" +
      ".bk-logo.sfx-bk-wp{height:36px;margin-right:16px;align-self:center}.wp-hd{align-items:center}" +
      ".bk-logo.sfx-bk-sf{height:46px;margin-right:6px;align-self:center}body.sfx-tour .bk-logo.sfx-bk-sf{height:54px}" +
      ".bk-logo.sfx-bk-bc{height:34px;margin-right:16px;align-self:center}" +
      ".bk-logo.bk-side{height:34px!important}" +
      ".sf-cnt span.sfx-c{display:grid;grid-template-columns:auto auto 1fr;column-gap:7px;row-gap:1px;align-items:center}" +
      ".sf-cnt span.sfx-c small{grid-column:1/-1;font-size:11px;opacity:.78;white-space:nowrap}" +
      ".sf-cnt span.sfx-x b{font-size:13px}" +
      "body.sfx-tour .wp-sftop,body.sfx-tour .sf-bar,body.sfx-tour .sf-leg,body.sfx-tour .sf-foot,body.sfx-tour .sf-hd p,body.sfx-tour .pagehead,body.sfx-tour #wpToasts{display:none!important}" +
      "body.sfx-tour .sf-hd{padding-top:8px;padding-bottom:8px}body.sfx-tour #sfOut{overflow:hidden!important}body.sfx-tour #sfSize{margin:0 auto}" +
      "body.sfx-tour .wp-popw{margin-bottom:6px}body.sfx-tour .wp-pop{padding:8px 12px}body.sfx-tour .wp-poph b{font-size:18px}" +
      "body.sfx-tour .wp-popg{grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px;margin-top:6px}" +
      "body.sfx-tour .wp-popc{padding:6px 9px}body.sfx-tour .wp-popc small{display:none}body.sfx-tour .wp-popc b{font-size:14px}body.sfx-tour .wp-popc span{font-size:12.5px}" +
      "body.sfx-tour .wp-popc:nth-child(n+5):not(.more){display:none}" +
      "#sfxTourStop{position:fixed;right:14px;bottom:14px;z-index:99999;padding:8px 14px;border-radius:999px;border:0;background:#0a2e50;color:#fff;font-weight:600;cursor:pointer;opacity:.55}#sfxTourStop:hover{opacity:1}" +
      ".sfx-navs label{display:flex;gap:8px;align-items:baseline;font-size:13.5px}.sfx-navs small{color:#94a3b8;font-size:11px}";
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* warten, bis die App geladen ist */
  var tries = 0;
  (function wait() {
    if (ready()) return install();
    if (++tries < 120) setTimeout(wait, 500);
    else console.warn("[Shopfloor] vereinfachte Einstellungen nicht geladen");
  })();
})();
