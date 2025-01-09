import type { Context } from './type'
import chalk from 'chalk'
import fs from 'fs-extra'
import { log } from './utils'

export interface CacheFinish {
  install: boolean
  builder: boolean
  main: boolean
  files: string[]
}

export class Cache {
  ctx: Context
  finish: CacheFinish = {
    install: false,
    builder: false,
    main: false,
    files: [],
  }

  constructor(ctx: Context) {
    this.ctx = ctx
  }

  async init() {
    log(chalk.green('Wait for loading cache...'))

    const cacheFile = this.ctx.cacheFile
    if (!fs.existsSync(cacheFile)) {
      log(chalk.red('Not found cache file, auto create it file :)'))

      await this.save()

      log(chalk.green('Cache file created successfully'))
      log(chalk.green('Before finish all task, don\'t delete this file'))
      log(chalk.green('Cache file path:'), chalk.green(cacheFile))
      return
    }

    const cacheRawContent = fs.readFileSync(cacheFile, 'utf-8')

    try {
      const cacheContent = JSON.parse(cacheRawContent)
      this.finish = cacheContent.finish
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (error: unknown) {
      log(chalk.red('Cache file is invalid, auto create it'))

      await this.save()

      log(chalk.green('Cache file created successfully'))
      log(chalk.green('Cache file path:'), chalk.green(cacheFile))
    }
  }

  async save() {
    const cacheFile = this.ctx.cacheFile
    if (!cacheFile) {
      throw new Error('Cache file is required')
    }

    await fs.writeFile(cacheFile, JSON.stringify(this.cacheData, null, 2))
  }

  async destoryCache() {
    const cacheFile = this.ctx.cacheFile
    if (!cacheFile) {
      throw new Error('Cache file is required')
    }

    await fs.remove(cacheFile)
  }

  async updateCacheFinish(finish: Partial<CacheFinish>) {
    this.finish = {
      ...this.finish,
      ...finish,
    }

    await this.save()
  }

  get cacheData() {
    return {
      context: this.ctx,
      finish: this.finish,
    }
  }
}
