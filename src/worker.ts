import type { Context } from './type'
import path from 'node:path'
import process from 'node:process'
import chalk from 'chalk'
import fs from 'fs-extra'
import { genCodeByReplacer } from './ai'
import { Worker } from './type'
import { log } from './utils'

export class WorkerForViteVue extends Worker {
  constructor(ctx: Context) {
    super(ctx)
  }

  get dependencies() {
    return ['@intlify/unplugin-vue-i18n', 'vue-i18n']
  }

  async handleBuilderConfig(): Promise<void> {
    const builderConfigPath = path.join(process.cwd(), 'vite.config.ts')
    const documentationPath = path.join(__dirname, './prompts/builder/vite-vue.md')

    const builderConfig = fs.readFileSync(builderConfigPath, 'utf-8')
    const documentation = fs.readFileSync(documentationPath, 'utf-8')

    const newCode = await genCodeByReplacer(builderConfig, documentation)
    if (!newCode) {
      log(chalk.green('Builder config had already been handled, don\'t need to handle it again'))
      return
    }

    fs.writeFileSync(builderConfigPath, newCode)
  }

  async handleMainConfig(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async handlePrimaryFile(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
