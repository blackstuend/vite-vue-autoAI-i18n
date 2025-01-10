import type { Context, File } from './type'
import path from 'node:path'
import process from 'node:process'
import chalk from 'chalk'
import fs from 'fs-extra'
import { genCodeByReplacer } from './ai'
import { prompt as builderDocsPrompt } from './prompt/builder/vite-vue'
import { prompt as primaryFileDocsPrompt } from './prompt/file/vite-vue'
import { prompt as mainDocsPrompt } from './prompt/main/vite-vue'
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
    const builderConfigPath = path.join(process.cwd(), this.ctx.builderConfigFile)

    const builderConfig = fs.readFileSync(builderConfigPath, 'utf-8')

    const newCode = await genCodeByReplacer(builderConfig, builderDocsPrompt)
    if (!newCode || newCode === builderConfig) {
      log(chalk.yellow('Builder config had already been handled, don\'t need to handle it again'))
      return
    }

    fs.writeFileSync(builderConfigPath, newCode)
  }

  async handleMainConfig(): Promise<void> {
    const mainConfigPath = path.join(process.cwd(), this.ctx.mainFile)

    const mainConfig = fs.readFileSync(mainConfigPath, 'utf-8')

    const newCode = await genCodeByReplacer(mainConfig, mainDocsPrompt(this.ctx.defaultLocale.code))
    if (!newCode || newCode === mainConfig) {
      log(chalk.yellow('Main config had already been handled, don\'t need to handle it again'))
      return
    }

    fs.writeFileSync(mainConfigPath, newCode)
  }

  async handlePrimaryFile(file: File): Promise<void> {
    // inject the i18n tag to the end of the file
    const code = `${file.content}\n` + `<i18n></i18n>\n`

    const newCode = await genCodeByReplacer(code, primaryFileDocsPrompt(this.ctx.locales))
    if (!newCode || newCode === file.content) {
      log(chalk.yellow(`${file.path} had already been translated or no word need to be translated, don't need to handle it again`))
      return
    }

    fs.writeFileSync(file.path, newCode)
  }
}
