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
        typeof ǀ13q === "function" && typeof ǀqb === "function";
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

  /* ---------- Menü → Board-Einstellungen ---------- */

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
      var hidden = [];
      document.querySelectorAll("#sfxNavCard input[data-sfxnav]").forEach(function (c) { if (!c.checked) hidden.push(c.dataset.sfxnav); });
      var tabsHidden = [];
      document.querySelectorAll("#sfxNavCard input[data-sfxwt]").forEach(function (c) { if (!c.checked) tabsHidden.push(c.dataset.sfxwt); });
      b.disabled = true; b.textContent = "Speichert …";
      try {
        var site = ǀpd();
        var res = await sb.from("wp_config").select("data").eq("site", site).maybeSingle();
        var data = (res.data && res.data.data) || {};
        data.nav_hidden = hidden;
        data.wp_tabs_hidden = tabsHidden;
        var up = await sb.from("wp_config").upsert({ site: site, data: data, updated_at: new Date().toISOString(), updated_by: ǀ1bn });
        if (up.error) throw up.error;
        ǀ11i.cfg = data;
        if (ǀ11i.draft) { ǀ11i.draft.nav_hidden = hidden.slice(); ǀ11i.draft.wp_tabs_hidden = tabsHidden.slice(); }
        try { ǀ15f(); } catch (x) {}
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
    var hidden = ((ǀ11i.cfg || {}).nav_hidden) || [];
    var items = [];
    try { items = ǀ15e().filter(function (x) { return x[0] !== "werkpuls"; }); } catch (e) {}
    var site = "";
    try { site = ǀpd(); } catch (e) {}
    return '<section id="sfxNavCard" class="sfx-navcard"><h3>Menü dieses Standorts ' + esc(site) + "</h3>" +
      "<p>Was im Menü sichtbar ist. Ausgeblendete Punkte verschwinden für alle Benutzer dieses Standorts, die Daten bleiben erhalten.</p>" +
      '<div class="sfx-navs">' + items.map(function (x) {
        var fixed = x[0] === "admin" || x[0] === "shopfloor";
        return '<label><input type="checkbox" data-sfxnav="' + esc(x[0]) + '"' + (hidden.indexOf(x[0]) < 0 ? " checked" : "") + (fixed ? " disabled" : "") +
          "><span>" + esc(x[1]) + "</span><small>" + esc(x[2]) + "</small></label>";
      }).join("") + "</div>" +
      "<h3>Shopfloor-Status: Reiter</h3><p>Leitstand, Melden und Einstellungen sind immer da. Diese Reiter bei Bedarf einschalten:</p>" +
      '<div class="sfx-navs">' + OPT_TABS.map(function (x) {
        return '<label><input type="checkbox" data-sfxwt="' + x[0] + '"' + (hiddenTabs().indexOf(x[0]) < 0 ? " checked" : "") + "><span>" + esc(x[1]) + "</span></label>";
      }).join("") + '</div><button type="button" id="sfxNavSave">Speichern</button></section>';
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
