import { getProjectContext, modifyConfigFile, updateVueFile} from './core'

async function main() {
  // const allFiles = [
  //   './src/components/index.js',
  //   './src/pages/index.js',
  //   './src/layouts/index.js',
  //   './src/nuxt.config.js'
  // ]

  // const projectInformation = await getProjectInformation(allFiles)

  // if(projectInformation.builder !== 'vite') {
  //   throw new Error('Your project is not using vite.')
  // }

  const projectInformation = {
    // builder: 'vite',
    // framework: 'vue',
    // configFile: './demo/vite.config.ts',
    // mainFile: './demo/src/main.js',
    allFiles: ['./demo/hello.vue']
  }

  // await modifyConfigFile(projectInformation.builder,projectInformation.configFile)

  await updateVueFile(projectInformation.allFiles, ['en', 'ja'])
}

main()