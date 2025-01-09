import type { Cache } from './cache'
import type { Context, Worker } from './type'
import process from 'node:process'
import chalk from 'chalk'
import { execa } from 'execa'
import glob from 'fast-glob'
import fs from 'fs-extra'
import { exit, log } from './utils'

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

    return 'npm'
  }

  async installDependencies() {
    const dependencies = this.worker?.dependencies

    if (!dependencies) {
      log(chalk.red('No dependencies found'))
      exit()

      return
    }

    log(chalk.green('Installing dependencies...'))
    log(chalk.green(`${dependencies.join(' ')}`))

    const packageManager = await this._getPackageManager()
    const installCommand = `${packageManager} install ${dependencies.join(' ')}`
    await execa(installCommand, {
      shell: true,
      cwd: process.cwd(),
    })

    if (this.cache) {
      await this.cache.updateCacheFinish({
        install: true,
      })
    }

    log(chalk.green('Dependencies installed successfully.'))
  }

  async handleBuilderConfig() {
    log(chalk.green('Generating code in builder config file...'))

    await this.worker?.handleBuilderConfig()

    if (this.cache) {
      await this.cache.updateCacheFinish({
        builder: true,
      })
    }

    log(chalk.green(`Builder config file path: ${this.ctx.builderConfigFile}`))
    log(chalk.green('Code in builder config file generated successfully.'))
  }

  async handleMainConfig() {
    log(chalk.green('Generating code in main file...'))

    await this.worker?.handleMainConfig()

    if (this.cache) {
      await this.cache.updateCacheFinish({
        main: true,
      })
    }

    log(chalk.green('Code in main file generated successfully.'))
  }

  async handlePrimaryFile() {
    const primaryFiles = await glob(this.ctx.glob, {
      cwd: process.cwd(),
    })

    for (const file of primaryFiles) {
      log(chalk.green(`Handling ${file}...`))
      if (this.cache) {
        if (this.cache.finish.files.includes(file)) {
          log('File already handled.')
          continue
        }
      }

      const content = await fs.readFile(file, 'utf-8')

      await this.worker?.handlePrimaryFile(content)

      if (this.cache) {
        await this.cache.updateCacheFinish({
          files: [...this.cache.finish.files, file],
        })
      }

      log(chalk.green(`${file} handled successfully.`))
    }
  }
}
