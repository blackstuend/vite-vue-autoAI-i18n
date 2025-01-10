import process from 'node:process'
import chalk from 'chalk'
import glob from 'fast-glob'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import { projectAutoI18n } from '../core'
import { AllLocales } from '../locales'
import { exit, log } from '../utils'

async function main() {
  const cacheFile = '.i18n-cache.json'

  if (fs.existsSync(cacheFile)) {
    log(chalk.red('Cache file already exists'))

    try {
      const content = await fs.readFile(cacheFile, 'utf-8')

      const cache = JSON.parse(content)

      await projectAutoI18n({
        framework: cache.framework,
        builder: cache.builder,
        builderConfigFile: cache.builderConfigFile,
        mainFile: cache.mainFile,
        glob: cache.glob,
        defaultLocale: cache.defaultLocale,
        locales: cache.locales,
        useCache: cache.useCache,
        cacheFile,
        needGenCodeInBuilderConfig: cache.needGenCodeInBuilderConfig,
        needGenCodeInMain: cache.needGenCodeInMain,
        needInstallDependencies: cache.needInstallDependencies,
      })
    }

    // don't care about the error
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (error) {

    }

    return
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
    useCache: true,
    cacheFile,
    needGenCodeInBuilderConfig: generateCodeInBuilderConfig,
    needGenCodeInMain: generateCodeInMain,
    needInstallDependencies: installDependencies,
  })
}

main()
