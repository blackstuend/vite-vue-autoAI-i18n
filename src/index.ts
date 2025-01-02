import inquirer from 'inquirer'
import { LOCALES } from './constants'
import { getProjectContext, installDependencies, modifyConfigFile, modifyMainFile, modifyVueFiles } from './core'

async function main() {
  // ask user what locales they want to add
  const { locales } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'locales',
      message: 'Select the locales you want to add:',
      choices: LOCALES,
    },
  ])

  // ask what is your default language
  const { defaultLocale } = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultLocale',
      message: 'What is your default locale?',
      choices: LOCALES.map(locale => locale.value),
    },
  ])

  console.log('Please wait, getting project information...')
  const context = await getProjectContext({
    locales,
    defaultLocale,
  })

  console.log(`
Project Information:
Config File: ${context.configFile}
Builder: ${context.builder}
Locales: ${context.locales}
Default Locale: ${context.defaultLocale}
    `)

  // make sure the locales is correct by asking user
  const { isCorrect } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'isCorrect',
      message: 'Make sure the locales is correct and project information is correct, if not, please enter n to cancel.',
    },
  ])

  if (!isCorrect) {
    console.log('Cancelled.')
    return
  }

  if (context.builder !== 'vite') {
    throw new Error('Currently only support vite project.')
  }

  console.log('Please wait, installing dependencies...')
  await installDependencies()
  console.log('Install dependencies success')
  console.log('--------------------------------')

  console.log('Please wait, modifying config file...')
  await modifyConfigFile(context.builder, context.configFile)
  console.log('Modify config file success,file path: ', context.configFile)
  console.log('--------------------------------')

  if (context.mainFile) {
    console.log('Please wait, modifying the main file...')
    await modifyMainFile(context.mainFile, context.defaultLocale)
    console.log('Modify main file success')
    console.log('--------------------------------')
  }

  console.log('Please wait, modifying the vue files...')
  await modifyVueFiles(context.allFiles, context.locales)
  console.log('--------------------------------')

  console.log('Finished!')
}

main()
