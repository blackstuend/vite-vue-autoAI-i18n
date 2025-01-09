import type { Context } from './type'
import chalk from 'chalk'
import { Cache } from './cache'
import { Manager } from './manager'
import { log } from './utils'

export async function projectAutoI18n(context: Context) {
  const defaultContext: Partial<Context> = {
    cacheFile: '.i18n-cache.json',
    needGenCodeInBuilderConfig: true,
    needGenCodeInMain: true,
    useCache: true,
    needInstallDependencies: true,
  }

  const ctx = {
    ...defaultContext,
    ...context,
  }

  let cache: Cache | undefined

  if (ctx.useCache) {
    cache = new Cache(ctx)
    await cache.init()
    log(chalk.green('Cache loaded'))
  }

  const manager = new Manager(ctx, cache)

  if (ctx.needGenCodeInBuilderConfig && !cache?.finish.builder) {
    await manager.handleBuilderConfig()
  }

  if (ctx.needGenCodeInMain && !cache?.finish.main) {
    await manager.handleMainConfig()
  }

  await manager.handlePrimaryFile()

  if (cache) {
    await cache.destoryCache()
  }

  log(chalk.green('i18n in project generated successfully.'))
}
