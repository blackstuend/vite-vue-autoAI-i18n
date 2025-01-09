import process from 'node:process'
import glob from 'fast-glob'

export function getAllFiles() {
  const cwd = process.cwd()
  const allFiles = glob.sync('**/*.{js,ts,vue}', { cwd, absolute: false, ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/test/**', '**/public/**'] })
  return allFiles
}
