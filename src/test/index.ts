import { projectAutoI18n } from '../core'

projectAutoI18n({
  framework: 'vue',
  builder: 'vite',
  builderConfigFile: 'vite.config.ts',
  mainFile: 'src/main.ts',
  glob: '**/*.vue',
  defaultLocale: {
    code: 'en',
    name: 'English',
  },
  locales: [
    {
      code: 'en',
      name: 'English',
    },
    {
      code: 'zh',
      name: 'Chinese',
    },
  ],
  useCache: true,
  cacheFile: '.i18n-cache.json',
  needGenCodeInBuilderConfig: false,
  needGenCodeInMain: false,
  needInstallDependencies: false,
})
