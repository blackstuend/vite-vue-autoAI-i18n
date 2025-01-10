import type { Context } from './type'
import process from 'node:process'
import chalk from 'chalk'
import { Cache } from './cache'
import { Manager } from './manager'
import { log } from './utils'

process.removeAllListeners('warning')

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
    log(chalk.green('Cache loaded successfully'))
    log('--------------------------------')
  }

  const manager = new Manager(ctx, cache)

  if (ctx.needInstallDependencies && !cache?.finish.install) {
    await manager.installDependencies()
    log('--------------------------------')
  }

  if (ctx.needGenCodeInBuilderConfig && !cache?.finish.builder) {
    await manager.handleBuilderConfig()
    log('--------------------------------')
  }

  if (ctx.needGenCodeInMain && !cache?.finish.main) {
    await manager.handleMainConfig()
    log('--------------------------------')
  }

  await manager.handlePrimaryFile()

  if (cache) {
    await cache.destoryCache()
  }

  log('--------------------------------')
  log(chalk.green('✨ Finished all tasks, thanks for your using! 🎉'))
}
