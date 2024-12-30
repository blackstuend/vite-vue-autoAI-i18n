import { ProjectContext } from "./types";
import glob from 'fast-glob'
import process from 'node:process'
import { getProjectInformation, getNewConfigFileContentWithI18nPlugin, getNewVueFileContent } from './ai'
import fs from 'fs-extra';

export async function getProjectContext(): Promise<ProjectContext> {
  const cwd = process.cwd();

  // get all files include the cwd
  const allFiles = glob.sync('**/*', { cwd, absolute: true });

  const projectInfo = await getProjectInformation(allFiles)

  return {
    allFiles,
    mainFile: projectInfo.mainFile,
    configFile: projectInfo.configFile,
    builder: projectInfo.builder,
    locales: ['zh-CN', 'en-US'],
  }
}

export async function modifyConfigFile(builder: string,file: string) {
  const content = await fs.readFile(file, 'utf-8')

  const newContent = await getNewConfigFileContentWithI18nPlugin(builder,content)

  if(!newContent) {
    throw new Error('Failed to get new content of the config file')
  }

  fs.writeFileSync(file, newContent)

  console.log('Modify config file success,file path: ', file)
}

export async function updateVueFile(files: string[], locales: string[]) {
  for(const file of files) {
    const content = await fs.readFile(file, 'utf-8')

    if(!content) {
      continue;
    }

    const newContent = await getNewVueFileContent(locales, content)

    if(!newContent) {
      continue;
    }

    fs.writeFileSync(file, newContent)

    console.log('Modify vue file success,file path: ', file)
  }
} 