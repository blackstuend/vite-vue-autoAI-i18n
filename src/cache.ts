import type { ProjectContext } from './types'
import path from 'node:path'
import process from 'node:process'
import fs from 'fs-extra'

export const CACHE_FILE_PATH = path.join(process.cwd(), '.vue-vite-ai-i18n.json')

export interface CacheData {
  context: ProjectContext
  // check the flow whether the process has finished
  flow: {
    install: boolean
    modifyConfig: boolean
    modifyMain: boolean
    modifyVue: boolean
  }
  finishFiles: string[]
}

export function saveCache(cache: CacheData) {
  fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2))
}

export function checkCacheExist() {
  return fs.existsSync(CACHE_FILE_PATH)
}

export function getCache(): CacheData | null {
  return JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8')) as CacheData
}

export function removeCache() {
  fs.removeSync(CACHE_FILE_PATH)
}
