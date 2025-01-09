export interface Locale {
  name: string
  code: string
}

export interface Cache {
  context: Context
  finish: {
    builder: boolean
    main: boolean
    files: string[]
  }
}

export interface Context {
  framework: 'vue' | 'react' | 'svelete'
  builder: 'vite' | 'webpack' | 'nuxt'
  // config file like vite.config.ts, webpack.config.js, nuxt.config.ts
  builderConfigFile: string
  // main file like main.ts, main.js
  mainFile: string
  // which files to be add i18n
  glob: string
  useCache: boolean
  // record the ever execute result, avoid repeat execute
  cacheFile: string
  defaultLocale: Locale
  locales: Locale[]
  // determine if generate i18n for builder config file
  needGenCodeInBuilderConfig: boolean
  // determine if generate i18n for main file
  needGenCodeInMain: boolean
}