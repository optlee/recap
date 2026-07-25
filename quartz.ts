import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import { jsx as _jsx } from "preact/jsx-runtime"
import type { QuartzComponent, QuartzComponentConstructor } from "./quartz/components/types"

const config = await loadQuartzConfig()
export default config
const layout = await loadQuartzLayout()

// ── visitor counter ──
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
`

function createVisitorCounter(): QuartzComponent {
  const Comp = (_props: any) => {
    return _jsx("div", { class: "visitor-counter", children: [
      _jsx("span", { class: "label", children: "访问次数" }),
      _jsx("span", { id: "gc-visit-count" })
    ]})
  }
  Comp.css = counterCss
  Comp.afterDOMLoaded = `
;(function poll() {
  var el = document.getElementById('gc-visit-count')
  if (!el) return
  if (window.goatcounter && window.goatcounter.visit_count) {
    window.goatcounter.visit_count({
      append: '#gc-visit-count',
      type: 'html',
      no_branding: true,
      path: 'TOTAL'
    })
  } else {
    setTimeout(poll, 500)
  }
})()
  `
  return Comp
}

// register so afterDOMLoaded is collected by ComponentResources emitter
componentRegistry.register(
  "visitor-counter",
  createVisitorCounter as QuartzComponentConstructor,
  "quartz.ts",
)

const counter = componentRegistry.instantiate(
  createVisitorCounter as QuartzComponentConstructor,
  undefined,
)

// add to left sidebar of all page types
if (!layout.defaults.left) layout.defaults.left = []
layout.defaults.left.push(counter)

export { layout }
