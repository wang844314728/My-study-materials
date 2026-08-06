export const SITE = {
  title: "Yook's Notes",
  description: '记录学习、研究与思考',
  github: 'https://github.com/wang844314728/My-study-materials',
  repository: 'My-study-materials'
} as const

export function normalizeBase(value = '/') {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}
