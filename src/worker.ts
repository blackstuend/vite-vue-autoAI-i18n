import type { Context } from './type'
import path from 'node:path'
import process from 'node:process'
import chalk from 'chalk'
import { genCodeByReplacer } from './ai'
import { prompt as builderDocsPrompt } from './prompt/builder/vite-vue'
import { prompt as primaryFileDocsPrompt } from './prompt/file/vite-vue'
import { prompt as mainDocsPrompt } from './prompt/main/vite-vue'
import { Worker } from './type'
import { FileService, log } from './utils'

export class WorkerForViteVue extends Worker {
  constructor(ctx: Context) {
    super(ctx)
  }

  get dependencies() {
    return ['@intlify/unplugin-vue-i18n', 'vue-i18n']
  }

  async handleBuilderConfig(): Promise<void> {
    const builderConfigPath = path.join(process.cwd(), this.ctx.builderConfigFile)

    const fileService = new FileService(builderConfigPath)
    const builderConfig = await fileService.getFileContent()

    const newCode = await genCodeByReplacer(builderConfig, builderDocsPrompt)
    if (!newCode || newCode === builderConfig) {
      log(chalk.yellow('Builder config had already been handled, don\'t need to handle it again'))
      return
    }

    await fileService.writeFile(newCode)
  }

  async handleMainConfig(): Promise<void> {
    const mainConfigPath = path.join(process.cwd(), this.ctx.mainFile)

    const fileService = new FileService(mainConfigPath)

    const mainConfig = await fileService.getFileContent()

    const newCode = await genCodeByReplacer(mainConfig, mainDocsPrompt(this.ctx.defaultLocale.code))
    if (!newCode || newCode === mainConfig) {
      log(chalk.yellow('Main config had already been handled, don\'t need to handle it again'))
      return
    }

    await fileService.writeFile(newCode)
  }

  async handlePrimaryFile(filePath: string): Promise<void> {
    const fileService = new FileService(filePath)

    const code = await fileService.getFileContent()
    // inject the i18n tag to the end of the file
    const codeWithTag = `${code}\n` + `<i18n></i18n>\n`

    const newCode = await genCodeByReplacer(codeWithTag, primaryFileDocsPrompt(this.ctx.locales))

    if (!newCode || newCode === code) {
      log(chalk.yellow(`${fileService.filePath} had already been translated or no word need to be translated, don't need to handle it again`))
      return
    }

    // sometimes ai forget to replace the <i18n></i18n> tag, so we need to remove it
    const fixedCode = newCode.replace(/<i18n><\/i18n>/g, '')

    await fileService.writeFile(fixedCode)
  }
}
