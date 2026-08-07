import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { buildRuntimeViz } from '../scripts/copy-runtime-viz.mjs'

test('runtime viz publish copy is self-contained and links back relatively', () => {
  const source = '<head><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=X"></head><body><main>viz</main></body>'
  const result = buildRuntimeViz(source)
  assert.doesNotMatch(result, /fonts\.googleapis\.com/)
  assert.match(result, /href="\.\.\/LangGraph\/"/)
  assert.match(result, /返回 LangGraph 笔记/)
})

test('published runtime viz keeps the mobile heading below the fixed back link', async () => {
  const source = await readFile(new URL('../LangGraph/langgraph-runtime-viz/index.html', import.meta.url), 'utf8')
  const result = buildRuntimeViz(source)
  const mobileHeaderPadding = /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\.page-header\s*\{\s*padding:\s*([\d.]+)px/.exec(result)

  assert.match(result, /\.back-to-notes\{position:fixed;top:1rem;/)
  assert.ok(mobileHeaderPadding, 'expected a mobile page-header padding rule')

  const fixedLinkBottom = 16 + 8 + (14 * 1.2) + 8
  const minimumGap = 16
  const minimumHeaderTop = Math.ceil(fixedLinkBottom + minimumGap)
  const headerTop = Number(mobileHeaderPadding[1])

  assert.ok(
    headerTop >= minimumHeaderTop,
    `expected mobile page-header top padding >= ${minimumHeaderTop}px, got ${headerTop}px`
  )
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

test('uses only the href attribute when deciding whether to remove a link', () => {
  const source = '<head><link data-href="https://fonts.googleapis.com/x" href="/local.css"></head><body>viz</body>'
  const result = buildRuntimeViz(source)
  assert.match(result, /<link data-href="https:\/\/fonts\.googleapis\.com\/x" href="\/local\.css">/)
})

test('preserves comments and skips their link and structural lookalikes', () => {
  const comment = '<!-- <link href="https://fonts.googleapis.com/x"> <body>comment</body> </head> -->'
  const source = `<head>${comment}</head><body>viz</body>`
  const result = buildRuntimeViz(source)
  assert.match(result, new RegExp(comment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(result, /<head><!--[\s\S]*<\/head>/)
  assert.match(result, /<body><a class="back-to-notes" href="\.\.\/LangGraph\/">返回 LangGraph 笔记<\/a>viz<\/body>/)
})
