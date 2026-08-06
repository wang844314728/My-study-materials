import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import 'katex/dist/katex.min.css'
import HomePage from './components/HomePage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  }
} satisfies Theme
