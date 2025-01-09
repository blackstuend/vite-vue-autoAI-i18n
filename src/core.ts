/* eslint-disable unused-imports/no-unused-vars */
import type { Cache, Context } from './type'
import path from 'node:path'
import chalk from 'chalk'
import fs from 'fs-extra'
import { log } from './utils'

function _handleCache(ctx: Context): Cache {
  // check cache file exist
  const cacheFile = ctx.cacheFile
  if (!cacheFile) {
    throw new Error('Cache file is required')
  }

  const defaultCache: Cache = {
    context: ctx,
    finish: {
      builder: false,
      main: false,
      files: [],
    },
  }

  if (!fs.existsSync(cacheFile)) {
    log(chalk.red(`Cache file ${cacheFile} not found, auto create it`))

    fs.writeFileSync(cacheFile, JSON.stringify(defaultCache, null, 2))

    return defaultCache
  }

  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) as Cache
    return cache
  }
  catch (error: any) {
    log(chalk.red(`Cache file ${cacheFile} is invalid, auto create it`))
    fs.writeFileSync(cacheFile, JSON.stringify(defaultCache, null, 2))
    return defaultCache
  }
}

export async function projectGenI18n(context: Context) {
  const defaultContext: Partial<Context> = {
    cacheFile: '.i18n-cache.json',
    needGenCodeInBuilderConfig: true,
    needGenCodeInMain: true,
    useCache: true,
  }

  const ctx = {
    ...defaultContext,
    ...context,
  }

  let cache: Cache | undefined

  if (ctx.useCache) {
    log(chalk.green('Wait for loading cache...'))
    cache = _handleCache(ctx)
    log(chalk.green('Cache loaded'))
  }

  await genI18nInBuilder(ctx, cache)
}

async function genI18nInBuilder(ctx: Context, cache?: Cache) {
  if (!ctx.needGenCodeInBuilderConfig) {
    return
  }

  if (cache?.finish.builder) {
    log(chalk.green('i18n in builder config has been generated, skip...'))

    return
  }

  // get builder config documet
  const configDocument = path.resolve('prompt', 'builder', `${ctx.builder}-${ctx.framework}.md`)

  if (!fs.existsSync(configDocument)) {
    log(chalk.red(`Builder config document ${configDocument} not found`))
  }

  const documenation = fs.readFileSync(configDocument, 'utf-8')

  if (cache) {
    cache.finish.builder = true
  }
}
