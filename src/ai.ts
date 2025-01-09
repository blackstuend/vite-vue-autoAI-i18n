import process from 'node:process'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import OpenAI from 'openai'
import { getSearchReplaceBlocks, modifyCode } from './common'

dotenv.config()

function defaultSystemPrompt() {
  const file = fs.readFileSync('defaultPrompt', 'utf-8')
  return file
}

async function askAI(rolesMessages: any) {
  try {
    const openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-2024-08-06',
      messages: rolesMessages,
    })

    return response.choices[0].message.content
  }
  catch (error) {
    throw new Error(`Failed to ask ai, error: ${error}`)
  }
}

export interface ProjectInformation {
  builder: string
  framework: string
  configFile: string
  mainFile: string
}

export async function getProjectInformation(allFiles: string[]): Promise<ProjectInformation> {
  const response = await askAI([
    { role: 'system', content: `
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
        - Provide the new content of the json without any additional words or formatting symbols like \`{{ code }}\` or \` \`\`\` \`.


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
    { role: 'user', content: `[${allFiles.join(', ')}]` },
  ])

  if (!response) {
    throw new Error('Failed to get project information by openai')
  }

  return extractAiResponseJSON(response) as ProjectInformation
}

export async function getNewConfigFileContentWithI18nPlugin(builder: string, content: string) {
  const response = await askAI([
    { role: 'system', content: `        
        ${defaultSystemPrompt()}
        ` },
    { role: 'user', content: `
      Follow this documentation, set the i18n plugin to the vite config plugins
      
      ## Documentation
      \`\`\
      import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

      export default defineConfig({
        plugins: [
          VueI18nPlugin({
            /* options */
          })
        ]
      })
      \`\`\`
      

      Code: 
      \`\`\`
      ${content}
      \`\`\`
      ` },
  ])

  if (!response) {
    throw new Error('Failed to get new config file content with i18n plugin')
  }

  if (!response) {
    return content
  }

  const matches = getSearchReplaceBlocks(response)

  console.log('newResponse', matches)

  if (!matches) {
    return content
  }

  return modifyCode(content, matches)
}

export async function getNewMainFileContent(defaultLocale: string, content: string) {
  const response = await askAI([
    { role: 'system', content: `
        ## Role  
        You are a expert of senior frontend developer, you can help user to update the main file of the project, follow the below documenation, and add the i18n instance to the main file.

        ## Objective
        - Add the i18n instance to the main file.
        - Return the new content of the main file

        ## Constraints
        - Don't remove the existing code(like comments or eslint rules), just add the i18n instance to the main file
        - Provide the new content of the main file without any additional words or formatting symbols like \`{{ code }}\` or \` \`\`\` \`.

        ### Installation
        #### add the i18n import to the config file
        import { createI18n } from 'vue-i18n';

        ### create the i18n instance 
        const i18n = createI18n({
          fallbackLocale: '${defaultLocale}',
          locale: '${defaultLocale}',
        });

        ### add the i18n instance to the vue app
        app.use(i18n);
      ` },
    { role: 'user', content: `[main file content: ${content}]` },
  ])

  return response
}

export async function getNewVueFileContent(locales: string[], content: string): Promise<string | null> {
  const response = await askAI([
    { role: 'system', content: `
        ## Role
        You are a expert of senior frontend developer, you can help user to update the vue file of the project, follow the below documenation, help user to translate the vue file.

        ## Objective
        - Update the vue file of the project, and add the i18n translation to the vue file.
        - Detect the file write by composition api or not, follow the example to rewrite the file.
        - If this file need to be translated, return the new content of the vue file
        - If this file have no word need to be translated, return null

        ## Constraints
        - If the file without any word no need to be translated, directly return null
        - Don't remove the existing code(like comments or eslint rules), just add the i18n translation to the vue file
        - Just translate the text in the template
        - i18n's key should be camelCase
        - Provide the new content of the vue file without any additional words or formatting symbols like \`{{ code }}\` or \` \`\`\` \`.

        ## Work Flow
        - check the file write by composition api or not
          - If not use composition api, use the example 1 to rewrite the file
          - If use composition api, use the example 2 to rewrite the file
          - If the file is not easy to recognize, use the example 2 to rewrite the file
        - Browser the file wheather the file need to add the i18n translation, if not need, return null
        - According to the locales, add the translation setting to the vue file

        ## Example
        Example 1(not use composition api):
        * user Input:
        locales: [en, ja]
        vue file content:
        <template>
          <p>hello</p>
        </template>

        <script>
        export default {
          name: 'App',
          setup() {
          }
        }
        </script>
      Output:
      <template>
        <p>{{ t('hello') }}</p>
      </template>

      <script>
      import { useI18n } from 'vue-i18n'

      export default {
        name: 'App',
        setup() {
          const { locale, t } = useI18n({
            inheritLocale: true
          })

          return { locale, t }
        }
      }
      <i18n>
      {
        "en": {
          "hello": "hello!"
        },
        "ja": {
          "hello": "こんにちは！"
        }
      }
      </i18n>
      </script>

      Example 2(use composition api):
      * user Input:
      locales: [en, ja]
      vue file content:
      <template>
        <p>hello</p>
      </template>
      <script setup>
      </script>

      Output:
      <template>
        <p>{{ t('hello') }}</p>
      </template>
      <script setup>
        import { useI18n } from 'vue-i18n'

        const { t } = useI18n()
        </script>
        <i18n>
        {
          "en": {
            "hello": "hello!"
          },
          "ja": {
            "hello": "こんにちは！"
          }
        }
        </i18n>

        Example 3(not word need to be translated):
        * user Input:
        locales: [en, ja]
        vue file content:
        <template>
          <div>
            <p></p>
          </div>
        </template>
      Output:
      null

      Example 4(translate with variable):
        * user Input:
        locales: [en, ja]
        vue file content:
        <template>
          <div>
            <p>hello {{ msg }}</p>
          </div>
        </template>
        <script setup lang="ts">
        const msg = 'world'
        </script>

      Output:
      <template>
        <div>
          <p>{{ t('hello', { msg: 'hello' }) }}</p>
        </div>
      </template>
      <script setup>
        import { useI18n } from 'vue-i18n'

        const { t } = useI18n()
      </script>
      <i18n>
      {
        "en": {
          "hello": "{msg} world"
        },
        "ja": {
          "hello": "{msg} 世界"
        }
      }
      </i18n>
      ` },
    { role: 'user', content: `locales: ${locales.join(', ')}
                                vue file content: ${content}` },
  ])

  if (response === 'null') {
    return null
  }

  return response
}
