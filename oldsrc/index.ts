import type { CacheData } from './cache'
import inquirer from 'inquirer'
import { checkCacheExist, getCache, removeCache, saveCache } from './cache'
import { LOCALES } from './constants'
import { getProjectContext, installDependencies, modifyConfigFile, modifyMainFile, modifyVueFiles } from './core'
import { getAllFiles } from './file'

async function main() {
  // check user have cache file
  const cacheIsExist = checkCacheExist()

  let useCache = false
  if (cacheIsExist) {
    const { continueProcess } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueProcess',
        message: 'Last time you had not finished, do you keep the process?',
      },
    ])

    if (continueProcess) {
      console.log('Loading cache...')
      useCache = true
    }
  }

  let cache: CacheData | null = null
  if (useCache) {
    cache = getCache()

    if (!cache) {
      throw new Error('cache is not exist')
    }

    // files maybe changed, so we need to get all files again
    cache.context.allFiles = getAllFiles()
  }
  else {
    // ask user what locales they want to add
    const { locales } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'locales',
        message: 'Select the locales you want to add:',
        choices: LOCALES,
      },
    ])

    // ask what is your default language
    const { defaultLocale } = await inquirer.prompt([
      {
        type: 'list',
        name: 'defaultLocale',
        message: 'What is your default locale?',
        choices: LOCALES.filter(locale => locales.includes(locale.value)),
      },
    ])

    console.log('Please wait, getting project information...')
    const context = await getProjectContext({
      locales,
      defaultLocale,
    })

    console.log(`
Project Information:
Config File: ${context.configFile}
Builder: ${context.builder}
Locales: ${context.locales}
Default Locale: ${context.defaultLocale}
    `)

    // make sure the locales is correct by asking user
    const { isCorrect } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'isCorrect',
        message: 'Make sure the locales is correct and project information is correct, if not, please enter n to cancel.',
      },
    ])

    if (!isCorrect) {
      console.log('Cancelled.')
      return
    }

    if (context.builder !== 'vite') {
      throw new Error('Currently only support vite project.')
    }

    cache = {
      context,
      flow: {
        install: false,
        modifyConfig: false,
        modifyMain: false,
        modifyVue: false,
      },
      finishFiles: [],
    }
  }

  if (!cache) {
    throw new Error('cache is not exist')
  }

  if (!cache.context.builder) {
    throw new Error('builder is not exist')
  }

  if (!cache.context.configFile) {
    throw new Error('config file is not exist')
  }

  if (!cache.flow.install) {
    console.log('Please wait, installing dependencies...')
    await installDependencies()
    console.log('Install dependencies success')
    console.log('--------------------------------')

    cache.flow.install = true
    saveCache(cache)
  }

  if (!cache.flow.modifyConfig) {
    console.log('Please wait, modifying config file...')
    await modifyConfigFile(cache.context.builder, cache.context.configFile)
    console.log('Modify config file success,file path: ', cache.context.configFile)
    console.log('--------------------------------')

    cache.flow.modifyConfig = true
    saveCache(cache)
  }

  if (!cache.flow.modifyMain) {
    console.log('Please wait, modifying the main file...')
    await modifyMainFile(cache.context.mainFile, cache.context.defaultLocale)
    console.log('Modify main file success')
    console.log('--------------------------------')

    cache.flow.modifyMain = true
    saveCache(cache)
  }

  if (!cache.flow.modifyVue && cache.context.allFiles) {
    console.log('Please wait, modifying the vue files...')
    await modifyVueFiles(cache.context.allFiles, cache.context.locales, cache)
    console.log('--------------------------------')
  }
  cache.flow.modifyVue = true

  removeCache()

  console.log('Finished!')
}

main()
