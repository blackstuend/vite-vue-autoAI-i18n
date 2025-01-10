export interface Locale {
  name: string
  code: string
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
  // determine if install dependencies
  needInstallDependencies: boolean
}

export abstract class Worker {
  ctx: Context

  constructor(ctx: Context) {
    this.ctx = ctx
  }

  abstract get dependencies(): string[]

  abstract handleMainConfig(): Promise<void>
  abstract handleBuilderConfig(): Promise<void>
  abstract handlePrimaryFile(filePath: string): Promise<void>
}
