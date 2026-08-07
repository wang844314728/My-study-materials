import { katex } from '@mdit/plugin-katex'

export function configureMarkdown(md) {
  md.use(katex, { delimiters: 'dollars' })
  md.core.ruler.after('inline', 'task-lists', (state) => {
    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index]
      const listItem = state.tokens[index - 2]
      const firstChild = token.children?.[0]

      if (token.type !== 'inline' || listItem?.type !== 'list_item_open' || firstChild?.type !== 'text') continue

      const marker = /^\[([ xX])\]\s+/.exec(firstChild.content)
      if (!marker) continue

      const checked = marker[1].toLowerCase() === 'x'
      const checkbox = new state.Token('html_inline', '', 0)
      checkbox.content = `<input class="task-list-item-checkbox" type="checkbox" disabled${checked ? ' checked' : ''} aria-label="${checked ? '已完成' : '未完成'}"> `
      firstChild.content = firstChild.content.slice(marker[0].length)
      token.children.unshift(checkbox)
      listItem.attrJoin('class', 'task-list-item')

      const listLevel = listItem.level - 1
      for (let parentIndex = index - 3; parentIndex >= 0; parentIndex -= 1) {
        const parent = state.tokens[parentIndex]
        if (parent.level !== listLevel) continue
        if (parent.type === 'bullet_list_open' || parent.type === 'ordered_list_open') {
          const classes = parent.attrGet('class')?.split(/\s+/) ?? []
          if (!classes.includes('task-list')) parent.attrJoin('class', 'task-list')
          break
        }
      }
    }
  })

  const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]
    if (token.info.trim() !== 'mermaid') return defaultFence(tokens, index, options, env, self)
    return `<MermaidDiagram code="${md.utils.escapeHtml(encodeURIComponent(token.content))}" />`
  }
}
