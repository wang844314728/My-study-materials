import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRuntimeViz } from '../scripts/copy-runtime-viz.mjs'

test('runtime viz publish copy is self-contained and links back relatively', () => {
  const source = '<head><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=X"></head><body><main>viz</main></body>'
  const result = buildRuntimeViz(source)
  assert.doesNotMatch(result, /fonts\.googleapis\.com/)
  assert.match(result, /href="\.\.\/LangGraph\/"/)
  assert.match(result, /返回 LangGraph 笔记/)
})

test('keeps non-font markup unchanged while adding the back-link CSS to an existing style', () => {
  const source = '<head><link href="/local.css"><link href="https://fonts.gstatic.com/font.woff2"><style>.existing{color:red}</style></head><body><svg><path d="M0 0"/></svg><script>const state = "unchanged"</script></body>'
  const result = buildRuntimeViz(source)
  assert.match(result, /<link href="\/local\.css">/)
  assert.doesNotMatch(result, /fonts\.gstatic\.com/)
  assert.match(result, /<style>\.existing\{color:red}\n\.back-to-notes\{[^<]*<\/style>/)
  assert.match(result, /<body><a class="back-to-notes" href="\.\.\/LangGraph\/">返回 LangGraph 笔记<\/a><svg><path d="M0 0"\/><\/svg><script>const state = "unchanged"<\/script><\/body>/)
})

test('removes only link elements whose href uses a Google Fonts host', () => {
  const source = '<head><link href="https://fonts.googleapis.com.evil.example/style.css"><link href="https://fonts.googleapis.com/css2?family=X"><link href="//fonts.gstatic.com/font.woff2"></head><body></body>'
  const result = buildRuntimeViz(source)
  assert.match(result, /href="https:\/\/fonts\.googleapis\.com\.evil\.example\/style\.css"/)
  assert.doesNotMatch(result, /href="https:\/\/fonts\.googleapis\.com\/css2/)
  assert.doesNotMatch(result, /href="\/\/fonts\.gstatic\.com\/font\.woff2/)
})

test('does not transform link-like or closing-style text inside JavaScript', () => {
  const script = '<script>const example = "</style><link href=\\"https://fonts.googleapis.com/css2?family=X\\">"</script>'
  const source = `<head></head><body>${script}<svg><path d="M0 0"/></svg></body>`
  const result = buildRuntimeViz(source)
  assert.match(result, new RegExp(script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(result, /<head><style>\.back-to-notes\{[^<]*<\/style><\/head>/)
})
