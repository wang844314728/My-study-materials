import { katex } from '@mdit/plugin-katex'

export function configureMarkdown(md) {
  md.use(katex, { delimiters: 'dollars' })
  const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]
    if (token.info.trim() !== 'mermaid') return defaultFence(tokens, index, options, env, self)
    return `<MermaidDiagram code="${md.utils.escapeHtml(encodeURIComponent(token.content))}" />`
  }
}
