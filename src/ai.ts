import OpenAI from 'openai'
import process from 'process'
import dotenv from 'dotenv'
import { extractAiResponseJSON, extractAiResponseCode } from './common'
import { json } from 'stream/consumers'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});


async function askAI(rolesMessages: any) {
  const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: rolesMessages,
  });

  return response.choices[0].message.content;
}

export interface ProjectInformation {
  builder: string;
  framework: string
  configFile: string
  mainFile: string
}

export const getProjectInformation = async (allFiles: string[]): Promise<ProjectInformation> => {
  const response = await askAI([
    { role: "system", content: `
        ## Role  
        You are a expert of the frontend project framework, you can help me to check this proejct use which framework to build, and get me this project's config file.

        ## Objective
        - Check the project use which framework to build
        - Get the project's config file
        - Get the project's main file
        - Return JSON data contains the framework, config file and main file

        ## Work Flow
        - User will give the all files of the project, and you will check the project use which framework to build, and get me this project's config file.
        - You will return the JSON data contains the framework, config file and main file.

        ## Constraints
        - The Output just give me the JSON data, don't give me another words like, make me can directly use the JSON data.


       ## Output JSON Format:
        {
          "framework": "vue",
          "builder": "nuxt",
          "configFile": "./src/nuxt.config.ts",
          "mainFile": "./src/index.ts"
        }

        ## Example
          Example 1:
          user: [./src/index.ts, ./src/components/index.ts, ./src/pages/index.ts, ./src/layouts/index.ts, ./src/app.vue, ./src/nuxt.config.ts]
          : {
            framework: "vue",
            builder: "nuxt",
            configFile: "./src/nuxt.config.ts",
            mainFile: "./src/index.ts"
          }

          Example 2:
          user: [./src/main.ts, ./src/components/index.ts, ./src/pages/index.ts, ./src/layouts/index.ts, ./src/app.vue, ./src/vite.config.ts]
          you: {
            framework: "vue",
            builder: "vite",
            configFile: "./src/vite.config.ts",
            mainFile: "./src/main.ts"
          }

          Example 3:
          user: [./src/main.ts, ./src/components/index.ts, ./src/pages/index.ts, ./src/layouts/index.ts, ./src/app.vue, ./src/vue.config.ts]
          you: {
            framework: "vue",
            builder: "vue-cli",
            configFile: "./src/vue.config.ts",
            mainFile: "./src/main.ts"
          }
      ` },
    { role: "user", content: `[${allFiles.join(', ')}]` },
  ])

  if(!response) {
    throw new Error('Failed to get project information by openai')
  }

  return extractAiResponseJSON(response) as ProjectInformation
}

export const getNewConfigFileContentWithI18nPlugin = async (builder: string,content: string) => {
  const response = await askAI([
    { role: "system", content: `
        ## Role  
        You are a expert of senior frontend developer, you can help user to update the conig file of the project, follow the below documenation, and add the i18n plugin to the project.
          
        ## Objective
        - Update the config file of the project, and add the i18n plugin to the project.
        - Return only the new content of the config file as plain text.

        ## Constraints
        -  Provide the new content of the config file without any additional words or formatting symbols like \`{{ code }}\` or \` \`\`\` \`.

       ## Output file Format:
        import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

        export default defineConfig({
          plugins: [
            VueI18nPlugin({
              /* options */
            })
          ]
        })

        ## Document

        ### Installation
        ---
        // vite.config.ts
        import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

        export default defineConfig({
          plugins: [
            VueI18nPlugin({
              /* options */
            })
          ]
        })
        ---
        // Webpack
        ---
        const VueI18nPlugin = require('@intlify/unplugin-vue-i18n/webpack')

        module.exports = {
          /* ... */
          plugins: [
            VueI18nPlugin({
              /* options */
            })
          ]
        }
        ---
        // Nuxt
        ---
        // nuxt.config.ts
        import { defineNuxtConfig } from 'nuxt'
        import VueI18nPlugin from '@intlify/unplugin-vue-i18n'

        export default defineNuxtConfig({
          vite: {
            plugins: [
              VueI18nPlugin.vite({
                /* options */
              })
            ]
          },
          // When using Webpack
          // builder: '@nuxt/webpack-builder',
          webpack: {
            plugins: [
              VueI18nPlugin.webpack({
                /* options */
              })
            ]
          }
        })
        ---        
        ` },
    { role: "user", content: `[builder: ${builder}, config file content: ${content}]` },
  ])

  return response;
}

export const getNewMainFileContent = async (content: string) => {
  const response = await askAI([
    { role: "system", content: `[main file content: ${content}]` },
  ])

  return response;
}