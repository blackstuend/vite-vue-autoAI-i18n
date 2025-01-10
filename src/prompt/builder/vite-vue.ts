export const prompt = `
Follow this documentation, set the i18n plugin to the vite config plugins

## Important
VueI18nPlugin don't need to set the options, just import it and add it to the plugins

## Documentation
\`\`\
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [
    VueI18nPlugin({})
  ]
})
\`\`\`
`
