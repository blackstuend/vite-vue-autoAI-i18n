import process from 'node:process'
import chalk from 'chalk'
import fs from 'fs-extra'

export const log = console.log

export function exit() {
  process.exit(1)
}

export class FileService {
  filePath: string
  originFormat: 'crlf' | 'lf'
  constructor(filePath: string) {
    this.filePath = filePath

    if (!fs.existsSync(filePath)) {
      log(chalk.red(`File not found, please check if the file exists: ${filePath}`))
      exit()
    }
  }

  async getFileContent() {
    let content = fs.readFileSync(this.filePath, 'utf-8')

    if (content.includes('\r\n')) {
      this.originFormat = 'crlf'
    }
    else {
      this.originFormat = 'lf'
    }

    if (this.originFormat === 'crlf') {
      content = content.replace(/\r\n/g, '\n')
    }

    return content
  }

  async writeFile(content: string) {
    if (this.originFormat === 'crlf') {
      content = content.replace(/\n/g, '\r\n')
    }

    fs.writeFileSync(this.filePath, content)
  }
}
