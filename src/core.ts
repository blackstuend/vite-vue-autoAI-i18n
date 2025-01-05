import type { CacheData } from './cache'
import type { Builder, ProjectContext } from './types'
import path from 'node:path'
import process from 'node:process'
import { execa } from 'execa'
import glob from 'fast-glob'
import fs from 'fs-extra'
import { getNewConfigFileContentWithI18nPlugin, getNewMainFileContent, getNewVueFileContent } from './ai'
import { saveCache } from './cache'
import { CodeModifier } from './code'
import { getAllFiles } from './file'

export async function getProjectContext(options: {
  locales: string[]
  defaultLocale: string
}): Promise<ProjectContext> {
  const cwd = process.cwd()

  // get all files include the cwd
  const allFiles = getAllFiles()

  const packageJSONPath = path.join(cwd, 'package.json')

  const builder = await getBuilder(packageJSONPath, allFiles)
  if (!builder) {
    throw new Error('Failed to get builder, please check your project is vue-cli or vite or webpack or nuxt')
  }

  const configFile = await getConfigFile(builder, allFiles)

  if (!configFile) {
    throw new Error('Failed to get config file')
  }

  const mainFile = await getMainFile(allFiles)
  if (builder === 'vite' || builder === 'webpack' || builder === 'vue-cli') {
    if (!mainFile) {
      throw new Error('Failed to get main file, please check your project have main.js or main.ts')
    }
  }

  return {
    mainFile,
    locales: options.locales,
    defaultLocale: options.defaultLocale,
    allFiles,
    configFile,
    builder,
  }
}

export async function getConfigFile(builder: Builder, allFiles: string[]): Promise<string | undefined> {
  if (builder === 'vite') {
    return allFiles.find(file => file.endsWith('vite.config.ts') || file.endsWith('vite.config.js')) || ''
  }
  else if (builder === 'webpack') {
    return allFiles.find(file => file.endsWith('webpack.config.ts') || file.endsWith('webpack.config.js')) || ''
  }
  else if (builder === 'nuxt') {
    return allFiles.find(file => file.endsWith('nuxt.config.ts') || file.endsWith('nuxt.config.js')) || ''
  }
  else if (builder === 'vue-cli') {
    return allFiles.find(file => file.endsWith('vue.config.js') || file.endsWith('vue.config.ts')) || ''
  }

  return undefined
}

export async function getBuilder(packageJSONPath: string, allFils: string[]): Promise<Builder> {
  // check package.json exist
  if (fs.existsSync(packageJSONPath)) {
    const packageJSON = await fs.readFile(packageJSONPath, 'utf-8')

    try {
      const packageJSONObj = JSON.parse(packageJSON)
      if ('scripts' in packageJSONObj && typeof packageJSONObj.scripts === 'object') {
        for (const script in packageJSONObj.scripts) {
          const value = packageJSONObj.scripts[script]
          if (typeof value === 'string' && value.includes('vite')) {
            return 'vite'
          }
          else if (typeof value === 'string' && value.includes('webpack')) {
            return 'webpack'
          }
          else if (typeof value === 'string' && value.includes('nuxt')) {
            return 'nuxt'
          }
          else if (typeof value === 'string' && value.includes('vue-cli-service')) {
            return 'vue-cli'
          }
        }
      }
    }
    catch (error) {
      throw new Error(`Failed to parse package.json, error: ${error}`)
    }
  }

  for (const file of allFils) {
    if (file.endsWith('vite.config.ts') || file.endsWith('vite.config.js')) {
      return 'vite'
    }
    else if (file.endsWith('webpack.config.ts') || file.endsWith('webpack.config.js')) {
      return 'webpack'
    }
    else if (file.endsWith('nuxt.config.ts') || file.endsWith('nuxt.config.js')) {
      return 'nuxt'
    }
    else if (file.endsWith('vue.config.js') || file.endsWith('vue.config.ts')) {
      return 'vue-cli'
    }
  }

  return undefined
}

export async function getMainFile(allFiles: string[]): Promise<string | undefined> {
  return allFiles.find(file => file.endsWith('main.ts') || file.endsWith('main.js')) || undefined
}

export async function modifyConfigFile(builder: string, file: string) {
  const content = await fs.readFile(file, 'utf-8')

  const newContent = await getNewConfigFileContentWithI18nPlugin(builder, content)

  const modifier = new CodeModifier(content)

  modifier.addReplacement(1, 1, newContent)

  const result = modifier.applyChanges()

  if (!newContent) {
    throw new Error('Failed to get new content of the config file')
  }

  fs.writeFileSync(file, result)
}

export async function modifyVueFiles(files: string[], locales: string[], cache: CacheData) {
  for (const file of files) {
    if (!file.endsWith('.vue') || cache.finishFiles.includes(file)) {
      continue
    }

    console.log('Start processing vue file: ', file)

    const content = await fs.readFile(file, 'utf-8')

    if (!content) {
      cache.finishFiles.push(file)

      saveCache(cache)
      continue
    }

    const newContent = await getNewVueFileContent(locales, content)

    if (!newContent || newContent === 'null') {
      cache.finishFiles.push(file)

      saveCache(cache)
      continue
    }

    fs.writeFileSync(file, newContent)

    cache.finishFiles.push(file)

    saveCache(cache)

    console.log('Modify vue file success,file path: ', file)
  }
}

export async function modifyMainFile(file?: string, defaultLocale?: string) {
  if (!file || !defaultLocale) {
    return
  }

  const content = await fs.readFile(file, 'utf-8')

  const newContent = await getNewMainFileContent(defaultLocale, content)

  if (!newContent) {
    throw new Error('Failed to get new content of the main file')
  }

  await fs.writeFile(file, newContent)
}

export async function installDependencies() {
  const cwd = process.cwd()

  let packageManager = 'npm'
  // use lock file to check package manager
  const lockFileMap = {
    'package-lock.json': 'npm',
    'yarn.lock': 'yarn',
    'pnpm-lock.yaml': 'pnpm',
  }

  const lockFile = Object.keys(lockFileMap).find(file => fs.existsSync(path.join(cwd, file)))

  if (lockFile) {
    packageManager = lockFileMap[lockFile as keyof typeof lockFileMap]
  }

  const installCommand = packageManager === 'npm' ? 'npm install' : packageManager === 'yarn' ? 'yarn add' : 'pnpm add'

  const command = `${installCommand} --save-dev @intlify/unplugin-vue-i18n vue-i18n`
  await execa(command, {
    shell: true,
    cwd: process.cwd(),
  })
}
