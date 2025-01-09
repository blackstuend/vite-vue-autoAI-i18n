export type Builder = 'vite' | 'webpack' | 'nuxt' | 'vue-cli' | undefined

export interface ProjectContext {
  // like vite.config.ts or vue.config.js, nuxt.config.ts,
  configFile: string
  allFiles: string[]
  locales: string[]
  builder: Builder
  defaultLocale: string
  // nuxt not need main file
  mainFile?: string
}
