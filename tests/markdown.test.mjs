import assert from 'node:assert/strict'
import test from 'node:test'
import MarkdownIt from 'markdown-it'
import { configureMarkdown } from '../.vitepress/markdown.mjs'

test('renders dollar math with KaTeX', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  assert.match(md.render('公式：$E = mc^2$'), /class="katex"/)
})

test('turns mermaid fences into encoded components', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  const html = md.render('```mermaid\ngraph TD\n  A --> B\n```')
  assert.match(html, /<MermaidDiagram code="graph%20TD/)
  assert.doesNotMatch(html, /language-mermaid/)
})
