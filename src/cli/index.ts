import process from 'node:process'
import chalk from 'chalk'
import glob from 'fast-glob'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import { getCacheByFile } from '../cache'
import { projectAutoI18n } from '../core'
import { AllLocales } from '../locales'
import { exit, log } from '../utils'

const isOnlyVue = process.argv.includes('--only-vue')

async function main() {
  const cacheFile = '.i18n-cache.json'

  if (fs.existsSync(cacheFile)) {
    // ask user want to use cache
    const { useCache } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useCache',
        message: 'Cache file already exists, do you want to use it?',
      },
    ])

    if (useCache) {
      const cache = getCacheByFile(cacheFile)
      if (cache) {
        await projectAutoI18n({
          framework: cache.ctx.framework,
          builder: cache.ctx.builder,
          builderConfigFile: cache.ctx.builderConfigFile,
          mainFile: cache.ctx.mainFile,
          glob: cache.ctx.glob,
          defaultLocale: cache.ctx.defaultLocale,
          locales: cache.ctx.locales,
          useCache: true,
          cacheFile,
          needGenCodeInBuilderConfig: cache.finish.builder,
          needGenCodeInMain: cache.finish.main,
          needInstallDependencies: cache.finish.install,
        })

        return
      }

      log(chalk.red('Load cache failed, keep running without cache'))
    }
  }

  // ask what locales to support
  const { selectedLocalesCodes } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedLocalesCodes',
      message: 'Please select the locales to support:',
      choices: AllLocales.map(locale => ({
        name: locale.name,
        value: locale.code,
      })),
    },
  ])

  const { selectedLocaleCode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedLocaleCode',
      message: 'Please select the default locale:',
      choices: AllLocales.filter(locale => selectedLocalesCodes.includes(locale.code)).map(locale => ({
        name: locale.name,
        value: locale.code,
      })),
    },
  ])

  const locales = AllLocales.filter(locale => selectedLocalesCodes.includes(locale.code))
  if (locales.length === 0) {
    log(chalk.red('No locales selected'))
    exit()

    return
  }

  const defaultLocale = AllLocales.find(locale => locale.code === selectedLocaleCode)
  if (!defaultLocale) {
    log(chalk.red('No default locale selected'))
    exit()

    return
  }

  if (isOnlyVue) {
    await projectAutoI18n({
      framework: 'vue',
      builder: 'vite',
      builderConfigFile: '',
      mainFile: '',
      glob: '**/*.vue',
      defaultLocale,
      locales,
      useCache: false,
      cacheFile,
      needGenCodeInBuilderConfig: false,
      needGenCodeInMain: false,
      needInstallDependencies: false,
    })
  }

  // ask user want to install dependencies
  const { installDependencies } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Do you want to install dependencies?',
    },
  ])

  // ask user want to generate code in builder config file
  const { generateCodeInBuilderConfig } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateCodeInBuilderConfig',
      message: 'Do you want to generate code in builder config file?',
    },
  ])

  // ask user want to generate code in main file
  const { generateCodeInMain } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateCodeInMain',
      message: 'Do you want to generate code in main file?',
    },
  ])

  const allFiles = await glob('**/*.{js,ts,vue}', { cwd: process.cwd(), ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/test/**', '**/public/**'] })

  let mainFile = ''
  if (generateCodeInMain) {
    mainFile = allFiles.find(file => file.includes('main.js')) || allFiles.find(file => file.includes('main.ts')) as string
    if (!mainFile) {
      log(chalk.red('No main file found'))
      exit()

      return
    }
  }

  let builderConfigFile = ''
  if (generateCodeInBuilderConfig) {
    builderConfigFile = allFiles.find(file => file.includes('vite.config.js') || file.includes('vite.config.ts')) as string
    if (!builderConfigFile) {
      log(chalk.red('No builder config file found'))
      exit()

      return
    }
  }

  await projectAutoI18n({
    framework: 'vue',
    builder: 'vite',
    builderConfigFile,
    mainFile,
    glob: '**/*.vue',
    defaultLocale,
    locales,
    useCache: false,
    cacheFile,
    needGenCodeInBuilderConfig: generateCodeInBuilderConfig,
    needGenCodeInMain: generateCodeInMain,
    needInstallDependencies: installDependencies,
  })
}

main()
