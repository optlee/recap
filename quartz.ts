import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import { jsx as _jsx } from "preact/jsx-runtime"
import type { QuartzComponent, QuartzComponentConstructor } from "./quartz/components/types"

const config = await loadQuartzConfig()
export default config
const layout = await loadQuartzLayout()

// ── visitor counter (GoatCounter) ──
//
// IMPORTANT: In Quartz 5, `loadQuartzConfig()` already freezes the layout into
// PageTypeDispatcher. Mutating the layout export from this file does NOT put
// components into rendered pages. Instead we:
//  1. Register the component so CSS + afterDOMLoaded are collected
//  2. Inject the counter DOM from afterDOMLoaded (works with SPA navigation)
//
// Also: goatcounter.visit_count() requires "Allow adding visitor counts" in
// GoatCounter site settings (default OFF). We primarily use the public JSON
// endpoint, which works without that setting.

const counterCss = `
.visitor-counter {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--lightgray);
  font-size: 0.8rem;
  color: var(--gray);
  text-align: center;
}
.visitor-counter .label {
  display: block;
  margin-bottom: 0.15rem;
}
.visitor-counter #gc-visit-count {
  font-variant-numeric: tabular-nums;
  color: var(--darkgray);
}
`

function createVisitorCounter(): QuartzComponent {
  const Comp = (_props: any) => {
    // Rendered only if somehow placed in a layout; live path injects via JS.
    return _jsx("div", {
      class: "visitor-counter",
      children: [
        _jsx("span", { class: "label", children: "访问次数" }),
        _jsx("span", { id: "gc-visit-count" }),
      ],
    })
  }
  Comp.css = counterCss
  Comp.afterDOMLoaded = `
;(function () {
  var CODE = "optlee"
  var filled = false

  function ensureEl() {
    var el = document.getElementById("gc-visit-count")
    if (el) return el
    var sidebar = document.querySelector(".left.sidebar")
    if (!sidebar) return null
    var wrap = document.createElement("div")
    wrap.className = "visitor-counter"
    wrap.innerHTML = '<span class="label">访问次数</span><span id="gc-visit-count">…</span>'
    sidebar.appendChild(wrap)
    return document.getElementById("gc-visit-count")
  }

  function setText(text) {
    var el = ensureEl()
    if (el) el.textContent = text
  }

  function fillFromJson() {
    if (filled) return
    fetch("https://" + CODE + ".goatcounter.com/counter/TOTAL.json", {
      mode: "cors",
      credentials: "omit",
    })
      .then(function (r) {
        if (!r.ok) throw new Error("status " + r.status)
        return r.json()
      })
      .then(function (data) {
        if (data && (data.count != null || data.count_unique != null)) {
          filled = true
          setText(String(data.count != null ? data.count : data.count_unique))
        }
      })
      .catch(function () {
        // Fallback: visit_count widget (needs GoatCounter setting enabled)
        tryVisitCount(0)
      })
  }

  function tryVisitCount(attempt) {
    var el = ensureEl()
    if (!el) {
      if (attempt < 20) setTimeout(function () { tryVisitCount(attempt + 1) }, 250)
      return
    }
    if (window.goatcounter && window.goatcounter.visit_count) {
      // Clear placeholder before widget appends
      el.textContent = ""
      window.goatcounter.visit_count({
        append: "#gc-visit-count",
        type: "html",
        no_branding: true,
        path: "TOTAL",
      })
      filled = true
      return
    }
    if (attempt < 40) setTimeout(function () { tryVisitCount(attempt + 1) }, 250)
  }

  function run() {
    ensureEl()
    fillFromJson()
  }

  // Initial + SPA navigations (sidebar may be re-created from new HTML)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run)
  } else {
    run()
  }
  document.addEventListener("nav", function () {
    filled = false
    run()
  })
})()
  `
  return Comp
}

// Register so CSS + afterDOMLoaded are picked up by ComponentResources emitter.
// Do NOT push onto layout.defaults — that copy is not what PageTypeDispatcher uses.
componentRegistry.register(
  "visitor-counter",
  createVisitorCounter as QuartzComponentConstructor,
  "quartz.ts",
)

// Instantiate once so getAllComponents() reuses a single afterDOMLoaded script.
componentRegistry.instantiate(createVisitorCounter as QuartzComponentConstructor, undefined)

export { layout }
