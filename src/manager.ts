import type { Cache } from './cache'
import type { Context, Worker } from './type'
import process from 'node:process'
import chalk from 'chalk'
import { execa } from 'execa'
import glob from 'fast-glob'
import { exit, FileService, log } from './utils'

import { WorkerForViteVue } from './worker'

export class Manager {
  ctx: Context
  cache?: Cache
  worker: Worker | undefined

  constructor(ctx: Context, cache?: Cache) {
    this.ctx = ctx
    this.cache = cache

    this.worker = this.getWorker()
    if (!this.worker) {
      log(chalk.red('No worker found, your framework or builder is not supported'))
      exit()
    }
  }

  getWorker(): Worker | undefined {
    if (this.ctx.builder === 'vite' && this.ctx.framework === 'vue') {
      return new WorkerForViteVue(this.ctx)
    }

    return undefined
  }

  async _getPackageManager(): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
    const files = await glob('**/*.{json,yaml,yml}', {
      cwd: process.cwd(),
    })

    // search for lock file
    for (const file of files) {
      if (file.includes('package-lock.json')) {
        return 'npm'
      }
      if (file.includes('yarn.lock')) {
        return 'yarn'
      }
      if (file.includes('pnpm-lock.yaml')) {
        return 'pnpm'
      }

      if (file.includes('bun.lockb')) {
        return 'bun'
      }
    }

    log(chalk.yellow('No package manager found, use npm as default'))

    return 'npm'
  }

  async installDependencies() {
    const dependencies = this.worker?.dependencies

    if (!dependencies) {
      log(chalk.red('No dependencies found'))
      exit()

      return
    }

    log('Installing dependencies...', dependencies.join(' '))

    const packageManager = await this._getPackageManager()
    const installCommand = `${packageManager} install ${dependencies.join(' ')}`
    try {
      await execa(installCommand, {
        shell: true,
        cwd: process.cwd(),
      })
    }
    catch (error) {
      log(chalk.red('Install failed, error:'), error)
      exit()
    }

    if (this.cache) {
      await this.cache.updateCacheFinish({
        install: true,
      })
    }

    log(chalk.green('Dependencies installed successfully.'))
  }

  async handleBuilderConfig() {
    log('Start to handle builder config file:', this.ctx.builderConfigFile, '...')

    await this.worker?.handleBuilderConfig()

    if (this.cache) {
      await this.cache.updateCacheFinish({
        builder: true,
      })
    }

    log(chalk.green('Code in builder config file generated successfully.'))
  }

  async handleMainConfig() {
    log('Start generating code in main file...')

    await this.worker?.handleMainConfig()

    if (this.cache) {
      await this.cache.updateCacheFinish({
        main: true,
      })
    }

    log(chalk.green('Code in main file generated successfully.'))
  }

  async handlePrimaryFile() {
    log('Start to handle primary files...')

    const primaryFiles = await glob(this.ctx.glob, {
      cwd: process.cwd(),
    })

    if (primaryFiles.length === 0) {
      log(chalk.red('Search primary files by glob failed, please check your glob pattern'))

      exit()
    }

    for (const file of primaryFiles) {
      log(`Handling ${file} `)
      if (this.cache) {
        if (this.cache.finish.files.includes(file)) {
          log('File already handled, skip it')
          continue
        }
      }

      await this.worker?.handlePrimaryFile(file)

      if (this.cache) {
        await this.cache.updateCacheFinish({
          files: [...this.cache.finish.files, file],
        })
      }

      log(chalk.green(`${file} handled successfully.`))
    }
  }
}
